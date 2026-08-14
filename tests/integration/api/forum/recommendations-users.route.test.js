import { beforeEach, describe, expect, it, vi } from 'vitest'

const routeHarness = vi.hoisted(() => ({
  state: {
    requestUserId: '',
    aliases: {},
  },
  getUserIdFromReq: vi.fn(() => ''),
  resolveCanonicalAccountId: vi.fn(async (id) => id),
  resolveCanonicalAccountIds: vi.fn(async (ids) => ({ ids, aliases: Object.fromEntries(ids.map((id) => [id, id])) })),
  getPage: vi.fn(async () => ({
    ok: true,
    seed: 42,
    rotationKey: 'video:new:weekly-top:v1:test:c0',
    ttlSec: 30,
    batches: [{
      batchId: 'weekly-top:v1:test:0:0',
      users: [
        { userId: 'user-1', canonicalAccountId: 'user-1', nickname: 'User 1', avatar: '/a.png', followersCount: 1, isVip: false },
        { userId: 'user-2', canonicalAccountId: 'user-2', nickname: 'User 2', avatar: '/b.png', followersCount: 20, isVip: true },
      ],
    }],
    storagePrimary: 'mongo',
    poolVersion: 'weekly-top:v1:test',
    poolSize: 500,
    poolBuiltAt: '2026-08-12T10:00:00.000Z',
    nextCursor: 'cursor-1',
    rebuildDue: false,
  })),
  rebuildPool: vi.fn(async () => ({ ok: true, rebuilt: true, poolVersion: 'weekly-top:v1:new', poolSize: 500 })),
}))

vi.mock('../../../../app/api/forum/_utils.js', () => ({
  getUserIdFromReq: routeHarness.getUserIdFromReq,
}))

vi.mock('../../../../app/api/profile/_identity.js', () => ({
  resolveCanonicalAccountId: routeHarness.resolveCanonicalAccountId,
  resolveCanonicalAccountIds: routeHarness.resolveCanonicalAccountIds,
}))

vi.mock('../../../../lib/forum/forum-user-recommendation-pool.cjs', () => ({
  default: {
    getPage: routeHarness.getPage,
    rebuildPool: routeHarness.rebuildPool,
  },
}))

async function loadRouteModule() {
  vi.resetModules()
  return import('../../../../app/api/forum/recommendations/users/route.js')
}

describe('/api/forum/recommendations/users Top-500 route', () => {
  beforeEach(() => {
    routeHarness.state.requestUserId = ''
    routeHarness.state.aliases = {}
    routeHarness.getUserIdFromReq.mockImplementation(() => routeHarness.state.requestUserId)
    routeHarness.resolveCanonicalAccountId.mockImplementation(async (id) => routeHarness.state.aliases[id] || id)
    routeHarness.resolveCanonicalAccountIds.mockImplementation(async (ids) => ({
      ids: ids.map((id) => routeHarness.state.aliases[id] || id),
      aliases: Object.fromEntries(ids.map((id) => [id, routeHarness.state.aliases[id] || id])),
    }))
    vi.clearAllMocks()
  })

  it('GET preserves the rail response contract and exposes Top-500 cursor metadata', async () => {
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users?feedMode=video&sort=new&batchSize=15&batches=4&cursor=abc'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual(expect.objectContaining({
      ok: true,
      seed: expect.any(Number),
      rotationKey: expect.any(String),
      ttlSec: expect.any(Number),
      batches: expect.any(Array),
      storagePrimary: 'mongo',
      poolVersion: 'weekly-top:v1:test',
      poolSize: 500,
      nextCursor: 'cursor-1',
      viewerCanonicalId: '',
    }))
    expect(routeHarness.getPage).toHaveBeenCalledWith(expect.objectContaining({
      cursor: 'abc',
      batchSize: 15,
      batchCount: 4,
      feedMode: 'video',
      sort: 'new',
    }))
  })

  it('ignores legacy batchSize overrides and always requests exactly 15 users per rail', async () => {
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users?batchSize=6&batches=1'))
    expect(response.status).toBe(200)
    expect(routeHarness.getPage).toHaveBeenCalledWith(expect.objectContaining({ batchSize: 15, batchCount: 1 }))
  })

  it('GET resolves viewer/excludes and never performs a rebuild itself', async () => {
    routeHarness.state.requestUserId = 'legacy-viewer'
    routeHarness.state.aliases = { 'legacy-viewer': 'viewer-canonical', 'legacy-x': 'x-canonical' }
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users?excludeIds=legacy-x'))
    const payload = await response.json()

    expect(payload.viewerCanonicalId).toBe('viewer-canonical')
    expect(routeHarness.getPage).toHaveBeenCalledWith(expect.objectContaining({
      viewerId: 'viewer-canonical',
      excludeIds: expect.arrayContaining(['x-canonical', 'legacy-x']),
    }))
    expect(routeHarness.rebuildPool).not.toHaveBeenCalled()
  })

  it('POST delegates due rebuild to the lease-protected Mongo engine', async () => {
    const { POST } = await loadRouteModule()
    const response = await POST()
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.rebuilt).toBe(true)
    expect(routeHarness.rebuildPool).toHaveBeenCalledWith({ force: false, reason: 'client_due_trigger' })
  })

  it('returns a stable error payload when the pool read fails', async () => {
    routeHarness.getPage.mockRejectedValueOnce(new Error('pool_read_failed'))
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users'))
    const payload = await response.json()
    expect(response.status).toBe(500)
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('pool_read_failed')
  })
})
