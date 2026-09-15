import { beforeEach, describe, expect, test, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  listSubscriptions: vi.fn(),
  resolveCanonicalAccountId: vi.fn(),
  resolveCanonicalAccountIds: vi.fn(),
  requireUserId: vi.fn(),
}))

vi.mock('../../../../app/api/forum/_utils.js', () => ({
  json: (body, status = 200) => Response.json(body, { status }),
  requireUserId: harness.requireUserId,
}))

vi.mock('../../../../app/api/forum/_db.js', () => ({
  listSubscriptions: harness.listSubscriptions,
}))

vi.mock('../../../../app/api/profile/_identity.js', () => ({
  resolveCanonicalAccountId: harness.resolveCanonicalAccountId,
  resolveCanonicalAccountIds: harness.resolveCanonicalAccountIds,
}))

describe('/api/forum/subs/list single-read identity compatibility', () => {
  beforeEach(() => {
    vi.resetModules()
    harness.listSubscriptions.mockReset()
    harness.resolveCanonicalAccountId.mockReset()
    harness.resolveCanonicalAccountIds.mockReset()
    harness.requireUserId.mockReset()
  })

  test('reads a TMA viewer once through the alias-aware Mongo layer and preserves unresolved legacy members', async () => {
    const canonicalViewer = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
    const canonicalAuthor = '0x8a87d616739dD7311c4403fb18cD9A3c58817EC6'

    harness.resolveCanonicalAccountId.mockResolvedValue(canonicalViewer)
    harness.listSubscriptions.mockResolvedValue([
      'telegram:888002',
      'legacy-forum-user',
      canonicalAuthor,
      'telegram:888002',
    ])
    harness.resolveCanonicalAccountIds.mockResolvedValue({
      // ids intentionally omit the unresolved legacy relation. The route must not
      // use this lossy aggregate as the source of truth for the response.
      ids: [canonicalAuthor],
      aliases: {
        'telegram:888002': canonicalAuthor,
        '888002': canonicalAuthor,
      },
    })

    const { GET } = await import('../../../../app/api/forum/subs/list/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/list?viewerId=tma:777001'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(harness.resolveCanonicalAccountId).toHaveBeenCalledTimes(1)
    expect(harness.resolveCanonicalAccountId).toHaveBeenCalledWith('tma:777001')
    expect(harness.listSubscriptions).toHaveBeenCalledTimes(1)
    expect(harness.listSubscriptions).toHaveBeenCalledWith('tma:777001')
    expect(harness.resolveCanonicalAccountIds).toHaveBeenCalledTimes(1)
    expect(harness.resolveCanonicalAccountIds).toHaveBeenCalledWith([
      'telegram:888002',
      'legacy-forum-user',
      canonicalAuthor,
    ])
    expect(json).toMatchObject({
      ok: true,
      viewerId: canonicalViewer,
      subscriptions: [canonicalAuthor, 'legacy-forum-user'],
      ids: [canonicalAuthor, 'legacy-forum-user'],
      authors: [canonicalAuthor, 'legacy-forum-user'],
      storagePrimary: 'mongo',
    })
  })

  test('keeps the stored relation list readable when author canonicalization is temporarily unavailable', async () => {
    harness.resolveCanonicalAccountId.mockResolvedValue('777001')
    harness.listSubscriptions.mockResolvedValue(['telegram:888002', 'legacy-forum-user'])
    harness.resolveCanonicalAccountIds.mockRejectedValue(new Error('identity_temporarily_unavailable'))

    const { GET } = await import('../../../../app/api/forum/subs/list/route.js')
    const res = await GET(new Request('https://example.test/api/forum/subs/list?viewerId=telegram:777001'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(harness.listSubscriptions).toHaveBeenCalledTimes(1)
    expect(harness.listSubscriptions).toHaveBeenCalledWith('telegram:777001')
    expect(json.subscriptions).toEqual(['telegram:888002', 'legacy-forum-user'])
  })
})
