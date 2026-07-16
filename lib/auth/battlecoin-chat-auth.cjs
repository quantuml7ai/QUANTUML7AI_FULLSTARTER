const profilePrimary = require('../mongo/profile-primary.cjs')

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

  const canonicalAccountId = await resolveCanonicalAccountId(sessionAccount || sessionWallet)
  if (!canonicalAccountId) return null
  return {
    ok: true,
    provider: session.provider || 'wallet',
    accountId: canonicalAccountId,
    rawAccountId: sessionAccount || sessionWallet,
    walletAddress: sessionWallet,
    identityIds: [canonicalAccountId, sessionAccount, sessionWallet].filter(Boolean),
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
  const canonicalAccountId = await resolveCanonicalAccountId(rawAccountId)
  return {
    ok: true,
    provider: 'tma',
    accountId: canonicalAccountId || rawAccountId,
    rawAccountId,
    telegramId: tgId,
    identityIds: [canonicalAccountId, rawAccountId, tgId].filter(Boolean),
  }
}

async function actorFromAuthorizedAccountHeader(req) {
  const claimedAccountId =
    readHeader(req, 'x-auth-account-id') ||
    readHeader(req, 'x-forum-user-id') ||
    readHeader(req, 'x-forum-user')
  if (!claimedAccountId) return null

  const canonicalAccountId = await resolveCanonicalAccountId(claimedAccountId)
  if (!canonicalAccountId) return null

  const identityIds = new Set([canonicalAccountId, claimedAccountId])
  try {
    const aliases = await profilePrimary.listAliasesForAccount(canonicalAccountId)
    for (const row of aliases || []) {
      for (const value of [row?.accountId, row?.canonicalAccountId, row?.userId, row?.alias, row?.aliasId, row?.aliasValue]) {
        const clean = str(value)
        if (clean) identityIds.add(clean)
      }
    }
  } catch {}

  return {
    ok: true,
    provider: 'authorized-account',
    accountId: canonicalAccountId,
    rawAccountId: claimedAccountId,
    identityIds: Array.from(identityIds).filter(Boolean),
  }
}

async function readOptionalBattleChatActor(req, body = {}) {
  return (
    await actorFromWalletSession(req, body) ||
    await actorFromAuthorizedAccountHeader(req) ||
    await actorFromTelegramMiniApp(req, body) ||
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
  actorFromAuthorizedAccountHeader,
  readOptionalBattleChatActor,
  requireBattleChatActor,
  resolveCanonicalAccountId,
}
