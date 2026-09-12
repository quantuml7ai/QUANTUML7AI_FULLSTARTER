import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import profilePrimaryModule from '../../../lib/mongo/profile-primary.cjs'
import identityContractModule from '../../../lib/identity/ql7IdentityContract.cjs'
import accountDeletionModule from '../../../lib/mongo/account-deletion-primary.cjs'
import { POST as authorizeTelegramMiniApp } from '../../../app/api/tma/auto/route.js'

const profilePrimary = profilePrimaryModule?.default || profilePrimaryModule
const identityContract = identityContractModule?.default || identityContractModule
const accountDeletion = accountDeletionModule?.default || accountDeletionModule
const CANONICAL_WALLET_ONE = '0x1111111111111111111111111111111111111111'
const CANONICAL_WALLET_OTHER = '0x2222222222222222222222222222222222222222'
const CANONICAL_WALLET_WRONG = '0x3333333333333333333333333333333333333333'
const CANONICAL_WALLET_TELEGRAM = '0x4444444444444444444444444444444444444444'
const CANONICAL_WALLET_LINKED = '0x5555555555555555555555555555555555555555'
const CANONICAL_WALLET_FALLBACK = '0x6666666666666666666666666666666666666666'

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
  const setValue = (target, path, value) => {
    const parts = String(path).split('.')
    let cursor = target
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index]
      if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {}
      cursor = cursor[part]
    }
    cursor[parts.at(-1)] = value
  }
  if (isInsert && update.$setOnInsert) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) setValue(doc, key, value)
  }
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) setValue(doc, key, value)
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      setValue(doc, key, Number(getValue(doc, key) || 0) + Number(value || 0))
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
    async findOneAndUpdate(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return null
        const id = filter?._id || update?.$setOnInsert?._id || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { ...doc }
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

function makeTelegramInitData(userId, botToken) {
  const payload = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'AAEAAAE',
    user: JSON.stringify({ id: Number(userId), first_name: 'Canonical proof' }),
  }
  const checkString = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  return new URLSearchParams({ ...payload, hash }).toString()
}

describe('profile Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    profilePrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    profilePrimary.__setTestDb(null)
    identityContract.__setTestProfileResolver?.(null)
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

  test('stops new alias writes while keeping legacy alias rows readable', async () => {
    const written = await profilePrimary.writeCanonicalAliases(CANONICAL_WALLET_ONE, ['12345', 'legacy-user'])
    expect(written).toBe(0)
    expect(memoryDb.collection('account_aliases').rows.size).toBe(0)

    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'legacy:12345' },
      { $set: { alias: 'tguid:12345', aliasId: '12345', accountId: CANONICAL_WALLET_ONE, canonicalAccountId: CANONICAL_WALLET_ONE } },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'legacy:user' },
      { $set: { alias: 'legacy-user', aliasId: 'legacy-user', accountId: CANONICAL_WALLET_ONE, canonicalAccountId: CANONICAL_WALLET_ONE } },
      { upsert: true },
    )

    await expect(profilePrimary.resolveCanonicalAccountId('tguid:12345')).resolves.toBe(CANONICAL_WALLET_ONE)
    await expect(profilePrimary.resolveCanonicalAccountIds(['12345', 'legacy-user'])).resolves.toMatchObject({
      ids: [CANONICAL_WALLET_ONE],
      aliases: {
        '12345': CANONICAL_WALLET_ONE,
        'legacy-user': CANONICAL_WALLET_ONE,
      },
    })
  })

  test('keeps an existing legacy physical profile key until Mongo compaction while exposing canonical ownership', async () => {
    const checksum = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const lower = checksum.toLowerCase()

    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${lower}` },
      { $set: { userId: lower, accountId: lower, nickname: 'Legacy physical row' } },
      { upsert: true },
    )

    await profilePrimary.updateProfile(lower, { about: 'canonical logical owner' })

    const physical = memoryDb.collection('profiles').rows.get(`profile:${lower}`)
    expect(physical).toMatchObject({
      userId: lower,
      accountId: lower,
      principalId: checksum,
      canonicalAccountId: checksum,
      walletId: checksum,
    })
    expect(memoryDb.collection('profiles').rows.has(`profile:${checksum}`)).toBe(false)

    await expect(profilePrimary.readProfile(lower)).resolves.toMatchObject({
      principalId: checksum,
      userId: checksum,
      accountId: checksum,
      walletId: checksum,
      about: 'canonical logical owner',
    })
  })

  test('upgrades a legacy synthetic Telegram profile to the bare Telegram principal on the next trusted write', async () => {
    await memoryDb.collection('profiles').updateOne(
      { _id: 'profile:web_legacy' },
      {
        $set: {
          userId: 'web_legacy',
          accountId: 'web_legacy',
          nickname: 'Legacy Telegram user',
        },
      },
      { upsert: true },
    )

    await profilePrimary.updateProfile('web_legacy', { telegramId: '6783588404' })

    const physical = memoryDb.collection('profiles').rows.get('profile:web_legacy')
    expect(physical).toMatchObject({
      userId: 'web_legacy',
      accountId: 'web_legacy',
      principalId: '6783588404',
      canonicalAccountId: '6783588404',
      telegramId: '6783588404',
    })

    await expect(profilePrimary.readProfile('web_legacy')).resolves.toMatchObject({
      principalId: '6783588404',
      userId: '6783588404',
      accountId: '6783588404',
      telegramId: '6783588404',
    })
  })

  test('canonicalizes every EVM representation to one EIP-55 principal', async () => {
    const checksum = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const lower = checksum.toLowerCase()

    await profilePrimary.updateProfile(lower, { nickname: 'KIKI' })

    await expect(profilePrimary.resolveCanonicalAccountId(lower)).resolves.toBe(checksum)
    await expect(profilePrimary.resolveCanonicalAccountId(`wallet:${lower}`)).resolves.toBe(checksum)
    await expect(profilePrimary.readProfile(checksum)).resolves.toMatchObject({
      principalId: checksum,
      accountId: checksum,
      walletId: checksum,
      nickname: 'KIKI',
    })
    expect(memoryDb.collection('account_aliases').rows.size).toBe(0)
  })

  test('builds etalon-style lookup order without stripping every Telegram prefix to a global bare id first', () => {
    expect(identityContract.stripRuntimePrefix('tguid:777001')).toBe('777001')
    expect(identityContract.stripRuntimePrefix('telegram:id:777001')).toBe('telegram:id:777001')
    expect(identityContract.buildLookupOrder('777001')).toEqual([
      '777001',
      'telegram:777001',
      'telegramid:777001',
      'telegram:id:777001',
      'tguid:777001',
      'tg:777001',
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
          accountId: CANONICAL_WALLET_OTHER,
          canonicalAccountId: CANONICAL_WALLET_OTHER,
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
          accountId: CANONICAL_WALLET_WRONG,
          canonicalAccountId: CANONICAL_WALLET_WRONG,
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.resolveCanonicalAccountId('raw-user')).resolves.toBe('raw-user')
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:333')).resolves.toBe(CANONICAL_WALLET_OTHER)
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
    await profilePrimary.updateProfile(CANONICAL_WALLET_TELEGRAM, { telegramId: '777001' })
    await profilePrimary.writeCanonicalAliases(CANONICAL_WALLET_TELEGRAM, ['777001', 'telegram:777001', 'telegramid:777001', 'telegram:id:777001', 'tguid:777001', 'tg:777001'])

    await expect(profilePrimary.readProfile(CANONICAL_WALLET_TELEGRAM)).resolves.toMatchObject({ telegramId: '777001' })
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:777001')).resolves.toBe(CANONICAL_WALLET_TELEGRAM)
    await expect(profilePrimary.resolveCanonicalAccountId('telegramid:777001')).resolves.toBe(CANONICAL_WALLET_TELEGRAM)
    await expect(profilePrimary.resolveCanonicalAccountId('telegram:id:777001')).resolves.toBe(CANONICAL_WALLET_TELEGRAM)
    await expect(profilePrimary.resolveCanonicalAccountId('tguid:777001')).resolves.toBe(CANONICAL_WALLET_TELEGRAM)
    await expect(profilePrimary.resolveCanonicalAccountId('tg:777001')).resolves.toBe(CANONICAL_WALLET_TELEGRAM)
  })

  test('does not let linked metadata override a direct profile nickname and avatar', async () => {
    await profilePrimary.updateProfile(CANONICAL_WALLET_LINKED, {
      telegramId: '555001',
      nickname: 'Old Wallet Name',
      icon: '/avatars/old-wallet.png',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases(CANONICAL_WALLET_LINKED, ['telegram:555001', 'tguid:555001', 'tg:555001', '555001'])
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

    await expect(profilePrimary.getUserProfile(CANONICAL_WALLET_LINKED)).resolves.toMatchObject({
      nickname: 'Old Wallet Name',
      icon: '/avatars/old-wallet.png',
    })
  })

  test('uses linked metadata only as fallback when the direct profile lacks display fields', async () => {
    await profilePrimary.updateProfile(CANONICAL_WALLET_FALLBACK, {
      telegramId: '555003',
      nickname: '',
      icon: '',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases(CANONICAL_WALLET_FALLBACK, ['telegram:555003', 'tguid:555003', 'tg:555003', '555003'])
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

    await expect(profilePrimary.getUserProfile(CANONICAL_WALLET_FALLBACK)).resolves.toMatchObject({
      nickname: 'Linked Fallback Name',
      icon: '/uploads/avatars/fallback.png',
    })
  })

  test('direct canonical metadata wins over newer linked metadata for the same field', async () => {
    await profilePrimary.updateProfile(CANONICAL_WALLET_LINKED, {
      telegramId: '555002',
      nickname: 'Wallet Name',
      icon: '/avatars/wallet.png',
      updatedAt: '2026-06-26T10:00:00.000Z',
    })
    await profilePrimary.writeCanonicalAliases(CANONICAL_WALLET_LINKED, ['telegram:555002', 'tguid:555002', 'tg:555002', '555002'])
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: 'user:telegram:555002:nick' },
      { $set: { userId: 'telegram:555002', field: 'nick', value: 'Fresh Linked Name', updatedAt: '2026-06-26T10:10:00.000Z' } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_user_metadata').updateOne(
      { _id: `user:${CANONICAL_WALLET_LINKED}:nick` },
      { $set: { userId: CANONICAL_WALLET_LINKED, field: 'nick', value: 'Canonical Name', updatedAt: '2026-06-26T10:05:00.000Z' } },
      { upsert: true },
    )

    await expect(profilePrimary.getUserProfile(CANONICAL_WALLET_LINKED)).resolves.toMatchObject({
      nickname: 'Canonical Name',
    })
  })

  test('treats an explicit profile Telegram link as authoritative over a stale legacy alias row', async () => {
    const walletId = '0x7777777777777777777777777777777777777777'
    const staleWalletId = '0x8888888888888888888888888888888888888888'
    const telegramId = '6783588403'

    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletId}` },
      { $set: { principalId: walletId, accountId: walletId, walletId, telegramId, nickname: 'Canonical' } },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: `alias:${telegramId}` },
      {
        $set: {
          alias: `telegram:${telegramId}`,
          aliasId: telegramId,
          accountId: staleWalletId,
          canonicalAccountId: staleWalletId,
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.resolveCanonicalAccountId(telegramId)).resolves.toBe(walletId)
    await expect(profilePrimary.assertTelegramLinkAvailable(walletId, telegramId)).resolves.toMatchObject({ ok: true })
    await expect(profilePrimary.readProfile(`telegram:${telegramId}`)).resolves.toMatchObject({
      accountId: walletId,
      nickname: 'Canonical',
    })
  })

  test('fails closed when one Telegram principal is historically linked to two wallets', async () => {
    const walletA = '0x7777777777777777777777777777777777777777'
    const walletB = '0x8888888888888888888888888888888888888888'
    const telegramId = '6783588404'

    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletA}` },
      { $set: { principalId: walletA, accountId: walletA, walletId: walletA, telegramId } },
      { upsert: true },
    )
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletB}` },
      { $set: { principalId: walletB, accountId: walletB, walletId: walletB, telegramId } },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: `alias:${telegramId}` },
      {
        $set: {
          alias: `telegram:${telegramId}`,
          aliasId: telegramId,
          accountId: walletB,
          canonicalAccountId: walletB,
          userId: walletA,
        },
      },
      { upsert: true },
    )

    const linkedToB = await profilePrimary.getLinkedIdentityIds(walletB)
    expect(linkedToB).toContain(walletB)
    expect(linkedToB).not.toContain(walletA)
    expect(linkedToB).not.toContain(telegramId)
    await expect(profilePrimary.resolveCanonicalAccountId(telegramId)).rejects.toMatchObject({
      code: 'IDENTITY_LINK_CONFLICT',
    })
    await expect(profilePrimary.updateProfile(walletB, { telegramId })).rejects.toMatchObject({
      code: 'IDENTITY_LINK_CONFLICT',
    })

    identityContract.__setTestProfileResolver?.(async () => {
      const error = new Error('identity_link_conflict')
      error.code = 'IDENTITY_LINK_CONFLICT'
      error.details = { reason: 'telegram_maps_to_multiple_accounts' }
      throw error
    })
    const identity = await identityContract.resolve(telegramId, { mode: 'economic-mutation' })
    expect(identity).toMatchObject({ conflicted: true, mutationAllowed: false })
    expect(identity.aliasSet).not.toContain(walletA)
    expect(identity.aliasSet).not.toContain(walletB)
  })

  test('keeps verified TMA login Telegram-only when legacy wallet links are ambiguous', async () => {
    const walletA = '0x7777777777777777777777777777777777777777'
    const walletB = '0x8888888888888888888888888888888888888888'
    const telegramId = '6783588406'
    const botToken = 'tma-conflict-proof-token'
    const previousBotToken = process.env.TELEGRAM_BOT_TOKEN
    process.env.TELEGRAM_BOT_TOKEN = botToken

    try {
      await memoryDb.collection('profiles').updateOne(
        { _id: `profile:${walletA}` },
        { $set: { principalId: walletA, accountId: walletA, walletId: walletA, telegramId } },
        { upsert: true },
      )
      await memoryDb.collection('profiles').updateOne(
        { _id: `profile:${walletB}` },
        { $set: { principalId: walletB, accountId: walletB, walletId: walletB, telegramId } },
        { upsert: true },
      )

      const request = new Request('https://www.quantuml7ai.com/api/tma/auto?return=%2Fforum', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ initData: makeTelegramInitData(telegramId, botToken) }),
      })
      const response = await authorizeTelegramMiniApp(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload).toMatchObject({ ok: true, accountId: telegramId, return: '/forum' })
      expect(response.headers.get('set-cookie')).toContain(`asherId=${telegramId}`)
      expect(memoryDb.collection('profiles').rows.size).toBe(2)
    } finally {
      if (previousBotToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN
      else process.env.TELEGRAM_BOT_TOKEN = previousBotToken
    }
  })

  test('reserves a Telegram deep-link for only one Web Wallet and ignores later wallets', async () => {
    const walletA = '0x7777777777777777777777777777777777777701'
    const walletB = '0x8888888888888888888888888888888888888802'
    const telegramId = '6783588499'

    await expect(profilePrimary.reserveTelegramWebLink(walletA, telegramId)).resolves.toMatchObject({
      ok: true,
      reserved: true,
      walletId: walletA,
      telegramId,
    })

    await expect(profilePrimary.reserveTelegramWebLink(walletB, telegramId)).resolves.toMatchObject({
      ok: false,
      ignored: true,
    })

    expect(await memoryDb.collection('profile_telegram_link_index').findOne({ _id: `telegram:${telegramId}` }))
      .toMatchObject({ walletId: walletA, telegramId })
    expect(memoryDb.collection('profiles').rows.size).toBe(0)
  })

  test('keeps the reservation fence out of canonical identity reads until the profile is persisted', async () => {
    const walletId = '0x1212121212121212121212121212121212121212'
    const telegramId = '6783588494'

    await expect(profilePrimary.reserveTelegramWebLink(walletId, telegramId)).resolves.toMatchObject({ ok: true })
    await expect(profilePrimary.assertTelegramLinkAvailable(walletId, telegramId)).resolves.toMatchObject({ ok: true })
    await profilePrimary.updateProfile(walletId, { telegramId })

    const linkedProfiles = await memoryDb.collection('profiles').find({ walletId }).toArray()
    expect(linkedProfiles).toHaveLength(1)
    expect(linkedProfiles[0]).toMatchObject({ walletId, telegramId })
    await expect(profilePrimary.resolveCanonicalAccountId(telegramId)).resolves.toBe(walletId)
  })

  test('reserves only one Telegram principal per Web Wallet', async () => {
    const walletId = '0x3333333333333333333333333333333333333303'
    const telegramA = '6783588497'
    const telegramB = '6783588498'

    await expect(profilePrimary.reserveTelegramWebLink(walletId, telegramA)).resolves.toMatchObject({ ok: true })
    await expect(profilePrimary.reserveTelegramWebLink(walletId, telegramB)).resolves.toMatchObject({
      ok: false,
      ignored: true,
    })

    expect(await memoryDb.collection('profile_telegram_link_index').findOne({ walletId }))
      .toMatchObject({ telegramId: telegramA, walletId })
    expect(await memoryDb.collection('profile_telegram_link_index').findOne({ _id: `telegram:${telegramB}` }))
      .toBeNull()
  })

  test('ignores an already persisted Telegram Web Wallet link without creating a new claim', async () => {
    const ownerWallet = '0x4444444444444444444444444444444444444404'
    const otherWallet = '0x5555555555555555555555555555555555555505'
    const telegramId = '6783588496'

    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${ownerWallet}` },
      { $set: { principalId: ownerWallet, accountId: ownerWallet, walletId: ownerWallet, telegramId } },
      { upsert: true },
    )

    await expect(profilePrimary.reserveTelegramWebLink(otherWallet, telegramId)).resolves.toMatchObject({
      ok: false,
      ignored: true,
      reason: 'TELEGRAM_ALREADY_LINKED',
    })
    expect(memoryDb.collection('profile_telegram_link_index').rows.size).toBe(0)
  })

  test('keeps a Telegram-only placeholder eligible for its first Web Wallet reservation', async () => {
    const walletId = '0x6666666666666666666666666666666666666606'
    const telegramId = '6783588495'

    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${telegramId}` },
      { $set: { principalId: telegramId, accountId: telegramId, userId: telegramId, telegramId } },
      { upsert: true },
    )

    await expect(profilePrimary.reserveTelegramWebLink(walletId, telegramId)).resolves.toMatchObject({
      ok: true,
      reserved: true,
      walletId,
      telegramId,
    })
  })

  test('allows one Telegram-only profile to be upgraded to its authenticated wallet', async () => {
    const walletId = '0x9999999999999999999999999999999999999999'
    const telegramId = '6783588405'
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${telegramId}` },
      { $set: { principalId: telegramId, accountId: telegramId, userId: telegramId, telegramId } },
      { upsert: true },
    )

    await expect(profilePrimary.assertTelegramLinkAvailable(walletId, telegramId)).resolves.toMatchObject({ ok: true })
    await profilePrimary.updateProfile(walletId, { telegramId })

    expect(memoryDb.collection('profiles').rows.size).toBe(2)
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${telegramId}` }))
      .toMatchObject({ principalId: telegramId, accountId: telegramId, telegramId })
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${walletId}` }))
      .toMatchObject({ principalId: walletId, accountId: walletId, walletId, telegramId })
    await expect(profilePrimary.resolveCanonicalAccountId(telegramId)).resolves.toBe(walletId)
    await expect(profilePrimary.readProfile(walletId)).resolves.toMatchObject({
      principalId: walletId,
      walletId,
      telegramId,
    })
  })

  test('links existing Wallet and Telegram-only profiles without overwriting either side owner', async () => {
    const walletId = '0x9191919191919191919191919191919191919191'
    const telegramId = '6737969425'
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletId}` },
      { $set: { principalId: walletId, accountId: walletId, userId: walletId, walletId, telegramId: '', nickname: 'Web state' } },
      { upsert: true },
    )
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${telegramId}` },
      { $set: { principalId: telegramId, accountId: telegramId, userId: telegramId, walletId: '', telegramId, nickname: 'Telegram state' } },
      { upsert: true },
    )

    await expect(profilePrimary.reserveTelegramWebLink(walletId, telegramId)).resolves.toMatchObject({ ok: true })
    await expect(profilePrimary.updateProfile(walletId, { telegramId })).resolves.toMatchObject({
      principalId: walletId,
      walletId,
      telegramId,
    })

    expect(memoryDb.collection('profiles').rows.size).toBe(2)
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${walletId}` }))
      .toMatchObject({ accountId: walletId, nickname: 'Web state', walletId, telegramId })
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${telegramId}` }))
      .toMatchObject({ accountId: telegramId, nickname: 'Telegram state', walletId: '', telegramId })
    await expect(profilePrimary.resolveCanonicalAccountId(telegramId)).resolves.toBe(walletId)
  })

  test('preserves a Wallet Telegram link while incrementing forum profile stats', async () => {
    const walletId = '0x9292929292929292929292929292929292929292'
    const telegramId = '6737969426'
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletId}` },
      {
        $set: {
          principalId: walletId,
          accountId: walletId,
          userId: walletId,
          walletId,
          telegramId,
          stats: { likes: 2 },
          profileStats: { likes: 2 },
          likesTotal: 2,
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.incrementUserStat(walletId, 'likes', 1)).resolves.toBe(3)
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${walletId}` }))
      .toMatchObject({ principalId: walletId, walletId, telegramId, stats: { likes: 3 } })
  })

  test('does not promote a stale legacy tgId during a Wallet stats update', async () => {
    const walletId = '0x9595959595959595959595959595959595959595'
    await memoryDb.collection('profiles').updateOne(
      { _id: `profile:${walletId}` },
      {
        $set: {
          principalId: walletId,
          accountId: walletId,
          userId: walletId,
          walletId,
          telegramId: '',
          tgId: '6737969430',
          stats: { posts: 0 },
        },
      },
      { upsert: true },
    )

    await expect(profilePrimary.incrementUserStat(walletId, 'posts', 1)).resolves.toBe(1)
    expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${walletId}` }))
      .toMatchObject({ walletId, telegramId: '', tgId: '6737969430', stats: { posts: 1 } })
  })
  test('treats explicit telegramId as authoritative over stale legacy tgId on another wallet', async () => {
  const walletId =
    '0x7777777777777777777777777777777777777777'

  const staleWalletId =
    '0x8888888888888888888888888888888888888888'

  const telegramId = '6783588407'

  await memoryDb.collection('profiles').updateOne(
    { _id: `profile:${walletId}` },
    {
      $set: {
        principalId: walletId,
        accountId: walletId,
        canonicalAccountId: walletId,
        walletId,
        telegramId,
        tgId: telegramId,
        nickname: 'Canonical Telegram Owner',
        updatedAt: '2026-09-01T10:19:27.627Z',
      },
    },
    { upsert: true },
  )

  await memoryDb.collection('profiles').updateOne(
    { _id: `profile:${staleWalletId}` },
    {
      $set: {
        principalId: staleWalletId,
        accountId: staleWalletId,
        canonicalAccountId: staleWalletId,
        walletId: staleWalletId,
        telegramId: '',
        tgId: telegramId,
        nickname: 'Stale Legacy Telegram Owner',
        updatedAt: '2026-09-01T10:43:31.559Z',
      },
    },
    { upsert: true },
  )

  await expect(
    profilePrimary.resolveCanonicalAccountId(telegramId),
  ).resolves.toBe(walletId)

  await expect(
    profilePrimary.findProfile(`telegram:${telegramId}`),
  ).resolves.toMatchObject({
    accountId: walletId,
    nickname: 'Canonical Telegram Owner',
  })

  const linked =
    await profilePrimary.getLinkedIdentityIds(telegramId)

  expect(linked).toContain(walletId)
  expect(linked).toContain(telegramId)
  expect(linked).not.toContain(staleWalletId)

  await expect(
    profilePrimary.updateProfile(walletId, {
      telegramId,
    }),
  ).resolves.toMatchObject({
    accountId: walletId,
    telegramId,
  })
})
test('keeps account deletion fenced from stale foreign tgId and stale alias userId', async () => {
  const walletId =
    '0x7777777777777777777777777777777777777777'

  const foreignWalletId =
    '0x8888888888888888888888888888888888888888'

  const telegramId =
    '6737969425'

  const foreignTelegramId =
    '6276878239'

  await memoryDb
    .collection('profiles')
    .updateOne(
      {
        _id: `profile:${walletId}`,
      },
      {
        $set: {
          principalId: walletId,
          accountId: walletId,
          canonicalAccountId: walletId,
          walletId,
          telegramId,
          nickname: 'Canonical delete owner',
        },
      },
      {
        upsert: true,
      },
    )

  // Exact shape found in the live migration residue:
  //
  // foreign canonical account has its own telegramId but keeps this
  // account's Telegram id in legacy tgId.
  await memoryDb
    .collection('profiles')
    .updateOne(
      {
        _id:
          `profile:${foreignWalletId}`,
      },
      {
        $set: {
          principalId:
            foreignWalletId,
          accountId:
            foreignWalletId,
          canonicalAccountId:
            foreignWalletId,
          walletId:
            foreignWalletId,

          telegramId:
            foreignTelegramId,

          tgId:
            telegramId,

          nickname:
            'Foreign canonical owner',
        },
      },
      {
        upsert: true,
      },
    )

  // Exact stale account_aliases shape from the migration:
  //
  // canonical target belongs to walletId while old userId still points to
  // foreignWalletId.
  await memoryDb
    .collection('account_aliases')
    .updateOne(
      {
        _id:
          `alias:${telegramId}`,
      },
      {
        $set: {
          alias:
            telegramId,

          aliasId:
            `telegram:${telegramId}`,

          aliasValue:
            telegramId,

          accountId:
            walletId,

          canonicalAccountId:
            walletId,

          userId:
            foreignWalletId,
        },
      },
      {
        upsert: true,
      },
    )

  const ids =
    await accountDeletion
      .__private
      .buildIdentityIds(
        memoryDb,
        walletId,

        // Even stale/untrusted client hints must not widen deletion.
        [
          walletId,
          telegramId,
          foreignWalletId,
          foreignTelegramId,
        ],

        // Inject the same memory-backed profile repository instance used by
        // this unit fixture. Production omits this argument and continues to
        // use account-deletion-primary's normal profilePrimary dependency.
        profilePrimary,
      )

  expect(ids).toContain(walletId)
  expect(ids).toContain(telegramId)

  expect(ids).not.toContain(
    foreignWalletId,
  )

  expect(ids).not.toContain(
    foreignWalletId.toLowerCase(),
  )

  expect(ids).not.toContain(
    foreignTelegramId,
  )

  expect(ids).not.toContain(
    `telegram:${foreignTelegramId}`,
  )
})
test('keeps side-bound account deletion from expanding into the linked counterpart', async () => {
  const walletId = '0x9393939393939393939393939393939393939393'
  const telegramId = '6737969427'
  const linkedRepository = {
    async resolveCanonicalAccountId(raw) {
      return String(raw).includes(telegramId) ? walletId : raw
    },
    async getLinkedIdentityIds() {
      return [walletId, telegramId, `telegram:${telegramId}`]
    },
  }

  const telegramIds = await accountDeletion.__private.buildIdentityIds(
    memoryDb,
    telegramId,
    [walletId, telegramId, `telegram:${telegramId}`],
    linkedRepository,
    { identityScope: 'telegram' },
  )
  expect(telegramIds).toContain(telegramId)
  expect(telegramIds).toContain(`telegram:${telegramId}`)
  expect(telegramIds).not.toContain(walletId)
  expect(telegramIds).not.toContain(walletId.toLowerCase())

  const walletIds = await accountDeletion.__private.buildIdentityIds(
    memoryDb,
    walletId,
    [walletId, telegramId],
    linkedRepository,
    { identityScope: 'wallet' },
  )
  expect(walletIds).toContain(walletId)
  expect(walletIds).not.toContain(telegramId)

  const plans = accountDeletion.__private.makeBasePlans(
    telegramIds,
    [],
    [],
    {},
    { identityScope: 'telegram' },
  )
  const profilePlan = plans.find((row) => row.name === 'profiles')
  const claimPlan = plans.find((row) => row.name === 'profile_telegram_link_index')
  expect(matches({
    _id: `profile:${walletId}`,
    principalId: walletId,
    accountId: walletId,
    walletId,
    telegramId,
  }, profilePlan.filter)).toBe(false)
  expect(matches({
    _id: `profile:${telegramId}`,
    principalId: telegramId,
    accountId: telegramId,
    telegramId,
  }, profilePlan.filter)).toBe(true)
  const walletPlans = accountDeletion.__private.makeBasePlans(
    walletIds,
    [],
    [],
    {},
    { identityScope: 'wallet' },
  )
  const walletProfilePlan = walletPlans.find((row) => row.name === 'profiles')
  expect(matches({ _id: 'legacy-wallet-profile', walletId }, walletProfilePlan.filter)).toBe(true)
  expect(matches({ _id: 'legacy-wallet-address-profile', address: walletId }, walletProfilePlan.filter)).toBe(true)
  expect(matches({
    _id: `telegram:${telegramId}`,
    walletId,
    telegramId,
  }, claimPlan.filter)).toBe(true)
})

test('includes QCoin entitlement purchase receipts in account deletion ownership', () => {
  const walletId = '0x9595959595959595959595959595959595959595'
  const plans = accountDeletion.__private.makeBasePlans([walletId], [], [], {}, {
    identityScope: 'wallet',
  })
  const purchasePlan = plans.find((row) => row.name === 'qcoin_entitlement_purchases')

  expect(purchasePlan).toBeTruthy()
  expect(matches({ _id: 'qcoin-purchase:test', accountId: walletId }, purchasePlan.filter)).toBe(true)
  expect(matches({ _id: 'qcoin-purchase:other', accountId: '0x9696969696969696969696969696969696969696' }, purchasePlan.filter)).toBe(false)
})

test('archives and detaches the surviving Wallet profile during a Telegram-side delete', async () => {
  const walletId = '0x9494949494949494949494949494949494949494'
  const telegramId = '6737969429'
  await memoryDb.collection('profiles').updateOne(
    { _id: `profile:${walletId}` },
    { $set: { principalId: walletId, accountId: walletId, userId: walletId, walletId, telegramId, nickname: 'Web survives' } },
    { upsert: true },
  )
  await memoryDb.collection('profiles').updateOne(
    { _id: `profile:${telegramId}` },
    { $set: { principalId: telegramId, accountId: telegramId, userId: telegramId, walletId: '', telegramId, nickname: 'Telegram deletes' } },
    { upsert: true },
  )
  await memoryDb.collection('profile_telegram_link_index').updateOne(
    { _id: `telegram:${telegramId}` },
    { $set: { telegramId, walletId, accountId: walletId, status: 'claimed' } },
    { upsert: true },
  )

  const context = await accountDeletion.__private.collectSideLinkContext(
    memoryDb,
    new Set(['profiles', 'profile_telegram_link_index']),
    'telegram',
    telegramId,
  )
  expect(context).toMatchObject({ identityScope: 'telegram', telegramId, walletId })
  expect(context.survivorProfiles).toHaveLength(1)
  expect(context.survivorProfiles[0]).toMatchObject({ nickname: 'Web survives', telegramId })

  await expect(accountDeletion.__private.detachSurvivingLinkProfiles(memoryDb, context)).resolves.toBe(1)
  expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${walletId}` }))
    .toMatchObject({ accountId: walletId, nickname: 'Web survives', telegramId: '' })
  expect(await memoryDb.collection('profiles').findOne({ _id: `profile:${telegramId}` }))
    .toMatchObject({ accountId: telegramId, nickname: 'Telegram deletes', telegramId })
})

test('archives only owned Redis records and purges exactly the archived keys', async () => {
  const telegramId = '6737969428'
  const rows = new Map([
    [`qcoin:${telegramId}`, { type: 'hash', value: { userId: telegramId, balance: '1' }, ttl: -1 }],
    ['invoice:15', { type: 'hash', value: { accountId: telegramId, status: 'pending' }, ttl: -1 }],
    ['ref:uid_by_code:test', { type: 'string', value: telegramId, ttl: -1 }],
    ['acc:0x9696969696969696969696969696969696969696', { type: 'hash', value: { tg_id: telegramId, balance: '7' }, ttl: -1 }],
    ['invoice:foreign', { type: 'hash', value: { accountId: '9999999999' }, ttl: -1 }],
    ['shared:unowned', { type: 'hash', value: { userId: telegramId }, ttl: -1 }],
  ])
  const redis = {
    async scan() {
      return ['0', Array.from(rows, ([key, row]) => ({ key, type: row.type }))]
    },
    async ttl(key) { return rows.get(key)?.ttl ?? -2 },
    async get(key) { return rows.get(key)?.value ?? null },
    async hgetall(key) { return rows.get(key)?.value ?? null },
    async smembers(key) { return rows.get(key)?.value ?? [] },
    async lrange(key) { return rows.get(key)?.value ?? [] },
    async zrange(key) { return rows.get(key)?.value ?? [] },
    async hdel(key, ...fields) {
      const row = rows.get(key)
      if (!row || !row.value || typeof row.value !== 'object') return 0
      let deleted = 0
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(row.value, field)) {
          delete row.value[field]
          deleted += 1
        }
      }
      return deleted
    },
    async del(...keys) {
      let deleted = 0
      for (const key of keys) {
        if (rows.delete(key)) deleted += 1
      }
      return deleted
    },
  }

  const snapshot = await accountDeletion.__private.collectRedisIdentityRecords(
    [telegramId, `telegram:${telegramId}`],
    redis,
  )
  expect(snapshot.records.map((row) => row.key).sort()).toEqual([
    'acc:0x9696969696969696969696969696969696969696',
    'invoice:15',
    `qcoin:${telegramId}`,
    'ref:uid_by_code:test',
  ])

  await expect(accountDeletion.__private.purgeRedisIdentityRecords(snapshot, redis))
    .resolves.toMatchObject({ deletedKeys: 3, removedFields: 1 })
  expect(Array.from(rows.keys()).sort()).toEqual([
    'acc:0x9696969696969696969696969696969696969696',
    'invoice:foreign',
    'shared:unowned',
  ])
  expect(rows.get('acc:0x9696969696969696969696969696969696969696').value)
    .toEqual({ balance: '7' })
})
test('allows canonical id and uid wrappers only for synthetic account-delete smoke identities', () => {
  const accountId =
    '0x71d7de1e7e2eae74c1ccbbcb5b7a054196bf4c69'

  const seed = '1788269055373'

  expect(() =>
    accountDeletion.__private.assertSyntheticSmokeScope({
      accountId,
      identityIds: [
        accountId,
        seed,
        `telegram:${seed}`,
        `id:${seed}`,
        `uid:${seed}`,
      ],
      rawIds: [
        seed,
        `telegram:${seed}`,
      ],
      source: 'direct-smoke-v4',
      requestMeta: {
        syntheticSmoke: true,
        mode: 'direct',
      },
    }),
  ).not.toThrow()

  expect(() =>
    accountDeletion.__private.assertSyntheticSmokeScope({
      accountId,
      identityIds: [
        accountId,
        'id:real-user',
      ],
      source: 'direct-smoke-v4',
      requestMeta: {
        syntheticSmoke: true,
        mode: 'direct',
      },
    }),
  ).toThrow(
    'synthetic_smoke_identity_guard_failed',
  )
})
})
