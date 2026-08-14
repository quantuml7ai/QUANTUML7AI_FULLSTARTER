import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import questPrimaryModule from '../../../lib/mongo/quest-primary.cjs'

const questPrimary = questPrimaryModule?.default || questPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
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
}

function createCursor(items) {
  let list = [...items]
  return {
    sort(spec = {}) {
      const [[key, dir] = []] = Object.entries(spec)
      if (key) {
        list.sort((a, b) => {
          const av = getValue(a, key)
          const bv = getValue(b, key)
          return dir < 0 ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
        })
      }
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
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || filter?.progressId || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    find(filter = {}) {
      return createCursor(Array.from(rows.values()).filter((row) => matches(row, filter)))
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

describe('quest Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    questPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    questPrimary.__setTestDb(null)
  })

  test('writes and reads quest progress as Mongo primary in the legacy-compatible shape', async () => {
    await questPrimary.writeProgress('alice', {
      'quest-1': { done: ['1', '2'], ts: 100, taskCount: 3, taskDelayMs: 15000 },
    })

    await expect(questPrimary.readProgress('alice')).resolves.toMatchObject({
      1: { done: ['1', '2'], ts: 100, taskCount: 3, taskDelayMs: 15000 },
    })

    const rows = memoryDb.collection('quest_progress').rows
    expect(rows.get('quest:progress:alice:1')).toMatchObject({
      progressId: 'quest:progress:alice:1',
      userId: 'alice',
      cardId: '1',
      sourceRedisKey: 'quest:progress:alice',
      storagePrimary: 'mongo',
      ql7QuestProgressMongoPrimary: true,
    })
  })

  test('keeps claimed state in Mongo progress without Redis claim storage', async () => {
    await questPrimary.writeCard('alice', '2', {
      done: ['1'],
      claimed: true,
      claimTs: 200,
      taskCount: 1,
    })

    await expect(questPrimary.readProgress('alice')).resolves.toMatchObject({
      2: { done: ['1'], claimed: true, claimTs: 200, taskCount: 1 },
    })
  })
})
