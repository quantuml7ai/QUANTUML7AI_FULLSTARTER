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
  const uniqueFields = new Set()

  const duplicate = (field, value) => {
    const error = new Error(`E11000 duplicate key ${field}:${value}`)
    error.code = 11000
    error.keyPattern = { [field]: 1 }
    error.keyValue = { [field]: value }
    return error
  }

  const assertUnique = (candidate, currentId = '') => {
    for (const field of uniqueFields) {
      const value = candidate?.[field]
      if (value == null || value === '') continue
      const conflict = Array.from(rows.values()).find((row) => (
        String(row?._id || '') !== String(currentId || '') &&
        row?.[field] != null &&
        String(row[field]) === String(value)
      ))
      if (conflict) throw duplicate(field, value)
    }
  }
  
  return {
    rows,
    async createIndex(spec = {}, options = {}) {
      if (options.unique) Object.keys(spec).forEach((field) => uniqueFields.add(field))
      return 'ok'
    },
    async insertOne(input) {
      const doc = { ...input }
      if (rows.has(String(doc._id))) throw duplicate('_id', doc._id)
      assertUnique(doc)
      rows.set(String(doc._id), doc)
      return { insertedId: doc._id }
    },
    async updateOne(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || update?.$setOnInsert?._id || `auto:${rows.size + 1}`
        doc = { _id: id }
       }

      const next = { ...doc }
      applyUpdate(next, update, isInsert)
      assertUnique(next, isInsert ? '' : doc._id)
      rows.set(String(next._id), next)
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

  test('prefers an existing canonical referral profile when canonical and legacy physical rows coexist', async () => {
    const canonical = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const legacy = canonical.toLowerCase()
    const profiles = memoryDb.collection(referralPrimary.PROFILES)
    const codes = memoryDb.collection(referralPrimary.CODES)

    await profiles.updateOne(
      { _id: `user:${canonical}` },
      { $set: { uid: canonical, userId: canonical, code: 'canonical-code', clicks_total: '4', invited_count: '2' } },
      { upsert: true },
    )
    await profiles.updateOne(
      { _id: `user:${legacy}` },
      { $set: { uid: legacy, userId: legacy, code: 'legacy-code', clicks_total: '0', invited_count: '0' } },
      { upsert: true },
    )
    await codes.updateOne(
      { _id: 'code:canonical-code' },
      { $set: { code: 'canonical-code', uid: canonical, userId: canonical } },
      { upsert: true },
    )
    await codes.updateOne(
      { _id: 'code:legacy-code' },
      { $set: { code: 'legacy-code', uid: legacy, userId: legacy } },
      { upsert: true },
    )

    const profile = await referralPrimary.getOrCreateProfile({
      uid: canonical,
      legacyUids: [legacy, `wallet:${legacy}`],
      rewardQcoin: 0.1,
      makeCode: () => 'must-not-run',
    })

    expect(profile).toMatchObject({ uid: canonical, code: 'canonical-code', clicks_total: '4', invited_count: '2' })
    expect(profiles.rows.size).toBe(2)
    expect(profiles.rows.get(`user:${canonical}`)).toMatchObject({ uid: canonical, code: 'canonical-code' })
    expect(profiles.rows.get(`user:${legacy}`)).toMatchObject({ uid: legacy, code: 'legacy-code' })
    expect(codes.rows.get('code:canonical-code')).toMatchObject({
      uid: canonical,
      userId: canonical,
      ownerKey: canonical,
    })

    await referralPrimary.recordHit({
      uid: canonical,
      legacyUids: [legacy],
      code: 'legacy-code',
      ip: '10.0.0.44',
    })
    expect(profiles.rows.get(`user:${canonical}`)).toMatchObject({
      uid: canonical,
      code: 'canonical-code',
      clicks_total: '5',
      invited_count: '3',
    })
  })

  test('concurrent fresh referral profile creation converges on one canonical profile and one new code', async () => {
    const canonical = '0x4ACeEFF7c7a6A767b89e290B9E4c76ef889F9090'
    let sequence = 0
    const makeCode = () => `race-code-${++sequence}`
    await memoryDb.collection(referralPrimary.CODES).createIndex({ ownerKey: 1 }, { unique: true, sparse: true })

    const [first, second] = await Promise.all([
      referralPrimary.getOrCreateProfile({ uid: canonical, rewardQcoin: 0.1, makeCode }),
      referralPrimary.getOrCreateProfile({ uid: canonical, rewardQcoin: 0.1, makeCode }),
    ])

    expect(first.code).toBe(second.code)
    const profiles = memoryDb.collection(referralPrimary.PROFILES)
    const codes = memoryDb.collection(referralPrimary.CODES)
    expect(profiles.rows.size).toBe(1)
    expect(Array.from(codes.rows.values()).filter((row) => row.ownerKey === canonical)).toHaveLength(1)
    expect(profiles.rows.get(`user:${canonical}`)).toMatchObject({ uid: canonical, userId: canonical, code: first.code })
  })
  test('reuses a legacy lowercase wallet referral profile without changing its code or counters', async () => {
    const canonical = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const legacy = canonical.toLowerCase()
    const profiles = memoryDb.collection(referralPrimary.PROFILES)
    const codes = memoryDb.collection(referralPrimary.CODES)

    await profiles.updateOne(
      { _id: `user:${legacy}` },
      { $set: {
        uid: legacy,
        userId: legacy,
        code: 'legacy-code',
        clicks_total: '4',
        unique_ips: '2',
        invited_count: '2',
        created_at: '2026-01-01T00:00:00.000Z',
      } },
      { upsert: true },
    )
    await codes.updateOne(
      { _id: 'code:legacy-code' },
      { $set: { code: 'legacy-code', uid: legacy, userId: legacy } },
      { upsert: true },
    )

    const profile = await referralPrimary.getOrCreateProfile({
      uid: canonical,
      legacyUids: [legacy],
      rewardQcoin: 0.1,
      makeCode: () => 'must-not-replace',
    })
    expect(profile).toMatchObject({ code: 'legacy-code', clicks_total: '4', invited_count: '2' })

    await referralPrimary.recordHit({
      uid: canonical,
      legacyUids: [legacy],
      code: 'legacy-code',
      ip: '10.0.0.9',
    })

    expect(profiles.rows.size).toBe(1)
    expect(profiles.rows.has(`user:${canonical}`)).toBe(false)
    expect(profiles.rows.get(`user:${legacy}`)).toMatchObject({
      uid: canonical,
      userId: canonical,
      code: 'legacy-code',
      clicks_total: '5',
      invited_count: '3',
    })
    expect(codes.rows.get('code:legacy-code')).toMatchObject({
      uid: canonical,
      userId: canonical,
      code: 'legacy-code',
    })
  })
})
