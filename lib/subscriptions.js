// lib/subscriptions.js
// Mongo-primary VIP/subscription entitlement helpers.
// Redis legacy VIP reads are intentionally disabled: VIP and identity links are Mongo primary.

import subscriptionsPrimary from './mongo/subscriptions-primary.cjs'
import profilePrimary from './mongo/profile-primary.cjs'
import { notifyQl7VipActivated } from './ql7-support/integration/productEventBridge.js'
import canonicalUserId from './identity/canonical-user-id.cjs'

function normalizeWallet(w) {
  const raw = String(w || '').trim()
  if (!raw) return ''

  const value = /^vipplus:/i.test(raw)
    ? (raw.split(':')[1] || '')
    : raw

  return canonicalUserId.normalizePrincipalSyntax(value)
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean)))
}

const VIP_BATCH_IDENTITY_CONCURRENCY = 16

async function mapSettledBounded(list, worker, concurrency = VIP_BATCH_IDENTITY_CONCURRENCY) {
  const input = Array.isArray(list) ? list : []
  const results = new Array(input.length)
  let cursor = 0
  const width = Math.max(1, Math.min(Number(concurrency) || 1, input.length || 1))

  const run = async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= input.length) return
      try {
        results[index] = { status: 'fulfilled', value: await worker(input[index], index) }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: width }, () => run()))
  return results
}

async function resolveVipIdsInternal(wallet, { strict = false } = {}) {
  const raw = String(wallet || '').trim()
  const id = normalizeWallet(raw)
  if (!id) return []

  const ids = new Set([id])
  const walletId = canonicalUserId.normalizeWalletId(raw || id)
  const telegramId = canonicalUserId.normalizeTelegramId(raw || id)

  // Transitional READ compatibility for pre-compaction VIP rows.
  if (walletId) {
    ids.add(walletId.toLowerCase())
    ids.add(`wallet:${walletId.toLowerCase()}`)
  }
  if (telegramId) {
    ids.add(telegramId)
    ids.add(`telegram:${telegramId}`)
    ids.add(`telegramid:${telegramId}`)
    ids.add(`telegram:id:${telegramId}`)
    ids.add(`tguid:${telegramId}`)
    ids.add(`tg:${telegramId}`)
    ids.add(`tg:uid:${telegramId}`)
  }

  const canonical = strict
    ? await profilePrimary.resolveCanonicalAccountId(id)
    : await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  if (canonical) ids.add(canonical)

  const aliases = strict
    ? await profilePrimary.listAliasesForAccount(canonical || id)
    : await profilePrimary.listAliasesForAccount(canonical || id).catch(() => [])
  for (const row of aliases) {
    for (const value of [row?.accountId, row?.canonicalAccountId, row?.alias, row?.aliasId, row?.aliasValue]) {
      const clean = String(value || '').trim()
      if (clean) ids.add(clean)
    }
  }

  return unique(Array.from(ids))
}

async function resolveVipIds(wallet) {
  return resolveVipIdsInternal(wallet, { strict: false })
}

async function getVipMongoOnly(wallet) {
  const ids = await resolveVipIds(wallet)
  if (!ids.length) return null
  return subscriptionsPrimary.getVipForIdentityIds(ids)
}

function vipStateFromUntil(untilISO) {
  if (!untilISO) return { active: false, untilISO: null, daysLeft: 0 }

  const now = Date.now()
  const until = new Date(untilISO).getTime()
  const active = Number.isFinite(until) && until > now
  const daysLeft = active ? Math.ceil((until - now) / (1000 * 60 * 60 * 24)) : 0
  return { active, untilISO, daysLeft }
}

export async function getVip(wallet) {
  return getVipMongoOnly(wallet)
}

export async function isVipNow(wallet) {
  return vipStateFromUntil(await getVipMongoOnly(wallet))
}

export async function setVip(wallet, untilISO, { paymentId, economicRouteId = '', operationType = 'entitlement_activate', idempotencyKey = '', decisionReceipt = null, notify = true } = {}) {
  const id = normalizeWallet(wallet)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }
  const canonical = await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  const accountId = canonical || id
  const legacyAccountIds = await resolveVipIds(wallet)
  const result = await subscriptionsPrimary.setVip(accountId, untilISO, {
    paymentId,
    economicRouteId,
    operationType,
    idempotencyKey: idempotencyKey || paymentId,
    decisionReceipt,
    legacyAccountIds,
  })
  if (notify && result?.ok && !result?.duplicated) {
    await notifyQl7VipActivated({
      userId: accountId,
      userAliases: [id, wallet],
      until: result.until || untilISO,
      paymentId,
      activatedAt: new Date().toISOString(),
    }).catch((error) => {
      console.warn('[ql7-support:vip-activated]', error?.message || error)
    })
  }
  return result
}

export async function addVipDays(wallet, days, { paymentId, economicRouteId = '', operationType = 'entitlement_extend', idempotencyKey = '', decisionReceipt = null, notify = true } = {}) {
  const id = normalizeWallet(wallet)
  if (!id || !Number.isFinite(days) || days <= 0) {
    return { ok: false, error: 'BAD_ARGS' }
  }
  const currentISO = await getVipMongoOnly(id)
  const now = new Date()
  const base = currentISO ? new Date(currentISO) : now
  const start = base > now ? base : now
  const until = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  return setVip(id, until, { paymentId, economicRouteId, operationType, idempotencyKey: idempotencyKey || paymentId, decisionReceipt, notify })
}

export async function _resetVipForTest(wallet, paymentId) {
  const id = normalizeWallet(wallet)
  if (!id) return { ok: false }
  const canonical = await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  const legacyAccountIds = await resolveVipIds(wallet)
  return subscriptionsPrimary.clearVip(canonical || id, paymentId, legacyAccountIds)
}

export async function getVipReadOnly(wallet) {
  return getVipMongoOnly(wallet)
}

export async function isVipNowReadOnly(wallet) {
  return vipStateFromUntil(await getVipMongoOnly(wallet))
}

export async function getVipSideEffectFree(wallet) {
  return getVipMongoOnly(wallet)
}

export async function isVipNowSideEffectFree(wallet) {
  return vipStateFromUntil(await getVipMongoOnly(wallet))
}

export async function getVipStatesManySideEffectFree(wallets) {
  const list = unique(wallets).slice(0, 250)
  const checkedAt = Date.now()
  if (!list.length) return { checkedAt, map: {}, unavailableIds: [] }

  const resolved = await mapSettledBounded(
    list,
    async (id) => ({ key: id, ids: await resolveVipIdsInternal(id, { strict: true }) }),
  )

  const groups = []
  const unavailableIds = []
  for (let index = 0; index < resolved.length; index += 1) {
    const result = resolved[index]
    const id = list[index]
    if (result.status !== 'fulfilled' || !result.value?.ids?.length) {
      unavailableIds.push(id)
      continue
    }
    groups.push(result.value)
  }

  let untilMap = {}
  if (groups.length) {
    try {
      untilMap = await subscriptionsPrimary.getVipMany(groups)
    } catch {
      return { checkedAt, map: {}, unavailableIds: list.slice() }
    }
  }

  const map = {}
  for (const group of groups) {
    const untilISO = untilMap?.[group.key] || null
    const state = vipStateFromUntil(untilISO)
    map[group.key] = {
      available: true,
      active: !!state.active,
      untilISO: state.untilISO,
      untilMs: state.untilISO ? (Date.parse(state.untilISO) || 0) : 0,
      daysLeft: Number(state.daysLeft || 0),
      checkedAt,
    }
  }

  return { checkedAt, map, unavailableIds }
}
