import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'
const redis = Redis.fromEnv()

const INC_PER_SEC = 1 / (365 * 24 * 60 * 60) // скорость начисления
const GRACE_MS = 4 * 60 * 60 * 1000          // 4 часа «живу» без кликов
const key = (uid) => `qcoin:${uid}`
const aliveKey = (uid, cid='') => cid ? `qcoin:alive:${uid}:${cid}` : `qcoin:alive:${uid}`

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
    if (String(e?.message || '').includes('WRONGTYPE')) {
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

export async function POST(req) {
const uid = requireUserId(req)

  let body = {}
  try { body = await req.json() } catch {}
  const now = Number(body?.now || Date.now())
  const activeFlag = !!body?.active
  // ограничим client-id по длине и допустимым символам (чтобы не плодить мусорные ключи)
  let cid = (req.headers.get('x-forum-client-id') || '').trim()
  if (cid && !/^[A-Za-z0-9_\-:.]{1,64}$/.test(cid)) cid = ''
  let s = await readState(uid)

  // отмечаем «живой клиент» (вкладка/вебвью) и держим 60с TTL
  if (cid) {
    try {
      await redis.set(aliveKey(uid, cid), 1, { px: 60_000 })
    } catch {}
  }

  // жив хоть какой-то клиент?
  let anyClientAlive = false
  try {
    // если используешь per-cid ключи, можно делать KEYS, но в Upstash лучше хранить счётчик:
    // здесь упрощённо: читаем именно свой cid; если cid нет — считаем, что живых клиентов нет
    if (cid) {
      anyClientAlive = (await redis.get(aliveKey(uid, cid))) ? true : false
    }
  } catch {}

  // любое действие в форуме должно обновлять lastConfirmAt.
  // В нашем хардбит-API считаем «подтверждением» сам факт пришедшего heartbeat с active=true
  const nowConfirmed = activeFlag
  if (nowConfirmed) {
    s.lastConfirmAt = now
  }

  const withinGrace = (now - (s.lastConfirmAt || 0)) < GRACE_MS
  const effectiveActive = activeFlag || anyClientAlive || withinGrace

  const deltaMs = Math.max(0, now - (s.lastActiveAt || now))
  let addedSeconds = 0
  let addedBalance = 0

  if (effectiveActive && !s.paused) {
    const total = (s.carryMs || 0) + deltaMs
    const wholeSeconds = Math.floor(total / 1000)
    const carryMs = total % 1000

    if (wholeSeconds > 0) {
      addedSeconds = wholeSeconds
      addedBalance = wholeSeconds * INC_PER_SEC
      s.seconds = (s.seconds || 0) + wholeSeconds
      s.balance = (s.balance || 0) + addedBalance
      s.carryMs = carryMs
    } else {
      s.carryMs = total // < 1000
    }
  } else {
    // не активен — просто накапливаем carry, без добавления
    s.carryMs = ((s.carryMs || 0) + deltaMs) % 1000
  }

  s.lastActiveAt = now
  if (!s.startedAt) s.startedAt = now

  // сохраняем
  await redis.hset(key(uid), {
    startedAt: s.startedAt,
    lastActiveAt: s.lastActiveAt,
    lastConfirmAt: s.lastConfirmAt || 0,
    carryMs: s.carryMs || 0,
    seconds: s.seconds || 0,
    balance: s.balance || 0,
    paused: s.paused ? 1 : 0,
  })

  return NextResponse.json({
    ok: true,
    startedAt: s.startedAt,
    lastActiveAt: s.lastActiveAt,
    lastConfirmAt: s.lastConfirmAt,
    seconds: s.seconds,
    minutes: Math.floor((s.seconds || 0) / 60),
    balance: s.balance,
    addedSeconds,
    added: addedBalance,
    incPerSec: INC_PER_SEC,
    effectiveActive,
    anyClientAlive,
    graceMs: GRACE_MS,
  })
}
