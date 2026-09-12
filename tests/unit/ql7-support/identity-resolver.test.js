import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@upstash/redis', () => ({ Redis: class Redis {} }))
vi.mock('../../../lib/mongo/profile-primary.cjs', () => ({
  default: {
    resolveCanonicalAccountId: vi.fn(async (value) => String(value || '').trim()),
  },
}))
vi.mock('../../../lib/tma.js', () => ({
  verifyInitData: vi.fn(() => ({ ok: false })),
  extractTelegramUserId: vi.fn(() => ''),
}))

import {
  __setQl7SupportIdentityTestStore,
  publicQl7VerifiedActorProjection,
  resolveQl7VerifiedActor,
} from '../../../lib/ql7-support/identityResolver.js'

const TOKEN = 'ql7ws_abcdefghijklmnopqrstuvwxyz1234567890'
const WALLET = '0x1111111111111111111111111111111111111111'
const NOW = Date.parse('2026-07-24T00:00:00.000Z')

function request(headers = {}) {
  return { headers: new Headers(headers) }
}

function store(entries = {}) {
  const values = new Map(Object.entries(entries))
  return { get: vi.fn(async (key) => values.get(key) ?? null) }
}

afterEach(() => {
  __setQl7SupportIdentityTestStore(null)
})

describe('QL7 Support verified actor resolver', () => {
  test('does not trust x-forum-user-id without wallet or Telegram proof', async () => {
    __setQl7SupportIdentityTestStore(store())
    const actor = await resolveQl7VerifiedActor({
      req: request({ 'x-forum-user-id': WALLET }),
      body: {},
      database: null,
      clock: () => NOW,
    })
    expect(actor).toMatchObject({ valid: false, failureCode: 'verified_session_required', authMode: 'none' })
  })

  test('rejects a session that has no latest-session binding', async () => {
    __setQl7SupportIdentityTestStore(store({
      [`wallet_session:${TOKEN}`]: {
        status: 'active',
        walletAddress: WALLET,
        accountId: WALLET,
        expiresAt: NOW + 60_000,
      },
    }))
    const actor = await resolveQl7VerifiedActor({
      req: request({
        'x-wallet-session-token': TOKEN,
        'x-wallet-address': WALLET,
        'x-auth-account-id': WALLET,
      }),
      body: {},
      database: null,
      clock: () => NOW,
    })
    expect(actor).toMatchObject({ valid: false, failureCode: 'wallet_session_latest_missing' })
  })

  test('accepts the active latest wallet session and exposes only a safe projection', async () => {
    const session = {
      status: 'active',
      walletAddress: WALLET,
      accountId: WALLET,
      expiresAt: NOW + 60_000,
    }
    const latest = { token: TOKEN, status: 'active', walletAddress: WALLET, accountId: WALLET }
    __setQl7SupportIdentityTestStore(store({
      [`wallet_session:${TOKEN}`]: session,
      [`wallet_session_latest:${WALLET.toLowerCase()}`]: latest,
    }))
    const actor = await resolveQl7VerifiedActor({
      req: request({
        'x-wallet-session-token': TOKEN,
        'x-wallet-address': WALLET,
        'x-auth-account-id': WALLET,
      }),
      body: {},
      database: null,
      clock: () => NOW,
    })
    expect(actor).toMatchObject({
      valid: true,
      authMode: 'wallet_session',
      canonicalAccountId: WALLET,
      walletMasked: '0x11…1111',
    })
    const projection = publicQl7VerifiedActorProjection(actor)
    expect(projection).not.toHaveProperty('token')
    expect(projection).not.toHaveProperty('walletAddress')
    expect(JSON.stringify(projection)).not.toContain(TOKEN)
  })

  test('rejects a stale token when another latest session is active', async () => {
    __setQl7SupportIdentityTestStore(store({
      [`wallet_session:${TOKEN}`]: {
        status: 'active',
        walletAddress: WALLET,
        accountId: WALLET,
        expiresAt: NOW + 60_000,
      },
      [`wallet_session_latest:${WALLET.toLowerCase()}`]: {
        token: 'ql7ws_other_latest_token_1234567890',
        status: 'active',
      },
    }))
    const actor = await resolveQl7VerifiedActor({
      req: request({
        'x-wallet-session-token': TOKEN,
        'x-wallet-address': WALLET,
      }),
      body: {},
      database: null,
      clock: () => NOW,
    })
    expect(actor).toMatchObject({ valid: false, failureCode: 'wallet_session_stale' })
  })
})
