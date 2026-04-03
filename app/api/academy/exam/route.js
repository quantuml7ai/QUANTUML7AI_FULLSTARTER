// app/api/academy/exam/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'

const redis = Redis.fromEnv()

// ключи в Redis
const examKey  = (uid, blockId) => `academy:exam:${uid}:${blockId}`
const qcoinKey = (uid)          => `qcoin:${uid}`

// каждые сколько правильных удваиваем награду
const DOUBLE_EVERY = 5

// ===== чтение ENV (и приватных, и NEXT_PUBLIC) =====
function readNumberEnv(names, fallback) {
  for (const name of names) {
    const v = process.env[name]
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      const num = Number(v)
      if (Number.isFinite(num)) return num
    }
  }
  return fallback
}

// базовая награда за вопрос (без учёта VIP)
const BASE_REWARD = readNumberEnv(
  ['ACADEMY_EXAM_BASE_REWARD', 'NEXT_PUBLIC_ACADEMY_EXAM_BASE_REWARD'],
  0.01 // дефолт, если ENV не задали
)

// таймер между вопросами (секунды)
const COOLDOWN_SEC = readNumberEnv(
  [
    'ACADEMY_EXAM_COOLDOWN_SECONDS',
    'NEXT_PUBLIC_ACADEMY_EXAM_COOLDOWN_SECONDS',
  ],
  180 // 3 минуты по умолчанию
)

// сколько вопросов в блоке (можно переопределить в ENV)
function getBlockTotal(blockId) {
  const envName  = `ACADEMY_EXAM_BLOCK_${blockId}_TOTAL`
  const envName2 = `NEXT_PUBLIC_ACADEMY_EXAM_BLOCK_${blockId}_TOTAL`
  const raw = process.env[envName] || process.env[envName2]
  const num = raw ? Number(raw) : NaN
  if (Number.isFinite(num) && num > 0) return num

  // дефолтная конфигурация по твоей Академии:
  if (blockId === 29) return 70
  return 50
}

// считаем награду за N-й правильный ответ (N >= 1)
function calcReward(base, correctCount, isVip) {
  if (!base || base <= 0 || correctCount <= 0) return 0
  const step = Math.floor((correctCount - 1) / DOUBLE_EVERY) // 0..∞
  const mult = Math.pow(2, step)
  const vipMult = isVip ? 2 : 1
  return base * mult * vipMult
}

// награда за следующий правильный ответ
function calcNextReward(base, correctCount, isVip) {
  return calcReward(base, correctCount + 1, isVip)
}

// чтение UID из запроса (как в qcoin-роутах)
function getUidFromReq(req, body) {
  const hx =
    (req.headers.get('x-forum-user') ||
      req.headers.get('x-forum-user-id') ||
      '').trim()
  if (hx) return hx

  if (body && body.accountId) return String(body.accountId)
  if (body && body.asherId) return String(body.asherId)

  try {
    return requireUserId(req)
  } catch {
    return ''
  }
}

// признак VIP из заголовка (фронт шлёт x-forum-vip: "1")
function getVipFromReq(req) {
  const h =
    (req.headers.get('x-forum-vip') ||
      req.headers.get('x-qcoin-vip') ||
      '').trim()
  if (!h) return false
  return h === '1' || h.toLowerCase() === 'true'
}

/* ===================== GET ===================== */
/**
 * GET /api/academy/exam?blockId=1
 *
 * - если юзер не авторизован → ok:true, authed:false, прогресс 0
 * - если авторизован → отдаём его состояние по блоку
 */
export async function GET(req) {
  try {
    const url = new URL(req.url)
    const blockId = Number(url.searchParams.get('blockId') || '0')
    if (!Number.isFinite(blockId) || blockId < 1 || blockId > 29) {
      return NextResponse.json(
        { ok: false, error: 'invalid_block' },
        { status: 400 }
      )
    }

    const total = getBlockTotal(blockId)
    const uid = getUidFromReq(req, null)
    const isVip = getVipFromReq(req)
    const now = Date.now()

    // не авторизован — просто отдаём конфиг, чтобы фронт знал награды
    if (!uid) {
      return NextResponse.json({
        ok: true,
        authed: false,
        done: 0,
        total,
        baseReward: BASE_REWARD,
        currentReward: calcReward(BASE_REWARD, 1, isVip),
        nextReward: calcNextReward(BASE_REWARD, 1, isVip),
        cooldownUntil: 0,
        completed: false,
        now,
      })
    }

    // читаем состояние экзамена из Redis
    const h = await redis.hgetall(examKey(uid, blockId))
    let done = 0
    let correct = 0
    let cooldownUntil = 0

    if (h && Object.keys(h).length) {
      done = Number(h.done || 0)
      correct = Number(h.correct || 0)
      cooldownUntil = Number(h.cooldownUntil || 0)
    }

    const completed = done >= total
    const effectiveCorrect = Math.max(0, correct)

    const currentReward = completed
      ? 0
      : calcReward(BASE_REWARD, effectiveCorrect + 1, isVip)
    const nextReward = completed
      ? 0
      : calcNextReward(BASE_REWARD, effectiveCorrect + 1, isVip)

    return NextResponse.json({
      ok: true,
      authed: true,
      done,
      total,
      baseReward: BASE_REWARD,
      currentReward,
      nextReward,
      cooldownUntil,
      completed,
      now,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}

/* ===================== POST ===================== */
/**
 * POST /api/academy/exam
 * body: { blockId: number, correct: boolean }
 *
 * Требует авторизацию. Начисляет QCoin, обновляет прогресс.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const blockId = Number(body.blockId || 0)
    if (!Number.isFinite(blockId) || blockId < 1 || blockId > 29) {
      return NextResponse.json(
        { ok: false, error: 'invalid_block' },
        { status: 400 }
      )
    }

    const uid = getUidFromReq(req, body)
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      )
    }

    const isVip = getVipFromReq(req)
    const total = getBlockTotal(blockId)
    const now = Date.now()

    if (!BASE_REWARD || BASE_REWARD <= 0) {
      // защита от неверной конфигурации
      return NextResponse.json(
        { ok: false, error: 'no_reward_config' },
        { status: 500 }
      )
    }

    const k = examKey(uid, blockId)
    const h = await redis.hgetall(k)
    let done = 0
    let correct = 0
    let cooldownUntil = 0

    if (h && Object.keys(h).length) {
      done = Number(h.done || 0)
      correct = Number(h.correct || 0)
      cooldownUntil = Number(h.cooldownUntil || 0)
    }

    // экзамен уже пройден
    if (done >= total) {
      return NextResponse.json({
        ok: true,
        done,
        total,
        baseReward: BASE_REWARD,
        currentReward: 0,
        nextReward: 0,
        cooldownUntil,
        completed: true,
        awarded: 0,
      })
    }

    // защита от спама: если таймер не истёк — 429
    if (now < cooldownUntil) {
      return NextResponse.json(
        { ok: false, error: 'cooldown' },
        { status: 429 }
      )
    }

    const wasCorrect = !!body.correct

    done += 1
    let awarded = 0

    if (wasCorrect) {
      correct += 1
      awarded = calcReward(BASE_REWARD, correct, isVip)

      // начисляем QCoin на основной баланс,
      // тот же Redis-ключ, который использует форум
      try {
        await redis.hincrbyfloat(qcoinKey(uid), 'balance', awarded)
      } catch {
        // не ломаем ответ, если Upstash что-то сказал
      }
    }

    const completed = done >= total
    cooldownUntil = now + COOLDOWN_SEC * 1000

    const nextReward = completed
      ? 0
      : calcNextReward(BASE_REWARD, correct, isVip)
    const currentReward = completed
      ? 0
      : calcReward(BASE_REWARD, correct + 1, isVip)

    await redis.hset(k, {
      done,
      correct,
      cooldownUntil,
      updatedAt: now,
    })

    return NextResponse.json({
      ok: true,
      done,
      total,
      baseReward: BASE_REWARD,
      currentReward,
      nextReward,
      cooldownUntil,
      completed,
      awarded,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
