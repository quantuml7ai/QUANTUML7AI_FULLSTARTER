import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import metamarketPrimaryModule from '../../../lib/mongo/metamarket-primary.cjs'
import qcoinPrimaryModule from '../../../lib/mongo/qcoin-primary.cjs'

const metamarketPrimary = metamarketPrimaryModule?.default || metamarketPrimaryModule
const qcoinPrimary = qcoinPrimaryModule?.default || qcoinPrimaryModule

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
  return {
    rows,
    async createIndex() { return 'ok' },
    async updateOne(filter, update, options = {}) {
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
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async deleteOne(filter) {
      const doc = Array.from(rows.values()).find((row) => matches(row, filter))
      if (doc) rows.delete(String(doc._id))
      return { deletedCount: doc ? 1 : 0 }
    },
    find(filter = {}) {
      return createCursor(Array.from(rows.values()).filter((row) => matches(row, filter)))
    },
    async countDocuments(filter = {}) {
      return Array.from(rows.values()).filter((row) => matches(row, filter)).length
    },
    async bulkWrite(ops = []) {
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
    metamarketPrimary.__setTestDb(null)
    qcoinPrimary.__setTestDb(null)
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
})
