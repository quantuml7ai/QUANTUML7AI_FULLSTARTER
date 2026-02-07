// app/api/qcoin/drop/route.js

import { Redis } from '@upstash/redis'
import { json, bad, requireUserId } from '../../forum/_utils.js'

const redis = Redis.fromEnv()

function readNumberEnv (names, fallback) {
  for (const name of names) {
    const raw = process.env?.[name]
    if (!raw) continue
    const v = Number(raw)
    if (Number.isFinite(v)) return v
  }
  return fallback
}

// Сколько QCOIN даёт одна монета.
// Можно настроить через env: QCOIN_DROP_REWARD или NEXT_PUBLIC_QCOIN_DROP_REWARD
const DROP_REWARD_QCOIN = readNumberEnv(
  ['QCOIN_DROP_REWARD', 'NEXT_PUBLIC_QCOIN_DROP_REWARD'],
  0.01, // дефолт, если env не заданы
)

// Разрешённые множители награды (должны совпадать с клиентом)
// Любые другие значения будут проигнорированы и заменены на 1
const ALLOWED_MULTIPLIERS = [0, 0.2, 1 / 3, 0.5, 1, 2, 3, 5]

const qcoinKey = (uid) => `qcoin:${uid}`

export async function POST (req) {
  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  let uidRaw
  try {
    // та же схема, что и у рефералок — читает accountId/headers и т.п.
    uidRaw = requireUserId(req, body || undefined)
  } catch (err) {
    const status = err?.status || 401
    const msg = err?.message || 'unauthorized'
    return bad(msg, status)
  }

  const uid = String(uidRaw || '').trim()
  if (!uid || !/^[A-Za-z0-9_:.\\-]{1,80}$/.test(uid)) {
    return bad('invalid_user_id', 400)
  }

  const baseReward = DROP_REWARD_QCOIN
  if (!Number.isFinite(baseReward) || baseReward <= 0) {
    return bad('invalid_qcoin_reward', 500)
  }

  // multiplier может прислать клиент, но мы применяем ТОЛЬКО из whitelist
  // если не прислал или прислал мусор — считаем x1
  let multRaw = body && typeof body === 'object' ? body.multiplier : undefined
  let mult = Number(multRaw)
  if (!Number.isFinite(mult)) mult = 1

  // допускаем небольшую погрешность (на случай 0.3333333)
  const EPS = 1e-6
  const allowed = ALLOWED_MULTIPLIERS.find((m) => Math.abs(m - mult) <= EPS)
  const multiplierApplied = Number.isFinite(allowed) ? allowed : 1

  // итоговая награда, которая реально начисляется
  const reward = baseReward * multiplierApplied

  const key = qcoinKey(uid)

  let newBalance
  try {
    // основной путь — атомарное увеличение баланса
    newBalance = await redis.hincrbyfloat(key, 'balance', reward)
  } catch (err) {
    // фолбэк, если вдруг нет hincrbyfloat / что-то пошло не так
    const currentRaw = await redis.hget(key, 'balance')
    const current = Number(currentRaw || 0) || 0
    newBalance = current + reward
    await redis.hset(key, {
      balance: String(newBalance),
    })
  }

  const balance = Number(newBalance || 0) || 0
  const nowIso = new Date().toISOString()

  // чуть метаданных — когда последний раз обновляли
  try {
    await redis.hset(key, {
      updated_at: nowIso,
    })
  } catch (e) {
    // телеметрию/лог здесь при желании
  }

  return json({
    ok: true,
    uid,
    rewardQcoin: reward,          // ✅ финальная награда (уже с множителем)
    multiplierApplied,            // ✅ множитель, который реально применили
    baseRewardQcoin: baseReward,  // ✅ база (без множителя)
    balance,
    updatedAt: nowIso,
  })
}
