import { beforeEach, describe, expect, it, vi } from 'vitest'
const routeHarness = vi.hoisted(() => {
  const state = {
    snapshot: { posts: [], topics: [], banned: [] },
    requestUserId: '',
    aliases: {},
    profileNick: {},
    profileAvatar: {},
    followers: {},
    vip: {},
  }

  const K = {
    userNick: (id) => `nick:${id}`,
    userAvatar: (id) => `avatar:${id}`,
    subsFollowersCount: (id) => `followers:${id}`,
  }

  function readStoreValue(key) {
    if (key.startsWith('nick:')) return state.profileNick[key.slice('nick:'.length)] || ''
    if (key.startsWith('avatar:')) return state.profileAvatar[key.slice('avatar:'.length)] || ''
    if (key.startsWith('followers:')) return state.followers[key.slice('followers:'.length)] || 0
    return ''
  }

  const redis = {
    multi() {
      const ops = []
      return {
        get(key) {
          ops.push(key)
          return this
        },
        async exec() {
          return ops.map((key) => ({ result: readStoreValue(key) }))
        },
      }
    },
  }

  return {
    state,
    K,
    redis,
    snapshot: vi.fn(async () => state.snapshot),
    getUserIdFromReq: vi.fn(() => state.requestUserId),
    resolveCanonicalAccountId: vi.fn(async (id) => state.aliases[id] || id),
    resolveCanonicalAccountIds: vi.fn(async (ids) => ({
      ids: ids.map((id) => state.aliases[id] || id),
      aliases: Object.fromEntries(ids.map((id) => [id, state.aliases[id] || id])),
    })),
    isVipNow: vi.fn(async (id) => ({ active: !!state.vip[id] })),
  }
})

vi.mock('../../../../app/api/forum/_db.js', () => ({
  snapshot: routeHarness.snapshot,
  K: routeHarness.K,
  redis: routeHarness.redis,
}))

vi.mock('../../../../app/api/forum/_utils.js', () => ({
  getUserIdFromReq: routeHarness.getUserIdFromReq,
}))

vi.mock('../../../../app/api/profile/_identity.js', () => ({
  resolveCanonicalAccountId: routeHarness.resolveCanonicalAccountId,
  resolveCanonicalAccountIds: routeHarness.resolveCanonicalAccountIds,
}))

vi.mock('../../../../lib/subscriptions.js', () => ({
  isVipNow: routeHarness.isVipNow,
}))

function makePost(userId, index, overrides = {}) {
  return {
    id: `post-${index}`,
    userId,
    nickname: `Snapshot ${index}`,
    avatar: `/avatars/${index}.png`,
    ts: 1000 - index,
    ...overrides,
  }
}

function seedUsers(userIds) {
  routeHarness.state.snapshot = {
    posts: userIds.map((userId, index) => makePost(userId, index + 1)),
    topics: [],
    banned: [],
  }
  routeHarness.state.profileNick = {}
  routeHarness.state.profileAvatar = {}
  routeHarness.state.followers = {}
  routeHarness.state.vip = {}

  userIds.forEach((userId, index) => {
    const canonicalId = routeHarness.state.aliases[userId] || userId
    routeHarness.state.profileNick[canonicalId] = `Profile ${index + 1}`
    routeHarness.state.profileAvatar[canonicalId] = `/cdn/${canonicalId}.png`
    routeHarness.state.followers[canonicalId] = (index + 1) * 10
    routeHarness.state.vip[canonicalId] = index === 0
  })
}

async function loadRouteModule() {
  vi.resetModules()
  return import('../../../../app/api/forum/recommendations/users/route.js')
}

describe('GET /api/forum/recommendations/users', () => {
  beforeEach(() => {
    routeHarness.state.snapshot = { posts: [], topics: [], banned: [] }
    routeHarness.state.requestUserId = ''
    routeHarness.state.aliases = {}
    routeHarness.state.profileNick = {}
    routeHarness.state.profileAvatar = {}
    routeHarness.state.followers = {}
    routeHarness.state.vip = {}
    vi.clearAllMocks()
  })

  it('returns a valid recommendation structure without duplicates inside a batch', async () => {
    seedUsers(['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'])
    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=3&batches=2'),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.rotationKey).toContain('video:new:')
    expect(payload.batches).toHaveLength(2)

    payload.batches.forEach((batch) => {
      expect(batch.users).toHaveLength(3)
      expect(new Set(batch.users.map((user) => user.canonicalAccountId)).size).toBe(3)
      expect(batch.users[0]).toEqual(expect.objectContaining({
        userId: expect.any(String),
        canonicalAccountId: expect.any(String),
        nickname: expect.any(String),
        avatar: expect.any(String),
        followersCount: expect.any(Number),
        isVip: expect.any(Boolean),
      }))
    })
  })

  it('returns a smaller non-repeating batch when the valid pool is smaller than the target size', async () => {
    seedUsers(['user-1', 'user-2'])
    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=6&batches=1'),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.batches).toHaveLength(1)
    expect(payload.batches[0].users).toHaveLength(2)
    expect(new Set(payload.batches[0].users.map((user) => user.canonicalAccountId)).size).toBe(2)
  })

  it('excludes the current viewer from recommendation batches', async () => {
    seedUsers(['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'])
    routeHarness.state.requestUserId = 'user-3'
    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=3&batches=2'),
    )
    const payload = await response.json()

    const allIds = payload.batches.flatMap((batch) => batch.users.map((user) => user.canonicalAccountId))
    expect(allIds).not.toContain('user-3')
  })

  it('filters out users without nickname, avatar or stars before returning batches', async () => {
    seedUsers(['user-1', 'user-2', 'user-3', 'user-4'])
    routeHarness.state.snapshot.posts[1].nickname = ''
    routeHarness.state.snapshot.posts[2].avatar = ''
    routeHarness.state.profileNick['user-2'] = ''
    routeHarness.state.profileAvatar['user-3'] = ''
    routeHarness.state.followers['user-4'] = 0

    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=4&batches=1'),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.batches).toHaveLength(1)
    expect(payload.batches[0].users.map((user) => user.canonicalAccountId)).toEqual(['user-1'])
  })

  it('can refill later batches from the same shuffled pool without duplicates inside a batch', async () => {
    seedUsers(['user-1', 'user-2', 'user-3', 'user-4'])
    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=3&batches=3'),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.batches).toHaveLength(3)
    payload.batches.forEach((batch) => {
      expect(batch.users).toHaveLength(3)
      expect(new Set(batch.users.map((user) => user.canonicalAccountId)).size).toBe(3)
    })
  })

  it('fails with a stable error payload when the endpoint throws', async () => {
    routeHarness.snapshot.mockImplementationOnce(async () => {
      throw new Error('snapshot_failed')
    })
    const { GET } = await loadRouteModule()

    const response = await GET(
      new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new'),
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('snapshot_failed')
  })
})
