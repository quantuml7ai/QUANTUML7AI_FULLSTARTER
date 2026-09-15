import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useUserRecommendationsRail, {
  __resetUserRecommendationsRailForTests,
  buildRecommendationRailBatches,
  clientWeeklyBuildKey,
  nextRecommendationWeekBoundaryMs,
} from '../../../../../../app/forum/features/feed/hooks/useUserRecommendationsRail.js'
import usePublishedPostsModel from '../../../../../../app/forum/features/feed/hooks/usePublishedPostsModel.js'
import useThreadPostsModel from '../../../../../../app/forum/features/feed/hooks/useThreadPostsModel.js'
import useTopicDiscoveryModel from '../../../../../../app/forum/features/feed/hooks/useTopicDiscoveryModel.js'
import usePostMediaTextModel, { extractPostPrewarmHints } from '../../../../../../app/forum/features/feed/hooks/usePostMediaTextModel.js'
import useVideoFeedState, { mergeVideoFeedServerPostWithLocal } from '../../../../../../app/forum/features/media/hooks/useVideoFeedState.js'
import {
  isRetryableVideoFeedPageResult,
  patchVideoFeedReactionOverlay,
  videoFeedRecoveryDelayMs,
} from '../../../../../../app/forum/features/media/hooks/useForumVideoFeedRuntime.js'
import useForumComposerAttachments from '../../../../../../app/forum/features/media/hooks/useForumComposerAttachments.js'
import useForumMutationQueue from '../../../../../../app/forum/features/feed/hooks/useForumMutationQueue.js'
import { prioritizeStarredItems } from '../../../../../../app/forum/features/subscriptions/utils/starred.js'
import { createRecommendationUser } from '../../../../../fixtures/forum/recommendations.js'

function createBatch(batchId, startIndex) {
  return {
    batchId,
    users: [
      createRecommendationUser(startIndex, {
        userId: `${batchId}-user-1`,
        canonicalAccountId: `${batchId}-user-1`,
        nickname: `${batchId} User 1`,
      }),
      createRecommendationUser(startIndex + 1, {
        userId: `${batchId}-user-2`,
        canonicalAccountId: `${batchId}-user-2`,
        nickname: `${batchId} User 2`,
      }),
    ],
  }
}

describe('useUserRecommendationsRail', () => {
  const slots = (count) => Array.from({ length: count }, (_, index) => ({
    type: 'recommendation_rail',
    key: 'rec:' + index,
    railIndex: index,
  }))

  const users = (count, prefix = 'user') => Array.from({ length: count }, (_, index) => (
    createRecommendationUser(index + 1, {
      userId: prefix + '-' + index,
      canonicalAccountId: prefix + '-' + index,
      nickname: 'User ' + index,
      avatar: '/avatar-' + index + '.png',
      followersCount: index + 1,
    })
  ))

  const snapshot = (snapshotUsers, extra = {}) => ({
    ok: true,
    users: snapshotUsers,
    storagePrimary: 'mongo',
    poolVersion: 'weekly-top:v1:2026-09-14',
    poolSize: snapshotUsers.length,
    poolBuiltAt: '2026-09-14T01:00:00.000Z',
    buildWeek: clientWeeklyBuildKey(Date.now()),
    targetBuildWeek: clientWeeklyBuildKey(Date.now()),
    nextBuildAt: new Date(nextRecommendationWeekBoundaryMs(Date.now())).toISOString(),
    rebuildDue: false,
    poolReady: true,
    viewerCanonicalId: '',
    ...extra,
  })

  const jsonResponse = (payload, status = 200) => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })

  const props = (extra = {}) => ({
    enabled: true,
    videoFeedOpen: true,
    viewerId: '',
    feedSort: 'new',
    feedContextKey: 'ctx-a',
    vfSlots: slots(1),
    vfWin: { start: 0, end: 1 },
    runtimeConfig: { batchSize: 15 },
    emitDiag: vi.fn(),
    ...extra,
  })

  afterEach(() => {
    __resetUserRecommendationsRailForTests()
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  it('loads one weekly snapshot and creates every later rail locally without more GETs', async () => {
    const fetchMock = vi.fn(() => jsonResponse(snapshot(users(45))))
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      (input) => useUserRecommendationsRail(input),
      { initialProps: props() },
    )

    await waitFor(() => {
      expect(result.current.getSlotState('rec:0')?.users).toHaveLength(15)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    rerender(props({
      feedSort: 'popular',
      feedContextKey: 'ctx-b-after-page-append',
      vfSlots: slots(3),
      vfWin: { start: 2, end: 3 },
    }))

    await waitFor(() => {
      expect(result.current.getSlotState('rec:2')?.users).toHaveLength(15)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const first = new Set(result.current.getSlotState('rec:0').users.map((user) => user.canonicalAccountId))
    const second = result.current.getSlotState('rec:1').users.map((user) => user.canonicalAccountId)
    expect(second.every((id) => !first.has(id))).toBe(true)
  })

  it('shows all eleven users in every rail but gives each rail a different order', () => {
    const poolUsers = users(11)
    const batches = buildRecommendationRailBatches(poolUsers, slots(4), {
      batchSize: 15,
      poolVersion: 'weekly-v1',
      sessionSeed: 17,
    })
    const orders = Object.values(batches).map((batch) => batch.map((user) => user.canonicalAccountId))

    expect(orders.every((order) => order.length === 11)).toBe(true)
    expect(orders.every((order) => new Set(order).size === 11)).toBe(true)
    expect(new Set(orders.map((order) => JSON.stringify(order))).size).toBe(4)
  })

  it('exhausts a larger pool before repeating and never duplicates inside a rail', () => {
    const batches = buildRecommendationRailBatches(users(31), slots(3), {
      batchSize: 15,
      poolVersion: 'weekly-v2',
      sessionSeed: 91,
    })
    const railUsers = Object.values(batches)
    expect(railUsers.every((batch) => batch.length === 15 && new Set(batch.map((user) => user.canonicalAccountId)).size === 15)).toBe(true)
    const firstThirty = [...railUsers[0], ...railUsers[1]].map((user) => user.canonicalAccountId)
    expect(new Set(firstThirty).size).toBe(30)
  })

  it('sanitizes invalid rows and excludes both raw and canonical current viewer', async () => {
    const payload = snapshot([
      createRecommendationUser(1, { userId: 'viewer-alias', canonicalAccountId: 'viewer-alias' }),
      createRecommendationUser(2, { userId: 'viewer-canonical', canonicalAccountId: 'viewer-canonical' }),
      createRecommendationUser(3, { userId: 'valid', canonicalAccountId: 'valid', nickname: 'Valid', avatar: '/valid.png', followersCount: 1 }),
      createRecommendationUser(4, { userId: 'no-followers', canonicalAccountId: 'no-followers', followersCount: 0 }),
      createRecommendationUser(5, { userId: 'no-avatar', canonicalAccountId: 'no-avatar', avatar: '' }),
    ], { viewerCanonicalId: 'viewer-canonical' })
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(payload)))

    const { result } = renderHook(() => useUserRecommendationsRail(props({
      viewerId: 'viewer-alias',
    })))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.getSlotState('rec:0')?.users.map((user) => user.canonicalAccountId)).toEqual(['valid'])
    })
  })

  it('lets one active device trigger a due week, then refreshes the completed snapshot once', async () => {
    const targetBuildWeek = clientWeeklyBuildKey(Date.now())
    const oldSnapshot = snapshot(users(4, 'old'), {
      poolVersion: 'weekly-old',
      buildWeek: '1999-01-04',
      targetBuildWeek,
      rebuildDue: true,
    })
    const newSnapshot = snapshot(users(20, 'new'), {
      poolVersion: 'weekly-new',
      buildWeek: targetBuildWeek,
      targetBuildWeek,
      rebuildDue: false,
    })
    let getCount = 0
    const fetchMock = vi.fn((_url, options = {}) => {
      const method = options.method || 'GET'
      if (method === 'POST') return jsonResponse({ ok: true, rebuilt: true, buildWeek: targetBuildWeek })
      getCount += 1
      return jsonResponse(getCount === 1 ? oldSnapshot : newSnapshot)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      (input) => useUserRecommendationsRail(input),
      { initialProps: props() },
    )

    await waitFor(() => {
      expect(result.current.poolVersion).toBe('weekly-new')
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const postCall = fetchMock.mock.calls.find(([, options = {}]) => options.method === 'POST')
    expect(JSON.parse(postCall[1].body)).toEqual({ targetBuildWeek })

    rerender(props({ feedSort: 'popular', feedContextKey: 'ctx-z', vfSlots: slots(4) }))
    await act(async () => {})
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('hides stale guest data immediately and discards its late response after auth changes', async () => {
    let resolveGuest
    const guestPromise = new Promise((resolve) => { resolveGuest = resolve })
    const fetchMock = vi.fn((_url, options = {}) => {
      const viewer = options.headers?.['x-forum-user-id'] || ''
      if (!viewer) return guestPromise
      return jsonResponse(snapshot([
        createRecommendationUser(1, { userId: 'user-a', canonicalAccountId: 'user-a' }),
        createRecommendationUser(2, { userId: 'other-auth', canonicalAccountId: 'other-auth' }),
      ], { viewerCanonicalId: 'user-a', poolVersion: 'weekly-auth' }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      (input) => useUserRecommendationsRail(input),
      { initialProps: props() },
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    rerender(props({ viewerId: 'user-a' }))
    expect(result.current.getSlotState('rec:0')?.users || []).toEqual([])

    await waitFor(() => {
      expect(result.current.getSlotState('rec:0')?.users.map((user) => user.canonicalAccountId)).toEqual(['other-auth'])
    })
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)

    resolveGuest(await jsonResponse(snapshot(users(3, 'guest'), { poolVersion: 'weekly-guest' })))
    await act(async () => {})
    expect(result.current.poolVersion).toBe('weekly-auth')
    expect(result.current.getSlotState('rec:0')?.users.map((user) => user.canonicalAccountId)).toEqual(['other-auth'])
  })

  it('uses one exact Monday UTC boundary for server-independent device wakeup', () => {
    const sunday = Date.parse('2026-09-20T23:59:59.000Z')
    expect(clientWeeklyBuildKey(sunday)).toBe('2026-09-14')
    expect(nextRecommendationWeekBoundaryMs(sunday)).toBe(Date.parse('2026-09-21T00:00:00.000Z'))
    expect(clientWeeklyBuildKey(Date.parse('2026-09-21T00:00:00.000Z'))).toBe('2026-09-21')
  })
})

describe('usePublishedPostsModel', () => {
  const makePublishedPost = (id, extra = {}) => ({
    id,
    postId: id,
    userId: 'me',
    accountId: 'me',
    canonicalAuthorId: 'me',
    ts: 100,
    views: 1,
    likes: 0,
    ...extra,
  })

  it('keeps canonical reply counters stable when child replies are already loaded', () => {
    const posts = [
      {
        id: 'root-1',
        userId: 'me',
        ts: 100,
        likes: 2,
        views: 10,
        replyCount: 0,
        __ql7PostCountersCoreHydrated: true,
      },
      {
        id: 'reply-1',
        userId: 'other',
        parentId: 'root-1',
        ts: 101,
      },
    ]

    const { result } = renderHook(() =>
      usePublishedPostsModel({
        meId: 'me',
        posts,
        postSort: 'replies',
        activeStarredAuthors: new Set(),
        visiblePublishedCount: 10,
        resolveProfileAccountIdFn: (value) => value,
      }),
    )

    expect(result.current.myPublishedPosts).toHaveLength(1)
    expect(result.current.myPublishedPosts[0]).toEqual(
      expect.objectContaining({
        id: 'root-1',
        replyCount: 0,
        __repliesCount: 0,
      }),
    )
    expect(result.current.visiblePublishedPosts[0]).toEqual(
      expect.objectContaining({
        id: 'root-1',
        replyCount: 0,
      }),
    )
  })

  it('uses loaded child replies only as fallback when no canonical reply counter exists', () => {
    const posts = [
      {
        id: 'root-1',
        userId: 'me',
        ts: 100,
        likes: 2,
        views: 10,
      },
      {
        id: 'reply-1',
        userId: 'other',
        parentId: 'root-1',
        ts: 101,
      },
    ]

    const { result } = renderHook(() =>
      usePublishedPostsModel({
        meId: 'me',
        posts,
        postSort: 'replies',
        activeStarredAuthors: new Set(),
        visiblePublishedCount: 10,
        resolveProfileAccountIdFn: (value) => value,
      }),
    )

    expect(result.current.myPublishedPosts[0]).toEqual(
      expect.objectContaining({
        id: 'root-1',
        replyCount: 1,
        __repliesCount: 1,
      }),
    )
  })

  it('removes tombstoned posts from Published immediately without waiting for a branch reload', () => {
    const baseProps = {
      meId: 'me',
      posts: [
        makePublishedPost('published-delete-me', { ts: 200 }),
        makePublishedPost('published-stays', { ts: 100 }),
      ],
      tombstones: { topics: {}, posts: {} },
      postSort: 'new',
      activeStarredAuthors: new Set(),
      visiblePublishedCount: 10,
      resolveProfileAccountIdFn: (value) => value,
    }

    const { result, rerender } = renderHook(
      (props) => usePublishedPostsModel(props),
      { initialProps: baseProps },
    )

    expect(result.current.visiblePublishedPosts.map((post) => post.id)).toEqual([
      'published-delete-me',
      'published-stays',
    ])

    rerender({
      ...baseProps,
      tombstones: {
        topics: {},
        posts: { 'published-delete-me': Date.now() },
      },
    })

    expect(result.current.visiblePublishedPosts.map((post) => post.id)).toEqual([
      'published-stays',
    ])
  })

  it('does not resurrect a tombstoned Published post from a later server page', async () => {
    const serverRows = [
      makePublishedPost('server-deleted', { ts: 200 }),
      makePublishedPost('server-live', { ts: 100 }),
    ]
    const api = {
      userPostsPage: vi.fn(async () => ({
        ok: true,
        items: serverRows,
        hasMore: false,
        totalCount: serverRows.length,
        source: 'mongo_projection_index',
      })),
    }

    const props = {
      meId: 'me',
      posts: [],
      tombstones: { topics: {}, posts: { 'server-deleted': Date.now() } },
      postSort: 'new',
      activeStarredAuthors: new Set(),
      visiblePublishedCount: 10,
      resolveProfileAccountIdFn: (value) => value,
      api,
      pageSize: 10,
    }

    const { result } = renderHook(() => usePublishedPostsModel(props))

    await waitFor(() => {
      expect(result.current.visiblePublishedPosts.map((post) => post.id)).toEqual(['server-live'])
    })

    await act(async () => {
      await result.current.loadPublishedPostsPage({ reset: true })
    })

    expect(api.userPostsPage).toHaveBeenCalled()
    expect(result.current.visiblePublishedPosts.map((post) => post.id)).toEqual(['server-live'])
    expect(result.current.myPublishedPosts.map((post) => post.id)).not.toContain('server-deleted')
  })
})

describe('starred sorting models', () => {
  it('keeps thread post ordering driven by the selected sort, not starred authors', () => {
    const posts = [
      {
        id: 'plain-post',
        topicId: 'topic-1',
        userId: 'raw-other',
        likes: 40,
        ts: 100,
      },
      {
        id: 'starred-post',
        topicId: 'topic-1',
        userId: 'raw-starred',
        likes: 2,
        ts: 90,
      },
    ]

    const { result } = renderHook(() =>
      useThreadPostsModel({
        selectedTopicId: 'topic-1',
        posts,
        threadRoot: null,
        postSort: 'likes',
        activeStarredAuthors: new Set(['canon-starred']),
        visibleThreadPostsCount: 10,
        resolveProfileAccountIdFn: (value) => value === 'raw-starred' ? 'canon-starred' : value,
      }),
    )

    expect(result.current.visibleFlat[0]).toEqual(
      expect.objectContaining({
        id: 'plain-post',
      }),
    )
  })

  it('keeps topic ordering driven by the selected sort, not starred authors', () => {
    const topics = [
      {
        id: 'topic-regular',
        userId: 'raw-regular',
        title: 'Regular topic',
        ts: 200,
        views: 500,
      },
      {
        id: 'topic-starred',
        userId: 'raw-starred',
        title: 'Starred topic',
        ts: 150,
        views: 12,
      },
    ]

    const { result } = renderHook(() =>
      useTopicDiscoveryModel({
        query: '',
        topics,
        posts: [],
        authorFilterUserId: '',
        resolveNickForDisplayFn: () => '',
        extractDmStickersFromTextFn: (value) => ({ text: value, stickers: [] }),
        stripMediaUrlsFromTextFn: (value) => value,
        extractUrlsFromTextFn: () => [],
        isImageUrlFn: () => false,
        isVideoUrlFn: () => false,
        isAudioUrlFn: () => false,
        isYouTubeUrlFn: () => false,
        isTikTokUrlFn: () => false,
        buildSearchVideoMediaFn: () => null,
        topicSort: 'views',
        topicFilterId: null,
        starredFirstFn: (items, getAuthorId) =>
          prioritizeStarredItems(
            items,
            getAuthorId,
            new Set(['canon-starred']),
            (value) => value === 'raw-starred' ? 'canon-starred' : value,
          ),
        visibleTopicsCount: 10,
        setTopicFilterId: vi.fn(),
        resolveProfileAccountIdFn: (value) => value === 'raw-starred' ? 'canon-starred' : value,
      }),
    )

    expect(result.current.visibleTopics[0]).toEqual(
      expect.objectContaining({
        id: 'topic-regular',
      }),
    )
  })

  it('keeps topic card counters anchored to server totals when only part of the topic is loaded', () => {
    const { result } = renderHook(() =>
      useTopicDiscoveryModel({
        query: '',
        topics: [
          {
            id: 'topic-full',
            userId: 'author-1',
            title: 'Full topic',
            ts: 200,
            postsCount: 32,
            replies: 32,
            repliesCount: 32,
            counters: { posts: 32, replies: 32, views: 10000 },
            views: 900,
          },
        ],
        posts: [
          {
            id: 'loaded-post-1',
            topicId: 'topic-full',
            userId: 'author-1',
            likes: 1,
            views: 3,
            ts: 100,
          },
        ],
        authorFilterUserId: '',
        resolveNickForDisplayFn: () => '',
        extractDmStickersFromTextFn: (value) => ({ text: value, stickers: [] }),
        stripMediaUrlsFromTextFn: (value) => value,
        extractUrlsFromTextFn: () => [],
        isImageUrlFn: () => false,
        isVideoUrlFn: () => false,
        isAudioUrlFn: () => false,
        isYouTubeUrlFn: () => false,
        isTikTokUrlFn: () => false,
        buildSearchVideoMediaFn: () => null,
        topicSort: 'replies',
        topicFilterId: null,
        starredFirstFn: (items) => items,
        visibleTopicsCount: 10,
        setTopicFilterId: vi.fn(),
        resolveProfileAccountIdFn: (value) => value,
      }),
    )

    expect(result.current.aggregates.get('topic-full')).toEqual(
      expect.objectContaining({
        posts: 32,
        views: 10000,
      }),
    )
    expect(result.current.visibleTopics[0]).toEqual(
      expect.objectContaining({
        id: 'topic-full',
      }),
    )
  })

  it('keeps topic counters independent from the currently loaded feed page', () => {
    const baseProps = (posts) => ({
      query: '',
      topics: [
        {
          id: 'topic-stable',
          userId: 'author-1',
          title: 'Stable topic',
          ts: 200,
          postsCount: 32,
          counters: { posts: 32, replies: 32, reactions: 8, reactionCount: 8, views: 10000 },
          views: 10000,
        },
      ],
      posts,
      authorFilterUserId: '',
      resolveNickForDisplayFn: () => '',
      extractDmStickersFromTextFn: (value) => ({ text: value, stickers: [] }),
      stripMediaUrlsFromTextFn: (value) => value,
      extractUrlsFromTextFn: () => [],
      isImageUrlFn: () => false,
      isVideoUrlFn: () => false,
      isAudioUrlFn: () => false,
      isYouTubeUrlFn: () => false,
      isTikTokUrlFn: () => false,
      buildSearchVideoMediaFn: () => null,
      topicSort: 'views',
      topicFilterId: null,
      starredFirstFn: (items) => items,
      visibleTopicsCount: 10,
      setTopicFilterId: vi.fn(),
      resolveProfileAccountIdFn: (value) => value,
    })

    const { result, rerender } = renderHook(
      (props) => useTopicDiscoveryModel(props),
      {
        initialProps: baseProps([
          { id: 'partial-1', topicId: 'topic-stable', views: 3, likes: 1, ts: 100 },
        ]),
      },
    )

    expect(result.current.aggregates.get('topic-stable')).toEqual(
      expect.objectContaining({ posts: 32, likes: 8, views: 10000 }),
    )

    rerender(baseProps([
      { id: 'partial-2', topicId: 'topic-stable', views: 999999, likes: 999, ts: 300 },
      { id: 'partial-3', topicId: 'topic-stable', views: 999999, likes: 999, ts: 301 },
    ]))

    expect(result.current.aggregates.get('topic-stable')).toEqual(
      expect.objectContaining({ posts: 32, likes: 8, views: 10000 }),
    )
  })

  it('keeps explicit topic counter sorts above stale server feed ranks', () => {
    const { result } = renderHook(() =>
      useTopicDiscoveryModel({
        query: '',
        topics: [
          {
            id: 'topic-low-ranked-first',
            userId: 'author-1',
            title: 'Low ranked first',
            ts: 300,
            views: 400,
            counters: { views: 400, replies: 1 },
            __ql7ServerFeedRank: 0,
          },
          {
            id: 'topic-high-views',
            userId: 'author-2',
            title: 'High views',
            ts: 200,
            views: 10000,
            counters: { views: 10000, replies: 1 },
            __ql7ServerFeedRank: 9,
          },
        ],
        posts: [],
        authorFilterUserId: '',
        resolveNickForDisplayFn: () => '',
        extractDmStickersFromTextFn: (value) => ({ text: value, stickers: [] }),
        stripMediaUrlsFromTextFn: (value) => value,
        extractUrlsFromTextFn: () => [],
        isImageUrlFn: () => false,
        isVideoUrlFn: () => false,
        isAudioUrlFn: () => false,
        isYouTubeUrlFn: () => false,
        isTikTokUrlFn: () => false,
        buildSearchVideoMediaFn: () => null,
        topicSort: 'views',
        topicFilterId: null,
        starredFirstFn: (items) => items,
        visibleTopicsCount: 10,
        setTopicFilterId: vi.fn(),
        resolveProfileAccountIdFn: (value) => value,
      }),
    )

    expect(result.current.visibleTopics.map((topic) => topic.id)).toEqual([
      'topic-high-views',
      'topic-low-ranked-first',
    ])
  })

  it('keeps the recommendation context key stable when a server video page append only grows the feed', () => {
    const createProps = (serverVideoPosts) => ({
      data: { posts: [] },
      allPosts: [],
      serverVideoPosts,
      isMediaUrl: (value) => String(value || '').includes('.mp4'),
      extractUrlsFromText: (value) => String(value || '').match(/https?:\/\/\S+/g) || [],
      viewerId: 'viewer-1',
      starredFirst: (items) => items,
      videoFeedOpenRef: { current: false },
      navRestoringRef: { current: false },
      emitDiag: vi.fn(),
      visibleVideoCount: 5,
      setVisibleVideoCount: vi.fn(),
      videoPageSize: 5,
    })
    const firstPage = [
      { id: 'media-1', userId: 'author-1', topicId: 'topic-1', ts: 100, text: 'https://cdn.test/1.mp4' },
      { id: 'media-2', userId: 'author-2', topicId: 'topic-1', ts: 200, text: 'https://cdn.test/2.mp4' },
    ]

    const { result, rerender } = renderHook(
      (props) => useVideoFeedState(props),
      { initialProps: createProps(firstPage) },
    )

    act(() => {
      result.current.setVideoFeedOpen(true)
      result.current.setVideoFeedPageSalt('recommendation-stable-salt')
      result.current.setVideoFeedEntryToken(7)
    })
    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    const beforeAppend = result.current.videoFeedContextKey
    expect(result.current.videoFeed).toHaveLength(2)

    rerender(createProps([
      ...firstPage,
      { id: 'media-3', userId: 'author-3', topicId: 'topic-1', ts: 300, text: 'https://cdn.test/3.mp4' },
    ]))
    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    expect(result.current.videoFeed).toHaveLength(3)
    expect(result.current.videoFeedContextKey).toBe(beforeAppend)

    act(() => {
      result.current.setVideoFeedPageSalt('recommendation-next-session')
    })
    expect(result.current.videoFeedContextKey).not.toBe(beforeAppend)
  })

  it('does not reorder the video feed when star mode becomes active', () => {
    const posts = [
      {
        id: 'media-1',
        userId: 'author-a',
        topicId: 'topic-1',
        ts: 100,
        text: 'https://cdn.test/video-a.mp4',
      },
      {
        id: 'media-2',
        userId: 'author-b',
        topicId: 'topic-1',
        ts: 200,
        text: 'https://cdn.test/video-b.mp4',
      },
      {
        id: 'media-3',
        userId: 'author-c',
        topicId: 'topic-1',
        ts: 300,
        text: 'https://cdn.test/video-c.mp4',
      },
    ]

    const createProps = (activeStarredAuthors) => ({
      data: { posts },
      allPosts: posts,
      isMediaUrl: (value) => String(value || '').includes('.mp4'),
      extractUrlsFromText: (value) => String(value || '').match(/https?:\/\/\S+/g) || [],
      viewerId: 'viewer-1',
      activeStarredAuthors,
      starredFirst: (items, getAuthorId) =>
        prioritizeStarredItems(items, getAuthorId, activeStarredAuthors, (value) => value),
      videoFeedOpenRef: { current: false },
      navRestoringRef: { current: false },
      emitDiag: vi.fn(),
      visibleVideoCount: 5,
      setVisibleVideoCount: vi.fn(),
      videoPageSize: 5,
    })

    const { result, rerender } = renderHook(
      (props) => useVideoFeedState(props),
      { initialProps: createProps(new Set()) },
    )

    act(() => {
      result.current.setVideoFeedPageSalt('stable-seed')
      result.current.setVideoFeedEntryToken(1)
    })

    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    const firstPass = result.current.videoFeed.map((item) => item.id)
    expect(firstPass.length).toBeGreaterThanOrEqual(2)

    const starredCandidate = result.current.videoFeed.find((item) => item.id !== firstPass[0])
    expect(starredCandidate).toBeTruthy()

    rerender(createProps(new Set([String(starredCandidate.userId)])))

    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    expect(result.current.videoFeed[0]).toEqual(
      expect.objectContaining({
        id: firstPass[0],
      }),
    )
  })

  it('preserves local reaction state while server media rows keep feed order authority', () => {
    const merged = mergeVideoFeedServerPostWithLocal(
      {
        id: 'post-reacted',
        text: 'https://cdn.test/video.mp4',
        likes: 11,
        dislikes: 2,
        myReaction: 'like',
      },
      {
        id: 'post-reacted',
        text: 'https://cdn.test/video.mp4',
        likes: 10,
        dislikes: 2,
        myReaction: null,
        __ql7ServerFeedRank: 4,
        __ql7ServerFeedMode: 'geo',
      },
    )

    expect(merged).toEqual(expect.objectContaining({
      id: 'post-reacted',
      myReaction: 'like',
      likes: 11,
      dislikes: 2,
      __ql7ServerFeedRank: 4,
      __ql7ServerFeedMode: 'geo',
    }))
  })

  it('hydrates video feed reactions from data posts even when thread allPosts is empty', () => {
    const serverVideoPosts = [
      {
        id: 'media-reacted',
        topicId: 'topic-1',
        userId: 'author-1',
        text: 'https://cdn.test/video.mp4',
        likes: 5,
        dislikes: 1,
        myReaction: null,
        __ql7ServerFeedRank: 0,
        __ql7ServerFeedMode: 'geo',
      },
    ]
    const dataPosts = [
      {
        id: 'media-reacted',
        topicId: 'topic-1',
        userId: 'author-1',
        text: 'https://cdn.test/video.mp4',
        likes: 6,
        dislikes: 1,
        myReaction: 'like',
      },
    ]

    const { result } = renderHook(() => useVideoFeedState({
      data: { posts: dataPosts },
      allPosts: [],
      serverVideoPosts,
      isMediaUrl: (value) => String(value || '').includes('.mp4'),
      extractUrlsFromText: (value) => String(value || '').match(/https?:\/\/\S+/g) || [],
      viewerId: 'viewer-1',
      starredFirst: (items) => items,
      videoFeedOpenRef: { current: true },
      navRestoringRef: { current: false },
      emitDiag: vi.fn(),
      visibleVideoCount: 5,
      setVisibleVideoCount: vi.fn(),
      videoPageSize: 5,
    }))

    act(() => {
      result.current.setVideoFeedOpen(true)
    })

    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    expect(result.current.videoFeed[0]).toEqual(expect.objectContaining({
      id: 'media-reacted',
      myReaction: 'like',
      likes: 6,
      __ql7ServerFeedRank: 0,
    }))
  })

  it('patches video feed reaction state without moving server ordered rows', () => {
    const rows = [
      {
        id: 'media-first',
        text: 'https://cdn.test/first.mp4',
        likes: 1,
        dislikes: 0,
        myReaction: null,
        __ql7ServerFeedRank: 0,
      },
      {
        id: 'media-target',
        text: 'https://cdn.test/target.mp4',
        likes: 4,
        dislikes: 1,
        myReaction: null,
        __ql7ServerFeedRank: 1,
      },
    ]

    const next = patchVideoFeedReactionOverlay(rows, {
      postId: 'media-target',
      state: 'like',
      likes: 4,
      dislikes: 1,
    })

    expect(next.map((item) => item.id)).toEqual(['media-first', 'media-target'])
    expect(next[1]).toEqual(expect.objectContaining({
      id: 'media-target',
      myReaction: 'like',
      likes: 4,
      dislikes: 1,
      __ql7ServerFeedRank: 1,
    }))
  })

  it('classifies only transient media-feed failures as retryable and keeps recovery bounded', () => {
    expect(isRetryableVideoFeedPageResult({ ok: false, status: 503 })).toBe(true)
    expect(isRetryableVideoFeedPageResult({ ok: false, status: 429 })).toBe(true)
    expect(isRetryableVideoFeedPageResult({ ok: false, status: 0, error: 'timeout' })).toBe(true)
    expect(isRetryableVideoFeedPageResult({ ok: false, status: 400, error: 'bad_request' })).toBe(false)
    expect(videoFeedRecoveryDelayMs(1)).toBe(1200)
    expect(videoFeedRecoveryDelayMs(2)).toBe(2400)
    expect(videoFeedRecoveryDelayMs(20)).toBe(8000)
  })

})

describe('extractPostPrewarmHints', () => {
  it('returns only bounded poster/image hints from post data before DOM mount', () => {
    expect(extractPostPrewarmHints({
      text: [
        'caption',
        'https://cdn.example.test/a.webp',
        'https://cdn.example.test/video.mp4',
        'https://youtu.be/abcDEF123',
        'inline https://cdn.example.test/b.jpg text',
      ].join('\n'),
      posterUrl: 'https://cdn.example.test/poster.jpg',
      limit: 3,
    })).toEqual([
      { kind: 'poster', src: 'https://cdn.example.test/poster.jpg' },
      { kind: 'image', src: 'https://cdn.example.test/a.webp' },
      { kind: 'image', src: 'https://cdn.example.test/b.jpg' },
    ])
  })
})

describe('usePostMediaTextModel', () => {
  it('extracts sticker tags into sticker entries and preserves description text', () => {
    const { result } = renderHook(() =>
      usePostMediaTextModel({
        text: 'Sticker caption\n[MOZI:/mozi/cat.webp]',
        postId: 'post-sticker',
      }),
    )

    expect(result.current.stickerEntries).toEqual([
      expect.objectContaining({
        url: '/mozi/cat.webp',
        kind: 'mozi',
      }),
    ])
    expect(result.current.cleanedText).toBe('Sticker caption')
  })
})

describe('useForumComposerAttachments', () => {
  it('narrows file input accept to images and blocks opening picker for other media kinds', () => {
    const clickSpy = vi.fn()

    const { result } = renderHook(() =>
      useForumComposerAttachments({
        mediaLocked: false,
        composerMediaKind: 'sticker',
        pendingImgs: [],
        saveComposerScroll: vi.fn(),
        restoreComposerScroll: vi.fn(),
        beginMediaPipeline: vi.fn(),
        endMediaPipeline: vi.fn(),
        toast: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), success: vi.fn() },
        t: (key) => key,
        moderateImageFiles: vi.fn(),
        toastI18n: vi.fn(),
        reasonKey: vi.fn(),
        stopMediaProg: vi.fn(),
        setMediaPhase: vi.fn(),
        setMediaPct: vi.fn(),
        startSoftProgress: vi.fn(),
        setPendingImgs: vi.fn(),
        setOverlayMediaKind: vi.fn(),
        setOverlayMediaUrl: vi.fn(),
        setOverlayImageIndex: vi.fn(),
        setVideoState: vi.fn(),
        setVideoOpen: vi.fn(),
        viewerId: 'viewer-1',
        showVideoLimitOverlay: vi.fn(),
        readVideoDurationSecFn: vi.fn(),
        forumVideoMaxSeconds: 30,
        forumVideoMaxBytes: 1024,
        forumVideoFaststartTranscodeMaxBytes: 1024,
        optimizeForumVideoFastStartFn: vi.fn(),
        emitDiag: vi.fn(),
        setPendingVideo: vi.fn(),
        pendingVideoInfoRef: { current: { source: '', durationSec: Number.NaN } },
        setVideoProgress: vi.fn(),
      }),
    )

    result.current.fileInputRef.current = { click: clickSpy }

    act(() => {
      result.current.handleAttachClick({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      })
    })

    expect(result.current.fileInputAccept).toContain('video/mp4')
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('limits accepted files to images when the composer already holds images', () => {
    const { result } = renderHook(() =>
      useForumComposerAttachments({
        mediaLocked: false,
        composerMediaKind: 'image',
        pendingImgs: [],
        saveComposerScroll: vi.fn(),
        restoreComposerScroll: vi.fn(),
        beginMediaPipeline: vi.fn(),
        endMediaPipeline: vi.fn(),
        toast: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), success: vi.fn() },
        t: (key) => key,
        moderateImageFiles: vi.fn(),
        toastI18n: vi.fn(),
        reasonKey: vi.fn(),
        stopMediaProg: vi.fn(),
        setMediaPhase: vi.fn(),
        setMediaPct: vi.fn(),
        startSoftProgress: vi.fn(),
        setPendingImgs: vi.fn(),
        setOverlayMediaKind: vi.fn(),
        setOverlayMediaUrl: vi.fn(),
        setVideoState: vi.fn(),
        setVideoOpen: vi.fn(),
        viewerId: 'viewer-1',
        showVideoLimitOverlay: vi.fn(),
        readVideoDurationSecFn: vi.fn(),
        forumVideoMaxSeconds: 30,
        forumVideoMaxBytes: 1024,
        forumVideoFaststartTranscodeMaxBytes: 1024,
        optimizeForumVideoFastStartFn: vi.fn(),
        emitDiag: vi.fn(),
        setPendingVideo: vi.fn(),
        pendingVideoInfoRef: { current: { source: '', durationSec: Number.NaN } },
        setVideoProgress: vi.fn(),
      }),
    )

    expect(result.current.fileInputAccept).toContain('image/*')
    expect(result.current.fileInputAccept).not.toContain('video/mp4')
  })

  it('caps image drafts at ten and keeps selection preview-only until Send', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', class TestURL extends URL {
      static createObjectURL(file) { return `blob:${file.name}` }
      static revokeObjectURL() {}
    })

    const warn = vi.fn()
    const setPendingImgs = vi.fn()
    const pendingImageDraftsRef = { current: new Map() }
    const beginMediaPipeline = vi.fn(() => ({ signal: undefined }))
    const moderateImageFiles = vi.fn()

    const { result } = renderHook(() =>
      useForumComposerAttachments({
        mediaLocked: false,
        composerMediaKind: 'image',
        pendingImgs: Array.from({ length: 8 }, (_, index) => `/existing/${index + 1}.webp`),
        pendingImgsRef: { current: Array.from({ length: 8 }, (_, index) => `/existing/${index + 1}.webp`) },
        pendingImageDraftsRef,
        saveComposerScroll: vi.fn(),
        restoreComposerScroll: vi.fn(),
        beginMediaPipeline,
        toast: { info: vi.fn(), error: vi.fn(), warn, success: vi.fn() },
        t: (key) => key === 'forum_image_limit_notice'
          ? 'limit:{limit};kept:{kept}'
          : key,
        moderateImageFiles,
        setMediaPhase: vi.fn(),
        setMediaPct: vi.fn(),
        setPendingImgs,
        setOverlayMediaKind: vi.fn(),
        setOverlayMediaUrl: vi.fn(),
        setOverlayImageIndex: vi.fn(),
        setVideoState: vi.fn(),
        setVideoOpen: vi.fn(),
        showVideoLimitOverlay: vi.fn(),
        readVideoDurationSecFn: vi.fn(),
        forumVideoMaxSeconds: 30,
        setPendingVideo: vi.fn(),
        pendingVideoInfoRef: { current: { source: '', durationSec: Number.NaN } },
        setVideoProgress: vi.fn(),
      }),
    )

    const files = Array.from({ length: 4 }, (_, index) => new File(['x'], `image-${index + 1}.png`, { type: 'image/png' }))

    await act(async () => {
      await result.current.onFilesChosen({
        target: {
          files,
          value: 'picked',
        },
      })
    })

    expect(warn).toHaveBeenCalledWith('limit:10;kept:10')
    expect(setPendingImgs).toHaveBeenCalledTimes(1)
    const previewUpdater = setPendingImgs.mock.calls[0][0]
    expect(previewUpdater(Array.from({ length: 8 }, (_, index) => `/existing/${index + 1}.webp`))).toEqual([
      ...Array.from({ length: 8 }, (_, index) => `/existing/${index + 1}.webp`),
      'blob:image-1.png',
      'blob:image-2.png',
    ])
    expect(pendingImageDraftsRef.current.get('blob:image-1.png')?.file).toBe(files[0])
    expect(pendingImageDraftsRef.current.get('blob:image-2.png')?.file).toBe(files[1])
    expect(beginMediaPipeline).not.toHaveBeenCalled()
    expect(moderateImageFiles).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
describe('useForumMutationQueue premium view batching', () => {
  const actorId = 'wallet:view-batch-user'
  const outboxKey = (queueStorageKey) => `${queueStorageKey}:view-outbox:v1:${encodeURIComponent(actorId)}`

  const acknowledgeBatch = (batch) => ({
    ok: true,
    applied: (batch?.ops || []).map((op) => {
      if (op.type === 'view_posts') {
        return {
          op: 'view_posts',
          opId: op.opId,
          ids: op.payload.ids,
          views: Object.fromEntries(op.payload.ids.map((id, index) => [id, 100 + index])),
        }
      }
      if (op.type === 'view_topics') {
        return {
          op: 'view_topics',
          opId: op.opId,
          ids: op.payload.ids,
          views: Object.fromEntries(op.payload.ids.map((id, index) => [id, 200 + index])),
        }
      }
      return { op: op.type, opId: op.opId }
    }),
  })

  const props = (api, queueStorageKey) => ({
    isBrowserFn: () => true,
    authRef: { current: { asherId: actorId, accountId: actorId } },
    api,
    getForumUserIdFn: () => actorId,
    persistSnap: vi.fn(),
    persistTombstones: vi.fn(),
    setOverlay: vi.fn(),
    topicReconcileRef: { current: null },
    queueStorageKey,
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('coalesces duplicate post/topic views into one delayed mutation request', async () => {
    vi.useFakeTimers()
    const api = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    const queueStorageKey = 'forum:test:view-batch'
    const { result } = renderHook(() => useForumMutationQueue(props(api, queueStorageKey)))

    act(() => {
      result.current.enqueuePendingPostView('post-1')
      result.current.enqueuePendingPostView('post-1')
      result.current.enqueuePendingPostView('post-2')
      result.current.enqueuePendingTopicView('topic-1')
    })

    expect(api.mutate).not.toHaveBeenCalled()
    expect(JSON.parse(window.localStorage.getItem(outboxKey(queueStorageKey)) || '{}')).toMatchObject({
      version: 1,
      posts: ['post-1', 'post-2'],
      topics: ['topic-1'],
    })

    await act(async () => { await vi.advanceTimersByTimeAsync(9999) })
    expect(api.mutate).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })

    expect(api.mutate).toHaveBeenCalledTimes(1)
    const [batch, sentActor] = api.mutate.mock.calls[0]
    expect(sentActor).toBe(actorId)
    expect(batch.ops.map((op) => op.type)).toEqual(['view_posts', 'view_topics'])
    expect(batch.ops[0].payload.ids).toEqual(['post-1', 'post-2'])
    expect(batch.ops[1].payload.ids).toEqual(['topic-1'])
    expect(window.localStorage.getItem(outboxKey(queueStorageKey))).toBeNull()

    await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
    expect(api.mutate).toHaveBeenCalledTimes(1)
  })

  it('flushes early at the 32-id high-water mark instead of waiting for the full view window', async () => {
    vi.useFakeTimers()
    const api = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    const queueStorageKey = 'forum:test:view-high-water'
    const { result } = renderHook(() => useForumMutationQueue(props(api, queueStorageKey)))

    act(() => {
      for (let index = 0; index < 31; index += 1) {
        result.current.enqueuePendingPostView(`post-${index}`)
      }
    })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(api.mutate).not.toHaveBeenCalled()

    act(() => { result.current.enqueuePendingPostView('post-31') })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })

    expect(api.mutate).toHaveBeenCalledTimes(1)
    expect(api.mutate.mock.calls[0][0].ops[0].type).toBe('view_posts')
    expect(api.mutate.mock.calls[0][0].ops[0].payload.ids).toHaveLength(32)
  })

  it('lets an urgent mutation preempt the view window and piggybacks the pending views', async () => {
    vi.useFakeTimers()
    const api = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    const queueStorageKey = 'forum:test:view-priority'
    const { result } = renderHook(() => useForumMutationQueue(props(api, queueStorageKey)))

    act(() => {
      result.current.enqueuePendingPostView('post-urgent')
      result.current.pushOp('set_reaction', { postId: 'post-urgent', state: 'like' }, { flushDelayMs: 35 })
    })

    await act(async () => { await vi.advanceTimersByTimeAsync(34) })
    expect(api.mutate).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })

    expect(api.mutate).toHaveBeenCalledTimes(1)
    expect(api.mutate.mock.calls[0][0].ops.map((op) => op.type)).toEqual(['set_reaction', 'view_posts'])
  })

  it('recovers a durable pending view after remount and uses keepalive on pagehide', async () => {
    vi.useFakeTimers()
    const queueStorageKey = 'forum:test:view-durable'
    const firstApi = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    const first = renderHook(() => useForumMutationQueue(props(firstApi, queueStorageKey)))

    act(() => { first.result.current.enqueuePendingPostView('post-durable') })
    expect(window.localStorage.getItem(outboxKey(queueStorageKey))).not.toBeNull()
    first.unmount()
    expect(firstApi.mutate).not.toHaveBeenCalled()

    const secondApi = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    renderHook(() => useForumMutationQueue(props(secondApi, queueStorageKey)))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(secondApi.mutate).toHaveBeenCalledTimes(1)
    expect(secondApi.mutate.mock.calls[0][0].ops[0].payload.ids).toEqual(['post-durable'])

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await act(async () => { await Promise.resolve() })
    expect(secondApi.mutate.mock.calls.some((call) => call?.[2]?.keepalive === true)).toBe(false)

    const thirdApi = { mutate: vi.fn(async (batch) => acknowledgeBatch(batch)) }
    const third = renderHook(() => useForumMutationQueue(props(thirdApi, 'forum:test:view-pagehide')))
    act(() => { third.result.current.enqueuePendingPostView('post-pagehide') })
    act(() => { window.dispatchEvent(new Event('pagehide')) })
    await act(async () => { await Promise.resolve() })
    expect(thirdApi.mutate).toHaveBeenCalledTimes(1)
    expect(thirdApi.mutate.mock.calls[0][2]).toMatchObject({ keepalive: true })
  })
})
