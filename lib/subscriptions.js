// lib/subscriptions.js
// Храним VIP в Upstash Redis. Идемпотентность по payment_id.

import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

// Ключи
const VIP_KEY = (wallet) => `vip:${normalizeWallet(wallet)}`
const PAY_SEEN = (paymentId) => `pay:${paymentId}`

// Доп. ключи для перекрёстных связок
const ACC_KEY    = (addr) => `acc:${addr}`       // HASH { tg_id: <uid> }
const TG_UID_KEY = (uid)  => `tg:uid:${uid}`     // STRING "<0x...>"

// ✅ НОРМАЛИЗАЦИЯ ID:
// принимает и чистый accountId, и ошибочно переданный order_id формата "vipplus:<id>:<ts>"
function normalizeWallet(w) {
  let s = String(w || '').trim().toLowerCase()
  if (!s) return ''

  // если пришёл весь order_id → вытащим серединку
  // vipplus:<accountId>:<ts>
  if (s.startsWith('vipplus:')) {
    const parts = s.split(':')
    s = parts[1] || '' // только <accountId>
  }

  // поддержка Telegram-идентификаторов: tguid:<id> | tg:<id>
  if (s.startsWith('tguid:')) s = s.slice('tguid:'.length)
  else if (s.startsWith('tg:')) s = s.slice('tg:'.length)

  // НЕ режем оставшиеся ':' — позволяем ID содержать двоеточия.
  return s
}

// Вспомогательная: чтение VIP по конкретному id с миграцией legacy vip:vipplus:<id>
async function _tryVipById(id) {
  if (!id) return null

  // основной ключ
  const v = await redis.get(VIP_KEY(id))
  if (v) return v

  // legacy → миграция на канонический ключ
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
 * Вернёт ISO-дату окончания VIP или null.
 * Если найдём старый ключ вида vip:vipplus:<id>, автоматически мигрируем в vip:<id>.
 * Плюс перекрёстное чтение между 0x-адресом и tg uid (в обе стороны).
 */
export async function getVip(wallet) {
  const raw = String(wallet ?? '').trim() // исходный вид (может быть checksum-case)
  const id = normalizeWallet(wallet)
  if (!id) return null

  // 1) прямое чтение по переданному id
  const direct = await _tryVipById(id)
  if (direct) return direct

  // 2) если это 0x-адрес → попробуем найти привязанный tg_id в acc:<0x...>
  if (id.startsWith('0x')) {
    try {
      // сначала по нормализованному (lowercase) ключу
      let tgId = await redis.hget(ACC_KEY(id), 'tg_id')
      // если не нашли — пробуем по "сырому" адресу (checksum-case), как мог быть записан в БД
      if (!tgId && raw.toLowerCase().startsWith('0x')) {
        tgId = await redis.hget(ACC_KEY(raw), 'tg_id')
      }
      if (tgId) {
        const viaTg = await _tryVipById(String(tgId))
        if (viaTg) {
          // зеркалим для ускорения будущих вызовов
          await redis.set(VIP_KEY(id), viaTg, { ex: 3600 * 24 * 400 })
          return viaTg
        }
      }
    } catch {
      /* noop */
    }
  }

  // 3) если это похоже на tg uid (целое число) → посмотрим связанный 0x-адрес
  if (/^\d+$/.test(id)) {
    try {
      const addr = await redis.get(TG_UID_KEY(id)) // "0x...."
      if (addr) {
        const addrNorm = String(addr).toLowerCase()
        const viaAddr = await _tryVipById(addrNorm)
        if (viaAddr) {
          // зеркалим в канонический ключ по uid для ускорения будущих вызовов
          await redis.set(VIP_KEY(id), viaAddr, { ex: 3600 * 24 * 400 })
          return viaAddr
        }
      }
    } catch {
      /* noop */
    }
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
  // ВАЖНО: wrongKey считаем без normalizeWallet, чтобы поймать реально записанный ключ
  const wrongKey = `vip:${String(idRaw || '').trim().toLowerCase()}`
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
