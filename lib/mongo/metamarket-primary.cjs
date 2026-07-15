// lib/mongo/metamarket-primary.cjs
// Mongo-primary MetaMarket state, ownership, token, and event repository.

const { getMongoDb } = require('./client.cjs')
const qcoinPrimary = require('./qcoin-primary.cjs')
const crypto = require('node:crypto')

const INDEX_KEY = '__ql7MetaMarketPrimaryIndexesV1'
const MARKET_OWNER_ID = 'MARKET'

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function bool01(value, fallback = false) {
  if (value == null) return fallback
  return value === true || value === 1 || value === '1'
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value.map((entry) => str(entry)).filter(Boolean)
  const raw = str(value)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((entry) => str(entry)).filter(Boolean)
  } catch {}
  return raw.split(',').map((entry) => entry.trim()).filter(Boolean)
}

function escapeRegExp(value) {
  return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mutableSetDoc(value = {}, omit = []) {
  const out = { ...(value || {}) }
  delete out._id
  for (const key of omit) delete out[key]
  return out
}

function sha12(value) {
  return crypto.createHash('sha256').update(str(value)).digest('hex').slice(0, 12)
}

function tokenPart(value) {
  return str(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 36) || 'item'
}

function legacyTokenId({ ownerId = '', itemId = '', slot = 1, kind = 'owned' } = {}) {
  const safeItem = tokenPart(itemId)
  const safeKind = tokenPart(kind)
  const hash = sha12(`${safeKind}|${ownerId}|${itemId}|${slot}`)
  return `mm_legacy_${safeKind}_${safeItem}_${String(slot).padStart(6, '0')}_${hash}`
}

function legacySerial({ itemId = '', slot = 1 } = {}) {
  return `MM-LEGACY-${tokenPart(itemId).toUpperCase()}-${String(slot).padStart(9, '0')}-L7`
}

function isLegacyToken(doc = {}) {
  return doc?.migratedLegacyToken === true ||
    /^mm_legacy_/i.test(str(doc?.tokenId || doc?._id)) ||
    /^MM-LEGACY-/i.test(str(doc?.serial))
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
    database.collection('metamarket_item_states').createIndex({ itemId: 1 }, { unique: true, sparse: true }),
    database.collection('metamarket_tokens').createIndex({ tokenId: 1 }, { unique: true, sparse: true }),
    database.collection('metamarket_tokens').createIndex({ itemId: 1, ownerId: 1, status: 1, updatedAt: 1 }),
    database.collection('metamarket_user_items').createIndex({ userId: 1, itemId: 1 }, { unique: true, sparse: true }),
    database.collection('metamarket_user_items').createIndex({ userId: 1, count: 1 }),
    database.collection('metamarket_owners').createIndex({ itemId: 1, count: -1, recent: -1 }),
    database.collection('metamarket_events').createIndex({ txId: 1 }, { unique: true, sparse: true }),
    database.collection('metamarket_event_indexes').createIndex({ indexType: 1, tokenId: 1, score: -1 }),
    database.collection('metamarket_event_indexes').createIndex({ indexType: 1, userId: 1, score: -1 }),
    database.collection('metamarket_event_indexes').createIndex({ indexType: 1, itemId: 1, score: -1 }),
    database.collection('metamarket_counters').createIndex({ _id: 1 }),
    database.collection('metamarket_qcoin_context').createIndex({ _id: 1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
  if (typeof qcoinPrimary.__setTestDb === 'function') qcoinPrimary.__setTestDb(database || null)
}

function normalizeItemState(item = {}, state = {}) {
  return {
    itemId: str(state.itemId || item.itemId),
    collectionId: str(state.collectionId || item.collectionId),
    catalogVersion: str(state.catalogVersion || item.catalogVersion || ''),
    assetVersion: str(state.assetVersion || item.assetVersion || ''),
    totalSupply: num(state.totalSupply, item.supply),
    marketAvailable: num(state.marketAvailable, item.supply),
    mintedCount: num(state.mintedCount, 0),
    priceMicro: num(state.priceMicro, item.priceMicro),
    sellRateBps: num(state.sellRateBps, item.sellRateBps),
    scarcityPriceBps: num(state.scarcityPriceBps, item.scarcityPriceBps),
    active: bool01(state.active, item.active),
    buyEnabled: bool01(state.buyEnabled, item.buyEnabled),
    sellEnabled: bool01(state.sellEnabled, item.sellEnabled),
    giftEnabled: bool01(state.giftEnabled, item.giftEnabled),
    updatedAt: num(state.updatedAt, Date.now()),
    rev: num(state.rev, 1),
  }
}

function statePatchFromCatalog(item = {}) {
  return {
    itemId: str(item.itemId),
    collectionId: str(item.collectionId),
    catalogVersion: str(item.catalogVersion || ''),
    assetVersion: str(item.assetVersion || ''),
    priceMicro: num(item.priceMicro, 0),
    sellRateBps: num(item.sellRateBps, 9700),
    scarcityPriceBps: num(item.scarcityPriceBps, 0),
    active: item.active ? 1 : 0,
    buyEnabled: item.buyEnabled ? 1 : 0,
    sellEnabled: item.sellEnabled ? 1 : 0,
    giftEnabled: item.giftEnabled ? 1 : 0,
  }
}

async function ensureItemState(item = {}) {
  const database = await db()
  const itemId = str(item.itemId)
  const existing = await database.collection('metamarket_item_states').findOne({ _id: itemId }).catch(() => null)
  if (existing) {
    const merged = normalizeItemState(item, existing)
    const catalogSupply = Number(item.supply || 0)
    const existingSupply = Number(existing.totalSupply || 0)
    const existingAvailable = Number(existing.marketAvailable || 0)
    const unavailableCount = Math.max(0, existingSupply - existingAvailable)
    const canRefreshSupplySafely = catalogSupply > 0 && existingSupply !== catalogSupply && catalogSupply >= unavailableCount
    const needsCatalogRefresh =
      str(existing.catalogVersion) !== str(item.catalogVersion) ||
      str(existing.assetVersion) !== str(item.assetVersion) ||
      num(existing.priceMicro, 0) !== num(item.priceMicro, 0) ||
      num(existing.sellRateBps, 0) !== num(item.sellRateBps, 0) ||
      num(existing.scarcityPriceBps, 0) !== num(item.scarcityPriceBps, 0)
    if (needsCatalogRefresh || canRefreshSupplySafely) {
      const patch = { ...statePatchFromCatalog(item), updatedAt: Date.now(), storagePrimary: 'mongo' }
      if (canRefreshSupplySafely) {
        patch.totalSupply = catalogSupply
        patch.marketAvailable = Math.max(0, catalogSupply - unavailableCount)
      }
      await database.collection('metamarket_item_states').updateOne({ _id: itemId }, { $set: patch })
      return normalizeItemState(item, { ...existing, ...patch })
    }
    return merged
  }

  const now = Date.now()
  const state = {
    ...statePatchFromCatalog(item),
    _id: itemId,
    totalSupply: Number(item.supply || 0),
    marketAvailable: Number(item.supply || 0),
    mintedCount: 0,
    updatedAt: now,
    rev: 1,
    storagePrimary: 'mongo',
  }
  await database.collection('metamarket_item_states').updateOne(
    { _id: itemId },
    { $set: mutableSetDoc(state), $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return normalizeItemState(item, state)
}

async function writeItemState(itemId, patch = {}) {
  const database = await db()
  const id = str(itemId)
  const current = await database.collection('metamarket_item_states').findOne({ _id: id }).catch(() => null)
  const next = {
    ...(current || { _id: id, itemId: id }),
    ...patch,
    itemId: id,
    updatedAt: Date.now(),
    rev: num(current?.rev, 1) + 1,
    storagePrimary: 'mongo',
  }
  await database.collection('metamarket_item_states').updateOne(
    { _id: id },
    { $set: mutableSetDoc(next, ['createdAt']), $setOnInsert: { createdAt: next.updatedAt } },
    { upsert: true },
  )
  return next
}

async function getUserItemCount(userId, itemId) {
  const database = await db()
  const doc = await database.collection('metamarket_user_items').findOne({ _id: `${str(userId)}:${str(itemId)}` }).catch(() => null)
  return Math.max(0, Math.floor(num(doc?.count, 0)))
}

async function updateOwnerIndexes(itemId, userId, count) {
  const database = await db()
  const iid = str(itemId)
  const uid = str(userId)
  const safeCount = Math.max(0, Math.floor(num(count, 0)))
  if (safeCount <= 0) {
    await database.collection('metamarket_owners').deleteOne({ _id: `${iid}:${uid}` }).catch(() => null)
    return
  }
  const now = Date.now()
  await database.collection('metamarket_owners').updateOne(
    { _id: `${iid}:${uid}` },
    {
      $set: { itemId: iid, userId: uid, count: safeCount, recent: now, updatedAt: now, storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
}

async function setUserItemCount(userId, itemId, count) {
  const database = await db()
  const uid = str(userId)
  const iid = str(itemId)
  const next = Math.max(0, Math.floor(num(count, 0)))
  if (next <= 0) {
    await database.collection('metamarket_user_items').deleteOne({ _id: `${uid}:${iid}` }).catch(() => null)
  } else {
    const now = Date.now()
    await database.collection('metamarket_user_items').updateOne(
      { _id: `${uid}:${iid}` },
      {
        $set: { userId: uid, itemId: iid, count: next, updatedAt: now, storagePrimary: 'mongo' },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    )
  }
  await updateOwnerIndexes(iid, uid, next)
  return next
}

async function incrementUserItemCount(userId, itemId, delta) {
  return setUserItemCount(userId, itemId, await getUserItemCount(userId, itemId) + Number(delta || 0))
}

async function addTokenToUser(userId, itemId, tokenId, acquiredAt = Date.now()) {
  const database = await db()
  const uid = str(userId)
  const iid = str(itemId)
  const tid = str(tokenId)
  if (!uid || !iid || !tid) throw new Error('metamarket_token_move_missing_identity')
  const result = await database.collection('metamarket_tokens').updateOne(
    { _id: tid, itemId: iid },
    {
      $set: {
        ownerId: uid,
        status: 'owned',
        updatedAt: num(acquiredAt, Date.now()),
        hiddenFromUi: false,
        repairOnly: false,
        storagePrimary: 'mongo',
      },
    },
  )
  if (!result?.matchedCount && !result?.modifiedCount) throw new Error('metamarket_token_move_failed')
  return true
}

async function removeTokenFromUser(userId, itemId, tokenId) {
  const database = await db()
  const uid = str(userId)
  const iid = str(itemId)
  const tid = str(tokenId)
  if (!uid || !iid || !tid) throw new Error('metamarket_token_remove_missing_identity')
  const token = await database.collection('metamarket_tokens').findOne({ _id: tid }).catch(() => null)
  if (!token || str(token.ownerId) !== uid || str(token.itemId) !== iid || str(token.status) !== 'owned' || isLegacyToken(token)) {
    throw new Error('metamarket_token_remove_failed')
  }
  return true
}

async function readToken(tokenId) {
  const database = await db()
  const id = str(tokenId)
  const doc = await database.collection('metamarket_tokens').findOne({ _id: id }).catch(() => null)
  if (!doc) return null
  return {
    tokenId: str(doc.tokenId || doc._id),
    serial: str(doc.serial),
    itemId: str(doc.itemId),
    collectionId: str(doc.collectionId),
    ownerId: str(doc.ownerId),
    status: str(doc.status),
    createdAt: num(doc.createdAt, 0),
    updatedAt: num(doc.updatedAt, 0),
    lastTxId: str(doc.lastTxId),
    mintTxId: str(doc.mintTxId),
    catalogVersionAtMint: str(doc.catalogVersionAtMint),
    assetVersionAtMint: str(doc.assetVersionAtMint),
    hiddenFromUi: Boolean(doc.hiddenFromUi),
    repairOnly: Boolean(doc.repairOnly),
    migratedLegacyToken: Boolean(doc.migratedLegacyToken),
    repairedFromEventLedger: Boolean(doc.repairedFromEventLedger),
  }
}

async function readEventDoc(database, txId) {
  const id = str(txId)
  if (!id) return null
  return database.collection('metamarket_events').findOne({ _id: id }).catch(() => null)
}

function eventFinalOwnership(event = {}) {
  const type = str(event.type || event.action).toUpperCase()
  if (type === 'SELL') return { ownerId: MARKET_OWNER_ID, status: 'market' }
  if (type === 'BUY' || type === 'GIFT') return { ownerId: str(event.toOwnerId), status: 'owned' }
  return { ownerId: '', status: '' }
}

function eventSerialForToken(event = {}, tokenId = '') {
  const ids = parseJsonList(event.tokenIds)
  const serials = parseJsonList(event.serials)
  const index = ids.indexOf(str(tokenId))
  return index >= 0 ? str(serials[index]) : str(event.serial)
}

async function readLatestTokenEvent(database, tokenId) {
  const tid = str(tokenId)
  if (!tid) return null
  const [indexRow] = await database.collection('metamarket_event_indexes')
    .find({ indexType: 'token_events', tokenId: tid })
    .sort({ score: -1, txId: 1 })
    .limit(1)
    .toArray()
    .catch(() => [])
  if (indexRow?.txId) {
    const event = await readEventDoc(database, indexRow.txId)
    if (event) return event
  }
  const tokenRegex = new RegExp(`"${escapeRegExp(tid)}"`)
  const [event] = await database.collection('metamarket_events')
    .find({
      $or: [
        { tokenId: tid },
        { tokenIds: tid },
        { tokenIds: tokenRegex },
      ],
    })
    .sort({ createdAt: -1, txId: 1 })
    .limit(1)
    .toArray()
    .catch(() => [])
  return event || null
}

async function repairUserItemTokenCoverageFromEvents(database, userId, itemId, desiredCount = 1) {
  const uid = str(userId)
  const iid = str(itemId)
  const desired = Math.max(1, Math.floor(num(desiredCount, 1)))
  if (!uid || !iid) return 0
  const itemState = await readItemState(database, iid)
  const rows = await database.collection('metamarket_event_indexes')
    .find({ indexType: 'item_events', itemId: iid })
    .sort({ score: -1, txId: 1 })
    .limit(250)
    .toArray()
    .catch(() => [])
  const events = []
  for (const row of rows) {
    const event = await readEventDoc(database, row.txId)
    if (event) events.push(event)
  }
  if (!events.length) {
    const fallback = await database.collection('metamarket_events')
      .find({ itemId: iid })
      .sort({ createdAt: -1, txId: 1 })
      .limit(250)
      .toArray()
      .catch(() => [])
    events.push(...fallback)
  }
  const seen = new Set()
  let repaired = 0
  for (const event of events) {
    const ids = parseJsonList(event.tokenIds)
    if (event.tokenId) ids.unshift(str(event.tokenId))
    for (const tokenId of ids.map(str).filter(Boolean)) {
      if (seen.has(tokenId)) continue
      seen.add(tokenId)
      const latest = await readLatestTokenEvent(database, tokenId)
      const final = eventFinalOwnership(latest || event)
      if (final.status !== 'owned' || final.ownerId !== uid) continue
      const current = await database.collection('metamarket_tokens').findOne({ _id: tokenId }).catch(() => null)
      const updatedAt = num(latest?.createdAt || latest?.updatedAt, Date.now())
      await database.collection('metamarket_tokens').updateOne(
        { _id: tokenId },
        {
          $set: {
            tokenId,
            serial: eventSerialForToken(latest || event, tokenId) || str(current?.serial),
            itemId: iid,
            collectionId: str((latest || event)?.collectionId || current?.collectionId || itemState?.collectionId),
            ownerId: uid,
            status: 'owned',
            updatedAt,
            lastTxId: str((latest || event)?.txId || current?.lastTxId),
            hiddenFromUi: false,
            repairOnly: false,
            storagePrimary: 'mongo',
            repairedFromEventLedger: true,
          },
          $setOnInsert: {
            createdAt: updatedAt,
            mintTxId: str((latest || event)?.txId || current?.mintTxId),
          },
        },
        { upsert: true },
      )
      repaired += 1
      if (repaired >= desired) return repaired
    }
  }
  return repaired
}

async function readItemState(database, itemId) {
  const iid = str(itemId)
  if (!iid) return null
  return database.collection('metamarket_item_states').findOne({ _id: iid }).catch(() => null)
}

async function upsertLegacyToken(database, { ownerId, itemId, status = 'owned', slot = 1, updatedAt = Date.now() } = {}) {
  const uid = str(ownerId)
  const iid = str(itemId)
  if (!uid || !iid) return null
  const state = await readItemState(database, iid)
  const kind = status === 'market' ? 'market' : 'owned'
  const id = legacyTokenId({ ownerId: uid, itemId: iid, slot, kind })
  const existing = await database.collection('metamarket_tokens').findOne({ _id: id }).catch(() => null)
  if (existing) return readToken(id)
  const token = {
    _id: id,
    tokenId: id,
    serial: legacySerial({ itemId: iid, slot }),
    itemId: iid,
    collectionId: str(state?.collectionId),
    ownerId: uid,
    status: kind,
    createdAt: updatedAt,
    updatedAt,
    lastTxId: 'legacy_mongo_hydration',
    mintTxId: 'legacy_mongo_hydration',
    catalogVersionAtMint: str(state?.catalogVersion),
    assetVersionAtMint: str(state?.assetVersion),
    storagePrimary: 'mongo',
    migratedLegacyToken: true,
    hiddenFromUi: true,
    repairOnly: true,
  }
  await database.collection('metamarket_tokens').updateOne(
    { _id: id },
    { $setOnInsert: token },
    { upsert: true },
  )
  return readToken(id)
}

async function ensureOwnedTokenCoverage(database, userId, itemId, desiredCount) {
  const uid = str(userId)
  const iid = str(itemId)
  const desired = Math.max(0, Math.floor(num(desiredCount, 0)))
  if (!uid || !iid || desired <= 0) return 0
  let existing = await database.collection('metamarket_tokens')
    .countDocuments({ ownerId: uid, itemId: iid, status: 'owned' })
    .catch(() => 0)
  let missing = Math.max(0, desired - existing)
  let slot = 1
  const maxSlot = desired + missing + 1000
  while (missing > 0 && slot <= maxSlot) {
    const id = legacyTokenId({ ownerId: uid, itemId: iid, slot, kind: 'owned' })
    const occupied = await database.collection('metamarket_tokens').findOne({ _id: id }).catch(() => null)
    if (!occupied) {
      await upsertLegacyToken(database, { ownerId: uid, itemId: iid, status: 'owned', slot, updatedAt: Date.now() + slot })
      existing += 1
      missing -= 1
    }
    slot += 1
  }
  return existing
}

async function ensureMarketTokenCoverage(database, itemId, desiredCount) {
  const iid = str(itemId)
  const desired = Math.max(0, Math.floor(num(desiredCount, 0)))
  if (!iid || desired <= 0) return 0
  let existing = await database.collection('metamarket_tokens')
    .countDocuments({ ownerId: MARKET_OWNER_ID, itemId: iid, status: 'market' })
    .catch(() => 0)
  let missing = Math.max(0, desired - existing)
  let slot = 1
  const maxSlot = desired + missing + 1000
  while (missing > 0 && slot <= maxSlot) {
    const id = legacyTokenId({ ownerId: MARKET_OWNER_ID, itemId: iid, slot, kind: 'market' })
    const occupied = await database.collection('metamarket_tokens').findOne({ _id: id }).catch(() => null)
    if (!occupied) {
      await upsertLegacyToken(database, { ownerId: MARKET_OWNER_ID, itemId: iid, status: 'market', slot, updatedAt: Date.now() + slot })
      existing += 1
      missing -= 1
    }
    slot += 1
  }
  return existing
}

async function writeToken(token = {}) {
  const database = await db()
  const id = str(token.tokenId)
  if (!id) throw new Error('missing_token_id')
  const doc = { ...token, _id: id, tokenId: id, updatedAt: num(token.updatedAt, Date.now()), storagePrimary: 'mongo' }
  await database.collection('metamarket_tokens').updateOne(
    { _id: id },
    { $set: mutableSetDoc(doc, ['createdAt']), $setOnInsert: { createdAt: num(token.createdAt, Date.now()) } },
    { upsert: true },
  )
  return token
}

async function selectUserToken(userId, itemId, tokenId = '') {
  const database = await db()
  const requested = str(tokenId)
  if (requested) {
    const token = await readToken(requested)
    if (token?.ownerId === str(userId) && token?.itemId === str(itemId) && token?.status === 'owned' && !isLegacyToken(token) && !token.hiddenFromUi && !token.repairOnly) return token
    return null
  }
  const ownedCount = await getUserItemCount(userId, itemId)
  let docs = await database.collection('metamarket_tokens')
    .find({ ownerId: str(userId), itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
    .sort({ updatedAt: 1, tokenId: 1 })
    .limit(Math.max(25, Math.min(100, ownedCount || 25)))
    .toArray()
  const doc = (docs || []).find((row) => !isLegacyToken(row)) || null
  if (doc) return readToken(doc._id || doc.tokenId)
  if (ownedCount > 0) {
    await repairUserItemTokenCoverageFromEvents(database, userId, itemId, ownedCount).catch(() => 0)
    docs = await database.collection('metamarket_tokens')
      .find({ ownerId: str(userId), itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
      .sort({ updatedAt: 1, tokenId: 1 })
      .limit(Math.max(25, Math.min(100, ownedCount || 25)))
      .toArray()
    const repairedDoc = (docs || []).find((row) => !isLegacyToken(row)) || null
    if (repairedDoc) return readToken(repairedDoc._id || repairedDoc.tokenId)
  }
  return null
}

async function countVisibleOwnedTokens(database, userId, itemId, desiredCount = 0) {
  const desired = Math.max(0, Math.floor(num(desiredCount, 0)))
  const limit = Math.max(100, Math.min(10000, desired + 100))
  const rows = await database.collection('metamarket_tokens')
    .find({ ownerId: str(userId), itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
    .sort({ updatedAt: 1, tokenId: 1 })
    .limit(limit)
    .toArray()
    .catch(() => [])
  return (rows || []).filter((row) => !isLegacyToken(row)).length
}

async function popMarketToken(itemId) {
  const database = await db()
  const docs = await database.collection('metamarket_tokens')
    .find({ itemId: str(itemId), ownerId: MARKET_OWNER_ID, status: 'market', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
    .sort({ updatedAt: 1, tokenId: 1 })
    .limit(50)
    .toArray()
  const token = (docs || []).find((row) => !isLegacyToken(row))
  return token ? readToken(token._id || token.tokenId) : null
}

async function addTokenToMarket(itemId, tokenId, returnedAt = Date.now()) {
  const database = await db()
  const iid = str(itemId)
  const tid = str(tokenId)
  if (!iid || !tid) throw new Error('metamarket_token_market_missing_identity')
  const result = await database.collection('metamarket_tokens').updateOne(
    { _id: tid, itemId: iid },
    {
      $set: {
        ownerId: MARKET_OWNER_ID,
        status: 'market',
        updatedAt: num(returnedAt, Date.now()),
        hiddenFromUi: false,
        repairOnly: false,
        storagePrimary: 'mongo',
      },
    },
  )
  if (!result?.matchedCount && !result?.modifiedCount) throw new Error('metamarket_token_market_move_failed')
  return true
}

async function nextGlobalSeq() {
  const database = await db()
  const result = await database.collection('metamarket_counters').findOneAndUpdate(
    { _id: 'metamarket:seq:global' },
    { $inc: { value: 1 }, $set: { updatedAt: Date.now(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: Date.now() } },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && result._id ? result : result?.value
  return Number(doc?.value || 0)
}

async function appendMarketEvent(event = {}) {
  const database = await db()
  const txId = str(event.txId)
  if (!txId) throw new Error('missing_metamarket_tx_id')
  const createdAt = Number(event.createdAt || Date.now())
  const clean = { ...event, _id: txId, txId, createdAt, storagePrimary: 'mongo' }
  await database.collection('metamarket_events').updateOne(
    { _id: txId },
    { $set: mutableSetDoc(clean), $setOnInsert: { firstSeenAt: Date.now() } },
    { upsert: true },
  )
  const tokenIds = parseJsonList(event.tokenIds)
  if (event.tokenId) tokenIds.unshift(str(event.tokenId))
  const uniqueTokenIds = [...new Set(tokenIds.map(str).filter(Boolean))]
  const ops = []
  for (const tokenId of uniqueTokenIds) {
    ops.push({ updateOne: { filter: { _id: `token:${tokenId}:${txId}` }, update: { $set: { indexType: 'token_events', tokenId, txId, score: createdAt, createdAt } }, upsert: true } })
  }
  for (const uid of [event.actorId, event.fromOwnerId, event.toOwnerId].map(str).filter((uid) => uid && uid !== MARKET_OWNER_ID)) {
    ops.push({ updateOne: { filter: { _id: `user:${uid}:${txId}` }, update: { $set: { indexType: 'user_events', userId: uid, txId, score: createdAt, createdAt } }, upsert: true } })
  }
  if (event.itemId) {
    const itemId = str(event.itemId)
    ops.push({ updateOne: { filter: { _id: `item:${itemId}:${txId}` }, update: { $set: { indexType: 'item_events', itemId, txId, score: createdAt, createdAt } }, upsert: true } })
  }
  if (ops.length) await database.collection('metamarket_event_indexes').bulkWrite(ops, { ordered: false })
}

async function readEvent(txId) {
  const database = await db()
  const raw = await database.collection('metamarket_events').findOne({ _id: str(txId) }).catch(() => null)
  if (!raw) return null
  const tokenIds = parseJsonList(raw.tokenIds)
  const serials = parseJsonList(raw.serials)
  return {
    ...raw,
    tokenIds,
    serials,
    quantity: Math.max(1, Math.floor(num(raw.quantity, tokenIds.length || 1))),
    unitPriceMicro: num(raw.unitPriceMicro, 0),
    priceMicro: num(raw.priceMicro, 0),
    qcoinDeltaActor: num(raw.qcoinDeltaActor, 0),
    qcoinDeltaCounterparty: num(raw.qcoinDeltaCounterparty, 0),
    createdAt: num(raw.createdAt, 0),
  }
}

async function readQcoinBalanceMicro(userId) {
  const account = await qcoinPrimary.readAccount(str(userId)).catch(() => null)
  return Math.max(0, Math.round(num(account?.balance, 0) * 1_000_000))
}

async function writeQcoinBalanceMicro(userId, balanceMicro) {
  const uid = str(userId)
  const account = await qcoinPrimary.readAccount(uid).catch(() => null)
  const state = qcoinPrimary.normalizeState(account)
  const previous = num(state.balance, 0)
  const nextBalance = Math.max(0, num(balanceMicro, 0) / 1_000_000)
  state.balance = nextBalance
  await qcoinPrimary.writeState(uid, state, {
    amount: nextBalance - previous,
    eventKind: 'metamarket_balance_set',
    route: '/api/metamarket',
    sourceEventId: `metamarket:balance:${uid}:${Date.now()}`,
    meta: { previousBalance: previous, nextBalance },
  })
  const database = await db()
  await database.collection('metamarket_qcoin_context').updateOne(
    { _id: uid },
    { $set: { userId: uid, balance: nextBalance, updatedAt: Date.now(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: Date.now() } },
    { upsert: true },
  ).catch(() => null)
  return nextBalance
}

async function listOwnedItems(userId, { limit = 50, cursor = '', decodeCursor = null, encodeCursor = null, getItem = null } = {}) {
  const database = await db()
  const offset = Math.max(0, Number(decodeCursor?.(cursor)?.offset || 0))
  const docs = await database.collection('metamarket_user_items').find({ userId: str(userId), count: { $gt: 0 } }).toArray()
  const rows = []
  for (const doc of docs || []) {
    const itemId = str(doc.itemId)
    if (!itemId || (getItem && !getItem(itemId))) continue
    const count = Math.max(0, Math.floor(num(doc.count, 0)))
    if (count <= 0) continue
    await repairUserItemTokenCoverageFromEvents(database, userId, itemId, count).catch(() => 0)
    const realCount = await countVisibleOwnedTokens(database, userId, itemId, count)
    if (realCount !== count) await setUserItemCount(userId, itemId, realCount).catch(() => null)
    if (realCount > 0) rows.push({ itemId, count: realCount })
  }
  rows.sort((a, b) => {
      const ia = getItem ? getItem(a.itemId) : null
      const ib = getItem ? getItem(b.itemId) : null
      if (ia && ib) {
        if (ia.collectionId === ib.collectionId) return ia.sort - ib.sort
        return str(ia.collectionId).localeCompare(str(ib.collectionId))
      }
      return a.itemId.localeCompare(b.itemId)
    })
  const page = rows.slice(offset, offset + limit)
  const nextOffset = offset + limit
  return {
    rows: page,
    totalUniqueItems: rows.length,
    nextCursor: nextOffset < rows.length ? encodeCursor?.({ offset: nextOffset }) || null : null,
    hasMore: nextOffset < rows.length,
  }
}

async function listOwners(itemId, { limit = 50, cursor = '', decodeCursor = null, encodeCursor = null } = {}) {
  const database = await db()
  const offset = Math.max(0, Number(decodeCursor?.(cursor)?.offset || 0))
  const all = await database.collection('metamarket_owners').find({ itemId: str(itemId), count: { $gt: 0 } })
    .sort({ count: -1, recent: -1, userId: 1 })
    .toArray()
  const totalOwnedByUsers = all.reduce((sum, row) => sum + Math.max(0, Math.floor(num(row.count, 0))), 0)
  const page = all.slice(offset, offset + limit)
  const nextOffset = offset + limit
  return {
    page: page.map((row) => ({
      userId: str(row.userId),
      count: Math.max(0, Math.floor(num(row.count, 0))),
      recent: num(row.recent, row.updatedAt),
      ownedSince: num(row.ownedSince, row.recent || row.updatedAt),
    })),
    totalOwners: all.length,
    totalOwnedByUsers,
    nextCursor: nextOffset < all.length ? encodeCursor?.({ offset: nextOffset }) || null : null,
    hasMore: nextOffset < all.length,
  }
}

async function listHistory(filter, { limit = 50, cursor = '', decodeCursor = null, encodeCursor = null } = {}) {
  const database = await db()
  const offset = Math.max(0, Number(decodeCursor?.(cursor)?.offset || 0))
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50))
  const total = await database.collection('metamarket_event_indexes').countDocuments(filter)
  const rows = await database.collection('metamarket_event_indexes').find(filter)
    .sort({ score: -1, txId: 1 })
    .skip(offset)
    .limit(safeLimit)
    .toArray()
  const events = []
  for (const row of rows) {
    const event = await readEvent(row.txId)
    if (event) events.push(event)
  }
  const nextOffset = offset + safeLimit
  return {
    events,
    nextCursor: nextOffset < total ? encodeCursor?.({ offset: nextOffset }) || null : null,
    hasMore: nextOffset < total,
  }
}

async function reconcileOwnersCount(itemId) {
  const database = await db()
  return database.collection('metamarket_owners').countDocuments({ itemId: str(itemId), count: { $gt: 0 } })
}

async function appendAudit(report = {}) {
  const database = await db()
  const id = `audit:${str(report.itemId || 'item')}:${Date.now()}`
  await database.collection('metamarket_audit').updateOne(
    { _id: id },
    { $set: { ...mutableSetDoc(report, ['createdAt']), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: Date.now() } },
    { upsert: true },
  )
}

module.exports = {
  MARKET_OWNER_ID,
  __setTestDb,
  addTokenToMarket,
  addTokenToUser,
  appendAudit,
  appendMarketEvent,
  ensureItemState,
  getUserItemCount,
  incrementUserItemCount,
  listHistory,
  listOwnedItems,
  listOwners,
  nextGlobalSeq,
  normalizeItemState,
  popMarketToken,
  readEvent,
  readQcoinBalanceMicro,
  readToken,
  reconcileOwnersCount,
  removeTokenFromUser,
  selectUserToken,
  setUserItemCount,
  updateOwnerIndexes,
  writeItemState,
  writeQcoinBalanceMicro,
  writeToken,
}
