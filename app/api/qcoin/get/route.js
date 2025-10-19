import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'
const redis = Redis.fromEnv()

// 1 / (365 * 24 * 60 * 60) — столько монет в СЕКУНДУ, чтобы за год = 1.0
const INC_PER_SEC = 1 / (365 * 24 * 60 * 60) // ≈ 3.170979198e-8
const GRACE_MS = 4 * 60 * 60 * 1000 // 4 часа

const key = (uid) => `qcoin:${uid}`

async function readState(uid) {
  try {
    const h = await redis.hgetall(key(uid))
    if (h && Object.keys(h).length) {
      return {
        startedAt: Number(h.startedAt || Date.now()),
        lastActiveAt: Number(h.lastActiveAt || Date.now()),
        lastConfirmAt: Number(h.lastConfirmAt || 0),
        carryMs: Number(h.carryMs || 0),
        seconds: Number(h.seconds || 0),
        balance: Number(h.balance || 0),
        paused: !!Number(h.paused || 0),
      }
    }
  } catch (e) {
    // если ключ оказался не HASH — подчистим и продолжим с нуля
    if (String(e?.message || '').includes('WRONGTYPE')) {
      await redis.del(key(uid))
    } else {
      throw e
    }
  }
  // дефолт
  const now = Date.now()
  return {
    startedAt: now,
    lastActiveAt: now,
    lastConfirmAt: 0,
    carryMs: 0,
    seconds: 0,
    balance: 0,
    paused: false,
  }
}

export async function GET(req) {
  // единообразно получаем userId (кука/заголовок — в одном месте)
  const uid = requireUserId(req)
  // ADD: VIP-флаг из заголовка и эффективная скорость
  const isVip = (req.headers.get('x-forum-vip') === '1')
  const RATE = isVip ? (INC_PER_SEC * 2) : INC_PER_SEC
  const s = await readState(uid)
  return NextResponse.json({
    ok: true,
    userId: uid,
    startedAt: s.startedAt,
    lastActiveAt: s.lastActiveAt,
    lastConfirmAt: s.lastConfirmAt,
    seconds: s.seconds,
    minutes: Math.floor(s.seconds / 60), // для обратной совместимости
    balance: s.balance,
    paused: s.paused,
    incPerSec: RATE,
    graceMs: GRACE_MS,
     vip: isVip ? 1 : 0,
  })
}
