// QL7_GEO888_PREMIUM_FEEDMAP_STAGE1_SERVER_READER_V14
// QL7_GEO888_STAGE1A_EXPLICIT_RANDOM_I18N_SORT_FIX_SERVER_V14A
// Server authority for home/media feed-map order. Live request geo wins; profile geo is read-only fallback.

const crypto = require('node:crypto')
const { clampPageSize } = require('../mongo/forum-indexes-primary.cjs')
const { sanitizePublicForumPayload } = require('./public-sanitize.cjs')
const { resolveRequestGeo, publicSessionGeoSummary } = require('../geo/request-geo.cjs')
const { buildFeedSelectionPlan, normalizeGeoMode, normalizeFeedSort } = require('../geo/geo-rings.cjs')
const profileGeoPrimary = require('../mongo/profile-geo-primary.cjs')

const CURSOR_TTL_MS = 6 * 60 * 60 * 1000
function encodeCursor(domain, payload, options) { const { encodeSignedCursor } = require('./signed-cursor.cjs'); return encodeSignedCursor(domain, payload, options) }
async function decodeCursor(domain, cursor) { const { decodeSignedCursor } = require('./signed-cursor.cjs'); return decodeSignedCursor(domain, cursor) }
const FEED_CURSOR_DOMAIN = 'forum-feed-v1'
const MEDIA_CURSOR_DOMAIN = 'forum-media-feed-v1'
const SORTS = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])
let testDatabase = null

function __setTestDb(db) { testDatabase = db || null }
function str(value) { return String(value ?? '').trim() }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function int(value, fallback = 0) { const n = Math.floor(num(value, fallback)); return Number.isFinite(n) ? n : fallback }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return value } }
function pick(obj, path) { let cur = obj; for (const part of String(path || '').split('.').filter(Boolean)) { if (!cur || typeof cur !== 'object') return undefined; cur = cur[part] } return cur }
function hash(value) { return crypto.createHash('sha1').update(String(value || '')).digest('hex') }
function feedSeed(value) { return str(value) || `ql7-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}` }
function normalizeBody(input = {}) { return input && typeof input === 'object' ? input : {} }
function normalizeSort(sort) { const raw = normalizeFeedSort(sort); return SORTS.has(raw) ? raw : 'random' }
function normalizeMode(mode) { return normalizeGeoMode(mode) }
function sortIndexKey(sort) { const normalized = normalizeSort(sort); return normalized === 'reactions' ? 'likes' : normalized }
function normalizeMediaKind(value) { const raw = str(value || 'video').toLowerCase(); return ['video', 'image', 'audio', 'all'].includes(raw) ? raw : 'video' }
async function database() { if (testDatabase) return testDatabase; const { getMongoDb } = require('../mongo/client.cjs'); const handle = await getMongoDb(); const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle; if (!db || typeof db.collection !== 'function') throw new Error('ql7_forum_server_page_db_unavailable'); return db }

function requestHeader(request, name) {
  try { return str(request?.headers?.get?.(name)) } catch {}
  try { return str(request?.headers?.[String(name || '').toLowerCase()] || request?.headers?.[name]) } catch {}
  return ''
}

function readActorId({ request = null, input = {} } = {}) {
  const body = input && typeof input === 'object' ? input : {}
  return str(
    body.canonicalAccountId ||
    body.accountId ||
    body.userId ||
    body.viewerId ||
    requestHeader(request, 'x-forum-user-id') ||
    requestHeader(request, 'x-auth-account-id') ||
    '',
  )
}

function profileGeoToViewerGeo(profileGeo = {}, liveGeo = {}) {
  if (!profileGeo || typeof profileGeo !== 'object') return liveGeo
  if (!profileGeo.known || str(profileGeo.geoKey || 'global') === 'global') return liveGeo
  return Object.freeze({
    known: true,
    country: str(profileGeo.country),
    region: str(profileGeo.region),
    city: str(profileGeo.city),
    precision: str(profileGeo.precision || 'global'),
    geoKey: str(profileGeo.geoKey || 'global'),
    scopes: profileGeo.scopes && typeof profileGeo.scopes === 'object' ? { ...profileGeo.scopes } : undefined,
    source: str(profileGeo.source || 'profile_fallback'),
    confidence: num(profileGeo.confidence, 0),
    capturedAt: str(profileGeo.capturedAt || profileGeo.lastSeenAt || liveGeo?.capturedAt) || new Date().toISOString(),
    labels: profileGeo.labels && typeof profileGeo.labels === 'object' ? { ...profileGeo.labels } : undefined,
    headersUsed: Object.freeze({ country: '', region: '', city: '' }),
    effectiveSource: 'profile_fallback',
  })
}

async function resolveEffectiveViewerGeo({ request = null, input = {} } = {}) {
  const liveGeo = resolveRequestGeo(request || {}, { now: new Date() })
  if (liveGeo?.known) return { geo: liveGeo, source: 'live_request', accountId: readActorId({ request, input }) }
  const accountId = readActorId({ request, input })
  if (!accountId) return { geo: liveGeo, source: 'global', accountId: '' }
  const profileGeo = await profileGeoPrimary.readProfileGeo(accountId, { skipEnsureIndexes: true }).catch(() => null)
  const effectiveGeo = profileGeoToViewerGeo(profileGeo, liveGeo)
  return {
    geo: effectiveGeo,
    source: effectiveGeo !== liveGeo ? 'profile_fallback' : 'global',
    accountId,
  }
}

function buildFeedMapKey({ surface = 'home', mediaKind = '', mode = 'geo', geoKey = '', ringsHash = '', sort = 'random', seed = '', lang = 'en' } = {}) {
  const clean = { surface: str(surface || 'home'), mediaKind: str(mediaKind), mode: normalizeMode(mode), geoKey: str(geoKey || (normalizeMode(mode) === 'world' ? 'world' : 'global')), ringsHash: str(ringsHash || 'global'), sort: normalizeSort(sort), seed: str(seed), lang: str(lang || 'en') }
  return { ...clean, key: hash(Object.values(clean).join('|')).slice(0, 20) }
}

function firstSortField(sort = {}) { for (const key of Object.keys(sort || {})) { if (!['postId', 'entityId', 'topicId'].includes(key)) return key } return 'sort.new' }
function idFieldForDomain(domain) { return domain === MEDIA_CURSOR_DOMAIN || domain === FEED_CURSOR_DOMAIN ? 'postId' : 'entityId' }
function sortObject(sort, idField = 'postId') { const normalized = normalizeSort(sort); if (normalized === 'random') return { 'random.key': 1, [idField]: 1 }; const key = sortIndexKey(normalized); const field = key === 'new' ? 'sort.new' : `sort.${key}`; return key === 'new' ? { [field]: -1, [idField]: 1 } : { [field]: -1, 'sort.new': -1, [idField]: 1 } }
function cursorFilter(sort, cursor, idField = 'postId') { const normalized = normalizeSort(sort); if (normalized === 'random') return {}; const after = cursor && typeof cursor === 'object' ? cursor.after : null; if (!after || typeof after !== 'object') return {}; const key = sortIndexKey(normalized); const field = key === 'new' ? 'sort.new' : `sort.${key}`; const value = after.value ?? after.ts ?? null; const id = str(after.id || after[idField]); if (value == null || !id) return {}; return { $or: [{ [field]: { $lt: value } }, { [field]: value, [idField]: { $gt: id } }] } }
function randomSeenIds(cursor) {
  const raw = cursor && typeof cursor === 'object' ? cursor.seenIds : null
  return Array.from(new Set((Array.isArray(raw) ? raw : []).map(str).filter(Boolean))).slice(0, 240)
}
function randomSeenFilter(cursor, idField = 'postId') {
  const seen = randomSeenIds(cursor)
  return seen.length ? { [idField]: { $nin: seen } } : {}
}
function mergeQuery(...parts) { const clean = parts.filter((part) => part && typeof part === 'object' && Object.keys(part).length); if (!clean.length) return {}; return clean.length === 1 ? clean[0] : { $and: clean } }
function boolDeletedFilter() { return { 'visibility.deleted': false } }
function ringKeys(ring = {}) { return Array.from(new Set([...(Array.isArray(ring.keys) ? ring.keys : []), ring.key].map(str).filter(Boolean))) }
function ringScopeFilter(ring = {}, previousKeys = []) { const keys = ringKeys(ring); if (!keys.length) return {}; const prior = Array.from(new Set((previousKeys || []).map(str).filter(Boolean))); const clauses = [{ 'geo.scopeKeys': keys.length === 1 ? keys[0] : { $in: keys } }]; if (prior.length) clauses.push({ 'geo.scopeKeys': { $nin: prior } }); return clauses.length === 1 ? clauses[0] : { $and: clauses } }
function seededScore(seed, row, ringIndex = 0) { const id = str(row?.postId || row?.entityId || row?._id || ''); return hash(`${seed}|${ringIndex}|${id}`).slice(0, 16) }
function seededOrderRows(rows, seed, ringIndex = 0, sort = 'random') { const list = Array.isArray(rows) ? rows.slice() : []; if (normalizeSort(sort) !== 'random') return list; return list.sort((a, b) => { const aa = seededScore(seed, a, ringIndex); const bb = seededScore(seed, b, ringIndex); return aa < bb ? -1 : aa > bb ? 1 : str(a?.postId).localeCompare(str(b?.postId)) }) }

function parentIdFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {}
  return str(post.parentId ?? row.parentId ?? '')
}

function parentMiniFromRow(row = {}) {
  if (!row || typeof row !== 'object') return null
  const post = row.post && typeof row.post === 'object' ? row.post : row
  const id = str(post.id || post.postId || row.postId || row.entityId || row._id).replace(/^post:/, '')
  if (!id) return null
  return {
    id,
    postId: id,
    topicId: str(post.topicId || row.topicId),
    userId: str(post.userId || post.accountId || row.canonicalAuthorId),
    accountId: str(post.accountId || post.userId || row.canonicalAuthorId),
    canonicalAuthorId: str(row.canonicalAuthorId || post.canonicalAuthorId || post.accountId || post.userId),
    nickname: str(post.nickname || post.nick),
    icon: str(post.icon || post.avatar),
    text: str(post.text || post.body || post.message || post.textSnippet || row.textSnippet || row.text?.snippet),
    textSnippet: str(post.textSnippet || row.textSnippet || row.text?.snippet || post.text || post.body || post.message).slice(0, 260),
  }
}

function decorateRowWithReplyMetadata(row = {}, parentMini = null) {
  const parentId = parentIdFromRow(row)
  if (!parentId || !parentMini) return row
  const next = { ...row }
  const post = next.post && typeof next.post === 'object' ? clone(next.post) : {}
  const replyName = str(parentMini.nickname)
  const replyAccountId = str(parentMini.accountId || parentMini.userId || parentMini.canonicalAuthorId)
  post.parentPost = post.parentPost && typeof post.parentPost === 'object'
    ? { ...parentMini, ...post.parentPost, id: str(post.parentPost.id || post.parentPost.postId || parentMini.id), postId: str(post.parentPost.postId || post.parentPost.id || parentMini.postId) }
    : parentMini
  post.parentText = str(post.parentText || post._parentText || parentMini.textSnippet || parentMini.text)
  post._parentText = str(post._parentText || post.parentText || parentMini.textSnippet || parentMini.text)
  post.parentAuthor = str(post.parentAuthor || replyName)
  post.parentNickname = str(post.parentNickname || replyName)
  post.parentAccountId = str(post.parentAccountId || replyAccountId)
  post.parentUserId = str(post.parentUserId || parentMini.userId || replyAccountId)
  post.replyToPostId = str(post.replyToPostId || parentMini.postId || parentId)
  post.replyToAccountId = str(post.replyToAccountId || replyAccountId)
  post.replyToUserId = str(post.replyToUserId || parentMini.userId || replyAccountId)
  post.replyToName = str(post.replyToName || replyName)
  post.replyToNickname = str(post.replyToNickname || replyName)
  post.replyToIcon = str(post.replyToIcon || parentMini.icon)
  post.replyToAuthor = post.replyToAuthor && typeof post.replyToAuthor === 'object'
    ? { ...parentMini, ...post.replyToAuthor }
    : {
        id: parentMini.id,
        postId: parentMini.postId,
        accountId: replyAccountId,
        userId: parentMini.userId || replyAccountId,
        nickname: replyName,
        icon: parentMini.icon,
      }
  next.post = post
  return next
}

async function hydrateRowsWithReplyMetadata(db, rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const parentIds = Array.from(new Set(list.map(parentIdFromRow).filter(Boolean)))
  if (!parentIds.length) return list
  const byId = new Map()
  const plans = [
    ['forum_thread_index', { postId: { $in: parentIds } }],
    ['forum_geo_feed_index', { postId: { $in: parentIds } }],
    ['forum_user_post_index', { postId: { $in: parentIds } }],
  ]
  for (const [collection, query] of plans) {
    const found = await db.collection(collection).find(query).limit(parentIds.length).toArray().catch(() => [])
    for (const row of found) {
      const mini = parentMiniFromRow(row)
      if (mini?.postId && !byId.has(mini.postId)) byId.set(mini.postId, mini)
    }
    if (byId.size >= parentIds.length) break
  }
  if (byId.size < parentIds.length) {
    const missing = parentIds.filter((id) => !byId.has(id)).map((id) => `post:${id}`)
    if (missing.length) {
      const foundCore = await db.collection('forum_core_posts').find({ _id: { $in: missing } }).limit(missing.length).toArray().catch(() => [])
      for (const row of foundCore) {
        const mini = parentMiniFromRow(row)
        if (mini?.postId && !byId.has(mini.postId)) byId.set(mini.postId, mini)
      }
    }
  }
  if (!byId.size) return list
  return list.map((row) => decorateRowWithReplyMetadata(row, byId.get(parentIdFromRow(row))))
}

function topicIdFromRow(row = {}) {
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : {}
  return str(row.topicId || topic.topicId || topic.id || row.entityId || row._id).replace(/^topic:/, '')
}

function topicCoreId(topicId) {
  const id = str(topicId)
  return id ? `topic:${id}` : ''
}

function mergeRowTopicWithCore(row = {}, core = null) {
  if (!core || typeof core !== 'object') return row
  const coreTopic = core.topic && typeof core.topic === 'object' ? core.topic : core
  const rowIsPost = Boolean(row?.postId || (row?.post && typeof row.post === 'object' && (row.post.postId || row.post.id)))
  const topic = row.topic && typeof row.topic === 'object' ? clone(row.topic) : {}
  const posts = Math.max(num(coreTopic.postsCount, 0), num(coreTopic.replies, 0), num(coreTopic.repliesCount, 0))
  const likes = Math.max(
    num(coreTopic.likes, 0),
    num(coreTopic.reactions, 0),
    num(coreTopic.reactionCount, 0),
  )
  const dislikes = num(coreTopic.dislikes, 0)
  const views = num(coreTopic.views, 0)
  const next = {
    ...row,
    __ql7TopicCountersCoreHydrated: true,
    topic: {
      ...topic,
      ...coreTopic,
      id: str(topic.id || topic.topicId || coreTopic.id || coreTopic.topicId || row.topicId).replace(/^topic:/, ''),
      topicId: str(topic.topicId || topic.id || coreTopic.topicId || coreTopic.id || row.topicId).replace(/^topic:/, ''),
      postsCount: posts,
      replies: posts,
      repliesCount: posts,
      likes,
      reactions: likes,
      reactionCount: likes,
      dislikes,
      views,
      __ql7TopicCountersCoreHydrated: true,
      __ql7CounterSource: 'forum_core_topics',
    },
  }
  if (rowIsPost) return next
  return {
    ...next,
    __ql7CounterSource: 'forum_core_topics',
  }
}

async function hydrateRowsWithTopicCounters(db, rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const ids = Array.from(new Set(list.map(topicIdFromRow).filter(Boolean)))
  if (!ids.length) return list
  const found = await db.collection('forum_core_topics')
    .find({ $or: [{ _id: { $in: ids.map(topicCoreId).filter(Boolean) } }, { id: { $in: ids } }, { topicId: { $in: ids } }] })
    .limit(ids.length)
    .toArray()
    .catch(() => [])
  if (!found.length) return list
  const byId = new Map()
  for (const core of found) {
    const topic = core.topic && typeof core.topic === 'object' ? core.topic : core
    const id = str(topic.id || topic.topicId || core.id || core.topicId || core._id).replace(/^topic:/, '')
    if (id && !byId.has(id)) byId.set(id, core)
  }
  return list.map((row) => mergeRowTopicWithCore(row, byId.get(topicIdFromRow(row))))
}

function postIdFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {}
  return str(row.postId || row.entityId || post.postId || post.id || row._id).replace(/^post:/, '')
}

function postCoreId(postId) {
  const id = str(postId)
  return id ? `post:${id}` : ''
}

function rowRepresentsPost(row = {}) {
  const kind = str(row.kind).toLowerCase()
  if (kind === 'topic') return false
  if (kind === 'post') return true
  return Boolean(row.postId || row.sourcePostId || row.parentId || (row.post && typeof row.post === 'object' && (row.post.postId || row.post.id)))
}

function postCounterShapeFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : (post.counters && typeof post.counters === 'object' ? post.counters : {})
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : (post.sort && typeof post.sort === 'object' ? post.sort : {})
  const likes = Math.max(num(post.likes, 0), num(counters.likes, 0))
  const dislikes = Math.max(num(post.dislikes, 0), num(counters.dislikes, 0), num(sort.dislikes, 0))
  const reactions = Math.max(
    num(post.reactions, 0),
    num(post.reactionCount, 0),
    num(counters.reactions, 0),
    num(counters.reactionCount, 0),
    num(sort.likes, 0),
    num(sort.reactions, 0),
    num(sort.reactionCount, 0),
    likes + dislikes,
  )
  const views = Math.max(num(post.views, 0), num(counters.views, 0), num(sort.views, 0))
  const replies = Math.max(
    num(post.replyCount, 0),
    num(post.repliesCount, 0),
    num(post.answersCount, 0),
    num(post.commentsCount, 0),
    num(post.__repliesCount, 0),
    num(post.replies, 0),
    num(counters.replies, 0),
    num(counters.replyCount, 0),
    num(counters.repliesCount, 0),
    num(counters.answersCount, 0),
    num(counters.commentsCount, 0),
    num(sort.replies, 0),
    num(sort.replyCount, 0),
    num(sort.repliesCount, 0),
    num(sort.answersCount, 0),
    num(sort.commentsCount, 0),
  )
  const ts = num(post.ts || row.ts || sort.new, 0)
  const top = Math.max(num(sort.top, 0), num(counters.top, 0), (reactions * 2) + replies + Math.floor(views * 0.2))
  return { likes, dislikes, reactions, views, replies, top, ts }
}

function postTopicIdFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row
  return str(row.topicId || post.topicId || row.topic?.topicId || row.topic?.id).replace(/^topic:/, '')
}

function isDeletedForumRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {}
  return Boolean(row?._del || row?.deleted || row?.visibility?.deleted === true || post?._del || post?.deleted || post?.visibility?.deleted === true)
}

function addTopicPostTotal(totalsByTopic, seenPostIds, row = {}) {
  if (!row || typeof row !== 'object' || isDeletedForumRow(row)) return
  const topicId = postTopicIdFromRow(row)
  if (!topicId) return
  const postId = postIdFromRow(row)
  const seenKey = postId ? `${topicId}:${postId}` : `${topicId}:${str(row._id || row.entityId)}`
  if (!seenKey || seenPostIds.has(seenKey)) return
  seenPostIds.add(seenKey)
  const shape = postCounterShapeFromRow(row)
  const current = totalsByTopic.get(topicId) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
  current.posts += 1
  current.likes += Math.max(shape.reactions, shape.likes + shape.dislikes)
  current.dislikes += shape.dislikes
  current.views += shape.views
  totalsByTopic.set(topicId, current)
}

function mergeRowTopicWithPostTotals(row = {}, totals = null) {
  if (!totals || typeof totals !== 'object') return row
  const rowIsPost = Boolean(row?.postId || (row?.post && typeof row.post === 'object' && (row.post.postId || row.post.id)))
  const topic = row.topic && typeof row.topic === 'object' ? clone(row.topic) : {}
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {}
  const coreAuthoritative = Boolean(
    row.__ql7TopicCountersCoreHydrated ||
    topic.__ql7TopicCountersCoreHydrated ||
    counters.__ql7TopicCountersCoreHydrated ||
    str(row.__ql7CounterSource || topic.__ql7CounterSource || counters.__ql7CounterSource).includes('forum_core_topics')
  )
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {}
  const topicCounters = topic.counters && typeof topic.counters === 'object' ? topic.counters : {}
  const topicSort = topic.sort && typeof topic.sort === 'object' ? topic.sort : {}
  const existingPosts = Math.max(
    num(topic.postsCount, 0),
    num(topic.replies, 0),
    num(topic.repliesCount, 0),
    num(topicCounters.posts, 0),
    num(topicCounters.replies, 0),
    num(topicCounters.repliesCount, 0),
    rowIsPost ? 0 : num(counters.posts, 0),
    rowIsPost ? 0 : num(counters.replies, 0),
    rowIsPost ? 0 : num(counters.repliesCount, 0),
    num(topicSort.posts, 0),
    num(topicSort.replies, 0),
    num(topicSort.repliesCount, 0),
    rowIsPost ? 0 : num(sort.posts, 0),
    rowIsPost ? 0 : num(sort.replies, 0),
    rowIsPost ? 0 : num(sort.repliesCount, 0),
  )
  const existingLikes = Math.max(
    num(topic.likes, 0),
    num(topic.reactions, 0),
    num(topic.reactionCount, 0),
    num(topicCounters.likes, 0),
    num(topicCounters.reactions, 0),
    num(topicCounters.reactionCount, 0),
    rowIsPost ? 0 : num(counters.likes, 0),
    rowIsPost ? 0 : num(counters.reactions, 0),
    rowIsPost ? 0 : num(counters.reactionCount, 0),
    num(topicSort.likes, 0),
    num(topicSort.reactions, 0),
    num(topicSort.reactionCount, 0),
    rowIsPost ? 0 : num(sort.likes, 0),
    rowIsPost ? 0 : num(sort.reactions, 0),
    rowIsPost ? 0 : num(sort.reactionCount, 0),
  )
  const existingDislikes = Math.max(
    num(topic.dislikes, 0),
    num(topicCounters.dislikes, 0),
    rowIsPost ? 0 : num(counters.dislikes, 0),
    num(topicSort.dislikes, 0),
    rowIsPost ? 0 : num(sort.dislikes, 0),
  )
  const existingViews = Math.max(
    num(topic.views, 0),
    num(topicCounters.views, 0),
    rowIsPost ? 0 : num(counters.views, 0),
    num(topicSort.views, 0),
    rowIsPost ? 0 : num(sort.views, 0),
  )
  const posts = Math.max(0, coreAuthoritative ? existingPosts : 0, num(totals.posts, 0))
  const likes = Math.max(0, coreAuthoritative ? existingLikes : 0, num(totals.likes, 0))
  const dislikes = Math.max(0, coreAuthoritative ? existingDislikes : 0, num(totals.dislikes, 0))
  const views = Math.max(0, coreAuthoritative ? existingViews : 0, num(totals.views, 0))
  const top = (likes * 2) + posts + Math.floor(views * 0.2)
  const id = str(topic.id || topic.topicId || row.topicId || row.entityId || row._id).replace(/^topic:/, '')
  const sourceName = coreAuthoritative ? 'forum_core_topics' : 'topic_post_totals'
  const nextTopic = {
    ...topic,
    id,
    topicId: id,
    postsCount: posts,
    replies: posts,
    repliesCount: posts,
    likes,
    reactions: likes,
    reactionCount: likes,
    dislikes,
    views,
    __ql7TopicCountersCoreHydrated: Boolean(topic.__ql7TopicCountersCoreHydrated || coreAuthoritative),
    __ql7TopicCountersPostTotalsHydrated: true,
    __ql7CounterSource: sourceName,
  }
  if (rowIsPost) {
    return {
      ...row,
      __ql7TopicCountersPostTotalsHydrated: true,
      topic: nextTopic,
    }
  }
  return {
    ...row,
    __ql7TopicCountersPostTotalsHydrated: true,
    __ql7CounterSource: sourceName,
    counters: {
      ...counters,
      posts,
      replies: posts,
      repliesCount: posts,
      likes,
      reactions: likes,
      reactionCount: likes,
      dislikes,
      views,
      top,
      __ql7TopicCountersCoreHydrated: Boolean(counters.__ql7TopicCountersCoreHydrated || coreAuthoritative),
      __ql7TopicCountersPostTotalsHydrated: true,
      __ql7CounterSource: sourceName,
    },
    sort: {
      ...sort,
      posts,
      replies: posts,
      repliesCount: posts,
      likes,
      reactions: likes,
      reactionCount: likes,
      dislikes,
      views,
      top,
    },
    topic: {
      ...nextTopic,
    },
  }
}

async function hydrateRowsWithTopicPostTotals(db, rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const ids = Array.from(new Set(list.map(topicIdFromRow).filter(Boolean)))
  if (!ids.length) return list
  const query = { $or: [{ topicId: { $in: ids } }, { 'post.topicId': { $in: ids } }, { 'topic.topicId': { $in: ids } }, { 'topic.id': { $in: ids } }] }
  const limit = Math.min(Math.max(ids.length * 800, 1200), 20000)
  const totalsByTopic = new Map()
  const seenPostIds = new Set()
  for (const collection of ['forum_core_posts', 'forum_thread_index']) {
    const rowsForTopics = await db.collection(collection).find(query).limit(limit).toArray().catch(() => [])
    for (const row of rowsForTopics || []) addTopicPostTotal(totalsByTopic, seenPostIds, row)
  }
  if (!totalsByTopic.size) return list
  return list.map((row) => mergeRowTopicWithPostTotals(row, totalsByTopic.get(topicIdFromRow(row))))
}

function mergeRowPostWithCore(row = {}, core = null, marker = '__ql7PostCountersCoreHydrated', sourceName = 'forum_core_posts') {
  if (!core || typeof core !== 'object') return row
  const post = row.post && typeof row.post === 'object' ? clone(row.post) : {}
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {}
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {}
  const baseShape = postCounterShapeFromRow(row)
  const corePost = core.post && typeof core.post === 'object' ? core.post : core
  const coreShape = postCounterShapeFromRow({ ...core, post: corePost })
  const coreAuthoritative = sourceName === 'forum_core_posts'
  const threadRepliesAuthoritative = sourceName === 'forum_thread_index'
  const shape = {
    likes: coreAuthoritative ? coreShape.likes : Math.max(baseShape.likes, coreShape.likes),
    dislikes: coreAuthoritative ? coreShape.dislikes : Math.max(baseShape.dislikes, coreShape.dislikes),
    reactions: coreAuthoritative ? coreShape.reactions : Math.max(baseShape.reactions, coreShape.reactions),
    views: coreAuthoritative ? coreShape.views : Math.max(baseShape.views, coreShape.views),
    replies: (coreAuthoritative || threadRepliesAuthoritative) ? coreShape.replies : Math.max(baseShape.replies, coreShape.replies),
    top: coreAuthoritative ? coreShape.top : Math.max(baseShape.top, coreShape.top),
    ts: Math.max(baseShape.ts, coreShape.ts),
  }
  const postId = postIdFromRow(row)
  return {
    ...row,
    counters: {
      ...counters,
      likes: shape.likes,
      dislikes: shape.dislikes,
      reactions: shape.reactions,
      reactionCount: shape.reactions,
      views: shape.views,
      replies: shape.replies,
      replyCount: shape.replies,
      repliesCount: shape.replies,
      answersCount: shape.replies,
      commentsCount: shape.replies,
      top: shape.top,
    },
    sort: {
      ...sort,
      new: num(sort.new || row.ts || post.ts || shape.ts, shape.ts),
      likes: shape.reactions,
      reactions: shape.reactions,
      reactionCount: shape.reactions,
      dislikes: shape.dislikes,
      views: shape.views,
      replies: shape.replies,
      replyCount: shape.replies,
      repliesCount: shape.replies,
      answersCount: shape.replies,
      commentsCount: shape.replies,
      top: shape.top,
    },
    post: {
      ...post,
      id: str(post.id || post.postId || postId),
      postId: str(post.postId || post.id || postId),
      likes: shape.likes,
      dislikes: shape.dislikes,
      reactions: shape.reactions,
      reactionCount: shape.reactions,
      views: shape.views,
      replies: shape.replies,
      replyCount: shape.replies,
      repliesCount: shape.replies,
      answersCount: shape.replies,
      commentsCount: shape.replies,
      __repliesCount: shape.replies,
      counters: {
        ...(post.counters && typeof post.counters === 'object' ? post.counters : {}),
        likes: shape.likes,
        dislikes: shape.dislikes,
        reactions: shape.reactions,
        reactionCount: shape.reactions,
        views: shape.views,
        replies: shape.replies,
        replyCount: shape.replies,
        repliesCount: shape.replies,
        answersCount: shape.replies,
        commentsCount: shape.replies,
        top: shape.top,
      },
      sort: {
        ...(post.sort && typeof post.sort === 'object' ? post.sort : {}),
        new: num(sort.new || row.ts || post.ts || shape.ts, shape.ts),
        likes: shape.reactions,
        reactions: shape.reactions,
        reactionCount: shape.reactions,
        dislikes: shape.dislikes,
        views: shape.views,
        replies: shape.replies,
        replyCount: shape.replies,
        repliesCount: shape.replies,
        answersCount: shape.replies,
        commentsCount: shape.replies,
        top: shape.top,
      },
      [marker]: true,
      __ql7CounterSource: sourceName,
    },
    [marker]: true,
    __ql7CounterSource: sourceName,
  }
}

async function hydrateRowsWithPostCounters(db, rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const ids = Array.from(new Set(list.map(postIdFromRow).filter(Boolean)))
  if (!ids.length) return list
  const found = await db.collection('forum_core_posts')
    .find({ $or: [{ _id: { $in: ids.map(postCoreId).filter(Boolean) } }, { id: { $in: ids } }, { postId: { $in: ids } }] })
    .limit(ids.length)
    .toArray()
    .catch(() => [])
  if (!found.length) return list
  const byId = new Map()
  for (const core of found) {
    const corePost = core.post && typeof core.post === 'object' ? core.post : core
    const id = str(corePost.id || corePost.postId || core.id || core.postId || core._id).replace(/^post:/, '')
    if (id && !byId.has(id)) byId.set(id, core)
  }
  return list.map((row) => mergeRowPostWithCore(row, byId.get(postIdFromRow(row))))
}

async function filterRowsWithExistingCorePosts(db, rows = [], options = {}) {
  const list = Array.isArray(rows) ? rows : []
  const requirePost = options?.requirePost !== false
  const ids = Array.from(new Set(list.filter(rowRepresentsPost).map(postIdFromRow).filter(Boolean)))
  if (!ids.length) return requirePost ? [] : list
  const found = await db.collection('forum_core_posts')
    .find({ _id: { $in: ids.map(postCoreId).filter(Boolean) } })
    .limit(ids.length)
    .toArray()
    .catch(() => [])
  const liveIds = new Set()
  for (const row of found || []) {
    if (row?._del || row?.deleted || row?.visibility?.deleted === true) continue
    const post = row.post && typeof row.post === 'object' ? row.post : row
    const id = str(post.id || post.postId || row.id || row.postId || row._id).replace(/^post:/, '')
    if (id) liveIds.add(id)
  }
  const missingIds = ids.filter((id) => !liveIds.has(id))
  if (!missingIds.length) return list
  const deleteEvents = await db.collection('forum_core_change_events').find({
    $or: [
      { id: { $in: missingIds } },
      { 'parsed.id': { $in: missingIds } },
      { 'parsed.deleted': { $in: missingIds } },
      { 'parsed.deletedPostIds': { $in: missingIds } },
    ],
  }).limit(Math.min(Math.max(missingIds.length * 6, 50), 1000)).toArray().catch(() => [])
  const deletedIds = new Set()
  for (const event of deleteEvents || []) {
    const parsed = event?.parsed && typeof event.parsed === 'object' ? event.parsed : {}
    const kind = str(parsed.kind || event.kind)
    const eventId = str(parsed.id || event.id)
    if ((parsed._del || kind === 'post_deleted') && eventId) deletedIds.add(eventId)
    for (const id of [
      ...(Array.isArray(parsed.deleted) ? parsed.deleted : []),
      ...(Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : []),
      ...(Array.isArray(parsed.deletedPosts) ? parsed.deletedPosts : []),
    ]) {
      const clean = str(id)
      if (clean) deletedIds.add(clean)
    }
  }
  if (!deletedIds.size) return list
  return list.filter((row) => {
    if (!rowRepresentsPost(row)) return !requirePost
    const id = postIdFromRow(row)
    if (!id) return !requirePost
    return liveIds.has(id) || !deletedIds.has(id)
  })
}

async function hydrateRowsWithThreadReplyCounts(db, rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const ids = Array.from(new Set(list.map(postIdFromRow).filter(Boolean)))
  if (!ids.length) return list
  const children = await db.collection('forum_thread_index')
    .find({ parentId: { $in: ids } })
    .limit(Math.min(Math.max(ids.length * 120, ids.length), 5000))
    .toArray()
    .catch(() => [])
  const byParent = new Map()
  for (const child of children || []) {
    if (child?.visibility?.deleted === true || child?._del || child?.deleted) continue
    const parentId = str(child.parentId || child.post?.parentId)
    if (!parentId) continue
    byParent.set(parentId, Number(byParent.get(parentId) || 0) + 1)
  }
  if (!byParent.size) return list
  return list.map((row) => {
    const postId = postIdFromRow(row)
    const replies = Number(byParent.get(postId) || 0)
    if (!postId || replies <= 0) return row
    return mergeRowPostWithCore(
      row,
      { post: { id: postId, postId, replyCount: replies, repliesCount: replies, replies } },
      '__ql7PostCountersThreadIndexHydrated',
      'forum_thread_index',
    )
  })
}

function feedSortValue(row = {}, sort = 'random') {
  const normalized = normalizeSort(sort)
  const shape = postCounterShapeFromRow(row)
  if (normalized === 'likes' || normalized === 'reactions') return shape.reactions
  if (normalized === 'views') return shape.views
  if (normalized === 'replies') return shape.replies
  if (normalized === 'top') return shape.top
  return shape.ts
}

function orderRowsForFeed(rows, seed, ringIndex = 0, sort = 'random') {
  const list = Array.isArray(rows) ? rows.slice() : []
  if (normalizeSort(sort) === 'random') return seededOrderRows(list, seed, ringIndex, sort)
  return list.sort((a, b) => {
    const bv = feedSortValue(b, sort)
    const av = feedSortValue(a, sort)
    if (bv !== av) return bv - av
    const bTs = feedSortValue(b, 'new')
    const aTs = feedSortValue(a, 'new')
    if (bTs !== aTs) return bTs - aTs
    return postIdFromRow(a).localeCompare(postIdFromRow(b))
  })
}

function externalMediaTextFromRow(row = {}) {
  const post = row?.post && typeof row.post === 'object' ? row.post : row
  return [post?.text, post?.body, post?.message, post?.html, row?.text, row?.textSnippet]
    .map((value) => str(value))
    .filter(Boolean)
    .join('\n')
}

function rowHasExternalMedia(row = {}) {
  const media = row?.media && typeof row.media === 'object' ? row.media : null
  const mediaKind = str(row?.mediaKind || media?.kind || media?.type).toLowerCase()
  const mediaUrl = str(row?.mediaUrl || row?.url || media?.url || media?.src)
  if (['youtube', 'tiktok', 'iframe', 'embed'].includes(mediaKind)) return true
  if (/(?:youtube(?:-nocookie)?\.com|youtu\.be|tiktok\.com)/i.test(mediaUrl)) return true
  const text = externalMediaTextFromRow(row)
  return /(?:youtube(?:-nocookie)?\.com|youtu\.be|tiktok\.com)/i.test(text) || /<\s*iframe[\s>]/i.test(text)
}

function mergeMediaRowsWithExternalFallback(primaryRows, fallbackRows) {
  const out = []
  const seen = new Set()
  for (const row of Array.isArray(primaryRows) ? primaryRows : []) {
    const id = postIdFromRow(row)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(row)
  }
  for (const row of Array.isArray(fallbackRows) ? fallbackRows : []) {
    if (!rowHasExternalMedia(row)) continue
    const id = postIdFromRow(row)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(row)
  }
  return out
}

function buildPublicRow(row = {}, surface = 'feed') {
  const media = row.media && typeof row.media === 'object' ? { kind: str(row.media.kind), url: str(row.media.url) } : null
  const out = { id: str(row.postId || row.entityId || row._id), postId: str(row.postId || row.entityId || row._id), topicId: str(row.topicId), canonicalAuthorId: str(row.canonicalAuthorId), ts: num(row.ts || pick(row, 'sort.new'), 0), sort: row.sort && typeof row.sort === 'object' ? clone(row.sort) : {}, counters: row.counters && typeof row.counters === 'object' ? clone(row.counters) : {}, post: row.post && typeof row.post === 'object' ? clone(row.post) : null, topic: row.topic && typeof row.topic === 'object' ? clone(row.topic) : null, open: row.open && typeof row.open === 'object' ? clone(row.open) : undefined, storagePrimary: str(row.storagePrimary || 'mongo'), surface }
  if (row.__ql7PostCountersCoreHydrated || out.post?.__ql7PostCountersCoreHydrated) out.__ql7PostCountersCoreHydrated = true
  if (row.__ql7PostCountersThreadIndexHydrated || out.post?.__ql7PostCountersThreadIndexHydrated) out.__ql7PostCountersThreadIndexHydrated = true
  if (row.__ql7CounterSource || out.post?.__ql7CounterSource) out.__ql7CounterSource = str(row.__ql7CounterSource || out.post?.__ql7CounterSource)
  if (row.__ql7TopicCountersCoreHydrated || out.topic?.__ql7TopicCountersCoreHydrated) out.__ql7TopicCountersCoreHydrated = true
  if (row.__ql7TopicCountersPostTotalsHydrated || out.topic?.__ql7TopicCountersPostTotalsHydrated) out.__ql7TopicCountersPostTotalsHydrated = true
  if (media && media.kind && media.url) out.media = media
  return sanitizePublicForumPayload(out)
}

async function readRowsForPlan(db, plan) { const collection = db.collection(plan.collection); let cursor = collection.find(plan.query || {}); if (cursor && typeof cursor.sort === 'function') cursor = cursor.sort(plan.sort || {}); if (cursor && typeof cursor.limit === 'function') cursor = cursor.limit(Number(plan.limit || 1) + 1); if (cursor && typeof cursor.hint === 'function' && plan.hint) { try { cursor = cursor.hint(plan.hint) } catch {} } if (!cursor || typeof cursor.toArray !== 'function') return []; return cursor.toArray() }
async function findRows(db, plan) {
  const rows = await readRowsForPlan(db, plan)
  const merged = !plan?.externalMediaFallbackPlan
    ? rows
    : mergeMediaRowsWithExternalFallback(rows, await readRowsForPlan(db, plan.externalMediaFallbackPlan))
  return filterRowsWithExistingCorePosts(db, merged)
}

async function makeNextCursor({ domain, plan, rows, returnedRows, pageSize, sort, mapKey }) { if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null; const last = returnedRows[returnedRows.length - 1]; const field = firstSortField(plan.sort); const idField = idFieldForDomain(domain); const id = str(last[idField] || last.postId || last.entityId || last._id); const value = pick(last, field); if (!id || value == null) return null; return encodeCursor(domain, { after: { id, value, field }, pageSize, sort: normalizeSort(sort), mapKey }, { ttlMs: CURSOR_TTL_MS }) }
async function makeRingNextCursor({ domain, ringIndex, ringKey, plan, rows, returnedRows, remaining, pageSize, sort, mapKey }) { if (!Array.isArray(rows) || rows.length <= remaining || !returnedRows.length) return null; const idField = idFieldForDomain(domain); if (normalizeSort(sort) === 'random') { const seen = Array.from(new Set([...(Array.isArray(plan?.randomSeenIds) ? plan.randomSeenIds : []), ...returnedRows.map((row) => str(row?.[idField] || row?.postId || row?.entityId || row?._id)).filter(Boolean)])).slice(-240); return encodeCursor(domain, { ringIndex, ringKey, ringCursor: { seenIds: seen }, pageSize, sort: 'random', mapKey }, { ttlMs: CURSOR_TTL_MS }) } const last = returnedRows[returnedRows.length - 1]; const field = firstSortField(plan.sort); const id = str(last[idField] || last.postId || last.entityId || last._id); const value = pick(last, field); if (!id || value == null) return null; return encodeCursor(domain, { ringIndex, ringKey, ringCursor: { after: { id, value, field } }, pageSize, sort: normalizeSort(sort), mapKey }, { ttlMs: CURSOR_TTL_MS }) }
async function makeRingAdvanceCursor({ domain, ringIndex, ringKey, pageSize, sort, mapKey }) { return encodeCursor(domain, { ringIndex, ringKey, ringCursor: null, pageSize, sort: normalizeSort(sort), mapKey }, { ttlMs: CURSOR_TTL_MS }) }
async function makeRandomNextCursor({ domain, plan, rows, returnedRows, pageSize, sort, mapKey }) { if (normalizeSort(sort) !== 'random') return makeNextCursor({ domain, plan, rows, returnedRows, pageSize, sort, mapKey }); if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null; const idField = idFieldForDomain(domain); const seen = Array.from(new Set([...(Array.isArray(plan?.randomSeenIds) ? plan.randomSeenIds : []), ...returnedRows.map((row) => str(row?.[idField] || row?.postId || row?.entityId || row?._id)).filter(Boolean)])).slice(-240); return encodeCursor(domain, { seenIds: seen, pageSize, sort: 'random', mapKey }, { ttlMs: CURSOR_TTL_MS }) }
function normalizeRingCursorPayload(payload = {}, sort = 'random') { if (!payload || typeof payload !== 'object') return { ringIndex: 0, ringCursor: null }; return { ringIndex: Math.max(0, Math.floor(num(payload.ringIndex, 0))), ringCursor: payload.ringCursor && typeof payload.ringCursor === 'object' ? payload.ringCursor : (payload.after ? { after: payload.after } : null), sort: str(payload.sort || sort), mapKey: payload.mapKey || null } }
function cursorMatchesMap(cursorPayload, mapKey) { if (!cursorPayload?.mapKey || !mapKey?.key) return true; return cursorPayload.mapKey.key === mapKey.key }

function buildFeedPlan({ mode, ring, previousKeys, sort, cursor, pageSize, surface, seed, ringIndex = 0 }) {
  const normalizedSort = normalizeSort(sort)
  const random = normalizedSort === 'random'
  const query = mode === 'geo'
    ? mergeQuery({ surface }, ringScopeFilter(ring, previousKeys), boolDeletedFilter(), cursorFilter(normalizedSort, cursor, 'postId'), random ? randomSeenFilter(cursor, 'postId') : {})
    : mergeQuery({ surface }, boolDeletedFilter(), cursorFilter(normalizedSort, cursor, 'postId'), random ? randomSeenFilter(cursor, 'postId') : {})
  return { collection: 'forum_geo_feed_index', query, sort: sortObject(normalizedSort, 'postId'), limit: Math.min(Math.max(pageSize * 4, pageSize + 1), 160), hint: random || mode === 'world' ? null : 'ql7_geo_feed_scope_' + sortIndexKey(normalizedSort) + '_v1', cursorDomain: FEED_CURSOR_DOMAIN, geoRingPriority: mode === 'geo', ringRandomOrder: random && mode === 'geo', seed, ringIndex, randomSeenIds: randomSeenIds(cursor) }
}

function buildMediaPlan({ mode, ring, previousKeys, mediaKind, sort, cursor, pageSize, seed, ringIndex = 0 }) {
  const normalizedSort = normalizeSort(sort)
  const random = normalizedSort === 'random'
  const normalizedMediaKind = normalizeMediaKind(mediaKind)
  const kindFilter = normalizedMediaKind === 'all' ? {} : { mediaKind }
  const query = mode === 'geo'
    ? mergeQuery(kindFilter, ringScopeFilter(ring, previousKeys), boolDeletedFilter(), cursorFilter(normalizedSort, cursor, 'postId'), random ? randomSeenFilter(cursor, 'postId') : {})
    : mergeQuery(kindFilter, boolDeletedFilter(), cursorFilter(normalizedSort, cursor, 'postId'), random ? randomSeenFilter(cursor, 'postId') : {})
  const externalMediaFallbackPlan = normalizedMediaKind === 'all'
    ? buildFeedPlan({ mode, ring, previousKeys, sort, cursor, pageSize, surface: 'home', seed, ringIndex })
    : null
  if (externalMediaFallbackPlan) externalMediaFallbackPlan.limit = Math.min(Math.max(pageSize * 8, pageSize + 1), 240)
  return { collection: 'forum_media_feed_index', query, sort: sortObject(normalizedSort, 'postId'), limit: Math.min(Math.max(pageSize * 4, pageSize + 1), 160), hint: sortIndexKey(normalizedSort) === 'new' && mode === 'geo' ? 'ql7_media_feed_geo_kind_new_v1' : null, cursorDomain: MEDIA_CURSOR_DOMAIN, geoRingPriority: mode === 'geo', ringRandomOrder: random && mode === 'geo', seed, ringIndex, randomSeenIds: randomSeenIds(cursor), externalMediaFallbackPlan }
}

async function readRingPriorityPage({ db, domain, rings, makePlan, pageSize, sort = 'random', seed = '', cursorPayload = null, mapKey = null }) {
  const cleanRings = (Array.isArray(rings) ? rings : []).filter((item) => item && ringKeys(item).length)
  if (!cleanRings.length) return { rows: [], returnedRows: [], nextCursor: null, queryShape: null, ringTrace: [] }
  const state = normalizeRingCursorPayload(cursorPayload, sort)
  if (!cursorMatchesMap(state, mapKey)) return { rows: [], returnedRows: [], nextCursor: null, queryShape: null, ringTrace: [], staleCursor: true }
  const startIndex = Math.min(state.ringIndex, Math.max(0, cleanRings.length - 1))
  let remaining = pageSize
  const returnedRows = []
  const returnedRowRingIndexes = []
  const ringTrace = []
  let lastPlan = null
  for (let ringIndex = startIndex; ringIndex < cleanRings.length && remaining > 0; ringIndex += 1) {
    const ring = cleanRings[ringIndex]
    const previousKeys = cleanRings.slice(0, ringIndex).flatMap((item) => ringKeys(item))
    const ringCursor = ringIndex === startIndex ? state.ringCursor : null
    const plan = makePlan({ ring, previousKeys, cursor: ringCursor, pageSize: remaining, sort, seed, ringIndex })
    lastPlan = plan
    const rowsRaw = await findRows(db, plan)
    const rowsHydrated = await hydrateRowsWithThreadReplyCounts(db, await hydrateRowsWithPostCounters(db, rowsRaw))
    const rows = orderRowsForFeed(rowsHydrated, `${seed}|${str(ring.level)}|${ringKeys(ring).join(',')}`, ringIndex, sort)
    const chunk = rows.slice(0, remaining)
    returnedRows.push(...chunk)
    returnedRowRingIndexes.push(...chunk.map(() => ringIndex))
    ringTrace.push({ ringIndex, level: str(ring.level), key: str(ring.key), keys: ringKeys(ring), fetched: rows.length, returned: chunk.length, randomWithinRing: normalizeSort(sort) === 'random' })
    if (rows.length > remaining) {
      const nextCursor = await makeRingNextCursor({ domain, ringIndex, ringKey: ring.key, plan, rows, returnedRows: chunk, remaining, pageSize, sort, mapKey })
      return { rows, returnedRows, returnedRowRingIndexes, nextCursor, queryShape: plan, ringTrace }
    }
    remaining -= chunk.length
    if (remaining <= 0 && ringIndex + 1 < cleanRings.length) {
      const nextRing = cleanRings[ringIndex + 1]
      const nextCursor = await makeRingAdvanceCursor({ domain, ringIndex: ringIndex + 1, ringKey: nextRing.key, pageSize, sort, mapKey })
      return { rows: returnedRows, returnedRows, returnedRowRingIndexes, nextCursor, queryShape: plan, ringTrace }
    }
  }
  return { rows: returnedRows, returnedRows, returnedRowRingIndexes, nextCursor: null, queryShape: lastPlan, ringTrace }
}

async function readForumFeedPage({ request = null, input = {} } = {}) {
  const body = normalizeBody(input)
  const mode = normalizeMode(body.mode || 'geo')
  const sort = normalizeSort(body.sort || 'random')
  const seed = feedSeed(body.seed || body.randomSeed || body.feedSeed)
  const pageSize = clampPageSize('feed', body.pageSize || body.limit)
  const cursorPayload = body.cursor ? await decodeCursor(FEED_CURSOR_DOMAIN, body.cursor) : null
  const effectiveGeo = await resolveEffectiveViewerGeo({ request, input: body })
  const viewerGeo = effectiveGeo.geo
  const geoPlan = buildFeedSelectionPlan({ mode, sort, geo: viewerGeo })
  const mapKey = buildFeedMapKey({ surface: body.surface || 'home', mode, geoKey: viewerGeo.geoKey, ringsHash: geoPlan.ringsHash, sort, seed, lang: body.lang || 'en' })
  const db = await database()
  if (mode === 'world') {
    const plan = buildFeedPlan({ mode, sort, cursor: cursorMatchesMap(cursorPayload, mapKey) ? cursorPayload : null, pageSize, surface: body.surface || 'home', seed, ringIndex: 0 })
    const rowsRaw = await findRows(db, plan)
    const rows = orderRowsForFeed(await hydrateRowsWithThreadReplyCounts(db, await hydrateRowsWithPostCounters(db, rowsRaw)), `${seed}|world|${sort}`, 0, sort)
    const returnedRows = await hydrateRowsWithReplyMetadata(db, await hydrateRowsWithTopicPostTotals(db, await hydrateRowsWithTopicCounters(db, rows.slice(0, pageSize))))
    const items = returnedRows.map((row, index) => ({ ...buildPublicRow(row, 'feed'), geoRank: null, __ql7FeedMapKey: mapKey.key, __ql7ServerFeedRank: index }))
    const nextCursor = await makeRandomNextCursor({ domain: FEED_CURSOR_DOMAIN, plan, rows, returnedRows, pageSize, sort, mapKey })
    return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-feed-page', source: 'mongo_projection_index', mode, sort, seed, feedMapKey: mapKey, pageSize, count: items.length, items, nextCursor, hasMore: Boolean(nextCursor), viewerGeo: publicSessionGeoSummary(viewerGeo, body.lang || 'en'), effectiveViewerGeoSource: effectiveGeo.source, queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain, geoRingPriority: false, ringRandomOrder: false } })
  }
  const ringResult = await readRingPriorityPage({ db, domain: FEED_CURSOR_DOMAIN, rings: geoPlan.rings, pageSize, sort, seed, cursorPayload, mapKey, makePlan: ({ ring, previousKeys, cursor, pageSize: remaining, sort: innerSort, seed: innerSeed, ringIndex }) => buildFeedPlan({ mode, ring, previousKeys, cursor, pageSize: remaining, sort: innerSort, surface: body.surface || 'home', seed: innerSeed, ringIndex }) })
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, await hydrateRowsWithThreadReplyCounts(db, await hydrateRowsWithTopicPostTotals(db, await hydrateRowsWithTopicCounters(db, ringResult.returnedRows))))
  const items = hydratedRows.map((row, index) => ({ ...buildPublicRow(row, 'feed'), geoRank: { ringIndex: Number.isFinite(Number(ringResult.returnedRowRingIndexes?.[index])) ? Number(ringResult.returnedRowRingIndexes[index]) : null }, __ql7FeedMapKey: mapKey.key, __ql7ServerFeedRank: index }))
  const queryShape = ringResult.queryShape || {}
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-feed-page', source: 'mongo_projection_index', mode, sort, seed, feedMapKey: mapKey, pageSize, count: items.length, items, nextCursor: ringResult.nextCursor, hasMore: Boolean(ringResult.nextCursor), viewerGeo: publicSessionGeoSummary(viewerGeo, body.lang || 'en'), effectiveViewerGeoSource: effectiveGeo.source, geoRingPriority: true, ringsHash: geoPlan.ringsHash, rings: ringResult.ringTrace.map((item) => ({ ringIndex: item.ringIndex, level: item.level, returned: item.returned, randomWithinRing: item.randomWithinRing })), queryShape: { collection: queryShape.collection, hint: queryShape.hint, limit: queryShape.limit, cursorDomain: queryShape.cursorDomain, geoRingPriority: true, ringRandomOrder: sort === 'random' } })
}

async function readForumMediaFeedPage({ request = null, input = {} } = {}) {
  const body = normalizeBody(input)
  const mode = normalizeMode(body.mode || 'geo')
  const sort = normalizeSort(body.sort || 'random')
  const seed = feedSeed(body.seed || body.randomSeed || body.feedSeed)
  const mediaKind = normalizeMediaKind(body.mediaKind || body.kind)
  const pageSize = clampPageSize('media', body.pageSize || body.limit)
  const cursorPayload = body.cursor ? await decodeCursor(MEDIA_CURSOR_DOMAIN, body.cursor) : null
  const effectiveGeo = await resolveEffectiveViewerGeo({ request, input: body })
  const viewerGeo = effectiveGeo.geo
  const geoPlan = buildFeedSelectionPlan({ mode, sort, geo: viewerGeo })
  const mapKey = buildFeedMapKey({ surface: 'media', mediaKind, mode, geoKey: viewerGeo.geoKey, ringsHash: geoPlan.ringsHash, sort, seed, lang: body.lang || 'en' })
  const db = await database()
  if (mode === 'world') {
    const plan = buildMediaPlan({ mode, mediaKind, sort, cursor: cursorMatchesMap(cursorPayload, mapKey) ? cursorPayload : null, pageSize, seed, ringIndex: 0 })
    const rowsRaw = await findRows(db, plan)
    const rows = orderRowsForFeed(await hydrateRowsWithThreadReplyCounts(db, await hydrateRowsWithPostCounters(db, rowsRaw)), `${seed}|world|media|${sort}`, 0, sort)
    const returnedRows = await hydrateRowsWithReplyMetadata(db, await hydrateRowsWithTopicPostTotals(db, await hydrateRowsWithTopicCounters(db, rows.slice(0, pageSize))))
    const items = returnedRows.map((row, index) => ({ ...buildPublicRow(row, 'media'), geoRank: null, __ql7FeedMapKey: mapKey.key, __ql7ServerFeedRank: index }))
    const nextCursor = await makeRandomNextCursor({ domain: MEDIA_CURSOR_DOMAIN, plan, rows, returnedRows, pageSize, sort, mapKey })
    return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-media-feed-page', source: 'mongo_projection_index', mode, sort, seed, feedMapKey: mapKey, mediaKind, pageSize, count: items.length, items, nextCursor, hasMore: Boolean(nextCursor), viewerGeo: publicSessionGeoSummary(viewerGeo, body.lang || 'en'), effectiveViewerGeoSource: effectiveGeo.source, queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain, geoRingPriority: false } })
  }
  const ringResult = await readRingPriorityPage({ db, domain: MEDIA_CURSOR_DOMAIN, rings: geoPlan.rings, pageSize, sort, seed, cursorPayload, mapKey, makePlan: ({ ring, previousKeys, cursor, pageSize: remaining, sort: innerSort, seed: innerSeed, ringIndex }) => buildMediaPlan({ mode, ring, previousKeys, mediaKind, cursor, pageSize: remaining, sort: innerSort, seed: innerSeed, ringIndex }) })
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, await hydrateRowsWithThreadReplyCounts(db, await hydrateRowsWithTopicPostTotals(db, await hydrateRowsWithTopicCounters(db, ringResult.returnedRows))))
  const items = hydratedRows.map((row, index) => ({ ...buildPublicRow(row, 'media'), geoRank: { ringIndex: Number.isFinite(Number(ringResult.returnedRowRingIndexes?.[index])) ? Number(ringResult.returnedRowRingIndexes[index]) : null }, __ql7FeedMapKey: mapKey.key, __ql7ServerFeedRank: index }))
  const queryShape = ringResult.queryShape || {}
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-media-feed-page', source: 'mongo_projection_index', mode, sort, seed, feedMapKey: mapKey, mediaKind, pageSize, count: items.length, items, nextCursor: ringResult.nextCursor, hasMore: Boolean(ringResult.nextCursor), viewerGeo: publicSessionGeoSummary(viewerGeo, body.lang || 'en'), effectiveViewerGeoSource: effectiveGeo.source, geoRingPriority: true, ringsHash: geoPlan.ringsHash, rings: ringResult.ringTrace.map((item) => ({ ringIndex: item.ringIndex, level: item.level, returned: item.returned, randomWithinRing: item.randomWithinRing })), queryShape: { collection: queryShape.collection, hint: queryShape.hint, limit: queryShape.limit, cursorDomain: queryShape.cursorDomain, geoRingPriority: true, ringRandomOrder: sort === 'random' } })
}

module.exports = { __setTestDb, readForumFeedPage, readForumMediaFeedPage, buildPublicRow, buildFeedMapKey, normalizeMode, normalizeSort, resolveEffectiveViewerGeo }
