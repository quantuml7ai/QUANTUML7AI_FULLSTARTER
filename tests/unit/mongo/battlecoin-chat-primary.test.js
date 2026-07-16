import { createRequire } from 'node:module'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const require = createRequire(import.meta.url)
const battleChatPrimary = require('../../../lib/mongo/battlecoin-chat-primary.cjs')
const battleChatAuth = require('../../../lib/auth/battlecoin-chat-auth.cjs')
const profilePrimary = require('../../../lib/mongo/profile-primary.cjs')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getByPath(row, path) {
  return String(path || '').split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), row)
}

function matches(row, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((part) => matches(row, part))
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or') continue
    const actual = getByPath(row, key)
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) {
        if (!expected.$in.includes(actual)) return false
        continue
      }
      if ('$gt' in expected) {
        if (!(actual > expected.$gt)) return false
        continue
      }
    }
    if (actual !== expected) return false
  }
  return true
}

function compareRows(a, b, sort = {}) {
  for (const [key, dir] of Object.entries(sort)) {
    const av = getByPath(a, key)
    const bv = getByPath(b, key)
    if (av === bv) continue
    return av > bv ? Number(dir) : -Number(dir)
  }
  return 0
}

class MemoryCursor {
  constructor(rows) {
    this.rows = rows
    this.sortSpec = null
    this.limitValue = 0
  }
  sort(spec) {
    this.sortSpec = spec
    return this
  }
  limit(value) {
    this.limitValue = Number(value) || 0
    return this
  }
  async toArray() {
    let rows = this.rows.slice()
    if (this.sortSpec) rows = rows.sort((a, b) => compareRows(a, b, this.sortSpec))
    if (this.limitValue > 0) rows = rows.slice(0, this.limitValue)
    return clone(rows)
  }
}

class MemoryCollection {
  constructor() {
    this.rows = []
  }
  async createIndex() {}
  find(filter) {
    return new MemoryCursor(this.rows.filter((row) => matches(row, filter)))
  }
  async findOne(filter) {
    const row = this.rows.find((item) => matches(item, filter))
    return row ? clone(row) : null
  }
  async insertOne(doc) {
    if (this.rows.some((row) => row._id === doc._id)) {
      const error = new Error('duplicate_key')
      error.code = 11000
      throw error
    }
    this.rows.push(clone(doc))
    return { insertedId: doc._id }
  }
  async updateOne(filter, update, options = {}) {
    let index = this.rows.findIndex((row) => matches(row, filter))
    if (index < 0 && options.upsert) {
      const doc = { ...(update.$setOnInsert || {}), ...(update.$set || {}) }
      this.rows.push(clone(doc))
      return { upsertedCount: 1, modifiedCount: 0 }
    }
    if (index < 0) return { matchedCount: 0, modifiedCount: 0 }
    const next = { ...this.rows[index], ...(update.$set || {}) }
    if (update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) next[key] = Number(next[key] || 0) + Number(value || 0)
    }
    this.rows[index] = clone(next)
    return { matchedCount: 1, modifiedCount: 1 }
  }
  async deleteOne(filter) {
    const before = this.rows.length
    this.rows = this.rows.filter((row, index) => index !== this.rows.findIndex((item) => matches(item, filter)))
    return { deletedCount: before - this.rows.length }
  }
  async deleteMany(filter) {
    const before = this.rows.length
    this.rows = this.rows.filter((row) => !matches(row, filter))
    return { deletedCount: before - this.rows.length }
  }
}

function createDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, new MemoryCollection())
      return collections.get(name)
    },
  }
}

describe('Battle Chat Mongo primary adapter', () => {
  let db

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createDb()
    battleChatPrimary.__setTestDb(db)
    profilePrimary.__setTestDb(db)
    const readProfileMock = async (accountId) => {
      if (accountId === '0xprofile') return { nickname: 'Trader One', avatar: '/uploads/trader.png', vipActive: true, vipUntil: Date.now() + 86_400_000 }
      if (accountId === '0xtech') return { nickname: '0x0000000000000000000000000000000000000001', avatar: '' }
      return {}
    }
    vi.spyOn(profilePrimary, 'readProfile').mockImplementation(readProfileMock)
    vi.spyOn(profilePrimary, 'getUserProfile').mockImplementation(readProfileMock)
  })

  test('stores messages in Mongo and lists them oldest to newest', async () => {
    const first = await battleChatPrimary.sendBattleChatMessage({
      actor: { accountId: '0xprofile', identityIds: ['0xprofile'] },
      text: 'BTCUSDT LONG x10 😄',
      clientMutationId: 'm1',
      now: 1000,
    })
    const second = await battleChatPrimary.sendBattleChatMessage({
      actor: { accountId: '0xother', identityIds: ['0xother'] },
      text: 'Short squeeze?',
      clientMutationId: 'm2',
      now: 12_000,
    })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: '0xprofile' })
    expect(page.storagePrimary).toBe('mongo')
    expect(page.redisRole).toBe('accelerator-only')
    expect(page.messages.map((row) => row.text)).toEqual(['BTCUSDT LONG x10 😄', 'Short squeeze?'])
    expect(page.messages[0].author).toMatchObject({ kind: 'profile', nickname: 'Trader One' })
    expect(page.messages[0].author.vipActive).toBe(true)
  })

  test('hydrates live VIP hints onto stored Battle Chat author snapshots', async () => {
    await db.collection('battlecoin_chat_messages').insertOne({
      _id: 'old-vip',
      messageId: 'old-vip',
      channel: 'global',
      status: 'visible',
      text: 'Old snapshot',
      authorAccountId: '0xprofile',
      authorSnapshot: {
        kind: 'profile',
        key: 'battlechat-author:old',
        nickname: 'Trader One',
        avatar: '/uploads/trader.png',
      },
      likesCount: 0,
      createdAtMs: 1000,
      updatedAtMs: 1000,
    })

    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: '0xother' })
    expect(page.messages[0].author).toMatchObject({
      accountId: '0xprofile',
      vipActive: true,
    })
    expect(Number(page.messages[0].author.vipUntil || 0)).toBeGreaterThan(Date.now())
  })

  test('hydrates Battle Chat VIP author hints from subscription entitlement', async () => {
    const untilISO = new Date(Date.now() + 86_400_000).toISOString()
    await db.collection('vip_subscriptions').insertOne({
      _id: 'vip:0xsubvip',
      accountId: '0xsubvip',
      untilISO,
      active: true,
    })
    await db.collection('battlecoin_chat_messages').insertOne({
      _id: 'sub-vip',
      messageId: 'sub-vip',
      channel: 'global',
      status: 'visible',
      text: 'Subscription snapshot',
      authorAccountId: '0xsubvip',
      authorSnapshot: {
        kind: 'profile',
        key: 'battlechat-author:sub',
        nickname: 'Sub Vip',
        avatar: '/uploads/sub.png',
        vipActive: false,
      },
      likesCount: 0,
      createdAtMs: 1000,
      updatedAtMs: 1000,
    })

    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: '0xother' })
    expect(page.messages[0].author).toMatchObject({
      accountId: '0xsubvip',
      vipActive: true,
    })
    expect(Number(page.messages[0].author.vipUntil || 0)).toBeGreaterThan(Date.now())
  })

  test('keeps send cooldown and idempotent client mutation in Mongo', async () => {
    const actor = { accountId: '0xprofile', identityIds: ['0xprofile'] }
    const first = await battleChatPrimary.sendBattleChatMessage({ actor, text: 'First', clientMutationId: 'same', now: 1000 })
    const duplicate = await battleChatPrimary.sendBattleChatMessage({ actor, text: 'First changed', clientMutationId: 'same', now: 2000 })
    const cooldown = await battleChatPrimary.sendBattleChatMessage({ actor, text: 'Too soon', clientMutationId: 'next', now: 3000 })

    expect(first.ok).toBe(true)
    expect(duplicate).toMatchObject({ ok: true, duplicate: true })
    expect(cooldown).toMatchObject({ ok: false, error: 'battlecoin_chat_cooldown', storagePrimary: 'mongo' })
    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: actor.accountId })
    expect(page.messages).toHaveLength(1)
  })

  test('rejects unauthenticated sends before writing anything', async () => {
    const result = await battleChatPrimary.sendBattleChatMessage({
      actor: null,
      text: 'I should not be written',
      clientMutationId: 'guest',
      now: 1000,
    })
    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: '' })

    expect(result).toMatchObject({ ok: false, error: 'battlecoin_chat_auth_required', status: 401 })
    expect(page.messages).toHaveLength(0)
  })

  test('toggles likes and returns viewer-specific myLiked flag', async () => {
    const sent = await battleChatPrimary.sendBattleChatMessage({
      actor: { accountId: '0xprofile', identityIds: ['0xprofile'] },
      text: 'Like this',
      clientMutationId: 'like-me',
      now: 1000,
    })
    const liked = await battleChatPrimary.toggleBattleChatLike({
      actor: { accountId: '0xother', identityIds: ['0xother'] },
      messageId: sent.message.id,
      like: true,
      now: 2000,
    })
    const page = await battleChatPrimary.listBattleChatMessages({ viewerAccountId: '0xother' })

    expect(liked).toMatchObject({ ok: true, liked: true, likesCount: 1, storagePrimary: 'mongo' })
    expect(page.messages[0]).toMatchObject({ likesCount: 1, myLiked: true })
  })

  test('falls back to anonymous public identity for technical nicknames', async () => {
    const sent = await battleChatPrimary.sendBattleChatMessage({
      actor: { accountId: '0xtech', identityIds: ['0xtech', 'telegram:123456'] },
      text: 'Anon hello',
      clientMutationId: 'anon',
      now: 1000,
    })
    expect(sent.message.author).toMatchObject({
      kind: 'anonymous',
      nickname: '',
      avatar: '/anonymous/anonymous.png',
    })
    expect(JSON.stringify(sent.message.author)).not.toContain('telegram:123456')
  })

  test('hydrates linked Telegram authors from the canonical profile instead of stale anonymous snapshots', async () => {
    vi.restoreAllMocks()
    profilePrimary.__setTestDb(db)
    await db.collection('profiles').insertOne({
      _id: 'profile:wallet-linked',
      accountId: 'wallet-linked',
      nickname: 'QL7 AI GLOBAL',
      icon: '/uploads/ql7.png',
      updatedAtMs: 1000,
      updatedAt: new Date(1000).toISOString(),
    })
    await db.collection('account_aliases').insertOne({
      _id: 'alias:telegram:777001',
      alias: 'telegram:777001',
      aliasId: 'telegram:777001',
      aliasValue: '777001',
      accountId: 'wallet-linked',
      canonicalAccountId: 'wallet-linked',
      updatedAtMs: 1000,
      updatedAt: new Date(1000).toISOString(),
    })
    await db.collection('battlecoin_chat_messages').insertOne({
      _id: 'linked-message',
      messageId: 'linked-message',
      channel: 'global',
      status: 'visible',
      text: 'Linked hello',
      authorAccountId: 'wallet-linked',
      authorIdentityIds: ['wallet-linked', 'telegram:777001', '777001'],
      authorSnapshot: {
        kind: 'anonymous',
        key: 'battlechat-author:old',
        nickname: '',
        avatar: '/anonymous/anonymous.png',
      },
      likesCount: 0,
      createdAtMs: 1000,
      updatedAtMs: 1000,
    })

    const page = await battleChatPrimary.listBattleChatMessages({
      viewerAccountId: 'wallet-linked',
      viewerIdentityIds: ['telegram:777001', '777001'],
    })

    expect(page.messages[0].author).toMatchObject({
      kind: 'profile',
      accountId: 'wallet-linked',
      nickname: 'QL7 AI GLOBAL',
      avatar: '/uploads/ql7.png',
    })
  })

  test('treats Telegram alias likes as the same viewer like and prevents duplicate increments', async () => {
    vi.restoreAllMocks()
    profilePrimary.__setTestDb(db)
    await db.collection('battlecoin_chat_messages').insertOne({
      _id: 'alias-like-message',
      messageId: 'alias-like-message',
      channel: 'global',
      status: 'visible',
      text: 'Alias like',
      authorAccountId: 'wallet-linked',
      authorIdentityIds: ['wallet-linked', 'telegram:777001', '777001'],
      authorSnapshot: {
        kind: 'profile',
        key: 'battlechat-author:linked',
        accountId: 'wallet-linked',
        nickname: 'QL7 AI GLOBAL',
        avatar: '/uploads/ql7.png',
      },
      likesCount: 1,
      createdAtMs: 1000,
      updatedAtMs: 1000,
    })
    await db.collection('battlecoin_chat_likes').insertOne({
      _id: 'like:alias-like-message:telegram',
      messageId: 'alias-like-message',
      accountId: 'telegram:777001',
      status: 'liked',
      createdAtMs: 1000,
      updatedAtMs: 1000,
    })

    const actor = { accountId: 'wallet-linked', identityIds: ['wallet-linked', 'telegram:777001', '777001'] }
    const page = await battleChatPrimary.listBattleChatMessages({
      viewerAccountId: actor.accountId,
      viewerIdentityIds: actor.identityIds,
    })
    const likedAgain = await battleChatPrimary.toggleBattleChatLike({
      actor,
      messageId: 'alias-like-message',
      like: true,
      now: 2000,
    })

    expect(page.messages[0]).toMatchObject({ likesCount: 1, myLiked: true })
    expect(likedAgain).toMatchObject({ ok: true, liked: true, likesCount: 1 })
    expect(likedAgain.message.myLiked).toBe(true)
  })
})

describe('Battle Chat auth identity bridge', () => {
  test('prefers linked account headers over raw Telegram Mini App actor', async () => {
    const resolveSpy = vi.spyOn(profilePrimary, 'resolveCanonicalAccountId').mockImplementation(async (raw) => {
      if (String(raw || '') === 'telegram-linked-wallet') return '0xlinked'
      return String(raw || '')
    })
    const aliasesSpy = vi.spyOn(profilePrimary, 'listAliasesForAccount').mockResolvedValue([
      { accountId: '0xlinked', canonicalAccountId: '0xlinked', alias: 'telegram:777001', aliasValue: '777001' },
    ])

    const req = {
      headers: {
        get(name) {
          const key = String(name || '').toLowerCase()
          if (key === 'x-auth-account-id') return 'telegram-linked-wallet'
          if (key === 'x-telegram-init-data') return 'user=%7B%22id%22%3A777001%7D&hash=fake'
          return ''
        },
      },
    }

    const actor = await battleChatAuth.readOptionalBattleChatActor(req, {})

    expect(actor).toMatchObject({
      provider: 'linked-account',
      accountId: '0xlinked',
      rawAccountId: 'telegram-linked-wallet',
    })
    expect(actor.identityIds).toEqual(expect.arrayContaining(['0xlinked', 'telegram-linked-wallet']))

    resolveSpy.mockRestore()
    aliasesSpy.mockRestore()
  })
})
