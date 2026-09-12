import { describe, expect, it, vi } from 'vitest'
import {
  arePostCardBridgePropsEqual,
  areTopicItemPropsEqual,
  readAggSig,
  readPostRenderSig,
  readTopicSig,
} from '../../../../../../app/forum/features/feed/utils/cardMemo.js'
import {
  mergeForumEntitiesById,
  mergeForumEntityPreserving,
} from '../../../../../../app/forum/features/feed/utils/postMerge.js'
import { buildVideoFeedItems } from '../../../../../../app/forum/features/media/utils/videoFeedBuilder.js'

const noop = () => {}
const translate = (key) => key

function createPostCardProps(overrides = {}) {
  return {
    p: {
      id: 'post-1',
      topicId: 'topic-1',
      userId: 'author-1',
      nickname: 'Author 1',
      text: 'Memo text',
      likes: 4,
      views: 9,
      ts: 1700000000,
    },
    parentAuthor: 'Parent',
    parentText: 'Parent text',
    parentPost: { id: 'parent-1', topicId: 'topic-1', ts: 1699999999 },
    onReport: noop,
    onShare: noop,
    onOpenThread: noop,
    threadOpenOptions: null,
    onReact: noop,
    isAdmin: false,
    onDeletePost: noop,
    onOwnerDelete: noop,
    onBanUser: noop,
    onUnbanUser: noop,
    isBanned: false,
    authId: 'viewer-1',
    markView: noop,
    t: translate,
    isVideoFeed: false,
    isSelfAuthor: false,
    isStarredAuthor: false,
    onToggleStar: noop,
    onUserInfoToggle: noop,
    richRenderer: noop,
    enableVideoControlsOnTap: noop,
    rearmPooledFxNode: noop,
    VideoMediaComponent: noop,
    QCastPlayerComponent: noop,
    ...overrides,
  }
}

function createTopicItemProps(overrides = {}) {
  return {
    t: {
      id: 'topic-1',
      userId: 'author-1',
      nickname: 'Author 1',
      icon: '/avatar.png',
      title: 'Topic title',
      description: 'Topic description',
      ts: 1700000000,
    },
    agg: {
      posts: 3,
      likes: 10,
      dislikes: 1,
      views: 25,
    },
    onOpen: noop,
    onView: noop,
    isAdmin: false,
    onDelete: noop,
    authId: 'viewer-1',
    onOwnerDelete: noop,
    isSelfAuthor: false,
    isStarredAuthor: true,
    onToggleStar: noop,
    onUserInfoToggle: noop,
    formatCount: String,
    dataProfileBranchStart: undefined,
    ...overrides,
  }
}

describe('card memo comparators', () => {
  it('keeps PostCard bridge asleep when effective render props stay the same', () => {
    const prevProps = createPostCardProps()
    const nextProps = createPostCardProps()

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(true)
  })

  it('wakes PostCard bridge on meaningful post changes', () => {
    const prevProps = createPostCardProps()
    const nextProps = createPostCardProps({
      p: {
        ...prevProps.p,
        likes: 5,
      },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes PostCard bridge when reply target name arrives on the post DTO', () => {
    const prevProps = createPostCardProps({
      parentAuthor: '',
      parentText: '',
      parentPost: null,
      p: {
        ...createPostCardProps().p,
        parentId: 'parent-1',
        replyToPostId: 'parent-1',
      },
    })
    const nextProps = createPostCardProps({
      parentAuthor: '',
      parentText: '',
      parentPost: null,
      p: {
        ...prevProps.p,
        replyToName: 'CLIO',
        replyToNickname: 'CLIO',
      },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes PostCard bridge when parent post author metadata is hydrated', () => {
    const prevProps = createPostCardProps({
      parentPost: { id: 'parent-1', topicId: 'topic-1', ts: 1699999999 },
    })
    const nextProps = createPostCardProps({
      parentPost: {
        ...prevProps.parentPost,
        nickname: 'CLIO',
        text: 'Smart furniture ideas...',
      },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('keeps TopicItem asleep when only parent noise changes', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps()

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(true)
  })

  it('wakes TopicItem when aggregate counters change', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps({
      agg: {
        ...prevProps.agg,
        likes: 11,
      },
    })

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes TopicItem when star-state changes for the same topic', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps({
      isStarredAuthor: false,
    })

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes PostCard bridge when thread open options change', () => {
    const prevProps = createPostCardProps({
      threadOpenOptions: null,
    })
    const nextProps = createPostCardProps({
      threadOpenOptions: { closeInbox: true },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('keeps post render signatures stable for equivalent payloads and reacts to real content changes', () => {
    const base = {
      id: 'post-1',
      userId: 'author-1',
      nickname: 'Author',
      text: 'Hello',
      likes: 3,
      attachments: [{ url: '/a.png', type: 'image' }],
    }

    expect(readPostRenderSig(base)).toBe(readPostRenderSig({ ...base }))
    expect(readPostRenderSig(base)).not.toBe(readPostRenderSig({ ...base, likes: 4 }))
    expect(readPostRenderSig(base)).not.toBe(
      readPostRenderSig({ ...base, attachments: [{ url: '/b.png', type: 'image' }] }),
    )
  })

  it('keeps topic signatures stable for equivalent payloads and reacts to visible topic changes', () => {
    const baseTopic = {
      id: 'topic-1',
      userId: 'author-1',
      nickname: 'Author',
      title: 'Alpha',
      description: 'Desc',
      ts: 1710000000000,
    }

    expect(readTopicSig(baseTopic)).toBe(readTopicSig({ ...baseTopic }))
    expect(readTopicSig(baseTopic)).not.toBe(readTopicSig({ ...baseTopic, title: 'Beta' }))
    expect(readAggSig({ posts: 1, likes: 2, dislikes: 0, views: 3 }))
      .not.toBe(readAggSig({ posts: 1, likes: 2, dislikes: 0, views: 9 }))
  })

  it('preserves authoritative topic/post counters when a later partial DTO arrives', () => {
    const merged = mergeForumEntitiesById([
      {
        id: 'topic-1',
        postsCount: 32,
        replies: 32,
        repliesCount: 32,
        counters: { posts: 32, replies: 32, likes: 8, views: 10000 },
        sort: { replies: 32, likes: 8, views: 10000, top: 2040 },
        views: 10000,
      },
    ], [
      {
        id: 'topic-1',
        postsCount: 10,
        replies: 10,
        repliesCount: 10,
        counters: { posts: 10, replies: 10, likes: 9, views: 900 },
        sort: { replies: 10, likes: 9, views: 900, top: 198 },
        views: 900,
      },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(
      expect.objectContaining({
        postsCount: 32,
        replies: 32,
        repliesCount: 32,
        views: 10000,
      }),
    )
    expect(merged[0].counters).toEqual(
      expect.objectContaining({
        posts: 32,
        replies: 32,
        likes: 9,
        views: 10000,
      }),
    )
    expect(merged[0].sort).toEqual(
      expect.objectContaining({
        replies: 32,
        likes: 9,
        views: 10000,
        top: 2040,
      }),
    )
  })

  it('lets fresh authoritative counters replace stale inflated counters', () => {
    const merged = mergeForumEntitiesById([
      {
        id: 'post-1',
        views: 9000,
        reactions: 50,
        replyCount: 18,
        counters: { views: 9000, reactions: 50, replies: 18 },
        sort: { views: 9000, likes: 50, reactions: 50, replies: 18 },
      },
    ], [
      {
        id: 'post-1',
        views: 29,
        reactions: 4,
        replyCount: 1,
        __ql7PostCountersCoreHydrated: true,
        __ql7CounterSource: 'forum_core_posts',
        counters: {
          views: 29,
          reactions: 4,
          replies: 1,
          __ql7PostCountersCoreHydrated: true,
          __ql7CounterSource: 'forum_core_posts',
        },
        sort: { views: 29, likes: 4, reactions: 4, replies: 1 },
      },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replyCount: 1,
    }))
    expect(merged[0].counters).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replies: 1,
    }))
    expect(merged[0].sort).toEqual(expect.objectContaining({
      views: 29,
      likes: 4,
      reactions: 4,
      replies: 1,
    }))
  })

  it('prevents stale non-authoritative DTOs from inflating known authoritative counters', () => {
    const merged = mergeForumEntitiesById([
      {
        id: 'post-1',
        views: 29,
        reactions: 4,
        replyCount: 1,
        __ql7PostCountersCoreHydrated: true,
        __ql7CounterSource: 'forum_core_posts',
        counters: {
          views: 29,
          reactions: 4,
          replies: 1,
          __ql7PostCountersCoreHydrated: true,
          __ql7CounterSource: 'forum_core_posts',
        },
        sort: { views: 29, likes: 4, reactions: 4, replies: 1 },
      },
    ], [
      {
        id: 'post-1',
        views: 9000,
        reactions: 50,
        replyCount: 18,
        counters: { views: 9000, reactions: 50, replies: 18 },
        sort: { views: 9000, likes: 50, reactions: 50, replies: 18 },
      },
    ])

    expect(merged[0]).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replyCount: 1,
    }))
    expect(merged[0].counters).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replies: 1,
    }))
    expect(merged[0].sort).toEqual(expect.objectContaining({
      views: 29,
      likes: 4,
      reactions: 4,
      replies: 1,
    }))
  })

  it('does not treat embedded topic totals as authoritative post counters', () => {
    const merged = mergeForumEntitiesById([
      {
        id: 'post-1',
        postId: 'post-1',
        topicId: 'topic-1',
        views: 29,
        reactions: 4,
        replyCount: 1,
        __ql7PostCountersCoreHydrated: true,
        __ql7CounterSource: 'forum_core_posts',
        counters: {
          views: 29,
          reactions: 4,
          replies: 1,
          __ql7PostCountersCoreHydrated: true,
          __ql7CounterSource: 'forum_core_posts',
        },
        sort: { views: 29, likes: 4, reactions: 4, replies: 1 },
      },
    ], [
      {
        id: 'post-1',
        postId: 'post-1',
        topicId: 'topic-1',
        views: 9000,
        reactions: 50,
        replyCount: 18,
        __ql7CounterSource: 'topic_post_totals',
        counters: {
          views: 9000,
          reactions: 50,
          replies: 18,
          __ql7CounterSource: 'topic_post_totals',
        },
        sort: { views: 9000, likes: 50, reactions: 50, replies: 18 },
        topic: {
          id: 'topic-1',
          views: 9000,
          postsCount: 18,
          reactions: 50,
          __ql7CounterSource: 'topic_post_totals',
        },
      },
    ])

    expect(merged[0]).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replyCount: 1,
    }))
    expect(merged[0].topic).toEqual(expect.objectContaining({
      views: 9000,
      postsCount: 18,
      reactions: 50,
    }))
  })

  it('keeps server-ranked video feed order ahead of starred author promotion', () => {
    const items = buildVideoFeedItems({
      data: { posts: [] },
      allPosts: [
        { id: 'global-star', userId: 'star', videoUrl: 'https://cdn.example/g.mp4', __ql7ServerFeedRank: 2, __ql7ServerFeedMode: 'geo' },
        { id: 'paris-1', userId: 'a', videoUrl: 'https://cdn.example/a.mp4', __ql7ServerFeedRank: 0, __ql7GeoFeedRank: 0, __ql7ServerFeedMode: 'geo' },
        { id: 'paris-2', userId: 'b', videoUrl: 'https://cdn.example/b.mp4', __ql7ServerFeedRank: 1, __ql7GeoFeedRank: 1, __ql7ServerFeedMode: 'geo' },
      ],
      isMediaUrl: (url) => /\.mp4$/i.test(String(url || '')),
      extractUrlsFromText: () => [],
      videoFeedUserSortLocked: true,
      feedSort: 'views',
      viewerId: 'viewer',
      videoFeedPageSalt: 'salt',
      videoFeedEntryToken: 1,
      starredFirst: (list) => [...list].sort((a, b) => (a.userId === 'star' ? -1 : b.userId === 'star' ? 1 : 0)),
    })

    expect(items.map((item) => item.id)).toEqual(['paris-1', 'paris-2', 'global-star'])
  })

  it('does not let stale World server ranks split active Geo media rings', () => {
    const items = buildVideoFeedItems({
      data: { posts: [] },
      allPosts: [
        { id: 'stale-world', userId: 'global', videoUrl: 'https://cdn.example/world.mp4', __ql7ServerFeedRank: 0, __ql7ServerFeedMode: 'world' },
        { id: 'paris-1', userId: 'a', videoUrl: 'https://cdn.example/a.mp4', __ql7ServerFeedRank: 0, __ql7GeoFeedRank: 0, __ql7ServerFeedMode: 'geo' },
        { id: 'paris-2', userId: 'b', videoUrl: 'https://cdn.example/b.mp4', __ql7ServerFeedRank: 1, __ql7GeoFeedRank: 1, __ql7ServerFeedMode: 'geo' },
      ],
      isMediaUrl: (url) => /\.mp4$/i.test(String(url || '')),
      extractUrlsFromText: () => [],
      videoFeedUserSortLocked: true,
      feedSort: 'views',
      viewerId: 'viewer',
      videoFeedPageSalt: 'salt',
      videoFeedEntryToken: 1,
      starredFirst: (list) => list,
    })

    expect(items.map((item) => item.id).slice(0, 3)).toEqual(['paris-1', 'paris-2', 'stale-world'])
  })

  it('drops stale geo rank when a fresh World server row replaces a Geo row', () => {
    const merged = mergeForumEntityPreserving(
      {
        id: 'paris-1',
        videoUrl: 'https://cdn.example/paris.mp4',
        __ql7ServerFeedMode: 'geo',
        __ql7ServerFeedRank: 0,
        __ql7GeoFeedRank: 0,
      },
      {
        id: 'paris-1',
        videoUrl: 'https://cdn.example/paris.mp4',
        __ql7ServerFeedMode: 'world',
        __ql7ServerFeedRank: 8,
      },
    )

    expect(merged.__ql7ServerFeedMode).toBe('world')
    expect(merged.__ql7ServerFeedRank).toBe(8)
    expect(merged.__ql7GeoFeedRank).toBeUndefined()
  })

  it('does not let stale geo rank pin World media items above server order', () => {
    const items = buildVideoFeedItems({
      data: { posts: [] },
      allPosts: [
        {
          id: 'world-first',
          userId: 'global',
          videoUrl: 'https://cdn.example/global.mp4',
          __ql7ServerFeedRank: 0,
          __ql7ServerFeedMode: 'world',
        },
        {
          id: 'stale-paris',
          userId: 'paris',
          videoUrl: 'https://cdn.example/paris.mp4',
          __ql7GeoFeedRank: 0,
          __ql7ServerFeedRank: 4,
          __ql7ServerFeedMode: 'world',
        },
      ],
      isMediaUrl: (url) => /\.mp4$/i.test(String(url || '')),
      extractUrlsFromText: () => [],
      videoFeedUserSortLocked: true,
      feedSort: 'views',
      viewerId: 'viewer',
      videoFeedPageSalt: 'salt',
      videoFeedEntryToken: 1,
      starredFirst: (list) => [...list].sort((a, b) => (a.userId === 'paris' ? -1 : b.userId === 'paris' ? 1 : 0)),
    })

    expect(items.map((item) => item.id)).toEqual(['world-first', 'stale-paris'])
  })
})
