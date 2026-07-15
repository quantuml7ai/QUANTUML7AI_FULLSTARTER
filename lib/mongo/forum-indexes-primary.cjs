// QL7_GEO111_FORUM_SERVER_INDEXES_V1
// Mongo index and bounded query-shape foundation for the stationary server forum contour.
// This module does not mutate MongoDB on import. Index creation is explicit only.

const { FORUM_ARCHITECTURE } = require('../forum/ql7-forum-architecture.cjs')

const FORUM_INDEX_COLLECTIONS = Object.freeze({
  geoFeed: 'forum_geo_feed_index',
  search: 'forum_search_index',
  thread: 'forum_thread_index',
  replyInbox: 'forum_reply_inbox_index',
  userPost: 'forum_user_post_index',
  userTopic: 'forum_user_topic_index',
  userStats: 'forum_user_stats',
  mediaFeed: 'forum_media_feed_index',
})

const SORT_FIELDS = Object.freeze({
  new: 'sort.new',
  top: 'sort.top',
  likes: 'sort.likes',
  reactions: 'sort.likes',
  views: 'sort.views',
  replies: 'sort.replies',
  relevance: 'sort.relevance',
})

const ID_FIELDS = Object.freeze({
  feed: 'postId',
  search: 'entityId',
  thread: 'postId',
  inbox: 'postId',
  userPosts: 'postId',
  userTopics: 'topicId',
  media: 'postId',
})

const PAGE_LIMITS = Object.freeze({
  feed: { default: FORUM_ARCHITECTURE.page.feed, max: FORUM_ARCHITECTURE.page.feedMax },
  search: { default: FORUM_ARCHITECTURE.page.search, max: FORUM_ARCHITECTURE.page.searchMax },
  thread: { default: FORUM_ARCHITECTURE.page.thread, max: FORUM_ARCHITECTURE.page.threadMax },
  inbox: { default: FORUM_ARCHITECTURE.page.inbox, max: FORUM_ARCHITECTURE.page.inboxMax },
  userPosts: { default: FORUM_ARCHITECTURE.page.userPosts, max: FORUM_ARCHITECTURE.page.threadMax },
  userTopics: { default: FORUM_ARCHITECTURE.page.userTopics, max: FORUM_ARCHITECTURE.page.threadMax },
  media: { default: FORUM_ARCHITECTURE.page.media, max: FORUM_ARCHITECTURE.page.mediaMax },
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function randomBucketFilter(value) {
  const buckets = Math.max(1, Math.floor(num(FORUM_ARCHITECTURE?.feed?.randomBuckets, 1024)) || 1024)
  const start = ((Math.floor(num(value, 0)) % buckets) + buckets) % buckets
  return { $in: Array.from({ length: buckets }, (_, offset) => (start + offset) % buckets) }
}

function boolDeletedFilter() {
  return { 'visibility.deleted': false }
}

function indexSpec(collection, key, options = {}) {
  return Object.freeze({
    collection,
    key: Object.freeze({ ...key }),
    options: Object.freeze({ ...options }),
  })
}

const FORUM_INDEX_SPECS = Object.freeze([
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_geo_feed_scope_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.top': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_geo_feed_scope_top_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.likes': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_geo_feed_scope_likes_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.views': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_geo_feed_scope_views_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.replies': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_geo_feed_scope_replies_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { surface: 1, mode: 1, 'random.bucket': 1, 'random.key': 1, postId: 1 }, { name: 'ql7_geo_feed_random_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.geoFeed, { topicId: 1, postId: 1 }, { name: 'ql7_geo_feed_topic_lookup_v1' }),

  indexSpec(FORUM_INDEX_COLLECTIONS.search, { kind: 1, 'text.tokens': 1, 'visibility.deleted': 1, 'sort.relevance': -1, 'sort.new': -1, entityId: 1 }, { name: 'ql7_search_tokens_relevance_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.search, { kind: 1, 'text.qHash': 1, 'visibility.deleted': 1, 'sort.new': -1, entityId: 1 }, { name: 'ql7_search_qhash_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.search, { kind: 1, canonicalAuthorId: 1, 'visibility.deleted': 1, 'sort.new': -1, entityId: 1 }, { name: 'ql7_search_author_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.search, { topicId: 1, kind: 1, entityId: 1 }, { name: 'ql7_search_topic_lookup_v1' }),

  indexSpec(FORUM_INDEX_COLLECTIONS.thread, { postId: 1 }, { name: 'ql7_thread_post_lookup_v1', unique: true, sparse: true }),
  indexSpec(FORUM_INDEX_COLLECTIONS.thread, { topicId: 1, parentId: 1, 'visibility.deleted': 1, 'sort.new': 1, postId: 1 }, { name: 'ql7_thread_children_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.thread, { topicId: 1, rootPostId: 1, depth: 1, path: 1, postId: 1 }, { name: 'ql7_thread_branch_path_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.thread, { topicId: 1, ancestorIds: 1, 'sort.new': 1, postId: 1 }, { name: 'ql7_thread_ancestors_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.thread, { canonicalAuthorId: 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_thread_author_new_v1' }),

  indexSpec(FORUM_INDEX_COLLECTIONS.replyInbox, { recipientCanonicalId: 1, 'visibility.deleted': 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_reply_inbox_recipient_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.replyInbox, { recipientCanonicalId: 1, unread: 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_reply_inbox_unread_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.replyInbox, { sourcePostId: 1, recipientCanonicalId: 1 }, { name: 'ql7_reply_inbox_source_v1', unique: true, sparse: true }),

  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { canonicalAuthorId: 1, 'visibility.deleted': 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_user_post_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { canonicalAuthorId: 1, 'sort.top': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_user_post_top_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { canonicalAuthorId: 1, 'sort.likes': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_user_post_likes_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { canonicalAuthorId: 1, 'sort.views': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_user_post_views_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { canonicalAuthorId: 1, 'sort.replies': -1, 'sort.new': -1, postId: 1 }, { name: 'ql7_user_post_replies_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userPost, { postId: 1 }, { name: 'ql7_user_post_lookup_v1', unique: true, sparse: true }),

  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { canonicalAuthorId: 1, 'visibility.deleted': 1, 'sort.new': -1, topicId: 1 }, { name: 'ql7_user_topic_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { canonicalAuthorId: 1, 'sort.top': -1, 'sort.new': -1, topicId: 1 }, { name: 'ql7_user_topic_top_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { canonicalAuthorId: 1, 'sort.likes': -1, 'sort.new': -1, topicId: 1 }, { name: 'ql7_user_topic_likes_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { canonicalAuthorId: 1, 'sort.views': -1, 'sort.new': -1, topicId: 1 }, { name: 'ql7_user_topic_views_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { canonicalAuthorId: 1, 'sort.replies': -1, 'sort.new': -1, topicId: 1 }, { name: 'ql7_user_topic_replies_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userTopic, { topicId: 1 }, { name: 'ql7_user_topic_lookup_v1', unique: true, sparse: true }),

  indexSpec(FORUM_INDEX_COLLECTIONS.userStats, { canonicalAuthorId: 1 }, { name: 'ql7_user_stats_author_v1', unique: true, sparse: true }),
  indexSpec(FORUM_INDEX_COLLECTIONS.userStats, { updatedAt: -1, canonicalAuthorId: 1 }, { name: 'ql7_user_stats_updated_v1' }),

  indexSpec(FORUM_INDEX_COLLECTIONS.mediaFeed, { mediaKind: 1, 'visibility.deleted': 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_media_feed_kind_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.mediaFeed, { mediaKind: 1, 'random.bucket': 1, 'random.key': 1, postId: 1 }, { name: 'ql7_media_feed_random_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.mediaFeed, { canonicalAuthorId: 1, mediaKind: 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_media_feed_author_kind_new_v1' }),
  indexSpec(FORUM_INDEX_COLLECTIONS.mediaFeed, { mediaKind: 1, 'geo.scopeKeys': 1, 'visibility.deleted': 1, 'sort.new': -1, postId: 1 }, { name: 'ql7_media_feed_geo_kind_new_v1' }),
])

function getForumIndexSpecs() {
  return FORUM_INDEX_SPECS.map((spec) => clone(spec))
}

function getSpecsByCollection() {
  const grouped = {}
  for (const spec of FORUM_INDEX_SPECS) {
    if (!grouped[spec.collection]) grouped[spec.collection] = []
    grouped[spec.collection].push(clone(spec))
  }
  return grouped
}

async function resolveMongoDatabase(explicitDatabase) {
  if (explicitDatabase && typeof explicitDatabase.collection === 'function') return explicitDatabase
  const { getMongoDb } = require('./client.cjs')
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  return database
}

async function ensureForumServerIndexes(explicitDatabase) {
  const database = await resolveMongoDatabase(explicitDatabase)
  const results = []
  for (const spec of FORUM_INDEX_SPECS) {
    const collection = database.collection(spec.collection)
    const options = { ...spec.options }
    if (!options.name) throw new Error('forum_index_name_missing:' + spec.collection)
    try {
      const name = await collection.createIndex(spec.key, options)
      results.push({ ok: true, collection: spec.collection, name, key: clone(spec.key), unique: Boolean(options.unique), sparse: Boolean(options.sparse) })
    } catch (error) {
      results.push({ ok: false, collection: spec.collection, name: options.name, key: clone(spec.key), code: error?.codeName || error?.code || null, message: String(error?.message || error) })
    }
  }
  const failed = results.filter((item) => !item.ok)
  return {
    ok: failed.length === 0,
    kind: 'ql7-forum-server-indexes-ensure',
    collections: Object.keys(getSpecsByCollection()).length,
    indexSpecs: FORUM_INDEX_SPECS.length,
    createdOrVerified: results.filter((item) => item.ok).length,
    failed: failed.length,
    results,
    safety: {
      documentsInserted: false,
      documentsUpdated: false,
      forumDataMutated: false,
      indexesOnly: true,
    },
  }
}

function clampPageSize(surface, requested) {
  const limits = PAGE_LIMITS[surface]
  if (!limits) throw new Error('forum_page_surface_invalid:' + surface)
  const fallback = limits.default
  const value = Math.floor(num(requested, fallback))
  return Math.max(1, Math.min(limits.max, value || fallback))
}

function normalizeSort(sort, allowRelevance = false) {
  const raw = str(sort || 'new').toLowerCase()
  if (allowRelevance && raw === 'relevance') return 'relevance'
  return FORUM_ARCHITECTURE.feed.sortValues.includes(raw) ? raw : 'new'
}

function sortIndexKey(sort) {
  const normalized = normalizeSort(sort, sort === 'relevance')
  return normalized === 'reactions' ? 'likes' : normalized
}

function normalizeUserBranchSort(sort) {
  const normalized = normalizeSort(sort)
  if (normalized === 'random') return 'new'
  return normalized === 'reactions' ? 'likes' : normalized
}

function sortObject(sort, idField) {
  const normalized = normalizeSort(sort, sort === 'relevance')
  const key = sortIndexKey(normalized)
  const field = SORT_FIELDS[key] || SORT_FIELDS.new
  if (key === 'new') return { [field]: -1, [idField]: 1 }
  return { [field]: -1, 'sort.new': -1, [idField]: 1 }
}

function cursorFilter(sort, cursor, idField, direction = -1) {
  const after = cursor && typeof cursor === 'object' ? cursor.after : null
  if (!after || typeof after !== 'object') return {}
  const normalized = normalizeSort(sort, sort === 'relevance')
  const field = SORT_FIELDS[sortIndexKey(normalized)] || SORT_FIELDS.new
  const value = after.value ?? after.ts ?? null
  const id = str(after.id || after[idField])
  if (value == null || !id) return {}
  if (Number(direction) >= 0) return { $or: [{ [field]: { $gt: value } }, { [field]: value, [idField]: { $gt: id } }] }
  return { $or: [{ [field]: { $lt: value } }, { [field]: value, [idField]: { $gt: id } }] }
}

function mergeQuery(...parts) {
  const clean = parts.filter((part) => part && typeof part === 'object' && Object.keys(part).length)
  if (!clean.length) return {}
  if (clean.length === 1) return clean[0]
  return { $and: clean }
}

function safeGeoScopes(geoPlan) {
  const rings = Array.isArray(geoPlan?.rings) ? geoPlan.rings : []
  const keys = rings.map((item) => str(item?.key)).filter(Boolean)
  if (!keys.includes('global')) keys.push('global')
  return Array.from(new Set(keys)).slice(0, 8)
}

function buildFeedPagePlan(input = {}) {
  const rawMode = str(input.mode || 'geo').toLowerCase()
  const mode = rawMode === 'world' || rawMode === 'global' || rawMode === 'off' ? 'world' : 'geo'
  const sort = normalizeSort(input.sort)
  const pageSize = clampPageSize('feed', input.pageSize)
  const idField = ID_FIELDS.feed
  const surface = str(input.surface || 'home') || 'home'
  if (sort === 'random') {
    return {
      collection: FORUM_INDEX_COLLECTIONS.geoFeed,
      query: mergeQuery({ surface, ...(mode === 'geo' ? { mode: 'geo', 'geo.scopeKeys': { $in: safeGeoScopes(input.geoPlan) } } : {}), 'random.bucket': randomBucketFilter(input.randomBucket) }, boolDeletedFilter()),
      sort: { 'random.key': 1, [idField]: 1 },
      limit: pageSize,
      hint: 'ql7_geo_feed_random_v1',
      cursorDomain: 'forum-feed-v1',
    }
  }
  return {
    collection: FORUM_INDEX_COLLECTIONS.geoFeed,
    query: mergeQuery({ surface }, mode === 'geo' ? { 'geo.scopeKeys': { $in: safeGeoScopes(input.geoPlan) } } : {}, boolDeletedFilter(), cursorFilter(sort, input.cursor, idField)),
    sort: sortObject(sort, idField),
    limit: pageSize,
    hint: mode === 'geo' ? 'ql7_geo_feed_scope_' + sortIndexKey(sort) + '_v1' : null,
    cursorDomain: 'forum-feed-v1',
  }
}

function buildSearchPagePlan(input = {}) {
  const q = str(input.q).slice(0, FORUM_ARCHITECTURE.search.maxQueryLength)
  const mode = str(input.mode || 'all') || 'all'
  const kind = ['posts', 'topics', 'people'].includes(mode) ? mode.replace(/s$/, '') : null
  const sort = normalizeSort(input.sort || 'relevance', true)
  const pageSize = clampPageSize('search', input.pageSize)
  const idField = ID_FIELDS.search
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8)
  const token = tokens[0] || '__empty__'
  return {
    collection: FORUM_INDEX_COLLECTIONS.search,
    query: mergeQuery(kind ? { kind } : {}, { 'text.tokens': token }, boolDeletedFilter(), cursorFilter(sort, input.cursor, idField)),
    sort: sortObject(sort, idField),
    limit: pageSize,
    hint: sort === 'relevance' ? 'ql7_search_tokens_relevance_v1' : 'ql7_search_qhash_new_v1',
    cursorDomain: 'forum-search-v1',
  }
}

function buildThreadPagePlan(input = {}) {
  const mode = str(input.mode || 'children') || 'children'
  const pageSize = clampPageSize('thread', input.pageSize)
  const idField = ID_FIELDS.thread
  const topicId = str(input.topicId)
  const rootPostId = str(input.rootPostId)
  const parentId = str(input.parentId)
  if (mode === 'topic_roots') {
    return {
      collection: FORUM_INDEX_COLLECTIONS.thread,
      query: mergeQuery({ topicId, parentId: null }, boolDeletedFilter(), cursorFilter('new', input.cursor, idField, 1)),
      sort: { 'sort.new': 1, [idField]: 1 },
      limit: pageSize,
      hint: 'ql7_thread_children_new_v1',
      cursorDomain: 'forum-thread-v1',
    }
  }
  if (mode === 'branch') {
    return {
      collection: FORUM_INDEX_COLLECTIONS.thread,
      query: mergeQuery({ topicId, rootPostId }, boolDeletedFilter()),
      sort: { depth: 1, path: 1, [idField]: 1 },
      limit: pageSize,
      hint: 'ql7_thread_branch_path_v1',
      cursorDomain: 'forum-thread-v1',
    }
  }
  return {
    collection: FORUM_INDEX_COLLECTIONS.thread,
    query: mergeQuery({ topicId, parentId }, boolDeletedFilter(), cursorFilter('new', input.cursor, idField, 1)),
    sort: { 'sort.new': 1, [idField]: 1 },
    limit: pageSize,
    hint: 'ql7_thread_children_new_v1',
    cursorDomain: 'forum-thread-v1',
  }
}

function buildInboxRepliesPlan(input = {}) {
  const idField = ID_FIELDS.inbox
  return {
    collection: FORUM_INDEX_COLLECTIONS.replyInbox,
    query: mergeQuery({ recipientCanonicalId: str(input.userId || input.canonicalAccountId) }, boolDeletedFilter(), cursorFilter('new', input.cursor, idField)),
    sort: sortObject('new', idField),
    limit: clampPageSize('inbox', input.pageSize),
    hint: 'ql7_reply_inbox_recipient_new_v1',
    cursorDomain: 'forum-inbox-v1',
  }
}

function buildUserPostsPlan(input = {}) {
  const sort = normalizeUserBranchSort(input.sort)
  const idField = ID_FIELDS.userPosts
  const authorIds = Array.from(new Set(
    (Array.isArray(input.userIds) ? input.userIds : [input.userId || input.canonicalAuthorId])
      .map(str)
      .filter(Boolean),
  ))
  const authorQuery = authorIds.length > 1
    ? { canonicalAuthorId: { $in: authorIds } }
    : { canonicalAuthorId: authorIds[0] || '' }
  return {
    collection: FORUM_INDEX_COLLECTIONS.userPost,
    query: mergeQuery(authorQuery, boolDeletedFilter(), cursorFilter(sort, input.cursor, idField)),
    sort: sortObject(sort, idField),
    limit: clampPageSize('userPosts', input.pageSize),
    hint: 'ql7_user_post_' + sort + '_v1',
    cursorDomain: 'forum-user-posts-v1',
  }
}

function buildUserTopicsPlan(input = {}) {
  const sort = normalizeUserBranchSort(input.sort)
  const idField = ID_FIELDS.userTopics
  const authorIds = Array.from(new Set(
    (Array.isArray(input.userIds) ? input.userIds : [input.userId || input.canonicalAuthorId])
      .map(str)
      .filter(Boolean),
  ))
  const authorQuery = authorIds.length > 1
    ? { canonicalAuthorId: { $in: authorIds } }
    : { canonicalAuthorId: authorIds[0] || '' }
  return {
    collection: FORUM_INDEX_COLLECTIONS.userTopic,
    query: mergeQuery(authorQuery, boolDeletedFilter(), cursorFilter(sort, input.cursor, idField)),
    sort: sortObject(sort, idField),
    limit: clampPageSize('userTopics', input.pageSize),
    hint: 'ql7_user_topic_' + sort + '_v1',
    cursorDomain: 'forum-user-topics-v1',
  }
}

function buildMediaFeedPlan(input = {}) {
  const rawMode = str(input.mode || 'geo').toLowerCase()
  const mode = rawMode === 'world' || rawMode === 'global' || rawMode === 'off' ? 'world' : 'geo'
  const mediaKind = str(input.mediaKind || 'all') || 'all'
  const sort = normalizeSort(input.sort)
  const idField = ID_FIELDS.media
  if (sort === 'random') {
    return {
      collection: FORUM_INDEX_COLLECTIONS.mediaFeed,
      query: mergeQuery({ mediaKind, 'random.bucket': num(input.randomBucket, 0) }, mode === 'geo' ? { 'geo.scopeKeys': { $in: safeGeoScopes(input.geoPlan) } } : {}, boolDeletedFilter()),
      sort: { 'random.key': 1, [idField]: 1 },
      limit: clampPageSize('media', input.pageSize),
      hint: 'ql7_media_feed_random_v1',
      cursorDomain: 'forum-media-feed-v1',
    }
  }
  return {
    collection: FORUM_INDEX_COLLECTIONS.mediaFeed,
    query: mergeQuery({ mediaKind }, mode === 'geo' ? { 'geo.scopeKeys': { $in: safeGeoScopes(input.geoPlan) } } : {}, boolDeletedFilter(), cursorFilter(sort, input.cursor, idField)),
    sort: sortObject(sort, idField),
    limit: clampPageSize('media', input.pageSize),
    hint: mode === 'geo' && sortIndexKey(sort) === 'new' ? 'ql7_media_feed_geo_kind_new_v1' : null,
    cursorDomain: 'forum-media-feed-v1',
  }
}

function buildAllQueryShapeSamples() {
  const geoPlan = { rings: [{ level: 'city', key: 'city:ua:kv:kyiv' }, { level: 'global', key: 'global' }] }
  return {
    feedGeo: buildFeedPagePlan({ surface: 'home', mode: 'geo', sort: 'new', geoPlan, pageSize: 50 }),
    feedRandom: buildFeedPagePlan({ surface: 'home', mode: 'geo', sort: 'random', geoPlan, randomBucket: 7, pageSize: 50 }),
    search: buildSearchPagePlan({ q: 'deep answer', mode: 'posts', sort: 'relevance', pageSize: 20 }),
    threadRoots: buildThreadPagePlan({ mode: 'topic_roots', topicId: 'topic:1', pageSize: 30 }),
    threadBranch: buildThreadPagePlan({ mode: 'branch', topicId: 'topic:1', rootPostId: 'post:1', pageSize: 30 }),
    inbox: buildInboxRepliesPlan({ userId: 'geo_smoke_wallet_ua_kyiv', pageSize: 30 }),
    userPosts: buildUserPostsPlan({ userId: 'geo_smoke_wallet_ua_kyiv', sort: 'new', pageSize: 30 }),
    userTopics: buildUserTopicsPlan({ userId: 'geo_smoke_wallet_ua_kyiv', sort: 'new', pageSize: 30 }),
    media: buildMediaFeedPlan({ mediaKind: 'video', mode: 'geo', geoPlan, pageSize: 40 }),
  }
}

function auditForumQueryShapes(samples = buildAllQueryShapeSamples()) {
  const issues = []
  for (const [name, plan] of Object.entries(samples)) {
    if (!plan || typeof plan !== 'object') {
      issues.push(name + ':missing_plan')
      continue
    }
    if (!Object.values(FORUM_INDEX_COLLECTIONS).includes(plan.collection)) issues.push(name + ':unexpected_collection:' + plan.collection)
    if (!plan.query || typeof plan.query !== 'object' || !Object.keys(plan.query).length) issues.push(name + ':empty_query')
    if (!plan.sort || typeof plan.sort !== 'object' || !Object.keys(plan.sort).length) issues.push(name + ':missing_sort')
    if (!Number.isInteger(plan.limit) || plan.limit < 1 || plan.limit > 80) issues.push(name + ':unsafe_limit:' + plan.limit)
    if (!plan.hint || typeof plan.hint !== 'string') issues.push(name + ':missing_hint')
    if (!plan.cursorDomain || !/^forum-[a-z-]+-v1$/.test(plan.cursorDomain)) issues.push(name + ':bad_cursor_domain')
    if (plan.collection === 'forum_core_snapshot') issues.push(name + ':snapshot_dependency')
  }
  return { ok: issues.length === 0, issues, samples: clone(samples) }
}

function auditForumIndexSpecs() {
  const grouped = getSpecsByCollection()
  const requiredCollections = Object.values(FORUM_INDEX_COLLECTIONS)
  const issues = []
  for (const collection of requiredCollections) {
    if (!grouped[collection] || grouped[collection].length < 1) issues.push('missing_collection_specs:' + collection)
  }
  const names = new Set()
  for (const spec of FORUM_INDEX_SPECS) {
    const name = spec.options && spec.options.name
    if (!name) issues.push('missing_index_name:' + spec.collection)
    if (names.has(name)) issues.push('duplicate_index_name:' + name)
    names.add(name)
    if (spec.collection === 'forum_core_snapshot') issues.push('forbidden_snapshot_index:' + name)
    if (!spec.key || !Object.keys(spec.key).length) issues.push('empty_key:' + name)
  }
  return {
    ok: issues.length === 0,
    kind: 'ql7-forum-index-specs-audit',
    collections: requiredCollections.length,
    indexSpecs: FORUM_INDEX_SPECS.length,
    byCollection: Object.fromEntries(Object.entries(grouped).map(([key, value]) => [key, value.length])),
    issues,
  }
}

async function auditLiveForumIndexes(explicitDatabase) {
  const database = await resolveMongoDatabase(explicitDatabase)
  const specs = getForumIndexSpecs()
  const byCollection = getSpecsByCollection()
  const issues = []
  const collections = {}
  for (const [collectionName, collectionSpecs] of Object.entries(byCollection)) {
    const collection = database.collection(collectionName)
    let indexes = []
    try {
      indexes = await collection.indexes()
    } catch (error) {
      issues.push(collectionName + ':list_indexes_failed:' + String(error?.message || error))
      indexes = []
    }
    const names = new Set(indexes.map((item) => item.name))
    const expected = []
    for (const spec of collectionSpecs) {
      const name = spec.options.name
      expected.push(name)
      if (!names.has(name)) issues.push(collectionName + ':missing_index:' + name)
    }
    collections[collectionName] = { expected: expected.length, actual: indexes.length, expectedNames: expected }
  }
  return {
    ok: issues.length === 0,
    kind: 'ql7-forum-live-indexes-audit',
    collections: Object.keys(collections).length,
    expectedIndexSpecs: specs.length,
    issues,
    details: collections,
  }
}

module.exports = {
  FORUM_INDEX_COLLECTIONS,
  FORUM_INDEX_SPECS,
  PAGE_LIMITS,
  SORT_FIELDS,
  getForumIndexSpecs,
  getSpecsByCollection,
  ensureForumServerIndexes,
  auditForumIndexSpecs,
  auditForumQueryShapes,
  auditLiveForumIndexes,
  buildAllQueryShapeSamples,
  buildFeedPagePlan,
  buildSearchPagePlan,
  buildThreadPagePlan,
  buildInboxRepliesPlan,
  buildUserPostsPlan,
  buildUserTopicsPlan,
  buildMediaFeedPlan,
  clampPageSize,
  normalizeSort,
}
