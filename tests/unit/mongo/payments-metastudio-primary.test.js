import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import paymentsPrimaryModule from '../../../lib/mongo/payments-primary.cjs'
import metastudioPrimaryModule from '../../../lib/mongo/metastudio-primary.cjs'

const paymentsPrimary = paymentsPrimaryModule?.default || paymentsPrimaryModule
const metastudioPrimary = metastudioPrimaryModule?.default || metastudioPrimaryModule

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

describe('payments and metastudio Mongo primary repositories', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    paymentsPrimary.__setTestDb(memoryDb)
    metastudioPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    paymentsPrimary.__setTestDb(null)
    metastudioPrimary.__setTestDb(null)
  })

  test('stores pay invoices, lookup fields, legacy snapshots and webhook runtime in Mongo', async () => {
    const id = await paymentsPrimary.nextInvoiceId()
    expect(id).toBe('1')

    await paymentsPrimary.saveInvoice({
      id,
      internalId: id,
      type: 'ads',
      accountId: 'alice',
      orderId: 'adspkg:alice:STARTER:123',
      externalId: 'np_1',
      paymentId: 'pay_1',
      status: 'pending',
      createdAt: '2026-06-29T00:00:00.000Z',
    })

    await expect(paymentsPrimary.readInvoice(id)).resolves.toMatchObject({
      internalId: '1',
      orderId: 'adspkg:alice:STARTER:123',
      externalId: 'np_1',
      storagePrimary: 'mongo',
    })
    await expect(paymentsPrimary.findInvoiceInternalId({ externalInvoiceId: 'np_1' })).resolves.toBe('1')
    await expect(paymentsPrimary.findInvoiceInternalId({ orderId: 'adspkg:alice:STARTER:123' })).resolves.toBe('1')
    await expect(paymentsPrimary.findInvoiceInternalId({ paymentId: 'pay_1' })).resolves.toBe('1')

    await paymentsPrimary.saveLegacySnapshot('invoice:np_1', { accountId: 'alice', lastStatus: 'paid', createdAt: 123456789 })
    expect(memoryDb.collection('payment_legacy_snapshots').rows.get('invoice:np_1')).toMatchObject({
      accountId: 'alice',
      storagePrimary: 'mongo',
    })

    await paymentsPrimary.saveWebhookRuntime('np:last', { okSig: true })
    expect(memoryDb.collection('payment_webhook_runtime').rows.get('np:last')).toMatchObject({
      value: { okSig: true },
      storagePrimary: 'mongo',
    })
  })

  test('stores metastudio registration state and preserves alreadyRegistered semantics', async () => {
    const first = await metastudioPrimary.upsertRegistration('alice', {
      type: 'metastudio_interest',
      source: 'game-page',
      authSnapshot: { wallet: '0xabc' },
      clientHash: 'hash-1',
    })
    const second = await metastudioPrimary.upsertRegistration('alice', {
      type: 'metastudio_interest',
      source: 'game-page',
      authSnapshot: { wallet: '0xabc' },
      clientHash: 'hash-1',
    })

    expect(first.existing).toBeFalsy()
    expect(second.existing).toBeTruthy()
    expect(second.registration).toMatchObject({
      accountId: 'alice',
      seenCount: 2,
      registeredAt: first.registration.registeredAt,
      storagePrimary: 'mongo',
    })
    await expect(metastudioPrimary.readRegistration('alice')).resolves.toMatchObject({
      accountId: 'alice',
      seenCount: 2,
    })
  })

  test('imports legacy metastudio registration without changing its original counters or timestamps', async () => {
    const imported = await metastudioPrimary.importLegacyRegistration('alice', {
      _id: 'legacy:alice',
      type: 'metastudio_interest',
      source: 'game-page',
      createdAt: '2026-01-01T00:00:00.000Z',
      registeredAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      seenCount: 7,
      authSnapshot: { wallet: '0xabc' },
    })

    expect(imported).toMatchObject({
      accountId: 'alice',
      seenCount: 7,
      registeredAt: '2026-01-01T00:00:00.000Z',
      backfilledFromRedis: true,
    })
    await expect(metastudioPrimary.readRegistration('alice')).resolves.toMatchObject({
      accountId: 'alice',
      seenCount: 7,
      updatedAt: '2026-01-02T00:00:00.000Z',
    })
  })

  test('updates a migrated MetaStudio row by accountId instead of inserting a duplicate canonical id', async () => {
    const registrations = memoryDb.collection('metastudio_registrations')
    await registrations.updateOne(
      { _id: 'legacy:alice' },
      { $set: { accountId: 'alice', seenCount: 4, registeredAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' } },
      { upsert: true },
    )

    const result = await metastudioPrimary.upsertRegistration('alice', { source: 'game-page', updatedAt: '2026-01-03T00:00:00.000Z' })

    expect(result.existing).toMatchObject({ _id: 'legacy:alice', accountId: 'alice' })
    expect(registrations.rows.size).toBe(1)
    await expect(metastudioPrimary.readRegistration('alice')).resolves.toMatchObject({
      _id: 'legacy:alice',
      accountId: 'alice',
      seenCount: 5,
      updatedAt: '2026-01-03T00:00:00.000Z',
    })
  })
})
