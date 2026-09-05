import crypto from 'node:crypto'
import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import dmPrimaryModule from '../../../lib/mongo/dm-primary.cjs'
import { normalizeAttachments } from '../../../app/api/dm/_db.js'

const dmPrimary = dmPrimaryModule?.default || dmPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.map(String).includes(String(actual))
    if ('$exists' in expected) return expected.$exists ? actual !== undefined : actual === undefined
    if ('$lt' in expected) return Number(actual) < Number(expected.$lt)
  }
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((item) => matches(doc, item))
  return Object.entries(filter).every(([key, expected]) => matchesValue(getValue(doc, key), expected))
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
        const id = filter?._id || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    async bulkWrite(ops = []) {
      for (const op of ops) {
        if (op.updateOne) await this.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: op.updateOne.upsert })
      }
      return { ok: 1, insertedCount: 0, modifiedCount: ops.length }
    },
    async findOneAndUpdate(filter, update, options = {}) {
      await this.updateOne(filter, update, { upsert: options.upsert })
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async findOne(filter) {
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    find(filter = {}) {
      let projection = null
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
          list = list.slice(0, limitValue)
          if (projection) {
            list = list.map((row) => {
              const out = {}
              for (const [key, enabled] of Object.entries(projection)) if (enabled) out[key] = row[key]
              return out
            })
          }
          return list.map((row) => ({ ...row }))
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

function buildSignedSupportCard(overrides = {}) {
  const body = {
    version: 4,
    schema: 'ql7.support.card',
    title: 'Need details',
    summary: 'Please clarify the request.',
    ...overrides,
  }
  return {
    ...body,
    integrity: {
      algorithm: 'sha256',
      signature: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),
      signedAt: '2026-08-23T10:05:20.000Z',
      schema: 'ql7.support.card',
    },
  }
}

describe('dm Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    dmPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    dmPrimary.__setTestDb(null)
  })

  test('stores messages and mailbox/thread indexes in Mongo primary collections', async () => {
    const id = await dmPrimary.nextMsgId()
    expect(id).toBe('1')

    const msg = { id, from: 'alice', to: 'bob', text: 'hello', attachments: [], ts: 1000 }
    await dmPrimary.saveMessage(msg)
    await dmPrimary.addMessageIndexes({ msg, fromIds: ['alice'], toIds: ['bob'], score: msg.ts })

    await expect(dmPrimary.getMessage(id)).resolves.toMatchObject({ id, from: 'alice', to: 'bob', text: 'hello' })
  })

  test('keeps an existing QL7 Support thread in the chronological dialog projection', async () => {
    const peer = { id: '1', from: 'alice', to: 'bob', text: 'peer', attachments: [], ts: 1000 }
    const support = {
      id: '2',
      from: 'ql7-support',
      to: 'bob',
      text: 'support reply',
      attachments: [],
      ts: 2000,
      supportThread: true,
      isSystem: true,
      systemRole: 'ql7_support_system',
    }
    await dmPrimary.saveMessage(peer)
    await dmPrimary.addMessageIndexes({ msg: peer, fromIds: ['alice'], toIds: ['bob'], score: peer.ts })
    await dmPrimary.saveMessage(support)
    await dmPrimary.addMessageIndexes({ msg: support, fromIds: ['ql7-support'], toIds: ['bob'], score: support.ts })

    const dialogs = await dmPrimary.readDialogsLikeRedis({
      uid: 'bob',
      rawUidHeader: 'bob',
      rawUid: 'bob',
      limit: 5,
    })

    expect(dialogs.items.map((item) => item.userId)).toEqual(['ql7-support', 'alice'])
    expect(dialogs.items[0]).toMatchObject({
      unreadCount: 1,
      lastMessage: { id: '2', supportThread: true },
    })
  })

  test('loads canonical signed Support replies in a strict thread and rejects a tampered card', async () => {
    const userMessage = {
      id: '20',
      from: 'bob',
      to: 'ql7-support',
      text: 'How do I buy QCoin?',
      attachments: [],
      ts: 2000,
      supportThread: true,
      threadCanonicalKey: 'dm:thread:bob:ql7-support',
      endpointA: 'bob',
      endpointB: 'ql7-support',
      endpointProofVersion: 2,
    }
    const supportReply = {
      id: '21',
      from: 'ql7-support',
      to: 'bob',
      text: 'Open the QCoin purchase screen.',
      attachments: [],
      ts: 2001,
      supportThread: true,
      isSystem: true,
      systemRole: 'support',
      supportEventType: 'support_reply',
      supportCard: buildSignedSupportCard(),
      threadCanonicalKey: 'dm:thread:bob:ql7-support',
      endpointA: 'ql7-support',
      endpointB: 'bob',
      endpointProofVersion: 2,
    }
    const tamperedReply = {
      ...supportReply,
      id: '22',
      text: 'Tampered text',
      ts: 2002,
      supportCard: { ...supportReply.supportCard, summary: 'Changed after signing.' },
    }

    for (const msg of [userMessage, supportReply, tamperedReply]) {
      await dmPrimary.saveMessage(msg)
      await dmPrimary.addMessageIndexes({ msg, fromIds: [msg.from], toIds: [msg.to], score: msg.ts })
    }

    const thread = await dmPrimary.readThreadLikeRedis({
      me: 'bob',
      rawMeHeader: 'bob',
      rawMe: 'bob',
      rawWithInput: 'ql7-support',
      rawWith: 'ql7-support',
      withId: 'ql7-support',
      strictSupportThread: true,
      limit: 5,
    })

    expect(thread.items.map((item) => item.id)).toEqual(['21', '20'])
    expect(thread.items[0]).toMatchObject({
      isSystem: true,
      systemRole: 'ql7_support_system',
      supportCard: { version: 4, schema: 'ql7.support.card' },
    })
  })

  test('paginates DM thread history with limit-plus-one and same-score cursor ids', async () => {
    for (let n = 1; n <= 12; n += 1) {
      const msg = {
        id: String(n),
        from: n % 2 ? 'alice' : 'bob',
        to: n % 2 ? 'bob' : 'alice',
        text: `message ${n}`,
        attachments: [],
        ts: 1000,
      }
      await dmPrimary.saveMessage(msg)
      await dmPrimary.addMessageIndexes({ msg, fromIds: [msg.from], toIds: [msg.to], score: 1000 })
    }

    const first = await dmPrimary.readThreadLikeRedis({
      me: 'bob',
      rawMeHeader: 'bob',
      rawMe: 'bob',
      rawWithInput: 'alice',
      rawWith: 'alice',
      withId: 'alice',
      limit: 5,
    })

    expect(first.items.map((item) => item.id)).toEqual(['12', '11', '10', '9', '8'])
    expect(first.hasMore).toBe(true)
    expect(first.nextCursor).toBe('1000|8')

    const second = await dmPrimary.readThreadLikeRedis({
      me: 'bob',
      rawMeHeader: 'bob',
      rawMe: 'bob',
      rawWithInput: 'alice',
      rawWith: 'alice',
      withId: 'alice',
      limit: 5,
      cursorRaw: first.nextCursor,
    })

    expect(second.items.map((item) => item.id)).toEqual(['7', '6', '5', '4', '3'])
    expect(second.hasMore).toBe(true)
    expect(second.nextCursor).toBe('1000|3')

    const third = await dmPrimary.readThreadLikeRedis({
      me: 'bob',
      rawMeHeader: 'bob',
      rawMe: 'bob',
      rawWithInput: 'alice',
      rawWith: 'alice',
      withId: 'alice',
      limit: 5,
      cursorRaw: second.nextCursor,
    })

    expect(third.items.map((item) => item.id)).toEqual(['2', '1'])
    expect(third.hasMore).toBe(false)
    expect(third.nextCursor).toBeNull()
  })

  test('preserves safe front-camera metadata and forces server-pending moderation for DM videos', () => {
    const normalized = normalizeAttachments([
      {
        url: 'https://cdn.example.test/camera.webm',
        type: 'video',
        cameraFacingMode: 'user',
        frontCameraMirror: true,
        mirrorVideo: true,
        moderationStatus: 'approved',
        arbitraryPayload: 'drop-me',
      },
      {
        url: 'https://cdn.example.test/regular.webm',
        type: 'video',
        cameraFacingMode: 'environment',
      },
    ])

    expect(normalized[0]).toEqual({
      url: 'https://cdn.example.test/camera.webm',
      type: 'video',
      cameraFacingMode: 'user',
      frontCameraMirror: true,
      mirrorVideo: true,
      moderationStatus: 'pending',
    })
    expect(normalized[1]).toEqual({
      url: 'https://cdn.example.test/regular.webm',
      type: 'video',
      moderationStatus: 'pending',
    })
  })

  test('writes canonical DM principals once and never grows dm_aliases', async () => {
    const checksum = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const lower = checksum.toLowerCase()
    const msg = { id: 'canonical-1', from: lower, to: '777001', text: 'canonical', attachments: [], ts: 1500 }

    await expect(dmPrimary.addAliasesFor(checksum, [lower, `wallet:${lower}`])).resolves.toBe(false)
    expect(memoryDb.collection('dm_aliases').rows.size).toBe(0)

    await dmPrimary.saveMessage(msg)
    await dmPrimary.addMessageIndexes({
      msg,
      fromIds: [lower, `wallet:${lower}`],
      toIds: ['777001', 'telegram:777001'],
      score: msg.ts,
    })

    await expect(dmPrimary.getMessage('canonical-1')).resolves.toMatchObject({
      from: checksum,
      to: '777001',
    })
    expect(memoryDb.collection('dm_mailbox_entries').rows.has(`mailbox:${checksum}:outbox:canonical-1`)).toBe(true)
    expect(memoryDb.collection('dm_mailbox_entries').rows.has('mailbox:777001:inbox:canonical-1')).toBe(true)
    expect(memoryDb.collection('dm_mailbox_entries').rows.size).toBe(2)
  })

  test('marks delivery only for incoming receiver-visible messages', async () => {
    const items = [
      { id: '1', from: 'alice', to: 'bob', ts: 1000, deliveredTs: 0 },
      { id: '2', from: 'bob', to: 'alice', ts: 1001, deliveredTs: 0 },
    ]

    await dmPrimary.markDeliveredForItems({ items, receiverIds: ['bob'], deliveredTs: 2000 })
    expect(items[0].deliveredTs).toBe(2000)
    expect(items[1].deliveredTs).toBe(0)

    const delivered = await dmPrimary.readDeliveredMap(['1', '2'])
    expect(delivered.get('1')).toBe(2000)
    expect(delivered.has('2')).toBe(false)
  })

  test('keeps seen timestamps monotonic and supports block/unblock state', async () => {
    await dmPrimary.markSeenForPairs(['bob'], ['alice'], 3000)
    await dmPrimary.markSeenForPairs(['bob'], ['alice'], 2500)
    await expect(dmPrimary.readLastSeenMax(['bob'], ['alice'])).resolves.toBe(3000)

    await dmPrimary.setBlock('bob', ['alice'])
    await expect(dmPrimary.isBlockedBy(['bob'], ['alice'])).resolves.toBe(true)
    await dmPrimary.clearBlock('bob', ['alice'])
    await expect(dmPrimary.isBlockedBy(['bob'], ['alice'])).resolves.toBe(false)
  })

  test('updates migrated receipt rows by business keys instead of inserting duplicate ids', async () => {
    await memoryDb.collection('dm_last_seen').updateOne(
      { _id: 'legacy-seen-row' },
      { $set: { me: 'bob', withId: 'alice', lastSeenTs: 1000 } },
      { upsert: true },
    )
    await memoryDb.collection('dm_deliveries').updateOne(
      { _id: 'legacy-delivery-row' },
      { $set: { messageId: 'm1', deliveredTs: 1000 } },
      { upsert: true },
    )
    await memoryDb.collection('dm_messages').updateOne(
      { _id: 'legacy-message-row' },
      { $set: { messageId: 'm1', id: 'm1', from: 'alice', to: 'bob', text: 'old', ts: 1000 } },
      { upsert: true },
    )

    await dmPrimary.markSeenForPairs(['bob'], ['alice'], 2500)
    await dmPrimary.markDelivered(['m1'], 3000)

    expect(memoryDb.collection('dm_last_seen').rows.size).toBe(1)
    expect(memoryDb.collection('dm_deliveries').rows.size).toBe(1)
    await expect(dmPrimary.readLastSeenMax(['bob'], ['alice'])).resolves.toBe(2500)
    await expect(dmPrimary.readDeliveredMap(['m1'])).resolves.toEqual(new Map([['m1', 3000]]))

    await dmPrimary.deleteMessage('m1')
    await expect(dmPrimary.getMessage('m1')).resolves.toBeNull()
  })

  test('deleteDialog preserves archive fallback when thread index is missing but mailboxes contain the dialog', async () => {
    const msg = { id: '10', from: 'alice', to: 'bob', text: 'drifted', attachments: [], ts: 4000 }
    await dmPrimary.saveMessage(msg)

    await memoryDb.collection('dm_mailbox_entries').bulkWrite([
      {
        updateOne: {
          filter: { _id: 'mailbox:alice:outbox:10' },
          update: { $set: { uid: 'alice', box: 'outbox', messageId: '10', score: 4000 } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: 'mailbox:bob:inbox:10' },
          update: { $set: { uid: 'bob', box: 'inbox', messageId: '10', score: 4000 } },
          upsert: true,
        },
      },
    ])

    const result = await dmPrimary.deleteDialog({ meIds: ['alice'], withIds: ['bob'], deletedAt: 5000 })

    expect(result.count).toBe(1)
    await expect(dmPrimary.getMessage('10')).resolves.toBeNull()

    const aliceTombstone = await memoryDb.collection('dm_deleted_dialogs').findOne({ _id: 'deleted:alice:bob' })
    const bobTombstone = await memoryDb.collection('dm_deleted_dialogs').findOne({ _id: 'deleted:bob:alice' })
    expect(aliceTombstone?.deletedAt).toBe(5000)
    expect(bobTombstone?.deletedAt).toBe(5000)
  })

  test('deleteDialog updates migrated tombstones by participant pair', async () => {
    await memoryDb.collection('dm_deleted_dialogs').updateOne(
      { _id: 'legacy-tombstone-row' },
      { $set: { uid: 'alice', userId: 'alice', peerId: 'bob', deletedAt: 1000 } },
      { upsert: true },
    )

    await dmPrimary.deleteDialog({ meIds: ['alice'], withIds: ['bob'], deletedAt: 6000 })

    const aliceRows = Array.from(memoryDb.collection('dm_deleted_dialogs').rows.values())
      .filter((row) => row.uid === 'alice' && row.peerId === 'bob')
    expect(aliceRows).toHaveLength(1)
    expect(aliceRows[0].deletedAt).toBe(6000)
  })
})
