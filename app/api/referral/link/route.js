// app/api/referral/link/route.js
import {
  json,
  bad,
  requireUserId,
} from '../../forum/_utils.js'
import { resolveCanonicalAccountId, writeCanonicalAliases } from '../../profile/_identity.js'
import identityContract from '../../../../lib/identity/ql7IdentityContract.cjs'
import referralPrimary from '@/lib/mongo/referral-primary.cjs'

function readNumberEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env[name]
    if (raw == null || raw === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

const REF_REWARD_QCOIN = readNumberEnv(
  ['REFERRAL_REWARD_QCOIN', 'NEXT_PUBLIC_REFERRAL_REWARD_QCOIN'],
  0.1,
)

const REF_VIP_THRESHOLD = readNumberEnv(
  ['REFERRAL_VIP_THRESHOLD', 'NEXT_PUBLIC_REFERRAL_VIP_THRESHOLD'],
  50,
)

function normalizeRawUid(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  return s || null
}

function randomCode(len = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

function getSiteUrlFromEnv() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (!env) return ''
  return env.replace(/\/+$/, '')
}

function getSiteUrlForRequest(req) {
  const fromEnv = getSiteUrlFromEnv()
  if (fromEnv) return fromEnv
  try {
    const u = new URL(req.url)
    return u.origin
  } catch {
    return ''
  }
}

export async function POST(req) {
  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  let uidRaw
  try {
    uidRaw = requireUserId(req, body)
  } catch (err) {
    const status = err?.status || 401
    return bad(err?.message || 'missing_user_id', status)
  }

  const rawUid = normalizeRawUid(uidRaw)
  const identity = await identityContract.resolve(rawUid, {
    mode: 'referral-owner',
    source: 'app/api/referral/link/route.js',
  })
  const canonicalUid = String(identity.canonicalAccountId || (await resolveCanonicalAccountId(rawUid)) || '').trim()
  const uid = String(identity.exactEtalonUid || rawUid || canonicalUid || '').trim()
  if (!uid) {
    return bad('invalid_user_id', 400)
  }

  await writeCanonicalAliases(canonicalUid || uid, [
    rawUid,
    body?.userId,
    body?.accountId,
    body?.asherId,
    req?.headers?.get?.('x-forum-user-id') || '',
  ]).catch(() => 0)

  const siteUrl = getSiteUrlForRequest(req)
  const profile = await referralPrimary.getOrCreateProfile({
    uid,
    rewardQcoin: REF_REWARD_QCOIN,
    makeCode: (attempt) => randomCode(attempt < 5 ? 8 : 12),
  })

  const code = profile.code
  const invitedCount = Number(profile.invited_count || profile.unique_ips || 0)
  const vipGoalReached = (profile.vip_goal_reached || '0') === '1'
  const vipGranted = (profile.vip_granted || '0') === '1'
  const url = `${siteUrl}/api/referral/hit?code=${encodeURIComponent(code)}`

  return json({
    ok: true,
    uid,
    canonicalUid: canonicalUid || uid,
    code,
    url,
    rewardQcoin: REF_REWARD_QCOIN,
    currency: 'QCOIN',
    invitedCount,
    vipThreshold: REF_VIP_THRESHOLD,
    vipGoalReached,
    vipGranted,
  })
}
