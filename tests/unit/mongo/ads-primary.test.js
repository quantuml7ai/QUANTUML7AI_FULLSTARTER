import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import adsPrimaryModule from '../../../lib/mongo/ads-primary.cjs'

const adsPrimary = adsPrimaryModule?.default || adsPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function setValue(doc, key, value) {
  const parts = String(key).split('.')
  let target = doc
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    if (!target[part] || typeof target[part] !== 'object') target[part] = {}
    target = target[part]
  }
  target[parts[parts.length - 1]] = value
}

function matches(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, expected]) => String(getValue(doc, key)) === String(expected))
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (isInsert && update.$setOnInsert) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) setValue(doc, key, value)
  }
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) setValue(doc, key, value)
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) setValue(doc, key, Number(getValue(doc, key) || 0) + Number(value || 0))
  }
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
    async findOneAndUpdate(filter, update, options = {}) {
      await this.updateOne(filter, update, { upsert: options.upsert })
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
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

describe('ads Mongo primary adapter', () => {
  beforeEach(() => {
    adsPrimary.__setTestDb(createMemoryDb())
  })

  afterEach(() => {
    adsPrimary.__setTestDb(null)
  })

  test('stores ads key-value, sets, counters and package quota in Mongo', async () => {
    await adsPrimary.setJSON('ads:package:1', { id: '1', usedCampaigns: 0, maxCampaigns: 2 })
    await expect(adsPrimary.getJSON('ads:package:1')).resolves.toMatchObject({ id: '1' })

    await expect(adsPrimary.incr('ads:seq:campaign')).resolves.toBe(1)
    await expect(adsPrimary.incr('ads:seq:campaign')).resolves.toBe(2)

    await expect(adsPrimary.sadd('ads:campaigns:all', '1')).resolves.toBe(1)
    await expect(adsPrimary.sadd('ads:campaigns:all', '1')).resolves.toBe(0)
    await expect(adsPrimary.smembers('ads:campaigns:all')).resolves.toEqual(['1'])

    await expect(adsPrimary.updatePackageUsedCampaigns('ads:package:1', 2)).resolves.toMatchObject({ ok: true, used: 2 })
    await expect(adsPrimary.updatePackageUsedCampaigns('ads:package:1', 1)).resolves.toMatchObject({ ok: false, error: 'LIMIT_REACHED' })
  })
})
