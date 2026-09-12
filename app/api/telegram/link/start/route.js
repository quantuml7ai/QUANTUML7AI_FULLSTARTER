// app/api/telegram/link/start/route.js
import { randomBytes } from 'crypto'
import { Redis } from '@upstash/redis'
import canonicalUserId from '../../../../../lib/identity/canonical-user-id.cjs'

// Если когда-нибудь решишь вынести на Edge — убери randomBytes и используй crypto.getRandomValues
// export const runtime = 'nodejs';

const WALLET_SESSION_PREFIX = 'ql7ws_'
const walletSessionMemory = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = walletSessionMemory

function clean(value) { return String(value ?? '').trim() }
function sameIdentity(left, right) { return clean(left).toLowerCase() === clean(right).toLowerCase() }
function walletSessionKey(token) { return `wallet_session:${token}` }
function latestWalletSessionKey(accountId) {
  const identity = clean(accountId).toLowerCase()
  return identity ? `wallet_session_latest:${identity}` : ''
}
function getRedis() {
  const url = clean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)
  const token = clean(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  return url && token ? new Redis({ url, token }) : null
}
async function readStoredValue(key, redisClient) {
  if (redisClient) return redisClient.get(key)
  const row = walletSessionMemory.get(key)
  if (!row || Number(row.expiresAt || 0) <= Date.now()) return null
  return row.value || null
}
function latestToken(record) {
  if (!record) return ''
  return clean(typeof record === 'string' ? record : record?.token)
}
function latestStatus(record) {
  if (!record || typeof record === 'string') return 'active'
  return clean(record?.status || 'active').toLowerCase()
}
async function requireVerifiedWalletSession(body = {}, redisClient = getRedis()) {
  const token = clean(body?.walletSessionToken || body?.sessionToken)
  const requestedAccountId = canonicalUserId.normalizeWalletId(body?.accountId)
  const requestedWallet = canonicalUserId.normalizeWalletId(body?.walletAddress || body?.address || requestedAccountId)
  if (!token.startsWith(WALLET_SESSION_PREFIX) || !requestedAccountId || !requestedWallet) return null
  const session = await readStoredValue(walletSessionKey(token), redisClient)
  if (!session || clean(session.status).toLowerCase() !== 'active') return null
  if (Number(session.expiresAt || 0) <= Date.now()) return null
  const sessionWallet = canonicalUserId.normalizeWalletId(session.walletAddress || session.accountId)
  const sessionAccount = canonicalUserId.normalizeWalletId(session.accountId || session.walletAddress)
  if (!sessionWallet || !sessionAccount) return null
  if (!sameIdentity(requestedWallet, sessionWallet) || !sameIdentity(requestedAccountId, sessionAccount)) return null
  const latestKeys = Array.from(new Set([
    latestWalletSessionKey(sessionAccount),
    latestWalletSessionKey(sessionWallet),
  ].filter(Boolean)))
  const latestRecords = await Promise.all(latestKeys.map((key) => readStoredValue(key, redisClient)))
  if (latestRecords.some((record) => (
    record && (latestToken(record) !== token || latestStatus(record) !== 'active')
  ))) return null
  return { token, accountId: sessionAccount, walletAddress: sessionWallet, redisClient }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const walletSession = await requireVerifiedWalletSession(body)
    if (!walletSession) {
      return new Response(
        JSON.stringify({ ok: false, error: 'VERIFIED_WALLET_SESSION_REQUIRED' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      )
    }
    const accountId = walletSession.accountId
    const redisClient = walletSession.redisClient
    if (!redisClient) {
      return new Response(
        JSON.stringify({ ok: false, error: 'LINK_STORAGE_UNAVAILABLE' }),
        { status: 503, headers: { 'content-type': 'application/json' } },
      )
    }

    const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'l7ai_bot')
      .toString()
      .replace('@', '')
      .trim()
    if (!BOT_USERNAME) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_BOT_USERNAME' }), { status: 500 })
    }

    // Одноразовый токен на 10 минут
    const token = randomBytes(16).toString('hex')
    // свяжем token -> accountId c TTL
    await redisClient.set(`tg:link:${token}`, accountId, { ex: 600 })

    const deepLink = `https://t.me/${BOT_USERNAME}?start=ql7link_${token}`

    return new Response(
      JSON.stringify({ ok: true, token, deepLink }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
