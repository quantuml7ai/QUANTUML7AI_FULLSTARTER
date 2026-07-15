import { randomUUID } from 'node:crypto'
import { redis } from './_db.js'
import { makeHttpError } from './_format.js'

const DEFAULT_LOCK_TTL_SEC = 8

function lockToken() {
  try { return randomUUID() } catch { return `${Date.now()}:${Math.random()}` }
}

async function tryAcquire(key, token, ttlSec) {
  try {
    const result = await redis.set(key, token, { nx: true, ex: ttlSec })
    return result === 'OK' || result === true
  } catch {
    const result = await redis.set(key, token, 'NX', 'EX', ttlSec).catch(() => null)
    return result === 'OK' || result === true
  }
}

async function release(key, token) {
  try {
    const current = await redis.get(key)
    if (String(current || '') === token) await redis.del(key)
  } catch {}
}

export async function withMetaMarketLocks(keys, fn, { ttlSec = DEFAULT_LOCK_TTL_SEC } = {}) {
  const cleanKeys = (Array.isArray(keys) ? keys : []).map((key) => String(key || '').trim()).filter(Boolean)
  const acquired = []
  const token = lockToken()
  try {
    for (const key of cleanKeys) {
      const ok = await tryAcquire(key, token, ttlSec)
      if (!ok) throw makeHttpError('busy_retry', 409)
      acquired.push(key)
    }
    return await fn()
  } finally {
    await Promise.all(acquired.reverse().map((key) => release(key, token)))
  }
}
