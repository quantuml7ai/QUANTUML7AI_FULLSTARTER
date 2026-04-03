// app/api/quest/status/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const redis = Redis.fromEnv()

// ---------- helpers ----------
const qpKey = (uid) => `quest:progress:${uid}`

const toInt = (v, d = 0) => {
  const n = Number.parseInt(String(v ?? '').trim(), 10)
  return Number.isFinite(n) ? n : d
}
const toBool = (v, d = false) => {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return d
  return s === '1' || s === 'true' || s === 'yes'
}

const normalizeCardId = (x) => {
  const m = String(x ?? '').match(/(\d+)$/)
  return m ? m[1] : String(x ?? '')
}

async function getUid(req) {
  const hx = (req.headers.get('x-forum-user') || '').trim()
  if (hx) return hx
  try { return await requireUserId(req) } catch {}
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
        return j && typeof j === 'object' ? j : {}
      } catch { return {} }
    }
    return {}
  } catch { return {} }
}

// ---- ENV adapters (те же правила, что в /api/quest/progress) ----
function getGlobalDefaultsFromEnv(env) {
  return {
    tasksPerCard: Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASKS_PER_CARD, 10)),
  }
}
function getCardTaskCount(env, cardNum, defaults) {
  return Math.max(
    0,
    toInt(env[`NEXT_PUBLIC_QUEST_CARD_${cardNum}_TASK_COUNT`], defaults.tasksPerCard)
  )
}
function getCardEnabled(env, cardNum) {
  return toBool(env[`NEXT_PUBLIC_QUEST_CARD_${cardNum}_ENABLED`], true)
}

// ---------- GET /api/quest/status?cardId=... ----------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawCardId = searchParams.get('cardId')
    if (!rawCardId) {
      return NextResponse.json({ ok: false, error: 'no_cardId' }, { status: 400 })
    }

    const uid = await getUid(req)
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const cardNum = normalizeCardId(rawCardId)   // "quest-1" -> "1"
    const env = process.env
    const defaults = getGlobalDefaultsFromEnv(env)

    // карточка существует/включена?
    if (!getCardEnabled(env, cardNum)) {
      return NextResponse.json({ ok: false, error: 'card_disabled' }, { status: 400 })
    }

    const need = getCardTaskCount(env, cardNum, defaults)

    // читаем прогресс и учитываем оба ключа — "1" и "quest-1"
    const prog = await readProgress(uid)
    const byNum  = prog?.[cardNum] || {}
    const byRaw  = prog?.[rawCardId] || {}
    // выбираем «более полную» запись
    const chosen =
      (Array.isArray(byNum.done) ? byNum.done.length : -1) >= (Array.isArray(byRaw.done) ? byRaw.done.length : -1)
        ? byNum
        : byRaw

    const done = Array.isArray(chosen.done) ? chosen.done.length : 0
    const claimed = !!chosen.claimed

    return NextResponse.json({
      ok: true,
      cardId: cardNum,     // нормализованный номер
      claimed,
      done,
      need,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
