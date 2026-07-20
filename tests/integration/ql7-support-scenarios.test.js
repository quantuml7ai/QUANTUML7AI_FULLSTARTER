import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../lib/webPush.js', () => ({
  sendBackgroundPush: vi.fn(async () => ({ ok: true, mocked: true })),
}))

vi.mock('../../lib/supportEmailTransport.js', () => ({
  sendSupportEmail: vi.fn(async () => ({ ok: true, skipped: false, mocked: true })),
}))

vi.mock('../../lib/adsCore.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getAnalyticsForCampaign: vi.fn(async () => ({
      impressionsTotal: 1200,
      clicksTotal: 84,
    })),
  }
})

import dmPrimaryModule from '../../lib/mongo/dm-primary.cjs'
import mongoClientModule from '../../lib/mongo/client.cjs'
import { QL7_SUPPORT_ID } from '../../lib/ql7-support/systemActor.js'
import {
  __setQl7SupportTestDb,
  createQl7SupportUserMessage,
  deliverQl7SupportEvent,
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
  maybeRunQl7SupportDmBroadcastCommand,
  resolveQl7SupportBroadcastRecipients,
} from '../../lib/ql7-support/broadcast.js'
import { POST as sendDmRoutePost } from '../../app/api/dm/send/route.js'
import { sendBackgroundPush } from '../../lib/webPush.js'
import { sendSupportEmail } from '../../lib/supportEmailTransport.js'
import { getAnalyticsForCampaign } from '../../lib/adsCore.js'

const dmPrimary = dmPrimaryModule?.default || dmPrimaryModule
const mongoClient = mongoClientModule?.default || mongoClientModule

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
  }
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

describe('QL7 Support scenario smoke delivery', () => {
  let memoryDb
  let mongoSpy

  beforeEach(() => {
    memoryDb = createMemoryDb()
    dmPrimary.__setTestDb(memoryDb)
    __setQl7SupportTestDb(memoryDb)
    __setQl7SupportSchedulerTestDb(memoryDb)
    mongoSpy = vi.spyOn(mongoClient, 'getMongoDb').mockResolvedValue(memoryDb)
    sendBackgroundPush.mockClear()
    sendBackgroundPush.mockResolvedValue({ ok: true, mocked: true })
    sendSupportEmail.mockClear()
    sendSupportEmail.mockResolvedValue({ ok: true, skipped: false, mocked: true })
    getAnalyticsForCampaign.mockClear()
    getAnalyticsForCampaign.mockResolvedValue({ impressionsTotal: 1200, clicksTotal: 84 })
  })

  afterEach(() => {
    dmPrimary.__setTestDb(null)
    __setQl7SupportTestDb(null)
    __setQl7SupportSchedulerTestDb(null)
    mongoSpy?.mockRestore?.()
    delete process.env.QL7_SUPPORT_DM_BROADCAST_ENABLED
    delete process.env.QL7_SUPPORT_DM_BROADCAST_TOKEN
    delete process.env.QL7_SUPPORT_BROADCAST_ADMIN_IDS
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

  test('opens empty support thread with a real localized server greeting after local deletion', async () => {
    const userId = 'empty-thread-user'
    const opened = await deliverQl7SupportEvent({
      userId,
      eventType: 'support_thread_open',
      subjectId: 'open:first',
      locale: 'ru',
      payload: {},
      push: false,
    })
    const repeated = await deliverQl7SupportEvent({
      userId,
      eventType: 'support_thread_open',
      subjectId: 'open:first',
      locale: 'ru',
      payload: {},
      push: false,
    })

    const thread = await supportThreadFor(userId)
    expect(opened).toMatchObject({ ok: true, deduped: false })
    expect(repeated).toMatchObject({ ok: true, deduped: true, id: opened.id })
    expect(thread.items).toHaveLength(1)
    await expect(supportEventTypes(memoryDb, userId)).resolves.toEqual(['support_thread_open'])
    expect(thread.items[0].text.length).toBeGreaterThan(60)
    expect(sendBackgroundPush).not.toHaveBeenCalled()
  })

  test('stores user requests, bridges them safely, and answers with adaptive follow-up context', async () => {
    const first = await createQl7SupportUserMessage({
      fromUserId: 'human-a',
      rawFromIds: ['wallet-a'],
      text: 'VIP x2 premium badge did not activate',
      locale: 'en',
      ts: 1000,
    })
    const second = await createQl7SupportUserMessage({
      fromUserId: 'human-a',
      rawFromIds: ['wallet-a'],
      text: 'VIP premium badge is still inactive, please check again',
      locale: 'en',
      ts: 2000,
    })

    expect(first).toMatchObject({ ok: true, requestTopic: 'vip', requestMode: 'new' })
    expect(second).toMatchObject({ ok: true, requestTopic: 'vip', requestMode: 'followup' })

    const thread = await supportThreadFor('human-a')
    expect(thread.items).toHaveLength(4)
    expect((await supportEventTypes(memoryDb, 'human-a')).filter((eventType) => eventType.startsWith('support_ack_'))).toEqual([
      'support_ack_followup',
      'support_ack_new',
    ])
    expect(thread.items.filter((item) => item.from === 'human-a')).toHaveLength(2)
  })

  test('localizes greeting replies and bridges support DM text through the contact email transport', async () => {
    const result = await createQl7SupportUserMessage({
      fromUserId: 'human-ru',
      rawFromIds: ['wallet-ru'],
      text: 'Привет',
      locale: 'ru',
      ts: 3000,
    })

    expect(result).toMatchObject({
      ok: true,
      requestTopic: 'greeting',
      requestMode: 'new',
      bridge: { ok: true, skipped: false },
    })
    expect(sendSupportEmail).toHaveBeenCalledWith(expect.objectContaining({
      source: 'ql7_support_dm',
      message: 'Привет',
      meta: expect.objectContaining({
        user: 'human-ru',
        locale: 'ru',
        topic: 'greeting',
      }),
    }))

    const thread = await supportThreadFor('human-ru')
    const supportReply = thread.items.find((item) => item.from === QL7_SUPPORT_ID)
    expect(supportReply?.text || '').toMatch(/Здравствуйте|Приветствую|Добрый день/)
    expect(supportReply?.text || '').not.toMatch(/I see this is about|your request/i)
  })

  test('accepts support DM through the public send route with the selected user locale', async () => {
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

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      ok: true,
      supportThread: true,
      supportBridgeOk: true,
    })
    expect(sendSupportEmail).toHaveBeenCalledWith(expect.objectContaining({
      source: 'ql7_support_dm',
      message: 'Привет',
      meta: expect.objectContaining({
        user: 'human-route-ru',
        locale: 'ru',
        topic: 'greeting',
      }),
    }))

    const thread = await supportThreadFor('human-route-ru')
    const supportReply = thread.items.find((item) => item.from === QL7_SUPPORT_ID)
    expect(supportReply?.text || '').toMatch(/Здравствуйте|Приветствую|Добрый день/)
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
})
