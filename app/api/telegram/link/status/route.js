// app/api/telegram/link/status/route.js
import { redis } from '@/lib/redis'
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'
import { isVipNowReadOnly } from '../../../../../lib/subscriptions.js'

function identityVariants(raw) {
  const value = String(raw || '').trim()
  if (!value) return []
  const out = new Set([value])
  const stripped = profilePrimary.stripPrefix(value)
  if (stripped) out.add(stripped)
  if (/^\d+$/.test(stripped)) {
    out.add(`telegram:${stripped}`)
    out.add(`tguid:${stripped}`)
    out.add(`tg:${stripped}`)
  }
  return Array.from(out).filter(Boolean)
}

async function findTelegramIdForAccount(accountId) {
  const profile = await profilePrimary.readProfile(accountId).catch(() => null)
  const direct = String(profile?.telegramId || '').trim()
  if (direct) return direct

  const aliases = await profilePrimary.listAliasesForAccount(accountId)
  for (const row of aliases) {
    const values = [row?.aliasValue, row?.alias, row?.aliasId]
    for (const value of values) {
      const stripped = profilePrimary.stripPrefix(value)
      if (/^\d+$/.test(stripped)) return stripped
    }
  }
  return ''
}

async function findLegacyRedisTelegramId(accountId) {
  const ids = identityVariants(accountId)
  for (const id of ids) {
    try {
      const value = await redis.hget(`acc:${id}`, 'tg_id')
      const tgId = String(value || '').trim()
      if (tgId) return tgId
    } catch {}
  }
  return ''
}

async function handleStatus(accountIdRaw) {
  const rawAccountId = String(accountIdRaw ?? '').trim()
  if (!rawAccountId) {
    return new Response(JSON.stringify({ ok: false, error: 'NO_ACCOUNT' }), { status: 400 })
  }
  const accountId = String(await profilePrimary.resolveCanonicalAccountId(rawAccountId).catch(() => rawAccountId) || rawAccountId).trim()

  let [tgId, vip] = await Promise.all([
    findTelegramIdForAccount(accountId).then((id) => id || (accountId !== rawAccountId ? findTelegramIdForAccount(rawAccountId) : '')),
    isVipNowReadOnly(accountId).catch(() => ({ active: false })),
  ])
  let vipActive = !!vip?.active

  if (!tgId) {
    tgId = await findLegacyRedisTelegramId(accountId)
      .then((id) => id || (accountId !== rawAccountId ? findLegacyRedisTelegramId(rawAccountId) : ''))
      .catch(() => '')
    if (tgId) {
      await Promise.allSettled([
        profilePrimary.updateProfile(accountId, { telegramId: String(tgId) }),
        profilePrimary.writeCanonicalAliases(accountId, [
          tgId,
          `telegram:${tgId}`,
          `tguid:${tgId}`,
          `tg:${tgId}`,
          rawAccountId,
        ]),
      ])
    }
  }

  if (!vipActive) {
    try {
      const count = await redis.exists(`vip:${accountId}`, `vip:vipplus:${accountId}`)
      vipActive = Number(count || 0) > 0
    } catch {}
  }

  const payload = {
    ok: true,
    linked: !!tgId,
    tgId: tgId || null,
    accountId,
    isVip: vipActive,
  }

  return new Response(
    JSON.stringify(payload),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    return await handleStatus(body?.accountId)
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    return await handleStatus(accountId)
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }
}
