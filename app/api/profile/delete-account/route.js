// app/api/profile/delete-account/route.js
// QL7_ACCOUNT_DELETE_ROUTE_V7_SYNTHETIC_SMOKE_SAFE
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'
import { resolveCanonicalAccountId } from '../_identity.js'
import accountDeletionPrimary from '../../../../lib/mongo/account-deletion-primary.cjs'

const WALLET_SESSION_PREFIX = 'ql7ws_'
const TELEGRAM_DELETE_MAX_AGE_SECONDS = Math.max(300, Math.min(86400, Number(process.env.QL7_ACCOUNT_DELETE_TMA_MAX_AGE_SECONDS || 900) || 900))
const walletSessionMemory = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = walletSessionMemory

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  pragma: 'no-cache',
  expires: '0',
}

function clean(value) { return String(value ?? '').trim() }
function sameIdentity(a, b) { return clean(a).toLowerCase() === clean(b).toLowerCase() }
function isValidWalletAddress(value) { return /^0x[a-fA-F0-9]{40}$/.test(clean(value)) }
function isSyntheticSmokeAccountId(value) { return /^0x71d7de1e7e[0-9a-f]{30}$/i.test(clean(value)) }
function extractSyntheticSmokeSeed(value) {
  const raw = clean(value)
  const match = raw.match(/(\d{10,})$/)
  return match ? match[1] : ''
}
function walletSessionKey(token) { return `wallet_session:${token}` }
function parseTelegramInitData(raw) {
  if (!raw) return null
  let value = String(raw)
  if (value.startsWith('#tgWebAppData=')) value = value.slice('#tgWebAppData='.length)
  if (value.startsWith('?tgWebAppData=')) value = value.slice('?tgWebAppData='.length)
  if (value.startsWith('#')) value = value.slice(1)
  if (value.startsWith('?')) value = value.slice(1)
  try { value = decodeURIComponent(value) } catch {}
  const params = new URLSearchParams(value)
  const out = {}
  for (const [key, val] of params.entries()) out[key] = val
  return out
}
function verifyTelegramInitData(obj, botToken) {
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'telegram_no_data' }
  if (!obj.hash) return { ok: false, error: 'telegram_no_hash' }
  if (!botToken) return { ok: false, error: 'telegram_bot_token_missing' }
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const checkString = Object.keys(obj)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${obj[key]}`)
    .join('\n')
  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  const got = String(obj.hash || '').toLowerCase()
  if (calc !== got) return { ok: false, error: 'telegram_bad_hash' }

  const authDateSeconds = Number(obj.auth_date || 0)
  if (!Number.isFinite(authDateSeconds) || authDateSeconds <= 0) {
    return { ok: false, error: 'telegram_auth_date_missing' }
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  const authAgeSeconds = nowSeconds - authDateSeconds
  if (authAgeSeconds < -60) return { ok: false, error: 'telegram_auth_date_future' }
  if (authAgeSeconds > TELEGRAM_DELETE_MAX_AGE_SECONDS) {
    return { ok: false, error: 'telegram_auth_date_expired', authAgeSeconds }
  }
  return { ok: true, error: null, data: obj, authAgeSeconds, authDateSeconds }
}
function extractTelegramUserId(data) {
  try {
    if (data?.user) {
      const user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user
      const id = user?.id || user?.user_id
      if (id) return String(id)
    }
  } catch {}
  if (data?.user_id) return String(data.user_id)
  return ''
}
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE_HEADERS })
}
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  return new Redis({ url, token })
}
async function readWalletSession(token) {
  const redis = getRedis()
  if (redis) return redis.get(walletSessionKey(token))
  const row = walletSessionMemory.get(walletSessionKey(token))
  if (!row) return null
  if (Number(row.expiresAt || 0) <= Date.now()) {
    walletSessionMemory.delete(walletSessionKey(token))
    return null
  }
  return row.value || null
}
async function revokeWalletSession(token) {
  const cleanToken = clean(token)
  if (!cleanToken || !cleanToken.startsWith(WALLET_SESSION_PREFIX)) return
  const redis = getRedis()
  if (redis) {
    await redis.del(walletSessionKey(cleanToken))
    return
  }
  walletSessionMemory.delete(walletSessionKey(cleanToken))
}
async function requireVerifiedWalletSession(body = {}) {
  const token = clean(body?.walletSessionToken || body?.sessionToken || body?.token)
  const walletAddress = clean(body?.walletAddress || body?.address || body?.walletAccountId)
  if (!token || !token.startsWith(WALLET_SESSION_PREFIX)) return null
  if (!isValidWalletAddress(walletAddress)) return null
  const session = await readWalletSession(token)
  if (!session || session.status !== 'active') return null
  if (Number(session.expiresAt || 0) <= Date.now()) {
    await revokeWalletSession(token).catch(() => {})
    return null
  }
  if (!sameIdentity(walletAddress, session.walletAddress) && !sameIdentity(walletAddress, session.accountId)) return null
  return {
    token,
    walletAddress: clean(session.walletAddress || walletAddress),
    accountId: clean(session.accountId || session.walletAddress || walletAddress),
    provider: clean(session.provider || 'wallet'),
  }
}
async function requireVerifiedTelegramSession(req, body = {}) {
  const initData = clean(body?.telegramInitData || body?.tmaInitData || req?.headers?.get?.('x-telegram-init-data') || '')
  if (!initData) return null
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
  const parsed = parseTelegramInitData(initData)
  const verified = verifyTelegramInitData(parsed, botToken)
  if (!verified.ok) return null
  const telegramId = extractTelegramUserId(verified.data)
  if (!telegramId) return null
  const candidates = [
    telegramId,
    `telegram:${telegramId}`,
    `telegramid:${telegramId}`,
    `telegram:id:${telegramId}`,
    `tguid:${telegramId}`,
    `tg:${telegramId}`,
    `tg:uid:${telegramId}`,
    body?.accountId,
    body?.asherId,
    body?.userId,
  ].filter(Boolean)
  let accountId = ''
  for (const candidate of candidates) {
    try {
      const resolved = clean(await resolveCanonicalAccountId(candidate))
      if (resolved) {
        accountId = resolved
        break
      }
    } catch {}
  }
  if (!accountId) accountId = telegramId
  return {
    token: '',
    walletAddress: '',
    accountId,
    telegramId,
    provider: 'telegram-mini-app',
    authAgeSeconds: verified.authAgeSeconds,
    authDateSeconds: verified.authDateSeconds,
  }
}
function readClientIp(req) {
  return clean(req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    clean(req.headers.get('x-real-ip') || '') ||
    clean(req.headers.get('cf-connecting-ip') || '')
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE_ACCOUNT') return json({ ok: false, error: 'confirmation_required' }, 400)

    const verifiedSession = await requireVerifiedWalletSession(body) || await requireVerifiedTelegramSession(req, body)
    if (!verifiedSession?.accountId) return json({ ok: false, error: 'verified_session_required' }, 401)

    const actorAccountId = await resolveCanonicalAccountId(verifiedSession.accountId || verifiedSession.walletAddress || verifiedSession.telegramId)
    if (!actorAccountId) return json({ ok: false, error: 'unauthorized' }, 401)

    const requestedRaw = clean(body?.accountId || body?.asherId || body?.userId || verifiedSession.accountId)
    const requestedAccountId = requestedRaw ? await resolveCanonicalAccountId(requestedRaw) : actorAccountId
    if (requestedAccountId && !sameIdentity(requestedAccountId, actorAccountId)) {
      return json({ ok: false, error: 'account_mismatch' }, 403)
    }

    const rawIds = [
      requestedRaw,
      body?.asherId,
      body?.userId,
      body?.rawUserId,
      body?.sourceForumUserId,
      body?.sourceAccountId,
      body?.sourceAsherId,
      body?.telegramId,
      verifiedSession.walletAddress,
      verifiedSession.accountId,
      verifiedSession.telegramId,
      body?.walletAccountId,
      body?.telegramId,
      body?.telegramUserId,
      body?.telegramAlias,
    ].filter(Boolean)

    const syntheticSmokeMode = body?.syntheticSmoke === true && isSyntheticSmokeAccountId(actorAccountId)
    const syntheticSmokeSeed = syntheticSmokeMode
      ? (
        extractSyntheticSmokeSeed(body?.syntheticSmokeSeed) ||
        extractSyntheticSmokeSeed(body?.smokeSeed) ||
        extractSyntheticSmokeSeed(body?.seed) ||
        extractSyntheticSmokeSeed(body?.rawUserId) ||
        extractSyntheticSmokeSeed(body?.telegramId) ||
        extractSyntheticSmokeSeed(auth?.telegramId)
      )
      : ''

    const result = await accountDeletionPrimary.deleteAccount({
      accountId: actorAccountId,
      rawIds,
      actorId: actorAccountId,
      source: 'profile-popover-v6',
      reason: syntheticSmokeMode ? 'synthetic_smoke_test' : 'self_delete',
      syntheticSmoke: syntheticSmokeMode,
      skipGlobalSideEffects: syntheticSmokeMode,
      ensureArchiveIndexes: !syntheticSmokeMode,
      requestMeta: {
        route: '/api/profile/delete-account',
        mode: 'api',
        seed: syntheticSmokeSeed || null,
        syntheticSmoke: syntheticSmokeMode,
        skipGlobalSideEffects: syntheticSmokeMode,
        authProvider: verifiedSession.provider,
        walletProvider: verifiedSession.provider,
        telegramId: clean(verifiedSession.telegramId || body?.telegramId || body?.telegramUserId || ''),
        telegramAuthAgeSeconds: verifiedSession.authAgeSeconds ?? null,
        ip: readClientIp(req),
        userAgent: clean(req.headers.get('user-agent') || '').slice(0, 512),
        ts: Date.now(),
      },
    })

    if (verifiedSession.token) { try { await revokeWalletSession(verifiedSession.token) } catch {} }

    if (!syntheticSmokeMode) {
      try {
        const redis = Redis.fromEnv()
        await redis.publish('forum:events', JSON.stringify({
          type: 'profile.deleted',
          accountId: actorAccountId,
          deletionId: result.deletionId,
          ts: Date.now(),
        }))
      } catch {}
    }

    return json({
      ok: true,
      accountId: actorAccountId,
      archiveId: result.archiveId,
      archiveKey: result.archiveKey,
      deletionId: result.deletionId,
      counts: result.counts || {},
      deleted: result.deleted || {},
      deletedTopicIds: result.deletedTopicIds || [],
      deletedPostIds: result.deletedPostIds || [],
      totalDocs: result.totalDocs || 0,
      chunkCount: result.chunkCount || 0,
      storagePrimary: 'mongo',
      version: result.version,
      syntheticSmoke: syntheticSmokeMode,
    })
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500)
  }
}

