// Mongo-primary VIP/subscription entitlement repository.

const { getMongoDb } = require('./client.cjs')
const { bindMongoDatabase } = require('./transaction-context.cjs')
const { assertEconomicWriterReceipt } = require('../economic-integrity/writerGuard.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')

const INDEX_KEY = '__ql7SubscriptionsPrimaryIndexesV1'
let testDatabase = null

function str(value) { return String(value ?? '').trim() }
function paymentKey(value) { return str(value).toLowerCase() }
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
  return bindMongoDatabase(database)
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

function vipIdentityIds(accountId, legacyAccountIds = []) {
  const values = [accountId, ...(Array.isArray(legacyAccountIds) ? legacyAccountIds : [])]
  const ids = new Set()

  for (const raw of values) {
    const value = str(raw)
    if (!value) continue
    ids.add(value)

    const canonical = canonicalUserId.normalizePrincipalSyntax(value)
    if (canonical) ids.add(canonical)

    const walletId = canonicalUserId.normalizeWalletId(value)
    if (walletId) {
      ids.add(walletId.toLowerCase())
      ids.add(`wallet:${walletId.toLowerCase()}`)
    }

    const telegramId = canonicalUserId.normalizeTelegramId(value)
    if (telegramId) {
      ids.add(telegramId)
      ids.add(`telegram:${telegramId}`)
      ids.add(`telegramid:${telegramId}`)
      ids.add(`telegram:id:${telegramId}`)
      ids.add(`tguid:${telegramId}`)
      ids.add(`tg:${telegramId}`)
      ids.add(`tg:uid:${telegramId}`)
    }
  }

  return Array.from(ids)
}

function laterUntil(left, right) {
  const leftMs = Date.parse(String(left || ''))
  const rightMs = Date.parse(String(right || ''))
  if (!Number.isFinite(rightMs)) return Number.isFinite(leftMs) ? left : null
  if (!Number.isFinite(leftMs) || rightMs > leftMs) return right
  return left
}

function normalizeVipLookupGroup(group = {}) {
  const key = str(group?.key)
  const seed = Array.isArray(group?.ids) ? group.ids : [group?.ids]
  const ids = new Set()
  for (const raw of seed) {
    for (const id of vipIdentityIds(raw)) ids.add(id)
  }
  return { key, ids: Array.from(ids) }
}

async function getVipMany(groups = []) {
  const normalized = (Array.isArray(groups) ? groups : [])
    .map(normalizeVipLookupGroup)
    .filter((group) => group.key && group.ids.length)
  if (!normalized.length) return {}

  const lookupKeys = Array.from(new Set(
    normalized.flatMap((group) => group.ids.map((id) => `vip:${id}`)),
  ))
  if (!lookupKeys.length) return Object.fromEntries(normalized.map((group) => [group.key, null]))

  const database = await db()
  const docs = await database.collection('vip_subscriptions')
    .find({ _id: { $in: lookupKeys } })
    .limit(Math.max(100, lookupKeys.length + 8))
    .toArray()

  const byKey = new Map()
  for (const doc of docs || []) {
    const key = str(doc?._id)
    if (!key) continue
    byKey.set(key, laterUntil(byKey.get(key), doc?.untilISO || null))
  }

  const result = {}
  for (const group of normalized) {
    let bestUntil = null
    for (const id of group.ids) bestUntil = laterUntil(bestUntil, byKey.get(`vip:${id}`))
    result[group.key] = bestUntil
  }
  return result
}

async function getVipForIdentityIds(accountIds = []) {
  const key = '__single__'
  const result = await getVipMany([{ key, ids: accountIds }])
  return result[key] || null
}

async function getVip(accountId) {
  return getVipForIdentityIds([accountId])
}

async function markPaymentSeen(paymentId) {
  const pid = paymentKey(paymentId)
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

async function setVip(accountId, untilISO, {
  paymentId,
  economicRouteId = '',
  operationType = 'entitlement_activate',
  idempotencyKey = '',
  decisionReceipt = null,
  legacyAccountIds = [],
} = {}) {
  const id = canonicalUserId.normalizePrincipalSyntax(accountId)
  if (!id || !untilISO) return { ok: false, error: 'BAD_ARGS' }
  assertEconomicWriterReceipt(decisionReceipt, {
    routeId: economicRouteId,
    operationType,
    actorAccountId: id,
    targetAccountId: id,
    idempotencyKey: idempotencyKey || paymentId,
  })
  if (paymentId && await markPaymentSeen(paymentId)) return { ok: true, duplicated: true }

  const readIds = vipIdentityIds(id, legacyAccountIds)
  const database = await db()
  const existingRows = await database.collection('vip_subscriptions')
    .find({ _id: { $in: readIds.map((value) => `vip:${value}`) } })
    .limit(100)
    .toArray()
    .catch(() => [])

  let currentISO = null
  for (const row of existingRows) {
    const until = row?.untilISO || null
    if (!until) continue
    if (!currentISO || new Date(until).getTime() > new Date(currentISO).getTime()) currentISO = until
  }

  const current = currentISO ? new Date(currentISO) : new Date(0)
  const next = new Date(untilISO)
  const final = current > next ? current : next
  const finalISO = final.toISOString()

  // Reuse one touched legacy physical row if it exists. Do not create a
  // second entitlement document just because its old key used an alias.
  const existing = existingRows
    .sort((a, b) => new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime())[0] || null
  const filter = existing?._id ? { _id: existing._id } : { _id: `vip:${id}` }

  await database.collection('vip_subscriptions').updateOne(
    filter,
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

async function clearVip(accountId, paymentId = '', legacyAccountIds = []) {
  const id = canonicalUserId.normalizePrincipalSyntax(accountId)
  const pid = paymentKey(paymentId)
  const database = await db()
  const readIds = id ? vipIdentityIds(id, legacyAccountIds) : []
  await Promise.allSettled([
    readIds.length
      ? database.collection('vip_subscriptions').deleteMany({ _id: { $in: readIds.map((value) => `vip:${value}`) } })
      : Promise.resolve(),
    pid ? database.collection('vip_payment_dedupe').deleteOne({ _id: `pay:${pid}` }) : Promise.resolve(),
  ])
  return { ok: true }
}

module.exports = {
  __setTestDb,
  clearVip,
  getVip,
  getVipForIdentityIds,
  getVipMany,
  markPaymentSeen,
  setVip,
}
