// app/api/referral/hit/route.js

import { Redis } from '@upstash/redis'
import {
  json,
  bad,
  getClientIp,
} from '../../forum/_utils.js'
import { addVipDays } from '@/lib/subscriptions.js'

export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

const REF_USER_KEY = (uid) => `ref:user:${uid}`
const REF_UID_BY_CODE_KEY = (code) => `ref:uid_by_code:${code}`
const REF_IPS_KEY = (code) => `ref:ips:${code}`
const REF_VIP_PENDING_KEY = (uid) => `ref:vip_pending:${uid}`
const REF_VIP_QUEUE = 'ref:vip_queue'

// QCoin — ровно как в Академии: qcoin:<uid>, HASH, поле balance
const qcoinKey = (uid) => `qcoin:${uid}`

function readNumberEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env[name]
    if (raw == null || raw === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

// награда в QCoin за одного уникального друга
const REF_REWARD_QCOIN = readNumberEnv(
  ['REFERRAL_REWARD_QCOIN', 'NEXT_PUBLIC_REFERRAL_REWARD_QCOIN'],
  0.1,
)

// сколько уникальных друзей нужно для VIP
const REF_VIP_THRESHOLD = readNumberEnv(
  ['REFERRAL_VIP_THRESHOLD'],
  50,
)

// сколько дней VIP выдаём за выполнение цели
const REF_VIP_DAYS = readNumberEnv(
  ['REFERRAL_VIP_DAYS'],
  30,
)

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (!env) return '/'
  return env.replace(/\/+$/, '')
}

async function applyReferralReward(uid, code, ip) {
  const nowIso = new Date().toISOString()

  // 1. Проверяем уникальность IP
  let isNew = 0
  if (ip) {
    try {
      isNew = await redis.sadd(REF_IPS_KEY(code), ip)
    } catch {
      isNew = 0
    }
  }

  // 2. Обновляем базовые счётчики профиля реферальной программы
  const profileKey = REF_USER_KEY(uid)
  const profile = await redis.hgetall(profileKey)
  const clicksTotalPrev = Number(profile?.clicks_total || 0)
  const invitedPrev = Number(profile?.invited_count || profile?.unique_ips || 0)

  const baseUpdates = {
    clicks_total: String(clicksTotalPrev + 1),
    last_click_at: nowIso,
  }

  let rewardApplied = false
  let invitedCount = invitedPrev

  // 3. Новый уникальный IP → считаем приглашённого
  if (isNew === 1) {
    invitedCount = invitedPrev + 1

    // QCoin: делаем ровно как Академия — hincrbyfloat по HASH qcoin:<uid>, поле balance
    try {
      await redis.hincrbyfloat(qcoinKey(uid), 'balance', REF_REWARD_QCOIN)
      rewardApplied = true
    } catch {
      // не ломаем весь роут, если Upstash что-то сказал
    }

    baseUpdates.unique_ips = String(invitedCount)
    baseUpdates.invited_count = String(invitedCount)
    baseUpdates.last_reward_at = nowIso

    const goalReachedPrev = (profile?.vip_goal_reached || '0') === '1'
    const vipAlreadyGranted = (profile?.vip_granted || '0') === '1'

    // 4. Впервые достигли порога → пытаемся сразу выдать VIP через subscriptions.js
    if (!goalReachedPrev && invitedCount >= REF_VIP_THRESHOLD) {
      baseUpdates.vip_goal_reached = '1'

      let vipGrantedNow = false

      try {
        await addVipDays(uid, REF_VIP_DAYS, {
          // уникальный идентификатор операции
          paymentId: `referral:${code}:${nowIso}`,
        })
        vipGrantedNow = true
      } catch (e) {
        // если что-то пошло не так — старый режим с очередью
        try {
          await redis.set(REF_VIP_PENDING_KEY(uid), '1')
          await redis.rpush(
            REF_VIP_QUEUE,
            JSON.stringify({
              uid,
              invitedCount,
              code,
              at: nowIso,
              error: String(e),
            }),
          )
        } catch {
          // не критично для основной логики
        }
      }

      if (vipGrantedNow && !vipAlreadyGranted) {
        baseUpdates.vip_granted = '1'
        // запасной флаг / очередь больше не нужны
        try {
          await redis.del(REF_VIP_PENDING_KEY(uid))
        } catch {}
      }
    }
  }

  await redis.hset(profileKey, baseUpdates)

  const updatedProfile = await redis.hgetall(profileKey)
  const vipGoalReached = (updatedProfile?.vip_goal_reached || '0') === '1'
  const vipGranted = (updatedProfile?.vip_granted || '0') === '1'
  const finalInvited = Number(
    updatedProfile?.invited_count ||
      updatedProfile?.unique_ips ||
      invitedCount,
  )

  return {
    rewardApplied,
    invitedCount: finalInvited,
    vipGoalReached,
    vipGranted,
  }
}

export async function GET(req) {
  const url = new URL(req.url)
  const code = (url.searchParams.get('code') || '').trim()

  if (!code) {
    return bad('missing_code', 400)
  }

  // uid, который мы сохраняли при генерации ссылки в ref:uid_by_code:<code>
  const mappedUid = await redis.get(REF_UID_BY_CODE_KEY(code))

  const uid = String(mappedUid ?? '').trim()

  if (!uid) {
    const siteUrl = getSiteUrl()
    if ((req.headers.get('accept') || '').includes('text/html')) {
      return Response.redirect(siteUrl, 302)
    }
    return bad('unknown_code', 404)
  }

  const ip = getClientIp(req) || ''

  const result = await applyReferralReward(uid, code, ip)

  const payload = {
    ok: true,
    code,
    uid,
    rewardApplied: result.rewardApplied,
    invitedCount: result.invitedCount,
    vipThreshold: REF_VIP_THRESHOLD,
    vipGoalReached: result.vipGoalReached,
    vipGranted: result.vipGranted,
  }

  const accept = req.headers.get('accept') || ''
  const siteUrl = getSiteUrl()

  if (accept.includes('text/html')) {
    // переходы из мессенджеров → редирект на сайт
    return Response.redirect(siteUrl, 302)
  }

  return json(payload, 200)
}
