// app/api/referral/hit/route.js
import crypto from 'node:crypto'
import {
  json,
  bad,
  getClientIp,
} from '../../forum/_utils.js'
import { addVipDays } from '@/lib/subscriptions.js'
import { resolveCanonicalAccountId, writeCanonicalAliases } from '../../profile/_identity.js'
import identityContract from '../../../../lib/identity/ql7IdentityContract.cjs'
import qcoinPrimary from '@/lib/mongo/qcoin-primary.cjs'
import referralPrimary from '@/lib/mongo/referral-primary.cjs'

export const dynamic = 'force-dynamic'

function sha256Text(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  return crypto.createHash('sha256').update(s).digest('hex')
}

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
  ['REFERRAL_VIP_THRESHOLD'],
  50,
)

const REF_VIP_DAYS = readNumberEnv(
  ['REFERRAL_VIP_DAYS'],
  30,
)

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (!env) return '/'
  return env.replace(/\/+$/, '')
}

async function applyReferralReward(uid, code, ip, identity = null) {
  const nowIso = new Date().toISOString()
  const hit = await referralPrimary.recordHit({ uid, code, ip })
  const before = hit.profile || {}
  const invitedCount = Number(hit.invitedCount || 0)
  let rewardApplied = false
  let vipGoalReached = (before.vip_goal_reached || '0') === '1'
  let vipGranted = (before.vip_granted || '0') === '1'

  if (hit.isNewIp) {
    try {
      const ipHash = sha256Text(ip)
      const rewardUid = String(identity?.qcoinUid || uid || '').trim()
      await qcoinPrimary.incrementBalance({
        uid: rewardUid,
        amount: REF_REWARD_QCOIN,
        eventKind: 'referral_reward',
        route: '/api/referral/hit',
        sourceEventId: `referral:${code}:${ipHash}`,
        idempotencyKey: `referral:${code}:${ipHash}`,
        meta: {
          code,
          invitedCount,
          rewardToQcoinUid: rewardUid,
          inviterRawUid: uid,
        },
      })
      rewardApplied = true
    } catch {
      rewardApplied = false
    }

    if (!vipGoalReached && invitedCount >= REF_VIP_THRESHOLD) {
      vipGoalReached = true
      await referralPrimary.updateFlags(uid, { vip_goal_reached: '1' })

      if (!vipGranted) {
        try {
          await addVipDays(uid, REF_VIP_DAYS, {
            paymentId: `referral:${code}:${nowIso}`,
          })
          vipGranted = true
          await referralPrimary.updateFlags(uid, { vip_goal_reached: '1', vip_granted: '1' })
        } catch (e) {
          await referralPrimary.enqueueVipPending({
            uid,
            code,
            invitedCount,
            error: String(e?.message || e),
          })
        }
      }
    }
  }

  const finalProfile = await referralPrimary.readProfile(uid)
  return {
    rewardApplied,
    invitedCount: Number(finalProfile?.invited_count || finalProfile?.unique_ips || invitedCount),
    vipGoalReached: (finalProfile?.vip_goal_reached || (vipGoalReached ? '1' : '0')) === '1',
    vipGranted: (finalProfile?.vip_granted || (vipGranted ? '1' : '0')) === '1',
  }
}

export async function GET(req) {
  const url = new URL(req.url)
  const code = (url.searchParams.get('code') || '').trim()

  if (!code) {
    return bad('missing_code', 400)
  }

  const rawUid = String(await referralPrimary.getUidByCode(code) || '').trim()
  if (!rawUid) {
    const siteUrl = getSiteUrl()
    if ((req.headers.get('accept') || '').includes('text/html')) {
      return Response.redirect(siteUrl, 302)
    }
    return bad('unknown_code', 404)
  }

  const identity = await identityContract.resolve(rawUid, {
    mode: 'referral-owner',
    source: 'app/api/referral/hit/route.js',
  })
  const canonicalUid = String(identity.canonicalAccountId || (await resolveCanonicalAccountId(rawUid)) || '').trim()
  const uid = String(identity.exactEtalonUid || rawUid || canonicalUid || '').trim()
  await writeCanonicalAliases(canonicalUid || uid, [rawUid]).catch(() => 0)

  const ip = getClientIp(req) || ''
  const result = await applyReferralReward(uid, code, ip, identity)

  const payload = {
    ok: true,
    code,
    uid,
    canonicalUid: canonicalUid || uid,
    rewardApplied: result.rewardApplied,
    invitedCount: result.invitedCount,
    vipThreshold: REF_VIP_THRESHOLD,
    vipGoalReached: result.vipGoalReached,
    vipGranted: result.vipGranted,
  }

  const accept = req.headers.get('accept') || ''
  const siteUrl = getSiteUrl()

  if (accept.includes('text/html')) {
    return Response.redirect(siteUrl, 302)
  }

  return json(payload, 200)
}
