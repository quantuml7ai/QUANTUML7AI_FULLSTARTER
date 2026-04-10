import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useUserRecommendationsRail from '../../../../../../app/forum/features/feed/hooks/useUserRecommendationsRail.js'
import usePublishedPostsModel from '../../../../../../app/forum/features/feed/hooks/usePublishedPostsModel.js'
import useThreadPostsModel from '../../../../../../app/forum/features/feed/hooks/useThreadPostsModel.js'
import useTopicDiscoveryModel from '../../../../../../app/forum/features/feed/hooks/useTopicDiscoveryModel.js'
import useVideoFeedState from '../../../../../../app/forum/features/media/hooks/useVideoFeedState.js'
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
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefetches recommendation batches ahead and assigns them to visible slots', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        seed: 42,
        ttlSec: 30,
        rotationKey: 'video:new:1',
        batches: [
          createBatch('batch-1', 1),
          createBatch('batch-2', 3),
          createBatch('batch-3', 5),
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const emitDiag = vi.fn()
    const vfSlots = [
      { type: 'recommendation_rail', key: 'rec:1', railIndex: 0 },
      { type: 'recommendation_rail', key: 'rec:2', railIndex: 1 },
      { type: 'recommendation_rail', key: 'rec:3', railIndex: 2 },
    ]

    const { result } = renderHook(() =>
      useUserRecommendationsRail({
        enabled: true,
        videoFeedOpen: true,
        viewerId: 'viewer-1',
        feedSort: 'new',
        feedContextKey: 'ctx-1',
        vfSlots,
        vfWin: { start: 0, end: 2, top: 0, bottom: 0 },
        runtimeConfig: {
          batchSize: 2,
          batchesPerRequest: 2,
          prefetchRailsAhead: 2,
        },
        emitDiag,
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const requestUrl = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(Number(requestUrl.searchParams.get('batches'))).toBeGreaterThanOrEqual(4)

    await waitFor(() => {
      expect(result.current.getSlotState('rec:1')?.users).toHaveLength(2)
      expect(result.current.getSlotState('rec:2')?.users).toHaveLength(2)
    })

    expect(result.current.getSlotState('rec:1')?.batchId).not.toBe(
      result.current.getSlotState('rec:2')?.batchId,
    )
    expect(window.localStorage.getItem('profile:batch-1-user-1')).toContain('batch-1 User 1')
    expect(emitDiag).toHaveBeenCalledWith(
      'user_recommendations_prefetch_success',
      expect.objectContaining({
        receivedBatches: 3,
        rotationKey: 'video:new:1',
      }),
      { force: true },
    )
  })

  it('reconciles recommendations when the feed context changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        seed: 7,
        ttlSec: 30,
        rotationKey: 'video:new:2',
        batches: [createBatch('batch-ctx', 1)],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const vfSlots = [{ type: 'recommendation_rail', key: 'rec:1', railIndex: 0 }]
    const initialProps = {
      enabled: true,
      videoFeedOpen: true,
      viewerId: 'viewer-1',
      feedSort: 'new',
      feedContextKey: 'ctx-a',
      vfSlots,
      vfWin: { start: 0, end: 1, top: 0, bottom: 0 },
      runtimeConfig: {
        batchSize: 2,
        batchesPerRequest: 1,
        prefetchRailsAhead: 1,
      },
      emitDiag: vi.fn(),
    }

    const { result, rerender } = renderHook(
      (props) => useUserRecommendationsRail(props),
      { initialProps },
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(result.current.activeFeedContextKey).toContain('ctx-a')
    })

    const requestCountBeforeContextChange = fetchMock.mock.calls.length

    rerender({
      ...initialProps,
      feedContextKey: 'ctx-b',
    })

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(requestCountBeforeContextChange)
      expect(result.current.activeFeedContextKey).toContain('ctx-b')
    })
  })

  it('sanitizes invalid recommendation users before exposing them to the rail', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        seed: 11,
        ttlSec: 30,
        rotationKey: 'video:new:3',
        batches: [
          {
            batchId: 'batch-sanitize',
            users: [
              createRecommendationUser(1, {
                canonicalAccountId: 'user-valid',
                userId: 'user-valid',
                nickname: 'Valid User',
                avatar: '/avatars/valid.png',
                followersCount: 12,
              }),
              createRecommendationUser(2, {
                canonicalAccountId: 'user-valid',
                userId: 'user-valid',
                nickname: 'Valid User',
                avatar: '/avatars/valid.png',
                followersCount: 12,
              }),
              createRecommendationUser(3, {
                canonicalAccountId: 'user-no-avatar',
                userId: 'user-no-avatar',
                nickname: 'No Avatar',
                avatar: '',
                followersCount: 5,
              }),
              createRecommendationUser(4, {
                canonicalAccountId: 'user-no-stars',
                userId: 'user-no-stars',
                nickname: 'No Stars',
                avatar: '/avatars/no-stars.png',
                followersCount: 0,
              }),
            ],
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useUserRecommendationsRail({
        enabled: true,
        videoFeedOpen: true,
        viewerId: 'viewer-1',
        feedSort: 'new',
        feedContextKey: 'ctx-sanitize',
        vfSlots: [{ type: 'recommendation_rail', key: 'rec:1', railIndex: 0 }],
        vfWin: { start: 0, end: 1, top: 0, bottom: 0 },
        runtimeConfig: {
          batchSize: 15,
          batchesPerRequest: 1,
          prefetchRailsAhead: 1,
        },
        emitDiag: vi.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.getSlotState('rec:1')?.users).toHaveLength(1)
    })

    expect(result.current.getSlotState('rec:1')?.users?.[0]).toEqual(
      expect.objectContaining({
        canonicalAccountId: 'user-valid',
        nickname: 'Valid User',
        followersCount: 12,
      }),
    )
  })
})

describe('usePublishedPostsModel', () => {
  it('patches nested reply counters for published posts before rendering', () => {
    const posts = [
      {
        id: 'root-1',
        userId: 'me',
        ts: 100,
        likes: 2,
        views: 10,
        replyCount: 0,
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
        replyCount: 1,
        __repliesCount: 1,
      }),
    )
    expect(result.current.visiblePublishedPosts[0]).toEqual(
      expect.objectContaining({
        id: 'root-1',
        replyCount: 1,
      }),
    )
  })
})

describe('starred sorting models', () => {
  it('prioritizes subscribed authors in thread posts even when ids need canonical normalization', () => {
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
        id: 'starred-post',
      }),
    )
  })

  it('prioritizes subscribed authors in topics and keeps author filtering canonical-safe', () => {
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
        id: 'topic-starred',
      }),
    )
  })

  it('rebuilds video feed order when star mode becomes active so followed authors move first', () => {
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

    const promotedItem = result.current.videoFeed.find((item) => item.id !== firstPass[0])
    expect(promotedItem).toBeTruthy()

    rerender(createProps(new Set([String(promotedItem.userId)])))

    act(() => {
      result.current.buildAndSetVideoFeed()
    })

    expect(result.current.videoFeed[0]).toEqual(
      expect.objectContaining({
        id: promotedItem.id,
      }),
    )
  })
})
