// lib/qcoin.js
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// IMPORTANT: та же нормализация, что и в subscriptions.js
function normalizeWalletLocal(id) {
  if (!id) return ''
  let s = String(id).trim()

  // tguid:123456789 -> 123456789
  if (s.startsWith('tguid:')) {
    s = s.slice('tguid:'.length)
  }

  // если это просто число (Telegram ID) — норм
  if (/^[0-9]{5,20}$/.test(s)) {
    return s
  }

  // если похож на адрес кошелька — приводим к нижнему регистру
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) {
    return s.toLowerCase()
  }

  // fallback — заведомо безопасный обрезанный ID
  return s.slice(0, 64)
}

const QCOIN_KEY = (uid) => `qcoin:${uid}`

/**
 * Добавить QCoin к общему балансу пользователя.
 * Ничего не ломаем в формате ключа, только трогаем поле balance
 * и по желанию обновляем "служебные" тайм-поля, если они уже есть.
 */
export async function addQcoinReward(rawAccountId, amount, meta = {}) {
  const uid = normalizeWalletLocal(rawAccountId)
  if (!uid) {
    return { ok: false, error: 'NO_ACCOUNT' }
  }

  const key = QCOIN_KEY(uid)
  const nowIso = new Date().toISOString()

  // 1) Увеличиваем баланс как float
  let newBalance = 0
  try {
    newBalance = await redis.hincrbyfloat(key, 'balance', amount)
  } catch (e) {
    return { ok: false, error: String(e) }
  }

  // 2) Если ключ уже использовался таймером (seconds / startedAt),
  // НЕ трогаем эти поля. Если их нет — можем мягко инициализировать.
  try {
    const current = await redis.hgetall(key)

    const updates = {}

    if (!current?.startedAt) {
      updates.startedAt = nowIso
    }
    if (!current?.lastActiveAt) {
      updates.lastActiveAt = nowIso
    }
    if (!current?.lastConfirmAt) {
      updates.lastConfirmAt = nowIso
    }

    // carryMs / seconds / paused специально не создаём насильно,
    // чтобы не мешать существующей логике таймера.

    if (Object.keys(updates).length > 0) {
      await redis.hset(key, updates)
    }
  } catch {
    // если что-то пошло не так — это не критично для баланса
  }

  return {
    ok: true,
    uid,
    key,
    balance: newBalance,
    meta,
  }
}
