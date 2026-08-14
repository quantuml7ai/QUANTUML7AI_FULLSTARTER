// lib/subscriptions.js
// Mongo-primary VIP/subscription entitlement helpers.
// Redis legacy VIP reads are intentionally disabled: VIP and identity links are Mongo primary.

import subscriptionsPrimary from './mongo/subscriptions-primary.cjs'
import profilePrimary from './mongo/profile-primary.cjs'
import { notifyQl7VipActivated } from './ql7-support/events.js'

function normalizeWallet(w) {
  let s = String(w || '').trim().toLowerCase()
  if (!s) return ''

  if (s.startsWith('vipplus:')) {
    const parts = s.split(':')
    s = parts[1] || ''
  }

  if (s.startsWith('wallet:')) s = s.slice('wallet:'.length)

  if (s.startsWith('telegram:id:')) s = s.slice('telegram:id:'.length)
  else if (s.startsWith('telegramid:')) s = s.slice('telegramid:'.length)
  else if (s.startsWith('telegram:')) s = s.slice('telegram:'.length)
  else if (s.startsWith('tguid:')) s = s.slice('tguid:'.length)
  else if (s.startsWith('tg:')) s = s.slice('tg:'.length)

  return s
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(normalizeWallet).filter(Boolean)))
}

async function resolveVipIds(wallet) {
  const id = normalizeWallet(wallet)
  if (!id) return []
  const ids = new Set([id])

  const canonical = await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  if (canonical) ids.add(canonical)

  const aliases = await profilePrimary.listAliasesForAccount(canonical || id).catch(() => [])
  for (const row of aliases) {
    for (const value of [row?.accountId, row?.canonicalAccountId, row?.alias, row?.aliasId, row?.aliasValue]) {
      const clean = normalizeWallet(profilePrimary.stripPrefix(value))
      if (clean) ids.add(clean)
    }
  }

  return unique(Array.from(ids))
}

async function getVipMongoOnly(wallet) {
  const ids = await resolveVipIds(wallet)
  for (const id of ids) {
    const untilISO = await subscriptionsPrimary.getVip(id)
    if (untilISO) return untilISO
  }
  return null
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

export async function setVip(wallet, untilISO, { paymentId } = {}) {
  const id = normalizeWallet(wallet)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }
  const canonical = await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  const accountId = canonical || id
  const result = await subscriptionsPrimary.setVip(accountId, untilISO, { paymentId })
  if (result?.ok && !result?.duplicated) {
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

export async function addVipDays(wallet, days, { paymentId } = {}) {
  const id = normalizeWallet(wallet)
  if (!id || !Number.isFinite(days) || days <= 0) {
    return { ok: false, error: 'BAD_ARGS' }
  }
  const currentISO = await getVipMongoOnly(id)
  const now = new Date()
  const base = currentISO ? new Date(currentISO) : now
  const start = base > now ? base : now
  const until = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  return setVip(id, until, { paymentId })
}

export async function _resetVipForTest(wallet, paymentId) {
  const id = normalizeWallet(wallet)
  if (!id) return { ok: false }
  const canonical = await profilePrimary.resolveCanonicalAccountId(id).catch(() => '')
  return subscriptionsPrimary.clearVip(canonical || id, paymentId)
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
