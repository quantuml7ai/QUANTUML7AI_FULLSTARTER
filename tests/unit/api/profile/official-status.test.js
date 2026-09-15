import { describe, expect, test, vi } from 'vitest'
import { isOfficialProfile, parseOfficialStatusIds } from '../../../../app/api/profile/_officialStatus.js'

describe('Official profile status allowlist', () => {
  test('parses supported delimiters and de-duplicates IDs', () => {
    expect(parseOfficialStatusIds(' 0xabc,telegram:42; account-7\n0xabc ')).toEqual([
      '0xabc',
      'telegram:42',
      'account-7',
    ])
  })

  test('matches canonical and exact raw identities without another identity lookup', async () => {
    const resolver = vi.fn(async () => ({ ids: ['should-not-run'] }))

    await expect(isOfficialProfile({
      rawUserId: 'telegram:42',
      accountId: '0xabc',
      envValue: '0xabc',
      resolveConfiguredIds: resolver,
    })).resolves.toBe(true)

    await expect(isOfficialProfile({
      rawUserId: 'telegram:42',
      accountId: '0xabc',
      envValue: 'telegram:42',
      resolveConfiguredIds: resolver,
    })).resolves.toBe(true)

    expect(resolver).not.toHaveBeenCalled()
  })

  test('resolves a configured Telegram/raw alias onto the canonical account', async () => {
    const resolver = vi.fn(async (ids) => ({
      ids: ids.map((id) => id === 'telegram:900003' ? '0xabc' : id),
    }))

    await expect(isOfficialProfile({
      rawUserId: '0xabc',
      accountId: '0xabc',
      envValue: 'telegram:900003',
      resolveConfiguredIds: resolver,
    })).resolves.toBe(true)

    expect(resolver).toHaveBeenCalledWith(['telegram:900003'])
  })

  test('fails closed for unrelated IDs, identity errors, missing resolver, empty env, and missing canonical account', async () => {
    await expect(isOfficialProfile({
      rawUserId: 'telegram:1',
      accountId: '0xabc',
      envValue: 'telegram:2',
      resolveConfiguredIds: async () => ({ ids: ['0xdef'] }),
    })).resolves.toBe(false)

    await expect(isOfficialProfile({
      rawUserId: 'telegram:1',
      accountId: '0xabc',
      envValue: 'telegram:2',
      resolveConfiguredIds: async () => { throw new Error('identity unavailable') },
    })).resolves.toBe(false)

    await expect(isOfficialProfile({
      rawUserId: 'telegram:1',
      accountId: '0xabc',
      envValue: 'telegram:2',
    })).resolves.toBe(false)

    await expect(isOfficialProfile({
      rawUserId: 'telegram:1',
      accountId: '0xabc',
      envValue: '',
      resolveConfiguredIds: async () => ({ ids: ['0xabc'] }),
    })).resolves.toBe(false)

    await expect(isOfficialProfile({
      rawUserId: 'telegram:1',
      accountId: '',
      envValue: 'telegram:1',
      resolveConfiguredIds: async () => ({ ids: ['0xabc'] }),
    })).resolves.toBe(false)
  })
})
