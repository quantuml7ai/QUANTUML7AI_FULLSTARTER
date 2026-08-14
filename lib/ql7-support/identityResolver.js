import crypto from 'crypto'
import { Redis } from '@upstash/redis'
import profilePrimary from '../mongo/profile-primary.cjs'
import { extractTelegramUserId, verifyInitData } from '../tma.js'

const TOKEN_PREFIX = 'ql7ws_'
const LATEST_PREFIX = 'wallet_session_latest:'
const SECURITY_AUDIT_COLLECTION = 'ql7_support_security_audit'
const TMA_MAX_AGE_SECONDS = Math.max(300, Math.min(86400, Number(process.env.QL7_SUPPORT_TMA_MAX_AGE_SECONDS || 1800) || 1800))
const memoryStore = globalThis.__QL7_WALLET_SESSION_MEMORY__ || new Map()
globalThis.__QL7_WALLET_SESSION_MEMORY__ = memoryStore

let testStore = null

function str(value) { return String(value ?? '').trim() }
function lower(value) { return str(value).toLowerCase() }
function same(a, b) { return lower(a) === lower(b) }
function isWallet(value) { return /^0x[a-fA-F0-9]{40}$/.test(str(value)) }
function tokenHash(token) { return crypto.createHash('sha256').update(str(token)).digest('hex') }
function mask(value = '', visible = 4) {
  const clean = str(value)
  if (!clean) return ''
  if (clean.length <= visible * 2 + 2) return `${clean.slice(0, 2)}***`
  return `${clean.slice(0, visible)}…${clean.slice(-visible)}`
}
function header(req, name) { try { return str(req?.headers?.get?.(name)) } catch { return '' } }
function sessionKey(token) { return `wallet_session:${token}` }
function latestKey(identity) { const clean = lower(identity); return clean ? `${LATEST_PREFIX}${clean}` : '' }
function nowMs(clock) { return Number(typeof clock === 'function' ? clock() : Date.now()) }
function jsonClone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }

function getRedis() {
  if (testStore?.get) return testStore
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  return new Redis({ url, token })
}

async function storeGet(key) {
  if (!key) return null
  const store = getRedis()
  if (store?.get) return store.get(key)
  const row = memoryStore.get(key)
  if (!row) return null
  if (Number(row.expiresAt || 0) <= Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return row.value || null
}

async function resolveCanonical(raw) {
  const value = str(raw)
  if (!value) return ''
  try { return str(await profilePrimary.resolveCanonicalAccountId(value)) || value } catch { return value }
}

function readLatestToken(record) {
  if (!record) return ''
  if (typeof record === 'string') return str(record)
  return str(record.token)
}
function readLatestStatus(record) {
  if (!record || typeof record === 'string') return 'active'
  return lower(record.status || 'active')
}

async function auditFailure({ database, code, hint = '', authMode = '', token = '', evidence = {} } = {}) {
  if (!database || typeof database.collection !== 'function') return null
  const at = new Date().toISOString()
  const safe = {
    code: str(code),
    hintHash: hint ? tokenHash(lower(hint)).slice(0, 24) : '',
    authMode: str(authMode),
    tokenHash: token ? tokenHash(token) : '',
    evidence: jsonClone(evidence) || {},
    createdAt: at,
    storagePrimary: 'mongo',
  }
  const _id = `support-auth:${tokenHash(`${safe.code}:${safe.hintHash}:${safe.tokenHash}:${at}`).slice(0, 28)}`
  await database.collection(SECURITY_AUDIT_COLLECTION).insertOne({ _id, ...safe }).catch(() => null)
  return _id
}

function readWalletCredentials(req, body = {}) {
  return {
    token: header(req, 'x-wallet-session-token') || str(body.walletSessionToken || body.sessionToken),
    walletAddress: header(req, 'x-wallet-address') || str(body.walletAddress || body.address),
    accountHint: header(req, 'x-auth-account-id') || str(body.accountId || body.from || body.userId),
  }
}

async function resolveWalletActor({ req, body, database, clock }) {
  const credentials = readWalletCredentials(req, body)
  if (!credentials.token && !credentials.walletAddress) return null
  if (!credentials.token.startsWith(TOKEN_PREFIX) || !isWallet(credentials.walletAddress)) {
    await auditFailure({ database, code: 'wallet_credentials_malformed', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token })
    return { valid: false, failureCode: 'wallet_credentials_malformed', authMode: 'wallet_session' }
  }
  const session = await storeGet(sessionKey(credentials.token))
  if (!session) {
    await auditFailure({ database, code: 'wallet_session_missing', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token })
    return { valid: false, failureCode: 'wallet_session_missing', authMode: 'wallet_session' }
  }
  if (lower(session.status || 'active') !== 'active') {
    await auditFailure({ database, code: 'wallet_session_inactive', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token, evidence: { status: lower(session.status) } })
    return { valid: false, failureCode: 'wallet_session_inactive', authMode: 'wallet_session' }
  }
  if (Number(session.expiresAt || 0) <= nowMs(clock)) {
    await auditFailure({ database, code: 'wallet_session_expired', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token })
    return { valid: false, failureCode: 'wallet_session_expired', authMode: 'wallet_session' }
  }
  const sessionWallet = str(session.walletAddress || session.address)
  const sessionAccount = str(session.accountId || sessionWallet)
  if (!same(credentials.walletAddress, sessionWallet) && !same(credentials.walletAddress, sessionAccount)) {
    await auditFailure({ database, code: 'wallet_session_mismatch', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token, evidence: { walletMasked: mask(credentials.walletAddress), sessionWalletMasked: mask(sessionWallet) } })
    return { valid: false, failureCode: 'wallet_session_mismatch', authMode: 'wallet_session' }
  }
  const identities = Array.from(new Set([sessionWallet, sessionAccount].map(lower).filter(Boolean)))
  let latestProofCount = 0
  for (const identity of identities) {
    const latest = await storeGet(latestKey(identity))
    if (!latest) continue
    latestProofCount += 1
    if (readLatestToken(latest) !== credentials.token || readLatestStatus(latest) !== 'active') {
      await auditFailure({ database, code: readLatestStatus(latest) === 'logout' ? 'wallet_session_logged_out' : 'wallet_session_stale', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token })
      return { valid: false, failureCode: readLatestStatus(latest) === 'logout' ? 'wallet_session_logged_out' : 'wallet_session_stale', authMode: 'wallet_session' }
    }
  }
  if (!latestProofCount) {
    await auditFailure({ database, code: 'wallet_session_latest_missing', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token })
    return { valid: false, failureCode: 'wallet_session_latest_missing', authMode: 'wallet_session' }
  }
  const canonicalAccountId = await resolveCanonical(sessionAccount || sessionWallet)
  const hintCanonical = credentials.accountHint ? await resolveCanonical(credentials.accountHint) : ''
  if (hintCanonical && !same(hintCanonical, canonicalAccountId)) {
    await auditFailure({ database, code: 'wallet_actor_hint_mismatch', hint: credentials.accountHint, authMode: 'wallet_session', token: credentials.token, evidence: { actorMasked: mask(canonicalAccountId) } })
    return { valid: false, failureCode: 'wallet_actor_hint_mismatch', authMode: 'wallet_session' }
  }
  return {
    authMode: 'wallet_session',
    canonicalAccountId,
    aliases: Array.from(new Set([canonicalAccountId, sessionAccount, sessionWallet, hintCanonical].map(str).filter(Boolean))),
    walletMasked: mask(sessionWallet),
    sessionIdHash: tokenHash(credentials.token),
    verifiedAt: new Date(nowMs(clock)).toISOString(),
    expiresAt: new Date(Number(session.expiresAt)).toISOString(),
    valid: true,
  }
}

function readTelegramInitData(req, body = {}) {
  return header(req, 'x-telegram-init-data') || header(req, 'x-tma-init-data') || str(body.telegramInitData || body.tmaInitData || body.initData)
}

async function resolveTelegramActor({ req, body, database, clock }) {
  const initData = readTelegramInitData(req, body)
  if (!initData) return null
  const botToken = str(process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN)
  if (!botToken) {
    await auditFailure({ database, code: 'telegram_bot_token_missing', authMode: 'telegram_tma' })
    return { valid: false, failureCode: 'telegram_bot_token_missing', authMode: 'telegram_tma' }
  }
  const verified = verifyInitData(initData, botToken)
  if (!verified?.ok) {
    await auditFailure({ database, code: 'telegram_bad_signature', authMode: 'telegram_tma' })
    return { valid: false, failureCode: 'telegram_bad_signature', authMode: 'telegram_tma' }
  }
  const authDate = Number(verified.data?.auth_date || 0)
  const age = Math.floor(nowMs(clock) / 1000) - authDate
  if (!authDate || age < -60 || age > TMA_MAX_AGE_SECONDS) {
    await auditFailure({ database, code: age < -60 ? 'telegram_auth_date_future' : 'telegram_auth_date_expired', authMode: 'telegram_tma', evidence: { authAgeSeconds: age } })
    return { valid: false, failureCode: age < -60 ? 'telegram_auth_date_future' : 'telegram_auth_date_expired', authMode: 'telegram_tma' }
  }
  const telegramId = str(extractTelegramUserId(verified.data))
  if (!telegramId) return { valid: false, failureCode: 'telegram_user_missing', authMode: 'telegram_tma' }
  const candidates = [
    `telegram:${telegramId}`, telegramId, `tg:${telegramId}`, `tguid:${telegramId}`, str(body.accountId || body.from || body.userId),
  ].filter(Boolean)
  let canonicalAccountId = ''
  for (const candidate of candidates) {
    const resolved = await resolveCanonical(candidate)
    if (resolved) { canonicalAccountId = resolved; break }
  }
  if (!canonicalAccountId) canonicalAccountId = `telegram:${telegramId}`
  const hint = str(body.accountId || body.from || body.userId || header(req, 'x-forum-user-id'))
  const hintCanonical = hint ? await resolveCanonical(hint) : ''
  if (hintCanonical && !same(hintCanonical, canonicalAccountId)) {
    await auditFailure({ database, code: 'telegram_actor_hint_mismatch', hint, authMode: 'telegram_tma', evidence: { telegramMasked: mask(telegramId), actorMasked: mask(canonicalAccountId) } })
    return { valid: false, failureCode: 'telegram_actor_hint_mismatch', authMode: 'telegram_tma' }
  }
  return {
    authMode: 'telegram_tma',
    canonicalAccountId,
    aliases: Array.from(new Set([canonicalAccountId, ...candidates, hintCanonical].map(str).filter(Boolean))),
    telegramIdMasked: mask(telegramId, 3),
    sessionIdHash: tokenHash(initData),
    verifiedAt: new Date(nowMs(clock)).toISOString(),
    expiresAt: new Date((authDate + TMA_MAX_AGE_SECONDS) * 1000).toISOString(),
    valid: true,
  }
}

export function __setQl7SupportIdentityTestStore(store) { testStore = store || null }

export async function resolveQl7VerifiedActor({ req, body = {}, database = null, clock = Date.now } = {}) {
  const telegram = await resolveTelegramActor({ req, body, database, clock })
  if (telegram) return telegram
  const wallet = await resolveWalletActor({ req, body, database, clock })
  if (wallet) return wallet
  const hint = str(body.accountId || body.from || body.userId || header(req, 'x-forum-user-id'))
  await auditFailure({ database, code: 'verified_session_required', hint, authMode: 'none' })
  return { valid: false, failureCode: 'verified_session_required', authMode: 'none', aliases: [] }
}

export function publicQl7VerifiedActorProjection(actor = {}) {
  return {
    authMode: str(actor.authMode),
    canonicalAccountId: str(actor.canonicalAccountId),
    walletMasked: str(actor.walletMasked),
    telegramIdMasked: str(actor.telegramIdMasked),
    sessionIdHash: str(actor.sessionIdHash),
    verifiedAt: str(actor.verifiedAt),
    expiresAt: str(actor.expiresAt),
    valid: actor.valid === true,
    failureCode: str(actor.failureCode),
  }
}
