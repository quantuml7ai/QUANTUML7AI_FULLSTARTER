// Mongo-primary repository for legacy /api/pay invoices and webhook snapshots.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7PaymentsPrimaryIndexesV1'
let testDatabase = null

function str(value) { return String(value ?? '').trim() }
function nowIso() { return new Date().toISOString() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return value } }

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
    database.collection('payment_counters').createIndex({ _id: 1 }),
    database.collection('payment_invoices').createIndex({ internalId: 1 }, { unique: true, sparse: true }),
    database.collection('payment_invoices').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
    database.collection('payment_invoices').createIndex({ externalId: 1 }, { sparse: true }),
    database.collection('payment_invoices').createIndex({ paymentId: 1 }, { sparse: true }),
    database.collection('payment_invoices').createIndex({ accountId: 1, type: 1, createdAt: -1 }),
    database.collection('payment_invoices').createIndex({ status: 1, updatedAt: -1 }),
    database.collection('payment_legacy_snapshots').createIndex({ _id: 1 }),
    database.collection('payment_webhook_runtime').createIndex({ _id: 1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

function normalizeInvoice(invoice = {}) {
  const internalId = str(invoice.internalId || invoice.id)
  if (!internalId) throw new Error('payment_invoice_internal_id_required')
  const copy = clone(invoice) || {}
  copy.id = str(copy.id || internalId)
  copy.internalId = internalId
  copy.updatedAt = str(copy.updatedAt) || nowIso()
  copy.storagePrimary = 'mongo'
  return copy
}

async function nextInvoiceId() {
  const database = await db()
  const result = await database.collection('payment_counters').findOneAndUpdate(
    { _id: 'invoice:seq' },
    {
      $inc: { value: 1 },
      $set: { key: 'invoice:seq', updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && typeof result === 'object' && result._id ? result : result?.value
  return String(Number(doc?.value || 0))
}

async function saveInvoice(invoice = {}) {
  const database = await db()
  const clean = normalizeInvoice(invoice)
  const createdAt = str(clean.createdAt) || nowIso()
  const { createdAt: _createdAt, ...settable } = clean
  await database.collection('payment_invoices').updateOne(
    { _id: `invoice:${clean.internalId}` },
    {
      $set: settable,
      $setOnInsert: { createdAt },
    },
    { upsert: true },
  )
  return clean
}

async function readInvoice(internalId) {
  const database = await db()
  const id = str(internalId)
  if (!id) return null
  const doc = await database.collection('payment_invoices').findOne({ _id: `invoice:${id}` }).catch(() => null)
  return doc ? clone(doc) : null
}

async function findInvoiceInternalId({ externalInvoiceId = '', orderId = '', paymentId = '' } = {}) {
  const database = await db()
  const clauses = []
  if (str(externalInvoiceId)) clauses.push({ externalId: str(externalInvoiceId) })
  if (str(orderId)) clauses.push({ orderId: str(orderId) })
  if (str(paymentId)) clauses.push({ paymentId: str(paymentId) })
  if (!clauses.length) return null
  const doc = await database.collection('payment_invoices').findOne({ $or: clauses }).catch(() => null)
  return doc?.internalId ? str(doc.internalId) : null
}

async function saveLegacySnapshot(key, fields = {}) {
  const database = await db()
  const id = str(key)
  if (!id) return null
  const patch = clone(fields) || {}
  const createdAt = str(patch.createdAt) || nowIso()
  delete patch.createdAt
  await database.collection('payment_legacy_snapshots').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        ...patch,
        updatedAt: patch.updatedAt || nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt },
    },
    { upsert: true },
  )
  return { ok: true, key: id }
}

async function saveWebhookRuntime(key, value = {}) {
  const database = await db()
  const id = str(key)
  if (!id) return null
  await database.collection('payment_webhook_runtime').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        value: clone(value),
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return { ok: true, key: id }
}

module.exports = {
  __setTestDb,
  findInvoiceInternalId,
  nextInvoiceId,
  readInvoice,
  saveInvoice,
  saveLegacySnapshot,
  saveWebhookRuntime,
}
