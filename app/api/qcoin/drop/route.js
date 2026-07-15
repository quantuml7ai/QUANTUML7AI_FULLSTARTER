// app/api/qcoin/drop/route.js
import { json, bad, requireUserId } from '../../forum/_utils.js'
import qcoinPrimary from '../../../../lib/mongo/qcoin-primary.cjs'

function readNumberEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env?.[name]
    if (!raw) continue
    const value = Number(raw)
    if (Number.isFinite(value)) return value
  }
  return fallback
}

const DROP_REWARD_QCOIN = readNumberEnv(
  ['QCOIN_DROP_REWARD', 'NEXT_PUBLIC_QCOIN_DROP_REWARD'],
  0.01,
)

function readIntegerEnv(names, fallback) {
  const raw = readNumberEnv(names, fallback)
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.floor(n)
}

const MIN_MULTIPLIER = 1
const MAX_MULTIPLIER = Math.max(
  MIN_MULTIPLIER,
  readIntegerEnv(['QCOIN_DROP_MAX_MULT', 'NEXT_PUBLIC_QCOIN_DROP_MAX_MULT'], 100),
)

function normalizeMultiplier(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 1
  const int = Math.floor(n)
  return Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, int))
}

export async function POST(req) {
  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  let uidRaw
  try {
    uidRaw = requireUserId(req, body || undefined)
  } catch (err) {
    return bad(err?.message || 'unauthorized', err?.status || 401)
  }

  const uid = String(uidRaw || '').trim()
  if (!uid || !/^[A-Za-z0-9_:.\\-]{1,80}$/.test(uid)) {
    return bad('invalid_user_id', 400)
  }

  const baseReward = DROP_REWARD_QCOIN
  if (!Number.isFinite(baseReward) || baseReward <= 0) {
    return bad('invalid_qcoin_reward', 500)
  }

  const multiplierApplied = normalizeMultiplier(body && typeof body === 'object' ? body.multiplier : undefined)
  const reward = baseReward * multiplierApplied
  const nowIso = new Date().toISOString()
  const sourceEventId = String((body && (body.clientEventId || body.dropId || body.eventId)) || `drop:${uid}:${nowIso}:${multiplierApplied}:${reward}`)

  try {
    const result = await qcoinPrimary.incrementBalance({
      uid,
      amount: reward,
      eventKind: 'qcoin_drop_reward',
      route: '/api/qcoin/drop',
      sourceEventId,
      idempotencyKey: body?.idempotencyKey ? `qcoin:drop:${uid}:${String(body.idempotencyKey)}` : '',
      meta: {
        baseRewardQcoin: baseReward,
        multiplierApplied,
        updatedAt: nowIso,
      },
    })
    return json({
      ok: true,
      uid,
      rewardQcoin: reward,
      multiplierApplied,
      baseRewardQcoin: baseReward,
      balance: Number(result?.balance || 0) || 0,
      updatedAt: nowIso,
      storagePrimary: 'mongo',
    })
  } catch (error) {
    return bad(String(error?.message || error), 500)
  }
}
