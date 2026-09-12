import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import subscriptionsPrimaryModule from '../../../lib/mongo/subscriptions-primary.cjs'

const subscriptionsPrimary = subscriptionsPrimaryModule?.default || subscriptionsPrimaryModule

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
  }
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, value]) => matchesValue(doc?.[key], value))
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (isInsert && update.$setOnInsert) Object.assign(doc, update.$setOnInsert)
  if (update.$set) Object.assign(doc, update.$set)
}

function createMemoryCollection() {
  const rows = new Map()
  const stats = { find: 0, findOne: 0 }
  return {
    rows,
    stats,
    async createIndex() { return 'ok' },
    async updateOne(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || update?.$setOnInsert?._id || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    async findOne(filter) {
      stats.findOne += 1
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    find(filter = {}) {
      stats.find += 1
      let list = Array.from(rows.values()).filter((row) => matches(row, filter))
      const cursor = {
        limit(n) { list = list.slice(0, Number(n) || list.length); return cursor },
        async toArray() { return list.map((row) => ({ ...row })) },
      }
      return cursor
    },
    async deleteOne(filter) {
      const item = Array.from(rows.entries()).find(([, row]) => matches(row, filter))
      if (item) rows.delete(item[0])
      return { deletedCount: item ? 1 : 0 }
    },
    async deleteMany(filter) {
      let deletedCount = 0
      for (const [key, row] of Array.from(rows.entries())) {
        if (!matches(row, filter)) continue
        rows.delete(key)
        deletedCount += 1
      }
      return { deletedCount }
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

describe('subscriptions Mongo primary repository', () => {
  beforeEach(() => {
    subscriptionsPrimary.__setTestDb(createMemoryDb())
  })

  afterEach(() => {
    subscriptionsPrimary.__setTestDb(null)
  })

  test('stores one canonical EIP-55 VIP entitlement and still reads lowercase legacy input', async () => {
    const checksum = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const lower = checksum.toLowerCase()
    const early = new Date(Date.now() + 1000).toISOString()
    const later = new Date(Date.now() + 2000).toISOString()

    await expect(subscriptionsPrimary.setVip(lower, later, { paymentId: 'pay-1' })).resolves.toMatchObject({ ok: true, until: later })
    await expect(subscriptionsPrimary.getVip(lower)).resolves.toBe(later)
    await expect(subscriptionsPrimary.getVip(checksum)).resolves.toBe(later)
    await expect(subscriptionsPrimary.setVip(checksum, early, { paymentId: 'pay-1' })).resolves.toMatchObject({ ok: true, duplicated: true })
    await expect(subscriptionsPrimary.setVip(checksum, early)).resolves.toMatchObject({ ok: true, until: later })

    await subscriptionsPrimary.clearVip(checksum, 'pay-1')
    await expect(subscriptionsPrimary.getVip(lower)).resolves.toBeNull()
  })

  test('reuses a touched legacy VIP row instead of creating a second canonical document', async () => {
    const checksum = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const lower = checksum.toLowerCase()
    const database = createMemoryDb()
    subscriptionsPrimary.__setTestDb(database)
    const until = new Date(Date.now() + 60_000).toISOString()

    await database.collection('vip_subscriptions').updateOne(
      { _id: `vip:${lower}` },
      { $set: { accountId: lower, untilISO: until, updatedAt: new Date().toISOString() } },
      { upsert: true },
    )

    await subscriptionsPrimary.setVip(checksum, until, { legacyAccountIds: [lower] })

    const rows = database.collection('vip_subscriptions').rows
    expect(rows.size).toBe(1)
    expect(rows.has(`vip:${lower}`)).toBe(true)
    expect(rows.has(`vip:${checksum}`)).toBe(false)
    expect(rows.get(`vip:${lower}`)).toMatchObject({ accountId: checksum })
  })

  test('bulk VIP reads choose the furthest entitlement across aliases in one Mongo query', async () => {
    const database = createMemoryDb()
    subscriptionsPrimary.__setTestDb(database)
    const legacy = 'tg:55112233'
    const canonical = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const other = '0x1111111111111111111111111111111111111111'
    const expired = new Date(Date.now() - 60_000).toISOString()
    const active = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const otherUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    await database.collection('vip_subscriptions').updateOne(
      { _id: `vip:${legacy}` },
      { $set: { accountId: legacy, untilISO: expired } },
      { upsert: true },
    )
    await database.collection('vip_subscriptions').updateOne(
      { _id: `vip:${canonical}` },
      { $set: { accountId: canonical, untilISO: active } },
      { upsert: true },
    )
    await database.collection('vip_subscriptions').updateOne(
      { _id: `vip:${other}` },
      { $set: { accountId: other, untilISO: otherUntil } },
      { upsert: true },
    )

    const collection = database.collection('vip_subscriptions')
    collection.stats.find = 0
    collection.stats.findOne = 0
    await expect(subscriptionsPrimary.getVipForIdentityIds([legacy, canonical])).resolves.toBe(active)
    expect(collection.stats.find).toBe(1)
    expect(collection.stats.findOne).toBe(0)

    collection.stats.find = 0
    await expect(subscriptionsPrimary.getVipMany([
      { key: 'person', ids: [legacy, canonical] },
      { key: 'other', ids: [other] },
    ])).resolves.toEqual({ person: active, other: otherUntil })
    expect(collection.stats.find).toBe(1)
  })

  test('VIP read failures stay unavailable instead of collapsing to not VIP', async () => {
    const database = createMemoryDb()
    subscriptionsPrimary.__setTestDb(database)
    const collection = database.collection('vip_subscriptions')
    collection.find = () => { throw new Error('vip_read_failed') }

    await expect(subscriptionsPrimary.getVip('tg:55112233')).rejects.toThrow('vip_read_failed')
  })


})
