// app/api/quest/progress/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const redis = Redis.fromEnv()

// ----- KEYS -----
const qpKey    = uid         => `quest:progress:${uid}`
const claimKey = (uid, card) => `quest:claim:${uid}:${card}`
const qcoinKey = uid         => `qcoin:${uid}`

// ====== small helpers ======
const nowMs = () => Date.now()
const uniqStrings = arr => Array.from(new Set((arr || []).map(String)))
const getVipFlag = req => (req.headers.get('x-forum-vip') || '').trim() === '1'

const toInt  = (v, d=0) => { const n = Number.parseInt(String(v ?? '').trim(), 10); return Number.isFinite(n) ? n : d }
const toNum  = (v, d=0) => { const n = Number(v); return Number.isFinite(n) ? n : d }
const toBool = (v, d=false) => {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return d
  return s === '1' || s === 'true' || s === 'yes'
}

// ====== ENV adapters (совместимы с /api/quest/env) ======
function getGlobalDefaultsFromEnv(env) {
  return {
    // общее число карточек без лимита (fallback на старое имя)
    cardCount: toInt(env.NEXT_PUBLIC_QUEST_CARD_COUNT, toInt(env.NEXT_PUBLIC_QUEST_CARDS, 0)),
    tasksPerCard: Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASKS_PER_CARD, 10)),
    taskDelayMs:  Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASK_DELAY_MS, 15000)),
    // совместимость — но **не используется** для клейма (клейм мгновенный)
    claimDelayMs: Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS, 0)),
  }
}
function getCardTaskCount(env, cardId, defaults) {
  return Math.max(0, toInt(env[`NEXT_PUBLIC_QUEST_CARD_${cardId}_TASK_COUNT`], defaults.tasksPerCard))
}
function getCardTaskDelayMs(env, cardId, defaults) {
  return Math.max(0, toInt(env[`NEXT_PUBLIC_QUEST_CARD_${cardId}_TASK_DELAY_MS`], defaults.taskDelayMs))
}
function getCardEnabled(env, cardId) {
  // по умолчанию включено
  return toBool(env[`NEXT_PUBLIC_QUEST_CARD_${cardId}_ENABLED`], true)
}
function readRewardAmount(env, { rewardKey, cardId }) {
  // приоритет 1: явный ключ из тела запроса
  if (rewardKey) {
    const s = String(env[rewardKey] ?? '').trim()
    const n = Number(s)
    if (Number.isFinite(n) && n > 0) return { ok: true, amount: n, key: rewardKey }
  }
  // приоритет 2: новый формат по номеру карточки
  const k1 = `NEXT_PUBLIC_QUEST${cardId}_REWARD`
  if (env[k1]) {
    const n = Number(env[k1])
    if (Number.isFinite(n) && n > 0) return { ok: true, amount: n, key: k1 }
  }
  // приоритет 3: легаси-формат
  const k2 = `QUEST_CARD_${cardId}_REWARD`
  if (env[k2]) {
    const n = Number(env[k2])
    if (Number.isFinite(n) && n > 0) return { ok: true, amount: n, key: k2 }
  }
  return { ok: false, error: 'invalid_reward' }
}

// ====== UID / progress storage ======
async function getUid(req, body) {
  const hx = (req.headers.get('x-forum-user') || '').trim()
  if (hx) return hx
  if (body?.accountId) return String(body.accountId)
  if (body?.asherId)   return String(body.asherId)
  try { return requireUserId(req) } catch {}
  return ''
}
async function readProgress(uid) {
  try {
    const raw = await redis.get(qpKey(uid))
    if (raw == null || raw === 'null') return {}
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const j = JSON.parse(raw)
        return (j && typeof j === 'object' && !Array.isArray(j)) ? j : {}
      } catch { return {} }
    }
    return {}
  } catch { return {} }
}
async function writeProgress(uid, obj) {
  const safe = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {}
  await redis.set(qpKey(uid), safe)
}

// гарантируем HASH qcoin:<uid> с числовым balance
async function ensureQcoinBalanceField(uid) {
  try {
    const h = await redis.hgetall(qcoinKey(uid))
    const b = h?.balance
    if (b == null || Number.isNaN(Number(b))) {
      await redis.hset(qcoinKey(uid), { balance: 0 })
    }
  } catch (e) {
    if (String(e?.message || '').includes('WRONGTYPE')) {
      await redis.del(qcoinKey(uid))
      await redis.hset(qcoinKey(uid), { balance: 0 })
    } else {
      throw e
    }
  }
}

// ===== GET =====
export async function GET(req) {
  try {
    const uid = await getUid(req, {})
    if (!uid) return NextResponse.json({ ok: true, progress: {} })
    const progress = await readProgress(uid)
    return NextResponse.json({ ok: true, progress: progress || {} })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

// ===== POST =====
export async function POST(req) {
  try {
    let body = {}
    try { body = await req.json() } catch {}
    const userId = await getUid(req, body)
    if (!userId) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })

    const { cardId, taskId, claim = false, rewardKey } = body
    if (!cardId) return NextResponse.json({ ok:false, error:'invalid_card' }, { status:400 })

    // читаем ENV один раз
    const env = process.env
    const defaults = getGlobalDefaultsFromEnv(env)

    // карточка существует/включена?
    const enabled = getCardEnabled(env, cardId)
    if (!enabled) return NextResponse.json({ ok:false, error:'card_disabled' }, { status:400 })

    const taskCount = getCardTaskCount(env, cardId, defaults)
    const taskDelayMs = getCardTaskDelayMs(env, cardId, defaults) // сейчас инфо-мета; сервер не ждёт

    // 1) Отметить задачу (по завершению клиентского таймера)
    if (taskId) {
      // опционально: игнорировать «лишние» taskId
      const tId = String(taskId)
      const validIdx = toInt(taskId, 0)
      if (taskCount > 0 && (validIdx < 1 || validIdx > taskCount)) {
        return NextResponse.json({ ok:false, error:'invalid_task' }, { status:400 })
      }

      const cur  = await readProgress(userId)
      const card = cur[cardId] || { done: [] }

      const done = uniqStrings([ ...(card.done || []), tId ])
      const wasCount = (card.done?.length || 0)
      const becameAll = wasCount < taskCount && done.length >= taskCount

      const nextCard = {
        ...card,
        done,
        ts: nowMs(),
        // оставляем поле — возможно пригодится для аналитики; но сервер не ждёт его при claim
        claimReadyTs: card.claimReadyTs || (becameAll ? nowMs() : 0),
        taskCount,
        taskDelayMs,
      }
      const next = { ...cur, [cardId]: nextCard }
      await writeProgress(userId, next)
      return NextResponse.json({ ok: true, progress: next, awarded: 0 })
    }

    // 2) Клейм (мгновенно после выполнения всех задач)
    if (claim) {
      const prog = await readProgress(userId)
      const card = prog[cardId] || {}
      const doneCount = Array.isArray(card.done) ? card.done.length : 0
      if (doneCount < taskCount) {
        return NextResponse.json({ ok:false, error:'not_completed', details:{ done: doneCount, need: taskCount } }, { status:400 })
      }

      // сумма из ENV (по rewardKey, либо по номеру карточки)
      const r = readRewardAmount(env, { rewardKey, cardId })
      if (!r.ok) return NextResponse.json({ ok:false, error:r.error }, { status:400 })
      const base   = r.amount
      const amount = getVipFlag(req) ? (base * 2) : base

      // идемпотентность
      const ck = claimKey(userId, cardId)
      const nx = await redis.set(ck, nowMs(), { nx: true })
      if (!nx) return NextResponse.json({ ok:false, error:'already_claimed' }, { status:409 })

      // баланс
      await ensureQcoinBalanceField(userId)
      await redis.hincrbyfloat(qcoinKey(userId), 'balance', amount)

      const next = {
        ...prog,
        [cardId]: {
          ...(prog[cardId] || {}),
          claimed: true,
          claimTs: nowMs(),
          taskCount,
          taskDelayMs,
        }
      }
      await writeProgress(userId, next)

      return NextResponse.json({ ok: true, progress: next, awarded: amount })
    }

    // ни taskId, ни claim
    return NextResponse.json({ ok:false, error:'bad_args' }, { status:400 })

  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:500 })
  }
}
