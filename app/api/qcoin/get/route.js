// app/api/qcoin/get/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'

const redis = Redis.fromEnv()

const INC_PER_SEC = 1 / (365 * 24 * 60 * 60)
const GRACE_MS    = 4 * 60 * 60 * 1000
const key = (uid) => `qcoin:${uid}`

async function getUid(req) {
  const hx = (req.headers.get('x-forum-user') || '').trim()
  if (hx) return hx
  try { return requireUserId(req) } catch {}
  return ''
}

async function ensureBalanceField(uid) {
  try {
    const h = await redis.hgetall(key(uid))
    const b = h?.balance
    if (b == null || Number.isNaN(Number(b))) {
      await redis.hset(key(uid), { balance: 0 })
    }
  } catch (e) {
    if (String(e?.message||'').includes('WRONGTYPE')) {
      await redis.del(key(uid))
      await redis.hset(key(uid), { balance: 0 })
    } else {
      throw e
    }
  }
}

async function readState(uid) {
  try {
    const h = await redis.hgetall(key(uid))
    if (h && Object.keys(h).length) {
      return {
        startedAt:    Number(h.startedAt    ?? Date.now()),
        lastActiveAt: Number(h.lastActiveAt ?? Date.now()),
        lastConfirmAt:Number(h.lastConfirmAt?? 0),
        carryMs:      Number(h.carryMs      ?? 0),
        seconds:      Number(h.seconds      ?? 0),
        balance:      Number(h.balance      ?? 0), // важное поле
        paused:       !!Number(h.paused     ?? 0),
      }
    }
  } catch (e) {
    if (String(e?.message||'').includes('WRONGTYPE')) {
      await redis.del(key(uid))
    } else {
      throw e
    }
  }
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
  try {
    const uid = await getUid(req)
    if (!uid) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })

    const isVip = (req.headers.get('x-forum-vip') === '1')
    const RATE  = isVip ? (INC_PER_SEC * 2) : INC_PER_SEC

    await ensureBalanceField(uid)
    const s = await readState(uid)

    // Небольшая отладочная подсказка — какой ключ читаем
    return NextResponse.json({
      ok: true,
      userId: uid,
      redisKey: key(uid),
      startedAt: s.startedAt,
      lastActiveAt: s.lastActiveAt,
      lastConfirmAt: s.lastConfirmAt,
      seconds: s.seconds,
      minutes: Math.floor((s.seconds || 0) / 60),
      balance: s.balance,
      paused: s.paused,
      incPerSec: RATE,
      graceMs: GRACE_MS,
      vip: isVip ? 1 : 0,
    })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
