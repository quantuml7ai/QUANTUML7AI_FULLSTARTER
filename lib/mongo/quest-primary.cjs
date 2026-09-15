// lib/mongo/quest-primary.cjs
// Mongo-primary Quest progress repository.

const { createHash } = require('node:crypto')
const { getMongoDb } = require('./client.cjs')
const profilePrimary = require('./profile-primary.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')

const INDEX_KEY = '__ql7QuestPrimaryIndexesV1'
const COLLECTION = 'quest_progress'
const BACKFILL_VERSION = 'quest-progress-live-backfill-v2'

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function sha256(value) {
  return createHash('sha256').update(String(value || '')).digest('hex')
}

function normalizeCardId(value) {
  const match = String(value ?? '').match(/(\d+)$/)
  return match ? match[1] : str(value)
}

function uniqStrings(value) {
  return Array.from(new Set((Array.isArray(value) ? value : []).map(String)))
}

function cleanCard(card = {}) {
  const raw = card && typeof card === 'object' && !Array.isArray(card) ? card : {}
  const out = {}
  if (Array.isArray(raw.done)) out.done = uniqStrings(raw.done)
  for (const key of ['claimed', 'ts', 'claimReadyTs', 'claimTs', 'taskCount', 'taskDelayMs']) {
    if (raw[key] !== undefined) out[key] = raw[key]
  }
  return out
}

function progressRedisKey(userId) {
  const uid = str(userId)
  return uid ? `quest:progress:${uid}` : ''
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
    database.collection(COLLECTION).createIndex({ progressId: 1 }, { unique: true, sparse: true }),
    database.collection(COLLECTION).createIndex({ userId: 1, cardId: 1 }),
    database.collection(COLLECTION).createIndex({ userRef: 1 }),
    database.collection(COLLECTION).createIndex({ sourceRedisKeyHash: 1 }),
    database.collection(COLLECTION).createIndex({ updatedAt: -1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

async function resolveQuestPrincipal(raw) {
  const syntax = canonicalUserId.normalizePrincipalSyntax(raw)
  if (!syntax) return ''
  if (testDatabase) return syntax

  const canonical = await profilePrimary
    .resolveCanonicalAccountId(syntax)
    .catch(() => '')

  return canonical || syntax
}

async function questReadIds(raw) {
  const syntax = canonicalUserId.normalizePrincipalSyntax(raw)
  if (!syntax) return []

  const ids = new Set([syntax, str(raw)].filter(Boolean))

  const walletId = canonicalUserId.normalizeWalletId(raw)
  if (walletId) {
    ids.add(walletId)
    ids.add(walletId.toLowerCase())
    ids.add(`wallet:${walletId.toLowerCase()}`)
  }

  const telegramId = canonicalUserId.normalizeTelegramId(raw)
  if (telegramId) {
    ids.add(telegramId)
    ids.add(`telegram:${telegramId}`)
    ids.add(`telegramid:${telegramId}`)
    ids.add(`telegram:id:${telegramId}`)
    ids.add(`tguid:${telegramId}`)
    ids.add(`tg:${telegramId}`)
    ids.add(`tg:uid:${telegramId}`)
  }

  if (!testDatabase) {
    const linked = await profilePrimary
      .getLinkedIdentityIds(syntax)
      .catch(() => [])
    for (const value of linked || []) if (str(value)) ids.add(str(value))
  }

  return Array.from(ids)
}

function cardDoc({ userId, cardId, rawCardId = '', card = {} } = {}) {
  const uid = str(userId)
  const normalizedCardId = normalizeCardId(cardId || rawCardId)
  const sourceRedisKey = progressRedisKey(uid)
  const sourceRedisKeyHash = sha256(sourceRedisKey)
  const clean = cleanCard(card)
  const now = new Date()
  const progressId = `quest:progress:${uid}:${normalizedCardId}`
  const doc = {
    _id: progressId,
    progressId,
    userId: uid,
    userRef: uid,
    cardId: normalizedCardId,
    rawCardId: str(rawCardId || cardId || normalizedCardId),
    done: clean.done || [],
    claimed: clean.claimed === true,
    ts: clean.ts,
    claimReadyTs: clean.claimReadyTs,
    claimTs: clean.claimTs,
    taskCount: clean.taskCount,
    taskDelayMs: clean.taskDelayMs,
    progress: clean,
    sourceRedisKey,
    sourceRedisKeyHash,
    sourceRedisKeyHashes: [sourceRedisKeyHash],
    storagePrimary: 'mongo',
    ql7QuestProgressMongoPrimary: true,
    updatedAt: now,
    _migration: {
      finalBackfillVersion: BACKFILL_VERSION,
      mongoPrimary: true,
      sourceRedisKey,
      sourceRedisKeyHash,
      sourceRedisKeyHashes: [sourceRedisKeyHash],
      updatedAt: now.toISOString(),
    },
  }
  Object.keys(doc).forEach((key) => {
    if (doc[key] === undefined) delete doc[key]
  })
  return doc
}

function docToCard(doc = {}) {
  const embedded = doc.progress && typeof doc.progress === 'object' && !Array.isArray(doc.progress) ? doc.progress : {}
  return cleanCard({
    ...embedded,
    done: Array.isArray(doc.done) ? doc.done : embedded.done,
    claimed: doc.claimed ?? embedded.claimed,
    ts: doc.ts ?? embedded.ts,
    claimReadyTs: doc.claimReadyTs ?? embedded.claimReadyTs,
    claimTs: doc.claimTs ?? embedded.claimTs,
    taskCount: doc.taskCount ?? embedded.taskCount,
    taskDelayMs: doc.taskDelayMs ?? embedded.taskDelayMs,
  })
}

function progressDocTime(doc = {}) {
  const value = doc?.updatedAt ?? doc?.createdAt ?? doc?.ts ?? 0
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

async function findExistingProgressDoc(database, userId, cardId) {
  const uid = await resolveQuestPrincipal(userId)
  const identityIds = await questReadIds(userId)
  const normalizedCardId = normalizeCardId(cardId)
  if (!uid || !normalizedCardId || !identityIds.length) return null

  const sourceRedisKeys = identityIds.map(progressRedisKey).filter(Boolean)
  const sourceRedisKeyHashes = sourceRedisKeys.map(sha256)
  const progressIds = identityIds.map((id) => `quest:progress:${id}:${normalizedCardId}`)
  const docs = await database.collection(COLLECTION).find({
    cardId: { $in: [normalizedCardId, str(cardId)] },
    $or: [
      { _id: { $in: progressIds } },
      { progressId: { $in: progressIds } },
      { userId: { $in: identityIds } },
      { userRef: { $in: identityIds } },
      { sourceRedisKey: { $in: sourceRedisKeys } },
      { sourceRedisKeyHash: { $in: sourceRedisKeyHashes } },
      { sourceRedisKeyHashes: { $in: sourceRedisKeyHashes } },
      { '_migration.sourceRedisKey': { $in: sourceRedisKeys } },
      { '_migration.sourceRedisKeyHash': { $in: sourceRedisKeyHashes } },
      { '_migration.sourceRedisKeyHashes': { $in: sourceRedisKeyHashes } },
    ],
  }).limit(100).toArray().catch(() => [])

  return docs.find((doc) => (
    str(doc?._id) === `quest:progress:${uid}:${normalizedCardId}` ||
    str(doc?.progressId) === `quest:progress:${uid}:${normalizedCardId}` ||
    str(doc?.userId) === uid ||
    str(doc?.userRef) === uid
  )) || docs.sort((a, b) => progressDocTime(b) - progressDocTime(a))[0] || null
}

async function readProgress(userId) {
  const identityIds = await questReadIds(userId)
  if (!identityIds.length) return {}

  const sourceRedisKeys = identityIds.map(progressRedisKey).filter(Boolean)
  const sourceRedisKeyHashes = sourceRedisKeys.map(sha256)
  const database = await db()
  const docs = await database.collection(COLLECTION)
    .find({
      $or: [
        { userId: { $in: identityIds } },
        { userRef: { $in: identityIds } },
        { sourceRedisKey: { $in: sourceRedisKeys } },
        { sourceRedisKeyHash: { $in: sourceRedisKeyHashes } },
        { sourceRedisKeyHashes: { $in: sourceRedisKeyHashes } },
        { '_migration.sourceRedisKey': { $in: sourceRedisKeys } },
        { '_migration.sourceRedisKeyHash': { $in: sourceRedisKeyHashes } },
        { '_migration.sourceRedisKeyHashes': { $in: sourceRedisKeyHashes } },
      ],
    })
    .sort({ updatedAt: -1 })
    .limit(500)
    .toArray()

  const progress = {}
  for (const doc of docs) {
    const cardId = normalizeCardId(doc.cardId || doc.rawCardId)
    if (!cardId) continue
    const next = docToCard(doc)
    const current = progress[cardId]
    const currentDone = Array.isArray(current?.done) ? current.done.length : -1
    const nextDone = Array.isArray(next?.done) ? next.done.length : -1
    if (!current || nextDone >= currentDone) progress[cardId] = next
  }
  return progress
}

async function writeCard(userId, cardId, card, { rawCardId = '' } = {}) {
  const uid = await resolveQuestPrincipal(userId)
  const normalizedCardId = normalizeCardId(cardId || rawCardId)
  if (!uid || !normalizedCardId) throw new Error('missing_quest_progress_identity')
  const database = await db()
  const doc = cardDoc({ userId: uid, cardId: normalizedCardId, rawCardId, card })
  const existing = await findExistingProgressDoc(database, userId, normalizedCardId)
  const setDoc = { ...doc }
  delete setDoc._id
  await database.collection(COLLECTION).updateOne(
    existing?._id ? { _id: existing._id } : { progressId: doc.progressId },
    { $set: setDoc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
  return { ...doc, _id: existing?._id || doc._id }
}

async function writeProgress(userId, progress = {}, { rawCardId = '' } = {}) {
  const uid = await resolveQuestPrincipal(userId)
  const source = progress && typeof progress === 'object' && !Array.isArray(progress) ? progress : {}
  const docs = []
  for (const [key, card] of Object.entries(source)) {
    const cardId = normalizeCardId(key)
    if (!cardId) continue
    docs.push(await writeCard(uid, cardId, card, { rawCardId: rawCardId || key }))
  }
  return { ok: true, written: docs.length, docs }
}

module.exports = {
  BACKFILL_VERSION,
  COLLECTION,
  __setTestDb,
  cardDoc,
  cleanCard,
  progressRedisKey,
  readProgress,
  writeCard,
  writeProgress,
}
