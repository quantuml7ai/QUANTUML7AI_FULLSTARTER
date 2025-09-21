// lib/subscriptions.js
// Храним VIP в Upstash Redis. Идемпотентность по payment_id.

import { Redis } from '@upstash/redis'

/**
 * Важно: переменные окружения должны быть заданы:
 *  - UPSTASH_REDIS_REST_URL
 *  - UPSTASH_REDIS_REST_TOKEN
 * В проде (Vercel) и локально (.env.local) они уже у тебя есть.
 */
export const redis = Redis.fromEnv()

// Ключи
const VIP_KEY = (wallet) => `vip:${normalizeWallet(wallet)}`
const PAY_SEEN = (paymentId) => `pay:${paymentId}`

// Нормализация ID (кошелёк/аккаунт) — приводим к нижнему регистру и обрезаем пробелы
function normalizeWallet(w) {
  return String(w || '').trim().toLowerCase()
}

/**
 * Вернёт ISO-дату окончания VIP или null
 * Пример: '2025-10-21T15:23:00.000Z'
 */
export async function getVip(wallet) {
  const id = normalizeWallet(wallet)
  if (!id) return null
  return await redis.get(VIP_KEY(id))
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
  const id = normalizeWallet(wallet)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }

  // Идемпотентность по paymentId
  if (paymentId) {
    // nx:true — создать ключ, если его не было; если был → вернётся null
    const seen = await redis.set(PAY_SEEN(paymentId), 1, {
      nx: true,
      ex: 3600 * 24 * 400, // 400 дней храним факт обработки платежа
    })
    if (seen === null) {
      return { ok: true, duplicated: true }
    }
  }

  const key = VIP_KEY(id)
  const currentISO = await redis.get(key)
  const current = currentISO ? new Date(currentISO) : new Date(0)
  const next = new Date(untilISO)

  const final = current > next ? current : next // берём более позднюю дату
  const finalISO = final.toISOString()

  await redis.set(key, finalISO, { ex: 3600 * 24 * 400 })
  return { ok: true, until: finalISO }
}

/**
 * Удобный хелпер: продлить VIP на N дней от «максимума(текущая дата, текущий VIP)».
 * Возвращает то же, что setVip.
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
 * Технический сброс (для тестов): удалить VIP и маркер платежа
 */
export async function _resetVipForTest(wallet, paymentId) {
  const id = normalizeWallet(wallet)
  if (!id) return { ok: false }
  await redis.del(VIP_KEY(id))
  if (paymentId) await redis.del(PAY_SEEN(paymentId))
  return { ok: true }
}
