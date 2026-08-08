import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import forumPrimaryModule from '../../../lib/mongo/forum-primary.cjs'

const forumPrimary = forumPrimaryModule?.default || forumPrimaryModule

function getValue(doc, key) {
  return String(key).split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc)
}

function setValue(doc, key, value) {
  const parts = String(key).split('.')
  let target = doc
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    if (!target[part] || typeof target[part] !== 'object') target[part] = {}
    target = target[part]
  }
  target[parts[parts.length - 1]] = value
}

function matchesValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual))
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) {
      const accepted = expected.$in.map(String)
      if (Array.isArray(actual)) return actual.map(String).some((value) => accepted.includes(value))
      return accepted.includes(String(actual))
    }
    if ('$ne' in expected) return String(actual) !== String(expected.$ne)
  }
  return String(actual) === String(expected)
}

function matches(doc, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((item) => matches(doc, item))
  return Object.entries(filter).every(([key, expected]) => matchesValue(getValue(doc, key), expected))
}

function applyUpdate(doc, update = {}, isInsert = false) {
  if (isInsert && update.$setOnInsert) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) setValue(doc, key, value)
  }
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) setValue(doc, key, value)
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      setValue(doc, key, Number(getValue(doc, key) || 0) + Number(value || 0))
    }
  }
  if (update.$max) {
    for (const [key, value] of Object.entries(update.$max)) {
      setValue(doc, key, Math.max(Number(getValue(doc, key) || 0), Number(value || 0)))
    }
  }
}

function createMemoryCollection() {
  const rows = new Map()
  return {
    rows,
    async createIndex() { return 'ok' },
    async updateOne(filter, update, options = {}) {
      let doc = Array.from(rows.values()).find((row) => matches(row, filter))
      const isInsert = !doc
      if (!doc) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
        const id = filter?._id || update?.$setOnInsert?._id || `auto:${rows.size + 1}`
        doc = { _id: id }
        rows.set(String(id), doc)
      }
      applyUpdate(doc, update, isInsert)
      return { matchedCount: isInsert ? 0 : 1, modifiedCount: 1, upsertedCount: isInsert ? 1 : 0 }
    },
    async updateMany(filter, update) {
      let matched = 0
      for (const doc of rows.values()) {
        if (!matches(doc, filter)) continue
        applyUpdate(doc, update, false)
        matched += 1
      }
      return { matchedCount: matched, modifiedCount: matched }
    },
    async findOneAndUpdate(filter, update, options = {}) {
      await this.updateOne(filter, update, { upsert: options.upsert })
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    async findOne(filter) {
      return Array.from(rows.values()).find((row) => matches(row, filter)) || null
    },
    find(filter = {}) {
      let sortSpec = null
      let limitValue = Infinity
      const cursor = {
        sort(spec) { sortSpec = spec; return cursor },
        limit(n) { limitValue = Number(n || 0) > 0 ? Number(n) : Infinity; return cursor },
        maxTimeMS() { return cursor },
        async toArray() {
          let list = Array.from(rows.values()).filter((row) => matches(row, filter))
          if (sortSpec) {
            const entries = Object.entries(sortSpec)
            list = list.slice().sort((a, b) => {
              for (const [key, dir] of entries) {
                const av = getValue(a, key)
                const bv = getValue(b, key)
                if (av === bv) continue
                return (av > bv ? 1 : -1) * Number(dir || 1)
              }
              return 0
            })
          }
          return list.slice(0, limitValue).map((row) => ({ ...row }))
        },
      }
      return cursor
    },
    async deleteOne(filter) {
      const item = Array.from(rows.entries()).find(([, row]) => matches(row, filter))
      if (item) rows.delete(item[0])
      return { deletedCount: item ? 1 : 0 }
    },
    async deleteMany(filter) {
      let count = 0
      for (const [key, row] of Array.from(rows.entries())) {
        if (matches(row, filter)) {
          rows.delete(key)
          count += 1
        }
      }
      return { deletedCount: count }
    },
    async countDocuments(filter = {}) {
      return Array.from(rows.values()).filter((row) => matches(row, filter)).length
    },
  }
}

function createMemoryDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, createMemoryCollection())
      return collections.get(name)
    },
  }
}

describe('forum Mongo primary repository', () => {
  let memoryDb

  beforeEach(() => {
    memoryDb = createMemoryDb()
    forumPrimary.__setTestDb(memoryDb)
  })

  afterEach(() => {
    forumPrimary.__setTestDb(null)
  })

  test('creates topics/posts and keeps snapshot and user totals in Mongo', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', description: 'D', userId: 'alice', nickname: 'Alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'alice', nickname: 'Alice' })

    expect(topic.id).toBe('1')
    expect(post.id).toBe('1')
    await expect(forumPrimary.getTopic(topic.id)).resolves.toMatchObject({ postsCount: 1 })
    await expect(forumPrimary.getPost(post.id)).resolves.toMatchObject({ topicId: topic.id, text: 'hello' })
    await expect(forumPrimary.getUserTotals('alice')).resolves.toMatchObject({ postsTotal: 1, topicsTotal: 1, likesTotal: 0 })

    const snapshot = await forumPrimary.rebuildSnapshot()
    expect(snapshot.payload.topics).toHaveLength(1)
    expect(snapshot.payload.posts).toHaveLength(1)
  })

  test('full snapshot preserves canonical posts when the stored snapshot document is stale', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', description: 'D', userId: 'alice', nickname: 'Alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'alice', nickname: 'Alice' })

    await memoryDb.collection('forum_core_snapshot').updateOne(
      { _id: 'forum:snapshot' },
      {
        $set: {
          rev: 1,
          parsed: { rev: 1, payload: { topics: [topic], posts: [], banned: [] } },
          value: { rev: 1, payload: { topics: [topic], posts: [], banned: [] } },
        },
      },
      { upsert: true },
    )

    const snapshot = await forumPrimary.readSnapshot({ sinceRev: 0 })
    expect(snapshot.posts.map((row) => row.id)).toContain(post.id)
  })

  test('does not reuse migrated topic and post ids when Mongo counters are stale', async () => {
    await memoryDb.collection('forum_core_counters').updateOne(
      { _id: 'counter:forum:seq:topic' },
      { $set: { value: 1, raw: '1', parsed: 1 } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_counters').updateOne(
      { _id: 'counter:forum:seq:post' },
      { $set: { value: 2, raw: '2', parsed: 2 } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_topics').updateOne(
      { _id: 'topic:41' },
      { $set: { id: '41', topicId: '41', title: 'Migrated topic', userId: 'alice', ts: 1 } },
      { upsert: true },
    )
    await memoryDb.collection('forum_core_posts').updateOne(
      { _id: 'post:88' },
      { $set: { id: '88', postId: '88', topicId: '41', text: 'Migrated post', userId: 'alice', ts: 2 } },
      { upsert: true },
    )

    const { topic } = await forumPrimary.createTopic({ title: 'Fresh topic', description: 'D', userId: 'alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'Fresh post', userId: 'alice' })

    expect(topic.id).toBe('42')
    expect(post.id).toBe('89')
    await expect(forumPrimary.getPost('88')).resolves.toMatchObject({ text: 'Migrated post' })
    await expect(forumPrimary.getPost('89')).resolves.toMatchObject({ text: 'Fresh post' })
  })

  test('partial counter patches never create empty snapshot cards', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', description: 'D', userId: 'alice', nickname: 'Alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'alice', nickname: 'Alice' })

    await forumPrimary.patchSnapshot({
      rev: 2,
      patch: {
        topics: {
          ghost_topic: { postsCount: 9, views: 10 },
          ghost_topic_with_author: { userId: 'alice', ts: Date.now(), postsCount: 1, views: 1 },
        },
        posts: {
          ghost_post: { views: 1, likes: 2 },
          ghost_post_with_author: { topicId: topic.id, userId: 'alice', ts: Date.now(), likes: 1 },
          [post.id]: { views: 3 },
        },
      },
    })

    const snapshot = await forumPrimary.readSnapshot({ sinceRev: 0 })
    expect(snapshot.topics.map((row) => row.id)).not.toContain('ghost_topic')
    expect(snapshot.topics.map((row) => row.id)).not.toContain('ghost_topic_with_author')
    expect(snapshot.posts.map((row) => row.id)).not.toContain('ghost_post')
    expect(snapshot.posts.map((row) => row.id)).not.toContain('ghost_post_with_author')
    expect(snapshot.posts.find((row) => row.id === post.id)).toMatchObject({ text: 'hello' })

    await forumPrimary.updatePostCounters(post.id, { views: 3 })
    const nextSnapshot = await forumPrimary.readSnapshot({ sinceRev: 0 })
    expect(nextSnapshot.posts.find((row) => row.id === post.id)).toMatchObject({ text: 'hello', views: 3 })
  })

  test('user totals merge canonical and snapshot rows without double counting or ghost cards', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', description: 'D', userId: 'alice', nickname: 'Alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'alice', nickname: 'Alice' })

    await memoryDb.collection('forum_core_snapshot').updateOne(
      { _id: 'forum:snapshot' },
      {
        $set: {
          rev: 3,
          parsed: {
            rev: 3,
            payload: {
              topics: [topic, { id: 'legacy_topic', title: 'Legacy', userId: 'alice', ts: 2 }, { id: 'ghost_topic', views: 2 }],
              posts: [
                post,
                { id: 'legacy_post', topicId: topic.id, text: 'legacy', userId: 'alice', likes: 5, ts: 2 },
                { id: 'ghost_post', likes: 100 },
              ],
              banned: [],
            },
          },
        },
      },
      { upsert: true },
    )

    await expect(forumPrimary.getUserTotals('alice')).resolves.toMatchObject({
      postsTotal: 2,
      topicsTotal: 2,
      likesTotal: 5,
    })
  })

  test('user totals include linked Telegram/TMA aliases as one canonical account', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:telegram:777001' },
      {
        $set: {
          alias: 'telegram:777001',
          aliasId: 'telegram:777001',
          aliasValue: '777001',
          accountId: 'wallet:alice',
          canonicalAccountId: 'wallet:alice',
        },
      },
      { upsert: true },
    )

    const { topic: walletTopic } = await forumPrimary.createTopic({ title: 'Wallet topic', description: 'D', userId: 'wallet:alice', nickname: 'Alice' })
    const walletPost = await forumPrimary.createPost({ topicId: walletTopic.id, text: 'wallet post', userId: 'wallet:alice', nickname: 'Alice' })
    const { topic: tmaTopic } = await forumPrimary.createTopic({ title: 'TMA topic', description: 'D', userId: 'telegram:777001', nickname: 'Alice TMA' })
    await forumPrimary.createPost({ topicId: tmaTopic.id, text: 'tma post', userId: '777001', nickname: 'Alice TMA' })
    await forumPrimary.incrementPostCounters(walletPost.post.id, { likes: 3 })

    await expect(forumPrimary.getUserTotals('wallet:alice')).resolves.toMatchObject({
      postsTotal: 2,
      topicsTotal: 2,
      likesTotal: 3,
    })
  })

  test('updates views and reactions without Redis reaction sets', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', userId: 'alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'alice' })

    await expect(forumPrimary.incrementTopicViews(topic.id, 1)).resolves.toBe(1)
    await expect(forumPrimary.incrementPostViews(post.id, 1)).resolves.toBe(1)

    const liked = await forumPrimary.setPostReactionState({ postId: post.id, userId: 'bob', state: 'like' })
    expect(liked).toMatchObject({ likes: 1, dislikes: 0, changed: true, likeDelta: 1, authorId: 'alice' })
    const repeated = await forumPrimary.setPostReactionState({ postId: post.id, userId: 'bob', state: 'like' })
    expect(repeated).toMatchObject({ likes: 1, dislikes: 0, changed: false })
    const disliked = await forumPrimary.setPostReactionState({ postId: post.id, userId: 'bob', state: 'dislike' })
    expect(disliked).toMatchObject({ likes: 0, dislikes: 1, changed: true, likeDelta: -1 })
  })

  test('stores subscriptions and paginates people from Mongo', async () => {
    await expect(forumPrimary.toggleSubscription('viewer', 'author-a')).resolves.toMatchObject({ ok: true, subscribed: true, followersCount: 1, followingCount: 1 })
    await expect(forumPrimary.toggleSubscription('viewer', 'author-b')).resolves.toMatchObject({ ok: true, subscribed: true })
    await expect(forumPrimary.getSubscriptionCounts('viewer')).resolves.toMatchObject({ following: 2 })

    const page = await forumPrimary.listSubscriptionPeoplePage({ userId: 'viewer', mode: 'following', limit: 1 })
    expect(page.ids).toHaveLength(1)
    expect(page.hasMore).toBe(true)
    expect(page.nextCursor).toBe('1')
  })

  test('mirrors toggled subscriptions across linked aliases for reload-safe star state', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:telegram:777001' },
      {
        $set: {
          alias: 'telegram:777001',
          aliasId: 'telegram:777001',
          aliasValue: '777001',
          accountId: 'wallet:alice',
          canonicalAccountId: 'wallet:alice',
        },
      },
      { upsert: true },
    )
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:telegram:888002' },
      {
        $set: {
          alias: 'telegram:888002',
          aliasId: 'telegram:888002',
          aliasValue: '888002',
          accountId: 'wallet:bob',
          canonicalAccountId: 'wallet:bob',
        },
      },
      { upsert: true },
    )

    await expect(forumPrimary.toggleSubscription('wallet:alice', 'wallet:bob'))
      .resolves
      .toMatchObject({ ok: true, subscribed: true, followersCount: 1, followingCount: 1 })

    await expect(forumPrimary.listSubscriptions('telegram:777001')).resolves.toEqual(['wallet:bob'])
    await expect(forumPrimary.getSubscriptionCounts('telegram:888002')).resolves.toMatchObject({ followers: 1 })

    const page = await forumPrimary.listSubscriptionPeoplePage({ userId: 'telegram:777001', mode: 'following', limit: 10 })
    expect(page.ids).toEqual(['wallet:bob'])
    expect(memoryDb.collection('forum_subscription_sets').rows.has('viewer:telegram:777001')).toBe(true)
    expect(memoryDb.collection('forum_subscription_sets').rows.has('followers:telegram:888002')).toBe(true)
  })

  test('merges subscription counts and people pages across linked wallet and Telegram aliases', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:telegram:777001' },
      {
        $set: {
          alias: 'telegram:777001',
          aliasId: 'telegram:777001',
          aliasValue: '777001',
          accountId: 'wallet:alice',
          canonicalAccountId: 'wallet:alice',
        },
      },
      { upsert: true },
    )
    await memoryDb.collection('forum_subscription_sets').updateOne(
      { _id: 'followers:wallet:alice' },
      { $set: { members: ['bob'], rows: [{ member: 'bob', score: 20 }] } },
      { upsert: true },
    )
    await memoryDb.collection('forum_subscription_sets').updateOne(
      { _id: 'followers:telegram:777001' },
      { $set: { members: ['carol'], rows: [{ member: 'carol', score: 10 }] } },
      { upsert: true },
    )
    await memoryDb.collection('forum_subscription_sets').updateOne(
      { _id: 'viewer:777001' },
      { $set: { members: ['dave'] } },
      { upsert: true },
    )

    await expect(forumPrimary.getSubscriptionCounts('wallet:alice')).resolves.toMatchObject({
      followers: 2,
      following: 1,
    })
    const page = await forumPrimary.listSubscriptionPeoplePage({ userId: 'wallet:alice', mode: 'followers', limit: 10 })
    expect(page.ids).toEqual(['bob', 'carol'])
  })

  test('reads Quantum Family people from mixed-case wallet legacy subscription keys', async () => {
    const checksum = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'
    const lower = checksum.toLowerCase()

    await memoryDb.collection('forum_subscription_sets').updateOne(
      { _id: `followersZ:${checksum}` },
      { $set: { members: ['0xFriend'], rows: [{ member: '0xFriend', score: 30 }] } },
      { upsert: true },
    )
    await memoryDb.collection('forum_subscription_sets').updateOne(
      { _id: `followingZ:${checksum}` },
      { $set: { members: ['0xAuthor'], rows: [{ member: '0xAuthor', score: 20 }] } },
      { upsert: true },
    )

    await expect(forumPrimary.getSubscriptionCounts(lower)).resolves.toMatchObject({
      followers: 1,
      following: 1,
    })
    await expect(forumPrimary.listSubscriptionPeoplePage({ userId: lower, mode: 'followers', limit: 10 }))
      .resolves
      .toMatchObject({ ids: ['0xFriend'], totalCount: 1 })
  })

  test('blocks self-report when author and reporter are the same account through aliases', async () => {
    await memoryDb.collection('account_aliases').updateOne(
      { _id: 'alias:telegram:777001' },
      {
        $set: {
          alias: 'telegram:777001',
          aliasId: 'telegram:777001',
          aliasValue: '777001',
          accountId: 'wallet:alice',
          canonicalAccountId: 'wallet:alice',
        },
      },
      { upsert: true },
    )
    const { topic } = await forumPrimary.createTopic({ title: 'T', userId: 'wallet:alice' })
    const { post } = await forumPrimary.createPost({ topicId: topic.id, text: 'hello', userId: 'telegram:777001' })

    await expect(forumPrimary.reportPost({ postId: post.id, reporterId: 'wallet:alice', reason: 'boring' }))
      .rejects
      .toThrow('self_report')
  })

  test('deletes a post branch and removes it from snapshot state', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', userId: 'alice' })
    const root = await forumPrimary.createPost({ topicId: topic.id, text: 'root', userId: 'alice' })
    const child = await forumPrimary.createPost({ topicId: topic.id, parentId: root.post.id, text: 'child', userId: 'bob' })

    const result = await forumPrimary.deletePostBranchHard(root.post.id)
    expect(result.deleted).toEqual([root.post.id, child.post.id])
    await expect(forumPrimary.getTopic(topic.id)).resolves.toMatchObject({ postsCount: 0 })
    const snapshot = await forumPrimary.rebuildSnapshot()
    expect(snapshot.payload.posts).toHaveLength(0)
  })

  test('post branch deletion cleans projection rows and reconciles user stats idempotently', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', userId: 'alice' })
    const root = await forumPrimary.createPost({ topicId: topic.id, text: 'root', userId: 'alice' })
    const child = await forumPrimary.createPost({ topicId: topic.id, parentId: root.post.id, text: 'child', userId: 'bob' })
    for (const post of [root.post, child.post]) {
      await memoryDb.collection('forum_thread_index').updateOne(
        { postId: post.id },
        { $set: { _id: `thread:${post.id}`, postId: post.id, topicId: topic.id, parentId: post.parentId, canonicalAuthorId: post.userId, visibility: { deleted: false }, post } },
        { upsert: true },
      )
      await memoryDb.collection('forum_user_post_index').updateOne(
        { _id: `${post.userId}:${post.id}` },
        { $set: { _id: `${post.userId}:${post.id}`, postId: post.id, topicId: topic.id, canonicalAuthorId: post.userId, visibility: { deleted: false }, post } },
        { upsert: true },
      )
      await memoryDb.collection('forum_geo_feed_index').updateOne(
        { _id: `home:${post.id}` },
        { $set: { _id: `home:${post.id}`, postId: post.id, topicId: topic.id, canonicalAuthorId: post.userId, visibility: { deleted: false }, post } },
        { upsert: true },
      )
    }
    await memoryDb.collection('forum_reply_inbox_index').updateOne(
      { _id: `alice:${child.post.id}` },
      { $set: { _id: `alice:${child.post.id}`, recipientCanonicalId: 'alice', sourcePostId: child.post.id, postId: child.post.id, topicId: topic.id, parentId: root.post.id, visibility: { deleted: false }, post: child.post } },
      { upsert: true },
    )
    await memoryDb.collection('forum_user_stats').updateOne(
      { _id: 'alice' },
      { $set: { canonicalAuthorId: 'alice', stats: { posts: 1, topics: 1, likes: 0, repliesReceived: 1 } } },
      { upsert: true },
    )
    await memoryDb.collection('forum_user_stats').updateOne(
      { _id: 'bob' },
      { $set: { canonicalAuthorId: 'bob', stats: { posts: 1, topics: 0, likes: 0, repliesReceived: 0 } } },
      { upsert: true },
    )

    const result = await forumPrimary.deletePostBranchHard(root.post.id)
    expect(result.deletedPostIds).toEqual([root.post.id, child.post.id])
    expect(result.projectionCleanup.deleted).toBeGreaterThanOrEqual(7)
    await expect(memoryDb.collection('forum_thread_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_user_post_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_geo_feed_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_reply_inbox_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_user_stats').findOne({ _id: 'alice' })).resolves.toMatchObject({ stats: { posts: 0, topics: 1, likes: 0, repliesReceived: 0 } })
    await expect(memoryDb.collection('forum_user_stats').findOne({ _id: 'bob' })).resolves.toMatchObject({ stats: { posts: 0, topics: 0, likes: 0, repliesReceived: 0 } })

    const second = await forumPrimary.deletePostBranchHard(root.post.id)
    expect(second.alreadyDeleted).toBe(true)
    expect(second.deletedPostIds).toEqual([root.post.id])
  })

  test('repeat deletion cleans orphan descendants from non-thread projections', async () => {
    const rootId = 'gone-root'
    const childId = 'orphan-child'
    await memoryDb.collection('forum_user_post_index').updateOne(
      { _id: `alice:${childId}` },
      { $set: { _id: `alice:${childId}`, postId: childId, rootPostId: rootId, parentId: rootId, ancestorIds: [rootId], canonicalAuthorId: 'alice', visibility: { deleted: false }, post: { id: childId, postId: childId, rootPostId: rootId, parentId: rootId, ancestorIds: [rootId], userId: 'alice' } } },
      { upsert: true },
    )
    await memoryDb.collection('forum_media_feed_index').updateOne(
      { _id: `iframe:${childId}` },
      { $set: { _id: `iframe:${childId}`, postId: childId, rootPostId: rootId, parentId: rootId, ancestorIds: [rootId], canonicalAuthorId: 'alice', visibility: { deleted: false }, post: { id: childId, postId: childId, rootPostId: rootId, parentId: rootId, ancestorIds: [rootId], userId: 'alice' } } },
      { upsert: true },
    )
    await memoryDb.collection('forum_user_stats').updateOne(
      { _id: 'alice' },
      { $set: { canonicalAuthorId: 'alice', stats: { posts: 1, topics: 0, likes: 0, repliesReceived: 0 } } },
      { upsert: true },
    )

    const result = await forumPrimary.deletePostBranchHard(rootId)
    expect(result.alreadyDeleted).toBe(true)
    expect(result.deletedPostIds).toEqual([rootId, childId])
    await expect(memoryDb.collection('forum_user_post_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_media_feed_index').countDocuments({})).resolves.toBe(0)
    await expect(memoryDb.collection('forum_user_stats').findOne({ _id: 'alice' })).resolves.toMatchObject({ stats: { posts: 0, topics: 0, likes: 0, repliesReceived: 0 } })
  })

  test('report deletion converges through the same branch cleanup and boring threshold is 20', async () => {
    const { topic } = await forumPrimary.createTopic({ title: 'T', userId: 'owner' })
    const root = await forumPrimary.createPost({ topicId: topic.id, text: 'root', userId: 'owner' })
    await memoryDb.collection('forum_thread_index').updateOne(
      { postId: root.post.id },
      { $set: { _id: `thread:${root.post.id}`, postId: root.post.id, topicId: topic.id, canonicalAuthorId: 'owner', visibility: { deleted: false }, post: root.post } },
      { upsert: true },
    )

    for (let i = 1; i <= 19; i += 1) {
      const res = await forumPrimary.reportPost({ postId: root.post.id, reporterId: `reporter-${i}`, reason: 'boring' })
      expect(res.action).toBe('counted')
    }
    await expect(forumPrimary.getPost(root.post.id)).resolves.toMatchObject({ id: root.post.id })

    const deleted = await forumPrimary.reportPost({ postId: root.post.id, reporterId: 'reporter-20', reason: 'boring' })
    expect(deleted.action).toBe('deleted')
    expect(deleted.deletedPostIds).toEqual([root.post.id])
    await expect(memoryDb.collection('forum_thread_index').countDocuments({})).resolves.toBe(0)

    const converged = await forumPrimary.reportPost({ postId: root.post.id, reporterId: 'reporter-21', reason: 'boring' })
    expect(converged.alreadyDeleted).toBe(true)
    expect(converged.deletedPostIds).toEqual([root.post.id])
  })
})
