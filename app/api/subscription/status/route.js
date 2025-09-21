// lib/subscriptions.js
import { redis } from '@/lib/redis'

export async function getVip(accountId) {
  if (!accountId) return { isVip: false, sub: null }
  const sub = await redis.hgetall(`sub:${accountId}`)
  const isVip =
    sub?.tier === 'vip_plus' &&
    (sub?.status === 'active' || sub?.status === 'grace')
  return { isVip: !!isVip, sub: sub || null }
}
