import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import academyPrimaryModule from '../../../lib/mongo/academy-primary.cjs'

const academyPrimary = academyPrimaryModule?.default || academyPrimaryModule

function valueAt(doc, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], doc)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && '$in' in expected) {
    return expected.$in.map(String).includes(String(actual))
  }
  if (Array.isArray(actual)) return actual.map(String).includes(String(expected))
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  const entries = Object.entries(filter)
  return entries.every(([key, expected]) => {
    if (key === '$or') return expected.some((clause) => matches(doc, clause))
    return matchesValue(valueAt(doc, key), expected)
  })
}

function cursor(rows) {
  let list = [...rows]
  return {
    sort(spec = {}) {
      const entries = Object.entries(spec)
      list.sort((a, b) => {
        for (const [key, direction] of entries) {
          const diff = Number(valueAt(a, key) || 0) - Number(valueAt(b, key) || 0)
          if (diff) return direction < 0 ? -diff : diff
        }
        return 0
      })
      return this
    },
    limit(size) { list = list.slice(0, Number(size) || list.length); return this },
    async toArray() { return list.map((row) => ({ ...row })) },
  }
}

function memoryCollection() {
  const rows = new Map()
  return {
    rows,
    async createIndex() { return 'ok' },
    find(filter = {}) { return cursor(Array.from(rows.values()).filter((row) => matches(row, filter))) },
    async findOne(filter = {}) { return Array.from(rows.values()).find((row) => matches(row, filter)) || null },
    async updateOne(filter, update, options = {}) {
      let row = Array.from(rows.values()).find((candidate) => matches(candidate, filter))
      if (!row) {
        if (!options.upsert) return { matchedCount: 0 }
        row = { _id: filter._id || `auto:${rows.size + 1}` }
        rows.set(String(row._id), row)
        Object.assign(row, update.$setOnInsert || {})
      }
      Object.assign(row, update.$set || {})
      return { matchedCount: 1, modifiedCount: 1 }
    },
  }
}

function memoryDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, memoryCollection())
      return collections.get(name)
    },
  }
}

describe('academy Mongo primary identity compatibility', () => {
  let database

  beforeEach(() => {
    database = memoryDb()
    academyPrimary.__setTestDb(database)
  })

  afterEach(() => academyPrimary.__setTestDb(null))

  test('reads and updates one legacy exam row through its canonical EIP-55 owner', async () => {
    const canonical = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const legacy = canonical.toLowerCase()
    const collection = database.collection(academyPrimary.COLLECTION)
    const legacyDoc = academyPrimary.buildDoc({
      userId: legacy,
      blockId: '7',
      state: { done: 3, correct: 2, cooldownUntil: 10, updatedAt: 20 },
    })
    await collection.updateOne({ _id: legacyDoc._id }, { $set: legacyDoc }, { upsert: true })

    await expect(academyPrimary.readExamState({
      userId: canonical,
      blockId: '7',
      aliases: [legacy],
    })).resolves.toMatchObject({ done: 3, correct: 2 })

    await academyPrimary.writeExamState({
      userId: canonical,
      blockId: '7',
      aliases: [legacy],
      state: { done: 4, correct: 3, cooldownUntil: 30, updatedAt: 40 },
    })

    expect(collection.rows.size).toBe(1)
    expect(collection.rows.has(`academy:exam:${canonical}:7`)).toBe(false)
    expect(collection.rows.get(`academy:exam:${legacy}:7`)).toMatchObject({
      examId: `academy:exam:${canonical}:7`,
      userId: canonical,
      blockId: '7',
      done: 4,
      correct: 3,
    })
  })
})
