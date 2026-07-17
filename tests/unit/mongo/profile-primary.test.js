import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import profilePrimaryModule from '../../../lib/mongo/profile-primary.cjs'
import identityContractModule from '../../../lib/identity/ql7IdentityContract.cjs'

const profilePrimary = profilePrimaryModule?.default || profilePrimaryModule
const identityContract = identityContractModule?.default || identityContractModule

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
  return {
    rows,
    async createIndex() { return 'ok' },
    async updateOne(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || update?.$setOnInsert?._id || `auto:${rows.size + 1}`
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
      return { ok: 1, modifiedCount: ops.length }
    },
    async findOne(filter) {
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    find(filter = {}) {
      let sortSpec = null
      let limitValue = Infinity
      const cursor = {
        sort(spec) { sortSpec = spec; return cursor },
        limit(n) { limitValue = Number(n || 0) > 0 ? Number(n) : Infinity; return cursor },
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
          return list.slice(0, limitValue).map((row) => ({ ...row }))
        },
      }
      return cursor
    },
    async deleteOne(filter) {
      const item = Array.from(rows.entries()).find(([, row]) => matches(row, filter))
      if (item) rows.delete(item[0])
      return { deletedCount: item ? 1 : 0 }
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

describe('profile Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    profilePrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    profilePrimary.__setTestDb(null)
  })

  test('writes and reads profile fields from Mongo primary collections', async () => {
    await profilePrimary.setUserNick('alice', 'Alice Star')
    await profilePrimary.setUserAvatar('alice', '/avatars/a.png')
    await profilePrimary.setUserGender('alice', 'female')
    await profilePrimary.setUserBirthYear('alice', 1999)
    await profilePrimary.setUserAbout('alice', 'hello')

    await expect(profilePrimary.getUserProfile('alice')).resolves.toMatchObject({
      nickname: 'Alice Star',
      icon: '/avatars/a.png',
      gender: 'female',
      birthYear: 1999,
    })
    await expect(profilePrimary.getUserAbout('alice')).resolves.toBe('hello')
    expect(memoryDb.collection('forum_core_user_metadata').rows.size).toBeGreaterThan(0)
  })

  test('uses the newest avatar/profile metadata when migrated rows contain duplicates', async () => {
    await memoryDb.collection('profiles').updateOne(
      { _id: 'legacy-profile-old' },
      { $set: { userId: 'alice', accountId: 'alice', nickname: 'Alice', icon: '/avatars/old.png', updatedAt: '2026-06-20T10:00:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('profiles').updateOne(
      { _id: 'legacy-profile-new' },
      { $set: { userId: 'alice', accountId: 'alice', nickname: 'Alice', icon: '/avatars/new.png', updatedAt: '2026-06-21T10:00:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'legacy-avatar-meta' },
      { $set: { userId: 'alice', field: 'avatar', value: '/uploads/avatars/latest.png', updatedAt: '2026-06-22T10:00:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.getUserAvatar('alice')).resolves.toBe('/uploads/avatars/latest.png')

    await profilePrimary.setUserAvatar('alice', '/uploads/avatars/final.png')
    const metaRows = Array.from(memoryDb.collection('forum_core_user_metadata').rows.values())
      .filter((row) => row.userId === 'alice' && row.field === 'avatar')
    expect(metaRows).toHaveLength(1)
    await expect(profilePrimary.getUserAvatar('alice')).resolves.toBe('/uploads/avatars/final.png')
  })

  test('keeps nickname ownership unique', async () => {
    await profilePrimary.setUserNick('alice', 'Shared')
    await expect(profilePrimary.setUserNick('bob', 'Shared')).rejects.toThrow('nick_taken')
    await expect(profilePrimary.isNickAvailable('Shared', 'alice')).resolves.toBe(true)
    await expect(profilePrimary.isNickAvailable('Shared', 'bob')).resolves.toBe(false)
  })

  test('guards legacy nickname index rows without nickLower from false free checks', async () => {
    await memoryDb.collection('profile_nick_index').updateOne(
      { _id: 'nick:legacy' },
      { $set: { _id: 'nick:legacy', nickname: 'Legacy', normalizedNick: 'Legacy', ownerUserId: 'alice', updatedAt: '2026-06-25T10:00:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.isNickAvailable('Legacy', 'bob')).resolves.toBe(false)
    await expect(profilePrimary.setUserNick('bob', 'Legacy')).rejects.toThrow('nick_taken')
    await expect(profilePrimary.isNickAvailable('Legacy', 'alice')).resolves.toBe(true)
    await expect(profilePrimary.setUserNick('alice', 'Legacy')).resolves.toBe('Legacy')

    const row = await memoryDb.collection('profile_nick_index').findOne({ _id: 'nick:legacy' })
    expect(row).toMatchObject({ nickLower: 'legacy', ownerUserId: 'alice' })
  })

  test('resolves canonical aliases without Redis', async () => {
    const written = await profilePrimary.writeCanonicalAliases('wallet:1', ['12345', 'legacy-user'])
    expect(written).toBeGreaterThan(0)

    await expect(profilePrimary.resolveCanonicalAccountId('tguid:12345')).resolves.toBe('wallet:1')
    await expect(profilePrimary.resolveCanonicalAccountIds(['12345', 'legacy-user'])).resolves.toMatchObject({
      ids: ['wallet:1'],
      aliases: {
        '12345': 'wallet:1',
        'legacy-user': 'wallet:1',
      },
    })
  })

  test('builds etalon-style lookup order without stripping every Telegram prefix to a global bare id first', () => {
    expect(identityContract.stripRuntimePrefix('tguid:777001')).toBe('777001')
    expect(identityContract.stripRuntimePrefix('telegram:id:777001')).toBe('telegram:id:777001')
    expect(identityContract.buildLookupOrder('777001')).toEqual([
      '777001',
      'tguid:777001',
      'tg:777001',
      'telegram:id:777001',
      'telegram:777001',
      'telegramid:777001',
      'tg:uid:777001',
    ])
  })

  test('does not resolve accounts through loose aliasValue-only matches', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:other-prefixed' },
      {
        $set: {
          alias: 'telegram:333',
          aliasId: 'telegram:333',
          aliasValue: '333',
          accountId: 'wallet:other',
          canonicalAccountId: 'wallet:other',
        },
      },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:bad-value-only' },
      {
        $set: {
          alias: 'legacy:not-the-raw-id',
          aliasId: 'legacy:not-the-raw-id',
          aliasValue: 'raw-user',
          accountId: 'wallet:wrong',
          canonicalAccountId: 'wallet:wrong',
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.resolveCanonicalAccountId('raw-user')).resolves.toBe('raw-user')
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:333')).resolves.toBe('wallet:other')
  })

  test('prefers linked wallet account over numeric Telegram self-row when aliases collide', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:numeric-self' },
      {
        $set: {
          alias: '333999',
          aliasId: 'telegram:333999',
          aliasValue: '333999',
          accountId: '333999',
          canonicalAccountId: '333999',
          updatedAt: '2026-06-26T09:00:00.000Z',
        },
      },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:wallet-linked' },
      {
        $set: {
          alias: 'telegram:333999',
          aliasId: 'telegram:333999',
          aliasValue: '333999',
          accountId: '0x1111111111111111111111111111111111111111',
          canonicalAccountId: '0x1111111111111111111111111111111111111111',
          updatedAt: '2026-06-26T08:00:00.000Z',
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.resolveCanonicalAccountId('333999')).resolves.toBe('0x1111111111111111111111111111111111111111')
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:333999')).resolves.toBe('0x1111111111111111111111111111111111111111')
  })

  test('returns explicit self aliases so clients can clear stale browser mappings', async () => {
    const result = await profilePrimary.resolveCanonicalAccountIds(['raw-user', 'telegram:444'])

    expect(result.ids).toEqual(['raw-user', '444'])
    expect(result.aliases).toMatchObject({
      'raw-user': 'raw-user',
      'telegram:444': '444',
      '444': '444',
    })
  })

  test('exposes durable Telegram linkage from Mongo profile and aliases', async () => {
    await profilePrimary.updateProfile('wallet:tg', { telegramId: '777001' })
    await profilePrimary.writeCanonicalAliases('wallet:tg', ['777001', 'telegram:777001', 'telegramid:777001', 'telegram:id:777001', 'tguid:777001', 'tg:777001'])

    await expect(profilePrimary.readProfile('wallet:tg')).resolves.toMatchObject({ telegramId: '777001' })
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:777001')).resolves.toBe('wallet:tg')
    await expect(profilePrimary.resolveCanonicalAccountId('telegramid:777001')).resolves.toBe('wallet:tg')
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:id:777001')).resolves.toBe('wallet:tg')
    await expect(profilePrimary.resolveCanonicalAccountId('tguid:777001')).resolves.toBe('wallet:tg')
    await expect(profilePrimary.resolveCanonicalAccountId('tg:777001')).resolves.toBe('wallet:tg')
  })

  test('does not let linked metadata override a direct profile nickname and avatar', async () => {
    await profilePrimary.updateProfile('wallet:linked', {
      nickname: 'Old Wallet Name',
      icon: '/avatars/old-wallet.png',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases('wallet:linked', ['telegram:555001', 'tguid:555001', 'tg:555001', '555001'])
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:telegram:555001:nick' },
      { $set: { userId: 'telegram:555001', field: 'nick', value: 'Fresh TMA Name', updatedAt: '2026-06-26T10:05:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:555001:avatar' },
      { $set: { userId: '555001', field: 'avatar', value: '/uploads/avatars/fresh-tma.png', updatedAt: '2026-06-26T10:06:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.getUserProfile('wallet:linked')).resolves.toMatchObject({
      nickname: 'Old Wallet Name',
      icon: '/avatars/old-wallet.png',
    })
  })

  test('uses linked metadata only as fallback when the direct profile lacks display fields', async () => {
    await profilePrimary.updateProfile('wallet:fallback', {
      nickname: '',
      icon: '',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases('wallet:fallback', ['telegram:555003', 'tguid:555003', 'tg:555003', '555003'])
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:telegram:555003:nick' },
      { $set: { userId: 'telegram:555003', field: 'nick', value: 'Linked Fallback Name', updatedAt: '2026-06-26T10:05:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:555003:avatar' },
      { $set: { userId: '555003', field: 'avatar', value: '/uploads/avatars/fallback.png', updatedAt: '2026-06-26T10:06:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.getUserProfile('wallet:fallback')).resolves.toMatchObject({
      nickname: 'Linked Fallback Name',
      icon: '/uploads/avatars/fallback.png',
    })
  })

  test('direct canonical metadata wins over newer linked metadata for the same field', async () => {
    await profilePrimary.updateProfile('wallet:linked', {
      nickname: 'Wallet Name',
      icon: '/avatars/wallet.png',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases('wallet:linked', ['telegram:555002', 'tguid:555002', 'tg:555002', '555002'])
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:telegram:555002:nick' },
      { $set: { userId: 'telegram:555002', field: 'nick', value: 'Fresh Linked Name', updatedAt: '2026-06-26T10:10:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:wallet:linked:nick' },
      { $set: { userId: 'wallet:linked', field: 'nick', value: 'Canonical Name', updatedAt: '2026-06-26T10:05:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.getUserProfile('wallet:linked')).resolves.toMatchObject({
      nickname: 'Canonical Name',
    })
  })
})
