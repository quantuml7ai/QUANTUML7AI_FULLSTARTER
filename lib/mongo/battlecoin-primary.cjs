// lib/mongo/battlecoin-primary.cjs
// QL7 BattleCoin Mongo-primary adapter.
// Permanent BattleCoin order state/history/counters live in Mongo.
// QCoin balance mutation is delegated to qcoin-primary.cjs.

const { getMongoDb } = require('./client.cjs')
const qcoinPrimary = require('./qcoin-primary.cjs')
const economicRoute = require('../economic-integrity/productionRoute.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')
const { bindMongoDatabase, withMongoOperationContext, withMongoTransaction } = require('./transaction-context.cjs')

const INDEX_KEY = '__ql7BattlecoinPrimaryIndexesV12'
const HISTORY_MAIN = 'battlecoin_order_history'
const HISTORY_LEGACY = 'battlecoin_order_histories'
const COUNTERS_MAIN = 'battlecoin_counters'
const COUNTERS_LEGACY = 'battlecoin_order_counters'

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

function clone(value) {
  if (!value || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

function normalizeAccountId(value) {
  return canonicalUserId.normalizePrincipalSyntax(value)
}

async function resolveAccountId(value) {
  const canonical = await qcoinPrimary.resolveCanonicalAccountId(value)
  return canonical || normalizeAccountId(value)
}

function uniqueIds(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean)))
}

async function resolveAccountIds(value) {
  const canonical = await resolveAccountId(value)
  if (!canonical) return []
  const legacy = await qcoinPrimary.resolveAccountIdCandidates(value)
  return uniqueIds([canonical, value, ...legacy])
}

function activeIds(uid) {
  const id = str(uid)
  return id ? [`active:${id}`, `active-order:${id}`] : []
}

function userClauses(ids) {
  const list = uniqueIds(ids)
  if (!list.length) return []
  return [
    { userId: { $in: list } },
    { uid: { $in: list } },
    { accountId: { $in: list } },
    { _id: { $in: list.flatMap(activeIds) } },
  ]
}

function historyUserClauses(ids) {
  const list = uniqueIds(ids)
  if (!list.length) return []
  return [
    { userId: { $in: list } },
    { uid: { $in: list } },
    { accountId: { $in: list } },
  ]
}

function orderFromDoc(doc) {
  if (!doc || typeof doc !== 'object') return null
  const source = doc.order && typeof doc.order === 'object' ? doc.order : doc
  const order = clone(source)
  if (!order || typeof order !== 'object') return null

  if (order.orderId == null && doc.orderId != null) order.orderId = doc.orderId
  if (!order.status && doc.status) order.status = doc.status
  if (!order.symbol && doc.symbol) order.symbol = doc.symbol
  if (!order.side && doc.side) order.side = doc.side
  if (order.stake == null && doc.stake != null) order.stake = doc.stake
  if (order.leverage == null && doc.leverage != null) order.leverage = doc.leverage
  if (order.entryPrice == null && doc.entryPrice != null) order.entryPrice = doc.entryPrice
  if (order.openedAt == null && doc.openedAt != null) order.openedAt = doc.openedAt
  if (order.closedAt == null && doc.closedAt != null) order.closedAt = doc.closedAt
  if (order.expiresAt == null && doc.expiresAt != null) order.expiresAt = doc.expiresAt
  return order
}

function orderStatus(order) {
  return str(order?.status).toUpperCase()
}

function timeScoreOrder(order = {}) {
  const candidates = [order.closedAt, order.updatedAt, order.openedAt, order.createdAt]
  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
    const parsed = Date.parse(String(value || ''))
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return num(order.orderId, 0)
}

function sortOrdersDesc(a, b) {
  return timeScoreOrder(b) - timeScoreOrder(a) || num(b?.orderId, 0) - num(a?.orderId, 0)
}

function dedupeOrders(orders = []) {
  const map = new Map()
  for (const order of orders) {
    if (!order || typeof order !== 'object') continue
    const key = order.orderId != null
      ? `id:${order.orderId}`
      : `fp:${order.symbol || ''}:${order.openedAt || ''}:${order.closedAt || ''}:${order.status || ''}`
    const prev = map.get(key)
    if (!prev || timeScoreOrder(order) >= timeScoreOrder(prev)) map.set(key, order)
  }
  return Array.from(map.values()).sort(sortOrdersDesc)
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
  return bindMongoDatabase(database)
}

async function runBattlecoinTransaction(work) {
  // Existing repository unit doubles do not expose Mongo sessions. Production
  // always takes the transactional path.
  if (testDatabase) return work()
  return withMongoTransaction(work)
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection('battlecoin_active_orders').createIndex({ userId: 1 }),
    database.collection('battlecoin_active_orders').createIndex({ accountId: 1 }),
    database.collection('battlecoin_active_orders').createIndex({ uid: 1 }),
    database.collection('battlecoin_active_orders').createIndex({ status: 1 }),
    database.collection(HISTORY_MAIN).createIndex({ userId: 1, closedAt: -1 }),
    database.collection(HISTORY_MAIN).createIndex({ accountId: 1, closedAt: -1 }),
    database.collection(HISTORY_MAIN).createIndex({ userId: 1, orderId: 1 }),
    database.collection(HISTORY_LEGACY).createIndex({ userId: 1, closedAt: -1 }),
    database.collection(COUNTERS_MAIN).createIndex({ userId: 1 }),
    database.collection(COUNTERS_LEGACY).createIndex({ userId: 1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
  if (typeof qcoinPrimary.__setTestDb === 'function') {
    qcoinPrimary.__setTestDb(testDatabase)
  }
}

function __setTestAliasResolver(resolver) {
  if (typeof qcoinPrimary.__setTestAliasResolver === 'function') {
    qcoinPrimary.__setTestAliasResolver(resolver)
  }
}

async function readQcoinBalance(uid) {
  const account = await qcoinPrimary.readAccount(uid).catch(() => null)
  return num(account?.balance, 0)
}

async function incrementQcoinBalance({ uid, amount, eventKind, sourceEventId, idempotencyKey, meta = {}, economicRouteId = '', decisionReceipt = null } = {}) {
  const result = await qcoinPrimary.incrementBalance({
    uid,
    amount,
    eventKind,
    route: '/api/battlecoin/order',
    sourceEventId,
    idempotencyKey,
    meta,
    economicRouteId,
    decisionReceipt,
  })
  return num(result?.balance, 0)
}

async function readActiveCandidates(uid) {
  const ids = await resolveAccountIds(uid)
  if (!ids.length) return []
  const database = await db()
  const clauses = userClauses(ids)
  if (!clauses.length) return []
  const docs = await database.collection('battlecoin_active_orders')
    .find({ $or: clauses })
    .limit(20)
    .toArray()
    .catch(() => [])
  return docs.map(orderFromDoc).filter(Boolean).sort(sortOrdersDesc)
}

async function readOpenOrder(uid) {
  const candidates = await readActiveCandidates(uid)
  return candidates.find((order) => orderStatus(order) === 'OPEN') || null
}

async function readLastActiveOrder(uid) {
  const candidates = await readActiveCandidates(uid)
  return candidates[0] || null
}

async function writeActiveOrder(uid, order) {
  const id = await resolveAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const cleanOrder = order && typeof order === 'object' ? clone(order) : null
  const database = await db()
  const readIds = await resolveAccountIds(uid)
  const existing = readIds.length
    ? await database.collection('battlecoin_active_orders')
      .find({ $or: userClauses(readIds) })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(1)
      .toArray()
      .then((rows) => rows[0] || null)
      .catch(() => null)
    : null

  if (!cleanOrder) {
    if (existing?._id) {
      await database.collection('battlecoin_active_orders').deleteOne({ _id: existing._id }).catch(() => null)
    }
    return null
  }

  const iso = nowIso()
  const doc = {
    uid: id,
    userId: id,
    accountId: id,
    orderId: cleanOrder.orderId ?? null,
    status: str(cleanOrder.status || ''),
    symbol: str(cleanOrder.symbol || ''),
    side: str(cleanOrder.side || ''),
    stake: cleanOrder.stake ?? null,
    leverage: cleanOrder.leverage ?? null,
    entryPrice: cleanOrder.entryPrice ?? null,
    openedAt: cleanOrder.openedAt ?? null,
    expiresAt: cleanOrder.expiresAt ?? null,
    closedAt: cleanOrder.closedAt ?? null,
    order: cleanOrder,
    updatedAt: iso,
    storagePrimary: 'mongo',
  }

  await database.collection('battlecoin_active_orders').updateOne(
    existing?._id ? { _id: existing._id } : { _id: `active:${id}` },
    { $set: doc, $setOnInsert: { createdAt: iso } },
    { upsert: true },
  )
  return cleanOrder
}

async function reserveOpenOrder(uid, order) {
  const id = await resolveAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const database = await db()
  const cleanOrder = order && typeof order === 'object' ? clone(order) : null
  if (!cleanOrder) return { ok: false, error: 'missing_order' }

  const legacyOpen = await readOpenOrder(uid).catch(() => null)
  if (legacyOpen) return { ok: false, error: 'active_order_exists', order: legacyOpen }

  const iso = nowIso()
  const doc = {
    uid: id,
    userId: id,
    accountId: id,
    orderId: cleanOrder.orderId ?? null,
    status: str(cleanOrder.status || ''),
    symbol: str(cleanOrder.symbol || ''),
    side: str(cleanOrder.side || ''),
    stake: cleanOrder.stake ?? null,
    leverage: cleanOrder.leverage ?? null,
    entryPrice: cleanOrder.entryPrice ?? null,
    openedAt: cleanOrder.openedAt ?? null,
    expiresAt: cleanOrder.expiresAt ?? null,
    closedAt: cleanOrder.closedAt ?? null,
    order: cleanOrder,
    updatedAt: iso,
    storagePrimary: 'mongo',
  }

  try {
    const result = await database.collection('battlecoin_active_orders').updateOne(
      {
        _id: `active:${id}`,
        $or: [
          { status: { $exists: false } },
          { status: { $ne: 'OPEN' } },
        ],
      },
      { $set: doc, $setOnInsert: { createdAt: iso } },
      { upsert: true },
    )

    if (result?.matchedCount === 0 && result?.upsertedCount === 0 && result?.modifiedCount === 0) {
      const existing = await readOpenOrder(id).catch(() => null)
      return { ok: false, error: 'active_order_exists', order: existing }
    }

    return { ok: true, order: cleanOrder }
  } catch (error) {
    const existing = await readOpenOrder(id).catch(() => null)
    if (existing) return { ok: false, error: 'active_order_exists', order: existing }
    return { ok: false, error: String(error?.message || error) }
  }
}

async function rollbackOpenReservation(uid, orderId) {
  const ids = await resolveAccountIds(uid)
  if (!ids.length || orderId == null) return
  const database = await db()
  await database.collection('battlecoin_active_orders').deleteMany({
    $or: userClauses(ids),
    status: 'OPEN',
    orderId,
  }).catch(() => null)
}

async function readCollectionHistory(collectionName, uid, limit) {
  const ids = await resolveAccountIds(uid)
  if (!ids.length) return []
  const database = await db()
  const clauses = historyUserClauses(ids)
  if (!clauses.length) return []
  const docs = await database.collection(collectionName)
    .find({ $or: clauses })
    .sort({ closedAt: -1, openedAt: -1, orderId: -1, sourceIndex: 1 })
    .limit(Math.max(1, limit * 2))
    .toArray()
    .catch(() => [])
  return docs.map(orderFromDoc).filter(Boolean)
}

async function readHistory(uid, limit = 100) {
  const max = Math.max(1, Number(limit) || 100)
  const [main, legacy] = await Promise.all([
    readCollectionHistory(HISTORY_MAIN, uid, max),
    readCollectionHistory(HISTORY_LEGACY, uid, max),
  ])
  return dedupeOrders([...main, ...legacy]).slice(0, max)
}

async function pushHistory(uid, order) {
  const id = await resolveAccountId(uid)
  if (!id || !order || typeof order !== 'object') return null
  const cleanOrder = clone(order)
  const oid = cleanOrder.orderId ?? `${cleanOrder.openedAt || Date.now()}`
  const iso = nowIso()
  const database = await db()
  const doc = {
    uid: id,
    userId: id,
    accountId: id,
    orderId: cleanOrder.orderId ?? null,
    status: str(cleanOrder.status || ''),
    symbol: str(cleanOrder.symbol || ''),
    side: str(cleanOrder.side || ''),
    stake: cleanOrder.stake ?? null,
    leverage: cleanOrder.leverage ?? null,
    pnl: cleanOrder.pnl ?? null,
    openedAt: cleanOrder.openedAt ?? null,
    closedAt: cleanOrder.closedAt ?? null,
    order: cleanOrder,
    updatedAt: iso,
    storagePrimary: 'mongo',
  }
  await database.collection(HISTORY_MAIN).updateOne(
    { _id: `history:${id}:${oid}` },
    { $set: doc, $setOnInsert: { createdAt: iso } },
    { upsert: true },
  )
  return cleanOrder
}

async function readCounterValue(uid) {
  const ids = await resolveAccountIds(uid)
  if (!ids.length) return 0
  const database = await db()
  const [mainRows, legacyRows, active, history] = await Promise.all([
    database.collection(COUNTERS_MAIN)
      .find({
        $or: [
          { _id: { $in: ids.map((id) => `battlecoin:orderId:${id}`) } },
          { userId: { $in: ids } },
          { uid: { $in: ids } },
          { accountId: { $in: ids } },
        ],
      })
      .limit(50)
      .toArray()
      .catch(() => []),
    database.collection(COUNTERS_LEGACY)
      .find({
        $or: [
          { _id: { $in: ids.map((id) => `order-counter:${id}`) } },
          { userId: { $in: ids } },
          { uid: { $in: ids } },
          { accountId: { $in: ids } },
        ],
      })
      .limit(50)
      .toArray()
      .catch(() => []),
    readLastActiveOrder(uid).catch(() => null),
    readHistory(uid, 200).catch(() => []),
  ])
  const values = [
    ...mainRows.flatMap((row) => [row?.value, row?.numericValue]),
    ...legacyRows.flatMap((row) => [row?.value, row?.numericValue]),
    active?.orderId,
    ...(Array.isArray(history) ? history.map((order) => order?.orderId) : []),
  ].map((value) => num(value, 0))
  return Math.max(0, ...values)
}

async function nextOrderId(uid) {
  const id = await resolveAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const database = await db()
  const seed = await readCounterValue(uid)
  const readIds = await resolveAccountIds(uid)
  const existing = await database.collection(COUNTERS_MAIN)
    .find({
      $or: [
        { _id: { $in: readIds.map((value) => `battlecoin:orderId:${value}`) } },
        { userId: { $in: readIds } },
        { uid: { $in: readIds } },
        { accountId: { $in: readIds } },
      ],
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(1)
    .toArray()
    .then((rows) => rows[0] || null)
    .catch(() => null)

  const filter = existing?._id
    ? { _id: existing._id }
    : { _id: `battlecoin:orderId:${id}` }
  const iso = nowIso()
  await database.collection(COUNTERS_MAIN).updateOne(
    filter,
    {
      $max: { value: seed },
      $set: { uid: id, userId: id, accountId: id, updatedAt: iso, storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: iso },
    },
    { upsert: true },
  )
  const result = await database.collection(COUNTERS_MAIN).findOneAndUpdate(
    filter,
    {
      $inc: { value: 1 },
      $set: { uid: id, userId: id, accountId: id, updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && result._id ? result : result?.value
  return num(doc?.value, seed + 1)
}

async function openOrderWithStakeDebit({ uid, symbol, side, stake, leverage, entryPrice, now = Date.now() } = {}) {
  const id = await resolveAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  return runBattlecoinTransaction(async () => {
  const open = await readOpenOrder(id)
  if (open) return { ok: false, error: 'battlecoin_err_active_order', status: 400, order: open }

  const stakeNum = num(stake, Number.NaN)
  const balanceBefore = await readQcoinBalance(id)
  if (!Number.isFinite(stakeNum) || stakeNum <= 0) return { ok: false, error: 'battlecoin_err_invalid_stake', status: 400 }
  if (stakeNum > balanceBefore + 1e-9) return { ok: false, error: 'battlecoin_err_insufficient_balance', status: 400, balance: balanceBefore }

  const orderId = await nextOrderId(id)
  const order = {
    orderId,
    symbol: str(symbol).toUpperCase(),
    side: str(side).toUpperCase(),
    stake: stakeNum,
    leverage: num(leverage, 1),
    entryPrice: num(entryPrice, 0),
    status: 'OPEN',
    openedAt: now,
    expiresAt: now + 10 * 60 * 1000,
    pnl: 0,
    changePct: 0,
  }

  const reserved = await reserveOpenOrder(id, order)
  if (!reserved.ok) return { ok: false, error: 'battlecoin_err_active_order', status: 400, order: reserved.order || null }

  try {
    const sourceEventId = `battlecoin:open:${id}:${orderId}`
    const idempotencyKey = `battlecoin:open:${id}:${orderId}:debit`
    const economic = await economicRoute.executeVerifiedEconomicOperation({
      routeId: 'battlecoin.open.debit',
      operationType: 'debit',
      actorAccountId: id,
      targetAccountId: id,
      amount: stakeNum,
      sourceEventId,
      idempotencyKey,
      sourceType: 'battle-order',
      sourceOwner: 'lib/mongo/battlecoin-primary.cjs',
      sourceEvidence: { orderId, symbol: order.symbol, side: order.side, stake: stakeNum, leverage: order.leverage, entryPrice: order.entryPrice },
      writer: (decisionReceipt) => incrementQcoinBalance({
        uid: id,
        amount: -stakeNum,
        eventKind: 'battlecoin_open_stake_debit',
        sourceEventId,
        idempotencyKey,
        meta: { symbol: order.symbol, side: order.side, stake: stakeNum, leverage: order.leverage, entryPrice: order.entryPrice },
        economicRouteId: 'battlecoin.open.debit',
        decisionReceipt,
      }),
    })
    const balance = num(economic?.result?.balance ?? economic?.balance, balanceBefore - stakeNum)
    return { ok: true, balance, order }
  } catch (error) {
    await rollbackOpenReservation(id, orderId)
    throw error
  }
  })
}

function settleMath(order, closePrice) {
  const P0 = num(order?.entryPrice, 0)
  const P1 = num(closePrice, 0)
  const stakeNum = num(order?.stake, 0)
  const lev = num(order?.leverage, 1)
  if (P0 <= 0 || P1 <= 0 || stakeNum <= 0 || lev <= 0) return null
  const change = (P1 - P0) / P0
  const signed = str(order?.side).toUpperCase() === 'LONG' ? change : -change
  let pnl = stakeNum * lev * signed
  if (!Number.isFinite(pnl)) pnl = 0
  if (pnl < -stakeNum) pnl = -stakeNum
  const returned = Math.max(0, stakeNum + pnl)
  return { change, pnl, returned }
}

async function settleOrderWithQcoinReturn({ uid, expectedOrderId = null, closePrice, now = Date.now(), source = 'manual' } = {}) {
  const id = await resolveAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  return runBattlecoinTransaction(async () => {
  const existing = await readOpenOrder(id)
  if (!existing) {
    const last = await readLastActiveOrder(id)
    if (
      expectedOrderId != null &&
      orderStatus(last) === 'SETTLED' &&
      String(last?.orderId) === String(expectedOrderId)
    ) {
      return { ok: true, duplicate: true, balance: await readQcoinBalance(id), order: last }
    }
    return { ok: false, error: 'battlecoin_err_settle_failed', status: 400 }
  }
  if (expectedOrderId != null && String(existing.orderId) !== String(expectedOrderId)) {
    return { ok: false, error: 'battlecoin_err_settle_failed', status: 409, order: existing }
  }

  const math = settleMath(existing, closePrice)
  if (!math) return { ok: false, error: 'battlecoin_err_settle_failed', status: 400, order: existing }

  const closed = {
    ...existing,
    status: 'SETTLED',
    closedAt: now,
    closePrice: num(closePrice, 0),
    changePct: math.change * 100,
    pnl: math.pnl,
  }

  const sourceEventId = `battlecoin:settle:${id}:${existing.orderId}`
  const idempotencyKey = `battlecoin:settle:${id}:${existing.orderId}:return`
  const economic = await economicRoute.executeVerifiedEconomicOperation({
    routeId: 'battlecoin.settlement',
    operationType: 'credit',
    actorAccountId: id,
    targetAccountId: id,
    amount: math.returned,
    sourceEventId,
    idempotencyKey,
    sourceType: 'battle-settlement',
    sourceOwner: 'lib/mongo/battlecoin-primary.cjs',
    sourceEvidence: { orderId: existing.orderId, source, symbol: closed.symbol, side: closed.side, stake: closed.stake, leverage: closed.leverage, closePrice: closed.closePrice, pnl: closed.pnl, returned: math.returned },
    writer: (decisionReceipt) => incrementQcoinBalance({
      uid: id,
      amount: math.returned,
      eventKind: 'battlecoin_settle_return',
      sourceEventId,
      idempotencyKey,
      meta: { source, symbol: closed.symbol, side: closed.side, stake: closed.stake, leverage: closed.leverage, closePrice: closed.closePrice, pnl: closed.pnl },
      economicRouteId: 'battlecoin.settlement',
      decisionReceipt,
    }),
  })
  const balance = num(economic?.result?.balance ?? economic?.balance, 0)

  await writeActiveOrder(id, closed)
  await pushHistory(id, closed)
  return { ok: true, balance, order: closed }
  })
}

async function readState(uid, { includeHistory = true } = {}) {
  return withMongoOperationContext(async () => {
    const id = await resolveAccountId(uid)
    if (!id) return { balance: null, order: null, orders: [] }
    const [balance, order, orders] = await Promise.all([
      readQcoinBalance(id),
      readOpenOrder(id),
      includeHistory ? readHistory(id, 100) : Promise.resolve([]),
    ])
    return { balance, order, orders }
  })
}

module.exports = {
  __setTestAliasResolver,
  __setTestDb,
  constants: { HISTORY_MAIN, HISTORY_LEGACY, COUNTERS_MAIN, COUNTERS_LEGACY },
  incrementQcoinBalance,
  nextOrderId,
  openOrderWithStakeDebit,
  pushHistory,
  readHistory,
  readLastActiveOrder,
  readOpenOrder,
  readQcoinBalance,
  readState,
  settleOrderWithQcoinReturn,
  writeActiveOrder,
}
