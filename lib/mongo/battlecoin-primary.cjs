// lib/mongo/battlecoin-primary.cjs
// QL7 BattleCoin Mongo-primary adapter.
// Permanent BattleCoin order state/history/counters live in Mongo.
// QCoin balance mutation is delegated to qcoin-primary.cjs.

const { getMongoDb } = require('./client.cjs')
const qcoinPrimary = require('./qcoin-primary.cjs')

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
  return str(value)
}

function activeIds(uid) {
  const id = normalizeAccountId(uid)
  return [`active:${id}`, `active-order:${id}`]
}

function userClauses(uid) {
  const id = normalizeAccountId(uid)
  if (!id) return []
  return [
    { userId: id },
    { uid: id },
    { accountId: id },
    { _id: { $in: activeIds(id) } },
  ]
}

function historyUserClauses(uid) {
  const id = normalizeAccountId(uid)
  if (!id) return []
  return [
    { userId: id },
    { uid: id },
    { accountId: id },
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
  return database
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
}

async function readQcoinBalance(uid) {
  const account = await qcoinPrimary.readAccount(uid).catch(() => null)
  return num(account?.balance, 0)
}

async function incrementQcoinBalance({ uid, amount, eventKind, sourceEventId, idempotencyKey, meta = {} } = {}) {
  const result = await qcoinPrimary.incrementBalance({
    uid,
    amount,
    eventKind,
    route: '/api/battlecoin/order',
    sourceEventId,
    idempotencyKey,
    meta,
  })
  return num(result?.balance, 0)
}

async function readActiveCandidates(uid) {
  const id = normalizeAccountId(uid)
  if (!id) return []
  const database = await db()
  const clauses = userClauses(id)
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
  const id = normalizeAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const cleanOrder = order && typeof order === 'object' ? clone(order) : null
  const database = await db()
  if (!cleanOrder) {
    await database.collection('battlecoin_active_orders').deleteOne({ _id: `active:${id}` }).catch(() => null)
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
    { _id: `active:${id}` },
    { $set: doc, $setOnInsert: { createdAt: iso } },
    { upsert: true },
  )
  return cleanOrder
}

async function reserveOpenOrder(uid, order) {
  const id = normalizeAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const database = await db()
  const cleanOrder = order && typeof order === 'object' ? clone(order) : null
  if (!cleanOrder) return { ok: false, error: 'missing_order' }

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
  const id = normalizeAccountId(uid)
  if (!id || orderId == null) return
  const database = await db()
  await database.collection('battlecoin_active_orders').deleteOne({
    _id: `active:${id}`,
    status: 'OPEN',
    orderId,
  }).catch(() => null)
}

async function readCollectionHistory(collectionName, uid, limit) {
  const id = normalizeAccountId(uid)
  if (!id) return []
  const database = await db()
  const clauses = historyUserClauses(id)
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
  const id = normalizeAccountId(uid)
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
  const id = normalizeAccountId(uid)
  if (!id) return 0
  const database = await db()
  const [main, legacy, active, history] = await Promise.all([
    database.collection(COUNTERS_MAIN).findOne({ _id: `battlecoin:orderId:${id}` }).catch(() => null),
    database.collection(COUNTERS_LEGACY).findOne({ $or: [{ _id: `order-counter:${id}` }, { userId: id }, { uid: id }, { accountId: id }] }).catch(() => null),
    readLastActiveOrder(id).catch(() => null),
    readHistory(id, 200).catch(() => []),
  ])
  const values = [
    main?.value,
    main?.numericValue,
    legacy?.value,
    legacy?.numericValue,
    active?.orderId,
    ...(Array.isArray(history) ? history.map((order) => order?.orderId) : []),
  ].map((value) => num(value, 0))
  return Math.max(0, ...values)
}

async function nextOrderId(uid) {
  const id = normalizeAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const database = await db()
  const seed = await readCounterValue(id)
  const iso = nowIso()
  await database.collection(COUNTERS_MAIN).updateOne(
    { _id: `battlecoin:orderId:${id}` },
    {
      $max: { value: seed },
      $set: { uid: id, userId: id, accountId: id, updatedAt: iso, storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: iso },
    },
    { upsert: true },
  )
  const result = await database.collection(COUNTERS_MAIN).findOneAndUpdate(
    { _id: `battlecoin:orderId:${id}` },
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
  const id = normalizeAccountId(uid)
  if (!id) throw new Error('missing_user_id')
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
    const balance = await incrementQcoinBalance({
      uid: id,
      amount: -stakeNum,
      eventKind: 'battlecoin_open_stake_debit',
      sourceEventId: `battlecoin:open:${id}:${orderId}`,
      idempotencyKey: `battlecoin:open:${id}:${orderId}:debit`,
      meta: { symbol: order.symbol, side: order.side, stake: stakeNum, leverage: order.leverage, entryPrice: order.entryPrice },
    })
    return { ok: true, balance, order }
  } catch (error) {
    await rollbackOpenReservation(id, orderId)
    throw error
  }
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

async function settleOrderWithQcoinReturn({ uid, closePrice, now = Date.now(), source = 'manual' } = {}) {
  const id = normalizeAccountId(uid)
  if (!id) throw new Error('missing_user_id')
  const existing = await readOpenOrder(id)
  if (!existing) return { ok: false, error: 'battlecoin_err_settle_failed', status: 400 }

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

  const balance = await incrementQcoinBalance({
    uid: id,
    amount: math.returned,
    eventKind: 'battlecoin_settle_return',
    sourceEventId: `battlecoin:settle:${id}:${existing.orderId}`,
    idempotencyKey: `battlecoin:settle:${id}:${existing.orderId}:return`,
    meta: { source, symbol: closed.symbol, side: closed.side, stake: closed.stake, leverage: closed.leverage, closePrice: closed.closePrice, pnl: closed.pnl },
  })

  await writeActiveOrder(id, closed)
  await pushHistory(id, closed)
  return { ok: true, balance, order: closed }
}

async function readState(uid, { includeHistory = true } = {}) {
  const id = normalizeAccountId(uid)
  if (!id) return { balance: null, order: null, orders: [] }
  const [balance, order, orders] = await Promise.all([
    readQcoinBalance(id),
    readOpenOrder(id),
    includeHistory ? readHistory(id, 100) : Promise.resolve([]),
  ])
  return { balance, order, orders }
}

module.exports = {
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
