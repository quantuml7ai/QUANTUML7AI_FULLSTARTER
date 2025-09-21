// lib/subscriptions.js
// Храним VIP в Upstash Redis. Идемпотентность по payment_id.

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const VIP_KEY = (wallet) => `vip:${String(wallet || '').toLowerCase()}`;
const PAY_SEEN = (paymentId) => `pay:${paymentId}`;

/**
 * Вернуть ISO-дату окончания VIP или null
 */
export async function getVip(wallet) {
  if (!wallet) return null;
  return await redis.get(VIP_KEY(wallet));
}

/**
 * Идемпотентная активация VIP.
 * - если paymentId уже обрабатывался — выходим без изменений
 * - если новый until раньше текущего — сохраняем более позднюю дату
 */
export async function setVip(wallet, untilISO, { paymentId } = {}) {
  if (!wallet || !untilISO) return { ok: false, error: 'BAD_ARGS' };

  // Идемпотентность по paymentId
  if (paymentId) {
    // nx: true => создать ключ, если его не было (впервые видим этот платеж)
    const seen = await redis.set(PAY_SEEN(paymentId), 1, {
      nx: true,
      ex: 3600 * 24 * 400, // 400 дней хранить факт обработки
    });
    if (seen === null) {
      return { ok: true, duplicated: true }; // уже обрабатывали этот paymentId
    }
  }

  const key = VIP_KEY(wallet);
  const currentISO = await redis.get(key);
  const current = currentISO ? new Date(currentISO) : new Date(0);
  const next = new Date(untilISO);

  const final = current > next ? current : next; // выбираем более позднюю дату
  await redis.set(key, final.toISOString(), { ex: 3600 * 24 * 400 });

  return { ok: true, until: final.toISOString() };
}
