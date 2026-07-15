import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import referralPrimaryModule from '../../../lib/mongo/referral-primary.cjs'

const referralPrimary = referralPrimaryModule?.default || referralPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
  }
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

describe('referral Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    referralPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    referralPrimary.__setTestDb(null)
  })

  test('deduplicates invited friends by IP hash while preserving total clicks', async () => {
    const profile = await referralPrimary.getOrCreateProfile({
      uid: 'inviter',
      rewardQcoin: 0.1,
      makeCode: () => 'abc123',
    })

    expect(profile.code).toBe('abc123')
    await expect(referralPrimary.getUidByCode('abc123')).resolves.toBe('inviter')

    const first = await referralPrimary.recordHit({ uid: 'inviter', code: 'abc123', ip: '10.0.0.1' })
    const duplicate = await referralPrimary.recordHit({ uid: 'inviter', code: 'abc123', ip: '10.0.0.1' })
    const second = await referralPrimary.recordHit({ uid: 'inviter', code: 'abc123', ip: '10.0.0.2' })

    expect(first).toMatchObject({ isNewIp: true, invitedCount: 1 })
    expect(duplicate).toMatchObject({ isNewIp: false, invitedCount: 1 })
    expect(second).toMatchObject({ isNewIp: true, invitedCount: 2 })

    await expect(referralPrimary.readProfile('inviter')).resolves.toMatchObject({
      clicks_total: '3',
      unique_ips: '2',
      invited_count: '2',
    })
    expect(memoryDb.collection(referralPrimary.IPS).rows.size).toBe(2)
  })
})
