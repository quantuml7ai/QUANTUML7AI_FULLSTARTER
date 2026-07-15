import { beforeEach, describe, expect, test, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  state: {
    aliases: {},
    resolverThrows: false,
    pages: {},
    counts: {},
    countThrows: {},
    users: {},
    usersEmpty: false,
    usersThrow: false,
  },
}))

vi.mock('../../../../app/api/forum/_utils.js', () => ({
  json: (body, status = 200) => Response.json(body, { status }),
  parseIntSafe: (value, fallback = 0) => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(parsed) ? parsed : fallback
  },
}))

vi.mock('../../../../app/api/profile/_identity.js', () => ({
  resolveCanonicalAccountId: vi.fn(async (id) => {
    if (harness.state.resolverThrows) throw new Error('identity_unavailable')
    return harness.state.aliases[id] || id
  }),
  resolveCanonicalAccountIds: vi.fn(async (ids) => ({
    ids: ids.map((id) => harness.state.aliases[id] || id),
    aliases: { ...harness.state.aliases },
  })),
}))

vi.mock('../../../../app/api/forum/_db.js', () => ({
  SUBS_SEARCH_MAX_CANDIDATES: 50,
  SUBS_SEARCH_MIN_CHARS: 2,
  filterCandidatesBySubscriptionRelation: vi.fn(async () => []),
  getSubscriptionCounts: vi.fn(async (id) => {
    if (harness.state.countThrows[id]) throw new Error('counts_unavailable')
    return harness.state.counts[id] || { followers: 0, following: 0 }
  }),
  getUsersPublicMini: vi.fn(async (ids) => {
    if (harness.state.usersThrow) throw new Error('users_unavailable')
    if (harness.state.usersEmpty) return []
    return ids.map((id) => harness.state.users[id] || { userId: id, nickname: id, icon: '' })
  }),
  isLikelyExactUserId: vi.fn(() => false),
  listSubscriptionPeoplePage: vi.fn(async ({ userId }) => {
    const page = harness.state.pages[userId]
    if (page === 'throw') throw new Error('page_unavailable')
    return page || { ids: [], users: [], counts: { followers: 0, following: 0 }, nextCursor: null, hasMore: false }
  }),
  normalizeUserSearchText: vi.fn((value) => String(value || '').trim().toLowerCase()),
  searchUsersByPrefixPage: vi.fn(async () => ({ rows: [], nextCursor: null, hasMore: false })),
}))


vi.mock('../../../../lib/mongo/forum-primary.cjs', () => {
  const forumPrimaryMock = {
    getSubscriptionCounts: vi.fn(async (id) => {
      if (harness.state.countThrows[id]) throw new Error('counts_unavailable')
      return harness.state.counts[id] || { followers: 0, following: 0 }
    }),
    listSubscriptionPeoplePage: vi.fn(async ({ userId }) => {
      const page = harness.state.pages[userId]
      if (page === 'throw') throw new Error('page_unavailable')
      return page || { ids: [], users: [], counts: { followers: 0, following: 0 }, nextCursor: null, hasMore: false }
    }),
  }
  return { __esModule: true, default: forumPrimaryMock, ...forumPrimaryMock }
})

describe('/api/forum/subs/people Mongo identity compatibility', () => {
  beforeEach(() => {
    harness.state.aliases = {}
    harness.state.resolverThrows = false
    harness.state.pages = {}
    harness.state.counts = {}
    harness.state.countThrows = {}
    harness.state.users = {}
    harness.state.usersEmpty = false
    harness.state.usersThrow = false
    vi.resetModules()
  })

  test('falls back to raw subscription rows when canonical page is unavailable', async () => {
    harness.state.aliases['telegram:42'] = '0xabc'
    harness.state.pages['0xabc'] = 'throw'
    harness.state.pages['telegram:42'] = {
      ids: ['0xfriend'],
      users: [{ userId: '0xfriend', nickname: '0xfriend', icon: '' }],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['telegram:42'] = { followers: 1, following: 0 }

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=telegram:42&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      ok: true,
      userId: '0xabc',
      rawUserId: 'telegram:42',
      users: [{ userId: '0xfriend', nickname: '0xfriend', icon: '' }],
      totalCount: 1,
      counts: { followers: 1, following: 0 },
      storagePrimary: 'mongo',
    })
  })

  test('keeps Quantum Family open when canonical identity resolution fails', async () => {
    harness.state.resolverThrows = true
    harness.state.pages['0xraw'] = {
      ids: ['0xfriend'],
      users: [{ userId: '0xfriend', nickname: '0xfriend', icon: '' }],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['0xraw'] = { followers: 1, following: 0 }

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=0xraw&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      ok: true,
      userId: '0xraw',
      rawUserId: '0xraw',
      users: [{ userId: '0xfriend', nickname: '0xfriend', icon: '' }],
      totalCount: 1,
      counts: { followers: 1, following: 0 },
      storagePrimary: 'mongo',
    })
  })

  test('hydrates Quantum Family users from ids when Mongo page has no embedded user cards', async () => {
    harness.state.pages['0xraw'] = {
      ids: ['0xfriend'],
      users: [],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['0xraw'] = { followers: 1, following: 0 }
    harness.state.users['0xfriend'] = { userId: '0xfriend', nickname: 'Friend', icon: '/friend.png' }

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=0xraw&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      ok: true,
      userId: '0xraw',
      rawUserId: '0xraw',
      users: [{ userId: '0xfriend', nickname: 'Friend', icon: '/friend.png' }],
      totalCount: 1,
      counts: { followers: 1, following: 0 },
      storagePrimary: 'mongo',
    })
  })

  test('returns anonymous-compatible Quantum Family rows when profile hydration is empty', async () => {
    harness.state.pages['0xraw'] = {
      ids: ['0xfriend'],
      users: [],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['0xraw'] = { followers: 1, following: 0 }
    harness.state.usersEmpty = true

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=0xraw&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      ok: true,
      users: [{ userId: '0xfriend', nickname: '', icon: '' }],
      totalCount: 1,
      counts: { followers: 1, following: 0 },
      storagePrimary: 'mongo',
    })
  })

  test('returns anonymous-compatible Quantum Family rows when profile hydration fails', async () => {
    harness.state.pages['0xraw'] = {
      ids: ['0xfriend'],
      users: [],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['0xraw'] = { followers: 1, following: 0 }
    harness.state.usersThrow = true

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=0xraw&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      ok: true,
      users: [{ userId: '0xfriend', nickname: '', icon: '' }],
      totalCount: 1,
      counts: { followers: 1, following: 0 },
      storagePrimary: 'mongo',
    })
  })

  test('hydrates canonical and raw relation ids through profile mini rows', async () => {
    harness.state.aliases['telegram:42'] = '0xabc'
    harness.state.pages['0xabc'] = {
      ids: ['0xanon'],
      users: [],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.pages['telegram:42'] = {
      ids: ['tg-friend'],
      users: [{ userId: 'tg-friend', nickname: 'CLIO', icon: '/clio.png' }],
      counts: { followers: 1, following: 0 },
      nextCursor: null,
      hasMore: false,
    }
    harness.state.counts['0xabc'] = { followers: 1, following: 0 }
    harness.state.counts['telegram:42'] = { followers: 1, following: 0 }
    harness.state.users['tg-friend'] = { userId: 'tg-friend', nickname: 'CLIO', icon: '/clio.png' }

    const { GET } = await import('../../../../app/api/forum/subs/people/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/people?userId=telegram:42&mode=followers&limit=50'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.users).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: 'tg-friend', nickname: 'CLIO', icon: '/clio.png' }),
    ]))
    expect(json.ids).toContain('tg-friend')
    expect(json.totalCount).toBe(2)
  })

  test('normalizeStarredAuthorId lower-cases wallet aliases for reload-safe stars', async () => {
    const { normalizeStarredAuthorId } = await import('../../../../app/forum/features/subscriptions/utils/starred.js')
    const checksum = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const lower = checksum.toLowerCase()

    expect(normalizeStarredAuthorId(checksum)).toBe(lower)
    expect(normalizeStarredAuthorId(`wallet:${checksum}`)).toBe(lower)
  })
})
