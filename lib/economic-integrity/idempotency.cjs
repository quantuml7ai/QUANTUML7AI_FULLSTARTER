let testDb = null
function str(value) { return String(value ?? '').trim() }
async function db() {
  if (testDb) return testDb
  const { getMongoDb } = require('../mongo/client.cjs')
  const { bindMongoDatabase } = require('../mongo/transaction-context.cjs')
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  return bindMongoDatabase(database)
}
async function claim(key, { operationId = '', envelopeHash = '', routeId = '', actorAccountId = '', targetAccountId = '' } = {}) {
  const id = str(key)
  if (!id) throw new Error('economic_idempotency_key_required')
  const database = await db()
  const collection = database.collection('economic_idempotency')
  const existing = await collection.findOne({ _id: id }).catch(() => null)
  if (existing) return { claimed: false, existing }
  try {
    const createdAt = new Date().toISOString()
    await collection.insertOne({ _id: id, schemaVersion: 1, operationId, envelopeHash, routeId, actorAccountId: str(actorAccountId), targetAccountId: str(targetAccountId), state: 'claimed', createdAt, updatedAt: createdAt })
    return { claimed: true, existing: null }
  } catch (error) {
    if (error?.code === 11000) return { claimed: false, existing: await collection.findOne({ _id: id }).catch(() => null) }
    throw error
  }
}
async function commit(key, payload = {}) {
  const database = await db()
  await database.collection('economic_idempotency').updateOne(
    { _id: str(key) },
    { $set: { schemaVersion: 1, state: 'committed', result: payload, committedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
    { upsert: false },
  )
}
async function release(key, reason = 'aborted') {
  const database = await db()
  await database.collection('economic_idempotency').updateOne(
    { _id: str(key), state: 'claimed' },
    { $set: { schemaVersion: 1, state: 'aborted', abortReason: str(reason), abortedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
    { upsert: false },
  ).catch(() => null)
}
function __setTestDb(value) { testDb = value || null }
module.exports = { claim, commit, release, __setTestDb }
