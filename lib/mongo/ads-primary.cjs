// Mongo-primary storage adapter for the legacy adsCore Redis key model.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7AdsPrimaryIndexesV1'
let testDatabase = null

function nowIso() { return new Date().toISOString() }
function str(value) { return String(value ?? '').trim() }
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
    database.collection('ads_kv').createIndex({ _id: 1 }),
    database.collection('ads_sets').createIndex({ _id: 1 }),
    database.collection('ads_counters').createIndex({ _id: 1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

async function setJSON(key, value) {
  const database = await db()
  const id = str(key)
  await database.collection('ads_kv').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        type: 'json',
        value: clone(value),
        raw: JSON.stringify(value),
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return 'OK'
}

async function getJSON(key) {
  const database = await db()
  const doc = await database.collection('ads_kv').findOne({ _id: str(key) }).catch(() => null)
  if (!doc) return null
  if (doc.type === 'json' && doc.value != null) return clone(doc.value)
  if (doc.raw != null) {
    try { return JSON.parse(String(doc.raw)) } catch {}
  }
  return doc.value ?? null
}

async function setString(key, value) {
  const database = await db()
  const id = str(key)
  await database.collection('ads_kv').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        type: 'string',
        value: String(value ?? ''),
        raw: String(value ?? ''),
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return 'OK'
}

async function getString(key) {
  const database = await db()
  const doc = await database.collection('ads_kv').findOne({ _id: str(key) }).catch(() => null)
  if (!doc) return null
  const value = doc.raw ?? doc.value
  return value == null ? null : String(value)
}

async function incr(key) {
  const database = await db()
  const id = str(key)
  const result = await database.collection('ads_counters').findOneAndUpdate(
    { _id: id },
    {
      $inc: { value: 1 },
      $set: { key: id, updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && typeof result === 'object' && result._id ? result : result?.value
  return Number(doc?.value || 0)
}

function uniq(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(str).filter(Boolean)))
}

async function readSetDoc(key) {
  const database = await db()
  return database.collection('ads_sets').findOne({ _id: str(key) }).catch(() => null)
}

async function writeSet(key, members) {
  const database = await db()
  const id = str(key)
  const clean = uniq(members)
  await database.collection('ads_sets').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        members: clean,
        count: clean.length,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return clean
}

async function sadd(key, member) {
  const cleanMember = str(member)
  if (!cleanMember) return 0
  const doc = await readSetDoc(key)
  const before = uniq(doc?.members)
  const next = uniq([...before, cleanMember])
  await writeSet(key, next)
  return next.length > before.length ? 1 : 0
}

async function srem(key, member) {
  const cleanMember = str(member)
  const before = uniq((await readSetDoc(key))?.members)
  const next = before.filter((item) => item !== cleanMember)
  await writeSet(key, next)
  return before.length === next.length ? 0 : 1
}

async function smembers(key) {
  return uniq((await readSetDoc(key))?.members)
}

async function delKey(key) {
  const database = await db()
  const id = str(key)
  await Promise.allSettled([
    database.collection('ads_kv').deleteOne({ _id: id }),
    database.collection('ads_sets').deleteOne({ _id: id }),
    database.collection('ads_counters').deleteOne({ _id: id }),
  ])
  return 1
}

async function updatePackageUsedCampaigns(pkgKey, delta, now = nowIso()) {
  const pkg = await getJSON(pkgKey)
  if (!pkg) return { ok: false, error: 'NO_PKG' }
  const maxC = Number(pkg.maxCampaigns || 0)
  const used = Number(pkg.usedCampaigns || 0)
  let nextUsed = used + Number(delta || 0)
  if (nextUsed < 0) nextUsed = 0
  if (maxC > 0 && nextUsed > maxC) return { ok: false, error: 'LIMIT_REACHED' }
  pkg.usedCampaigns = nextUsed
  pkg.updatedAt = now
  await setJSON(pkgKey, pkg)
  return { ok: true, used: nextUsed }
}

module.exports = {
  __setTestDb,
  delKey,
  getJSON,
  getString,
  incr,
  sadd,
  setJSON,
  setString,
  smembers,
  srem,
  updatePackageUsedCampaigns,
}
