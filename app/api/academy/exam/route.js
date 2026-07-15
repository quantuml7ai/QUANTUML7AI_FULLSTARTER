// app/api/academy/exam/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import academyPrimary from '@/lib/mongo/academy-primary.cjs'
import qcoinPrimary from '@/lib/mongo/qcoin-primary.cjs'
import identityContract from '@/lib/identity/ql7IdentityContract.cjs'



// РєР°Р¶РґС‹Рµ СЃРєРѕР»СЊРєРѕ РїСЂР°РІРёР»СЊРЅС‹С… СѓРґРІР°РёРІР°РµРј РЅР°РіСЂР°РґСѓ
const DOUBLE_EVERY = 5

// ===== С‡С‚РµРЅРёРµ ENV (Рё РїСЂРёРІР°С‚РЅС‹С…, Рё NEXT_PUBLIC) =====
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

// Р±Р°Р·РѕРІР°СЏ РЅР°РіСЂР°РґР° Р·Р° РІРѕРїСЂРѕСЃ (Р±РµР· СѓС‡С‘С‚Р° VIP)
const BASE_REWARD = readNumberEnv(
  ['ACADEMY_EXAM_BASE_REWARD', 'NEXT_PUBLIC_ACADEMY_EXAM_BASE_REWARD'],
  0.01 // РґРµС„РѕР»С‚, РµСЃР»Рё ENV РЅРµ Р·Р°РґР°Р»Рё
)

// С‚Р°Р№РјРµСЂ РјРµР¶РґСѓ РІРѕРїСЂРѕСЃР°РјРё (СЃРµРєСѓРЅРґС‹)
const COOLDOWN_SEC = readNumberEnv(
  [
    'ACADEMY_EXAM_COOLDOWN_SECONDS',
    'NEXT_PUBLIC_ACADEMY_EXAM_COOLDOWN_SECONDS',
  ],
  180 // 3 РјРёРЅСѓС‚С‹ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
)

// СЃРєРѕР»СЊРєРѕ РІРѕРїСЂРѕСЃРѕРІ РІ Р±Р»РѕРєРµ (РјРѕР¶РЅРѕ РїРµСЂРµРѕРїСЂРµРґРµР»РёС‚СЊ РІ ENV)
function getBlockTotal(blockId) {
  const envName  = `ACADEMY_EXAM_BLOCK_${blockId}_TOTAL`
  const envName2 = `NEXT_PUBLIC_ACADEMY_EXAM_BLOCK_${blockId}_TOTAL`
  const raw = process.env[envName] || process.env[envName2]
  const num = raw ? Number(raw) : NaN
  if (Number.isFinite(num) && num > 0) return num

  // РґРµС„РѕР»С‚РЅР°СЏ РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ РїРѕ С‚РІРѕРµР№ РђРєР°РґРµРјРёРё:
  if (blockId === 29) return 70
  return 50
}

// СЃС‡РёС‚Р°РµРј РЅР°РіСЂР°РґСѓ Р·Р° N-Р№ РїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚ (N >= 1)
function calcReward(base, correctCount, isVip) {
  if (!base || base <= 0 || correctCount <= 0) return 0
  const step = Math.floor((correctCount - 1) / DOUBLE_EVERY) // 0..в€ћ
  const mult = Math.pow(2, step)
  const vipMult = isVip ? 2 : 1
  return base * mult * vipMult
}

// РЅР°РіСЂР°РґР° Р·Р° СЃР»РµРґСѓСЋС‰РёР№ РїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚
function calcNextReward(base, correctCount, isVip) {
  return calcReward(base, correctCount + 1, isVip)
}

// С‡С‚РµРЅРёРµ UID РёР· Р·Р°РїСЂРѕСЃР° (РєР°Рє РІ qcoin-СЂРѕСѓС‚Р°С…)
function getUidFromReq(req, body) {
  const hx =
    (req.headers.get('x-forum-user') ||
      req.headers.get('x-forum-user-id') ||
      req.headers.get('x-auth-account-id') ||
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

async function resolveAcademyIdentity(rawUid) {
  const raw = String(rawUid || '').trim()
  if (!raw) return { userId: '', aliases: [] }
  const identity = await identityContract.resolve(raw, {
    mode: 'academy-exam',
    source: 'app/api/academy/exam/route.js',
  }).catch(() => null)
  const userId = String(identity?.canonicalAccountId || identity?.exactEtalonUid || raw).trim()
  const aliases = Array.from(new Set([
    raw,
    identity?.rawInputId,
    identity?.exactEtalonUid,
    identity?.canonicalAccountId,
    ...(Array.isArray(identity?.aliasSet) ? identity.aliasSet : []),
    ...(Array.isArray(identity?.profileLookupOrder) ? identity.profileLookupOrder : []),
  ].map((value) => String(value || '').trim()).filter(Boolean)))
  return { userId: userId || raw, aliases }
}

// РїСЂРёР·РЅР°Рє VIP РёР· Р·Р°РіРѕР»РѕРІРєР° (С„СЂРѕРЅС‚ С€Р»С‘С‚ x-forum-vip: "1")
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
 * - РµСЃР»Рё СЋР·РµСЂ РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ в†’ ok:true, authed:false, РїСЂРѕРіСЂРµСЃСЃ 0
 * - РµСЃР»Рё Р°РІС‚РѕСЂРёР·РѕРІР°РЅ в†’ РѕС‚РґР°С‘Рј РµРіРѕ СЃРѕСЃС‚РѕСЏРЅРёРµ РїРѕ Р±Р»РѕРєСѓ
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
    const rawUid = getUidFromReq(req, null)
    const { userId: uid, aliases } = await resolveAcademyIdentity(rawUid)
    const isVip = getVipFromReq(req)
    const now = Date.now()

    // РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ вЂ” РїСЂРѕСЃС‚Рѕ РѕС‚РґР°С‘Рј РєРѕРЅС„РёРі, С‡С‚РѕР±С‹ С„СЂРѕРЅС‚ Р·РЅР°Р» РЅР°РіСЂР°РґС‹
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

    const h = await academyPrimary.readExamState({ userId: uid, blockId, aliases })
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
 * РўСЂРµР±СѓРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёСЋ. РќР°С‡РёСЃР»СЏРµС‚ QCoin, РѕР±РЅРѕРІР»СЏРµС‚ РїСЂРѕРіСЂРµСЃСЃ.
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

    const rawUid = getUidFromReq(req, body)
    const { userId: uid, aliases } = await resolveAcademyIdentity(rawUid)
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
      // Р·Р°С‰РёС‚Р° РѕС‚ РЅРµРІРµСЂРЅРѕР№ РєРѕРЅС„РёРіСѓСЂР°С†РёРё
      return NextResponse.json(
        { ok: false, error: 'no_reward_config' },
        { status: 500 }
      )
    }

    const h = await academyPrimary.readExamState({ userId: uid, blockId, aliases })
    let done = 0
    let correct = 0
    let cooldownUntil = 0

    if (h && Object.keys(h).length) {
      done = Number(h.done || 0)
      correct = Number(h.correct || 0)
      cooldownUntil = Number(h.cooldownUntil || 0)
    }

    // СЌРєР·Р°РјРµРЅ СѓР¶Рµ РїСЂРѕР№РґРµРЅ
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

    // Р·Р°С‰РёС‚Р° РѕС‚ СЃРїР°РјР°: РµСЃР»Рё С‚Р°Р№РјРµСЂ РЅРµ РёСЃС‚С‘Рє вЂ” 429
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

      // РЅР°С‡РёСЃР»СЏРµРј QCoin РЅР° РѕСЃРЅРѕРІРЅРѕР№ Р±Р°Р»Р°РЅСЃ,
      try {
        await qcoinPrimary.incrementBalance({
          uid,
          amount: awarded,
          eventKind: 'academy_exam_reward',
          route: '/api/academy/exam',
          sourceEventId: `academy:exam:${uid}:${blockId}:${done}`,
          idempotencyKey: `academy:exam:${uid}:${blockId}:${done}`,
          meta: {
            blockId,
            correct,
            vip: isVip ? 1 : 0,
          },
        })
      } catch {
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

    await academyPrimary.writeExamState({ userId: uid, blockId, state: {
      done,
      correct,
      cooldownUntil,
      updatedAt: now,
    } })

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
