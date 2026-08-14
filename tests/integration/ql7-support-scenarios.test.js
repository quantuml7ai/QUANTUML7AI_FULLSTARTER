import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

vi.mock('../../lib/webPush.js', () => ({
  sendBackgroundPush: vi.fn(async () => ({ ok: true, mocked: true })),
}))

vi.mock('../../lib/supportEmailTransport.js', () => ({
  sendSupportEmail: vi.fn(async () => ({ ok: true, skipped: false, mocked: true, messageId: 'mock-support-email-receipt' })),
}))

vi.mock('../../lib/deepTranslateService.js', () => ({
  normalizeDeepTranslateLanguage: (value = '', fallback = 'en') => {
    const clean = String(value || '').trim().toLowerCase().split(/[-_]/)[0]
    return clean || fallback
  },
  deepTranslateText: vi.fn(async ({ text = '', sourceLang = 'auto', targetLang = 'en' } = {}) => {
    const source = String(sourceLang || 'auto').toLowerCase()
    const target = String(targetLang || 'en').toLowerCase()
    const value = String(text || '')
    if (source === target) return { text: value, provider: 'fake-deep-translate' }
    if (source === 'he' && target === 'en') {
      const canonical = /qcoin|חשבונית|מטבע|תשלום|ארנק/iu.test(value)
        ? 'There is a problem with QCoin invoice 123'
        : 'How to use CryptoRadar stock market analytics correctly?'
      return { text: canonical, provider: 'fake-deep-translate' }
    }
    if (target === 'he') {
      return {
        text: 'כך משתמשים נכון בניתוחי שוק המניות באמצעות CryptoRadar.',
        provider: 'fake-deep-translate',
      }
    }
    return { text: `[${target}] ${value}`, provider: 'fake-deep-translate' }
  }),
}))

vi.mock('../../lib/ql7-support/supportDeepTranslateService.js', () => ({
  deepTranslateQl7SupportText: vi.fn(async ({ text = '', sourceLang = 'auto', targetLang = 'en' } = {}) => {
    const source = String(sourceLang || 'auto').toLowerCase()
    const target = String(targetLang || 'en').toLowerCase()
    const value = String(text || '')
    if (source === target) return { text: value, provider: 'fake-support-translate' }
    if (source === 'he' && target === 'en') {
      return { text: /qcoin|חשבונית|מטבע|תשלום|ארנק/iu.test(value) ? 'There is a problem with QCoin invoice 123' : 'How to use CryptoRadar stock market analytics correctly?', provider: 'fake-support-translate' }
    }
    if (target === 'he') return { text: 'כך משתמשים נכון בניתוחי שוק המניות באמצעות CryptoRadar.', provider: 'fake-support-translate' }
    return { text: `[${target}] ${value}`, provider: 'fake-support-translate' }
  }),
}))


vi.mock('../../lib/adsCore.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getAdsReadOnlySnapshot: vi.fn(async () => ({
      ok: true,
      accountId: '',
      linkedAccountIds: [],
      currentPackage: null,
      package: null,
      packages: [],
      campaigns: [],
      readOnly: true,
      source: 'adsCore',
      writes: [],
    })),
    getAnalyticsForCampaign: vi.fn(async () => ({
      ok: true,
      impressionsTotal: 1200,
      clicksTotal: 84,
      ctrTotal: 0.07,
      updatedAt: '2026-07-20T10:02:00.000Z',
    })),
  }
})

import dmPrimaryModule from '../../lib/mongo/dm-primary.cjs'
import mongoClientModule from '../../lib/mongo/client.cjs'
import { QL7_SUPPORT_ID } from '../../lib/ql7-support/systemActor.js'
import {
  QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION,
  __setQl7SupportTestDb,
  createQl7SupportEntryGreetingV8,
  createQl7SupportUserMessage,
} from '../../lib/ql7-support/server.js'
import {
  notifyQl7AdsActivated,
  notifyQl7MediaLock,
  notifyQl7PostRemoved,
  notifyQl7QcoinCredited,
  notifyQl7ReportReceived,
  notifyQl7ReportThreshold,
  notifyQl7RulesWarning,
  notifyQl7Security,
  notifyQl7VipActivated,
} from '../../lib/ql7-support/events.js'
import {
  __setQl7SupportSchedulerTestDb,
  runQl7SupportAdsScheduler,
  runQl7SupportVipScheduler,
} from '../../lib/ql7-support/scheduler.js'
import {
  QL7_SUPPORT_CASE_COLLECTION,
  analyzeQl7SupportRequest,
  redactQl7SupportSecrets,
} from '../../lib/ql7-support/caseEngine.js'
import {
  maybeRunQl7SupportDmBroadcastCommand,
  resolveQl7SupportBroadcastRecipients,
} from '../../lib/ql7-support/broadcast.js'
import {
  QL7_SUPPORT_ADS_DIAGNOSTIC_BRANCHES,
  QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION,
  QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS,
  QL7_SUPPORT_QCOIN_DIAGNOSTIC_BRANCHES,
  runQl7SupportGenericDomainDiagnostic,
  runQl7SupportAdsDiagnostic,
  runQl7SupportQcoinDiagnostic,
} from '../../lib/ql7-support/diagnostics.js'
import { getQl7SupportReadCollections } from '../../lib/ql7-support/ecosystemCatalog.js'
import { POST as sendDmRoutePost } from '../../app/api/dm/send/route.js'
import { sendBackgroundPush } from '../../lib/webPush.js'
import { sendSupportEmail } from '../../lib/supportEmailTransport.js'
import { processQl7SupportEmailOutbox } from '../../lib/ql7-support/emailOutboxWorker.js'
import { getAdsReadOnlySnapshot, getAnalyticsForCampaign } from '../../lib/adsCore.js'

const dmPrimary = dmPrimaryModule?.default || dmPrimaryModule
const mongoClient = mongoClientModule?.default || mongoClientModule
const ORIGINAL_SUPPORT_ACTIVE = process.env.SUPPORT_ACTIVE
const ORIGINAL_QL7_SUPPORT_CHOICE_SECRET = process.env.QL7_SUPPORT_CHOICE_SECRET
const ql7SupportScenarioEvidence = []

function recordQl7SupportScenarioEvidence(name, expected, actual) {
  ql7SupportScenarioEvidence.push({
    name,
    expected,
    actual,
    recordedAt: new Date('2026-07-23T00:00:00.000Z').toISOString(),
  })
}

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual ?? ''))
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
    if ('$exists' in expected) return expected.$exists ? actual !== undefined : actual === undefined
    if ('$ne' in expected) return String(actual) !== String(expected.$ne)
    if ('$gt' in expected) return Number(actual) > Number(expected.$gt)
    if ('$gte' in expected) return Number(actual) >= Number(expected.$gte)
    if ('$lt' in expected) return Number(actual) < Number(expected.$lt)
    if ('$lte' in expected) return Number(actual) <= Number(expected.$lte)
  }
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((item) => matches(doc, item))
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return Array.isArray(expected) && expected.some((item) => matches(doc, item))
    return matchesValue(getValue(doc, key), expected)
  })
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (update.$set) Object.assign(doc, update.$set)
  if (isInsert && update.$setOnInsert) Object.assign(doc, update.$setOnInsert)
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) doc[key] = Number(doc[key] || 0) + Number(value || 0)
  }
  if (update.$max) {
    for (const [key, value] of Object.entries(update.$max)) {
      const next = Number(value || 0)
      if (!Number.isFinite(Number(doc[key])) || Number(doc[key]) < next) doc[key] = next
    }
  }
}

function projectRow(row, projection) {
  if (!projection) return { ...row }
  const out = {}
  for (const [key, enabled] of Object.entries(projection)) if (enabled) out[key] = row[key]
  return out
}

function createMemoryCollection() {
  const rows = new Map()
  return {
    rows,
    async createIndex() { return 'ok' },
    async insertOne(doc = {}) {
      const id = String(doc._id || `auto:${rows.size + 1}`)
      if (rows.has(id)) {
        const error = new Error('duplicate key')
        error.code = 11000
        throw error
      }
      rows.set(id, { ...doc, _id: id })
      return { acknowledged: true, insertedId: id }
    },
    async updateOne(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || `auto:${rows.size + 1}`
        doc = { _id: String(id) }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    async bulkWrite(ops = []) {
      for (const op of ops) {
        if (op.updateOne) await this.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: op.updateOne.upsert })
        if (op.insertOne) await this.insertOne(op.insertOne.document)
      }
      return { ok: 1, insertedCount: 0, modifiedCount: ops.length }
    },
    async findOneAndUpdate(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return null
        const id = filter?._id || `auto:${rows.size + 1}`
        doc = { _id: String(id) }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { ...doc }
    },
    async findOne(filter) {
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    find(filter = {}, options = {}) {
      let projection = options?.projection || null
      let limitValue = Infinity
      let sortSpec = null
      const cursor = {
        project(spec) { projection = spec; return cursor },
        limit(n) { limitValue = Number(n || 0) > 0 ? Number(n) : Infinity; return cursor },
        sort(spec) { sortSpec = spec; return cursor },
        async toArray() {
          let list = Array.from(rows.values()).filter((row) => matches(row, filter))
          if (sortSpec) {
            const entries = Object.entries(sortSpec)
            list = list.slice().sort((a, b) => {
              for (const [key, dir] of entries) {
                const av = getValue(a, key)
                const bv = getValue(b, key)
                if (av === bv) continue
                return (av > bv ? 1 : -1) * Number(dir || 1)
              }
              return 0
            })
          }
          return list.slice(0, limitValue).map((row) => projectRow(row, projection))
        },
      }
      return cursor
    },
    async countDocuments(filter = {}) {
      return Array.from(rows.values()).filter((row) => matches(row, filter)).length
    },
    async deleteOne(filter) {
      const item = Array.from(rows.entries()).find(([, row]) => matches(row, filter))
      if (item) rows.delete(item[0])
      return { deletedCount: item ? 1 : 0 }
    },
    async deleteMany(filter) {
      let count = 0
      for (const [key, row] of Array.from(rows.entries())) {
        if (matches(row, filter)) {
          rows.delete(key)
          count += 1
        }
      }
      return { deletedCount: count }
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
    listCollections() {
      return {
        async toArray() {
          return Array.from(collections.keys()).map((name) => ({ name }))
        },
      }
    },
  }
}

function verifiedActorFor(userId, aliases = []) {
  const canonicalAccountId = String(userId || '').trim()
  return {
    authMode: 'system',
    canonicalAccountId,
    aliases: Array.from(new Set([canonicalAccountId, ...aliases.map((item) => String(item || '').trim())].filter(Boolean))),
    verifiedAt: '2026-07-23T00:00:00.000Z',
    valid: true,
  }
}

async function createVerifiedSupportUserMessage(input = {}) {
  return createQl7SupportUserMessage({
    ...input,
    actor: verifiedActorFor(input.fromUserId, input.rawFromIds || []),
  })
}

async function supportThreadFor(userId, limit = 80) {
  return dmPrimary.readThreadLikeRedis({
    me: userId,
    rawMeHeader: userId,
    rawMe: userId,
    rawWithInput: QL7_SUPPORT_ID,
    rawWith: QL7_SUPPORT_ID,
    withId: QL7_SUPPORT_ID,
    limit,
  })
}

async function supportRawMessagesFor(database, userId, limit = 100) {
  const rows = await database.collection('dm_messages').find({
    $or: [
      { from: QL7_SUPPORT_ID, to: userId },
      { from: userId, to: QL7_SUPPORT_ID },
    ],
  }).sort({ ts: -1 }).limit(limit).toArray()
  return rows.map((row) => (row?.raw && typeof row.raw === 'object' ? row.raw : row))
}

async function allSupportRawMessages(database, limit = 200) {
  const rows = await database.collection('dm_messages').find({ from: QL7_SUPPORT_ID })
    .sort({ ts: -1 })
    .limit(limit)
    .toArray()
  return rows.map((row) => (row?.raw && typeof row.raw === 'object' ? row.raw : row))
}

async function supportEventTypes(database, userId) {
  const rows = await supportRawMessagesFor(database, userId)
  return rows.map((item) => item.supportEventType || '').filter(Boolean)
}

function qcoinBusinessSizes(database) {
  return Object.fromEntries([
    'qcoin_topup_invoices',
    'qcoin_topup_events',
    'qcoin_topup_payment_dedupe',
    'qcoin_ledger',
    'qcoin_accounts',
  ].map((name) => [name, database.collection(name).rows.size]))
}

function adsBusinessSizes(database) {
  return Object.fromEntries([
    'ads_kv',
    'ads_sets',
  ].map((name) => [name, database.collection(name).rows.size]))
}

function buildAdsReadOnlySnapshotFromMemory(database, accountIdRaw) {
  const accountId = String(accountIdRaw || '').trim()
  const values = Array.from(database.collection('ads_kv').rows.values())
  const packageRows = values
    .filter((row) => String(row?._id || '').startsWith('ads:package:'))
    .map((row) => ({ ...(row?.value || {}), _kvId: row._id }))
  const packages = packageRows.filter((row) => [row.userId, row.accountId, row.uid, row.ownerId]
    .map((value) => String(value || '').trim())
    .includes(accountId))
  const packageIds = new Set(packages.flatMap((row) => [row.id, row.packageId])
    .map((value) => String(value || '').trim())
    .filter(Boolean))
  const campaigns = values
    .filter((row) => String(row?._id || '').startsWith('ads:campaign:'))
    .map((row) => ({ ...(row?.value || {}), _kvId: row._id }))
    .filter((row) => [row.userId, row.accountId, row.uid, row.ownerId]
      .map((value) => String(value || '').trim())
      .includes(accountId) || packageIds.has(String(row.packageId || '').trim()))
  const currentPackage = packages[0] || null
  return {
    ok: true,
    accountId,
    linkedAccountIds: accountId ? [accountId] : [],
    currentPackage,
    package: currentPackage,
    packages,
    campaigns,
    readOnly: true,
    source: 'adsCore',
    writes: [],
  }
}

async function seedAdsPackage(database, userId, {
  packageId = 'pkg-active',
  campaignId = 'campaign-active',
  packageStatus = 'active',
  campaignStatus = 'active',
  expiresAt = '2026-08-20T00:00:00.000Z',
  impressions = 1200,
  clicks = 84,
} = {}) {
  await database.collection('ads_kv').insertOne({
    _id: `ads:package:${packageId}`,
    value: {
      id: packageId,
      packageId,
      userId,
      accountId: userId,
      packageName: 'Quantum Ads',
      status: packageStatus,
      expiresAt,
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
  })
  await database.collection('ads_sets').insertOne({
    _id: `ads:campaigns:pkg:${packageId}`,
    members: [campaignId],
  })
  await database.collection('ads_sets').insertOne({
    _id: `ads:packages:${userId}`,
    members: [packageId],
  })
  await database.collection('ads_sets').insertOne({
    _id: `ads:campaigns:${userId}`,
    members: [campaignId],
  })
  await database.collection('ads_kv').insertOne({
    _id: `ads:campaign:${campaignId}`,
    value: {
      id: campaignId,
      campaignId,
      packageId,
      userId,
      accountId: userId,
      name: 'Premium launch',
      status: campaignStatus,
      updatedAt: '2026-07-20T10:01:00.000Z',
    },
  })
  getAnalyticsForCampaign.mockImplementation(async ({ campaignId: requestedCampaignId } = {}) => {
    const key = String(requestedCampaignId || '')
    if (key === campaignId) {
      return {
        ok: true,
        impressionsTotal: impressions,
        clicksTotal: clicks,
        ctrTotal: impressions > 0 ? clicks / impressions : 0,
        updatedAt: '2026-07-20T10:02:00.000Z',
      }
    }
    return {
      ok: true,
      impressionsTotal: 1200,
      clicksTotal: 84,
      ctrTotal: 0.07,
      updatedAt: '2026-07-20T10:02:00.000Z',
    }
  })
  return { packageId, campaignId }
}

async function seedQcoinDiagnosticBranch(database, branch, userId) {
  const invoiceId = `invoice-${branch}`
  const invoice = {
    _id: invoiceId,
    internalId: invoiceId,
    id: invoiceId,
    type: 'qcoin_topup',
    accountId: userId,
    qcoinAmount: 25,
    status: 'paid',
    lastStatus: 'paid',
    updatedAt: '2026-07-20T10:00:00.000Z',
  }

  if (branch === 'invoice_missing' || branch === 'mongo_unavailable' || branch === 'timeout') return invoiceId

  if (branch === 'pending') invoice.status = 'pending'
  if (branch === 'credit_failed') {
    invoice.status = 'credit_failed'
    invoice.creditError = 'synthetic credit failure'
  }
  if (branch === 'underpaid') {
    invoice.status = 'underpaid'
    invoice.underpayFiat = 1.5
  }
  if (branch === 'invalid') invoice.status = 'invalid_invoice'
  if (branch === 'foreign_account') invoice.accountId = 'other-user'
  if (branch === 'multiple_invoices') {
    invoice.paymentId = 'payment-multi'
    await database.collection('qcoin_topup_invoices').insertOne({ ...invoice, _id: `${invoiceId}:a`, internalId: `${invoiceId}:a` })
    await database.collection('qcoin_topup_invoices').insertOne({ ...invoice, _id: `${invoiceId}:b`, internalId: `${invoiceId}:b` })
    return 'payment-multi'
  }

  await database.collection('qcoin_topup_invoices').insertOne(invoice)

  if (branch === 'webhook_without_ledger' || branch === 'ledger_balance_ok') {
    await database.collection('qcoin_topup_events').insertOne({
      _id: `event-${branch}`,
      invoiceId,
      accountId: userId,
      qcoinAmount: 25,
      createdAt: '2026-07-20T10:01:00.000Z',
    })
  }
  if (branch === 'ledger_balance_ok') {
    await database.collection('qcoin_ledger').insertOne({
      _id: `ledger-${branch}`,
      txId: `event-${branch}`,
      userId,
      amount: 25,
      eventKind: 'qcoin_topup_credit',
      meta: { invoiceId },
      createdAt: '2026-07-20T10:02:00.000Z',
    })
    await database.collection('qcoin_accounts').insertOne({
      _id: `account:${userId}`,
      userId,
      accountId: userId,
      balance: 25,
      updatedAt: '2026-07-20T10:03:00.000Z',
    })
  }

  return invoiceId
}

describe('QL7 Support scenario smoke delivery', () => {
  let memoryDb
  let mongoSpy

  afterAll(() => {
    const dir = path.join(process.cwd(), 'audit')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      path.join(dir, 'ql7-support-v4-scenario-report.json'),
      `${JSON.stringify({
        generatedBy: 'tests/integration/ql7-support-scenarios.test.js',
        scenarios: ql7SupportScenarioEvidence,
      }, null, 2)}\n`,
      'utf8',
    )
  })

  beforeEach(() => {
    process.env.SUPPORT_ACTIVE = '1'
    process.env.QL7_SUPPORT_CHOICE_SECRET = 'ql7-support-choice-integration-secret-v15-3-2-runtime-safe'
    memoryDb = createMemoryDb()
    dmPrimary.__setTestDb(memoryDb)
    __setQl7SupportTestDb(memoryDb)
    __setQl7SupportSchedulerTestDb(memoryDb)
    mongoSpy = vi.spyOn(mongoClient, 'getMongoDb').mockResolvedValue(memoryDb)
    sendBackgroundPush.mockClear()
    sendBackgroundPush.mockResolvedValue({ ok: true, mocked: true })
    sendSupportEmail.mockClear()
    sendSupportEmail.mockResolvedValue({ ok: true, skipped: false, mocked: true, messageId: 'mock-support-email-receipt' })
    getAdsReadOnlySnapshot.mockReset()
    getAdsReadOnlySnapshot.mockImplementation(async (accountIdRaw) => buildAdsReadOnlySnapshotFromMemory(memoryDb, accountIdRaw))
    getAnalyticsForCampaign.mockClear()
    getAnalyticsForCampaign.mockResolvedValue({
      ok: true,
      impressionsTotal: 1200,
      clicksTotal: 84,
      ctrTotal: 0.07,
      updatedAt: '2026-07-20T10:02:00.000Z',
    })
  })

  afterEach(() => {
    dmPrimary.__setTestDb(null)
    __setQl7SupportTestDb(null)
    __setQl7SupportSchedulerTestDb(null)
    mongoSpy?.mockRestore?.()
    delete process.env.QL7_SUPPORT_DM_BROADCAST_ENABLED
    delete process.env.QL7_SUPPORT_DM_BROADCAST_TOKEN
    delete process.env.QL7_SUPPORT_BROADCAST_ADMIN_IDS
    if (ORIGINAL_QL7_SUPPORT_CHOICE_SECRET === undefined) delete process.env.QL7_SUPPORT_CHOICE_SECRET
    else process.env.QL7_SUPPORT_CHOICE_SECRET = ORIGINAL_QL7_SUPPORT_CHOICE_SECRET
    if (ORIGINAL_SUPPORT_ACTIVE === undefined) delete process.env.SUPPORT_ACTIVE
    else process.env.SUPPORT_ACTIVE = ORIGINAL_SUPPORT_ACTIVE
  })

  test('delivers domain confirmations into the official DM thread and dedupes repeated events', async () => {
    const userId = 'scenario-user'
    const firstQcoin = await notifyQl7QcoinCredited({
      userId,
      locale: 'ru',
      amount: '777',
      balance: '1777',
      invoiceId: 'invoice-1',
      paymentId: 'pay-1',
      creditedAt: '2026-07-20T10:00:00.000Z',
    })
    const duplicateQcoin = await notifyQl7QcoinCredited({
      userId,
      locale: 'ru',
      amount: '777',
      balance: '1777',
      invoiceId: 'invoice-1',
      paymentId: 'pay-1',
      creditedAt: '2026-07-20T10:00:00.000Z',
    })

    await notifyQl7VipActivated({ userId, locale: 'uk', until: '2026-08-20T00:00:00.000Z', paymentId: 'vip-1' })
    await notifyQl7AdsActivated({ userId, locale: 'en', packageName: 'Premium Ads', campaign: 'Launch', invoiceId: 'ads-1' })
    await notifyQl7ReportReceived({ userId, locale: 'es', postId: 'post-1', reportType: 'abuse', reporterId: 'mod-1' })
    await notifyQl7ReportThreshold({ userId, locale: 'tr', postId: 'post-1', reportType: 'abuse', count: 3 })
    await notifyQl7PostRemoved({ userId, locale: 'ar', postId: 'post-1', reason: 'rules', rev: 'rev-1' })
    await notifyQl7MediaLock({ userId, locale: 'zh', until: '2026-07-25T00:00:00.000Z', reason: 'moderation' })
    await notifyQl7RulesWarning({ userId, locale: 'ru', reason: 'unsafe links', warningId: 'warn-1' })
    await notifyQl7Security({ userId, locale: 'uk', message: 'Security check', securityId: 'sec-1' })

    expect(firstQcoin).toMatchObject({ ok: true, deduped: false, storagePrimary: 'mongo' })
    expect(duplicateQcoin).toMatchObject({ ok: true, deduped: true, id: firstQcoin.id })

    const thread = await supportThreadFor(userId)
    expect(thread.items).toHaveLength(9)
    expect(thread.items[0]).toMatchObject({ from: QL7_SUPPORT_ID, to: userId })
    const rawTypes = await supportEventTypes(memoryDb, userId)
    expect(rawTypes).toHaveLength(9)
    expect(rawTypes).toEqual(expect.arrayContaining([
      'critical_security',
      'rules_warning',
      'media_lock',
      'post_removed',
      'report_threshold',
      'report_received',
      'ads_activated',
      'vip_activated',
      'qcoin_credit',
    ]))
    expect(thread.items.some((item) => String(item.text).includes('777'))).toBe(true)
    expect(sendBackgroundPush).toHaveBeenCalledWith(userId, expect.objectContaining({ source: 'messenger_messages' }))
  })

  test('opens support entry with a real localized server greeting while thread reads stay side-effect free', async () => {
    const userId = 'empty-thread-user'
    const emptyRead = await supportThreadFor(userId)
    const opened = await createQl7SupportEntryGreetingV8({
      userId,
      actor: verifiedActorFor(userId),
      locale: 'ru',
      entryNonce: 'open:first',
    })
    const repeated = await createQl7SupportEntryGreetingV8({
      userId,
      actor: verifiedActorFor(userId),
      locale: 'ru',
      entryNonce: 'open:first',
    })

    const thread = await supportThreadFor(userId)
    expect(emptyRead.items).toHaveLength(0)
    expect(opened).toMatchObject({ ok: true, deduped: false })
    expect(repeated).toMatchObject({ ok: true, deduped: false, supersededEntryGreetings: 1 })
    expect(repeated.messageId).not.toBe(opened.messageId)
    expect(thread.items).toHaveLength(1)
    await expect(supportEventTypes(memoryDb, userId)).resolves.toEqual(['entry_greeting'])
    expect(thread.items[0].text.length).toBeGreaterThan(60)
    expect(sendBackgroundPush).not.toHaveBeenCalled()
  })

  test('stores user requests, bridges them safely, and answers with adaptive follow-up context', async () => {
    const first = await createVerifiedSupportUserMessage({
      fromUserId: 'human-a',
      rawFromIds: ['wallet-a'],
      text: 'VIP x2 premium badge did not activate for account human-a',
      locale: 'en',
      ts: 1000,
    })
    const second = await createVerifiedSupportUserMessage({
      fromUserId: 'human-a',
      rawFromIds: ['wallet-a'],
      text: 'VIP premium badge is still inactive, please check again',
      locale: 'en',
      ts: 2000,
    })

    expect(first).toMatchObject({ ok: true, requestTopic: 'vip', requestMode: 'new' })
    expect(second).toMatchObject({ ok: true, requestTopic: 'vip', requestMode: 'followup' })
    expect(first.bridge).toMatchObject({ ok: true, skipped: false, queued: true, asyncDelivery: false, materialReason: 'intelligence_topic_switch_v9', inlineDelivery: { sent: 1 } })
    expect(second.bridge).toMatchObject({ ok: true, skipped: true, reason: 'non_material_support_message', dedupeReason: 'duplicate_material_event', duplicateMaterialEvent: true })
    expect(sendSupportEmail).toHaveBeenCalledTimes(1)

    const thread = await supportThreadFor('human-a')
    expect(thread.items).toHaveLength(4)
    expect((await supportEventTypes(memoryDb, 'human-a')).filter((eventType) => eventType === 'support_reply')).toHaveLength(2)
    expect(thread.items.filter((item) => item.from === 'human-a')).toHaveLength(2)
    let outbox = await memoryDb.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).find({ userId: 'human-a' }).toArray()
    expect(outbox.map((item) => item.status).sort()).toEqual(['sent', 'suppressed'])
    const pendingEvent = outbox.find((item) => item.status === 'sent')
    const suppressedEvent = outbox.find((item) => item.status === 'suppressed')
    expect(pendingEvent?.materialEventKey).toBeTruthy()
    expect(suppressedEvent?.materialEventKey).toBe(pendingEvent?.materialEventKey)
    const delivery = await processQl7SupportEmailOutbox({ database: memoryDb, workerId: 'integration-worker', maxItems: 5, send: sendSupportEmail })
    expect(delivery).toMatchObject({ ok: true, sent: 0, retry: 0, deadLetter: 0 })
    expect(sendSupportEmail).toHaveBeenCalledTimes(1)
    outbox = await memoryDb.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).find({ userId: 'human-a' }).toArray()
    expect(outbox.map((item) => item.status).sort()).toEqual(['sent', 'suppressed'])
    expect(outbox.find((item) => item.status === 'sent')?.transportMessageId).toBe('mock-support-email-receipt')
  })

  test('marks support email as skipped_not_configured when SMTP transport is intentionally disabled', async () => {
    sendSupportEmail.mockResolvedValueOnce({ ok: true, skipped: true, reason: 'smtp_not_configured' })
    const result = await createVerifiedSupportUserMessage({
      fromUserId: 'smtp-disabled-human',
      rawFromIds: ['wallet-smtp-disabled'],
      text: 'seed phrase: alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu',
      locale: 'en',
      ts: 2500,
    })
    expect(result.bridge).toMatchObject({ ok: true, queued: true, asyncDelivery: true, inlineDelivery: { skippedNotConfigured: 1 } })

    const delivery = await processQl7SupportEmailOutbox({
      database: memoryDb,
      workerId: 'smtp-disabled-worker',
      maxItems: 5,
      send: async () => ({ ok: true, skipped: true, reason: 'smtp_not_configured' }),
    })
    const outbox = await memoryDb.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).find({ userId: 'smtp-disabled-human' }).toArray()
    const skipped = outbox.find((item) => item.status === 'skipped_not_configured')

    expect(delivery).toMatchObject({ ok: true, processed: 0, sent: 0, skippedNotConfigured: 0, deadLetter: 0 })
    expect(skipped).toBeTruthy()
    expect(skipped?.skipReason).toBe('smtp_not_configured')
    expect(skipped?.sentAt).toBeUndefined()
    expect(skipped?.transportMessageId).toBeUndefined()
  })

  test('localizes greeting replies and suppresses non-material admin email noise', async () => {
    const result = await createVerifiedSupportUserMessage({
      fromUserId: 'human-ru',
      rawFromIds: ['wallet-ru'],
      text: 'Привет',
      locale: 'ru',
      ts: 3000,
    })

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'support_system',
      requestMode: 'new',
      bridge: {
        ok: true,
        skipped: true,
        reason: 'non_material_support_message',
      },
    })
    expect(sendSupportEmail).not.toHaveBeenCalled()

    const thread = await supportThreadFor('human-ru')
    const supportReply = thread.items.find((item) => item.from === QL7_SUPPORT_ID)
    const greetingText = supportReply?.text || ''
    expect(supportReply?.metadata).toMatchObject({
      topic: 'support_system',
      messageAct: 'greeting',
      supportAutoReply: true,
    })
    expect(greetingText).toMatch(/[А-Яа-яЁё]/u)
    expect(greetingText).not.toMatch(/I see this is about|your request/i)
    const outbox = await memoryDb.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).findOne({ userId: 'human-ru' })
    expect(outbox).toMatchObject({ status: 'suppressed', skippedReason: 'non_material_support_message' })
  })

  test('understands platform questions, answers in selected locale, and does not repeat the primitive generic acknowledgement', async () => {
    const result = await createVerifiedSupportUserMessage({
      fromUserId: 'human-radar',
      rawFromIds: ['wallet-radar'],
      text: 'Что такое CryptoRadar и как он помогает найти сигнал?',
      locale: 'ru',
      ts: 3500,
    })

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'homepage',
      requestRole: expect.stringMatching(/informational_question|how_to_question/),
      caseStatus: 'user_notified',
    })

    const thread = await supportThreadFor('human-radar')
    const supportReply = thread.items.find((item) => item.from === QL7_SUPPORT_ID)
    expect(supportReply?.text || '').toContain('CryptoRadar')
    expect(supportReply?.text || '').not.toMatch(/I see this is about|request is registered|Спасибо за обращение/i)
    expect(result.productionDelivery).toMatchObject({
      topic: 'homepage',
      messageAct: 'how_to_question',
      text: supportReply?.text || '',
    })
    expect(result.productionDelivery?.textHash).toBeTruthy()
    expect(result.productionDelivery?.surfaceHash).toBeTruthy()
    expect(result.bridge).toMatchObject({ ok: true, skipped: true, reason: 'non_material_support_message' })
    expect(sendSupportEmail).not.toHaveBeenCalled()
  })

  test('keeps one active case memory, asks the next useful question, and moves actionable answers to diagnostic readiness', async () => {
    const first = await createVerifiedSupportUserMessage({
      fromUserId: 'human-case',
      rawFromIds: ['wallet-case'],
      text: 'В BattleCoin не создается ордер',
      locale: 'ru',
      ts: 3600,
    })
    await memoryDb.collection('battlecoin_orders').insertOne({
      _id: 'battlecoin-order-human-case',
      userId: 'human-case',
      accountId: 'human-case',
      side: 'long',
      status: 'failed',
      errorCode: '500',
      updatedAt: '2026-07-20T10:00:00.000Z',
    })
    const second = await createVerifiedSupportUserMessage({
      fromUserId: 'human-case',
      rawFromIds: ['wallet-case'],
      text: 'Да, это при создании ордера LONG, ошибка 500',
      locale: 'ru',
      ts: 3700,
    })

    expect(first).toMatchObject({
      ok: true,
      requestTopic: 'battlecoin',
      requestMode: 'new',
      caseStatus: 'collecting_context',
    })
    expect(second).toMatchObject({
      ok: true,
      requestTopic: 'battlecoin',
      requestMode: 'followup',
      caseId: first.caseId,
      caseStatus: 'ready_for_diagnostic',
      diagnosticStatus: 'inconsistent',
    })
    const decisionDoc = await memoryDb.collection('ql7_support_turn_decisions_v9').findOne({
      userId: 'human-case',
      messageId: second.id,
    })
    expect(decisionDoc).toMatchObject({
      topic: 'battlecoin',
      previousTopic: 'battlecoin',
      topicSwitchDecision: 'continue',
      continuationEvidence: expect.arrayContaining(['base_analysis_previous_topic']),
      storagePrimary: 'mongo',
    })

    const caseDoc = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: first.caseId })
    expect(caseDoc).toMatchObject({
      userId: 'human-case',
      topic: 'battlecoin',
      active: true,
      caseStatus: 'ready_for_diagnostic',
      diagnosticStatus: 'inconsistent',
      lastDiagnosticBranch: 'inconsistent',
      lastDiagnosticStatus: 'inconsistent',
    })
    expect(caseDoc.entities).toMatchObject({
      errorCode: '500',
      orderSide: 'long',
    })
    expect(caseDoc.replyHistory.length).toBeGreaterThanOrEqual(2)
    expect(new Set(caseDoc.replyHistory.map((item) => item.textHash)).size).toBe(caseDoc.replyHistory.length)
  })

  test('redacts secrets before email bridge and case storage', async () => {
    const rawSecret = 'seed phrase: alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu'
    const redacted = redactQl7SupportSecrets(rawSecret)
    expect(redacted).toContain('[secret-redacted]')
    expect(redacted).not.toContain('alpha beta gamma')

    const result = await createVerifiedSupportUserMessage({
      fromUserId: 'human-secret',
      rawFromIds: ['wallet-secret'],
      text: rawSecret,
      locale: 'en',
      ts: 3800,
    })

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'security',
    })
    expect(sendSupportEmail).toHaveBeenCalledTimes(1)
    const delivery = await processQl7SupportEmailOutbox({ database: memoryDb, workerId: 'secret-worker', maxItems: 5, send: sendSupportEmail })
    expect(delivery.sent).toBe(0)
    const deliveredSecretOutbox = await memoryDb.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).findOne({ userId: 'human-secret', status: 'sent' })
    expect(deliveredSecretOutbox?.transportMessageId).toBe('mock-support-email-receipt')
    expect(sendSupportEmail).toHaveBeenCalledWith(expect.objectContaining({
      source: 'ql7_support_dm',
      message: expect.not.stringContaining('alpha beta gamma'),
      meta: expect.objectContaining({ user: 'human-secret', topic: 'security' }),
    }))
    const caseDoc = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: result.caseId })
    expect(JSON.stringify(caseDoc)).not.toContain('alpha beta gamma')
  })

  test('splits a clearly unrelated issue into a new support case while preserving the previous case history', async () => {
    const first = await createVerifiedSupportUserMessage({
      fromUserId: 'human-split',
      rawFromIds: ['wallet-split'],
      text: 'VIP x2 badge is not active',
      locale: 'en',
      ts: 3900,
    })
    const second = await createVerifiedSupportUserMessage({
      fromUserId: 'human-split',
      rawFromIds: ['wallet-split'],
      text: 'This is a separate issue: CryptoRadar does not load signals',
      locale: 'en',
      ts: 4000,
    })

    expect(first).toMatchObject({ requestTopic: 'vip' })
    expect(second).toMatchObject({
      requestTopic: 'homepage',
      requestMode: 'new',
      requestRole: 'new_unrelated_issue',
    })
    expect(second.caseId).not.toBe(first.caseId)

    const oldCase = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: first.caseId })
    const newCase = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: second.caseId })
    expect(oldCase).toMatchObject({ topic: 'vip', active: false, caseStatus: 'superseded' })
    expect(newCase).toMatchObject({ topic: 'homepage', active: true })
  })

  test('case analyzer keeps unsupported language text safe and explicit without leaving the fixed seven-language surface', () => {
    const analysis = analyzeQl7SupportRequest({
      text: 'שלום, יש בעיה עם QCoin invoice 123',
      locale: 'ru',
      previousContext: {},
    })

    expect(analysis).toMatchObject({
      topic: 'qcoin',
      selectedLocale: 'ru',
      detectedLanguage: 'he',
      translationStatus: 'pending_provider',
      translationRequired: true,
      responseLanguage: 'ru',
    })
  })

  test('support does not repeat no-new-fact after a bare wallet answer and starts Ads read-only diagnostic', async () => {
    const userId = 'ads-wallet-human'
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    await seedAdsPackage(memoryDb, wallet, {
      packageId: 'pkg-wallet',
      campaignId: 'campaign-wallet',
    })

    const first = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      rawFromIds: [wallet],
      text: 'Проблемы с рекламой',
      locale: 'uk',
      ts: 4200,
    })
    const second = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      rawFromIds: [wallet],
      text: wallet,
      locale: 'uk',
      ts: 4300,
    })

    const thread = await supportRawMessagesFor(memoryDb, userId)
    const autoReplies = thread.filter((item) => item.from === QL7_SUPPORT_ID && item.metadata?.supportAutoReply)
    const secondReply = autoReplies.find((item) => item.metadata?.userMessageId === second.id)
    const caseDoc = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: second.caseId })

    expect(first).toMatchObject({
      requestTopic: 'ads_campaigns',
      caseStatus: 'ready_for_diagnostic',
    })
    expect(second).toMatchObject({
      requestTopic: 'ads_campaigns',
      requestRole: expect.stringMatching(/answer_to_question|evidence_submission/),
      caseStatus: 'ready_for_diagnostic',
      diagnostic: expect.objectContaining({
        topic: 'ads',
        branch: 'ads_package_active',
        readOnly: true,
        storagePrimary: 'mongo',
        businessCollectionsWritten: [],
      }),
    })
    expect(caseDoc.entities).toMatchObject({
      walletAddress: wallet,
      accountId: wallet,
    })
    expect(secondReply?.text || '').not.toMatch(/Поки не бачу|немає нової деталі/)
    recordQl7SupportScenarioEvidence('ads-bare-wallet-screenshot-regression', {
      topic: 'ads',
      walletAddressDetected: true,
      diagnosticBranch: 'ads_package_active',
      noNewFact: false,
    }, {
      topic: second.requestTopic,
      walletAddress: caseDoc.entities.walletAddress,
      diagnosticBranch: second.diagnostic?.branch,
      reply: secondReply?.text || '',
    })
  })

  test('generic ecosystem diagnostics cover every non-special QL7 domain as Mongo-primary read-only probes', async () => {
    const specialTopics = new Set(['qcoin', 'ads_packages', 'ads_campaigns'])
    const checkedTopics = QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS.filter((topic) => !specialTopics.has(topic))
    expect(checkedTopics.length).toBeGreaterThan(30)

    for (const topic of checkedTopics) {
      const collections = getQl7SupportReadCollections(topic)
      const primaryCollection = collections[0]
      await memoryDb.collection(primaryCollection).insertOne({
        _id: `${topic}:domain-human`,
        userId: 'domain-human',
        accountId: 'domain-human',
        topic,
        status: 'active',
        updatedAt: '2026-07-20T12:00:00.000Z',
      })

      const before = collections
        .filter((name) => name !== QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION)
        .map((name) => [name, memoryDb.collection(name).rows.size])
      const result = await runQl7SupportGenericDomainDiagnostic({
        database: memoryDb,
        userId: 'domain-human',
        caseId: `case-${topic}`,
        analysis: analyzeQl7SupportRequest({
          text: `${topic} status for my account`,
          locale: 'en',
        }),
        topic,
        now: '2026-07-20T12:01:00.000Z',
      })
      const after = collections
        .filter((name) => name !== QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION)
        .map((name) => [name, memoryDb.collection(name).rows.size])

      expect(result).toMatchObject({
        ok: true,
        topic,
        branch: 'source_present',
        readOnly: true,
        storagePrimary: 'mongo',
        businessCollectionsWritten: [],
      })
      expect(after).toEqual(before)
    }
  })

  test('Ads self-status uses verified actor packages without demanding a campaign id first', async () => {
    const userId = 'ads-self-human'
    await seedAdsPackage(memoryDb, userId, {
      packageId: 'pkg-self',
      campaignId: 'campaign-self',
    })
    const before = adsBusinessSizes(memoryDb)
    const result = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      rawFromIds: ['wallet-self-human'],
      text: 'Речь идет о Аккаунте QL7 AI GLOBAL в каком состоянии находится моя реклама?',
      locale: 'ru',
      ts: 4400,
    })
    const after = adsBusinessSizes(memoryDb)

    expect(result).toMatchObject({
      requestTopic: 'ads_campaigns',
      requestSubIntent: 'ads_self_status',
      caseStatus: 'ready_for_diagnostic',
      diagnostic: expect.objectContaining({
        topic: 'ads',
        branch: 'ads_package_active',
        readOnly: true,
        businessCollectionsWritten: [],
      }),
    })
    expect(after).toEqual(before)
    recordQl7SupportScenarioEvidence('ads-self-status-verified-actor', {
      branch: 'ads_package_active',
      businessCollectionsWritten: [],
    }, {
      branch: result.diagnostic?.branch,
      businessSizesUnchanged: JSON.stringify(before) === JSON.stringify(after),
    })
  })

  test('Hebrew input returns a Hebrew RTL answer instead of Ukrainian generic fallback', async () => {
    const result = await createVerifiedSupportUserMessage({
      fromUserId: 'hebrew-human',
      rawFromIds: ['wallet-hebrew-human'],
      text: 'כיצד להשתמש בניתוחי שוק המניות בצורה נכונה?',
      locale: 'uk',
      ts: 4500,
    })
    const thread = await supportRawMessagesFor(memoryDb, 'hebrew-human')
    const reply = thread.find((item) => item.from === QL7_SUPPORT_ID && item.metadata?.supportAutoReply)

    expect(result).toMatchObject({
      requestTopic: 'homepage',
      requestRole: 'how_to_question',
    })
    expect(reply?.metadata?.translationStatus).toBe('translated')
    expect(reply?.text || '').toMatch(/[\u0590-\u05FF]/u)
    expect(reply?.text || '').not.toMatch(/Поки|Зрозумів|Вітаю/)
    recordQl7SupportScenarioEvidence('hebrew-rtl-specialized-reply', {
      detectedLanguage: 'he',
      responseLanguage: 'he',
      noUkrainianGeneric: true,
    }, {
      topic: result.requestTopic,
      text: reply?.text || '',
    })
  })

  test('no-new-fact answers rotate instead of repeating the same phrase verbatim', async () => {
    const userId = 'repeat-human'
    await createVerifiedSupportUserMessage({
      fromUserId: userId,
      text: 'Проблемы с рекламой',
      locale: 'ru',
      ts: 4600,
    })
    const firstNoFact = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      text: 'нет',
      locale: 'ru',
      ts: 4700,
    })
    const secondNoFact = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      text: 'нет',
      locale: 'ru',
      ts: 4800,
    })
    const replies = (await supportRawMessagesFor(memoryDb, userId))
      .filter((item) => item.from === QL7_SUPPORT_ID && item.metadata?.responseCode === 'no_new_fact:ads_campaigns')
      .map((item) => item.text)

    expect(firstNoFact.productionDelivery?.responseCode).toBe('no_new_fact:ads_campaigns')
    expect(secondNoFact.productionDelivery?.responseCode).toBe('no_new_fact:ads_campaigns')
    expect(firstNoFact.productionDelivery?.text).not.toBe(secondNoFact.productionDelivery?.text)
    expect(replies.length).toBeGreaterThanOrEqual(2)
    expect(new Set(replies).size).toBeGreaterThan(1)
  })

  test('runs the complete read-only Ads diagnostic branch matrix without touching business collections', async () => {
    expect(QL7_SUPPORT_ADS_DIAGNOSTIC_BRANCHES).toEqual(expect.arrayContaining([
      'ads_package_missing',
      'ads_package_active',
      'ads_package_expired',
      'ads_campaign_active',
      'ads_campaign_finished',
      'ads_metrics_ok',
      'ads_zero_metrics',
      'ads_multiple_packages',
      'foreign_account',
      'mongo_unavailable',
      'timeout',
    ]))

    const matrix = [
      ['ads_package_missing', async () => ({ userId: 'ads-missing', text: 'моя реклама' })],
      ['ads_package_active', async () => {
        await memoryDb.collection('ads_kv').insertOne({
          _id: 'ads:package:only-active',
          value: { id: 'only-active', userId: 'ads-only-active', status: 'active', expiresAt: '2026-08-20T00:00:00.000Z' },
        })
        return { userId: 'ads-only-active', text: 'моя реклама' }
      }],
      ['ads_package_expired', async () => {
        await memoryDb.collection('ads_kv').insertOne({
          _id: 'ads:package:expired',
          value: { id: 'expired', userId: 'ads-expired', status: 'active', expiresAt: '2026-07-01T00:00:00.000Z' },
        })
        return { userId: 'ads-expired', text: 'моя реклама' }
      }],
      ['ads_campaign_active', async () => {
        await seedAdsPackage(memoryDb, 'ads-campaign-active', { packageId: 'pkg-ca', campaignId: 'camp-ca', impressions: 0, clicks: 0 })
        return { userId: 'ads-campaign-active', text: 'campaign camp-ca', expectedEntity: { campaignId: 'camp-ca' } }
      }],
      ['ads_campaign_finished', async () => {
        await seedAdsPackage(memoryDb, 'ads-campaign-finished', { packageId: 'pkg-cf', campaignId: 'camp-cf', campaignStatus: 'finished', impressions: 0, clicks: 0 })
        return { userId: 'ads-campaign-finished', text: 'campaign camp-cf' }
      }],
      ['ads_metrics_ok', async () => {
        await seedAdsPackage(memoryDb, 'ads-metrics-ok', { packageId: 'pkg-mo', campaignId: 'camp-mo' })
        return { userId: 'ads-metrics-ok', text: 'покажи метрики моей рекламной кампании' }
      }],
      ['ads_zero_metrics', async () => {
        await seedAdsPackage(memoryDb, 'ads-zero', { packageId: 'pkg-zero', campaignId: 'camp-zero', impressions: 0, clicks: 0 })
        return { userId: 'ads-zero', text: 'покажи метрики моей рекламной кампании' }
      }],
      ['ads_multiple_packages', async () => {
        await memoryDb.collection('ads_kv').insertOne({ _id: 'ads:package:multi-a', value: { id: 'multi-a', userId: 'ads-multi', status: 'active' } })
        await memoryDb.collection('ads_kv').insertOne({ _id: 'ads:package:multi-b', value: { id: 'multi-b', userId: 'ads-multi', status: 'active' } })
        return { userId: 'ads-multi', text: 'моя реклама' }
      }],
      ['timeout', async () => ({ userId: 'ads-timeout', text: 'моя реклама', timeoutMs: 0 })],
    ]

    for (const [branch, setup] of matrix) {
      const { userId, text, timeoutMs = 2500, expectedEntity = null } = await setup()
      const before = adsBusinessSizes(memoryDb)
      const analysis = analyzeQl7SupportRequest({ text, locale: 'ru' })
      if (expectedEntity) expect(analysis.entities).toMatchObject(expectedEntity)
      const result = await runQl7SupportAdsDiagnostic({
        database: memoryDb,
        userId,
        caseId: `case-${branch}`,
        analysis,
        now: '2026-07-20T11:00:00.000Z',
        timeoutMs,
      })
      const after = adsBusinessSizes(memoryDb)
      expect(result).toMatchObject({
        topic: 'ads',
        branch,
        readOnly: true,
        storagePrimary: 'mongo',
        businessCollectionsWritten: [],
      })
      expect(after).toEqual(before)
    }

    await seedAdsPackage(memoryDb, 'ads-owner', { packageId: 'pkg-foreign', campaignId: 'camp-foreign' })
    const foreign = await runQl7SupportAdsDiagnostic({
      database: memoryDb,
      userId: 'ads-stranger',
      caseId: 'case-foreign-account-hidden',
      analysis: analyzeQl7SupportRequest({ text: 'package pkg-foreign', locale: 'en' }),
      now: '2026-07-20T11:00:00.000Z',
    })
    expect(foreign).toMatchObject({
      topic: 'ads',
      branch: 'ads_package_missing',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsWritten: [],
    })
    expect(foreign.evidence).toMatchObject({ packageCount: 0, campaignCount: 0 })

    const unavailable = await runQl7SupportAdsDiagnostic({
      database: null,
      userId: 'ads-mongo-unavailable',
      caseId: 'case-ads-mongo-unavailable',
      analysis: analyzeQl7SupportRequest({ text: 'моя реклама', locale: 'ru' }),
    })
    expect(unavailable).toMatchObject({
      ok: false,
      branch: 'mongo_unavailable',
      readOnly: true,
      businessCollectionsWritten: [],
    })
  })

  test('runs the complete read-only QCoin diagnostic branch matrix without touching business collections', async () => {
    const expectedBranches = [
      'invoice_missing',
      'pending',
      'paid_without_webhook',
      'webhook_without_ledger',
      'ledger_balance_ok',
      'credit_failed',
      'underpaid',
      'invalid',
      'multiple_invoices',
      'foreign_account',
      'timeout',
    ]
    expect(QL7_SUPPORT_QCOIN_DIAGNOSTIC_BRANCHES).toEqual(expect.arrayContaining([
      ...expectedBranches,
      'mongo_unavailable',
    ]))

    for (const branch of expectedBranches) {
      const userId = `diag-${branch}`
      const invoiceId = await seedQcoinDiagnosticBranch(memoryDb, branch, userId)
      const before = qcoinBusinessSizes(memoryDb)
      const result = await runQl7SupportQcoinDiagnostic({
        database: memoryDb,
        userId,
        caseId: `case-${branch}`,
        analysis: analyzeQl7SupportRequest({
          text: `QCoin invoice ${invoiceId} did not credit`,
          locale: 'en',
        }),
        timeoutMs: branch === 'timeout' ? 0 : 2500,
        now: '2026-07-20T11:00:00.000Z',
      })
      const after = qcoinBusinessSizes(memoryDb)

      expect(result).toMatchObject({
        topic: 'qcoin',
        branch,
        readOnly: true,
        storagePrimary: 'mongo',
        businessCollectionsWritten: [],
      })
      expect(after).toEqual(before)
    }

    const unavailable = await runQl7SupportQcoinDiagnostic({
      database: null,
      userId: 'diag-mongo-unavailable',
      caseId: 'case-mongo-unavailable',
      analysis: analyzeQl7SupportRequest({
        text: 'QCoin invoice missing-db failed',
        locale: 'en',
      }),
    })
    expect(unavailable).toMatchObject({
      ok: false,
      branch: 'mongo_unavailable',
      readOnly: true,
      businessCollectionsWritten: [],
    })

    const runs = await memoryDb.collection(QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION).find({ topic: 'qcoin' }).toArray()
    expect(runs).toHaveLength(expectedBranches.length)
    expect(new Set(runs.map((run) => run.branch))).toEqual(new Set(expectedBranches))
  })

  test('support DM launches QCoin read-only diagnostics only after an actionable user reference', async () => {
    const userId = 'human-qcoin-ready'
    await seedQcoinDiagnosticBranch(memoryDb, 'ledger_balance_ok', userId)

    const result = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      rawFromIds: ['wallet-qcoin-ready'],
      text: 'QCoin invoice invoice-ledger_balance_ok paid but I need the balance check',
      locale: 'en',
      ts: 4100,
    })

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'qcoin',
      caseStatus: 'ready_for_diagnostic',
      diagnosticStatus: 'healthy',
      diagnostic: expect.objectContaining({
        branch: 'ledger_balance_ok',
        readOnly: true,
        storagePrimary: 'mongo',
      }),
    })
    const caseDoc = await memoryDb.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: result.caseId })
    expect(caseDoc).toMatchObject({
      lastDiagnosticBranch: 'ledger_balance_ok',
      lastDiagnosticStatus: 'healthy',
      diagnosticStatus: 'completed',
    })
    const supportRows = await supportRawMessagesFor(memoryDb, userId)
    const supportReply = supportRows.find((item) => item.from === QL7_SUPPORT_ID && item.metadata?.supportAutoReply)
    expect(supportReply?.metadata).toMatchObject({
      diagnosticBranch: 'ledger_balance_ok',
      diagnosticRunId: expect.stringContaining('ql7-support-diagnostic:qcoin:'),
    })
  })

  test('valid wallet session answers own QCoin balance from aliases without asking for an ID', async () => {
    const userId = 'balance-human'
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    await memoryDb.collection('qcoin_accounts').insertOne({
      _id: `qcoin:${userId}`,
      userId,
      uid: userId,
      accountId: userId,
      walletAddress: wallet,
      balance: 1777.75,
      updatedAt: '2026-07-20T12:00:00.000Z',
    })

    const before = qcoinBusinessSizes(memoryDb)
    const result = await createVerifiedSupportUserMessage({
      fromUserId: userId,
      rawFromIds: [wallet],
      text: 'Какое состояние моего баланса?',
      locale: 'ru',
      ts: 4120,
    })
    const after = qcoinBusinessSizes(memoryDb)
    const supportRows = await supportRawMessagesFor(memoryDb, userId)
    const supportReply = supportRows.find((item) => item.from === QL7_SUPPORT_ID && item.metadata?.supportAutoReply)
    const card = supportReply?.supportCard || supportReply?.metadata?.supportCard

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'qcoin',
      caseStatus: 'ready_for_diagnostic',
      diagnostic: expect.objectContaining({
        topic: 'qcoin',
        branch: 'qcoin_balance_ok',
        readOnly: true,
        businessCollectionsWritten: [],
        evidence: expect.objectContaining({
          balance: 1777.75,
          accountFound: true,
        }),
      }),
    })
    expect(after).toEqual(before)
    expect(supportReply?.text || '').not.toMatch(/\bID\b|идентификатор|укажите\s+id/i)
    expect(supportReply?.metadata).toMatchObject({
      userMessageId: result.id,
      diagnosticBranch: 'qcoin_balance_ok',
    })
    expect(card).toMatchObject({
      version: 4,
      schema: 'ql7.support.card.v4',
      metrics: [],
      table: expect.objectContaining({
        rows: expect.arrayContaining([
          expect.objectContaining({ key: 'balance', label: 'Баланс', value: '1777.75', tone: 'success' }),
        ]),
      }),
    })
  })

  test('rejects a forged legacy x-forum-user-id on the public support DM route', async () => {
    const request = new Request('http://localhost/api/dm/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forum-user-id': 'human-route-ru',
        'x-forum-locale': 'ru',
      },
      body: JSON.stringify({
        to: QL7_SUPPORT_ID,
        text: 'Привет',
      }),
    })

    const response = await sendDmRoutePost(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload).toMatchObject({
      ok: false,
      error: 'verified_session_required',
    })
    expect(sendSupportEmail).not.toHaveBeenCalled()
    const thread = await supportThreadFor('human-route-ru')
    expect(thread.items).toHaveLength(0)
  })

  test('scheduler plans and sends VIP and ads reminders, weekly metrics, and final summaries from Mongo primary', async () => {
    const now = new Date('2026-07-20T00:00:00.000Z')
    await memoryDb.collection('vip_subscriptions').insertOne({
      _id: 'vip:3d',
      userId: 'vip-user',
      untilISO: '2026-07-23T00:00:00.000Z',
    })
    await memoryDb.collection('vip_subscriptions').insertOne({
      _id: 'vip:expired',
      userId: 'expired-user',
      untilISO: '2026-07-19T00:00:00.000Z',
    })
    await memoryDb.collection('ads_kv').insertOne({
      _id: 'ads:package:pkg-3d',
      value: {
        id: 'pkg-3d',
        userId: 'ads-user',
        packageName: 'Quantum Ads',
        note: 'Launch',
        expiresAt: '2026-07-23T00:00:00.000Z',
      },
    })
    await memoryDb.collection('ads_kv').insertOne({
      _id: 'ads:package:pkg-expired',
      value: {
        id: 'pkg-expired',
        userId: 'ads-user',
        packageName: 'Quantum Ads',
        expiresAt: '2026-07-19T00:00:00.000Z',
      },
    })
    await memoryDb.collection('ads_sets').insertOne({
      _id: 'ads:campaigns:pkg:pkg-expired',
      members: ['campaign-1'],
    })
    await memoryDb.collection('ads_kv').insertOne({
      _id: 'ads:campaign:campaign-1',
      value: {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        userId: 'ads-user',
        name: 'Weekly launch',
      },
    })

    const vipDryRun = await runQl7SupportVipScheduler({ now, dryRun: true })
    const adsDryRun = await runQl7SupportAdsScheduler({ now, dryRun: true })
    expect(vipDryRun).toMatchObject({ ok: true, dryRun: true, planned: 2 })
    expect(adsDryRun.planned).toBeGreaterThanOrEqual(3)

    await runQl7SupportVipScheduler({ now, dryRun: false })
    await runQl7SupportAdsScheduler({ now, dryRun: false })

    await expect(supportEventTypes(memoryDb, 'vip-user')).resolves.toContain('vip_expiring_3d')
    await expect(supportEventTypes(memoryDb, 'expired-user')).resolves.toContain('vip_expired')
    const adsTypes = await supportEventTypes(memoryDb, 'ads-user')
    expect(adsTypes).toEqual(expect.arrayContaining([
      'ads_expiring_3d',
      'ads_final_summary',
      'ads_metrics_weekly',
    ]))
    expect(getAnalyticsForCampaign).toHaveBeenCalled()
  })

  test('broadcast command is env-gated, token-validated, and delivered as official support DM to ecosystem recipients', async () => {
    await memoryDb.collection('profiles').insertOne({ _id: 'profile:user-one', accountId: 'user-one' })
    await memoryDb.collection('qcoin_accounts').insertOne({ _id: 'qcoin:user-two', userId: 'user-two' })
    await memoryDb.collection('forum_user_stats').insertOne({ _id: 'user-three', userId: 'user-three' })

    await expect(resolveQl7SupportBroadcastRecipients()).resolves.toEqual(['user-one', 'user-two', 'user-three'])

    process.env.QL7_SUPPORT_DM_BROADCAST_ENABLED = '1'
    process.env.QL7_SUPPORT_DM_BROADCAST_TOKEN = 'token-123'
    const result = await maybeRunQl7SupportDmBroadcastCommand({
      fromUserId: 'admin-user',
      rawFromIds: ['wallet-admin'],
      text: 'Admin token-123 Ecosystem maintenance starts at 22:00 UTC.',
      locale: 'en',
    })

    expect(result).toMatchObject({
      handled: true,
      ok: true,
      supportBroadcast: true,
      broadcast: { recipients: 3, sent: 3, failed: 0 },
    })
    const broadcastMessages = (await allSupportRawMessages(memoryDb))
      .filter((item) => item.supportEventType === 'broadcast')
    expect(broadcastMessages).toHaveLength(3)
    expect(broadcastMessages.map((item) => item.to).sort()).toEqual(['user-one', 'user-three', 'user-two'])
    const pushDedupeKeys = sendBackgroundPush.mock.calls
      .map((call) => call?.[1]?.dedupeKey)
      .filter((key) => String(key || '').startsWith('ql7-support:broadcast:'))
    expect(pushDedupeKeys).toHaveLength(3)
    expect(new Set(pushDedupeKeys).size).toBe(1)
  })

  test('broadcast command allows media links only after the Admin token gate', async () => {
    await memoryDb.collection('profiles').insertOne({ _id: 'profile:promo-user', accountId: 'promo-user' })
    process.env.QL7_SUPPORT_DM_BROADCAST_ENABLED = '1'
    process.env.QL7_SUPPORT_DM_BROADCAST_TOKEN = 'token-123'
    const mediaUrl = 'https://cdn.quantuml7ai.com/promos/global-ql7-update.mp4'

    await expect(maybeRunQl7SupportDmBroadcastCommand({
      fromUserId: 'admin-user',
      rawFromIds: ['wallet-admin'],
      text: `Admin wrong-token Global promo ${mediaUrl}`,
      locale: 'en',
    })).rejects.toThrow('ql7_support_broadcast_forbidden')
    expect((await allSupportRawMessages(memoryDb)).filter((item) => item.supportEventType === 'broadcast')).toHaveLength(0)

    const result = await maybeRunQl7SupportDmBroadcastCommand({
      fromUserId: 'admin-user',
      rawFromIds: ['wallet-admin'],
      text: `Admin token-123 Global promo ${mediaUrl}`,
      locale: 'en',
    })

    expect(result).toMatchObject({
      handled: true,
      ok: true,
      supportBroadcast: true,
      broadcast: { recipients: 1, sent: 1, failed: 0 },
    })
    const [message] = (await allSupportRawMessages(memoryDb))
      .filter((item) => item.supportEventType === 'broadcast')
    expect(message).toMatchObject({
      from: QL7_SUPPORT_ID,
      to: 'promo-user',
      attachments: [],
      isSystem: true,
      supportThread: true,
    })
    expect(message.text).toContain(mediaUrl)
  })

  test('broadcast recipient discovery dedupes one ecosystem account across Mongo primary sources', async () => {
    await memoryDb.collection('profiles').insertOne({ _id: 'profile:same-user', accountId: 'same-user' })
    await memoryDb.collection('qcoin_accounts').insertOne({ _id: 'qcoin:same-user', userId: 'same-user' })
    await memoryDb.collection('profile_nick_index').insertOne({ _id: 'nick:same-user', ownerUserId: 'same-user' })
    await memoryDb.collection('forum_user_stats').insertOne({ _id: 'same-user', userId: 'same-user' })

    await expect(resolveQl7SupportBroadcastRecipients()).resolves.toEqual(['same-user'])

    process.env.QL7_SUPPORT_DM_BROADCAST_ENABLED = '1'
    process.env.QL7_SUPPORT_DM_BROADCAST_TOKEN = 'token-123'
    const result = await maybeRunQl7SupportDmBroadcastCommand({
      fromUserId: 'admin-user',
      rawFromIds: ['wallet-admin'],
      text: 'Admin token-123 One canonical broadcast only.',
      locale: 'en',
    })

    expect(result).toMatchObject({
      handled: true,
      ok: true,
      supportBroadcast: true,
      broadcast: { recipients: 1, sent: 1, failed: 0 },
    })
    const broadcastMessages = (await allSupportRawMessages(memoryDb))
      .filter((item) => item.supportEventType === 'broadcast')
    expect(broadcastMessages).toHaveLength(1)
    expect(broadcastMessages[0]).toMatchObject({ to: 'same-user' })
    const pushDedupeKeys = sendBackgroundPush.mock.calls
      .map((call) => call?.[1]?.dedupeKey)
      .filter((key) => String(key || '').startsWith('ql7-support:broadcast:'))
    expect(pushDedupeKeys).toHaveLength(1)
  })
})
