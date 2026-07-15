// Mongo-primary storage for MetaStudio registration interest state.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7MetastudioPrimaryIndexesV1'
let testDatabase = null

function str(value) { return String(value ?? '').trim() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return value } }
function nowIso() { return new Date().toISOString() }

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
    database.collection('metastudio_registrations').createIndex({ accountId: 1 }, { unique: true }),
    database.collection('metastudio_registrations').createIndex({ updatedAt: -1 }),
    database.collection('metastudio_registrations').createIndex({ clientHash: 1 }),
    database.collection('metastudio_registration_latest').createIndex({ latestAt: -1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

async function readRegistration(accountId) {
  const id = str(accountId)
  if (!id) return null
  const database = await db()
  const doc = await database.collection('metastudio_registrations').findOne({ $or: [{ accountId: id }, { _id: id }] }).catch(() => null)
  return doc ? clone(doc) : null
}

async function upsertRegistration(accountId, patch = {}) {
  const id = str(accountId)
  if (!id) throw new Error('metastudio_account_id_required')
  const database = await db()
  const existing = await readRegistration(id)
  const iso = str(patch.updatedAt) || nowIso()
  const registration = {
    ...clone(existing || {}),
    ...clone(patch || {}),
    _id: id,
    accountId: id,
    registeredAt: str(existing?.registeredAt || patch.registeredAt) || iso,
    createdAt: str(existing?.createdAt || patch.createdAt) || iso,
    updatedAt: iso,
    seenCount: Number(existing?.seenCount || 0) + 1,
    storagePrimary: 'mongo',
  }
  const settable = { ...registration }
  delete settable._id
  delete settable.createdAt
  await database.collection('metastudio_registrations').updateOne(
    { accountId: id },
    { $set: settable, $setOnInsert: { _id: id, createdAt: registration.createdAt } },
    { upsert: true },
  )
  await database.collection('metastudio_registration_latest').updateOne(
    { accountId: id },
    {
      $set: {
        accountId: id,
        latestAt: registration.updatedAt,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { _id: id, createdAt: registration.createdAt },
    },
    { upsert: true },
  )
  return { registration, existing }
}

function buildLegacyRegistrationWrites(accountId, legacy = {}) {
  const id = str(accountId)
  if (!id) throw new Error('metastudio_account_id_required')
  const source = clone(legacy) || {}
  delete source._id
  const iso = str(source.updatedAt) || nowIso()
  const createdAt = str(source.createdAt) || str(source.registeredAt) || iso
  const registration = {
    ...source,
    _id: id,
    accountId: id,
    createdAt,
    registeredAt: str(source.registeredAt) || createdAt,
    updatedAt: iso,
    seenCount: Number.isFinite(Number(source.seenCount)) ? Number(source.seenCount) : 1,
    storagePrimary: 'mongo',
    backfilledFromRedis: true,
  }
  const settable = { ...registration }
  delete settable._id
  delete settable.createdAt
  return {
    registration,
    registrationWrite: {
      updateOne: {
        filter: { accountId: id },
        update: { $set: settable, $setOnInsert: { _id: id, createdAt } },
        upsert: true,
      },
    },
    latestWrite: {
      updateOne: {
        filter: { accountId: id },
        update: {
          $set: {
            accountId: id,
            latestAt: iso,
            storagePrimary: 'mongo',
            backfilledFromRedis: true,
          },
          $setOnInsert: { _id: id, createdAt },
        },
        upsert: true,
      },
    },
  }
}

async function importLegacyRegistration(accountId, legacy = {}) {
  const database = await db()
  const writes = buildLegacyRegistrationWrites(accountId, legacy)
  await database.collection('metastudio_registrations').updateOne(
    writes.registrationWrite.updateOne.filter,
    writes.registrationWrite.updateOne.update,
    { upsert: true },
  )
  await database.collection('metastudio_registration_latest').updateOne(
    writes.latestWrite.updateOne.filter,
    writes.latestWrite.updateOne.update,
    { upsert: true },
  )
  return writes.registration
}

module.exports = {
  __setTestDb,
  buildLegacyRegistrationWrites,
  importLegacyRegistration,
  readRegistration,
  upsertRegistration,
}
