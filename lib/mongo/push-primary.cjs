// lib/mongo/push-primary.cjs
// Mongo-primary push notification state and browser subscription repository.

'use strict'

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7PushPrimaryIndexesV1'
const NOTIFICATION_STATES = 'notification_states'
const PUSH_SUBSCRIPTIONS = 'push_subscriptions'
const VERSION = 'push-mongo-primary-v1'
const SOURCE_LIST = Object.freeze([
  'messenger_messages',
  'messenger_replies',
  'metamarket_gifts',
  'system',
  'admin',
])
const DEFAULT_SUBSCRIPTION_TTL_MS = 1000 * 60 * 60 * 24 * 180
const DEFAULT_MAX_SUBSCRIPTIONS_PER_USER = 8

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowMs() {
  return Date.now()
}

function clampCount(value) {
  return Math.max(0, Math.min(9999, Math.floor(Number(value) || 0)))
}

function normalizeCounts(raw = {}) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return Object.fromEntries(SOURCE_LIST.map((source) => [source, clampCount(input[source])]))
}

function totalCounts(counts = {}) {
  return Object.values(normalizeCounts(counts)).reduce((sum, value) => sum + value, 0)
}

function normalizeReadAt(raw = {}) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return Object.fromEntries(SOURCE_LIST.map((source) => [source, Math.max(0, num(input[source], 0))]))
}

function normalizeReadItems(raw = {}) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const out = {}
  for (const source of SOURCE_LIST) {
    const values = Array.isArray(input[source]) ? input[source] : []
    out[source] = Array.from(new Set(
      values
        .map((id) => str(id).slice(0, 200))
        .filter(Boolean),
    )).slice(-500)
  }
  return out
}

function normalizeDedupe(raw = {}, now = nowMs()) {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [str(key).slice(0, 260), Math.max(0, num(value, 0))])
      .filter(([key, expiresAt]) => key && expiresAt > now)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 500),
  )
}

function normalizeState(raw = {}) {
  const record = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const counts = normalizeCounts(record.counts || {})
  return {
    counts,
    readAt: normalizeReadAt(record.readAt || {}),
    readItems: normalizeReadItems(record.readItems || {}),
    dedupe: normalizeDedupe(record.dedupe || {}),
    totalCount: totalCounts(counts),
    version: Math.max(0, num(record.version, 0)),
    updatedAt: Math.max(0, num(record.updatedAt, 0)) || nowMs(),
    storagePrimary: 'mongo',
    redisRole: 'accelerator-only',
    ql7PushMongoPrimary: true,
  }
}

function normalizeSubscriptionRecord(raw = {}) {
  const record = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const id = str(record.id || record._id)
  const userId = str(record.userId)
  const subscription = record.subscription && typeof record.subscription === 'object' ? record.subscription : null
  if (!id || !userId || !subscription?.endpoint) return null
  return {
    id,
    _id: id,
    userId,
    endpointHash: str(record.endpointHash || id),
    subscription,
    lang: str(record.lang || 'en').slice(0, 8) || 'en',
    userAgent: str(record.userAgent).slice(0, 240),
    nativeShell: record.nativeShell === true,
    active: record.active !== false,
    createdAt: Math.max(0, num(record.createdAt, nowMs())),
    updatedAt: Math.max(0, num(record.updatedAt, nowMs())),
    expiresAt: record.expiresAt instanceof Date
      ? record.expiresAt
      : new Date(Math.max(nowMs(), num(record.expiresAt, nowMs() + DEFAULT_SUBSCRIPTION_TTL_MS))),
    storagePrimary: 'mongo',
    redisRole: 'none',
    ql7PushMongoPrimary: true,
  }
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection(NOTIFICATION_STATES).createIndex({ userId: 1 }, { unique: true }),
    database.collection(NOTIFICATION_STATES).createIndex({ updatedAt: -1 }),
    database.collection(PUSH_SUBSCRIPTIONS).createIndex({ userId: 1, active: 1, updatedAt: -1 }),
    database.collection(PUSH_SUBSCRIPTIONS).createIndex({ endpointHash: 1 }, { unique: true, sparse: true }),
    database.collection(PUSH_SUBSCRIPTIONS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
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

function __setTestDb(database) {
  testDatabase = database || null
}

async function readNotificationState(userId) {
  const uid = str(userId)
  if (!uid) return null
  const database = await db()
  const doc = await database.collection(NOTIFICATION_STATES).findOne({ _id: uid }).catch(() => null)
  return doc ? normalizeState(doc) : null
}

async function writeNotificationState(userId, state = {}) {
  const uid = str(userId)
  if (!uid) throw new Error('missing_push_user_id')
  const clean = normalizeState({ ...state, updatedAt: nowMs() })
  const { version, ...fields } = clean
  const database = await db()
  await database.collection(NOTIFICATION_STATES).updateOne(
    { _id: uid },
    {
      $set: {
        ...fields,
        _id: uid,
        userId: uid,
        updatedAt: nowMs(),
        updatedAtISO: new Date().toISOString(),
        storageVersion: VERSION,
      },
      $inc: { version: 1 },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  )
  const doc = await database.collection(NOTIFICATION_STATES).findOne({ _id: uid }).catch(() => null)
  return normalizeState(doc || { ...clean, version: version + 1 })
}

async function savePushSubscription(userId, id, subscription, metadata = {}, options = {}) {
  const uid = str(userId)
  const sid = str(id)
  if (!uid || !sid || !subscription?.endpoint) throw new Error('missing_push_subscription_identity')
  const ttlMs = Math.max(60_000, num(options.ttlMs, DEFAULT_SUBSCRIPTION_TTL_MS))
  const limit = Math.max(1, Math.min(32, Math.floor(num(options.maxSubscriptions, DEFAULT_MAX_SUBSCRIPTIONS_PER_USER))))
  const timestamp = nowMs()
  const database = await db()
  const collection = database.collection(PUSH_SUBSCRIPTIONS)

  await collection.updateOne(
    { _id: sid },
    {
      $set: {
        _id: sid,
        id: sid,
        endpointHash: sid,
        userId: uid,
        subscription,
        lang: str(metadata?.lang || 'en').slice(0, 8) || 'en',
        userAgent: str(metadata?.userAgent).slice(0, 240),
        nativeShell: metadata?.nativeShell === true,
        active: true,
        updatedAt: timestamp,
        updatedAtISO: new Date(timestamp).toISOString(),
        expiresAt: new Date(timestamp + ttlMs),
        storagePrimary: 'mongo',
        storageVersion: VERSION,
        ql7PushMongoPrimary: true,
      },
      $setOnInsert: {
        createdAt: timestamp,
        createdAtISO: new Date(timestamp).toISOString(),
      },
    },
    { upsert: true },
  )

  const rows = await collection
    .find({ userId: uid, active: true })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 32)
    .toArray()
    .catch(() => [])
  const stale = rows.slice(limit).map((row) => str(row?._id || row?.id)).filter(Boolean)
  if (stale.length) {
    await collection.updateMany(
      { _id: { $in: stale }, userId: uid },
      { $set: { active: false, deactivatedAt: timestamp, deactivatedReason: 'subscription_limit' } },
    ).catch(() => null)
  }

  return normalizeSubscriptionRecord(await collection.findOne({ _id: sid }).catch(() => null))
}

async function listPushSubscriptions(userId, options = {}) {
  const uid = str(userId)
  if (!uid) return []
  const limit = Math.max(1, Math.min(32, Math.floor(num(options.limit, DEFAULT_MAX_SUBSCRIPTIONS_PER_USER))))
  const database = await db()
  const rows = await database.collection(PUSH_SUBSCRIPTIONS)
    .find({
      userId: uid,
      active: true,
      expiresAt: { $gt: new Date() },
    })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .toArray()
    .catch(() => [])
  return rows.map(normalizeSubscriptionRecord).filter(Boolean)
}

async function removePushSubscription(userId, id, options = {}) {
  const uid = str(userId)
  const sid = str(id)
  if (!uid || !sid) return false
  const database = await db()
  const collection = database.collection(PUSH_SUBSCRIPTIONS)
  if (options?.deleteRecord === false) {
    const result = await collection.updateOne(
      { _id: sid, userId: uid },
      { $set: { active: false, deactivatedAt: nowMs(), deactivatedReason: 'moved_or_unlinked' } },
    ).catch(() => null)
    return Boolean(result?.matchedCount || result?.modifiedCount)
  }
  const result = await collection.deleteOne({ _id: sid, userId: uid }).catch(() => null)
  return Boolean(result?.deletedCount)
}

module.exports = {
  DEFAULT_MAX_SUBSCRIPTIONS_PER_USER,
  DEFAULT_SUBSCRIPTION_TTL_MS,
  NOTIFICATION_STATES,
  PUSH_SUBSCRIPTIONS,
  VERSION,
  __setTestDb,
  listPushSubscriptions,
  normalizeState,
  normalizeSubscriptionRecord,
  readNotificationState,
  removePushSubscription,
  savePushSubscription,
  writeNotificationState,
}
