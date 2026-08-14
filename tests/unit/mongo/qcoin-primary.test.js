import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import qcoinPrimaryModule from '../../../lib/mongo/qcoin-primary.cjs'

const qcoinPrimary = qcoinPrimaryModule?.default || qcoinPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual))
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
    if ('$ne' in expected) return String(actual) !== String(expected.$ne)
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
        const id = filter?._id || `auto:${rows.size + 1}`
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
    find(filter = {}) {
      let limitValue = Infinity
      const cursor = {
        limit(n) { limitValue = Number(n || 0) > 0 ? Number(n) : Infinity; return cursor },
        sort() { return cursor },
        async toArray() {
          return Array.from(rows.values())
            .filter((row) => matches(row, filter))
            .slice(0, limitValue)
            .map((row) => ({ ...row }))
        },
      }
      return cursor
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

describe('qcoin Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    qcoinPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    qcoinPrimary.__setTestDb(null)
    qcoinPrimary.__setTestAliasResolver?.(null)
  })

  test('increments account balance and writes ledger in Mongo primary collections', async () => {
    const first = await qcoinPrimary.incrementBalance({ uid: 'alice', amount: 1.25, eventKind: 'drop' })
    const second = await qcoinPrimary.incrementBalance({ uid: 'alice', amount: 0.75, eventKind: 'drop' })

    expect(first.balance).toBe(1.25)
    expect(second.balance).toBe(2)
    await expect(qcoinPrimary.readAccount('alice')).resolves.toMatchObject({ userId: 'alice', balance: 2 })
    expect(memoryDb.collection('qcoin_ledger').rows.size).toBe(2)
  })

  test('does not increment twice for the same idempotency key', async () => {
    const first = await qcoinPrimary.incrementBalance({
      uid: 'alice',
      amount: 10,
      eventKind: 'topup',
      idempotencyKey: 'paid:event:1',
    })
    const duplicate = await qcoinPrimary.incrementBalance({
      uid: 'alice',
      amount: 10,
      eventKind: 'topup',
      idempotencyKey: 'paid:event:1',
    })

    expect(first.balance).toBe(10)
    expect(duplicate).toMatchObject({ balance: 10, duplicate: true })
    await expect(qcoinPrimary.readAccount('alice')).resolves.toMatchObject({ balance: 10 })
    expect(memoryDb.collection('qcoin_ledger').rows.size).toBe(1)
  })

  test('credits canonical wallet balance when a QCoin topup arrives through a Telegram alias', async () => {
    qcoinPrimary.__setTestAliasResolver(async (uid) => {
      if (uid === '777001') {
        return {
          canonical: '0x1111111111111111111111111111111111111111',
          aliases: ['777001', 'telegram:777001', 'tg:777001', 'tguid:777001'],
        }
      }
      return { canonical: uid, aliases: [] }
    })

    const result = await qcoinPrimary.incrementBalance({
      uid: 'telegram:777001',
      amount: 25,
      eventKind: 'qcoin_topup_credit',
      idempotencyKey: 'qcoin:topup:paid:alias-test',
    })

    expect(result.balance).toBe(25)
    await expect(qcoinPrimary.readAccount('777001')).resolves.toMatchObject({
      userId: '0x1111111111111111111111111111111111111111',
      balance: 25,
    })
    await expect(qcoinPrimary.readAccount('0x1111111111111111111111111111111111111111')).resolves.toMatchObject({
      balance: 25,
    })
    expect(memoryDb.collection('qcoin_accounts').rows.has('account:777001')).toBe(false)
    expect(memoryDb.collection('qcoin_accounts').rows.has('account:0x1111111111111111111111111111111111111111')).toBe(true)
  })

  test('reads legacy alias balance together with new canonical referral rewards without double crediting', async () => {
    qcoinPrimary.__setTestAliasResolver(async (uid) => {
      if (uid === '777001' || uid === '0x2222222222222222222222222222222222222222') {
        return {
          canonical: '0x2222222222222222222222222222222222222222',
          aliases: ['777001', 'telegram:777001', 'tguid:777001', 'tg:777001'],
        }
      }
      return { canonical: uid, aliases: [] }
    })

    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: 'account:777001' },
      {
        $set: {
          uid: '777001',
          userId: '777001',
          accountId: '777001',
          balance: 10.4,
          seconds: 12,
          updatedAt: '2026-06-20T10:00:00.000Z',
        },
      },
      { upsert: true },
    )

    const firstReward = await qcoinPrimary.incrementBalance({
      uid: 'telegram:777001',
      amount: 0.1,
      eventKind: 'referral_reward',
      idempotencyKey: 'referral:abc:iphash',
    })
    const duplicateReward = await qcoinPrimary.incrementBalance({
      uid: 'telegram:777001',
      amount: 0.1,
      eventKind: 'referral_reward',
      idempotencyKey: 'referral:abc:iphash',
    })

    expect(firstReward.balance).toBeCloseTo(10.5, 8)
    expect(duplicateReward).toMatchObject({ duplicate: true })
    expect(duplicateReward.balance).toBeCloseTo(10.5, 8)
    await expect(qcoinPrimary.readAccount('777001')).resolves.toMatchObject({
      userId: '0x2222222222222222222222222222222222222222',
      balance: 10.5,
    })
    expect(memoryDb.collection('qcoin_accounts').rows.has('account:777001')).toBe(true)
    expect(memoryDb.collection('qcoin_accounts').rows.has('account:0x2222222222222222222222222222222222222222')).toBe(true)
    expect(memoryDb.collection('qcoin_ledger').rows.size).toBe(1)
  })

  test('builds the public payload from the merged legacy and canonical account state', async () => {
    qcoinPrimary.__setTestAliasResolver(async (uid) => {
      if (uid === '777001' || uid === '0x3333333333333333333333333333333333333333') {
        return {
          canonical: '0x3333333333333333333333333333333333333333',
          aliases: ['777001', 'telegram:777001', 'tguid:777001', 'tg:777001'],
        }
      }
      return { canonical: uid, aliases: [] }
    })

    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: 'account:777001' },
      {
        $set: {
          uid: '777001',
          userId: '777001',
          accountId: '777001',
          balance: 10.424265665,
          seconds: 365,
          startedAt: 100,
          lastActiveAt: 200,
          updatedAt: '2026-06-20T10:00:00.000Z',
        },
      },
      { upsert: true },
    )
    await qcoinPrimary.incrementBalance({
      uid: 'telegram:777001',
      amount: 0.1,
      eventKind: 'referral_reward',
      idempotencyKey: 'referral:payload:once',
    })

    const payload = await qcoinPrimary.getPayload({ uid: 'telegram:777001', isVip: false })
    expect(payload).toMatchObject({
      ok: true,
      userId: '0x3333333333333333333333333333333333333333',
      seconds: 365,
      minutes: 6,
      vip: 0,
    })
    expect(payload.balance).toBeCloseTo(10.524265665, 8)
  })

  test('normalizes wallet address casing to the existing canonical QCoin account', async () => {
    const checksum = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const lower = checksum.toLowerCase()

    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: `account:${checksum}` },
      {
        $set: {
          uid: checksum,
          userId: checksum,
          accountId: checksum,
          balance: 21880054.249,
          seconds: 18401203,
          updatedAt: '2026-06-26T06:26:34.271Z',
        },
      },
      { upsert: true },
    )
    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: `account:${lower}` },
      {
        $set: {
          uid: lower,
          userId: lower,
          accountId: lower,
          balance: 0.000185,
          seconds: 5845,
          updatedAt: '2026-06-29T14:38:03.961Z',
        },
      },
      { upsert: true },
    )

    await expect(qcoinPrimary.resolveCanonicalAccountId(lower)).resolves.toBe(checksum)
    await expect(qcoinPrimary.readAccount(lower)).resolves.toMatchObject({
      userId: checksum,
      balance: 21880054.249,
      seconds: 18401203,
    })
    await expect(qcoinPrimary.getPayload({ uid: lower, isVip: false })).resolves.toMatchObject({
      userId: checksum,
      balance: 21880054.249,
      minutes: Math.floor(18401203 / 60),
    })
  })

  test('increments migrated string balances in the existing canonical account document', async () => {
    const uid = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    await memoryDb.collection('qcoin_accounts').updateOne(
      { _id: `legacy:${uid}` },
      {
        $set: {
          uid,
          userId: uid,
          accountId: uid,
          balance: '100.5',
          seconds: 10,
          updatedAt: '2026-06-30T10:00:00.000Z',
        },
      },
      { upsert: true },
    )

    const result = await qcoinPrimary.incrementBalance({
      uid,
      amount: -2.25,
      eventKind: 'battlecoin_open_stake_debit',
      idempotencyKey: 'battlecoin:string-balance:test',
    })

    expect(result.balance).toBeCloseTo(98.25, 8)
    expect(memoryDb.collection('qcoin_accounts').rows.has(`legacy:${uid}`)).toBe(true)
    expect(memoryDb.collection('qcoin_accounts').rows.has(`account:${uid}`)).toBe(false)
    expect(memoryDb.collection('qcoin_accounts').rows.get(`legacy:${uid}`)).toMatchObject({
      balance: 98.25,
      userId: uid,
      accountId: uid,
    })
  })

  test('heartbeat preserves original accrual semantics without Redis state writes', async () => {
    await qcoinPrimary.writeState('alice', {
      startedAt: 1000,
      lastActiveAt: 1000,
      lastConfirmAt: 1000,
      carryMs: 500,
      seconds: 3,
      balance: 1,
      paused: false,
    })

    const result = await qcoinPrimary.heartbeat({ uid: 'alice', now: 3500, active: false, anyClientAlive: false })

    expect(result.addedSeconds).toBe(3)
    expect(result.effectiveActive).toBe(true)
    expect(result.state.seconds).toBe(6)
    expect(result.state.carryMs).toBe(0)
    expect(result.state.balance).toBeGreaterThan(1)
  })

  test('stores topup invoices, lookup indexes, payment claims, and events in Mongo', async () => {
    const topupId = await qcoinPrimary.nextTopupId()
    expect(topupId).toBe('1')

    await qcoinPrimary.saveTopupInvoice({
      internalId: topupId,
      type: 'qcoin_topup',
      accountId: 'alice',
      orderId: 'qcoin_topup:1:123',
      externalId: 'np_1',
      paymentId: 'pay_1',
      qcoinAmount: 25,
      status: 'pending',
      createdAt: '2026-06-29T00:00:00.000Z',
    })

    await expect(qcoinPrimary.loadTopupInvoice(topupId)).resolves.toMatchObject({
      internalId: '1',
      orderId: 'qcoin_topup:1:123',
      externalId: 'np_1',
      storagePrimary: 'mongo',
    })
    await expect(qcoinPrimary.findTopupInternalId({ externalInvoiceId: 'np_1' })).resolves.toBe('1')
    await expect(qcoinPrimary.findTopupInternalId({ orderId: 'qcoin_topup:1:123' })).resolves.toBe('1')
    await expect(qcoinPrimary.findTopupInternalId({ paymentId: 'pay_1' })).resolves.toBe('1')

    await expect(qcoinPrimary.claimTopupPayment('qcoin:topup:paid:pay_1', '1')).resolves.toBe(true)
    await expect(qcoinPrimary.claimTopupPayment('qcoin:topup:paid:pay_1', '1')).resolves.toBe(false)

    await qcoinPrimary.saveTopupEvent({
      invoiceId: '1',
      accountId: 'alice',
      qcoinAmount: 25,
      createdAt: '2026-06-23T00:00:00.000Z',
    })
    expect(memoryDb.collection('qcoin_topup_events').rows.size).toBe(1)

    await qcoinPrimary.saveTopupRuntime('topup:last', { okSig: true })
    expect(memoryDb.collection('qcoin_topup_runtime').rows.get('topup:last')).toMatchObject({
      key: 'topup:last',
      value: { okSig: true },
      storagePrimary: 'mongo',
    })
  })
})
