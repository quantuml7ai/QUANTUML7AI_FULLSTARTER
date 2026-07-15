import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pageReader = require('../../../lib/forum/forum-server-page-reader.cjs')
const profileGeoPrimary = require('../../../lib/mongo/profile-geo-primary.cjs')
const architecture = require('../../../lib/forum/ql7-forum-architecture.cjs')
const geoRings = require('../../../lib/geo/geo-rings.cjs')

function readPath(row, path) {
  return String(path || '').split('.').filter(Boolean).reduce((cursor, part) => (cursor && typeof cursor === 'object' ? cursor[part] : undefined), row)
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) {
      const values = Array.isArray(expected.$in) ? expected.$in : []
      return Array.isArray(actual) ? actual.some((item) => values.includes(item)) : values.includes(actual)
    }
    if ('$nin' in expected) {
      const values = Array.isArray(expected.$nin) ? expected.$nin : []
      return Array.isArray(actual) ? !actual.some((item) => values.includes(item)) : !values.includes(actual)
    }
    if ('$lt' in expected) return Number(actual) < Number(expected.$lt)
    if ('$gt' in expected) return Number(actual) > Number(expected.$gt)
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

function makePost({ id, scopeKeys, views, ts, reactions = 0 }) {
  return {
    _id: `home:${id}`,
    surface: 'home',
    postId: id,
    topicId: 'topic-1',
    canonicalAuthorId: 'author-1',
    geo: { scopeKeys },
    visibility: { deleted: false },
    sort: { new: ts, views, top: views, likes: reactions, reactions, replies: 0 },
    random: { key: id },
    post: { id, postId: id, topicId: 'topic-1', userId: 'author-1', nickname: 'Author', text: id, ts, views, likes: reactions, reactions },
    topic: { id: 'topic-1', topicId: 'topic-1', title: 'Topic' },
    ts,
  }
}

function fakeDb({ rows, mediaRows = null, profileGeo, coreTopics = [], corePosts = [] }) {
  return {
    collection(name) {
      if (name === 'forum_geo_feed_index') return collectionApi(rows)
      if (name === 'forum_media_feed_index') return collectionApi(mediaRows || rows)
      if (name === 'forum_core_posts') return collectionApi(corePosts)
      if (name === 'forum_core_topics') return collectionApi(coreTopics)
      if (name === 'profiles') return collectionApi(profileGeo ? [{ _id: 'profile:viewer', accountId: 'viewer', _geoCurrent: profileGeo }] : [])
      return collectionApi([])
    },
  }
}

describe('forum server feed geo rings', () => {
  const previousCursorSecret = process.env.QL7_FORUM_CURSOR_SECRET

  beforeEach(() => {
    process.env.QL7_FORUM_CURSOR_SECRET = 'unit-test-forum-cursor-secret-32-bytes-minimum'
  })

  afterEach(() => {
    pageReader.__setTestDb(null)
    profileGeoPrimary.__setTestDb(null)
    if (previousCursorSecret == null) delete process.env.QL7_FORUM_CURSOR_SECRET
    else process.env.QL7_FORUM_CURSOR_SECRET = previousCursorSecret
  })

  test('forum mode contract keeps random as sort, not world mode', () => {
    expect(architecture.assertForumArchitecture()).toBe(true)
    expect(architecture.normalizeForumMode('random')).toBe('geo')
    expect(geoRings.normalizeGeoMode('random')).toBe('geo')
    expect(geoRings.normalizeGeoMode('world')).toBe('world')
    expect(architecture.FORUM_ARCHITECTURE.geo.rings).toEqual(['city', 'region', 'country', 'global'])
  })

  test('profile fallback geo keeps city ring above higher-scored global posts', async () => {
    const profileGeo = {
      known: true,
      country: 'UA',
      region: '51',
      city: 'Odesa',
      precision: 'city',
      geoKey: 'city:ua:51:odesa',
      scopes: {
        cityKey: 'city:ua:51:odesa',
        regionKey: 'region:ua:51',
        countryKey: 'country:ua',
        globalKey: 'global',
      },
    }
    const rows = [
      makePost({ id: 'global', scopeKeys: ['global'], views: 10000, ts: 4 }),
      makePost({ id: 'country', scopeKeys: ['country:ua', 'global'], views: 9000, ts: 3 }),
      makePost({ id: 'region', scopeKeys: ['region:ua:51', 'country:ua', 'global'], views: 8000, ts: 2 }),
      makePost({ id: 'city', scopeKeys: ['city:ua:51:odesa', 'region:ua:51', 'country:ua', 'global'], views: 1, ts: 1 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 4 } })

    expect(page.ok).toBe(true)
    expect(page.mode).toBe('geo')
    expect(page.sort).toBe('views')
    expect(page.effectiveViewerGeoSource).toBe('profile_fallback')
    expect(page.geoRingPriority).toBe(true)
    expect(page.items.map((item) => item.postId)).toEqual(['city', 'region', 'country', 'global'])
  })

  test('live trusted geo wins over profile fallback', async () => {
    const profileGeo = {
      known: true,
      country: 'UA',
      region: '51',
      city: 'Odesa',
      precision: 'city',
      geoKey: 'city:ua:51:odesa',
    }
    const rows = [
      makePost({ id: 'odesa', scopeKeys: ['city:ua:51:odesa', 'region:ua:51', 'country:ua', 'global'], views: 100, ts: 1 }),
      makePost({ id: 'paris', scopeKeys: ['city:fr:idf:paris', 'region:fr:idf', 'country:fr', 'global'], views: 1, ts: 2 }),
      makePost({ id: 'global', scopeKeys: ['global'], views: 10000, ts: 3 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const request = new Request('http://localhost/api/forum/feed/page', {
      headers: {
        'x-vercel-ip-country': 'FR',
        'x-vercel-ip-country-region': 'IDF',
        'x-vercel-ip-city': 'Paris',
      },
    })
    const page = await pageReader.readForumFeedPage({ request, input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 3 } })

    expect(page.effectiveViewerGeoSource).toBe('live_request')
    expect(page.viewerGeo.geoKey).toBe('city:fr:idf:paris')
    expect(page.items.map((item) => item.postId)).toEqual(['paris', 'global', 'odesa'])
  })

  test('city ring accepts old underscore region city keys for the same country and city', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const rows = [
      makePost({ id: 'global-hot', scopeKeys: ['global'], views: 10000, ts: 2 }),
      makePost({ id: 'paris-old-key', scopeKeys: ['city:fr:_:paris', 'country:fr', 'global'], views: 1, ts: 1 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 2 } })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.postId)).toEqual(['paris-old-key', 'global-hot'])
    expect(page.rings[0]).toEqual(expect.objectContaining({ level: 'city', returned: 1 }))
  })

  test('reactions sort uses reaction totals inside each geo ring without changing ring order', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const rows = [
      makePost({ id: 'global-high-reactions', scopeKeys: ['global'], views: 10, reactions: 999, ts: 3 }),
      makePost({ id: 'paris-low-reactions', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 10, reactions: 2, ts: 1 }),
      makePost({ id: 'paris-high-reactions', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 10, reactions: 7, ts: 2 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'reactions', accountId: 'viewer', pageSize: 3 } })

    expect(page.ok).toBe(true)
    expect(page.sort).toBe('reactions')
    expect(page.items.map((item) => item.postId)).toEqual(['paris-high-reactions', 'paris-low-reactions', 'global-high-reactions'])
  })

  test('world mode disables ring priority', async () => {
    const profileGeo = {
      known: true,
      country: 'UA',
      region: '51',
      city: 'Odesa',
      precision: 'city',
      geoKey: 'city:ua:51:odesa',
    }
    const rows = [
      makePost({ id: 'global', scopeKeys: ['global'], views: 10000, ts: 2 }),
      makePost({ id: 'city', scopeKeys: ['city:ua:51:odesa', 'region:ua:51', 'country:ua', 'global'], views: 1, ts: 1 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'world', sort: 'views', accountId: 'viewer', pageSize: 2 } })

    expect(page.mode).toBe('world')
    expect(page.geoRingPriority).toBeFalsy()
    expect(page.items.map((item) => item.postId)).toEqual(['global', 'city'])
  })

  test('feed rows hydrate embedded topic counters from core topics before reaching the client', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const row = makePost({ id: 'post-1', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 1, ts: 1 })
    row.topic = { id: 'topic-1', topicId: 'topic-1', title: 'Partial', views: 1, postsCount: 1, likes: 0 }
    const db = fakeDb({
      rows: [row],
      profileGeo,
      coreTopics: [
        { _id: 'topic:topic-1', id: 'topic-1', topicId: 'topic-1', title: 'Canonical', views: 10000, postsCount: 32, reactions: 20 },
      ],
      corePosts: [
        { _id: 'post:partial-topic-1', id: 'partial-topic-1', postId: 'partial-topic-1', topicId: 'topic-1', views: 9, reactions: 1 },
      ],
    })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 1 } })

    expect(page.ok).toBe(true)
    expect(page.items[0].topic).toEqual(
      expect.objectContaining({
        id: 'topic-1',
        views: 10000,
        postsCount: 32,
        likes: 20,
        reactions: 20,
        __ql7TopicCountersCoreHydrated: true,
        __ql7CounterSource: 'forum_core_topics',
      }),
    )
    expect(page.items[0].topic.__ql7CounterSource).not.toBe('topic_post_totals')
  })

  test('feed rows repair stale-low core topic counters from full canonical post totals only inside embedded topic', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const row = makePost({ id: 'post-1', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 1, ts: 1 })
    row.topic = { id: 'topic-1', topicId: 'topic-1', title: 'Stale Low', views: 1, postsCount: 1, likes: 1 }
    const db = fakeDb({
      rows: [row],
      profileGeo,
      coreTopics: [
        { _id: 'topic:topic-1', id: 'topic-1', topicId: 'topic-1', title: 'Core Low', views: 100, postsCount: 1, reactions: 2 },
      ],
      corePosts: [
        { _id: 'post:topic-post-1', id: 'topic-post-1', postId: 'topic-post-1', topicId: 'topic-1', views: 5000, reactions: 10, dislikes: 2 },
        { _id: 'post:topic-post-2', id: 'topic-post-2', postId: 'topic-post-2', topicId: 'topic-1', views: 4500, likes: 3, dislikes: 1 },
      ],
    })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 1 } })

    expect(page.ok).toBe(true)
    expect(page.items[0].topic).toEqual(expect.objectContaining({
      id: 'topic-1',
      views: 9500,
      postsCount: 2,
      likes: 14,
      reactions: 14,
      dislikes: 3,
      __ql7TopicCountersCoreHydrated: true,
      __ql7TopicCountersPostTotalsHydrated: true,
      __ql7CounterSource: 'forum_core_topics',
    }))
    expect(page.items[0]).toEqual(expect.objectContaining({
      sort: expect.objectContaining({ views: 1, replies: 0, likes: 0 }),
    }))
    expect(Number(page.items[0].counters?.views || 0)).not.toBe(9500)
    expect(Number(page.items[0].sort?.views || 0)).not.toBe(9500)
  })

  test('feed rows hydrate embedded topic totals from all canonical posts', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const row = makePost({ id: 'post-1', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 1, ts: 1 })
    row.topic = { id: 'topic-1', topicId: 'topic-1', title: 'Stale inflated topic', views: 9999, postsCount: 99, reactions: 99 }
    const db = fakeDb({
      rows: [row],
      profileGeo,
      corePosts: [
        { _id: 'post:topic-post-1', id: 'topic-post-1', postId: 'topic-post-1', topicId: 'topic-1', views: 3000, reactions: 7, dislikes: 1 },
        { _id: 'post:topic-post-2', id: 'topic-post-2', postId: 'topic-post-2', topicId: 'topic-1', views: 2000, likes: 4, dislikes: 2 },
      ],
    })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 1 } })

    expect(page.ok).toBe(true)
    expect(page.items[0].topic).toEqual(
      expect.objectContaining({
        id: 'topic-1',
        views: 5000,
        postsCount: 2,
        likes: 13,
        reactions: 13,
        dislikes: 3,
        __ql7TopicCountersPostTotalsHydrated: true,
        __ql7CounterSource: 'topic_post_totals',
      }),
    )
    expect(page.items[0]).toEqual(expect.objectContaining({
      sort: expect.objectContaining({ views: 1, replies: 0, likes: 0 }),
    }))
    expect(page.items[0].post).toEqual(expect.objectContaining({
      views: 1,
    }))
    expect(Number(page.items[0].counters?.views || 0)).not.toBe(5000)
    expect(Number(page.items[0].counters?.reactions || 0)).not.toBe(13)
    expect(Number(page.items[0].sort?.views || 0)).not.toBe(5000)
    expect(Number(page.items[0].sort?.likes || 0)).not.toBe(13)
    expect(page.items[0].__ql7CounterSource).not.toBe('topic_post_totals')
  })

  test('feed rows hydrate canonical post reply counters from core posts before reaching the client', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const row = makePost({ id: 'post-1', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 1, ts: 1 })
    row.post.replyCount = 10
    row.sort.replies = 10
    const db = fakeDb({
      rows: [row],
      profileGeo,
      corePosts: [
        { _id: 'post:post-1', id: 'post-1', postId: 'post-1', topicId: 'topic-1', replyCount: 23, views: 50, reactions: 7 },
      ],
    })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'replies', accountId: 'viewer', pageSize: 1 } })

    expect(page.ok).toBe(true)
    expect(page.items[0].post).toEqual(expect.objectContaining({
      replyCount: 23,
      repliesCount: 23,
      commentsCount: 23,
      views: 50,
      reactions: 7,
    }))
    expect(page.items[0].sort).toEqual(expect.objectContaining({ replies: 23, views: 50, likes: 7 }))
    expect(page.items[0].counters).toEqual(expect.objectContaining({ replies: 23, views: 50, reactions: 7 }))
  })

  test('canonical post counters override stale inflated projection counters', async () => {
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const row = makePost({ id: 'post-1', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 9000, ts: 1 })
    row.post.views = 9000
    row.post.reactions = 50
    row.post.replyCount = 18
    row.counters = { ...(row.counters || {}), views: 9000, reactions: 50, replyCount: 18, replies: 18 }
    row.sort = { ...(row.sort || {}), views: 9000, likes: 50, reactions: 50, replies: 18 }
    const db = fakeDb({
      rows: [row],
      profileGeo,
      corePosts: [
        { _id: 'post:post-1', id: 'post-1', postId: 'post-1', topicId: 'topic-1', views: 29, likes: 4, replyCount: 1 },
      ],
    })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumFeedPage({ input: { mode: 'geo', sort: 'views', accountId: 'viewer', pageSize: 1 } })

    expect(page.ok).toBe(true)
    expect(page.items[0].post).toEqual(expect.objectContaining({
      views: 29,
      likes: 4,
      reactions: 4,
      replyCount: 1,
      repliesCount: 1,
    }))
    expect(page.items[0].counters).toEqual(expect.objectContaining({
      views: 29,
      reactions: 4,
      replies: 1,
    }))
    expect(page.items[0].sort).toEqual(expect.objectContaining({
      views: 29,
      likes: 4,
      replies: 1,
    }))
  })

  test('random geo feed returns a cursor and excludes already seen ids on the next page', async () => {
    process.env.QL7_FORUM_CURSOR_SECRET = 'unit-test-forum-cursor-secret-32-bytes-minimum'
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const rows = [
      makePost({ id: 'paris-1', scopeKeys: ['city:fr:idf:paris', 'region:fr:idf', 'country:fr', 'global'], views: 1, ts: 1 }),
      makePost({ id: 'paris-2', scopeKeys: ['city:fr:idf:paris', 'region:fr:idf', 'country:fr', 'global'], views: 1, ts: 2 }),
      makePost({ id: 'paris-3', scopeKeys: ['city:fr:idf:paris', 'region:fr:idf', 'country:fr', 'global'], views: 1, ts: 3 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const first = await pageReader.readForumFeedPage({
      input: { mode: 'geo', sort: 'random', seed: 'stable-seed', accountId: 'viewer', pageSize: 1 },
    })
    const second = await pageReader.readForumFeedPage({
      input: { mode: 'geo', sort: 'random', seed: 'stable-seed', accountId: 'viewer', pageSize: 1, cursor: first.nextCursor },
    })

    expect(first.ok).toBe(true)
    expect(first.nextCursor).toBeTruthy()
    expect(second.ok).toBe(true)
    expect(second.items).toHaveLength(1)
    expect(second.items[0].postId).not.toBe(first.items[0].postId)
  })

  test('geo cursor advances to the next ring when a page exactly exhausts the current ring', async () => {
    process.env.QL7_FORUM_CURSOR_SECRET = 'unit-test-forum-cursor-secret-32-bytes-minimum'
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const rows = [
      makePost({ id: 'paris-only', scopeKeys: ['city:fr:idf:paris', 'region:fr:idf', 'country:fr', 'global'], views: 1, ts: 1 }),
      makePost({ id: 'fr-country', scopeKeys: ['country:fr', 'global'], views: 999, ts: 2 }),
    ]
    const db = fakeDb({ rows, profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const first = await pageReader.readForumFeedPage({
      input: { mode: 'geo', sort: 'views', seed: 'ring-advance-seed', accountId: 'viewer', pageSize: 1 },
    })
    const second = await pageReader.readForumFeedPage({
      input: { mode: 'geo', sort: 'views', seed: 'ring-advance-seed', accountId: 'viewer', pageSize: 1, cursor: first.nextCursor },
    })

    expect(first.ok).toBe(true)
    expect(first.items.map((item) => item.postId)).toEqual(['paris-only'])
    expect(first.items[0].geoRank).toEqual({ ringIndex: 0 })
    expect(first.nextCursor).toBeTruthy()
    expect(second.ok).toBe(true)
    expect(second.items.map((item) => item.postId)).toEqual(['fr-country'])
    expect(second.items[0].geoRank).toEqual({ ringIndex: 2 })
  })

  test('media feed all mode includes image and video rows in the same geo cursor contour', async () => {
    process.env.QL7_FORUM_CURSOR_SECRET = 'unit-test-forum-cursor-secret-32-bytes-minimum'
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const image = makePost({ id: 'paris-image', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 5, ts: 1 })
    image.mediaKind = 'image'
    image.media = { kind: 'image', url: 'https://cdn.example/paris.webp' }
    const video = makePost({ id: 'paris-video', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 4, ts: 2 })
    video.mediaKind = 'video'
    video.media = { kind: 'video', url: 'https://cdn.example/paris.mp4' }
    const db = fakeDb({ rows: [], mediaRows: [image, video], profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumMediaFeedPage({
      input: { mode: 'geo', mediaKind: 'all', sort: 'views', accountId: 'viewer', pageSize: 2 },
    })

    expect(page.ok).toBe(true)
    expect(page.mediaKind).toBe('all')
    expect(page.items.map((item) => item.postId)).toEqual(['paris-image', 'paris-video'])
    expect(page.items.map((item) => item.media?.kind)).toEqual(['image', 'video'])
  })

  test('media feed all mode keeps external embed posts from the geo projection', async () => {
    process.env.QL7_FORUM_CURSOR_SECRET = 'unit-test-forum-cursor-secret-32-bytes-minimum'
    const profileGeo = {
      known: true,
      country: 'FR',
      region: 'IDF',
      city: 'Paris',
      precision: 'city',
      geoKey: 'city:fr:idf:paris',
      scopes: {
        cityKey: 'city:fr:idf:paris',
        regionKey: 'region:fr:idf',
        countryKey: 'country:fr',
        globalKey: 'global',
      },
    }
    const indexedImage = makePost({ id: 'paris-image', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 5, ts: 1 })
    indexedImage.mediaKind = 'image'
    indexedImage.media = { kind: 'image', url: 'https://cdn.example/paris.webp' }
    const youtubePost = makePost({ id: 'paris-youtube', scopeKeys: ['city:fr:idf:paris', 'country:fr', 'global'], views: 9, ts: 2 })
    youtubePost.post.text = 'https://www.youtube.com/watch?si=abc&v=abcDEF12345'
    const db = fakeDb({ rows: [youtubePost], mediaRows: [indexedImage], profileGeo })
    pageReader.__setTestDb(db)
    profileGeoPrimary.__setTestDb(db)

    const page = await pageReader.readForumMediaFeedPage({
      input: { mode: 'geo', mediaKind: 'all', sort: 'views', accountId: 'viewer', pageSize: 2 },
    })

    expect(page.ok).toBe(true)
    expect(page.items.map((item) => item.postId)).toEqual(['paris-youtube', 'paris-image'])
    expect(page.items[0].post.text).toContain('youtube.com/watch')
  })
})
