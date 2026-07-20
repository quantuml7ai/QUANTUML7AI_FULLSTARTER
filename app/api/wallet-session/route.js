import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { notifyQl7Welcome } from '../../../lib/ql7-support/events.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_PREFIX = 'ql7ws_'
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30
const LATEST_SESSION_PREFIX = 'wallet_session_latest:'
const memoryStore = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = memoryStore
const redisReadCache = globalThis.__QL7_WALLET_SESSION_READ_CACHE__ || new Map()
const redisReadInflight = globalThis.__QL7_WALLET_SESSION_READ_INFLIGHT__ || new Map()
globalThis.__QL7_WALLET_SESSION_READ_CACHE__ = redisReadCache
globalThis.__QL7_WALLET_SESSION_READ_INFLIGHT__ = redisReadInflight

function nowMs() {
  return Date.now()
}

function getTtlSeconds() {
  const raw = Number(process.env.WALLET_SESSION_TTL_SECONDS || '')
  return Number.isFinite(raw) && raw > 60 ? Math.floor(raw) : DEFAULT_TTL_SECONDS
}

function getProcessCacheMs() {
  const raw = Number(process.env.WALLET_SESSION_PROCESS_CACHE_MS || '')
  if (!Number.isFinite(raw) || raw <= 0) return 1500
  return Math.max(200, Math.min(Math.floor(raw), 5000))
}

function cloneSessionValue(value) {
  if (value == null) return null
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

function readCacheGet(key) {
  const row = redisReadCache.get(key)
  if (!row) return undefined
  if (Number(row.expiresAt || 0) <= nowMs()) {
    redisReadCache.delete(key)
    return undefined
  }
  return cloneSessionValue(row.value)
}

function readCacheSet(key, value) {
  if (!key || value == null) return
  const ttlMs = getProcessCacheMs()
  if (ttlMs <= 0) return
  const now = nowMs()
  if (redisReadCache.size > 512) {
    for (const [cacheKey, row] of redisReadCache) {
      if (Number(row?.expiresAt || 0) <= now) redisReadCache.delete(cacheKey)
      if (redisReadCache.size <= 512) break
    }
  }
  redisReadCache.set(key, {
    value: cloneSessionValue(value),
    expiresAt: now + ttlMs,
  })
}

function readCacheDelete(key) {
  redisReadCache.delete(key)
  redisReadInflight.delete(key)
}

function canPersistReadCache(key) {
  return !String(key || '').startsWith(LATEST_SESSION_PREFIX)
}

function isValidEvmAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim())
}

function normalizeAddress(value) {
  return String(value || '').trim()
}

function sameAddress(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase()
}

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'cache-control': 'no-store, max-age=0',
    },
  })
}

function secureId(size = 32) {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += String.fromCharCode(b)
  return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  return new Redis({ url, token })
}

async function storeSet(key, value, ttlSeconds) {
  const redis = getRedis()
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds })
    if (canPersistReadCache(key)) readCacheSet(key, value)
    else readCacheDelete(key)
    return
  }
  memoryStore.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 })
}

async function storeGet(key) {
  const redis = getRedis()
  if (redis) {
    if (canPersistReadCache(key)) {
      const cached = readCacheGet(key)
      if (cached !== undefined) return cached
    }
    const inflight = redisReadInflight.get(key)
    if (inflight) return inflight
    const promise = redis.get(key)
      .then((value) => {
        if (value != null && canPersistReadCache(key)) readCacheSet(key, value)
        return cloneSessionValue(value)
      })
      .finally(() => {
        redisReadInflight.delete(key)
      })
    redisReadInflight.set(key, promise)
    return promise
  }
  const row = memoryStore.get(key)
  if (!row) return null
  if (Number(row.expiresAt || 0) <= nowMs()) {
    memoryStore.delete(key)
    return null
  }
  return row.value || null
}

async function storeDelete(key) {
  const redis = getRedis()
  readCacheDelete(key)
  if (redis) {
    await redis.del(key)
    return
  }
  memoryStore.delete(key)
}

function sessionKey(token) {
  return `wallet_session:${token}`
}

function latestSessionKey(identity) {
  const key = normalizeIdentity(identity)
  return key ? `${LATEST_SESSION_PREFIX}${key}` : ''
}

function getSessionIdentities(session, extra = []) {
  return Array.from(new Set([
    session?.walletAddress,
    session?.accountId,
    ...extra,
  ].map(normalizeIdentity).filter(Boolean)))
}

function readLatestToken(record) {
  if (!record) return ''
  if (typeof record === 'string') return record
  return String(record?.token || '').trim()
}

function readLatestStatus(record) {
  if (!record || typeof record === 'string') return 'active'
  return String(record?.status || 'active').trim().toLowerCase()
}

async function writeLatestSession(session, token, ttlSeconds, status = 'active') {
  const identities = getSessionIdentities(session)
  if (!identities.length) return
  const record = {
    token,
    status,
    walletAddress: session.walletAddress,
    accountId: session.accountId || session.walletAddress,
    updatedAt: nowMs(),
    expiresAt: session.expiresAt || nowMs() + ttlSeconds * 1000,
  }
  await Promise.all(identities.map((identity) => storeSet(latestSessionKey(identity), record, ttlSeconds)))
}

async function ensureSessionIsLatest(token, session, candidates = []) {
  const identities = getSessionIdentities(session, candidates)
  if (!identities.length) return { ok: false, error: 'missing_identity' }

  const records = await Promise.all(identities.map(async (identity) => ({
    identity,
    record: await storeGet(latestSessionKey(identity)),
  })))
  const existing = records.filter((row) => row.record)

  if (!existing.length) {
    await writeLatestSession(session, token, getTtlSeconds(), 'active')
    return { ok: true, backfilled: true }
  }

  const stale = existing.find(({ record }) => {
    const latestToken = readLatestToken(record)
    const latestStatus = readLatestStatus(record)
    return latestToken !== token || latestStatus !== 'active'
  })
  if (stale) return { ok: false, error: readLatestStatus(stale.record) === 'logout' ? 'logged_out' : 'stale_session' }

  const missing = records.filter((row) => !row.record)
  if (missing.length) {
    await writeLatestSession(session, token, getTtlSeconds(), 'active')
  }
  return { ok: true }
}

async function markLatestLoggedOutIfCurrent(token, session) {
  const identities = getSessionIdentities(session)
  if (!identities.length) return
  const ttlSeconds = Math.min(getTtlSeconds(), 60 * 60 * 24 * 7)
  const logoutRecord = {
    token,
    status: 'logout',
    walletAddress: session.walletAddress,
    accountId: session.accountId || session.walletAddress,
    updatedAt: nowMs(),
    expiresAt: nowMs() + ttlSeconds * 1000,
  }
  await Promise.all(identities.map(async (identity) => {
    const key = latestSessionKey(identity)
    const current = await storeGet(key)
    const currentToken = readLatestToken(current)
    if (current && currentToken && currentToken !== token) return
    await storeSet(key, logoutRecord, ttlSeconds)
  }))
}

async function createSession(body) {
  const walletAddress = normalizeAddress(body.walletAddress || body.address || body.accountId)
  if (!isValidEvmAddress(walletAddress)) {
    return json({ ok: false, error: 'bad_wallet_address' }, 400)
  }

  const ttlSeconds = getTtlSeconds()
  const token = TOKEN_PREFIX + secureId(36)
  const expiresAt = nowMs() + ttlSeconds * 1000
  const accountId = normalizeAddress(body.accountId || walletAddress)
  const provider = String(body.provider || body.connectorName || 'wallet').slice(0, 80)
  const session = {
    walletAddress,
    accountId,
    provider,
    status: 'active',
    latestBound: true,
    createdAt: nowMs(),
    expiresAt,
    logoutAt: null,
  }

  await storeSet(sessionKey(token), session, ttlSeconds)
  await writeLatestSession(session, token, ttlSeconds, 'active')
  await notifyQl7Welcome({
    userId: accountId,
    userAliases: [walletAddress],
    registeredAt: new Date(session.createdAt).toISOString(),
  }).catch((error) => {
    console.warn('[ql7-support:welcome]', error?.message || error)
  })

  return json({
    ok: true,
    authorized: true,
    token,
    walletAddress,
    accountId,
    provider,
    expiresAt,
  })
}

async function verifySession(body) {
  const token = String(body.token || '').trim()
  const walletAddress = normalizeAddress(body.walletAddress || body.address || body.accountId)
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return json({ ok: false, authorized: false, error: 'bad_token' }, 401)
  }
  if (!isValidEvmAddress(walletAddress)) {
    return json({ ok: false, authorized: false, error: 'bad_wallet_address' }, 400)
  }

  const session = await storeGet(sessionKey(token))
  if (!session) return json({ ok: false, authorized: false, error: 'not_found' }, 401)
  if (session.status !== 'active') return json({ ok: false, authorized: false, error: session.status || 'inactive' }, 401)
  if (Number(session.expiresAt || 0) <= nowMs()) {
    await storeDelete(sessionKey(token))
    return json({ ok: false, authorized: false, error: 'expired' }, 401)
  }
  if (!sameAddress(walletAddress, session.walletAddress) && !sameAddress(walletAddress, session.accountId)) {
    return json({ ok: false, authorized: false, error: 'wallet_mismatch' }, 401)
  }

  const latest = await ensureSessionIsLatest(token, session, [walletAddress, body.accountId])
  if (!latest.ok) {
    session.status = latest.error || 'stale_session'
    session.logoutAt = nowMs()
    await storeSet(sessionKey(token), session, Math.min(getTtlSeconds(), 60 * 60 * 24 * 7))
    return json({ ok: false, authorized: false, error: latest.error || 'stale_session' }, 401)
  }

  return json({
    ok: true,
    authorized: true,
    walletAddress: session.walletAddress,
    accountId: session.accountId || session.walletAddress,
    provider: session.provider || 'wallet',
    expiresAt: session.expiresAt,
  })
}

async function logoutSession(body) {
  const token = String(body.token || '').trim()
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return json({ ok: true, loggedOut: true })
  }
  const key = sessionKey(token)
  const session = await storeGet(key)
  if (session) {
    session.status = 'logout'
    session.logoutAt = nowMs()
    await storeSet(key, session, Math.min(getTtlSeconds(), 60 * 60 * 24 * 7))
    await markLatestLoggedOutIfCurrent(token, session)
  }
  return json({ ok: true, loggedOut: true })
}

export async function POST(req) {
  let body = null
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400)
  }

  const action = String(body?.action || '').trim().toLowerCase()
  try {
    if (action === 'create') return await createSession(body || {})
    if (action === 'verify') return await verifySession(body || {})
    if (action === 'logout') return await logoutSession(body || {})
    return json({ ok: false, error: 'unknown_action' }, 400)
  } catch (err) {
    console.error('[wallet-session] failed', err)
    return json({ ok: false, error: 'server_error' }, 500)
  }
}
