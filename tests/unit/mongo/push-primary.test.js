import { createRequire } from 'node:module'
import { beforeEach, describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const pushPrimary = require('../../../lib/mongo/push-primary.cjs')

function clone(value) {
  return structuredClone(value)
}

function getByPath(row, path) {
  return String(path || '').split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), row)
}

function matches(row, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((part) => matches(row, part))
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or') continue
    const actual = getByPath(row, key)
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ('$in' in expected) {
        if (!expected.$in.includes(actual)) return false
        continue
      }
      if ('$gt' in expected) {
        if (!(actual > expected.$gt)) return false
        continue
      }
    }
    if (actual !== expected) return false
  }
  return true
}

function compareRows(a, b, sort = {}) {
  for (const [key, dir] of Object.entries(sort)) {
    const av = getByPath(a, key)
    const bv = getByPath(b, key)
    if (av === bv) continue
    return av > bv ? Number(dir) : -Number(dir)
  }
  return 0
}

class MemoryCursor {
  constructor(rows) {
    this.rows = rows
    this.sortSpec = null
    this.limitValue = 0
  }
  sort(spec) {
    this.sortSpec = spec
    return this
  }
  limit(value) {
    this.limitValue = Number(value) || 0
    return this
  }
  async toArray() {
    let rows = this.rows.slice()
    if (this.sortSpec) rows = rows.sort((a, b) => compareRows(a, b, this.sortSpec))
    if (this.limitValue > 0) rows = rows.slice(0, this.limitValue)
    return clone(rows)
  }
}

class MemoryCollection {
  constructor() {
    this.rows = []
  }
  async createIndex() {}
  find(filter) {
    return new MemoryCursor(this.rows.filter((row) => matches(row, filter)))
  }
  async findOne(filter) {
    const row = this.rows.find((item) => matches(item, filter))
    return row ? clone(row) : null
  }
  applyUpdate(row, update = {}, insert = false) {
    const next = { ...row }
    if (insert) Object.assign(next, update.$setOnInsert || {})
    Object.assign(next, update.$set || {})
    if (update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) {
        next[key] = Number(next[key] || 0) + Number(value || 0)
      }
    }
    return next
  }
  async updateOne(filter, update, options = {}) {
    const index = this.rows.findIndex((row) => matches(row, filter))
    if (index < 0 && options.upsert) {
      this.rows.push(clone(this.applyUpdate({}, update, true)))
      return { upsertedCount: 1, matchedCount: 0, modifiedCount: 0 }
    }
    if (index < 0) return { matchedCount: 0, modifiedCount: 0 }
    this.rows[index] = clone(this.applyUpdate(this.rows[index], update, false))
    return { matchedCount: 1, modifiedCount: 1 }
  }
  async updateMany(filter, update) {
    let modifiedCount = 0
    this.rows = this.rows.map((row) => {
      if (!matches(row, filter)) return row
      modifiedCount += 1
      return clone(this.applyUpdate(row, update, false))
    })
    return { modifiedCount, matchedCount: modifiedCount }
  }
  async deleteOne(filter) {
    const index = this.rows.findIndex((row) => matches(row, filter))
    if (index < 0) return { deletedCount: 0 }
    this.rows.splice(index, 1)
    return { deletedCount: 1 }
  }
}

function createDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, new MemoryCollection())
      return collections.get(name)
    },
  }
}

function makeSubscription(id) {
  return {
    endpoint: `https://push.example.test/${id}`,
    expirationTime: null,
    keys: {
      p256dh: `p256dh-${id}`,
      auth: `auth-${id}`,
    },
  }
}

describe('Push Mongo primary adapter', () => {
  let db

  beforeEach(() => {
    db = createDb()
    pushPrimary.__setTestDb(db)
  })

  test('stores canonical notification state and increments version', async () => {
    const first = await pushPrimary.writeNotificationState('wallet:one', {
      counts: { messenger_messages: 2 },
      readItems: { messenger_messages: ['m1'] },
      dedupe: { 'messenger_messages:x': Date.now() + 1000 },
    })
    const second = await pushPrimary.writeNotificationState('wallet:one', {
      counts: { messenger_messages: 1, system: 3 },
      readItems: { messenger_messages: ['m1', 'm2'] },
    })
    const stored = await pushPrimary.readNotificationState('wallet:one')

    expect(first.version).toBe(1)
    expect(second.version).toBe(2)
    expect(stored.storagePrimary).toBe('mongo')
    expect(stored.redisRole).toBe('accelerator-only')
    expect(stored.totalCount).toBe(4)
    expect(stored.readItems.messenger_messages).toEqual(['m1', 'm2'])
  })

  test('stores subscriptions in Mongo and keeps only newest active devices', async () => {
    for (let index = 0; index < 10; index += 1) {
      await pushPrimary.savePushSubscription(
        'wallet:one',
        `sub-${index}`,
        makeSubscription(index),
        { lang: 'uk', nativeShell: index % 2 === 0 },
        { maxSubscriptions: 8 },
      )
    }

    const rows = await pushPrimary.listPushSubscriptions('wallet:one', { limit: 20 })
    expect(rows).toHaveLength(8)
    expect(rows.map((row) => row.id)).toContain('sub-9')
    expect(rows.map((row) => row.id)).not.toContain('sub-0')

    await pushPrimary.removePushSubscription('wallet:one', 'sub-9')
    const afterRemove = await pushPrimary.listPushSubscriptions('wallet:one', { limit: 20 })
    expect(afterRemove.map((row) => row.id)).not.toContain('sub-9')
  })
})
