const crypto = require('node:crypto')
const { ObjectId } = require('mongodb')
const { getMongoDb } = require('./client.cjs')
const profilePrimary = require('./profile-primary.cjs')
const subscriptionsPrimary = require('./subscriptions-primary.cjs')
const {
  BATTLE_CHAT_CHANNEL,
  BATTLE_CHAT_MESSAGE_RATE_LIMIT_PER_MINUTE,
  BATTLE_CHAT_RETENTION_DAYS,
  BATTLE_CHAT_SEND_COOLDOWN_MS,
  BATTLE_CHAT_SESSION_HARD_LIMIT,
  normalizeBattleChatLimit,
  normalizeClientMutationId,
  validateBattleChatText,
} = require('../battlecoin/battle-chat-validation.cjs')
const {
  publicIdentityFromProfile,
} = require('../battlecoin/battle-chat-public-identity.cjs')

const INDEX_KEY = '__ql7BattlecoinChatPrimaryIndexesV1'
const MESSAGES = 'battlecoin_chat_messages'
const LIKES = 'battlecoin_chat_likes'
const SENDER_STATE = 'battlecoin_chat_sender_state'
const VERSION = 'battlecoin-chat-mongo-primary-v1'

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowIso(ms = Date.now()) {
  return new Date(ms).toISOString()
}

function clone(value) {
  if (!value || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex')
}

function makeMessageId() {
  return new ObjectId().toHexString()
}

function retentionExpiresAt(now = Date.now()) {
  return new Date(now + BATTLE_CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

function timeMs(value) {
  if (value instanceof Date) return value.getTime()
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

async function db() {
  if (testDatabase) return testDatabase
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (!globalThis[INDEX_KEY]) {
    globalThis[INDEX_KEY] = ensureIndexes(database).catch((error) => {
      delete globalThis[INDEX_KEY]
      throw error
    })
  }
  await globalThis[INDEX_KEY]
  return database
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection(MESSAGES).createIndex({ channel: 1, status: 1, createdAtMs: -1, _id: -1 }),
    database.collection(MESSAGES).createIndex({ channel: 1, updatedAtMs: 1, _id: 1 }),
    database.collection(MESSAGES).createIndex({ authorAccountId: 1, createdAtMs: -1 }),
    database.collection(MESSAGES).createIndex({ authorAccountId: 1, clientMutationId: 1 }, { unique: true, sparse: true }),
    database.collection(MESSAGES).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection(LIKES).createIndex({ messageId: 1, accountId: 1 }, { unique: true }),
    database.collection(LIKES).createIndex({ accountId: 1, createdAtMs: -1 }),
    database.collection(LIKES).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection(SENDER_STATE).createIndex({ accountId: 1 }, { unique: true }),
    database.collection(SENDER_STATE).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
  try { subscriptionsPrimary.__setTestDb(database || null) } catch {}
}

async function profileFor(accountId) {
  const id = str(accountId)
  if (!id) return {}
  try {
    return await profilePrimary.readProfile(id)
  } catch {
    return {}
  }
}

function normalizeVipLookupId(value) {
  let id = str(value).toLowerCase()
  if (!id) return ''
  try { id = str(profilePrimary.stripPrefix(id)).toLowerCase() || id } catch {}
  if (id.startsWith('vipplus:')) id = id.split(':')[1] || ''
  if (id.startsWith('wallet:')) id = id.slice('wallet:'.length)
  if (id.startsWith('telegram:id:')) id = id.slice('telegram:id:'.length)
  else if (id.startsWith('telegramid:')) id = id.slice('telegramid:'.length)
  else if (id.startsWith('telegram:')) id = id.slice('telegram:'.length)
  else if (id.startsWith('tguid:')) id = id.slice('tguid:'.length)
  else if (id.startsWith('tg:')) id = id.slice('tg:'.length)
  return id
}

function vipStateFromUntil(untilISO) {
  const untilMs = untilISO ? new Date(untilISO).getTime() : 0
  const active = Number.isFinite(untilMs) && untilMs > Date.now()
  return { active, untilMs: active ? untilMs : 0 }
}

async function vipLookupIdsForAccount(accountId) {
  const id = normalizeVipLookupId(accountId)
  if (!id) return []
  const ids = new Set([id])
  const canonical = normalizeVipLookupId(await profilePrimary.resolveCanonicalAccountId(id).catch(() => ''))
  if (canonical) ids.add(canonical)
  const aliases = await profilePrimary.listAliasesForAccount(canonical || id).catch(() => [])
  for (const row of aliases || []) {
    for (const value of [row?.accountId, row?.canonicalAccountId, row?.alias, row?.aliasId, row?.aliasValue]) {
      const clean = normalizeVipLookupId(value)
      if (clean) ids.add(clean)
    }
  }
  return Array.from(ids)
}

async function vipStateForAccount(accountId) {
  const ids = await vipLookupIdsForAccount(accountId)
  for (const id of ids) {
    const state = vipStateFromUntil(await subscriptionsPrimary.getVip(id).catch(() => null))
    if (state.active) return state
  }
  return { active: false, untilMs: 0 }
}

function mergeAuthorVip(author, vipState = {}) {
  const liveUntil = num(author?.vipUntil || author?.vipUntilMs, 0)
  const stateUntil = num(vipState?.untilMs || vipState?.vipUntil, 0)
  const vipUntil = Math.max(liveUntil, stateUntil)
  const vipActive = Boolean(author?.vipActive || vipState?.active || (vipUntil && vipUntil > Date.now()))
  return {
    ...author,
    vipActive,
    vipUntil,
  }
}

function snapshotAuthor(accountId, profile, vipState = {}) {
  return mergeAuthorVip(publicIdentityFromProfile(accountId, profile), vipState)
}

function hydrateAuthorSnapshot(accountId, storedAuthor, profile = {}, vipState = {}) {
  const liveAuthor = snapshotAuthor(accountId, profile, vipState)
  if (!storedAuthor || typeof storedAuthor !== 'object') return liveAuthor
  return {
    ...storedAuthor,
    accountId: liveAuthor.accountId,
    vipActive: liveAuthor.vipActive,
    vipUntil: liveAuthor.vipUntil,
  }
}

function syncTokenFromDoc(doc = {}) {
  const updatedAtMs = Math.max(0, num(doc.updatedAtMs, timeMs(doc.updatedAt)))
  const id = str(doc._id || doc.id || doc.messageId)
  return Buffer.from(JSON.stringify({ updatedAtMs, id }), 'utf8').toString('base64url')
}

function parseSyncToken(token) {
  const raw = str(token)
  if (!raw) return { updatedAtMs: 0, id: '' }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    return {
      updatedAtMs: Math.max(0, num(parsed.updatedAtMs, 0)),
      id: str(parsed.id),
    }
  } catch {
    return null
  }
}

function publicMessage(doc, author, myLiked = false) {
  if (!doc) return null
  const id = str(doc._id || doc.messageId || doc.id)
  return {
    id,
    channel: str(doc.channel || BATTLE_CHAT_CHANNEL),
    text: str(doc.text),
    author: author || doc.author || { kind: 'anonymous', nickname: '', avatar: '/anonymous/anonymous.png' },
    likesCount: Math.max(0, Math.floor(num(doc.likesCount, 0))),
    myLiked: !!myLiked,
    createdAtMs: Math.max(0, num(doc.createdAtMs, timeMs(doc.createdAt))),
    updatedAtMs: Math.max(0, num(doc.updatedAtMs, timeMs(doc.updatedAt))),
    storagePrimary: 'mongo',
  }
}

async function hydrateMessages(database, docs = [], viewerAccountId = '') {
  const ids = docs.map((doc) => str(doc._id || doc.messageId)).filter(Boolean)
  const authorIds = Array.from(new Set(docs.map((doc) => str(doc.authorAccountId)).filter(Boolean)))
  const profiles = new Map()
  const vipStates = new Map()
  await Promise.all(authorIds.map(async (id) => {
    const [profile, vipState] = await Promise.all([
      profileFor(id),
      vipStateForAccount(id),
    ])
    profiles.set(id, profile)
    vipStates.set(id, vipState)
  }))

  let likedIds = new Set()
  const viewer = str(viewerAccountId)
  if (viewer && ids.length) {
    const likes = await database.collection(LIKES).find({
      messageId: { $in: ids },
      accountId: viewer,
      status: 'liked',
    }).limit(ids.length + 5).toArray().catch(() => [])
    likedIds = new Set((likes || []).map((row) => str(row.messageId)))
  }

  return docs.map((doc) => {
    const accountId = str(doc.authorAccountId)
    const author = hydrateAuthorSnapshot(accountId, doc.authorSnapshot, profiles.get(accountId) || {}, vipStates.get(accountId) || {})
    return publicMessage(doc, author, likedIds.has(str(doc._id || doc.messageId)))
  }).filter(Boolean)
}

async function listBattleChatMessages({ limit = 100, viewerAccountId = '' } = {}) {
  const safeLimit = normalizeBattleChatLimit(limit)
  const database = await db()
  const docs = await database.collection(MESSAGES)
    .find({ channel: BATTLE_CHAT_CHANNEL, status: 'visible' })
    .sort({ createdAtMs: -1, _id: -1 })
    .limit(safeLimit)
    .toArray()
    .catch(() => [])
  const ordered = (docs || []).slice().reverse()
  const messages = await hydrateMessages(database, ordered, viewerAccountId)
  const last = ordered[ordered.length - 1] || null
  return {
    ok: true,
    channel: BATTLE_CHAT_CHANNEL,
    messages,
    syncToken: last ? syncTokenFromDoc(last) : '',
    storagePrimary: 'mongo',
    redisRole: 'accelerator-only',
  }
}

async function listBattleChatDelta({ since = '', viewerAccountId = '', limit = 100 } = {}) {
  const token = parseSyncToken(since)
  if (!token) return { ok: true, requiresSnapshot: true, messages: [], syncToken: '' }
  const safeLimit = normalizeBattleChatLimit(limit)
  const database = await db()
  const query = {
    channel: BATTLE_CHAT_CHANNEL,
    status: 'visible',
    $or: [
      { updatedAtMs: { $gt: token.updatedAtMs } },
      { updatedAtMs: token.updatedAtMs, _id: { $gt: token.id } },
    ],
  }
  const docs = await database.collection(MESSAGES)
    .find(query)
    .sort({ updatedAtMs: 1, _id: 1 })
    .limit(safeLimit)
    .toArray()
    .catch(() => [])
  const messages = await hydrateMessages(database, docs || [], viewerAccountId)
  const last = docs[docs.length - 1] || null
  return {
    ok: true,
    requiresSnapshot: false,
    channel: BATTLE_CHAT_CHANNEL,
    messages,
    syncToken: last ? syncTokenFromDoc(last) : since,
    storagePrimary: 'mongo',
  }
}

async function readSenderState(database, accountId) {
  const id = str(accountId)
  if (!id) return null
  return database.collection(SENDER_STATE).findOne({ accountId: id }).catch(() => null)
}

function minuteWindow(now) {
  return Math.floor(now / 60_000)
}

async function writeSenderState(database, accountId, patch = {}) {
  const id = str(accountId)
  if (!id) return null
  const updatedAtMs = Date.now()
  await database.collection(SENDER_STATE).updateOne(
    { accountId: id },
    {
      $set: {
        accountId: id,
        ...patch,
        updatedAtMs,
        updatedAt: nowIso(updatedAtMs),
        expiresAt: retentionExpiresAt(updatedAtMs),
        storagePrimary: 'mongo',
      },
      $setOnInsert: {
        _id: `sender:${sha(id).slice(0, 32)}`,
        createdAtMs: updatedAtMs,
        createdAt: nowIso(updatedAtMs),
      },
    },
    { upsert: true },
  )
}

async function assertSenderAllowed(database, accountId, now) {
  const state = await readSenderState(database, accountId)
  const nextAllowedAtMs = Math.max(0, num(state?.nextAllowedAtMs, 0))
  if (nextAllowedAtMs > now) {
    return {
      ok: false,
      error: 'battlecoin_chat_cooldown',
      retryAfterMs: nextAllowedAtMs - now,
    }
  }
  const windowId = minuteWindow(now)
  const previousWindow = num(state?.messageWindowId, -1)
  const previousCount = previousWindow === windowId ? Math.max(0, Math.floor(num(state?.messageWindowCount, 0))) : 0
  if (previousCount >= BATTLE_CHAT_MESSAGE_RATE_LIMIT_PER_MINUTE) {
    return {
      ok: false,
      error: 'battlecoin_chat_rate_limited',
      retryAfterMs: (windowId + 1) * 60_000 - now,
    }
  }
  const sessionCount = Math.max(0, Math.floor(num(state?.sessionCount, 0)))
  if (sessionCount >= BATTLE_CHAT_SESSION_HARD_LIMIT) {
    return {
      ok: false,
      error: 'battlecoin_chat_session_limit',
      retryAfterMs: BATTLE_CHAT_SEND_COOLDOWN_MS,
    }
  }
  return { ok: true, windowId, nextCount: previousCount + 1, nextSessionCount: sessionCount + 1 }
}

async function sendBattleChatMessage({ actor, text, clientMutationId = '', now = Date.now() } = {}) {
  const accountId = str(actor?.accountId)
  if (!accountId) return { ok: false, error: 'battlecoin_chat_auth_required', status: 401 }
  const validation = validateBattleChatText(text)
  if (!validation.ok) return { ok: false, error: validation.error, status: 400, graphemes: validation.graphemes || 0 }

  const database = await db()
  const mutationId = normalizeClientMutationId(clientMutationId)
  if (mutationId) {
    const existing = await database.collection(MESSAGES).findOne({
      authorAccountId: accountId,
      clientMutationId: mutationId,
    }).catch(() => null)
    if (existing) {
      const [message] = await hydrateMessages(database, [existing], accountId)
      return { ok: true, duplicate: true, message, syncToken: syncTokenFromDoc(existing), storagePrimary: 'mongo' }
    }
  }

  const allowed = await assertSenderAllowed(database, accountId, now)
  if (!allowed.ok) return { ...allowed, status: 429, storagePrimary: 'mongo' }

  const [profile, vipState] = await Promise.all([
    profileFor(accountId),
    vipStateForAccount(accountId),
  ])
  const authorSnapshot = snapshotAuthor(accountId, profile, vipState)
  const id = makeMessageId()
  const doc = {
    _id: id,
    messageId: id,
    channel: BATTLE_CHAT_CHANNEL,
    text: validation.text,
    graphemes: validation.graphemes,
    authorAccountId: accountId,
    authorIdentityIds: Array.from(new Set((actor?.identityIds || [accountId]).map(str).filter(Boolean))),
    authorSnapshot,
    clientMutationId: mutationId || `server:${id}`,
    likesCount: 0,
    status: 'visible',
    createdAtMs: now,
    updatedAtMs: now,
    createdAt: nowIso(now),
    updatedAt: nowIso(now),
    expiresAt: retentionExpiresAt(now),
    version: VERSION,
    storagePrimary: 'mongo',
  }

  try {
    await database.collection(MESSAGES).insertOne(doc)
  } catch (error) {
    if (mutationId) {
      const existing = await database.collection(MESSAGES).findOne({
        authorAccountId: accountId,
        clientMutationId: mutationId,
      }).catch(() => null)
      if (existing) {
        const [message] = await hydrateMessages(database, [existing], accountId)
        return { ok: true, duplicate: true, message, syncToken: syncTokenFromDoc(existing), storagePrimary: 'mongo' }
      }
    }
    throw error
  }

  await writeSenderState(database, accountId, {
    nextAllowedAtMs: now + BATTLE_CHAT_SEND_COOLDOWN_MS,
    messageWindowId: allowed.windowId,
    messageWindowCount: allowed.nextCount,
    sessionCount: allowed.nextSessionCount,
  })

  const [message] = await hydrateMessages(database, [doc], accountId)
  return {
    ok: true,
    message,
    syncToken: syncTokenFromDoc(doc),
    retryAfterMs: BATTLE_CHAT_SEND_COOLDOWN_MS,
    storagePrimary: 'mongo',
  }
}

async function toggleBattleChatLike({ actor, messageId, like = true, now = Date.now() } = {}) {
  const accountId = str(actor?.accountId)
  const id = str(messageId)
  if (!accountId) return { ok: false, error: 'battlecoin_chat_auth_required', status: 401 }
  if (!id) return { ok: false, error: 'battlecoin_chat_bad_message', status: 400 }
  const database = await db()
  const message = await database.collection(MESSAGES).findOne({
    _id: id,
    channel: BATTLE_CHAT_CHANNEL,
    status: 'visible',
  }).catch(() => null)
  if (!message) return { ok: false, error: 'battlecoin_chat_not_found', status: 404 }

  const likeId = `like:${id}:${sha(accountId).slice(0, 32)}`
  let delta = 0
  if (like) {
    const doc = {
      _id: likeId,
      messageId: id,
      accountId,
      status: 'liked',
      createdAtMs: now,
      updatedAtMs: now,
      createdAt: nowIso(now),
      updatedAt: nowIso(now),
      expiresAt: retentionExpiresAt(now),
      storagePrimary: 'mongo',
    }
    try {
      await database.collection(LIKES).insertOne(doc)
      delta = 1
    } catch {}
  } else {
    const result = await database.collection(LIKES).deleteOne({ _id: likeId }).catch(() => ({ deletedCount: 0 }))
    if (result?.deletedCount) delta = -1
  }

  let nextDoc = message
  if (delta !== 0) {
    const nextCount = Math.max(0, num(message.likesCount, 0) + delta)
    await database.collection(MESSAGES).updateOne(
      { _id: id },
      {
        $set: {
          likesCount: nextCount,
          updatedAtMs: now,
          updatedAt: nowIso(now),
          storagePrimary: 'mongo',
        },
      },
    )
    nextDoc = { ...message, likesCount: nextCount, updatedAtMs: now, updatedAt: nowIso(now) }
  }

  const [publicRow] = await hydrateMessages(database, [nextDoc], accountId)
  return {
    ok: true,
    message: publicRow,
    liked: !!like,
    likesCount: publicRow?.likesCount || 0,
    syncToken: syncTokenFromDoc(nextDoc),
    storagePrimary: 'mongo',
  }
}

async function deleteBattleChatForAccountIds(accountIds = []) {
  const ids = Array.from(new Set((Array.isArray(accountIds) ? accountIds : [accountIds]).map(str).filter(Boolean)))
  if (!ids.length) return { messages: 0, likes: 0, senderState: 0 }
  const database = await db()
  const authored = await database.collection(MESSAGES)
    .find({ authorAccountId: { $in: ids } })
    .limit(5000)
    .toArray()
    .catch(() => [])
  const authoredMessageIds = (authored || []).map((row) => str(row?._id || row?.messageId)).filter(Boolean)
  const [messages, likes, senderState] = await Promise.all([
    database.collection(MESSAGES).deleteMany({ authorAccountId: { $in: ids } }).catch(() => ({ deletedCount: 0 })),
    database.collection(LIKES).deleteMany({
      $or: [
        { accountId: { $in: ids } },
        authoredMessageIds.length ? { messageId: { $in: authoredMessageIds } } : null,
      ].filter(Boolean),
    }).catch(() => ({ deletedCount: 0 })),
    database.collection(SENDER_STATE).deleteMany({ accountId: { $in: ids } }).catch(() => ({ deletedCount: 0 })),
  ])
  return {
    messages: messages?.deletedCount || 0,
    likes: likes?.deletedCount || 0,
    senderState: senderState?.deletedCount || 0,
  }
}

module.exports = {
  __setTestDb,
  constants: {
    MESSAGES,
    LIKES,
    SENDER_STATE,
    VERSION,
  },
  deleteBattleChatForAccountIds,
  listBattleChatDelta,
  listBattleChatMessages,
  sendBattleChatMessage,
  toggleBattleChatLike,
}
