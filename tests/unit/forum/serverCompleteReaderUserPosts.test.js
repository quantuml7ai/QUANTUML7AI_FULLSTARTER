import { afterEach, describe, expect, test } from 'vitest'
import completeReader from '../../../lib/forum/forum-server-complete-reader.cjs'

function readPath(row, path) {
  return String(path || '').split('.').filter(Boolean).reduce((cursor, part) => (cursor && typeof cursor === 'object' ? cursor[part] : undefined), row)
}

function matchesValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual || ''))
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) {
      const values = Array.isArray(expected.$in) ? expected.$in : []
      return Array.isArray(actual) ? actual.some((item) => values.includes(item)) : values.includes(actual)
    }
    if ('$ne' in expected) return actual !== expected.$ne
    if ('$lt' in expected) return Number(actual) < Number(expected.$lt)
    if ('$gt' in expected) return Number(actual) > Number(expected.$gt)
    if ('$regex' in expected) {
      const rx = expected.$regex instanceof RegExp ? expected.$regex : new RegExp(String(expected.$regex || ''))
      return rx.test(String(actual || ''))
    }
  }
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected
}

function matchesQuery(row, query) {
  if (!query || !Object.keys(query).length) return true
  if (Array.isArray(query.$and)) return query.$and.every((part) => matchesQuery(row, part))
  if (Array.isArray(query.$or)) return query.$or.some((part) => matchesQuery(row, part))
  return Object.entries(query).every(([key, expected]) => matchesValue(readPath(row, key), expected))
}

function compareRows(sortSpec = {}) {
  const entries = Object.entries(sortSpec || {})
  return (left, right) => {
    for (const [field, direction] of entries) {
      const dir = Number(direction || 1) >= 0 ? 1 : -1
      const a = readPath(left, field)
      const b = readPath(right, field)
      if (a === b) continue
      if (typeof a === 'number' || typeof b === 'number') return (Number(a || 0) - Number(b || 0)) * dir
      return String(a || '').localeCompare(String(b || '')) * dir
    }
    return 0
  }
}

function collectionApi(rows = []) {
  return {
    find(query = {}) {
      let result = rows.filter((row) => matchesQuery(row, query))
      const cursor = {
        sort(sortSpec = {}) {
          result = result.slice().sort(compareRows(sortSpec))
          return cursor
        },
        skip(skipCount) {
          result = result.slice(Math.max(0, Number(skipCount || 0)))
          return cursor
        },
        limit(limit) {
          result = result.slice(0, Number(limit || result.length))
          return cursor
        },
        hint() {
          return cursor
        },
        async toArray() {
          return result.slice()
        },
      }
      return cursor
    },
    async findOne(query = {}) {
      return rows.find((row) => matchesQuery(row, query)) || null
    },
  }
}

function makeProjectionPost({ id, authorId, ts }) {
  return {
    _id: `${authorId}:${id}`,
    canonicalAuthorId: authorId,
    postId: id,
    topicId: 'topic-1',
    visibility: { deleted: false },
    counters: { likes: 0, views: 1, replies: 0 },
    sort: { new: ts, top: ts, likes: 0, views: 1, replies: 0 },
    post: {
      id,
      postId: id,
      topicId: 'topic-1',
      userId: authorId,
      accountId: authorId,
      nickname: 'Author',
      text: id,
      ts,
      views: 1,
    },
  }
}

function makeProjectionTopic({ id, authorId, ts, views = 1, postsCount = 1 }) {
  return {
    _id: `${authorId}:${id}`,
    canonicalAuthorId: authorId,
    topicId: id,
    visibility: { deleted: false },
    counters: { posts: postsCount, replies: postsCount, likes: 0, views },
    sort: { new: ts, top: views + postsCount, likes: 0, views, replies: postsCount },
    topic: {
      id,
      topicId: id,
      userId: authorId,
      accountId: authorId,
      nickname: 'Author',
      title: id,
      ts,
      views,
      postsCount,
    },
  }
}

function fakeDb(collections = {}) {
  return {
    collection(name) {
      return collectionApi(collections[name] || [])
    },
  }
}

describe('forum complete reader user posts', () => {
  afterEach(() => {
    completeReader.__setTestDb(null)
  })

  test('normalizes random profile sort and merges wallet plus telegram aliases into one full list', async () => {
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const walletLower = wallet.toLowerCase()
    const telegram = 'telegram:777'

    const db = fakeDb({
      account_aliases: [
        {
          accountId: wallet,
          canonicalAccountId: walletLower,
          userId: wallet,
          alias: telegram,
          aliasId: 'tg:777',
          aliasValue: '777',
        },
      ],
      forum_user_post_index: [
        makeProjectionPost({ id: 'wallet-post', authorId: wallet, ts: 300 }),
      ],
      forum_core_posts: [
        {
          id: 'telegram-post',
          postId: 'telegram-post',
          userId: telegram,
          accountId: telegram,
          topicId: 'topic-1',
          text: 'telegram-post',
          ts: 200,
          views: 1,
        },
      ],
      forum_core_snapshot: [
        {
          _id: 'forum:snapshot',
          parsed: {
            payload: {
              posts: [
                {
                  id: 'legacy-post',
                  postId: 'legacy-post',
                  userId: 'tg:777',
                  accountId: 'tg:777',
                  topicId: 'topic-1',
                  text: 'legacy-post',
                  ts: 100,
                  views: 1,
                },
              ],
            },
          },
        },
      ],
    })

    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserPostsPage({
      input: {
        userId: wallet,
        sort: 'random',
        pageSize: 10,
      },
    })

    expect(page.ok).toBe(true)
    expect(page.queryShape.hint).toBe('ql7_user_post_new_v1')
    expect(page.totalCount).toBe(3)
    expect(page.items.map((item) => item.id)).toEqual(['wallet-post', 'telegram-post', 'legacy-post'])
  })

  test('keeps user-post totalCount canonical when projection page is partial', async () => {
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const walletLower = wallet.toLowerCase()

    const db = fakeDb({
      account_aliases: [
        { accountId: wallet, canonicalAccountId: walletLower, userId: wallet },
      ],
      forum_user_stats: [
        { _id: walletLower, canonicalAuthorId: walletLower, stats: { posts: 32 } },
      ],
      forum_user_post_index: [
        makeProjectionPost({ id: 'indexed-1', authorId: walletLower, ts: 300 }),
        makeProjectionPost({ id: 'indexed-2', authorId: walletLower, ts: 200 }),
      ],
      forum_core_posts: [
        {
          _id: 'post:created-by-alias',
          postId: 'created-by-alias',
          createdByAccountId: wallet,
          topicId: 'topic-1',
          text: 'created-by-alias',
          ts: 100,
          views: 1,
        },
      ],
    })

    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserPostsPage({
      input: { userId: wallet, sort: 'views', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.totalCount).toBe(32)
    expect(page.uniqueRowCount).toBe(3)
    expect(page.items.map((item) => item.id)).toEqual(['indexed-1', 'indexed-2', 'created-by-alias'])
  })

  test('hydrates user-post counters from core posts before sorting by replies', async () => {
    const wallet = 'wallet:alice'
    const stale = makeProjectionPost({ id: 'stale-projection', authorId: wallet, ts: 300 })
    stale.counters.replies = 1
    stale.sort.replies = 1
    stale.post.replyCount = 1
    const noisy = makeProjectionPost({ id: 'projection-only', authorId: wallet, ts: 200 })
    noisy.counters.replies = 50
    noisy.sort.replies = 50
    noisy.post.replyCount = 50

    const db = fakeDb({
      account_aliases: [],
      forum_user_post_index: [noisy, stale],
      forum_core_posts: [
        { _id: 'post:stale-projection', id: 'stale-projection', postId: 'stale-projection', userId: wallet, topicId: 'topic-1', text: 'canonical', ts: 300, replyCount: 100, views: 7 },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserPostsPage({
      input: { userId: wallet, sort: 'replies', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.id)).toEqual(['stale-projection', 'projection-only'])
    expect(page.items[0]).toEqual(expect.objectContaining({
      replyCount: 100,
      repliesCount: 100,
      commentsCount: 100,
      views: 7,
    }))
  })

  test('does not resurrect deleted projection-only user posts when delete events exist', async () => {
    const wallet = 'wallet:alice'
    const live = makeProjectionPost({ id: 'legacy-projection-only', authorId: wallet, ts: 300 })
    const deleted = makeProjectionPost({ id: 'deleted-projection-only', authorId: wallet, ts: 200 })
    const db = fakeDb({
      account_aliases: [],
      forum_user_post_index: [live, deleted],
      forum_core_change_events: [
        { _id: 'change:1', parsed: { kind: 'post_deleted', id: 'deleted-projection-only', deletedPostIds: ['deleted-projection-only'] } },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserPostsPage({
      input: { userId: wallet, sort: 'new', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.id)).toEqual(['legacy-projection-only'])
  })

  test('ignores stale user-post cursor instead of throwing a 500', async () => {
    const wallet = 'wallet:alice'
    const db = fakeDb({
      account_aliases: [],
      forum_user_post_index: [
        makeProjectionPost({ id: 'post-1', authorId: wallet, ts: 100 }),
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserPostsPage({
      input: { userId: wallet, sort: 'new', pageSize: 10, cursor: 'not-a-valid-signed-cursor' },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.id)).toEqual(['post-1'])
  })

  test('merges user topics across aliases and core topics instead of returning an empty branch', async () => {
    const wallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const walletLower = wallet.toLowerCase()

    const db = fakeDb({
      account_aliases: [
        { accountId: wallet, canonicalAccountId: walletLower, userId: wallet, alias: 'telegram:777' },
      ],
      forum_user_stats: [
        { _id: walletLower, canonicalAuthorId: walletLower, stats: { topics: 10 } },
      ],
      forum_user_topic_index: [
        makeProjectionTopic({ id: 'indexed-topic', authorId: walletLower, ts: 300, views: 900, postsCount: 2 }),
      ],
      forum_core_topics: [
        {
          _id: 'topic:core-topic',
          id: 'core-topic',
          topicId: 'core-topic',
          createdByAccountId: wallet,
          userId: wallet,
          title: 'core-topic',
          ts: 200,
          views: 10000,
          postsCount: 5,
        },
        {
          _id: 'topic:indexed-topic',
          id: 'indexed-topic',
          topicId: 'indexed-topic',
          title: 'indexed-topic',
          ts: 300,
          views: 2500,
          postsCount: 4,
          reactions: 34,
        },
      ],
      forum_core_posts: [
        { _id: 'post:indexed-topic-partial', id: 'indexed-topic-partial', postId: 'indexed-topic-partial', topicId: 'indexed-topic', views: 99, reactions: 1 },
      ],
    })

    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserTopicsPage({
      input: { userId: wallet, sort: 'views', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.totalCount).toBe(10)
    expect(page.uniqueRowCount).toBe(2)
    expect(page.items.map((item) => item.id)).toEqual(['core-topic', 'indexed-topic'])
    expect(page.items[1]).toEqual(expect.objectContaining({ views: 2500, postsCount: 4, likes: 34, reactions: 34 }))
    expect(page.items[1]).toEqual(expect.objectContaining({
      __ql7TopicCountersCoreHydrated: true,
      __ql7CounterSource: 'forum_core_topics',
    }))
  })

  test('hydrates user-topic counters and sort from all canonical posts in the topic', async () => {
    const wallet = 'wallet:topic-author'
    const low = makeProjectionTopic({ id: 'low-topic', authorId: wallet, ts: 200, views: 1, postsCount: 1 })
    const rich = makeProjectionTopic({ id: 'rich-topic', authorId: wallet, ts: 100, views: 1, postsCount: 1 })

    const db = fakeDb({
      account_aliases: [],
      forum_user_topic_index: [low, rich],
      forum_core_posts: [
        { _id: 'post:rich-1', id: 'rich-1', postId: 'rich-1', topicId: 'rich-topic', userId: wallet, views: 5000, reactions: 10, dislikes: 2, ts: 10 },
        { _id: 'post:rich-2', id: 'rich-2', postId: 'rich-2', topicId: 'rich-topic', userId: wallet, views: 4500, likes: 3, dislikes: 1, ts: 11 },
        { _id: 'post:low-1', id: 'low-1', postId: 'low-1', topicId: 'low-topic', userId: wallet, views: 100, reactions: 1, ts: 12 },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserTopicsPage({
      input: { userId: wallet, sort: 'views', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.id)).toEqual(['rich-topic', 'low-topic'])
    expect(page.items[0]).toEqual(expect.objectContaining({
      views: 9500,
      postsCount: 2,
      likes: 14,
      reactions: 14,
      dislikes: 3,
      __ql7TopicCountersPostTotalsHydrated: true,
      __ql7CounterSource: 'topic_post_totals',
    }))
  })

  test('sorts user topics by full reaction totals without hanging on stale projections', async () => {
    const wallet = 'wallet:topic-author'
    const staleRich = makeProjectionTopic({ id: 'stale-rich-topic', authorId: wallet, ts: 200, views: 1, postsCount: 1 })
    staleRich.sort = { ...(staleRich.sort || {}), likes: 999 }
    staleRich.counters = { ...(staleRich.counters || {}), reactions: 999 }
    const realRich = makeProjectionTopic({ id: 'real-rich-topic', authorId: wallet, ts: 100, views: 1, postsCount: 1 })

    const db = fakeDb({
      account_aliases: [],
      forum_user_topic_index: [staleRich, realRich],
      forum_core_posts: [
        { _id: 'post:real-rich-1', id: 'real-rich-1', postId: 'real-rich-1', topicId: 'real-rich-topic', userId: wallet, reactions: 11, dislikes: 2, ts: 10 },
        { _id: 'post:real-rich-2', id: 'real-rich-2', postId: 'real-rich-2', topicId: 'real-rich-topic', userId: wallet, likes: 3, dislikes: 1, ts: 11 },
        { _id: 'post:stale-rich-1', id: 'stale-rich-1', postId: 'stale-rich-1', topicId: 'stale-rich-topic', userId: wallet, reactions: 1, ts: 12 },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumUserTopicsPage({
      input: { userId: wallet, sort: 'reactions', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.id)).toEqual(['real-rich-topic', 'stale-rich-topic'])
    expect(page.items[0]).toEqual(expect.objectContaining({ likes: 15, reactions: 15 }))
    expect(page.items[1]).toEqual(expect.objectContaining({ likes: 1, reactions: 1 }))
    expect(page.hasMore).toBe(false)
  })

  test('hydrates public topic page counters from full canonical post totals before sorting', async () => {
    const authorId = 'wallet:topic-author'
    const low = makeProjectionTopic({ id: 'low-topic', authorId, ts: 200, views: 1, postsCount: 1 })
    const rich = makeProjectionTopic({ id: 'rich-topic', authorId, ts: 100, views: 1, postsCount: 1 })

    const db = fakeDb({
      forum_user_topic_index: [low, rich],
      forum_core_topics: [
        {
          _id: 'topic:rich-topic',
          id: 'rich-topic',
          topicId: 'rich-topic',
          title: 'rich-topic',
          ts: 100,
          views: 100,
          postsCount: 1,
          reactions: 1,
        },
      ],
      forum_core_posts: [
        { _id: 'post:rich-1', id: 'rich-1', postId: 'rich-1', topicId: 'rich-topic', userId: authorId, views: 5000, reactions: 10, dislikes: 2, ts: 10 },
        { _id: 'post:rich-2', id: 'rich-2', postId: 'rich-2', topicId: 'rich-topic', userId: authorId, views: 4500, likes: 3, dislikes: 1, ts: 11 },
        { _id: 'post:low-1', id: 'low-1', postId: 'low-1', topicId: 'low-topic', userId: authorId, views: 100, reactions: 1, ts: 12 },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumTopicsPage({
      input: { sort: 'views', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.queryShape.cursorDomain).toBe('forum-topics-v1')
    expect(page.items.map((item) => item.id)).toEqual(['rich-topic', 'low-topic'])
    expect(page.items[0]).toEqual(expect.objectContaining({
      views: 9500,
      postsCount: 2,
      likes: 14,
      reactions: 14,
      dislikes: 3,
      __ql7TopicCountersPostTotalsHydrated: true,
    }))
  })

  test('search people reads profiles by nickname even when the user has no posts', async () => {
    const db = fakeDb({
      profile_nick_index: [
        {
          _id: 'nick:nopostuser',
          nickLower: 'nopostuser',
          normalizedNick: 'NoPostUser',
          nickname: 'NoPostUser',
          ownerUserId: 'wallet:no-posts',
          accountId: 'wallet:no-posts',
          userId: 'wallet:no-posts',
        },
      ],
      profiles: [
        {
          _id: 'profile:wallet:no-posts',
          userId: 'wallet:no-posts',
          accountId: 'wallet:no-posts',
          nickname: 'NoPostUser',
          icon: '/avatars/no-posts.png',
          stats: { posts: 0, topics: 0, likes: 0 },
        },
      ],
      forum_search_index: [],
      forum_core_posts: [],
      forum_user_topic_index: [],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumSearchPage({
      input: { q: 'NoPost', mode: 'people', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.source).toBe('mongo_profile_index')
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toEqual(expect.objectContaining({
      kind: 'person',
      accountId: 'wallet:no-posts',
      item: expect.objectContaining({
        accountId: 'wallet:no-posts',
        nickname: 'NoPostUser',
        icon: '/avatars/no-posts.png',
      }),
    }))
  })

  test('search people is strict profile-prefix search and does not leak post authors', async () => {
    const db = fakeDb({
      profile_nick_index: [
        {
          _id: 'nick:dzhinsovaja',
          nickLower: 'dzhinsovaja',
          normalizedNick: 'Dzhinsovaja',
          ownerUserId: 'wallet:dzh',
          accountId: 'wallet:dzh',
          userId: 'wallet:dzh',
        },
        {
          _id: 'nick:dastrobo',
          nickLower: 'dastrobo',
          normalizedNick: 'DASTROBO',
          ownerUserId: 'wallet:dastrobo',
          accountId: 'wallet:dastrobo',
          userId: 'wallet:dastrobo',
        },
      ],
      profiles: [
        {
          _id: 'profile:wallet:dzh',
          accountId: 'wallet:dzh',
          canonicalNickname: 'Dzhinsovaja',
          icon: '/avatars/dzh.png',
        },
        {
          _id: 'profile:wallet:dastrobo',
          accountId: 'wallet:dastrobo',
          nickname: 'DASTROBO',
          icon: '/avatars/dastrobo.png',
        },
        {
          _id: 'profile:wallet:crypto',
          accountId: 'wallet:crypto',
          nickname: 'Crypto Alex',
          icon: '/avatars/crypto.png',
        },
      ],
      forum_search_index: [
        {
          _id: 'post:crypto',
          kind: 'post',
          entityId: 'crypto-post',
          postId: 'crypto-post',
          canonicalAuthorId: 'wallet:crypto',
          searchText: 'D appears only inside this post body',
          sort: { relevance: 100, new: 100 },
          post: {
            id: 'crypto-post',
            postId: 'crypto-post',
            userId: 'wallet:crypto',
            nickname: 'Crypto Alex',
            text: 'D appears only inside this post body',
          },
        },
      ],
      forum_core_posts: [],
      forum_user_topic_index: [],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumSearchPage({
      input: { q: 'D', mode: 'people', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.item.nickname)).toEqual(['DASTROBO', 'Dzhinsovaja'])
    expect(page.items.map((item) => item.accountId)).not.toContain('wallet:crypto')
  })

  test('search people returns one card for one linked account across aliases', async () => {
    const db = fakeDb({
      account_aliases: [
        {
          accountId: 'wallet:dady',
          canonicalAccountId: 'wallet:dady',
          userId: 'wallet:dady',
          alias: 'telegram:42',
          aliasId: 'tg:42',
          aliasValue: '42',
        },
      ],
      profile_nick_index: [
        {
          _id: 'nick:dady-wallet',
          nickLower: 'dady',
          normalizedNick: 'DADY',
          nickname: 'DADY',
          ownerUserId: 'wallet:dady',
          accountId: 'wallet:dady',
          userId: 'wallet:dady',
        },
        {
          _id: 'nick:dady-telegram',
          nickLower: 'dady',
          normalizedNick: 'DADY',
          nickname: 'DADY',
          ownerUserId: 'telegram:42',
          accountId: 'telegram:42',
          userId: 'telegram:42',
        },
      ],
      profiles: [
        {
          _id: 'profile:wallet:dady',
          accountId: 'wallet:dady',
          canonicalAccountId: 'wallet:dady',
          nickname: 'DADY',
          icon: '/avatars/dady.png',
        },
      ],
      forum_search_index: [],
      forum_core_posts: [],
      forum_user_topic_index: [],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumSearchPage({
      input: { q: 'D', mode: 'people', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.item.nickname)).toEqual(['DADY'])
    expect(new Set(page.items.map((item) => item.accountId))).toHaveProperty('size', 1)
  })

  test('search people can read profile rows directly without nickname index', async () => {
    const db = fakeDb({
      profile_nick_index: [],
      profiles: [
        {
          _id: 'profile:wallet:direct',
          accountId: 'wallet:direct',
          canonicalNickname: 'DirectOnly',
          icon: '/avatars/direct.png',
        },
      ],
      forum_core_user_metadata: [],
      forum_search_index: [],
      forum_core_posts: [],
      forum_user_topic_index: [],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumSearchPage({
      input: { q: 'Dir', mode: 'people', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toEqual(expect.objectContaining({
      accountId: 'wallet:direct',
      item: expect.objectContaining({
        nickname: 'DirectOnly',
        icon: '/avatars/direct.png',
      }),
    }))
  })

  test('thread topic roots sort by canonical replies and expose thread server rank', async () => {
    const slow = makeProjectionPost({ id: 'slow-root', authorId: 'wallet:slow', ts: 400 })
    const hot = makeProjectionPost({ id: 'hot-root', authorId: 'wallet:hot', ts: 100 })
    slow.parentId = null
    hot.parentId = null
    slow.sort.replies = 1
    hot.sort.replies = 2
    slow.counters.replies = 1
    hot.counters.replies = 2
    slow.post.replyCount = 1
    hot.post.replyCount = 2

    const db = fakeDb({
      forum_thread_index: [slow, hot],
      forum_core_posts: [
        { _id: 'post:slow-root', id: 'slow-root', postId: 'slow-root', userId: 'wallet:slow', topicId: 'topic-1', text: 'slow', ts: 400, replyCount: 3, views: 1 },
        { _id: 'post:hot-root', id: 'hot-root', postId: 'hot-root', userId: 'wallet:hot', topicId: 'topic-1', text: 'hot', ts: 100, replyCount: 9, views: 1 },
      ],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumThreadPage({
      input: { mode: 'topic_roots', topicId: 'topic-1', sort: 'replies', feedMode: 'world', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.mode).toBe('world')
    expect(page.sort).toBe('replies')
    expect(page.items.map((item) => item.id)).toEqual(['hot-root', 'slow-root'])
    expect(page.items[0]).toEqual(expect.objectContaining({
      replyCount: 9,
      __ql7ServerFeedRank: 0,
      __ql7ServerFeedMode: 'world',
      __ql7ServerFeedSort: 'replies',
      __ql7ServerFeedSurface: 'thread',
    }))
  })

  test('search topics exposes canonical post totals for search badges', async () => {
    const db = fakeDb({
      forum_search_index: [
        {
          _id: 'topic:power-on',
          kind: 'topic',
          entityId: 'power-on',
          topicId: 'power-on',
          text: { tokens: ['power', 'on', 'global', 'forum', 'topic'] },
          visibility: { deleted: false },
          sort: { relevance: 100, new: 100, replies: 1 },
          counters: { posts: 1, replies: 1, views: 1 },
          topic: {
            id: 'power-on',
            topicId: 'power-on',
            title: 'Quantum L7 AI Global - Power On',
            description: 'Official hub',
            postsCount: 1,
            replies: 1,
            views: 1,
          },
        },
      ],
      forum_core_posts: [
        { _id: 'post:1', id: 'p1', postId: 'p1', topicId: 'power-on', views: 10, reactions: 1 },
        { _id: 'post:2', id: 'p2', postId: 'p2', topicId: 'power-on', views: 20, reactions: 2 },
        { _id: 'post:3', id: 'p3', postId: 'p3', topicId: 'power-on', views: 30, reactions: 3 },
      ],
      forum_thread_index: [],
    })
    completeReader.__setTestDb(db)

    const page = await completeReader.readForumSearchPage({
      input: { q: 'Power', mode: 'topics', pageSize: 10 },
    })

    expect(page.ok).toBe(true)
    expect(page.items).toHaveLength(1)
    expect(page.items[0].item).toEqual(expect.objectContaining({
      postsCount: 3,
      replies: 3,
      repliesCount: 3,
      __ql7TopicCountersPostTotalsHydrated: true,
    }))
  })
})
