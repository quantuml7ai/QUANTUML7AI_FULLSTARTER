import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import metamarketPrimaryModule from '../../../lib/mongo/metamarket-primary.cjs'
import qcoinPrimaryModule from '../../../lib/mongo/qcoin-primary.cjs'
import decisionReceiptModule from '../../../lib/economic-integrity/decisionReceipt.cjs'

const metamarketPrimary = metamarketPrimaryModule?.default || metamarketPrimaryModule
const qcoinPrimary = qcoinPrimaryModule?.default || qcoinPrimaryModule
const decisionReceipt = decisionReceiptModule?.default || decisionReceiptModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$gt' in expected) return Number(actual) > Number(expected.$gt)
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
    if ('$ne' in expected) return String(actual) !== String(expected.$ne)
  }
  if (Array.isArray(actual)) return actual.map(String).includes(String(expected))
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((item) => matches(doc, item))
  return Object.entries(filter).every(([key, expected]) => matchesValue(getValue(doc, key), expected))
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (isInsert && update.$setOnInsert) Object.assign(doc, update.$setOnInsert)
  if (update.$set) Object.assign(doc, update.$set)
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      doc[key] = Number(doc[key] || 0) + Number(value || 0)
    }
  }
}

function assertMongoUpdateShape(update = {}) {
  const setKeys = new Set(Object.keys(update.$set || {}))
  if (setKeys.has('_id')) {
    const error = new Error("Updating the path '_id' would modify the immutable field '_id'")
    error.code = 66
    throw error
  }
  for (const key of Object.keys(update.$setOnInsert || {})) {
    if (setKeys.has(key)) {
      const error = new Error(`Updating the path '${key}' would create a conflict at '${key}'`)
      error.code = 40
      throw error
    }
  }
}

function createCursor(items) {
  let list = [...items]
  return {
    sort(spec = {}) {
      const entries = Object.entries(spec)
      list.sort((a, b) => {
        for (const [key, dir] of entries) {
          const av = getValue(a, key)
          const bv = getValue(b, key)
          const diff = Number.isFinite(Number(av)) && Number.isFinite(Number(bv))
            ? Number(av) - Number(bv)
            : String(av).localeCompare(String(bv))
          if (diff !== 0) return dir < 0 ? -diff : diff
        }
        return 0
      })
      return this
    },
    skip(n) {
      list = list.slice(Math.max(0, Number(n) || 0))
      return this
    },
    limit(n) {
      list = list.slice(0, Number(n) || list.length)
      return this
    },
    async toArray() {
      return list.map((item) => ({ ...item }))
    },
  }
}

function createMemoryCollection() {
  const rows = new Map()
  const metrics = { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 }
  return {
    rows,
    metrics,
    async createIndex() { return 'ok' },
    async updateOne(filter, update, options = {}) {
      metrics.updateOne += 1
      assertMongoUpdateShape(update)
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || filter?.txId || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    async findOneAndUpdate(filter, update, options = {}) {
      await this.updateOne(filter, update, { upsert: options.upsert })
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async findOne(filter) {
      metrics.findOne += 1
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async deleteOne(filter) {
      const doc = Array.from(rows.values()).find((row) => matches(row, filter))
      if (doc) rows.delete(String(doc._id))
      return { deletedCount: doc ? 1 : 0 }
    },
    find(filter = {}) {
      metrics.find += 1
      return createCursor(Array.from(rows.values()).filter((row) => matches(row, filter)))
    },
    async countDocuments(filter = {}) {
      metrics.countDocuments += 1
      return Array.from(rows.values()).filter((row) => matches(row, filter)).length
    },
    async bulkWrite(ops = []) {
      metrics.bulkWrite += 1
      for (const op of ops) {
        if (op.updateOne) await this.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: op.updateOne.upsert })
      }
      return { ok: 1 }
    },
  }
}

function createMemoryDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, createMemoryCollection())
      return collections.get(name)
    },
  }
}

describe('metamarket Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    metamarketPrimary.__setTestDb(memoryDb)
    qcoinPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    metamarketPrimary.__setTestAliasResolver?.(null)
    metamarketPrimary.__setTestDb(null)
    qcoinPrimary.__setTestDb(null)
    qcoinPrimary.__setTestAliasResolver?.(null)
  })

  test('keeps legacy alias-owned assets and history visible while reusing their physical rows for canonical writes', async () => {
    const canonical = '0x1111111111111111111111111111111111111111'
    const legacy = '777001'
    const itemId = 'linked_asset'
    const tokenId = 'linked_token'
    const txId = 'linked_tx'

    const aliasResolver = async (uid) => ({
      canonical: uid === legacy || uid === canonical ? canonical : uid,
      aliases: uid === legacy || uid === canonical ? [legacy, `telegram:${legacy}`] : [],
    })
    metamarketPrimary.__setTestAliasResolver(aliasResolver)
    qcoinPrimary.__setTestAliasResolver(aliasResolver)

    const identityIds = await qcoinPrimary.resolveAccountIdCandidates(canonical)
    expect(identityIds).toContain(legacy)

    await memoryDb.collection('metamarket_user_items').updateOne(
      { _id: `${legacy}:${itemId}` },
      { $set: { userId: legacy, itemId, count: 1, updatedAt: 10 } },
      { upsert: true },
    )
    await memoryDb.collection('metamarket_owners').updateOne(
      { _id: `${itemId}:${legacy}` },
      { $set: { userId: legacy, itemId, count: 1, recent: 10, updatedAt: 10 } },
      { upsert: true },
    )
    await memoryDb.collection('metamarket_tokens').updateOne(
      { _id: tokenId },
      { $set: { tokenId, ownerId: legacy, itemId, status: 'owned', updatedAt: 10 } },
      { upsert: true },
    )
    await memoryDb.collection('metamarket_events').updateOne(
      { _id: txId },
      { $set: { txId, type: 'BUY', actorId: legacy, toOwnerId: legacy, itemId, tokenId, tokenIds: [tokenId], createdAt: 10 } },
      { upsert: true },
    )
    await memoryDb.collection('metamarket_event_indexes').updateOne(
      { _id: `user:${legacy}:${txId}` },
      { $set: { indexType: 'user_events', userId: legacy, txId, score: 10 } },
      { upsert: true },
    )

    expect(await memoryDb.collection('metamarket_user_items').find({
      $or: [
        { _id: { $in: identityIds.map((id) => `${id}:${itemId}`) } },
        { userId: { $in: identityIds }, itemId },
      ],
    }).toArray()).toHaveLength(1)

    await expect(metamarketPrimary.getUserItemCount(canonical, itemId)).resolves.toBe(1)
    await expect(metamarketPrimary.selectUserToken(canonical, itemId)).resolves.toMatchObject({ tokenId, ownerId: legacy })
    await expect(metamarketPrimary.listHistory({ indexType: 'user_events', userId: canonical })).resolves.toMatchObject({
      events: [expect.objectContaining({ txId })],
      hasMore: false,
    })

    const owned = await metamarketPrimary.listOwnedItems(canonical, {
      limit: 10,
      getItem: (id) => ({ itemId: id, collectionId: 'proof', sort: 1 }),
    })
    expect(owned.rows).toEqual([{ itemId, count: 1 }])

    await metamarketPrimary.setUserItemCount(canonical, itemId, 2)
    expect(memoryDb.collection('metamarket_user_items').rows.has(`${canonical}:${itemId}`)).toBe(false)
    expect(memoryDb.collection('metamarket_user_items').rows.get(`${legacy}:${itemId}`)).toMatchObject({
      userId: canonical,
      itemId,
      count: 2,
    })
    expect(memoryDb.collection('metamarket_owners').rows.has(`${itemId}:${canonical}`)).toBe(false)
    expect(memoryDb.collection('metamarket_owners').rows.get(`${itemId}:${legacy}`)).toMatchObject({
      userId: canonical,
      itemId,
      count: 2,
    })

    const owners = await metamarketPrimary.listOwners(itemId, { limit: 10 })
    expect(owners.page).toEqual([
      expect.objectContaining({ userId: canonical, count: 2 }),
    ])
  })

  test('stores item state, ownership, tokens, QCoin context, and event indexes in Mongo', async () => {
    const item = {
      itemId: 'skin_1',
      collectionId: 'skins',
      catalogVersion: 'v1',
      assetVersion: 'a1',
      supply: 10,
      priceMicro: 2_000_000,
      sellRateBps: 9700,
      scarcityPriceBps: 0,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    }

    await metamarketPrimary.ensureItemState(item)
    await metamarketPrimary.writeQcoinBalanceMicro('alice', 5_000_000)
    await metamarketPrimary.writeToken({
      tokenId: 'token_1',
      serial: 'MM-SK-000000001-L7',
      itemId: 'skin_1',
      collectionId: 'skins',
      ownerId: 'MARKET',
      status: 'market',
      createdAt: 1,
      updatedAt: 1,
    })

    await expect(metamarketPrimary.popMarketToken('skin_1')).resolves.toMatchObject({ tokenId: 'token_1' })
    await metamarketPrimary.writeToken({
      tokenId: 'token_1',
      serial: 'MM-SK-000000001-L7',
      itemId: 'skin_1',
      collectionId: 'skins',
      ownerId: 'alice',
      status: 'owned',
      createdAt: 1,
      updatedAt: 2,
    })
    await metamarketPrimary.setUserItemCount('alice', 'skin_1', 1)

    await expect(metamarketPrimary.getUserItemCount('alice', 'skin_1')).resolves.toBe(1)
    await expect(metamarketPrimary.selectUserToken('alice', 'skin_1')).resolves.toMatchObject({ tokenId: 'token_1' })
    await expect(metamarketPrimary.readQcoinBalanceMicro('alice')).resolves.toBe(5_000_000)

    await metamarketPrimary.appendMarketEvent({
      txId: 'tx_1',
      type: 'BUY',
      itemId: 'skin_1',
      collectionId: 'skins',
      tokenId: 'token_1',
      tokenIds: JSON.stringify(['token_1']),
      actorId: 'alice',
      fromOwnerId: 'MARKET',
      toOwnerId: 'alice',
      priceMicro: 2_000_000,
      createdAt: 10,
    })

    const tokenHistory = await metamarketPrimary.listHistory({ indexType: 'token_events', tokenId: 'token_1' })
    expect(tokenHistory.events).toHaveLength(1)
    expect(tokenHistory.events[0]).toMatchObject({ txId: 'tx_1', type: 'BUY' })

    const owners = await metamarketPrimary.listOwners('skin_1')
    expect(owners).toMatchObject({ totalOwners: 1, totalOwnedByUsers: 1 })
    expect(owners.page[0]).toMatchObject({ userId: 'alice', count: 1 })
  })

  test('binds MetaMarket debit receipts to integer micro units for legacy high-precision balances', async () => {
    const uid = 'legacy-precision-account'
    const rawLegacyBalance = 22_048_973.689488012
    const previousBalanceMicro = Math.round(rawLegacyBalance * 1_000_000)
    const debitMicro = 1_250_000
    const nextBalanceMicro = previousBalanceMicro - debitMicro
    const idempotencyKey = 'economic:metamarket.buy:legacy-precision-account:proof'

    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: `account:${uid}` },
      {
        $set: {
          uid,
          userId: uid,
          accountId: uid,
          balance: rawLegacyBalance,
        },
      },
      { upsert: true },
    )

    const receipt = decisionReceipt.createDecisionReceipt({
      operationId: 'operation:metamarket-precision-proof',
      envelopeHash: 'hash:metamarket-precision-proof',
      routeId: 'metamarket.buy',
      operationType: 'debit',
      actorAccountId: uid,
      targetAccountId: uid,
      amount: debitMicro / 1_000_000,
      decision: 'ALLOW',
      idempotencyKey,
    })

    await expect(metamarketPrimary.writeQcoinBalanceMicro(uid, nextBalanceMicro, {
      economicRouteId: 'metamarket.buy',
      operationType: 'debit',
      idempotencyKey,
      sourceEventId: 'metamarket:precision-proof',
      decisionReceipt: receipt,
    })).resolves.toBe(nextBalanceMicro / 1_000_000)

    await expect(metamarketPrimary.readQcoinBalanceMicro(uid)).resolves.toBe(nextBalanceMicro)
    expect(memoryDb.collection('qcoin_accounts').rows.get(`account:${uid}`).balance)
      .toBe(nextBalanceMicro / 1_000_000)
  })

  test('updates existing item and token documents without Mongo update-path conflicts', async () => {
    const item = {
      itemId: 'conflict_safe',
      collectionId: 'skins',
      supply: 2,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    }

    await metamarketPrimary.ensureItemState(item)
    await metamarketPrimary.writeItemState(item.itemId, { marketAvailable: 1, createdAt: 123 })
    await metamarketPrimary.writeToken({
      tokenId: 'conflict_token',
      serial: 'MM-CF-000000001-L7',
      itemId: item.itemId,
      collectionId: item.collectionId,
      ownerId: 'MARKET',
      status: 'market',
      createdAt: 1,
      updatedAt: 1,
    })
    await metamarketPrimary.writeToken({
      tokenId: 'conflict_token',
      serial: 'MM-CF-000000001-L7',
      itemId: item.itemId,
      collectionId: item.collectionId,
      ownerId: 'alice',
      status: 'owned',
      createdAt: 999,
      updatedAt: 2,
    })

    const token = await metamarketPrimary.readToken('conflict_token')
    expect(token).toMatchObject({ ownerId: 'alice', status: 'owned', createdAt: 1 })
  })

  test('does not synthesize legacy market tokens from migrated availability', async () => {
    await metamarketPrimary.ensureItemState({
      itemId: 'legacy_market_item',
      collectionId: 'keys',
      supply: 5,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    })

    await expect(metamarketPrimary.popMarketToken('legacy_market_item')).resolves.toBe(null)
  })

  test('does not fall back to another owned token when requested token is invalid', async () => {
    await metamarketPrimary.setUserItemCount('alice', 'skin_1', 1)
    await metamarketPrimary.writeToken({
      tokenId: 'token_1',
      serial: 'MM-SK-000000001-L7',
      itemId: 'skin_1',
      collectionId: 'skins',
      ownerId: 'alice',
      status: 'owned',
      createdAt: 1,
      updatedAt: 1,
    })

    await expect(metamarketPrimary.selectUserToken('alice', 'skin_1', 'missing_token')).resolves.toBe(null)
  })

  test('does not expose synthesized legacy owned tokens from migrated ownership counts', async () => {
    await metamarketPrimary.ensureItemState({
      itemId: 'legacy_owned_item',
      collectionId: 'keys',
      supply: 5,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    })
    await metamarketPrimary.setUserItemCount('alice', 'legacy_owned_item', 1)

    const token = await metamarketPrimary.selectUserToken('alice', 'legacy_owned_item')
    expect(token).toBe(null)
  })

  test('does not list phantom owned collection entries without a real or ledger-repairable token', async () => {
    const item = {
      itemId: 'phantom_owned_item',
      collectionId: 'keys',
      supply: 5,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    }
    await metamarketPrimary.ensureItemState(item)
    await metamarketPrimary.setUserItemCount('alice', item.itemId, 1)

    const page = await metamarketPrimary.listOwnedItems('alice', {
      getItem: (id) => (id === item.itemId ? item : null),
    })

    expect(page.rows).toEqual([])
    expect(page.totalUniqueItems).toBe(0)
    await expect(metamarketPrimary.getUserItemCount('alice', item.itemId)).resolves.toBe(0)
  })

  test('repairs a missing owned token only from the latest token ledger event', async () => {
    await metamarketPrimary.ensureItemState({
      itemId: 'ledger_owned_item',
      collectionId: 'keys',
      supply: 5,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    })
    await metamarketPrimary.setUserItemCount('alice', 'ledger_owned_item', 1)
    await metamarketPrimary.appendMarketEvent({
      txId: 'tx_buy_ledger_token',
      type: 'BUY',
      itemId: 'ledger_owned_item',
      actorId: 'alice',
      fromOwnerId: 'MARKET',
      toOwnerId: 'alice',
      tokenId: 'ledger_token_1',
      tokenIds: ['ledger_token_1'],
      serial: 'MM-LEDGER-000000001-L7',
      serials: ['MM-LEDGER-000000001-L7'],
      quantity: 1,
      createdAt: 100,
    })

    await expect(metamarketPrimary.selectUserToken('alice', 'ledger_owned_item')).resolves.toMatchObject({
      tokenId: 'ledger_token_1',
      ownerId: 'alice',
      itemId: 'ledger_owned_item',
      status: 'owned',
      repairOnly: false,
      hiddenFromUi: false,
    })
    await expect(metamarketPrimary.readToken('ledger_token_1')).resolves.toMatchObject({
      collectionId: 'keys',
      repairedFromEventLedger: true,
    })
  })

  test('does not repair a token when the latest ledger event moved it away', async () => {
    await metamarketPrimary.ensureItemState({
      itemId: 'ledger_sold_item',
      collectionId: 'keys',
      supply: 5,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    })
    await metamarketPrimary.setUserItemCount('alice', 'ledger_sold_item', 1)
    await metamarketPrimary.appendMarketEvent({
      txId: 'tx_buy_sold_token',
      type: 'BUY',
      itemId: 'ledger_sold_item',
      actorId: 'alice',
      fromOwnerId: 'MARKET',
      toOwnerId: 'alice',
      tokenId: 'sold_token_1',
      tokenIds: ['sold_token_1'],
      serial: 'MM-LEDGER-000000002-L7',
      serials: ['MM-LEDGER-000000002-L7'],
      quantity: 1,
      createdAt: 100,
    })
    await metamarketPrimary.appendMarketEvent({
      txId: 'tx_sell_sold_token',
      type: 'SELL',
      itemId: 'ledger_sold_item',
      actorId: 'alice',
      fromOwnerId: 'alice',
      toOwnerId: 'MARKET',
      tokenId: 'sold_token_1',
      tokenIds: ['sold_token_1'],
      serial: 'MM-LEDGER-000000002-L7',
      serials: ['MM-LEDGER-000000002-L7'],
      quantity: 1,
      createdAt: 200,
    })

    await expect(metamarketPrimary.selectUserToken('alice', 'ledger_sold_item')).resolves.toBe(null)
  })

  test('moves real MetaMarket tokens between market and users instead of stub-success', async () => {
    await metamarketPrimary.writeToken({
      tokenId: 'move_token',
      serial: 'MM-MV-000000001-L7',
      itemId: 'move_item',
      collectionId: 'skins',
      ownerId: 'MARKET',
      status: 'market',
      createdAt: 1,
      updatedAt: 1,
    })

    await expect(metamarketPrimary.addTokenToUser('alice', 'move_item', 'move_token', 2)).resolves.toBe(true)
    await expect(metamarketPrimary.readToken('move_token')).resolves.toMatchObject({
      ownerId: 'alice',
      status: 'owned',
      hiddenFromUi: false,
      repairOnly: false,
    })

    await expect(metamarketPrimary.removeTokenFromUser('alice', 'move_item', 'move_token')).resolves.toBe(true)
    await expect(metamarketPrimary.addTokenToMarket('move_item', 'move_token', 3)).resolves.toBe(true)
    await expect(metamarketPrimary.readToken('move_token')).resolves.toMatchObject({
      ownerId: 'MARKET',
      status: 'market',
      hiddenFromUi: false,
      repairOnly: false,
    })
  })

  test('bulk read helpers collapse item-state and ownership N+1 reads without changing authoritative values', async () => {
    const items = Array.from({ length: 32 }, (_, index) => ({
      itemId: `bulk_item_${index + 1}`,
      collectionId: 'bulk',
      catalogVersion: 'v1',
      assetVersion: 'a1',
      supply: 100 + index,
      priceMicro: 1_000_000 + index,
      sellRateBps: 9700,
      scarcityPriceBps: 0,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    }))

    for (const item of items) {
      await metamarketPrimary.ensureItemState(item)
      await memoryDb.collection('metamarket_user_items').updateOne(
        { _id: `alice:${item.itemId}` },
        { $set: { userId: 'alice', itemId: item.itemId, count: (item.supply % 3) + 1, updatedAt: 1 } },
        { upsert: true },
      )
    }

    const stateCollection = memoryDb.collection('metamarket_item_states')
    const ownershipCollection = memoryDb.collection('metamarket_user_items')
    Object.assign(stateCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })
    Object.assign(ownershipCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })

    const stateMap = await metamarketPrimary.ensureItemStates(items)
    expect(stateMap.size).toBe(items.length)
    expect(stateMap.get('bulk_item_1')).toMatchObject({ totalSupply: 100, marketAvailable: 100, priceMicro: 1_000_000 })
    expect(stateMap.get('bulk_item_32')).toMatchObject({ totalSupply: 131, marketAvailable: 131, priceMicro: 1_000_031 })
    expect(stateCollection.metrics.find).toBe(1)
    expect(stateCollection.metrics.findOne).toBe(0)
    expect(stateCollection.metrics.bulkWrite).toBe(0)

    const counts = await metamarketPrimary.getUserItemCounts('alice', items.map((item) => item.itemId))
    expect(counts.size).toBe(items.length)
    for (const item of items) {
      expect(counts.get(item.itemId)).toBe((item.supply % 3) + 1)
    }
    expect(ownershipCollection.metrics.find).toBe(1)
    expect(ownershipCollection.metrics.findOne).toBe(0)
  })

  test('bulk item-state refresh keeps sold inventory unavailable while updating catalog fields', async () => {
    const original = {
      itemId: 'bulk_inventory_safe',
      collectionId: 'skins',
      catalogVersion: 'v1',
      assetVersion: 'a1',
      supply: 10,
      priceMicro: 1_000_000,
      sellRateBps: 9700,
      scarcityPriceBps: 0,
      active: true,
      buyEnabled: true,
      sellEnabled: true,
      giftEnabled: true,
    }
    await metamarketPrimary.ensureItemState(original)
    await metamarketPrimary.writeItemState(original.itemId, { marketAvailable: 6 })

    const updated = { ...original, catalogVersion: 'v2', assetVersion: 'a2', supply: 14, priceMicro: 1_500_000 }
    const stateMap = await metamarketPrimary.ensureItemStates([updated])
    expect(stateMap.get(original.itemId)).toMatchObject({
      catalogVersion: 'v2',
      assetVersion: 'a2',
      totalSupply: 14,
      marketAvailable: 10,
      priceMicro: 1_500_000,
    })
  })

  test('owned collection fast path avoids ledger repair reads when physical token coverage already matches', async () => {
    const item = { itemId: 'fast_owned_item', collectionId: 'proof', sort: 1 }
    await memoryDb.collection('metamarket_user_items').updateOne(
      { _id: `alice:${item.itemId}` },
      { $set: { userId: 'alice', itemId: item.itemId, count: 2, updatedAt: 1 } },
      { upsert: true },
    )
    for (const tokenId of ['fast_token_1', 'fast_token_2']) {
      await memoryDb.collection('metamarket_tokens').updateOne(
        { _id: tokenId },
        { $set: { tokenId, ownerId: 'alice', itemId: item.itemId, status: 'owned', updatedAt: 1 } },
        { upsert: true },
      )
    }

    const indexCollection = memoryDb.collection('metamarket_event_indexes')
    const eventCollection = memoryDb.collection('metamarket_events')
    Object.assign(indexCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })
    Object.assign(eventCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })

    const page = await metamarketPrimary.listOwnedItems('alice', {
      limit: 10,
      getItem: (id) => (id === item.itemId ? item : null),
    })

    expect(page.rows).toEqual([{ itemId: item.itemId, count: 2 }])
    expect(indexCollection.metrics.find).toBe(0)
    expect(eventCollection.metrics.find).toBe(0)
    expect(eventCollection.metrics.findOne).toBe(0)
  })

  test('history reads one bounded index page and bulk-hydrates event documents', async () => {
    for (let index = 1; index <= 24; index += 1) {
      const txId = `bulk_history_${String(index).padStart(2, '0')}`
      await memoryDb.collection('metamarket_events').updateOne(
        { _id: txId },
        { $set: { txId, type: 'BUY', actorId: 'alice', toOwnerId: 'alice', itemId: 'history_item', createdAt: index } },
        { upsert: true },
      )
      await memoryDb.collection('metamarket_event_indexes').updateOne(
        { _id: `user:alice:${txId}` },
        { $set: { indexType: 'user_events', userId: 'alice', txId, score: index, createdAt: index } },
        { upsert: true },
      )
    }

    const indexCollection = memoryDb.collection('metamarket_event_indexes')
    const eventCollection = memoryDb.collection('metamarket_events')
    Object.assign(indexCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })
    Object.assign(eventCollection.metrics, { find: 0, findOne: 0, updateOne: 0, bulkWrite: 0, countDocuments: 0 })

    const page = await metamarketPrimary.listHistory(
      { indexType: 'user_events', userId: 'alice' },
      { limit: 10, encodeCursor: ({ offset }) => `offset:${offset}` },
    )

    expect(page.events).toHaveLength(10)
    expect(page.events[0]).toMatchObject({ txId: 'bulk_history_24' })
    expect(page.events[9]).toMatchObject({ txId: 'bulk_history_15' })
    expect(page.hasMore).toBe(true)
    expect(page.nextCursor).toBe('offset:10')
    expect(indexCollection.metrics.find).toBe(1)
    expect(indexCollection.metrics.countDocuments).toBe(0)
    expect(eventCollection.metrics.find).toBe(1)
    expect(eventCollection.metrics.findOne).toBe(0)
  })

})
