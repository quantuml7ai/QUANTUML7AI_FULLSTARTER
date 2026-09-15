import { beforeEach, describe, expect, it, vi } from 'vitest'

const routeHarness = vi.hoisted(() => ({
  state: { requestUserId: '', aliases: {} },
  getUserIdFromReq: vi.fn(() => ''),
  resolveCanonicalAccountId: vi.fn(async (id) => id),
  resolveCanonicalAccountIds: vi.fn(async (ids) => ({ ids })),
  weeklyBuildKey: vi.fn(() => '2026-09-14'),
  getSnapshot: vi.fn(async () => ({
    ok: true,
    users: [
      { userId: 'user-1', canonicalAccountId: 'user-1', nickname: 'User 1', avatar: '/a.png', followersCount: 1, isVip: false },
      { userId: 'user-2', canonicalAccountId: 'user-2', nickname: 'User 2', avatar: '/b.png', followersCount: 20, isVip: true },
    ],
    storagePrimary: 'mongo',
    poolVersion: 'weekly-top:v1:test',
    poolSize: 500,
    poolBuiltAt: '2026-09-14T10:00:00.000Z',
    buildWeek: '2026-09-14',
    targetBuildWeek: '2026-09-14',
    nextBuildAt: '2026-09-21T00:00:00.000Z',
    rebuildDue: false,
    poolReady: true,
  })),
  rebuildPool: vi.fn(async () => ({
    ok: true,
    rebuilt: true,
    buildWeek: '2026-09-14',
    poolVersion: 'weekly-top:v1:new',
    poolSize: 500,
  })),
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
    weeklyBuildKey: routeHarness.weeklyBuildKey,
    getSnapshot: routeHarness.getSnapshot,
    rebuildPool: routeHarness.rebuildPool,
  },
}))

async function loadRouteModule() {
  vi.resetModules()
  return import('../../../../app/api/forum/recommendations/users/route.js')
}

describe('/api/forum/recommendations/users weekly Top-500 route', () => {
  beforeEach(() => {
    routeHarness.state.requestUserId = ''
    routeHarness.state.aliases = {}
    routeHarness.getUserIdFromReq.mockImplementation(() => routeHarness.state.requestUserId)
    routeHarness.resolveCanonicalAccountId.mockImplementation(async (id) => routeHarness.state.aliases[id] || id)
    routeHarness.resolveCanonicalAccountIds.mockImplementation(async (ids) => ({
      ids: ids.map((id) => routeHarness.state.aliases[id] || id),
    }))
    routeHarness.weeklyBuildKey.mockReturnValue('2026-09-14')
    vi.clearAllMocks()
  })

  it('GET exposes the complete weekly snapshot and ignores legacy cursor/batch controls', async () => {
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users?cursor=old&batchSize=6&batches=8&sort=new'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(payload).toEqual(expect.objectContaining({
      ok: true,
      users: expect.any(Array),
      poolVersion: 'weekly-top:v1:test',
      poolSize: 500,
      buildWeek: '2026-09-14',
      targetBuildWeek: '2026-09-14',
      poolReady: true,
      viewerCanonicalId: '',
    }))
    expect(routeHarness.getSnapshot).toHaveBeenCalledTimes(1)
    expect(routeHarness.getSnapshot).toHaveBeenCalledWith({
      viewerId: '',
      excludeIds: [],
      requestIdentityResolved: true,
    })
  })

  it('GET resolves canonical Wallet/Telegram viewer and exclusions without rebuilding', async () => {
    routeHarness.state.requestUserId = 'wallet:legacy-viewer'
    routeHarness.state.aliases = {
      'wallet:legacy-viewer': 'viewer-canonical',
      'telegram:7': 'excluded-canonical',
    }
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users?excludeIds=telegram:7'))
    const payload = await response.json()

    expect(payload.viewerCanonicalId).toBe('viewer-canonical')
    expect(routeHarness.getSnapshot).toHaveBeenCalledWith({
      viewerId: 'viewer-canonical',
      excludeIds: expect.arrayContaining(['excluded-canonical', 'telegram:7']),
      requestIdentityResolved: true,
    })
    expect(routeHarness.rebuildPool).not.toHaveBeenCalled()
  })

  it('POST accepts only the server current week and delegates to the atomic lease', async () => {
    const { POST } = await loadRouteModule()
    const response = await POST(new Request('http://localhost/api/forum/recommendations/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetBuildWeek: '2026-09-14' }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.rebuilt).toBe(true)
    expect(routeHarness.rebuildPool).toHaveBeenCalledWith(expect.objectContaining({
      force: false,
      reason: 'first_active_device_weekly_trigger',
      nowMs: expect.any(Number),
    }))
  })

  it('rejects stale or forged week triggers before the rebuild engine', async () => {
    const { POST } = await loadRouteModule()
    const response = await POST(new Request('http://localhost/api/forum/recommendations/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetBuildWeek: '2026-09-07' }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload).toEqual(expect.objectContaining({ error: 'invalid_target_build_week', targetBuildWeek: '2026-09-14' }))
    expect(routeHarness.rebuildPool).not.toHaveBeenCalled()
  })

  it('returns a stable error payload when the snapshot read fails', async () => {
    routeHarness.getSnapshot.mockRejectedValueOnce(new Error('pool_read_failed'))
    const { GET } = await loadRouteModule()
    const response = await GET(new Request('http://localhost/api/forum/recommendations/users'))
    const payload = await response.json()
    expect(response.status).toBe(500)
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('pool_read_failed')
  })
})
