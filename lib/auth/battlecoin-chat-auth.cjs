const profilePrimary = require('../mongo/profile-primary.cjs')
const ql7Identity = require('../identity/ql7IdentityContract.cjs')

const TOKEN_PREFIX = 'ql7ws_'
const memoryStore = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = memoryStore

let redisClientPromise = null

function str(value) {
  return String(value ?? '').trim()
}

function sameId(a, b) {
  return str(a).toLowerCase() === str(b).toLowerCase()
}

function isValidWalletAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(str(value))
}

function readHeader(req, name) {
  try { return str(req?.headers?.get?.(name)) } catch { return '' }
}

function sessionKey(token) {
  return `wallet_session:${token}`
}

async function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis')
      .then(({ Redis }) => new Redis({ url, token }))
      .catch(() => null)
  }
  return redisClientPromise
}

async function readWalletSession(token) {
  const cleanToken = str(token)
  if (!cleanToken || !cleanToken.startsWith(TOKEN_PREFIX)) return null
  const key = sessionKey(cleanToken)
  const redis = await getRedisClient()
  if (redis) return redis.get(key).catch(() => null)

  const row = memoryStore.get(key)
  if (!row) return null
  if (Number(row.expiresAt || 0) <= Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return row.value || null
}

async function resolveCanonicalAccountId(raw) {
  const id = str(raw)
  if (!id) return ''
  try {
    return str(await profilePrimary.resolveCanonicalAccountId(id)) || id
  } catch {
    return id
  }
}

async function resolveBattleChatIdentity(raw, options = {}) {
  const id = str(raw)
  if (!id) return { accountId: '', identityIds: [] }
  try {
    const resolved = await ql7Identity.resolve(id, {
      mode: 'battlecoin-account',
      source: options.source || 'battlecoin-chat-auth',
    })
    const accountId = str(resolved?.battlecoinAccountId || resolved?.canonicalAccountId || resolved?.exactEtalonUid || id)
    const identityIds = Array.from(new Set([
      accountId,
      ...(resolved?.aliasSet || []),
      ...(resolved?.forumLookupOrder || []),
      id,
    ].map(str).filter(Boolean)))
    return { accountId, identityIds }
  } catch {
    const accountId = await resolveCanonicalAccountId(id)
    return {
      accountId: accountId || id,
      identityIds: Array.from(new Set([accountId, id].map(str).filter(Boolean))),
    }
  }
}

async function actorFromWalletSession(req, body = {}) {
  const token =
    readHeader(req, 'x-battlecoin-chat-session-token') ||
    readHeader(req, 'x-wallet-session-token') ||
    str(body?.walletSessionToken)
  const walletAddress =
    readHeader(req, 'x-wallet-address') ||
    readHeader(req, 'x-auth-wallet-address') ||
    str(body?.walletAddress || body?.address)
  const claimedAccountId =
    readHeader(req, 'x-wallet-account-id') ||
    readHeader(req, 'x-auth-account-id') ||
    str(body?.accountId)

  if (!token) return null
  const session = await readWalletSession(token)
  if (!session || session.status !== 'active') return null
  if (Number(session.expiresAt || 0) <= Date.now()) return null

  const sessionWallet = str(session.walletAddress || session.address)
  const sessionAccount = str(session.accountId || sessionWallet)
  const checkWallet = walletAddress || claimedAccountId
  if (checkWallet && isValidWalletAddress(checkWallet)) {
    if (!sameId(checkWallet, sessionWallet) && !sameId(checkWallet, sessionAccount)) return null
  }

  const identity = await resolveBattleChatIdentity(sessionAccount || sessionWallet, { source: 'battlecoin-chat-wallet-session' })
  const canonicalAccountId = identity.accountId
  if (!canonicalAccountId) return null
  return {
    ok: true,
    provider: session.provider || 'wallet',
    accountId: canonicalAccountId,
    rawAccountId: sessionAccount || sessionWallet,
    walletAddress: sessionWallet,
    identityIds: Array.from(new Set([
      ...(identity.identityIds || []),
      sessionAccount,
      sessionWallet,
    ].map(str).filter(Boolean))),
  }
}

function readTmaInitData(req, body = {}) {
  return (
    readHeader(req, 'x-telegram-init-data') ||
    readHeader(req, 'x-tma-init-data') ||
    str(body?.telegramInitData || body?.tmaInitData || body?.initData)
  )
}

async function actorFromTelegramMiniApp(req, body = {}) {
  const initData = readTmaInitData(req, body)
  if (!initData || !initData.includes('hash=')) return null
  const botToken = str(
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TG_BOT_TOKEN ||
    process.env.BOT_TOKEN
  )
  if (!botToken) return null

  const tma = await import('../tma.js').catch(() => null)
  if (!tma?.verifyInitData || !tma?.extractTelegramUserId) return null
  const verified = tma.verifyInitData(initData, botToken)
  if (!verified?.ok) return null
  const tgId = str(tma.extractTelegramUserId(verified.data))
  if (!tgId) return null

  const rawAccountId = `telegram:${tgId}`
  const identity = await resolveBattleChatIdentity(rawAccountId, { source: 'battlecoin-chat-tma' })
  const canonicalAccountId = identity.accountId
  return {
    ok: true,
    provider: 'tma',
    accountId: canonicalAccountId || rawAccountId,
    rawAccountId,
    telegramId: tgId,
    identityIds: Array.from(new Set([
      ...(identity.identityIds || []),
      canonicalAccountId,
      rawAccountId,
      tgId,
    ].map(str).filter(Boolean))),
  }
}

async function actorFromLinkedAccountHeader(req) {
  const rawAccountId =
    readHeader(req, 'x-auth-account-id') ||
    readHeader(req, 'x-forum-user-id') ||
    readHeader(req, 'x-forum-user')
  if (!rawAccountId) return null

  const identity = await resolveBattleChatIdentity(rawAccountId, { source: 'battlecoin-chat-linked-header' })
  const canonicalAccountId = identity.accountId
  const accountId = canonicalAccountId || rawAccountId
  if (!accountId) return null

  return {
    ok: true,
    provider: 'linked-account',
    accountId,
    rawAccountId,
    identityIds: Array.from(new Set([
      ...(identity.identityIds || []),
      accountId,
      rawAccountId,
    ].map(str).filter(Boolean))),
  }
}

async function readOptionalBattleChatActor(req, body = {}) {
  return (
    await actorFromLinkedAccountHeader(req) ||
    await actorFromTelegramMiniApp(req, body) ||
    await actorFromWalletSession(req, body) ||
    null
  )
}

async function requireBattleChatActor(req, body = {}) {
  const actor = await readOptionalBattleChatActor(req, body)
  if (actor?.accountId) return actor
  const error = new Error('battlecoin_chat_auth_required')
  error.status = 401
  throw error
}

module.exports = {
  actorFromLinkedAccountHeader,
  readOptionalBattleChatActor,
  requireBattleChatActor,
  resolveBattleChatIdentity,
  resolveCanonicalAccountId,
}
