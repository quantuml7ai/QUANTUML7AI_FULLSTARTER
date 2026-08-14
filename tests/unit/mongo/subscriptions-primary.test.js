import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import subscriptionsPrimaryModule from '../../../lib/mongo/subscriptions-primary.cjs'

const subscriptionsPrimary = subscriptionsPrimaryModule?.default || subscriptionsPrimaryModule

function matches(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, value]) => String(doc?.[key]) === String(value))
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (isInsert && update.$setOnInsert) Object.assign(doc, update.$setOnInsert)
  if (update.$set) Object.assign(doc, update.$set)
}

function createMemoryCollection() {
  const rows = new Map()
  return {
    rows,
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
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async deleteOne(filter) {
      const item = Array.from(rows.entries()).find(([, row]) => matches(row, filter))
      if (item) rows.delete(item[0])
      return { deletedCount: item ? 1 : 0 }
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

  test('stores VIP entitlement and payment idempotency in Mongo', async () => {
    const early = new Date(Date.now() + 1000).toISOString()
    const later = new Date(Date.now() + 2000).toISOString()

    await expect(subscriptionsPrimary.setVip('Alice', later, { paymentId: 'pay-1' })).resolves.toMatchObject({ ok: true, until: later })
    await expect(subscriptionsPrimary.getVip('alice')).resolves.toBe(later)
    await expect(subscriptionsPrimary.setVip('alice', early, { paymentId: 'pay-1' })).resolves.toMatchObject({ ok: true, duplicated: true })
    await expect(subscriptionsPrimary.setVip('alice', early)).resolves.toMatchObject({ ok: true, until: later })

    await subscriptionsPrimary.clearVip('alice', 'pay-1')
    await expect(subscriptionsPrimary.getVip('alice')).resolves.toBeNull()
  })
})
