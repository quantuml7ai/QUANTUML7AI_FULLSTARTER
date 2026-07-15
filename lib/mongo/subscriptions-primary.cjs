// Mongo-primary VIP/subscription entitlement repository.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7SubscriptionsPrimaryIndexesV1'
let testDatabase = null

function str(value) { return String(value ?? '').trim().toLowerCase() }
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
    database.collection('vip_subscriptions').createIndex({ accountId: 1 }, { unique: true, sparse: true }),
    database.collection('vip_subscriptions').createIndex({ untilISO: 1 }),
    database.collection('vip_payment_dedupe').createIndex({ paymentId: 1 }, { unique: true, sparse: true }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

async function getVip(accountId) {
  const id = str(accountId)
  if (!id) return null
  const database = await db()
  const doc = await database.collection('vip_subscriptions').findOne({ _id: `vip:${id}` }).catch(() => null)
  return doc?.untilISO || null
}

async function markPaymentSeen(paymentId) {
  const pid = str(paymentId)
  if (!pid) return false
  const database = await db()
  const existing = await database.collection('vip_payment_dedupe').findOne({ _id: `pay:${pid}` }).catch(() => null)
  if (existing) return true
  await database.collection('vip_payment_dedupe').updateOne(
    { _id: `pay:${pid}` },
    {
      $set: { paymentId: pid, updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return false
}

async function setVip(accountId, untilISO, { paymentId } = {}) {
  const id = str(accountId)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }
  if (paymentId && await markPaymentSeen(paymentId)) return { ok: true, duplicated: true }

  const currentISO = await getVip(id)
  const current = currentISO ? new Date(currentISO) : new Date(0)
  const next = new Date(untilISO)
  const final = current > next ? current : next
  const finalISO = final.toISOString()
  const database = await db()
  await database.collection('vip_subscriptions').updateOne(
    { _id: `vip:${id}` },
    {
      $set: {
        accountId: id,
        untilISO: finalISO,
        active: Number.isFinite(final.getTime()) && final.getTime() > Date.now(),
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return { ok: true, until: finalISO }
}

async function clearVip(accountId, paymentId = '') {
  const id = str(accountId)
  const pid = str(paymentId)
  const database = await db()
  await Promise.allSettled([
    id ? database.collection('vip_subscriptions').deleteOne({ _id: `vip:${id}` }) : Promise.resolve(),
    pid ? database.collection('vip_payment_dedupe').deleteOne({ _id: `pay:${pid}` }) : Promise.resolve(),
  ])
  return { ok: true }
}

module.exports = {
  __setTestDb,
  clearVip,
  getVip,
  markPaymentSeen,
  setVip,
}
