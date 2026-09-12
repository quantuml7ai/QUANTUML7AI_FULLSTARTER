import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)

function valueAt(row, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], row)
}

function matches(row, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((clause) => matches(row, clause))
    const actual = valueAt(row, key)
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
    }
    return String(actual) === String(expected)
  })
}

function memoryDb() {
  const collections = new Map()
  const collection = (name) => {
    if (collections.has(name)) return collections.get(name)
    const rows = []
    const value = {
      rows,
      async createIndex() {},
      async insertOne(doc) { rows.push({ ...doc }); return { insertedId: doc._id } },
      find(filter = {}) {
        let list = rows.filter((row) => matches(row, filter))
        return {
          sort(spec = {}) {
            const entries = Object.entries(spec)
            list.sort((a, b) => {
              for (const [key, direction] of entries) {
                const av = valueAt(a, key)
                const bv = valueAt(b, key)
                if (av === bv) continue
                return direction < 0 ? (av > bv ? -1 : 1) : (av > bv ? 1 : -1)
              }
              return 0
            })
            return this
          },
          limit(size) { list = list.slice(0, Number(size) || list.length); return this },
          async toArray() { return list.map((row) => ({ ...row })) },
        }
      },
      async updateOne(filter, update, options = {}) {
        let row = rows.find((candidate) => matches(candidate, filter))
        if (!row) {
          if (!options.upsert) return { matchedCount: 0, modifiedCount: 0 }
          row = { _id: filter._id || `auto:${rows.length + 1}`, ...(update.$setOnInsert || {}) }
          rows.push(row)
        }
        Object.assign(row, update.$set || {})
        return { matchedCount: 1, modifiedCount: 1 }
      },
      async deleteOne(filter) {
        const index = rows.findIndex((row) => matches(row, filter))
        if (index >= 0) rows.splice(index, 1)
        return { deletedCount: index >= 0 ? 1 : 0 }
      },
    }
    collections.set(name, value)
    return value
  }
  return { collection }
}

describe('BattleCoin storage cutover status', () => {
  afterEach(() => {
    const battlecoinPrimary = require(resolve(process.cwd(), 'lib/mongo/battlecoin-primary.cjs'))
    battlecoinPrimary.__setTestAliasResolver?.(null)
    battlecoinPrimary.__setTestDb(null)
  })

  test('documents the approved Mongo Primary adapter contract', () => {
    const mongoBattlecoinAdapter = resolve(process.cwd(), 'lib/mongo/battlecoin-primary.cjs')

    expect(existsSync(mongoBattlecoinAdapter)).toBe(true)

    const battlecoinPrimary = require(mongoBattlecoinAdapter)
    expect(battlecoinPrimary).toMatchObject({
      readState: expect.any(Function),
      readOpenOrder: expect.any(Function),
      readHistory: expect.any(Function),
      openOrderWithStakeDebit: expect.any(Function),
      settleOrderWithQcoinReturn: expect.any(Function),
    })
    expect(battlecoinPrimary.constants).toMatchObject({
      HISTORY_MAIN: 'battlecoin_order_history',
      HISTORY_LEGACY: 'battlecoin_order_histories',
      COUNTERS_MAIN: 'battlecoin_counters',
      COUNTERS_LEGACY: 'battlecoin_order_counters',
    })
  })

  test('reads legacy alias orders and reuses the active physical row for canonical writes', async () => {
    const battlecoinPrimary = require(resolve(process.cwd(), 'lib/mongo/battlecoin-primary.cjs'))
    const database = memoryDb()
    const canonical = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const legacy = '777001'
    battlecoinPrimary.__setTestDb(database)
    battlecoinPrimary.__setTestAliasResolver(async () => ({ canonical, aliases: [legacy, `telegram:${legacy}`] }))

    await database.collection('battlecoin_active_orders').insertOne({
      _id: `active:${legacy}`,
      userId: legacy,
      uid: legacy,
      accountId: legacy,
      status: 'OPEN',
      orderId: 41,
      updatedAt: '2026-01-01T00:00:00.000Z',
      order: { orderId: 41, status: 'OPEN', symbol: 'BTCUSDT', openedAt: 10 },
    })
    await database.collection('battlecoin_order_histories').insertOne({
      _id: `history:${legacy}:40`,
      userId: legacy,
      orderId: 40,
      order: { orderId: 40, status: 'SETTLED', symbol: 'ETHUSDT', closedAt: 9 },
    })

    await expect(battlecoinPrimary.readOpenOrder(canonical)).resolves.toMatchObject({ orderId: 41 })
    await expect(battlecoinPrimary.readHistory(canonical)).resolves.toEqual([
      expect.objectContaining({ orderId: 40, status: 'SETTLED' }),
    ])

    await battlecoinPrimary.writeActiveOrder(canonical, {
      orderId: 41,
      status: 'OPEN',
      symbol: 'BTCUSDT',
      openedAt: 10,
      leverage: 5,
    })

    const activeRows = database.collection('battlecoin_active_orders').rows
    expect(activeRows).toHaveLength(1)
    expect(activeRows[0]).toMatchObject({
      _id: `active:${legacy}`,
      userId: canonical,
      uid: canonical,
      accountId: canonical,
      orderId: 41,
    })
  })

  test('treats a repeated settle for the same durable order as idempotent', async () => {
    const battlecoinPrimary = require(resolve(process.cwd(), 'lib/mongo/battlecoin-primary.cjs'))
    const database = memoryDb()
    const uid = 'battle-settle-proof'
    battlecoinPrimary.__setTestDb(database)
    battlecoinPrimary.__setTestAliasResolver(async () => ({ canonical: uid, aliases: [] }))

    await database.collection('battlecoin_active_orders').insertOne({
      _id: `active:${uid}`,
      userId: uid,
      uid,
      accountId: uid,
      status: 'SETTLED',
      orderId: 91,
      updatedAt: '2026-08-31T12:00:00.000Z',
      order: { orderId: 91, status: 'SETTLED', symbol: 'BTCUSDT', pnl: 0.25, closedAt: 100 },
    })
    await database.collection('qcoin_accounts').insertOne({
      _id: `account:${uid}`,
      uid,
      userId: uid,
      accountId: uid,
      balance: 12.5,
    })

    await expect(battlecoinPrimary.settleOrderWithQcoinReturn({
      uid,
      expectedOrderId: 91,
      closePrice: 0,
    })).resolves.toMatchObject({
      ok: true,
      duplicate: true,
      balance: 12.5,
      order: { orderId: 91, status: 'SETTLED' },
    })

    await expect(battlecoinPrimary.settleOrderWithQcoinReturn({
      uid,
      expectedOrderId: 90,
      closePrice: 0,
    })).resolves.toMatchObject({ ok: false, status: 400 })
  })
})
