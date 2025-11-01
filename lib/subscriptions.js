// lib/subscriptions.js
// Храним VIP в Upstash Redis. Идемпотентность по payment_id.

import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

// Ключи
const VIP_KEY = (wallet) => `vip:${normalizeWallet(wallet)}`
const PAY_SEEN = (paymentId) => `pay:${paymentId}`

// ✅ НОРМАЛИЗАЦИЯ ID:
// принимает и чистый accountId, и ошибочно переданный order_id формата "vipplus:<id>:<ts>"
function normalizeWallet(w) {
  let s = String(w || '').trim().toLowerCase()

  // если пришёл весь order_id → вытащим серединку
  // vipplus:<accountId>:<ts>
  if (s.startsWith('vipplus:')) {
    const parts = s.split(':')
    if (parts.length >= 2) s = parts[1] // только <accountId>
  }

  // на всякий случай: если остались дополнительные сегменты — берём первый
  if (s.includes(':')) {
    s = s.split(':')[0]
  }

  return s
}

/**
 * Вернёт ISO-дату окончания VIP или null.
 * Если найдём старый ключ вида vip:vipplus:<id>, автоматически мигрируем в vip:<id>.
 */
export async function getVip(wallet) {
  const id = normalizeWallet(wallet)
  if (!id) return null

  // основной ключ
  let v = await redis.get(VIP_KEY(id))
  if (v) return v

  // 👇 миграция со старого ключа (если когда-то записали с префиксом vipplus:)
  const legacyKey = `vip:vipplus:${id}`
  const legacy = await redis.get(legacyKey)
  if (legacy) {
    await redis.set(VIP_KEY(id), legacy, { ex: 3600 * 24 * 400 })
    await redis.del(legacyKey)
    return legacy
  }

  return null
}

/**
 * Проверка «активен ли VIP сейчас»
 * Возвращает объект: { active: boolean, untilISO: string|null, daysLeft: number }
 */
export async function isVipNow(wallet) {
  const untilISO = await getVip(wallet)
  if (!untilISO) return { active: false, untilISO: null, daysLeft: 0 }

  const now = Date.now()
  const until = new Date(untilISO).getTime()
  const active = Number.isFinite(until) && until > now
  const daysLeft = active ? Math.ceil((until - now) / (1000 * 60 * 60 * 24)) : 0
  return { active, untilISO, daysLeft }
}

/**
 * Идемпотентная активация/установка VIP до конкретной даты.
 * - если передан paymentId и он уже был — выходим без изменений (duplicated: true)
 * - если новый until раньше текущего — сохраняем более позднюю дату
 */
export async function setVip(wallet, untilISO, { paymentId } = {}) {
  const idRaw = wallet
  const id = normalizeWallet(wallet)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }

  // Идемпотентность по paymentId
  if (paymentId) {
    const seen = await redis.set(PAY_SEEN(paymentId), 1, {
      nx: true,
      ex: 3600 * 24 * 400,
    })
    if (seen === null) {
      return { ok: true, duplicated: true }
    }
  }

  // если по ошибке передали order_id — мигрируем значение на чистый ключ
  const wrongKey = VIP_KEY(idRaw) // если idRaw был "vipplus:<id>:<ts>" → это не тот ключ
  const rightKey = VIP_KEY(id)

  if (wrongKey !== rightKey) {
    const wrongVal = await redis.get(wrongKey)
    if (wrongVal) {
      await redis.set(rightKey, wrongVal, { ex: 3600 * 24 * 400 })
      await redis.del(wrongKey)
    }
  }

  const currentISO = await redis.get(rightKey)
  const current = currentISO ? new Date(currentISO) : new Date(0)
  const next = new Date(untilISO)
  const final = current > next ? current : next
  const finalISO = final.toISOString()

  await redis.set(rightKey, finalISO, { ex: 3600 * 24 * 400 })
  return { ok: true, until: finalISO }
}

/**
 * Продлить VIP на N дней от «максимума(текущая дата, текущий VIP)».
 */
export async function addVipDays(wallet, days, { paymentId } = {}) {
  const id = normalizeWallet(wallet)
  if (!id || !Number.isFinite(days) || days <= 0) {
    return { ok: false, error: 'BAD_ARGS' }
  }
  const now = new Date()
  const currentISO = await getVip(id)
  const base = currentISO ? new Date(currentISO) : now
  const start = base > now ? base : now
  const until = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  return await setVip(id, until, { paymentId })
}

/**
 * Технический сброс (для тестов)
 */
export async function _resetVipForTest(wallet, paymentId) {
  const id = normalizeWallet(wallet)
  if (!id) return { ok: false }
  await redis.del(VIP_KEY(id))
  if (paymentId) await redis.del(PAY_SEEN(paymentId))
  // зачистим возможный старый ключ
  await redis.del(`vip:vipplus:${id}`)
  return { ok: true }
}
