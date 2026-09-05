// app/api/quest/progress/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { requireUserId } from '../../forum/_utils.js'
import questPrimary from '@/lib/mongo/quest-primary.cjs'
import qcoinPrimary from '@/lib/mongo/qcoin-primary.cjs'
import economicRoute from '@/lib/economic-integrity/productionRoute.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const redis = Redis.fromEnv()

const claimLockKey = (uid, card)  => `quest:claim_lock:${uid}:${card}`

// ====== small helpers ======
const nowMs = () => Date.now()
const uniqStrings = (arr) => Array.from(new Set((arr || []).map(String)))
const getVipFlag = (req) => (req.headers.get('x-forum-vip') || '').trim() === '1'
const toInt  = (v, d=0) => { const n = Number.parseInt(String(v ?? '').trim(), 10); return Number.isFinite(n) ? n : d }
const toNum  = (v, d=0) => { const n = Number(v); return Number.isFinite(n) ? n : d }
const toBool = (v, d=false) => {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return d
  return s === '1' || s === 'true' || s === 'yes'
}
const normalizeCardId = (x) => {
  const m = String(x ?? '').match(/(\d+)$/)
  return m ? m[1] : String(x ?? '')
}


function getGlobalDefaultsFromEnv(env) {
  return {

    cardCount:   toInt(env.NEXT_PUBLIC_QUEST_CARD_COUNT, toInt(env.NEXT_PUBLIC_QUEST_CARDS, 0)),
    tasksPerCard: Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASKS_PER_CARD, 10)),
    taskDelayMs:  Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASK_DELAY_MS, 15000)),

    claimDelayMs: Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS, 0)),
  }
}
function getCardTaskCount(env, cardNum, defaults) {
  return Math.max(0, toInt(env[`NEXT_PUBLIC_QUEST_CARD_${cardNum}_TASK_COUNT`], defaults.tasksPerCard))
}
function getCardTaskDelayMs(env, cardNum, defaults) {
  return Math.max(0, toInt(env[`NEXT_PUBLIC_QUEST_CARD_${cardNum}_TASK_DELAY_MS`], defaults.taskDelayMs))
}
function getCardEnabled(env, cardNum) {

  return toBool(env[`NEXT_PUBLIC_QUEST_CARD_${cardNum}_ENABLED`], true)
}
function readRewardAmount(env, { rewardKey, cardId }) {

  if (rewardKey) {
    const s = String(env[rewardKey] ?? '').trim()
    const n = Number(s)
    if (Number.isFinite(n) && n > 0) return { ok: true, amount: n, key: rewardKey }
  }

  const k1 = `NEXT_PUBLIC_QUEST${cardId}_REWARD`
  if (env[k1]) {
    const n = Number(env[k1])
    if (Number.isFinite(n) && n > 0) return { ok: true, amount: n, key: k1 }
  }

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
    const progress = await questPrimary.readProgress(uid)
    return progress && typeof progress === 'object' && !Array.isArray(progress) ? progress : {}
  } catch { return {} }
}
async function writeProgress(uid, obj) {
  const safe = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {}
  await questPrimary.writeProgress(uid, safe)
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


    const rawCardId = body.cardId
    const cardId = normalizeCardId(rawCardId)
    const { taskId, claim = false, rewardKey } = body
    if (!cardId) return NextResponse.json({ ok:false, error:'invalid_card' }, { status:400 })


    const env = process.env
    const defaults = getGlobalDefaultsFromEnv(env)


    const enabled = getCardEnabled(env, cardId)
    if (!enabled) return NextResponse.json({ ok:false, error:'card_disabled' }, { status:400 })

    const taskCount   = getCardTaskCount(env, cardId, defaults)
    const taskDelayMs = getCardTaskDelayMs(env, cardId, defaults)


    if (taskId) {
      const tId = String(taskId)
      const validIdx = toInt(taskId, 0)
      if (taskCount > 0 && (validIdx < 1 || validIdx > taskCount)) {
        return NextResponse.json({ ok:false, error:'invalid_task' }, { status:400 })
      }

      const cur    = await readProgress(userId)
      const legacy = cur[String(rawCardId || '')]
      const base   = cur[cardId] || legacy || { done: [] }

      const done = uniqStrings([ ...(base.done || []), tId ])
      const nextDoneCount = done.length


      const nextCard = {
        ...base,
        done,
        ts: nowMs(),
        ...(base.claimReadyTs
          ? { claimReadyTs: base.claimReadyTs }
          : (nextDoneCount >= taskCount ? { claimReadyTs: nowMs() } : {})),
        taskCount,
        taskDelayMs,
      }

      const next = { ...cur, [cardId]: nextCard }
      if (legacy && !cur[cardId]) {

        delete next[String(rawCardId || '')]
      }

      await writeProgress(userId, next)

      const serverClaimable = nextDoneCount >= taskCount
      return NextResponse.json({ ok: true, progress: next, awarded: 0, serverClaimable })
    }


    if (claim) {
      const prog   = await readProgress(userId)
      const legacy = prog[String(rawCardId || '')]
      const card   = prog[cardId] || legacy || {}
      if (card.claimed) {
        return NextResponse.json({ ok:false, error:'already_claimed' }, { status:409 })
      }

      const doneCount = Array.isArray(card.done) ? card.done.length : 0
      if (doneCount < taskCount) {
        return NextResponse.json(
          { ok:false, error:'not_completed', details:{ done: doneCount, need: taskCount } },
          { status:400 }
        )
      }


      const r = readRewardAmount(env, { rewardKey, cardId })
      if (!r.ok) return NextResponse.json({ ok:false, error:r.error }, { status:400 })
      const baseAmount = r.amount
      const amount     = getVipFlag(req) ? (baseAmount * 2) : baseAmount


      const ck = claimLockKey(userId, cardId)
      const nx = await redis.set(ck, nowMs(), { nx: true, ex: 15 })
      if (!nx) return NextResponse.json({ ok:false, error:'already_claimed' }, { status:409 })

      try {
        const sourceEventId = `quest:claim:${userId}:${cardId}`
        await economicRoute.executeVerifiedEconomicOperation({
          routeId: 'quest.reward',
          operationType: 'credit',
          actorAccountId: userId,
          targetAccountId: userId,
          amount,
          sourceEventId,
          idempotencyKey: sourceEventId,
          sourceType: 'quest-completion',
          sourceOwner: 'app/api/quest/progress/route.js',
          sourceEvidence: { userId, cardId, rawCardId: String(rawCardId || ''), rewardKey: String(rewardKey || ''), taskCount, doneCount, vip: getVipFlag(req) === true, amount },
          writer: (decisionReceipt) => qcoinPrimary.incrementBalance({
            uid: userId,
            amount,
            eventKind: 'quest_claim_reward',
            route: '/api/quest/progress',
            economicRouteId: 'quest.reward',
            sourceEventId,
            idempotencyKey: sourceEventId,
            decisionReceipt,
            meta: { cardId, rawCardId: String(rawCardId || ''), rewardKey: String(rewardKey || ''), vip: getVipFlag(req) ? 1 : 0 },
          }),
        })

        const next = {
          ...prog,
          [cardId]: {
            ...(prog[cardId] || legacy || {}),
            claimed: true,
            claimTs: nowMs(),
            taskCount,
            taskDelayMs,
          }
        }
        if (legacy && !prog[cardId]) {
          delete next[String(rawCardId || '')]
        }

        await writeProgress(userId, next)
        return NextResponse.json({ ok: true, progress: next, awarded: amount })
      } catch (error) {
        return NextResponse.json({
          ok:false,
          error:'qcoin_credit_failed',
          message:String(error?.message || error),
        }, { status:500 })
      } finally {
        await redis.del(ck).catch(() => {})
      }
    }


    return NextResponse.json({ ok:false, error:'bad_args' }, { status:400 })

  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:500 })
  }
}
