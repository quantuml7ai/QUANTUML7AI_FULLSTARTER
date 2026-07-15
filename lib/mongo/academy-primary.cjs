// lib/mongo/academy-primary.cjs
// Mongo-primary Academy exam state repository.

const { createHash } = require('node:crypto')
const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7AcademyPrimaryIndexesV1'
const COLLECTION = 'academy_exams'

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowIso() {
  return new Date().toISOString()
}

function sha256(value) {
  return createHash('sha256').update(String(value || '')).digest('hex')
}

function academyExamRedisKey(userId, blockId) {
  const uid = str(userId)
  const block = str(blockId)
  return uid && block ? `academy:exam:${uid}:${block}` : ''
}

function unique(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(str).filter(Boolean)))
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
    database.collection(COLLECTION).createIndex({ examId: 1 }, { unique: true, sparse: true }),
    database.collection(COLLECTION).createIndex({ userId: 1, blockId: 1 }, { unique: true, sparse: true }),
    database.collection(COLLECTION).createIndex({ userId: 1, blockNumber: 1 }),
    database.collection(COLLECTION).createIndex({ sourceRedisKeyHash: 1 }),
    database.collection(COLLECTION).createIndex({ updatedAt: -1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

function normalizeState(value = {}) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    done: num(raw.done, 0),
    correct: num(raw.correct, 0),
    cooldownUntil: num(raw.cooldownUntil, 0),
    updatedAt: num(raw.updatedAt, Date.now()),
  }
}

function docToState(doc) {
  if (!doc) return {}
  const state = normalizeState(doc)
  return {
    done: state.done,
    correct: state.correct,
    cooldownUntil: state.cooldownUntil,
    updatedAt: state.updatedAt,
  }
}

function buildDoc({ userId, blockId, state = {} } = {}) {
  const uid = str(userId)
  const block = str(blockId)
  if (!uid || !block) throw new Error('missing_academy_exam_identity')
  const sourceRedisKey = academyExamRedisKey(uid, block)
  const sourceRedisKeyHash = sha256(sourceRedisKey)
  const clean = normalizeState(state)
  const iso = nowIso()
  return {
    _id: sourceRedisKey,
    examId: sourceRedisKey,
    userId: uid,
    blockId: block,
    blockNumber: num(block, 0),
    done: clean.done,
    correct: clean.correct,
    cooldownUntil: clean.cooldownUntil,
    updatedAt: clean.updatedAt || Date.now(),
    updatedAtISO: iso,
    sourceRedisKey,
    sourceRedisKeyHash,
    sourceRedisKeyHashes: [sourceRedisKeyHash],
    storagePrimary: 'mongo',
    ql7AcademyExamMongoPrimary: true,
    _migration: {
      mongoPrimary: true,
      sourceRedisKey,
      sourceRedisKeyHash,
      sourceRedisKeyHashes: [sourceRedisKeyHash],
      updatedAt: iso,
    },
  }
}

async function readExamState({ userId, blockId, aliases = [] } = {}) {
  const uid = str(userId)
  const block = str(blockId)
  if (!uid || !block) return {}
  const blockNumber = num(block, NaN)
  const ids = unique([uid, ...aliases])
  const clauses = []
  for (const candidate of ids) {
    const sourceRedisKey = academyExamRedisKey(candidate, block)
    const sourceRedisKeyHash = sha256(sourceRedisKey)
    clauses.push(
      { _id: sourceRedisKey },
      { examId: sourceRedisKey },
      { userId: candidate, blockId: block },
      { sourceRedisKey },
      { sourceRedisKeyHash },
      { sourceRedisKeyHashes: sourceRedisKeyHash },
      { '_migration.sourceRedisKey': sourceRedisKey },
      { '_migration.sourceRedisKeyHash': sourceRedisKeyHash },
      { '_migration.sourceRedisKeyHashes': sourceRedisKeyHash },
    )
    if (Number.isFinite(blockNumber)) clauses.push({ userId: candidate, blockNumber })
  }
  const database = await db()
  const collection = database.collection(COLLECTION)
  let rows = []
  try {
    if (typeof collection.find === 'function') {
      rows = await collection
        .find({ $or: clauses })
        .sort({ done: -1, correct: -1, updatedAt: -1, updatedAtISO: -1 })
        .limit(20)
        .toArray()
    }
  } catch {
    rows = []
  }
  if (!rows.length) {
    const doc = await collection.findOne({ $or: clauses }).catch(() => null)
    rows = doc ? [doc] : []
  }
  return docToState(rows?.[0] || null)
}

async function writeExamState({ userId, blockId, state = {} } = {}) {
  const doc = buildDoc({ userId, blockId, state })
  const database = await db()
  await database.collection(COLLECTION).updateOne(
    { _id: doc._id },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
  return docToState(doc)
}

module.exports = {
  COLLECTION,
  __setTestDb,
  academyExamRedisKey,
  buildDoc,
  normalizeState,
  readExamState,
  writeExamState,
}
