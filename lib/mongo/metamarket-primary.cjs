// lib/mongo/metamarket-primary.cjs
// Mongo-primary MetaMarket state, ownership, token, and event repository.

const { getMongoDb } = require('./client.cjs')
const qcoinPrimary = require('./qcoin-primary.cjs')
const crypto = require('node:crypto')
const { bindMongoDatabase } = require('./transaction-context.cjs')

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
  return bindMongoDatabase(database)
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

function __setTestAliasResolver(resolver) {
  if (typeof qcoinPrimary.__setTestAliasResolver === 'function') {
    qcoinPrimary.__setTestAliasResolver(resolver)
  }
}

function uniqueIds(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean)))
}

async function resolveUserIdentity(raw) {
  const input = str(raw)
  if (!input) return { canonical: '', ids: [] }

  const [canonicalRaw, candidates] = await Promise.all([
    qcoinPrimary.resolveCanonicalAccountId(input),
    qcoinPrimary.resolveAccountIdCandidates(input),
  ])
  const canonical = str(canonicalRaw || input)
  return { canonical, ids: uniqueIds([canonical, input, ...candidates]) }
}

function newestIdentityDoc(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter(Boolean)
    .sort((a, b) => num(b?.updatedAt ?? b?.recent ?? b?.createdAt, 0) - num(a?.updatedAt ?? a?.recent ?? a?.createdAt, 0))[0] || null
}

async function findUserItemDocs(database, userId, itemId) {
  const identity = await resolveUserIdentity(userId)
  const iid = str(itemId)
  if (!identity.canonical || !iid) return { ...identity, rows: [] }
  const rows = await database.collection('metamarket_user_items').find({
    $or: [
      { _id: { $in: identity.ids.map((id) => `${id}:${iid}`) } },
      { userId: { $in: identity.ids }, itemId: iid },
    ],
  }).limit(100).toArray().catch(() => [])
  return { ...identity, rows }
}

async function findOwnerDocs(database, itemId, userId) {
  const identity = await resolveUserIdentity(userId)
  const iid = str(itemId)
  if (!identity.canonical || !iid) return { ...identity, rows: [] }
  const rows = await database.collection('metamarket_owners').find({
    $or: [
      { _id: { $in: identity.ids.map((id) => `${iid}:${id}`) } },
      { itemId: iid, userId: { $in: identity.ids } },
    ],
  }).limit(100).toArray().catch(() => [])
  return { ...identity, rows }
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

async function ensureItemStates(items = []) {
  const database = await db()
  const uniqueItems = []
  const seenIds = new Set()
  for (const item of Array.isArray(items) ? items : []) {
    const itemId = str(item?.itemId)
    if (!itemId || seenIds.has(itemId)) continue
    seenIds.add(itemId)
    uniqueItems.push(item)
  }
  if (!uniqueItems.length) return new Map()

  const itemIds = uniqueItems.map((item) => str(item.itemId))
  const existingRows = await database.collection('metamarket_item_states')
    .find({ _id: { $in: itemIds } })
    .toArray()
  const existingById = new Map((existingRows || []).map((row) => [str(row?._id || row?.itemId), row]))
  const ops = []

  for (const item of uniqueItems) {
    const itemId = str(item.itemId)
    const existing = existingById.get(itemId) || null
    if (!existing) {
      const now = Date.now()
      const state = {
        ...statePatchFromCatalog(item),
        totalSupply: Number(item.supply || 0),
        marketAvailable: Number(item.supply || 0),
        mintedCount: 0,
        updatedAt: now,
        rev: 1,
        storagePrimary: 'mongo',
      }
      ops.push({
        updateOne: {
          filter: { _id: itemId },
          update: { $setOnInsert: { ...state, createdAt: now } },
          upsert: true,
        },
      })
      continue
    }

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

    if (!needsCatalogRefresh && !canRefreshSupplySafely) continue

    const patch = { ...statePatchFromCatalog(item), updatedAt: Date.now(), storagePrimary: 'mongo' }
    const filter = { _id: itemId }
    if (canRefreshSupplySafely) {
      patch.totalSupply = catalogSupply
      patch.marketAvailable = Math.max(0, catalogSupply - unavailableCount)
      // Do not overwrite an inventory movement that raced this read refresh.
      filter.totalSupply = existing.totalSupply
      filter.marketAvailable = existing.marketAvailable
    }
    ops.push({ updateOne: { filter, update: { $set: patch } } })
  }

  if (ops.length) {
    await database.collection('metamarket_item_states').bulkWrite(ops, { ordered: false })
  }

  const finalRows = ops.length
    ? await database.collection('metamarket_item_states')
      .find({ _id: { $in: itemIds } })
      .toArray()
    : existingRows
  const finalById = new Map((finalRows || []).map((row) => [str(row?._id || row?.itemId), row]))
  return new Map(uniqueItems.map((item) => {
    const itemId = str(item.itemId)
    return [itemId, normalizeItemState(item, finalById.get(itemId) || {})]
  }))
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

async function getUserItemCounts(userId, itemIds = []) {
  const database = await db()
  const identity = await resolveUserIdentity(userId)
  const ids = uniqueIds(identity.ids)
  const uniqueItemIds = uniqueIds(itemIds)
  const counts = new Map(uniqueItemIds.map((itemId) => [itemId, 0]))
  if (!identity.canonical || !ids.length || !uniqueItemIds.length) return counts

  const idToItem = new Map()
  for (const id of ids) {
    for (const itemId of uniqueItemIds) idToItem.set(`${id}:${itemId}`, itemId)
  }
  const rows = await database.collection('metamarket_user_items').find({
    $or: [
      { _id: { $in: Array.from(idToItem.keys()) } },
      { userId: { $in: ids }, itemId: { $in: uniqueItemIds } },
    ],
  }).toArray()

  const byItem = new Map()
  for (const row of rows || []) {
    const itemId = str(row?.itemId) || idToItem.get(str(row?._id)) || ''
    if (!itemId || !counts.has(itemId)) continue
    if (!byItem.has(itemId)) byItem.set(itemId, [])
    byItem.get(itemId).push(row)
  }

  for (const itemId of uniqueItemIds) {
    const itemRows = byItem.get(itemId) || []
    const canonicalDoc = itemRows.find((row) =>
      str(row?.userId) === identity.canonical ||
      str(row?._id) === `${identity.canonical}:${itemId}`
    )
    const fallbackDoc = itemRows.reduce((best, row) => (
      !best || num(row?.count, 0) > num(best?.count, 0) ? row : best
    ), null)
    counts.set(itemId, Math.max(0, Math.floor(num((canonicalDoc || fallbackDoc)?.count, 0))))
  }

  return counts
}

async function getUserItemCount(userId, itemId) {
  const database = await db()
  const { canonical, rows } = await findUserItemDocs(database, userId, itemId)
  const canonicalDoc = rows.find((row) => str(row?.userId) === canonical || str(row?._id) === `${canonical}:${str(itemId)}`)
  const doc = canonicalDoc || rows.sort((a, b) => num(b?.count, 0) - num(a?.count, 0))[0] || null
  return Math.max(0, Math.floor(num(doc?.count, 0)))
}

async function updateOwnerIndexes(itemId, userId, count) {
  const database = await db()
  const iid = str(itemId)
  const { canonical: uid, rows } = await findOwnerDocs(database, iid, userId)
  const safeCount = Math.max(0, Math.floor(num(count, 0)))
  if (!iid || !uid) return
  const existing = rows.find((row) => str(row?.userId) === uid || str(row?._id) === `${iid}:${uid}`) || newestIdentityDoc(rows)
  const now = Date.now()
  await database.collection('metamarket_owners').updateOne(
    existing?._id ? { _id: existing._id } : { _id: `${iid}:${uid}` },
    {
      $set: { itemId: iid, userId: uid, count: safeCount, recent: now, updatedAt: now, storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
}

async function setUserItemCount(userId, itemId, count) {
  const database = await db()
  const iid = str(itemId)
  const { canonical: uid, rows } = await findUserItemDocs(database, userId, iid)
  const next = Math.max(0, Math.floor(num(count, 0)))
  if (!uid || !iid) throw new Error('metamarket_owner_missing_identity')
  const existing = rows.find((row) => str(row?.userId) === uid || str(row?._id) === `${uid}:${iid}`) || newestIdentityDoc(rows)
  const now = Date.now()
  await database.collection('metamarket_user_items').updateOne(
    existing?._id ? { _id: existing._id } : { _id: `${uid}:${iid}` },
    {
      $set: { userId: uid, itemId: iid, count: next, updatedAt: now, storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
  await updateOwnerIndexes(iid, uid, next)
  return next
}

async function incrementUserItemCount(userId, itemId, delta) {
  return setUserItemCount(userId, itemId, await getUserItemCount(userId, itemId) + Number(delta || 0))
}

async function addTokenToUser(userId, itemId, tokenId, acquiredAt = Date.now()) {
  const database = await db()
  const { canonical: uid } = await resolveUserIdentity(userId)
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
  const { canonical: uid, ids } = await resolveUserIdentity(userId)
  const iid = str(itemId)
  const tid = str(tokenId)
  if (!uid || !iid || !tid) throw new Error('metamarket_token_remove_missing_identity')
  const token = await database.collection('metamarket_tokens').findOne({ _id: tid }).catch(() => null)
  if (!token || !ids.includes(str(token.ownerId)) || str(token.itemId) !== iid || str(token.status) !== 'owned' || isLegacyToken(token)) {
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
  const { canonical: uid, ids: ownerIds } = await resolveUserIdentity(userId)
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
      if (final.status !== 'owned' || !ownerIds.includes(final.ownerId)) continue
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
  const { canonical: uid, ids: ownerIds } = await resolveUserIdentity(userId)
  const iid = str(itemId)
  const desired = Math.max(0, Math.floor(num(desiredCount, 0)))
  if (!uid || !iid || desired <= 0) return 0
  let existing = await database.collection('metamarket_tokens')
    .countDocuments({ ownerId: { $in: ownerIds }, itemId: iid, status: 'owned' })
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
  const { canonical: uid, ids: ownerIds } = await resolveUserIdentity(userId)
  const requested = str(tokenId)
  if (requested) {
    const token = await readToken(requested)
    if (ownerIds.includes(token?.ownerId) && token?.itemId === str(itemId) && token?.status === 'owned' && !isLegacyToken(token) && !token.hiddenFromUi && !token.repairOnly) return token
    return null
  }
  const ownedCount = await getUserItemCount(uid, itemId)
  let docs = await database.collection('metamarket_tokens')
    .find({ ownerId: { $in: ownerIds }, itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
    .sort({ updatedAt: 1, tokenId: 1 })
    .limit(Math.max(25, Math.min(100, ownedCount || 25)))
    .toArray()
  const doc = (docs || []).find((row) => !isLegacyToken(row)) || null
  if (doc) return readToken(doc._id || doc.tokenId)
  if (ownedCount > 0) {
    await repairUserItemTokenCoverageFromEvents(database, uid, itemId, ownedCount).catch(() => 0)
    docs = await database.collection('metamarket_tokens')
      .find({ ownerId: { $in: ownerIds }, itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
      .sort({ updatedAt: 1, tokenId: 1 })
      .limit(Math.max(25, Math.min(100, ownedCount || 25)))
      .toArray()
    const repairedDoc = (docs || []).find((row) => !isLegacyToken(row)) || null
    if (repairedDoc) return readToken(repairedDoc._id || repairedDoc.tokenId)
  }
  return null
}

async function readVisibleOwnedTokenSnapshot(database, { canonical = '', ownerIds = [], itemIds = [] } = {}) {
  const ids = uniqueIds(ownerIds)
  const iids = uniqueIds(itemIds)
  const counts = new Map(iids.map((itemId) => [itemId, 0]))
  const aliasOwnedItems = new Set()
  if (!ids.length || !iids.length) return { counts, aliasOwnedItems }

  const rows = await database.collection('metamarket_tokens')
    .find({
      ownerId: { $in: ids },
      itemId: { $in: iids },
      status: 'owned',
      hiddenFromUi: { $ne: true },
      repairOnly: { $ne: true },
    })
    .toArray()

  for (const row of rows || []) {
    if (isLegacyToken(row)) continue
    const itemId = str(row?.itemId)
    if (!counts.has(itemId)) continue
    counts.set(itemId, (counts.get(itemId) || 0) + 1)
    if (canonical && str(row?.ownerId) !== canonical) aliasOwnedItems.add(itemId)
  }

  return { counts, aliasOwnedItems }
}

async function countVisibleOwnedTokens(database, userId, itemId, desiredCount = 0) {
  const { ids: ownerIds } = await resolveUserIdentity(userId)
  const desired = Math.max(0, Math.floor(num(desiredCount, 0)))
  const limit = Math.max(100, Math.min(10000, desired + 100))
  const rows = await database.collection('metamarket_tokens')
    .find({ ownerId: { $in: ownerIds }, itemId: str(itemId), status: 'owned', hiddenFromUi: { $ne: true }, repairOnly: { $ne: true } })
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

function normalizeEventDoc(raw) {
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

async function readEvent(txId) {
  const database = await db()
  const raw = await database.collection('metamarket_events').findOne({ _id: str(txId) }).catch(() => null)
  return normalizeEventDoc(raw)
}

async function readQcoinBalanceMicro(userId) {
  const account = await qcoinPrimary.readAccount(str(userId))
  return Math.max(0, Math.round(num(account?.balance, 0) * 1_000_000))
}

async function writeQcoinBalanceMicro(userId, balanceMicro, options = {}) {
  const { canonical: uid, ids } = await resolveUserIdentity(userId)
  const account = await qcoinPrimary.readAccount(uid)
  const state = qcoinPrimary.normalizeState(account)
  const previous = num(state.balance, 0)
  const previousBalanceMicro = Math.max(0, Math.round(previous * 1_000_000))
  const nextBalanceMicro = Math.max(0, Math.round(num(balanceMicro, 0)))
  const nextBalance = nextBalanceMicro / 1_000_000
  const balanceDelta = (nextBalanceMicro - previousBalanceMicro) / 1_000_000
  state.balance = nextBalance
  await qcoinPrimary.writeState(uid, state, {
    // Receipt amounts and balance movement are both bound to the same integer
    // micro-QCoin units. A legacy balance with >6 decimals cannot introduce a
    // floating-point binding mismatch anymore.
    amount: balanceDelta,
    eventKind: 'metamarket_balance_set',
    route: '/api/metamarket',
    sourceEventId: String(options.sourceEventId || `metamarket:balance:${uid}:${Date.now()}`),
    idempotencyKey: String(options.idempotencyKey || options.sourceEventId || `metamarket:balance:${uid}:${Date.now()}`),
    economicRouteId: String(options.economicRouteId || ''),
    decisionReceipt: options.decisionReceipt || null,
    operationType: String(options.operationType || (nextBalance >= previous ? 'credit' : 'debit')),
    meta: { previousBalance: previous, previousBalanceMicro, nextBalance, nextBalanceMicro, ...(options.meta || {}) },
  })
  const database = await db()
  const existingContext = await database.collection('metamarket_qcoin_context')
    .findOne({ _id: { $in: ids } })
    .catch(() => null)
  await database.collection('metamarket_qcoin_context').updateOne(
    existingContext?._id ? { _id: existingContext._id } : { _id: uid },
    { $set: { userId: uid, balance: nextBalance, updatedAt: Date.now(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: Date.now() } },
    { upsert: true },
  ).catch(() => null)
  return nextBalance
}

async function listOwnedItems(userId, { limit = 50, cursor = '', decodeCursor = null, encodeCursor = null, getItem = null } = {}) {
  const database = await db()
  const { canonical: uid, ids } = await resolveUserIdentity(userId)
  const offset = Math.max(0, Number(decodeCursor?.(cursor)?.offset || 0))
  const docs = await database.collection('metamarket_user_items').find({ userId: { $in: ids }, count: { $gt: 0 } }).toArray()
  const byItem = new Map()
  for (const doc of docs || []) {
    const itemId = str(doc?.itemId)
    if (!itemId) continue
    const current = byItem.get(itemId)
    const direct = str(doc?.userId) === uid
    const currentDirect = str(current?.userId) === uid
    if (!current || (direct && !currentDirect) || (direct === currentDirect && num(doc?.count, 0) > num(current?.count, 0))) {
      byItem.set(itemId, doc)
    }
  }

  const candidates = []
  for (const doc of byItem.values()) {
    const itemId = str(doc.itemId)
    if (!itemId || (getItem && !getItem(itemId))) continue
    const count = Math.max(0, Math.floor(num(doc.count, 0)))
    if (count > 0) candidates.push({ itemId, count })
  }

  const candidateIds = candidates.map((row) => row.itemId)
  let snapshot = await readVisibleOwnedTokenSnapshot(database, { canonical: uid, ownerIds: ids, itemIds: candidateIds })
  const repairIds = candidates
    .filter((row) => (snapshot.counts.get(row.itemId) || 0) !== row.count || snapshot.aliasOwnedItems.has(row.itemId))
    .map((row) => row.itemId)

  if (repairIds.length) {
    const desiredByItem = new Map(candidates.map((row) => [row.itemId, row.count]))
    for (const itemId of repairIds) {
      await repairUserItemTokenCoverageFromEvents(database, uid, itemId, desiredByItem.get(itemId) || 1).catch(() => 0)
    }
    const repairedSnapshot = await readVisibleOwnedTokenSnapshot(database, { canonical: uid, ownerIds: ids, itemIds: repairIds })
    for (const itemId of repairIds) snapshot.counts.set(itemId, repairedSnapshot.counts.get(itemId) || 0)
  }

  const rows = []
  for (const row of candidates) {
    const realCount = snapshot.counts.get(row.itemId) || 0
    if (realCount !== row.count) await setUserItemCount(uid, row.itemId, realCount).catch(() => null)
    if (realCount > 0) rows.push({ itemId: row.itemId, count: realCount })
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
  const physicalRows = await database.collection('metamarket_owners').find({ itemId: str(itemId), count: { $gt: 0 } })
    .sort({ count: -1, recent: -1, userId: 1 })
    .toArray()
  const byOwner = new Map()
  for (const row of physicalRows || []) {
    const { canonical } = await resolveUserIdentity(row?.userId)
    if (!canonical) continue
    const next = { ...row, userId: canonical }
    const current = byOwner.get(canonical)
    if (!current || num(next.count, 0) > num(current.count, 0) || (num(next.count, 0) === num(current.count, 0) && num(next.recent, next.updatedAt) > num(current.recent, current.updatedAt))) {
      byOwner.set(canonical, next)
    }
  }
  const all = Array.from(byOwner.values()).sort((a, b) => num(b.count, 0) - num(a.count, 0) || num(b.recent, b.updatedAt) - num(a.recent, a.updatedAt) || str(a.userId).localeCompare(str(b.userId)))
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
  let pageRows = []
  let hasMore = false

  if (str(filter?.indexType) === 'user_events' && str(filter?.userId)) {
    const { ids } = await resolveUserIdentity(filter.userId)
    const targetUnique = offset + safeLimit + 1
    const batchSize = Math.max(64, Math.min(1000, Math.max(safeLimit * 4, targetUnique)))
    const deduped = []
    const seen = new Set()
    let rawOffset = 0

    while (deduped.length < targetUnique) {
      const batch = await database.collection('metamarket_event_indexes')
        .find({ ...filter, userId: { $in: ids } })
        .sort({ score: -1, txId: 1 })
        .skip(rawOffset)
        .limit(batchSize)
        .toArray()
      if (!batch.length) break
      rawOffset += batch.length
      for (const row of batch) {
        const txId = str(row?.txId)
        if (!txId || seen.has(txId)) continue
        seen.add(txId)
        deduped.push(row)
        if (deduped.length >= targetUnique) break
      }
      if (batch.length < batchSize) break
    }

    const selected = deduped.slice(offset, offset + safeLimit + 1)
    hasMore = selected.length > safeLimit
    pageRows = selected.slice(0, safeLimit)
  } else {
    const selected = await database.collection('metamarket_event_indexes').find(filter)
      .sort({ score: -1, txId: 1 })
      .skip(offset)
      .limit(safeLimit + 1)
      .toArray()
    hasMore = selected.length > safeLimit
    pageRows = selected.slice(0, safeLimit)
  }

  const txIds = uniqueIds(pageRows.map((row) => row?.txId))
  const rawEvents = txIds.length
    ? await database.collection('metamarket_events')
      .find({ _id: { $in: txIds } })
      .toArray()
    : []
  const eventById = new Map((rawEvents || []).map((event) => [str(event?._id || event?.txId), normalizeEventDoc(event)]))
  const events = pageRows.map((row) => eventById.get(str(row?.txId))).filter(Boolean)
  const nextOffset = offset + safeLimit
  return {
    events,
    nextCursor: hasMore ? encodeCursor?.({ offset: nextOffset }) || null : null,
    hasMore,
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
  __setTestAliasResolver,
  __setTestDb,
  addTokenToMarket,
  addTokenToUser,
  appendAudit,
  appendMarketEvent,
  ensureItemState,
  ensureItemStates,
  getUserItemCount,
  getUserItemCounts,
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
