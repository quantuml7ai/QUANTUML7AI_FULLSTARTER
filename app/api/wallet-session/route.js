import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_PREFIX = 'ql7ws_'
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30
const memoryStore = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = memoryStore

function nowMs() {
  return Date.now()
}

function getTtlSeconds() {
  const raw = Number(process.env.WALLET_SESSION_TTL_SECONDS || '')
  return Number.isFinite(raw) && raw > 60 ? Math.floor(raw) : DEFAULT_TTL_SECONDS
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
    return
  }
  memoryStore.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 })
}

async function storeGet(key) {
  const redis = getRedis()
  if (redis) return redis.get(key)
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
  if (redis) {
    await redis.del(key)
    return
  }
  memoryStore.delete(key)
}

function sessionKey(token) {
  return `wallet_session:${token}`
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
    createdAt: nowMs(),
    expiresAt,
    logoutAt: null,
  }

  await storeSet(sessionKey(token), session, ttlSeconds)

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
