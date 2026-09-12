// lib/security/ql7-server-secret.cjs
// QL7_GEO111_FINAL_FOUNDATION_V1
// Mongo-backed runtime secret storage. The raw secret is never printed by helper scripts.

const crypto = require('node:crypto')

const {
  getMongoDb,
} = require('../mongo/client.cjs')

const RUNTIME_SECRET_COLLECTION = 'ql7_runtime_secrets'
const FORUM_CURSOR_SECRET_ID = 'forum_cursor_hmac:v1'
const FORUM_CURSOR_SECRET_PURPOSE = 'forum_cursor_hmac'
const FORUM_CURSOR_ROTATION_VERSION = 1

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function nowIso() {
  return new Date().toISOString()
}

function createSecretValue() {
  return crypto.randomBytes(48).toString('base64url')
}

function normalizeSecretDoc(doc) {
  const secret = String(doc && doc.secretEncryptedOrRawDevSafe ? doc.secretEncryptedOrRawDevSafe : '')
  if (!secret || secret.length < 32) {
    const error = new Error('Forum runtime secret is missing or invalid')
    error.code = 'QL7_FORUM_RUNTIME_SECRET_INVALID'
    throw error
  }

  return {
    _id: String(doc._id),
    purpose: String(doc.purpose || FORUM_CURSOR_SECRET_PURPOSE),
    rotationVersion: Number(doc.rotationVersion || FORUM_CURSOR_ROTATION_VERSION),
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    secret,
    secretHash: sha256Hex(secret),
  }
}

async function readForumRuntimeSecretDoc() {
  const { db, dbName, runtime } = await getMongoDb()
  const collection = db.collection(RUNTIME_SECRET_COLLECTION)
  const doc = await collection.findOne({ _id: FORUM_CURSOR_SECRET_ID })

  return { db, dbName, runtime, collection, doc }
}

async function ensureForumRuntimeSecret() {
  const current = await readForumRuntimeSecretDoc()

  if (current.doc) {
    const normalized = normalizeSecretDoc(current.doc)
    return {
      ok: true,
      created: false,
      collection: RUNTIME_SECRET_COLLECTION,
      dbName: current.dbName,
      runtime: current.runtime,
      _id: normalized._id,
      purpose: normalized.purpose,
      rotationVersion: normalized.rotationVersion,
      secretHash: normalized.secretHash,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    }
  }

  const timestamp = nowIso()
  const secret = createSecretValue()
  const doc = {
    _id: FORUM_CURSOR_SECRET_ID,
    purpose: FORUM_CURSOR_SECRET_PURPOSE,
    secretEncryptedOrRawDevSafe: secret,
    createdAt: timestamp,
    updatedAt: timestamp,
    rotationVersion: FORUM_CURSOR_ROTATION_VERSION,
  }

  try {
    await current.collection.insertOne(doc)
  } catch (error) {
    if (error && error.code === 11000) {
      const reread = await current.collection.findOne({ _id: FORUM_CURSOR_SECRET_ID })
      const normalized = normalizeSecretDoc(reread)
      return {
        ok: true,
        created: false,
        collection: RUNTIME_SECRET_COLLECTION,
        dbName: current.dbName,
        runtime: current.runtime,
        _id: normalized._id,
        purpose: normalized.purpose,
        rotationVersion: normalized.rotationVersion,
        secretHash: normalized.secretHash,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
      }
    }
    throw error
  }

  await current.collection.createIndex({ purpose: 1 }, { name: 'purpose_1' })

  const normalized = normalizeSecretDoc(doc)
  return {
    ok: true,
    created: true,
    collection: RUNTIME_SECRET_COLLECTION,
    dbName: current.dbName,
    runtime: current.runtime,
    _id: normalized._id,
    purpose: normalized.purpose,
    rotationVersion: normalized.rotationVersion,
    secretHash: normalized.secretHash,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  }
}

async function getForumRuntimeSecret() {
  const envSecret = String(process.env.QL7_FORUM_CURSOR_SECRET || process.env.FORUM_CURSOR_HMAC_SECRET || '').trim()
  if (envSecret && envSecret.length >= 32) {
    return {
      secret: envSecret,
      secretHash: sha256Hex(envSecret),
      rotationVersion: FORUM_CURSOR_ROTATION_VERSION,
      dbName: 'env',
      runtime: 'env',
    }
  }

  const current = await readForumRuntimeSecretDoc()
  if (!current.doc) {
    const error = new Error('Forum runtime secret was not seeded. Run scripts/forum-security/ensure-forum-runtime-secret.mjs first.')
    error.code = 'QL7_FORUM_RUNTIME_SECRET_NOT_SEEDED'
    throw error
  }

  const normalized = normalizeSecretDoc(current.doc)
  return {
    secret: normalized.secret,
    secretHash: normalized.secretHash,
    rotationVersion: normalized.rotationVersion,
    dbName: current.dbName,
    runtime: current.runtime,
  }
}

async function getForumRuntimeSecretStatus() {
  const current = await readForumRuntimeSecretDoc()
  if (!current.doc) {
    return {
      ok: false,
      exists: false,
      collection: RUNTIME_SECRET_COLLECTION,
      dbName: current.dbName,
      runtime: current.runtime,
    }
  }

  const normalized = normalizeSecretDoc(current.doc)
  return {
    ok: true,
    exists: true,
    collection: RUNTIME_SECRET_COLLECTION,
    dbName: current.dbName,
    runtime: current.runtime,
    _id: normalized._id,
    purpose: normalized.purpose,
    rotationVersion: normalized.rotationVersion,
    secretHash: normalized.secretHash,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  }
}

async function deriveForumRuntimeSecret(domain) {
  const normalizedDomain = String(domain || '').trim()
  if (!normalizedDomain) {
    const error = new Error('Cursor domain is required for derived forum secret')
    error.code = 'QL7_FORUM_CURSOR_DOMAIN_REQUIRED'
    throw error
  }

  const { secret, rotationVersion } = await getForumRuntimeSecret()
  const derived = crypto
    .createHmac('sha256', secret)
    .update('ql7-forum-runtime-secret:')
    .update(String(rotationVersion))
    .update(':')
    .update(normalizedDomain)
    .digest()

  return {
    domain: normalizedDomain,
    rotationVersion,
    key: derived,
  }
}

module.exports = {
  FORUM_CURSOR_ROTATION_VERSION,
  FORUM_CURSOR_SECRET_ID,
  FORUM_CURSOR_SECRET_PURPOSE,
  RUNTIME_SECRET_COLLECTION,
  deriveForumRuntimeSecret,
  ensureForumRuntimeSecret,
  getForumRuntimeSecret,
  getForumRuntimeSecretStatus,
  sha256Hex,
}
