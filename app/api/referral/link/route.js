// app/api/referral/link/route.js
import { Redis } from '@upstash/redis'
import {
  json,
  bad,
  requireUserId,
} from '../../forum/_utils.js'

const redis = Redis.fromEnv()

// ====== Константы / конфиг ======

function readNumberEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env[name]
    if (raw == null || raw === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

// Награда за одного друга (QCoin) — берём с сервера или публичного ENV
const REF_REWARD_QCOIN = readNumberEnv(
  ['REFERRAL_REWARD_QCOIN', 'NEXT_PUBLIC_REFERRAL_REWARD_QCOIN'],
  0.1,
)

// Порог друзей для VIP — тоже из ENV
const REF_VIP_THRESHOLD = readNumberEnv(
  ['REFERRAL_VIP_THRESHOLD', 'NEXT_PUBLIC_REFERRAL_VIP_THRESHOLD'],
  50,
)

// ====== Helpers ======

function normalizeAccountId(raw) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  const lower = s.toLowerCase()

  if (lower.startsWith('tguid:')) {
    s = s.slice('tguid:'.length)
  } else if (lower.startsWith('tg:')) {
    s = s.slice('tg:'.length)
  }

  return s.toLowerCase() || null
}

const REF_USER_KEY = (uid) => `ref:user:${uid}`
const REF_UID_BY_CODE_KEY = (code) => `ref:uid_by_code:${code}`

function randomCode(len = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

// Берём базовый URL либо из ENV, либо из origin запроса
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

// ====== Handler ======

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

  const uid = normalizeAccountId(uidRaw)
  if (!uid) {
    return bad('invalid_user_id', 400)
  }

  const nowIso = new Date().toISOString()
  const siteUrl = getSiteUrlForRequest(req)

  // 1. Пытаемся прочитать профиль рефералки
  let profile = await redis.hgetall(REF_USER_KEY(uid))
  if (!profile) profile = {}

  let { code } = profile

  // 2. Если кода нет — генерируем новый
  if (!code) {
    for (let i = 0; i < 5; i += 1) {
      const candidate = randomCode(8)
      const existing = await redis.get(REF_UID_BY_CODE_KEY(candidate))
      if (!existing) {
        code = candidate
        break
      }
    }
    if (!code) {
      code = randomCode(12)
    }

    await redis.hset(REF_USER_KEY(uid), {
      code,
      reward_qcoin: REF_REWARD_QCOIN.toString(),
      created_at: profile.created_at || nowIso,
      clicks_total: profile.clicks_total || '0',
      unique_ips: profile.unique_ips || '0',
      invited_count: profile.invited_count || '0',
      vip_goal_reached: profile.vip_goal_reached || '0',
      vip_granted: profile.vip_granted || '0',
    })

    await redis.set(REF_UID_BY_CODE_KEY(code), uid)
  } else {
    // подстраховка: обратная связь code → uid
    const mapped = await redis.get(REF_UID_BY_CODE_KEY(code))
    if (!mapped) {
      await redis.set(REF_UID_BY_CODE_KEY(code), uid)
    }
  }

  // перечитываем профиль
  const updated = await redis.hgetall(REF_USER_KEY(uid))
  const invitedCount = Number(updated?.invited_count || updated?.unique_ips || 0)
  const vipGoalReached = (updated?.vip_goal_reached || '0') === '1'
  const vipGranted = (updated?.vip_granted || '0') === '1'

  // ВАЖНО: формируем ПОЛНЫЙ URL — чтобы ссылка была кликабельной в мессенджерах
  const url = `${siteUrl}/api/referral/hit?code=${encodeURIComponent(code)}`

  return json({
    ok: true,
    uid,
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
