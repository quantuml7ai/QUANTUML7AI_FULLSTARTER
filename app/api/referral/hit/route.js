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
import economicRoute from '@/lib/economic-integrity/productionRoute.cjs'

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
  const legacyUids = Array.isArray(identity?.aliasSet) ? identity.aliasSet : []
  const hit = await referralPrimary.recordHit({ uid, code, ip, legacyUids })
  const before = hit.profile || {}
  const invitedCount = Number(hit.invitedCount || 0)
  let rewardApplied = false
  let vipGoalReached = (before.vip_goal_reached || '0') === '1'
  let vipGranted = (before.vip_granted || '0') === '1'

  if (hit.isNewIp) {
    try {
      const ipHash = sha256Text(ip)
      const rewardUid = String(identity?.qcoinUid || uid || '').trim()
      const sourceEventId = `referral:${code}:${ipHash}`
      await economicRoute.executeVerifiedEconomicOperation({
        routeId: 'referral.reward',
        operationType: 'credit',
        actorAccountId: rewardUid,
        targetAccountId: rewardUid,
        amount: REF_REWARD_QCOIN,
        sourceEventId,
        idempotencyKey: sourceEventId,
        sourceType: 'referral-event',
        sourceOwner: 'app/api/referral/hit/route.js',
        sourceEvidence: { code, ipHash, invitedCount, rewardUid, inviterRawUid: uid, isNewIp: hit.isNewIp === true },
        writer: (decisionReceipt) => qcoinPrimary.incrementBalance({
          uid: rewardUid,
          amount: REF_REWARD_QCOIN,
          eventKind: 'referral_reward',
          route: '/api/referral/hit',
          economicRouteId: 'referral.reward',
          sourceEventId,
          idempotencyKey: sourceEventId,
          decisionReceipt,
          meta: { code, invitedCount, rewardToQcoinUid: rewardUid, inviterRawUid: uid },
        }),
      })
      rewardApplied = true
    } catch {
      rewardApplied = false
    }

    if (!vipGoalReached && invitedCount >= REF_VIP_THRESHOLD) {
      vipGoalReached = true
      await referralPrimary.updateFlags(uid, { vip_goal_reached: '1' }, legacyUids)

      if (!vipGranted) {
        try {
          const vipSourceEventId = `referral:vip:${code}:${invitedCount}`
          await economicRoute.executeVerifiedEconomicOperation({
            routeId: 'vip.referral.activation',
            operationType: 'entitlement_extend',
            actorAccountId: uid,
            targetAccountId: uid,
            amount: REF_VIP_DAYS,
            entitlementId: 'vip',
            sourceEventId: vipSourceEventId,
            idempotencyKey: vipSourceEventId,
            sourceType: 'referral-event',
            sourceOwner: 'app/api/referral/hit/route.js',
            sourceEvidence: { code, invitedCount, threshold: REF_VIP_THRESHOLD, days: REF_VIP_DAYS, vipGoalReached },
            writer: (decisionReceipt) => addVipDays(uid, REF_VIP_DAYS, {
              paymentId: vipSourceEventId,
              economicRouteId: 'vip.referral.activation',
              operationType: 'entitlement_extend',
              idempotencyKey: vipSourceEventId,
              decisionReceipt,
            }),
          })
          vipGranted = true
          await referralPrimary.updateFlags(uid, { vip_goal_reached: '1', vip_granted: '1' }, legacyUids)
        } catch (e) {
          await referralPrimary.enqueueVipPending({
            uid,
            code,
            invitedCount,
            error: String(e?.message || e),
            legacyUids,
          })
        }
      }
    }
  }

  const finalProfile = await referralPrimary.readProfile(uid, legacyUids)
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
  if (identity.conflicted || identity.mutationAllowed === false) {
    return bad('identity_link_conflict', 409)
  }  
  const canonicalUid = String(identity.canonicalAccountId || (await resolveCanonicalAccountId(rawUid)) || '').trim()
  const uid = String(canonicalUid || identity.canonicalSyntax || identity.exactEtalonUid || rawUid || '').trim()
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
