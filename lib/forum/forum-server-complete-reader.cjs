// QL7_GEO111_FORUM_COMPLETE_SERVER_READER_V1
// Server read layer for search, threads, inbox, user branches, deep links, and projection snapshot bridge.
// ASCII-only source. Server-only projection reads.

const { getMongoDb } = require('../mongo/client.cjs');
const { sanitizePublicForumPayload } = require('./public-sanitize.cjs');
const { encodeSignedCursor, decodeSignedCursor } = require('./signed-cursor.cjs');
const {
  buildSearchPagePlan,
  buildThreadPagePlan,
  buildInboxRepliesPlan,
  buildUserPostsPlan,
  buildUserTopicsPlan,
  buildFeedPagePlan,
  clampPageSize,
} = require('../mongo/forum-indexes-primary.cjs');
const { resolveRequestGeo, publicSessionGeoSummary } = require('../geo/request-geo.cjs');
const { buildFeedSelectionPlan, normalizeGeoMode } = require('../geo/geo-rings.cjs');
const forumPrimary = require('../mongo/forum-primary.cjs');

const CURSOR_TTL_MS = 6 * 60 * 60 * 1000;
const DOMAIN_SEARCH = 'forum-search-v1';
const DOMAIN_THREAD = 'forum-thread-v1';
const DOMAIN_INBOX = 'forum-inbox-v1';
const DOMAIN_USER_POSTS = 'forum-user-posts-v1';
const DOMAIN_USER_TOPICS = 'forum-user-topics-v1';
const DOMAIN_TOPICS = 'forum-topics-v1';

let testDatabase = null;
function __setTestDb(db) { testDatabase = db || null; }
function str(value) { return String(value ?? '').trim(); }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)); } catch { return value; } }
function pick(obj, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  let cursor = obj;
  for (const part of parts) {
    if (cursor == null || typeof cursor !== 'object') return undefined;
    cursor = cursor[part];
  }
  return cursor;
}
async function database() {
  if (testDatabase) return testDatabase;
  const handle = await getMongoDb();
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle;
  if (!db || typeof db.collection !== 'function') throw new Error('ql7_forum_complete_reader_db_unavailable');
  return db;
}
function normalizeBody(input = {}) { return input && typeof input === 'object' ? input : {}; }
function escapeRegex(value) { return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalizeProfileSearchText(value) {
  return str(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 64);
}
function normalizeUserBranchSort(value) {
  const raw = str(value || 'new').toLowerCase();
  if (raw === 'reactions') return 'likes';
  return ['top', 'likes', 'views', 'replies'].includes(raw) ? raw : 'new';
}
function firstSortField(sort = {}) {
  for (const key of Object.keys(sort || {})) {
    if (!['postId', 'entityId', 'topicId'].includes(key)) return key;
  }
  return 'sort.new';
}
function idFieldForDomain(domain) {
  if (domain === DOMAIN_SEARCH) return 'entityId';
  if (domain === DOMAIN_USER_TOPICS) return 'topicId';
  return 'postId';
}
function replyCountFromPostAndCounters(post = {}, counters = {}) {
  return Math.max(
    num(post.replyCount, 0),
    num(post.repliesCount, 0),
    num(post.answersCount, 0),
    num(post.commentsCount, 0),
    num(post.replies, 0),
    num(counters.replyCount, 0),
    num(counters.repliesCount, 0),
    num(counters.answersCount, 0),
    num(counters.commentsCount, 0),
    num(counters.replies, 0),
    0,
  );
}
function hasAuthoritativePostCounters(row = {}, post = {}, counters = {}) {
  const source = str(row.__ql7CounterSource || post.__ql7CounterSource || counters.__ql7CounterSource || '');
  return Boolean(
    row.__ql7PostCountersCoreHydrated ||
    row.__ql7PostCountersThreadIndexHydrated ||
    row.__ql7InboxCountersReadFallback ||
    post.__ql7PostCountersCoreHydrated ||
    post.__ql7PostCountersThreadIndexHydrated ||
    post.__ql7InboxCountersReadFallback ||
    counters.__ql7PostCountersCoreHydrated ||
    counters.__ql7PostCountersThreadIndexHydrated ||
    counters.__ql7InboxCountersReadFallback ||
    source === 'forum_core_posts' ||
    source === 'forum_thread_index'
  );
}
function reactionCountFromPostAndCounters(post = {}, counters = {}) {
  return Math.max(
    0,
    num(post.reactions, 0),
    num(post.reactionCount, 0),
    num(counters.reactions, 0),
    num(counters.reactionCount, 0),
    Math.max(num(post.likes, 0), num(counters.likes, 0)) + Math.max(num(post.dislikes, 0), num(counters.dislikes, 0)),
  );
}
async function decodeCursorSafe(domain, raw) {
  if (!raw) return null;
  try { return await decodeSignedCursor(domain, raw); } catch { return null; }
}
async function makeNextCursor({ domain, plan, rows, returnedRows, pageSize, sort }) {
  if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null;
  const last = returnedRows[returnedRows.length - 1];
  const field = firstSortField(plan.sort);
  const idField = idFieldForDomain(domain);
  const id = str(last[idField] || last.postId || last.entityId || last.topicId || last._id);
  const value = pick(last, field);
  if (!id || value == null) return null;
  return encodeSignedCursor(domain, { after: { id, value, field }, pageSize, sort: str(sort || 'new') }, { ttlMs: CURSOR_TTL_MS });
}
async function findRows(db, plan) {
  const collection = db.collection(plan.collection);
  let cursor = collection.find(plan.query || {});
  if (cursor && typeof cursor.sort === 'function') cursor = cursor.sort(plan.sort || {});
  if (cursor && typeof cursor.limit === 'function') cursor = cursor.limit(Number(plan.limit || 1) + 1);
  if (cursor && typeof cursor.hint === 'function' && plan.hint) {
    try { cursor = cursor.hint(plan.hint); } catch {}
  }
  return cursor && typeof cursor.toArray === 'function' ? cursor.toArray() : [];
}
function publicPostFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? clone(row.post) : {};
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {};
  const authoritative = hasAuthoritativePostCounters(row, post, counters);
  const replyCount = Math.max(replyCountFromPostAndCounters(post, counters), authoritative ? 0 : num(sort.replies, 0));
  const likes = Math.max(num(post.likes, 0), num(counters.likes, 0));
  const dislikes = Math.max(num(post.dislikes, 0), num(counters.dislikes, 0));
  const reactions = reactionCountFromPostAndCounters(post, counters);
  const views = Math.max(num(post.views, 0), num(counters.views, 0), authoritative ? 0 : num(sort.views, 0));
  const out = {
    ...post,
    id: str(post.id || post.postId || row.postId || row.entityId || row._id),
    postId: str(post.postId || post.id || row.postId || row.entityId || row._id),
    topicId: str(post.topicId || row.topicId),
    parentId: post.parentId == null ? (row.parentId == null ? null : str(row.parentId)) : str(post.parentId),
    userId: str(post.userId || row.canonicalAuthorId),
    nickname: str(post.nickname || post.nick),
    icon: str(post.icon || post.avatar),
    text: str(post.text || post.body || post.textSnippet || row.text?.snippet || row.textSnippet),
    ts: num(post.ts || row.ts || row.sort?.new, 0),
    likes,
    dislikes,
    reactions,
    reactionCount: reactions,
    views,
    replies: replyCount,
    replyCount,
    repliesCount: replyCount,
    answersCount: replyCount,
    commentsCount: replyCount,
    __repliesCount: replyCount,
    counters: { likes, dislikes, reactions, views, replies: replyCount },
  };
  if (row.__ql7PostCountersCoreHydrated || post.__ql7PostCountersCoreHydrated) out.__ql7PostCountersCoreHydrated = true;
  if (row.__ql7PostCountersThreadIndexHydrated || post.__ql7PostCountersThreadIndexHydrated) out.__ql7PostCountersThreadIndexHydrated = true;
  if (row.__ql7InboxCountersReadFallback || post.__ql7InboxCountersReadFallback) out.__ql7InboxCountersReadFallback = true;
  if (row.__ql7CounterSource || post.__ql7CounterSource) out.__ql7CounterSource = str(row.__ql7CounterSource || post.__ql7CounterSource);
  for (const key of [
    '__ql7ServerFeedRank',
    '__ql7GeoFeedRank',
    '__ql7ServerFeedMode',
    '__ql7ServerFeedSort',
    '__ql7ServerFeedSurface',
  ]) {
    if (row[key] != null) out[key] = clone(row[key]);
    else if (post[key] != null) out[key] = clone(post[key]);
  }
  for (const key of [
    'parentPost',
    'parentAuthor',
    'parentText',
    '_parentText',
    'parentNickname',
    'parentAccountId',
    'parentUserId',
    'replyToPostId',
    'replyToAccountId',
    'replyToUserId',
    'replyToName',
    'replyToNickname',
    'replyToIcon',
    'replyToAuthor',
    'replyTarget',
    'replyTo',
  ]) {
    if (post[key] != null) out[key] = clone(post[key]);
  }
  const media = row.media && typeof row.media === 'object' ? row.media : null;
  if (media && str(media.url)) {
    out.mediaKind = str(media.kind);
    out.mediaUrl = str(media.url);
    if (media.kind === 'video') out.videoUrl = str(media.url);
    if (media.kind === 'image') out.imageUrl = str(media.url);
    if (media.kind === 'audio') out.audioUrl = str(media.url);
  }
  return sanitizePublicForumPayload(out);
}

function parentIdFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {};
  return str(post.parentId ?? row.parentId ?? '');
}

function parentMiniFromRow(row = {}) {
  if (!row || typeof row !== 'object') return null;
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  const id = str(post.id || post.postId || row.postId || row.entityId || row._id).replace(/^post:/, '');
  if (!id) return null;
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
  };
}

function decorateRowWithReplyMetadata(row = {}, parentMini = null) {
  const parentId = parentIdFromRow(row);
  if (!parentId || !parentMini) return row;
  const next = { ...row };
  const post = next.post && typeof next.post === 'object' ? clone(next.post) : {};
  const replyName = str(parentMini.nickname);
  const replyAccountId = str(parentMini.accountId || parentMini.userId || parentMini.canonicalAuthorId);
  post.parentPost = post.parentPost && typeof post.parentPost === 'object'
    ? { ...parentMini, ...post.parentPost, id: str(post.parentPost.id || post.parentPost.postId || parentMini.id), postId: str(post.parentPost.postId || post.parentPost.id || parentMini.postId) }
    : parentMini;
  post.parentText = str(post.parentText || post._parentText || parentMini.textSnippet || parentMini.text);
  post._parentText = str(post._parentText || post.parentText || parentMini.textSnippet || parentMini.text);
  post.parentAuthor = str(post.parentAuthor || replyName);
  post.parentNickname = str(post.parentNickname || replyName);
  post.parentAccountId = str(post.parentAccountId || replyAccountId);
  post.parentUserId = str(post.parentUserId || parentMini.userId || replyAccountId);
  post.replyToPostId = str(post.replyToPostId || parentMini.postId || parentId);
  post.replyToAccountId = str(post.replyToAccountId || replyAccountId);
  post.replyToUserId = str(post.replyToUserId || parentMini.userId || replyAccountId);
  post.replyToName = str(post.replyToName || replyName);
  post.replyToNickname = str(post.replyToNickname || replyName);
  post.replyToIcon = str(post.replyToIcon || parentMini.icon);
  post.replyToAuthor = post.replyToAuthor && typeof post.replyToAuthor === 'object'
    ? { ...parentMini, ...post.replyToAuthor }
    : {
        id: parentMini.id,
        postId: parentMini.postId,
        accountId: replyAccountId,
        userId: parentMini.userId || replyAccountId,
        nickname: replyName,
        icon: parentMini.icon,
      };
  next.post = post;
  return next;
}

async function hydrateRowsWithReplyMetadata(db, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const parentIds = Array.from(new Set(list.map(parentIdFromRow).filter(Boolean)));
  if (!parentIds.length) return list;
  const byId = new Map();
  const plans = [
    ['forum_thread_index', { postId: { $in: parentIds } }],
    ['forum_geo_feed_index', { postId: { $in: parentIds } }],
    ['forum_user_post_index', { postId: { $in: parentIds } }],
  ];
  for (const [collection, query] of plans) {
    const found = await db.collection(collection).find(query).limit(parentIds.length).toArray().catch(() => []);
    for (const row of found) {
      const mini = parentMiniFromRow(row);
      if (mini?.postId && !byId.has(mini.postId)) byId.set(mini.postId, mini);
    }
    if (byId.size >= parentIds.length) break;
  }
  if (byId.size < parentIds.length) {
    const missing = parentIds.filter((id) => !byId.has(id)).map((id) => `post:${id}`);
    if (missing.length) {
      const foundCore = await db.collection('forum_core_posts').find({ _id: { $in: missing } }).limit(missing.length).toArray().catch(() => []);
      for (const row of foundCore) {
        const mini = parentMiniFromRow(row);
        if (mini?.postId && !byId.has(mini.postId)) byId.set(mini.postId, mini);
      }
    }
  }
  if (!byId.size) return list;
  return list.map((row) => decorateRowWithReplyMetadata(row, byId.get(parentIdFromRow(row))));
}

const QL7_GEO777_INBOX_COUNTER_READ_FALLBACK_V1 = true;
function canonicalCounterShapeFromRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : (post.counters && typeof post.counters === 'object' ? post.counters : {});
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : (post.sort && typeof post.sort === 'object' ? post.sort : {});
  const authoritative = hasAuthoritativePostCounters(row, post, counters);
  const likes = Math.max(num(post.likes, 0), num(counters.likes, 0));
  const dislikes = Math.max(num(post.dislikes, 0), num(counters.dislikes, 0));
  const views = Math.max(num(post.views, 0), num(counters.views, 0), authoritative ? 0 : num(sort.views, 0));
  const replies = Math.max(replyCountFromPostAndCounters(post, counters), authoritative ? 0 : num(sort.replies, 0));
  const reactions = reactionCountFromPostAndCounters(post, counters);
  const top = Math.max(authoritative ? 0 : num(sort.top, 0), num(counters.top, 0), ((reactions * 2) + replies + Math.floor(views * 0.2)));
  return { likes, dislikes, reactions, views, replies, top };
}
function postRowId(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  return str(row.postId || row.sourcePostId || row.entityId || post.postId || post.id || row._id).replace(/^post:/, '');
}
function postCoreId(postId) {
  const id = str(postId);
  return id ? `post:${id}` : '';
}
function rowRepresentsPost(row = {}) {
  const kind = str(row.kind).toLowerCase();
  if (kind === 'topic') return false;
  if (kind === 'post') return true;
  return Boolean(row.postId || row.sourcePostId || row.parentId || (row.post && typeof row.post === 'object' && (row.post.postId || row.post.id)));
}
function mergePostRowCounters(row = {}, source = {}, marker = '__ql7PostCountersCoreHydrated', sourceName = 'forum_core_posts') {
  const baseShape = canonicalCounterShapeFromRow(row);
  const sourceShape = canonicalCounterShapeFromRow(source);
  const coreAuthoritative = sourceName === 'forum_core_posts';
  const threadRepliesAuthoritative = sourceName === 'forum_thread_index';
  const shape = {
    likes: coreAuthoritative ? sourceShape.likes : Math.max(baseShape.likes, sourceShape.likes),
    dislikes: coreAuthoritative ? sourceShape.dislikes : Math.max(baseShape.dislikes, sourceShape.dislikes),
    reactions: coreAuthoritative ? sourceShape.reactions : Math.max(baseShape.reactions, sourceShape.reactions),
    views: coreAuthoritative ? sourceShape.views : Math.max(baseShape.views, sourceShape.views),
    replies: (coreAuthoritative || threadRepliesAuthoritative) ? sourceShape.replies : Math.max(baseShape.replies, sourceShape.replies),
    top: coreAuthoritative ? sourceShape.top : Math.max(baseShape.top, sourceShape.top),
  };
  const basePost = row.post && typeof row.post === 'object' ? clone(row.post) : {};
  const postId = postRowId(row);
  const mergedPost = {
    ...basePost,
    id: str(basePost.id || basePost.postId || postId),
    postId: str(basePost.postId || basePost.id || postId),
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
      ...(basePost.counters && typeof basePost.counters === 'object' ? basePost.counters : {}),
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
      ...(basePost.sort && typeof basePost.sort === 'object' ? basePost.sort : {}),
      likes: shape.reactions,
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
    [marker]: true,
    __ql7CounterSource: sourceName,
  };
  return {
    ...row,
    counters: {
      ...(row.counters && typeof row.counters === 'object' ? row.counters : {}),
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
      ...(row.sort && typeof row.sort === 'object' ? row.sort : {}),
      likes: shape.reactions,
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
    post: mergedPost,
    [marker]: true,
    __ql7CounterSource: sourceName,
  };
}
async function hydratePostRowsWithCoreCounters(db, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = Array.from(new Set(list.filter(rowRepresentsPost).map(postRowId).filter(Boolean)));
  if (!ids.length) return list;
  const coreRows = await db.collection('forum_core_posts')
    .find({ $or: [{ _id: { $in: ids.map(postCoreId).filter(Boolean) } }, { id: { $in: ids } }, { postId: { $in: ids } }] })
    .limit(ids.length)
    .toArray()
    .catch(() => []);
  if (!coreRows.length) return list;
  const byId = new Map();
  for (const core of coreRows) {
    const post = core.post && typeof core.post === 'object' ? core.post : core;
    const id = str(post.id || post.postId || core.id || core.postId || core._id).replace(/^post:/, '');
    if (id && !byId.has(id)) byId.set(id, core);
  }
  return list.map((row) => {
    const source = byId.get(postRowId(row));
    return source ? mergePostRowCounters(row, source) : row;
  });
}

async function filterRowsWithExistingCorePosts(db, rows = [], options = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const requirePost = options?.requirePost !== false;
  const ids = Array.from(new Set(list.filter(rowRepresentsPost).map(postRowId).filter(Boolean)));
  if (!ids.length) return requirePost ? [] : list;
  const coreRows = await db.collection('forum_core_posts')
    .find({ _id: { $in: ids.map(postCoreId).filter(Boolean) } })
    .limit(ids.length)
    .toArray()
    .catch(() => []);
  const liveIds = new Set();
  for (const row of coreRows || []) {
    if (row?._del || row?.deleted || row?.visibility?.deleted === true) continue;
    const post = row.post && typeof row.post === 'object' ? row.post : row;
    const id = str(post.id || post.postId || row.id || row.postId || row._id).replace(/^post:/, '');
    if (id) liveIds.add(id);
  }
  const missingIds = ids.filter((id) => !liveIds.has(id));
  if (!missingIds.length) return list;
  const deleteEvents = await db.collection('forum_core_change_events').find({
    $or: [
      { id: { $in: missingIds } },
      { 'parsed.id': { $in: missingIds } },
      { 'parsed.deleted': { $in: missingIds } },
      { 'parsed.deletedPostIds': { $in: missingIds } },
    ],
  }).limit(Math.min(Math.max(missingIds.length * 6, 50), 1000)).toArray().catch(() => []);
  const deletedIds = new Set();
  for (const event of deleteEvents || []) {
    const parsed = event?.parsed && typeof event.parsed === 'object' ? event.parsed : {};
    const kind = str(parsed.kind || event.kind);
    const eventId = str(parsed.id || event.id);
    if ((parsed._del || kind === 'post_deleted') && eventId) deletedIds.add(eventId);
    for (const id of [
      ...(Array.isArray(parsed.deleted) ? parsed.deleted : []),
      ...(Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : []),
      ...(Array.isArray(parsed.deletedPosts) ? parsed.deletedPosts : []),
    ]) {
      const clean = str(id);
      if (clean) deletedIds.add(clean);
    }
  }
  if (!deletedIds.size) return list;
  return list.filter((row) => {
    if (!rowRepresentsPost(row)) return !requirePost;
    const id = postRowId(row);
    if (!id) return !requirePost;
    return liveIds.has(id) || !deletedIds.has(id);
  });
}

function hasInboxReplyAliases(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {};
  return ['replyCount', 'repliesCount', 'answersCount', 'commentsCount', 'replies'].some((key) => post[key] != null);
}
function rowNeedsInboxCounterHydration(row = {}) {
  const shape = canonicalCounterShapeFromRow(row);
  return !hasInboxReplyAliases(row) || (shape.likes === 0 && shape.dislikes === 0 && shape.views === 0 && shape.replies === 0);
}
function mergeInboxRowCounters(row = {}, source = {}) {
  return mergePostRowCounters(row, source, '__ql7InboxCountersReadFallback', 'projection_counter_fallback');
}
function sourceHasCounterEvidence(row = {}) {
  if (!row) return false;
  const shape = canonicalCounterShapeFromRow(row);
  return hasInboxReplyAliases(row) || shape.likes !== 0 || shape.dislikes !== 0 || shape.views !== 0 || shape.replies !== 0;
}
async function hydrateInboxRowsWithCanonicalCounters(db, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = Array.from(new Set(list.filter(rowNeedsInboxCounterHydration).map((row) => str(row.postId || row.sourcePostId || row.post?.postId || row.post?.id)).filter(Boolean)));
  if (!ids.length) return list;
  const sources = new Map();
  const plans = [
    ['forum_thread_index', { postId: { $in: ids } }],
    ['forum_geo_feed_index', { postId: { $in: ids } }],
    ['forum_user_post_index', { postId: { $in: ids } }],
    ['forum_search_index', { postId: { $in: ids }, kind: 'post' }],
  ];
  for (const [collection, query] of plans) {
    const rowsFromCollection = await db.collection(collection).find(query).limit(ids.length).toArray().catch(() => []);
    for (const row of rowsFromCollection) {
      const pid = str(row.postId || row.entityId || row.post?.postId || row.post?.id);
      if (!pid || sources.has(pid) || !sourceHasCounterEvidence(row)) continue;
      sources.set(pid, row);
    }
  }
  if (!sources.size) return list;
  return list.map((row) => {
    const pid = str(row.postId || row.sourcePostId || row.post?.postId || row.post?.id);
    const source = sources.get(pid);
    return source ? mergeInboxRowCounters(row, source) : row;
  });
}

async function hydratePostRowsWithThreadReplyCounts(db, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = Array.from(new Set(list.map(postRowId).filter(Boolean)));
  if (!ids.length) return list;
  const children = await db.collection('forum_thread_index')
    .find({ parentId: { $in: ids } })
    .limit(Math.min(Math.max(ids.length * 120, ids.length), 5000))
    .toArray()
    .catch(() => []);
  const byParent = new Map();
  for (const child of children || []) {
    if (child?.visibility?.deleted === true || child?._del || child?.deleted) continue;
    const parentId = str(child.parentId || child.post?.parentId);
    if (!parentId) continue;
    byParent.set(parentId, Number(byParent.get(parentId) || 0) + 1);
  }
  if (!byParent.size) return list;
  return list.map((row) => {
    const postId = postRowId(row);
    const replies = Number(byParent.get(postId) || 0);
    if (!postId || replies <= 0) return row;
    return mergePostRowCounters(
      row,
      { post: { id: postId, postId, replyCount: replies, repliesCount: replies, replies } },
      '__ql7PostCountersThreadIndexHydrated',
      'forum_thread_index',
    );
  });
}

function userPostAuthorCandidates(post = {}, row = {}) {
  return [
    row.canonicalAuthorId,
    row.accountId,
    row.userId,
    row.authorId,
    row.ownerId,
    row.uid,
    row.wallet,
    row.walletAddress,
    row.address,
    row.asherId,
    row.createdBy,
    row.createdByAccountId,
    row.profileAccountId,
    row.telegramId,
    row.telegramUserId,
    post.canonicalAuthorId,
    post.accountId,
    post.userId,
    post.authorId,
    post.ownerId,
    post.uid,
    post.wallet,
    post.walletAddress,
    post.address,
    post.asherId,
    post.createdBy,
    post.createdByAccountId,
    post.profileAccountId,
    post.telegramId,
    post.telegramUserId,
    post.author?.id,
    post.author?.accountId,
    post.author?.userId,
    post.author?.uid,
    post.author?.walletAddress,
  ].map(str).filter(Boolean);
}

function rowAuthorMatches(row = {}, identitySet = new Set()) {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  return userPostAuthorCandidates(post, row).some((id) => identitySet.has(id));
}

function userPostSortValue(row = {}, sort = 'new') {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const authoritative = hasAuthoritativePostCounters(row, post, counters);
  if (sort === 'likes' || sort === 'reactions') return Math.max(authoritative ? 0 : num(row.sort?.likes, 0), authoritative ? 0 : num(row.sort?.reactions, 0), reactionCountFromPostAndCounters(post, counters));
  if (sort === 'views') return Math.max(num(post.views, 0), num(counters.views, 0), authoritative ? 0 : num(row.sort?.views, 0));
  if (sort === 'replies') return replyCountFromPostAndCounters(post, counters);
  if (sort === 'top') {
    const reactions = reactionCountFromPostAndCounters(post, counters);
    const views = Math.max(num(post.views, 0), num(counters.views, 0), authoritative ? 0 : num(row.sort?.views, 0));
    const replies = replyCountFromPostAndCounters(post, counters);
    return Math.max(authoritative ? 0 : num(row.sort?.top, 0), num(counters.top, 0), ((reactions * 2) + replies + Math.floor(views * 0.2)));
  }
  return num(post.ts ?? row.ts ?? row.sort?.new, 0);
}

function userPostRowId(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  return str(row.postId || row.entityId || post.postId || post.id || row._id).replace(/^post:/, '');
}

function compareUserPostRows(sort = 'new') {
  return (a, b) => {
    const bv = userPostSortValue(b, sort);
    const av = userPostSortValue(a, sort);
    if (bv !== av) return bv - av;
    const bTs = userPostSortValue(b, 'new');
    const aTs = userPostSortValue(a, 'new');
    if (bTs !== aTs) return bTs - aTs;
    return userPostRowId(a).localeCompare(userPostRowId(b));
  };
}

function userPostRowAfterCursor(row = {}, cursorPayload = null, sort = 'new') {
  const after = cursorPayload && typeof cursorPayload === 'object' ? cursorPayload.after : null;
  if (!after || typeof after !== 'object') return true;
  const value = userPostSortValue(row, sort);
  const afterValue = after.value ?? after.ts ?? null;
  const id = userPostRowId(row);
  const afterId = str(after.id || after.postId);
  if (afterValue == null || !afterId || !id) return true;
  if (value < Number(afterValue)) return true;
  if (value > Number(afterValue)) return false;
  return id > afterId;
}

async function makeUserPostsNextCursor({ rows, returnedRows, pageSize, sort }) {
  if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null;
  const last = returnedRows[returnedRows.length - 1];
  const id = userPostRowId(last);
  if (!id) return null;
  const value = userPostSortValue(last, sort);
  return encodeSignedCursor(DOMAIN_USER_POSTS, { after: { id, value, field: `user.${normalizeUserBranchSort(sort)}` }, pageSize, sort: normalizeUserBranchSort(sort) }, { ttlMs: CURSOR_TTL_MS });
}

function normalizeThreadSurfaceSort(value) {
  const raw = str(value || 'new').toLowerCase();
  if (raw === 'reactions') return 'likes';
  if (raw === 'random') return 'new';
  return ['new', 'top', 'likes', 'views', 'replies'].includes(raw) ? raw : 'new';
}

function threadRowId(row = {}) {
  return postRowId(row);
}

function threadRowSortValue(row = {}, sort = 'new') {
  const safeSort = normalizeThreadSurfaceSort(sort);
  return userPostSortValue(row, safeSort);
}

function compareThreadRows(sort = 'new', priorityByPostId = null) {
  const safeSort = normalizeThreadSurfaceSort(sort);
  const priorityMap = priorityByPostId instanceof Map ? priorityByPostId : null;
  return (a, b) => {
    if (priorityMap) {
      const ar = priorityMap.get(threadRowId(a));
      const br = priorityMap.get(threadRowId(b));
      const ah = Number.isFinite(Number(ar));
      const bh = Number.isFinite(Number(br));
      if (ah || bh) {
        if (ah !== bh) return ah ? -1 : 1;
        if (Number(ar) !== Number(br)) return Number(ar) - Number(br);
      }
    }
    const bv = threadRowSortValue(b, safeSort);
    const av = threadRowSortValue(a, safeSort);
    if (bv !== av) return bv - av;
    const bTs = threadRowSortValue(b, 'new');
    const aTs = threadRowSortValue(a, 'new');
    if (bTs !== aTs) return bTs - aTs;
    return threadRowId(a).localeCompare(threadRowId(b));
  };
}

function threadRowAfterCursor(row = {}, cursorPayload = null, sort = 'new', rankByPostId = null) {
  const after = cursorPayload && typeof cursorPayload === 'object' ? cursorPayload.after : null;
  if (!after || typeof after !== 'object') return true;
  const id = threadRowId(row);
  const afterId = str(after.id || after.postId);
  const afterValue = after.value ?? after.ts ?? null;
  if (afterValue == null || !afterId || !id) return true;
  const field = str(after.field || '');
  if (field.startsWith('thread.rank.') && rankByPostId instanceof Map) {
    const value = Number(rankByPostId.get(id));
    if (!Number.isFinite(value)) return true;
    if (value > Number(afterValue)) return true;
    if (value < Number(afterValue)) return false;
    return id > afterId;
  }
  const value = threadRowSortValue(row, sort);
  if (value < Number(afterValue)) return true;
  if (value > Number(afterValue)) return false;
  return id > afterId;
}

async function makeThreadNextCursor({ rows, returnedRows, pageSize, sort, rankByPostId = null }) {
  if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null;
  const safeSort = normalizeThreadSurfaceSort(sort);
  const last = returnedRows[returnedRows.length - 1];
  const id = threadRowId(last);
  if (!id) return null;
  const rank = rankByPostId instanceof Map ? Number(rankByPostId.get(id)) : NaN;
  const field = Number.isFinite(rank) ? `thread.rank.${safeSort}` : `thread.${safeSort}`;
  const value = Number.isFinite(rank) ? rank : threadRowSortValue(last, safeSort);
  return encodeSignedCursor(DOMAIN_THREAD, { after: { id, value, field }, pageSize, sort: safeSort }, { ttlMs: CURSOR_TTL_MS });
}

function threadRowGeoKeys(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {};
  const keys = [
    ...(Array.isArray(row.geo?.scopeKeys) ? row.geo.scopeKeys : []),
    ...(Array.isArray(post.geo?.scopeKeys) ? post.geo.scopeKeys : []),
    row.geo?.scopeKey,
    post.geo?.scopeKey,
  ].map(str).filter(Boolean);
  if (!keys.includes('global')) keys.push('global');
  return Array.from(new Set(keys));
}

async function readThreadGeoPriorityRanks(rows = [], { mode = 'world', request = null } = {}) {
  if (normalizeGeoMode(mode) !== 'geo') return new Map();
  const viewerGeo = resolveRequestGeo(request || {}, { now: new Date() });
  const geoPlan = buildFeedSelectionPlan({ mode: 'geo', sort: 'new', geo: viewerGeo });
  const rings = Array.isArray(geoPlan?.rings) ? geoPlan.rings : [];
  if (!rings.length) return new Map();
  const priorities = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = threadRowId(row);
    if (!id) continue;
    const keys = new Set(threadRowGeoKeys(row));
    let priority = Number.POSITIVE_INFINITY;
    for (const ring of rings) {
      const ringKeys = Array.isArray(ring?.keys) ? ring.keys : [ring?.key];
      if (ringKeys.map(str).filter(Boolean).some((key) => keys.has(key))) {
        priority = Math.min(priority, Number.isFinite(Number(ring.priority)) ? Number(ring.priority) : 0);
      }
    }
    if (Number.isFinite(priority)) priorities.set(id, priority);
  }
  return priorities;
}

function decorateThreadRank(row = {}, { mode = 'world', sort = 'new', rank = 0 } = {}) {
  const safeMode = normalizeGeoMode(mode);
  const safeSort = normalizeThreadSurfaceSort(sort);
  const next = {
    ...row,
    __ql7ServerFeedRank: rank,
    __ql7ServerFeedMode: safeMode,
    __ql7ServerFeedSort: safeSort,
    __ql7ServerFeedSurface: 'thread',
  };
  if (next.post && typeof next.post === 'object') {
    next.post = {
      ...next.post,
      __ql7ServerFeedRank: rank,
      __ql7ServerFeedMode: safeMode,
      __ql7ServerFeedSort: safeSort,
      __ql7ServerFeedSurface: 'thread',
    };
    if (safeMode === 'geo') next.post.__ql7GeoFeedRank = rank;
    else delete next.post.__ql7GeoFeedRank;
  }
  if (safeMode === 'geo') next.__ql7GeoFeedRank = rank;
  else delete next.__ql7GeoFeedRank;
  return next;
}

function rowFromLoosePost(post = {}, canonicalAuthorId = '') {
  const source = post && typeof post === 'object' ? clone(post) : {};
  const postId = str(source.id || source.postId || source._id).replace(/^post:/, '');
  if (!postId || source._del || source.deleted || source.visibility?.deleted === true) return null;
  const likes = num(source.likes ?? source.counters?.likes, 0);
  const dislikes = num(source.dislikes ?? source.counters?.dislikes, 0);
  const reactions = reactionCountFromPostAndCounters(source, source.counters || {});
  const views = num(source.views ?? source.counters?.views, 0);
  const replies = replyCountFromPostAndCounters(source, source.counters || {});
  const ts = num(source.ts || source.createdAt || source.updatedAt, 0);
  const authorId = str(canonicalAuthorId || source.canonicalAuthorId || source.accountId || source.userId || source.authorId || source.ownerId || source.uid);
  const top = (reactions * 2) + replies + Math.floor(views * 0.2);
  return {
    _id: `${authorId || 'author'}:${postId}`,
    canonicalAuthorId: authorId,
    postId,
    topicId: str(source.topicId),
    parentId: source.parentId == null ? null : str(source.parentId),
    ts,
    counters: { likes, dislikes, reactions, views, replies, top },
    sort: { new: ts, likes: reactions, reactions, views, replies, top },
    visibility: { deleted: false },
    post: source,
    storagePrimary: 'mongo_loose_user_posts_fallback',
  };
}

function topicAuthorCandidates(topic = {}, row = {}) {
  return [
    row.canonicalAuthorId,
    row.accountId,
    row.userId,
    row.authorId,
    row.ownerId,
    row.uid,
    row.wallet,
    row.walletAddress,
    row.address,
    row.asherId,
    row.createdBy,
    row.createdByAccountId,
    row.profileAccountId,
    row.telegramId,
    row.telegramUserId,
    topic.canonicalAuthorId,
    topic.accountId,
    topic.userId,
    topic.authorId,
    topic.ownerId,
    topic.uid,
    topic.wallet,
    topic.walletAddress,
    topic.address,
    topic.asherId,
    topic.createdBy,
    topic.createdByAccountId,
    topic.profileAccountId,
    topic.telegramId,
    topic.telegramUserId,
    topic.author?.id,
    topic.author?.accountId,
    topic.author?.userId,
    topic.author?.uid,
    topic.author?.walletAddress,
  ].map(str).filter(Boolean);
}

function rowTopicAuthorMatches(row = {}, identitySet = new Set()) {
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : row;
  return topicAuthorCandidates(topic, row).some((id) => identitySet.has(id));
}

function topicRowId(row = {}) {
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : row;
  return str(row.topicId || row.entityId || topic.topicId || topic.id || row._id).replace(/^topic:/, '');
}

function topicSortValue(row = {}, sort = 'new') {
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : row;
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const authoritative = Boolean(
    row.__ql7TopicCountersCoreHydrated ||
    row.__ql7TopicCountersPostTotalsHydrated ||
    topic.__ql7TopicCountersCoreHydrated ||
    topic.__ql7TopicCountersPostTotalsHydrated ||
    counters.__ql7TopicCountersCoreHydrated ||
    counters.__ql7TopicCountersPostTotalsHydrated ||
    String(row.__ql7CounterSource || topic.__ql7CounterSource || counters.__ql7CounterSource || '').trim()
  );
  if (sort === 'likes' || sort === 'reactions') return Math.max(
    authoritative ? 0 : num(row.sort?.likes, 0),
    authoritative ? 0 : num(row.sort?.reactions, 0),
    authoritative ? 0 : num(row.sort?.reactionCount, 0),
    num(topic.likes, 0),
    num(topic.reactions, 0),
    num(topic.reactionCount, 0),
    num(counters.likes, 0),
    num(counters.reactions, 0),
    num(counters.reactionCount, 0),
  );
  if (sort === 'views') return Math.max(authoritative ? 0 : num(row.sort?.views, 0), num(topic.views ?? counters.views, 0));
  if (sort === 'replies') return Math.max(authoritative ? 0 : num(row.sort?.replies, 0), num(topic.postsCount ?? topic.replies ?? topic.repliesCount ?? counters.posts ?? counters.replies, 0));
  if (sort === 'top') {
    const likes = topicSortValue(row, 'likes');
    const views = topicSortValue(row, 'views');
    const replies = topicSortValue(row, 'replies');
    return Math.max(authoritative ? 0 : num(row.sort?.top, 0), (likes * 2) + replies + Math.floor(views * 0.2));
  }
  return num(topic.ts ?? row.ts ?? row.sort?.new, 0);
}

function compareTopicRows(sort = 'new') {
  return (a, b) => {
    const bv = topicSortValue(b, sort);
    const av = topicSortValue(a, sort);
    if (bv !== av) return bv - av;
    const bTs = topicSortValue(b, 'new');
    const aTs = topicSortValue(a, 'new');
    if (bTs !== aTs) return bTs - aTs;
    return topicRowId(a).localeCompare(topicRowId(b));
  };
}

function topicRowAfterCursor(row = {}, cursorPayload = null, sort = 'new') {
  const after = cursorPayload && typeof cursorPayload === 'object' ? cursorPayload.after : null;
  if (!after || typeof after !== 'object') return true;
  const value = topicSortValue(row, sort);
  const afterValue = after.value ?? after.ts ?? null;
  const id = topicRowId(row);
  const afterId = str(after.id || after.topicId);
  if (afterValue == null || !afterId || !id) return true;
  if (value < Number(afterValue)) return true;
  if (value > Number(afterValue)) return false;
  return id > afterId;
}

async function makeUserTopicsNextCursor({ rows, returnedRows, pageSize, sort }) {
  if (!Array.isArray(rows) || rows.length <= pageSize || !returnedRows.length) return null;
  const last = returnedRows[returnedRows.length - 1];
  const id = topicRowId(last);
  if (!id) return null;
  const value = topicSortValue(last, sort);
  return encodeSignedCursor(DOMAIN_USER_TOPICS, { after: { id, value, field: `userTopic.${normalizeUserBranchSort(sort)}` }, pageSize, sort: normalizeUserBranchSort(sort) }, { ttlMs: CURSOR_TTL_MS });
}

function rowFromLooseTopic(topic = {}, canonicalAuthorId = '') {
  const source = topic && typeof topic === 'object' ? clone(topic) : {};
  const topicId = str(source.id || source.topicId || source._id).replace(/^topic:/, '');
  if (!topicId || source._del || source.deleted || source.visibility?.deleted === true) return null;
  const likes = Math.max(
    num(source.likes, 0),
    num(source.reactions, 0),
    num(source.reactionCount, 0),
    num(source.counters?.likes, 0),
    num(source.counters?.reactions, 0),
    num(source.counters?.reactionCount, 0),
  );
  const dislikes = num(source.dislikes ?? source.counters?.dislikes, 0);
  const views = num(source.views ?? source.counters?.views, 0);
  const posts = num(source.postsCount ?? source.replies ?? source.repliesCount ?? source.counters?.posts ?? source.counters?.replies, 0);
  const ts = num(source.ts || source.createdAt || source.updatedAt, 0);
  const authorId = str(canonicalAuthorId || source.canonicalAuthorId || source.accountId || source.userId || source.authorId || source.ownerId || source.uid);
  const top = (likes * 2) + posts + Math.floor(views * 0.2);
  return {
    _id: `${authorId || 'author'}:${topicId}`,
    canonicalAuthorId: authorId,
    topicId,
    ts,
    counters: { posts, replies: posts, repliesCount: posts, likes, reactions: likes, reactionCount: likes, dislikes, views, top },
    sort: { new: ts, posts, replies: posts, likes, reactions: likes, reactionCount: likes, views, top },
    visibility: { deleted: false },
    topic: source,
    storagePrimary: 'mongo_loose_user_topics_fallback',
  };
}

async function readLegacySnapshotPayload(db) {
  const doc = await db.collection('forum_core_snapshot').findOne({ _id: 'forum:snapshot' }).catch(() => null);
  const parsed = doc?.parsed && typeof doc.parsed === 'object' ? doc.parsed : null;
  if (parsed?.payload && typeof parsed.payload === 'object') return parsed.payload;
  if (doc?.raw) {
    try {
      const raw = JSON.parse(String(doc.raw));
      if (raw?.payload && typeof raw.payload === 'object') return raw.payload;
    } catch {}
  }
  return { posts: [] };
}

async function readLooseUserPostRows(db, identityIds = []) {
  const identitySet = new Set((Array.isArray(identityIds) ? identityIds : []).map(str).filter(Boolean));
  if (!identitySet.size) return [];
  const ids = Array.from(identitySet);
  const authorOr = [
    { userId: { $in: ids } },
    { accountId: { $in: ids } },
    { canonicalAuthorId: { $in: ids } },
    { authorId: { $in: ids } },
    { ownerId: { $in: ids } },
    { uid: { $in: ids } },
    { wallet: { $in: ids } },
    { walletAddress: { $in: ids } },
    { address: { $in: ids } },
    { asherId: { $in: ids } },
    { createdBy: { $in: ids } },
    { createdByAccountId: { $in: ids } },
    { profileAccountId: { $in: ids } },
    { telegramId: { $in: ids } },
    { telegramUserId: { $in: ids } },
    { 'post.userId': { $in: ids } },
    { 'post.accountId': { $in: ids } },
    { 'post.canonicalAuthorId': { $in: ids } },
    { 'post.authorId': { $in: ids } },
    { 'post.ownerId': { $in: ids } },
    { 'post.uid': { $in: ids } },
    { 'post.wallet': { $in: ids } },
    { 'post.walletAddress': { $in: ids } },
    { 'post.address': { $in: ids } },
    { 'post.asherId': { $in: ids } },
    { 'post.createdBy': { $in: ids } },
    { 'post.createdByAccountId': { $in: ids } },
    { 'post.profileAccountId': { $in: ids } },
    { 'post.telegramId': { $in: ids } },
    { 'post.telegramUserId': { $in: ids } },
    { 'post.author.id': { $in: ids } },
    { 'post.author.accountId': { $in: ids } },
    { 'post.author.userId': { $in: ids } },
    { 'post.author.uid': { $in: ids } },
    { 'post.author.walletAddress': { $in: ids } },
  ];
  const coreRows = await db.collection('forum_core_posts')
    .find({ _del: { $ne: 1 }, $or: authorOr })
    .limit(600)
    .toArray()
    .catch(() => []);
  const snapshot = await readLegacySnapshotPayload(db).catch(() => ({ posts: [] }));
  const snapshotPosts = Array.isArray(snapshot?.posts) ? snapshot.posts : [];
  const rows = [];
  for (const raw of coreRows || []) {
    const post = raw?.post && typeof raw.post === 'object' ? raw.post : raw;
    const authorId = userPostAuthorCandidates(post, raw).find((id) => identitySet.has(id)) || '';
    const row = rowFromLoosePost(post, authorId);
    if (row && rowAuthorMatches(row, identitySet)) rows.push(row);
  }
  for (const post of snapshotPosts) {
    const row = rowFromLoosePost(post);
    if (row && rowAuthorMatches(row, identitySet)) rows.push(row);
  }
  return rows;
}

function mergeUserPostRowsByPostId(rows = []) {
  const byId = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const postId = userPostRowId(row);
    if (!postId || row?.visibility?.deleted === true) continue;
    const prev = byId.get(postId);
    if (!prev) {
      byId.set(postId, row);
      continue;
    }
    const prevPost = prev.post && typeof prev.post === 'object' ? prev.post : {};
    const rowPost = row.post && typeof row.post === 'object' ? row.post : {};
    byId.set(postId, {
      ...prev,
      ...row,
      counters: { ...(prev.counters || {}), ...(row.counters || {}) },
      sort: { ...(prev.sort || {}), ...(row.sort || {}) },
      post: { ...prevPost, ...rowPost },
    });
  }
  return Array.from(byId.values());
}

async function resolveUserBranchIdentityIds(db, userId) {
  const seed = str(userId);
  if (!seed) return [];
  const ids = await forumPrimary.getLinkedIdentityIds(db, seed).catch(() => []);
  return Array.from(new Set([seed, ...(Array.isArray(ids) ? ids : [])].map(str).filter(Boolean)));
}

async function readUserBranchStatsPostTotal(db, identityIds = []) {
  const ids = Array.from(new Set((Array.isArray(identityIds) ? identityIds : []).map(str).filter(Boolean)));
  if (!ids.length) return 0;
  const query = {
    $or: [
      { _id: { $in: ids } },
      { canonicalAuthorId: { $in: ids } },
      { accountId: { $in: ids } },
      { userId: { $in: ids } },
    ],
  };
  const rows = await db.collection('forum_user_stats').find(query).limit(Math.max(ids.length, 500)).toArray().catch(() => []);
  let total = 0;
  for (const row of rows || []) {
    total = Math.max(
      total,
      num(row?.stats?.posts, 0),
      num(row?.postsCount, 0),
      num(row?.posts, 0),
      num(row?.counts?.posts, 0),
    );
  }
  return total;
}

async function readUserBranchStatsTopicTotal(db, identityIds = []) {
  const ids = Array.from(new Set((Array.isArray(identityIds) ? identityIds : []).map(str).filter(Boolean)));
  if (!ids.length) return 0;
  const query = {
    $or: [
      { _id: { $in: ids } },
      { canonicalAuthorId: { $in: ids } },
      { accountId: { $in: ids } },
      { userId: { $in: ids } },
    ],
  };
  const rows = await db.collection('forum_user_stats').find(query).limit(Math.max(ids.length, 500)).toArray().catch(() => []);
  let total = 0;
  for (const row of rows || []) {
    total = Math.max(
      total,
      num(row?.stats?.topics, 0),
      num(row?.topicsCount, 0),
      num(row?.topics, 0),
      num(row?.counts?.topics, 0),
    );
  }
  return total;
}

async function readLooseUserTopicRows(db, identityIds = []) {
  const identitySet = new Set((Array.isArray(identityIds) ? identityIds : []).map(str).filter(Boolean));
  if (!identitySet.size) return [];
  const ids = Array.from(identitySet);
  const authorOr = [
    { userId: { $in: ids } },
    { accountId: { $in: ids } },
    { canonicalAuthorId: { $in: ids } },
    { authorId: { $in: ids } },
    { ownerId: { $in: ids } },
    { uid: { $in: ids } },
    { wallet: { $in: ids } },
    { walletAddress: { $in: ids } },
    { address: { $in: ids } },
    { asherId: { $in: ids } },
    { createdBy: { $in: ids } },
    { createdByAccountId: { $in: ids } },
    { profileAccountId: { $in: ids } },
    { telegramId: { $in: ids } },
    { telegramUserId: { $in: ids } },
    { 'topic.userId': { $in: ids } },
    { 'topic.accountId': { $in: ids } },
    { 'topic.canonicalAuthorId': { $in: ids } },
    { 'topic.authorId': { $in: ids } },
    { 'topic.ownerId': { $in: ids } },
    { 'topic.uid': { $in: ids } },
    { 'topic.wallet': { $in: ids } },
    { 'topic.walletAddress': { $in: ids } },
    { 'topic.address': { $in: ids } },
    { 'topic.asherId': { $in: ids } },
    { 'topic.createdBy': { $in: ids } },
    { 'topic.createdByAccountId': { $in: ids } },
    { 'topic.profileAccountId': { $in: ids } },
    { 'topic.telegramId': { $in: ids } },
    { 'topic.telegramUserId': { $in: ids } },
    { 'topic.author.id': { $in: ids } },
    { 'topic.author.accountId': { $in: ids } },
    { 'topic.author.userId': { $in: ids } },
    { 'topic.author.uid': { $in: ids } },
    { 'topic.author.walletAddress': { $in: ids } },
  ];
  const coreRows = await db.collection('forum_core_topics')
    .find({ _del: { $ne: 1 }, $or: authorOr })
    .limit(600)
    .toArray()
    .catch(() => []);
  const rows = [];
  for (const raw of coreRows || []) {
    const topic = raw?.topic && typeof raw.topic === 'object' ? raw.topic : raw;
    const authorId = topicAuthorCandidates(topic, raw).find((id) => identitySet.has(id)) || '';
    const row = rowFromLooseTopic(topic, authorId);
    if (row && rowTopicAuthorMatches(row, identitySet)) rows.push(row);
  }
  return rows;
}

function mergeTopicRowsByTopicId(rows = []) {
  const byId = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const topicId = topicRowId(row);
    if (!topicId || row?.visibility?.deleted === true) continue;
    const prev = byId.get(topicId);
    if (!prev) {
      byId.set(topicId, row);
      continue;
    }
    const prevTopic = prev.topic && typeof prev.topic === 'object' ? prev.topic : {};
    const rowTopic = row.topic && typeof row.topic === 'object' ? row.topic : {};
    byId.set(topicId, {
      ...prev,
      ...row,
      counters: { ...(prev.counters || {}), ...(row.counters || {}) },
      sort: { ...(prev.sort || {}), ...(row.sort || {}) },
      topic: { ...prevTopic, ...rowTopic },
    });
  }
  return Array.from(byId.values());
}

function topicCoreId(topicId) {
  const id = str(topicId);
  return id ? `topic:${id}` : '';
}

function mergeTopicRowWithCore(row = {}, core = null) {
  if (!core || typeof core !== 'object') return row;
  const coreTopic = core.topic && typeof core.topic === 'object' ? core.topic : core;
  const rowIsPost = Boolean(row?.postId || str(row?.kind).toLowerCase() === 'post' || (row?.post && typeof row.post === 'object' && (row.post.postId || row.post.id)));
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {};
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : {};
  const posts = Math.max(num(coreTopic.postsCount, 0), num(coreTopic.replies, 0), num(coreTopic.repliesCount, 0));
  const likes = Math.max(
    num(coreTopic.likes, 0),
    num(coreTopic.reactions, 0),
    num(coreTopic.reactionCount, 0),
  );
  const dislikes = num(coreTopic.dislikes, 0);
  const views = num(coreTopic.views, 0);
  const nextTopic = {
    ...topic,
    ...coreTopic,
    id: str(topic.id || topic.topicId || coreTopic.id || coreTopic.topicId || row.topicId || row.entityId || row._id).replace(/^topic:/, ''),
    topicId: str(topic.topicId || topic.id || coreTopic.topicId || coreTopic.id || row.topicId || row.entityId || row._id).replace(/^topic:/, ''),
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
  };
  if (rowIsPost) {
    return {
      ...row,
      __ql7TopicCountersCoreHydrated: true,
      topic: nextTopic,
    };
  }
  return {
    ...row,
    __ql7TopicCountersCoreHydrated: true,
    __ql7CounterSource: 'forum_core_topics',
    counters: { ...counters, posts, replies: posts, repliesCount: posts, likes, reactions: likes, reactionCount: likes, dislikes, views },
    sort: { ...sort, posts, replies: posts, likes, reactions: likes, reactionCount: likes, views, top: Math.max(num(sort.top, 0), (likes * 2) + posts + Math.floor(views * 0.2)) },
    topic: nextTopic,
  };
}

async function hydrateTopicRowsWithCoreCounters(db, rows = []) {
  const ids = Array.from(new Set((Array.isArray(rows) ? rows : []).map(topicRowId).filter(Boolean)));
  if (!ids.length) return rows;
  const coreRows = await db.collection('forum_core_topics')
    .find({ $or: [{ _id: { $in: ids.map(topicCoreId).filter(Boolean) } }, { id: { $in: ids } }, { topicId: { $in: ids } }] })
    .limit(ids.length)
    .toArray()
    .catch(() => []);
  if (!coreRows.length) return rows;
  const byId = new Map();
  for (const core of coreRows) {
    const coreTopic = core.topic && typeof core.topic === 'object' ? core.topic : core;
    const id = str(coreTopic.id || coreTopic.topicId || core.id || core.topicId || core._id).replace(/^topic:/, '');
    if (id && !byId.has(id)) byId.set(id, core);
  }
  return (Array.isArray(rows) ? rows : []).map((row) => mergeTopicRowWithCore(row, byId.get(topicRowId(row))));
}

function postTopicId(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : row;
  return str(row.topicId || post.topicId || row.topic?.topicId || row.topic?.id).replace(/^topic:/, '');
}

function isDeletedForumRow(row = {}) {
  const post = row.post && typeof row.post === 'object' ? row.post : {};
  return Boolean(row?._del || row?.deleted || row?.visibility?.deleted === true || post?._del || post?.deleted || post?.visibility?.deleted === true);
}

function addTopicPostTotal(totalsByTopic, seenPostIds, row = {}) {
  if (!row || typeof row !== 'object' || isDeletedForumRow(row)) return;
  const topicId = postTopicId(row);
  if (!topicId) return;
  const postId = postRowId(row);
  const seenKey = postId ? `${topicId}:${postId}` : `${topicId}:${str(row._id || row.entityId)}`;
  if (!seenKey || seenPostIds.has(seenKey)) return;
  seenPostIds.add(seenKey);
  const shape = canonicalCounterShapeFromRow(row);
  const current = totalsByTopic.get(topicId) || { posts: 0, likes: 0, dislikes: 0, views: 0 };
  current.posts += 1;
  current.likes += Math.max(shape.reactions, shape.likes + shape.dislikes);
  current.dislikes += shape.dislikes;
  current.views += shape.views;
  totalsByTopic.set(topicId, current);
}

function mergeTopicRowWithPostTotals(row = {}, totals = null) {
  if (!totals || typeof totals !== 'object') return row;
  const rowIsPost = Boolean(row?.postId || str(row?.kind).toLowerCase() === 'post' || (row?.post && typeof row.post === 'object' && (row.post.postId || row.post.id)));
  const topic = row.topic && typeof row.topic === 'object' ? row.topic : {};
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const coreAuthoritative = Boolean(
    row.__ql7TopicCountersCoreHydrated ||
    topic.__ql7TopicCountersCoreHydrated ||
    counters.__ql7TopicCountersCoreHydrated ||
    str(row.__ql7CounterSource || topic.__ql7CounterSource || counters.__ql7CounterSource).includes('forum_core_topics')
  );
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {};
  const topicCounters = topic.counters && typeof topic.counters === 'object' ? topic.counters : {};
  const topicSort = topic.sort && typeof topic.sort === 'object' ? topic.sort : {};
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
  );
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
  );
  const existingDislikes = Math.max(
    num(topic.dislikes, 0),
    num(topicCounters.dislikes, 0),
    rowIsPost ? 0 : num(counters.dislikes, 0),
    num(topicSort.dislikes, 0),
    rowIsPost ? 0 : num(sort.dislikes, 0),
  );
  const existingViews = Math.max(
    num(topic.views, 0),
    num(topicCounters.views, 0),
    rowIsPost ? 0 : num(counters.views, 0),
    num(topicSort.views, 0),
    rowIsPost ? 0 : num(sort.views, 0),
  );
  const posts = Math.max(0, coreAuthoritative ? existingPosts : 0, num(totals.posts, 0));
  const likes = Math.max(0, coreAuthoritative ? existingLikes : 0, num(totals.likes, 0));
  const dislikes = Math.max(0, coreAuthoritative ? existingDislikes : 0, num(totals.dislikes, 0));
  const views = Math.max(0, coreAuthoritative ? existingViews : 0, num(totals.views, 0));
  const top = (likes * 2) + posts + Math.floor(views * 0.2);
  const id = str(topic.id || topic.topicId || row.topicId || row.entityId || row._id).replace(/^topic:/, '');
  const sourceName = coreAuthoritative ? 'forum_core_topics' : 'topic_post_totals';
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
  };
  if (rowIsPost) {
    return {
      ...row,
      __ql7TopicCountersPostTotalsHydrated: true,
      topic: nextTopic,
    };
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
  };
}

async function hydrateTopicRowsWithPostTotals(db, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = Array.from(new Set(list.map(topicRowId).filter(Boolean)));
  if (!ids.length) return list;
  const query = { $or: [{ topicId: { $in: ids } }, { 'post.topicId': { $in: ids } }, { 'topic.topicId': { $in: ids } }, { 'topic.id': { $in: ids } }] };
  const limit = Math.min(Math.max(ids.length * 800, 1200), 20000);
  const totalsByTopic = new Map();
  const seenPostIds = new Set();
  for (const collection of ['forum_core_posts', 'forum_thread_index']) {
    const rowsForTopics = await db.collection(collection).find(query).limit(limit).toArray().catch(() => []);
    for (const row of rowsForTopics || []) addTopicPostTotal(totalsByTopic, seenPostIds, row);
  }
  if (!totalsByTopic.size) return list;
  return list.map((row) => mergeTopicRowWithPostTotals(row, totalsByTopic.get(topicRowId(row))));
}

function publicTopicFromRow(row = {}) {
  const topic = row.topic && typeof row.topic === 'object' ? clone(row.topic) : {};
  const counters = row.counters && typeof row.counters === 'object' ? row.counters : {};
  const sort = row.sort && typeof row.sort === 'object' ? row.sort : {};
  const authoritative = Boolean(
    row.__ql7TopicCountersCoreHydrated ||
    row.__ql7TopicCountersPostTotalsHydrated ||
    topic.__ql7TopicCountersCoreHydrated ||
    topic.__ql7TopicCountersPostTotalsHydrated ||
    counters.__ql7TopicCountersCoreHydrated ||
    counters.__ql7TopicCountersPostTotalsHydrated ||
    String(row.__ql7CounterSource || topic.__ql7CounterSource || counters.__ql7CounterSource || '').trim()
  );
  const postCount = Math.max(
    num(topic.postsCount, 0),
    num(topic.replies, 0),
    num(topic.repliesCount, 0),
    num(counters.posts, 0),
    num(counters.replies, 0),
    num(counters.repliesCount, 0),
    authoritative ? 0 : num(sort.posts, 0),
    authoritative ? 0 : num(sort.replies, 0),
    authoritative ? 0 : num(sort.repliesCount, 0),
  );
  const likes = Math.max(
    num(topic.likes, 0),
    num(topic.reactions, 0),
    num(topic.reactionCount, 0),
    num(counters.likes, 0),
    num(counters.reactions, 0),
    num(counters.reactionCount, 0),
    authoritative ? 0 : num(sort.likes, 0),
    authoritative ? 0 : num(sort.reactions, 0),
    authoritative ? 0 : num(sort.reactionCount, 0),
  );
  const dislikes = Math.max(num(topic.dislikes, 0), num(counters.dislikes, 0), authoritative ? 0 : num(sort.dislikes, 0));
  const views = Math.max(num(topic.views, 0), num(counters.views, 0), authoritative ? 0 : num(sort.views, 0));
  const out = {
    ...topic,
    id: str(topic.id || topic.topicId || row.topicId || row.entityId || row._id),
    topicId: str(topic.topicId || topic.id || row.topicId || row.entityId || row._id),
    title: str(topic.title || row.title),
    description: str(topic.description || topic.descriptionSnippet || row.descriptionSnippet),
    userId: str(topic.userId || row.canonicalAuthorId),
    nickname: str(topic.nickname || topic.nick),
    icon: str(topic.icon || topic.avatar),
    ts: num(topic.ts || row.ts || row.sort?.new, 0),
    likes,
    reactions: likes,
    reactionCount: likes,
    dislikes,
    views,
    postsCount: postCount,
    replies: postCount,
    repliesCount: postCount,
  };
  if (row.__ql7TopicCountersCoreHydrated || topic.__ql7TopicCountersCoreHydrated) out.__ql7TopicCountersCoreHydrated = true;
  if (row.__ql7TopicCountersPostTotalsHydrated || topic.__ql7TopicCountersPostTotalsHydrated) out.__ql7TopicCountersPostTotalsHydrated = true;
  if (row.__ql7CounterSource || topic.__ql7CounterSource) out.__ql7CounterSource = str(row.__ql7CounterSource || topic.__ql7CounterSource);
  return sanitizePublicForumPayload(out);
}
function publicResultRow(row = {}, surface = 'generic') {
  const kind = str(row.kind || (row.topicId && !row.postId ? 'topic' : 'post'));
  const entity = kind === 'topic' ? publicTopicFromRow(row) : publicPostFromRow(row);
  const out = {
    id: str(row.entityId || entity.id || row.postId || row.topicId || row._id),
    entityId: str(row.entityId || entity.id || row.postId || row.topicId || row._id),
    kind,
    score: num(row.sort?.relevance ?? row.sort?.top ?? row.sort?.new, 0),
    open: row.open && typeof row.open === 'object' ? clone(row.open) : undefined,
    topicId: str(row.topicId || entity.topicId),
    postId: str(row.postId || (kind === 'post' ? entity.id : '')),
    surface,
    item: entity,
  };
  return sanitizePublicForumPayload(out);
}
function publicPersonFromProfileRow(row = {}) {
  const profile = row.profile && typeof row.profile === 'object' ? row.profile : row;
  const id = str(
    profile.canonicalAccountId ||
    profile.accountId ||
    row.canonicalAccountId ||
    profile.userId ||
    row.accountId ||
    row.userId ||
    row.ownerUserId ||
    row.member ||
    row._id
  ).replace(/^profile:/, '');
  const nickname = str(
    profile.nickname ||
    profile.nick ||
    profile.canonicalNickname ||
    profile.displayName ||
    profile.name ||
    row.nickname ||
    row.normalizedNick ||
    row.value
  );
  const icon = str(profile.icon || profile.avatar || profile.pIcon || profile.photoUrl || row.icon || row.avatar);
  return sanitizePublicForumPayload({
    id,
    entityId: id,
    kind: 'person',
    userId: id,
    accountId: id,
    nickname,
    nick: nickname,
    icon,
    avatar: icon,
    vipActive: Boolean(profile.vipActive || profile.isVip || profile.vip),
    isVip: Boolean(profile.vipActive || profile.isVip || profile.vip),
    vip: profile.vip,
    vipUntil: profile.vipUntil,
    stats: profile.stats && typeof profile.stats === 'object' ? clone(profile.stats) : undefined,
    sourceKind: 'mongo_profile_search',
  });
}
function personProfileId(row = {}) {
  return str(row.canonicalAccountId || row.accountId || row.userId || row.ownerUserId || row.member || row._id).replace(/^profile:/, '');
}
function profileCandidateKeys(profile = {}) {
  return [profile.accountId, profile.canonicalAccountId, profile.userId, str(profile._id).replace(/^profile:/, '')].map(str).filter(Boolean);
}
function normalizePersonIdentityId(value) {
  return str(value).replace(/^profile:/, '');
}
function addPersonIdentityVariants(target, raw) {
  const value = normalizePersonIdentityId(raw);
  if (!value) return;
  target.add(value);
  const lower = value.toLowerCase();
  if (lower && lower !== value) target.add(lower);
  if (/^0x[a-f0-9]{40}$/i.test(value)) {
    target.add(lower);
    target.add(`wallet:${lower}`);
  } else if (/^wallet:0x[a-f0-9]{40}$/i.test(value)) {
    const address = value.slice('wallet:'.length);
    target.add(address);
    target.add(address.toLowerCase());
    target.add(`wallet:${address.toLowerCase()}`);
  }
  const telegramPrefixes = ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:'];
  let stripped = value;
  for (const prefix of telegramPrefixes) {
    if (lower.startsWith(prefix)) {
      stripped = value.slice(prefix.length);
      break;
    }
  }
  if (stripped && stripped !== value) target.add(stripped);
  if (/^\d+$/.test(stripped)) {
    target.add(`telegram:${stripped}`);
    target.add(`telegramid:${stripped}`);
    target.add(`telegram:id:${stripped}`);
    target.add(`tguid:${stripped}`);
    target.add(`tg:${stripped}`);
  }
}
function personIdentityKeys(row = {}, profile = {}) {
  return [
    row.accountId,
    row.canonicalAccountId,
    row.userId,
    row.ownerUserId,
    row.member,
    row.alias,
    row.aliasId,
    row.aliasValue,
    row._id,
    profile.accountId,
    profile.canonicalAccountId,
    profile.userId,
    profile.ownerUserId,
    profile.member,
    profile.telegramId,
    profile.tgId,
    profile.tg_id,
    profile._id,
  ].map(normalizePersonIdentityId).filter(Boolean);
}
async function readPeopleCanonicalMap(db, ids = []) {
  const seed = new Set();
  for (const id of Array.isArray(ids) ? ids : []) addPersonIdentityVariants(seed, id);
  const seedIds = Array.from(seed).filter(Boolean);
  const map = new Map();
  const write = (raw, canonical) => {
    const cleanCanonical = normalizePersonIdentityId(canonical);
    if (!cleanCanonical) return;
    const variants = new Set();
    addPersonIdentityVariants(variants, raw);
    for (const value of variants) map.set(value.toLowerCase(), cleanCanonical);
  };
  for (const id of seedIds) write(id, id);
  if (!seedIds.length) return map;
  const rows = await db.collection('account_aliases').find({
    $or: [
      { accountId: { $in: seedIds } },
      { canonicalAccountId: { $in: seedIds } },
      { userId: { $in: seedIds } },
      { alias: { $in: seedIds } },
      { aliasId: { $in: seedIds } },
      { aliasValue: { $in: seedIds } },
    ],
  }).limit(Math.max(500, seedIds.length * 4)).toArray().catch(() => []);
  for (const row of rows || []) {
    const canonical = normalizePersonIdentityId(row?.canonicalAccountId || row?.accountId || row?.userId);
    if (!canonical) continue;
    for (const value of [row?.accountId, row?.canonicalAccountId, row?.userId, row?.alias, row?.aliasId, row?.aliasValue]) {
      write(value, canonical);
    }
  }
  return map;
}
function canonicalPersonSearchKey({ person = {}, row = {}, profile = {}, canonicalMap = new Map() } = {}) {
  const ids = [
    person.accountId,
    person.userId,
    person.id,
    ...personIdentityKeys(row, profile),
  ].map(normalizePersonIdentityId).filter(Boolean);
  for (const id of ids) {
    const resolved = canonicalMap.get(id.toLowerCase());
    if (resolved) return resolved.toLowerCase();
  }
  return normalizePersonIdentityId(person.id || person.accountId || person.userId).toLowerCase();
}
async function readForumPeopleSearchPage({ db, input = {}, cursorPayload = null, pageSize = 40 } = {}) {
  const query = normalizeProfileSearchText(input.q || input.query || '');
  if (!query) {
    return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-search-page', source: 'mongo_profile_index', count: 0, items: [], nextCursor: null, hasMore: false, queryShape: { collection: 'profile_nick_index', profileCollection: 'profiles', cursorDomain: DOMAIN_SEARCH } });
  }
  const offset = Math.max(0, num(cursorPayload?.after?.offset, 0));
  const rx = new RegExp(`^${escapeRegex(query)}`, 'i');
  const scanLimit = Math.max(pageSize + offset + 1, 160);
  let nickCursor = db.collection('profile_nick_index').find({ nickLower: { $regex: rx } });
  if (nickCursor && typeof nickCursor.sort === 'function') nickCursor = nickCursor.sort({ nickLower: 1, ownerUserId: 1 });
  if (nickCursor && typeof nickCursor.limit === 'function') nickCursor = nickCursor.limit(scanLimit);
  const nickRows = nickCursor && typeof nickCursor.toArray === 'function' ? await nickCursor.toArray() : [];

  let profileCursor = db.collection('profiles').find({
    $or: [
      { canonicalNickname: { $regex: rx } },
      { nickname: { $regex: rx } },
      { nick: { $regex: rx } },
    ],
  });
  if (profileCursor && typeof profileCursor.sort === 'function') profileCursor = profileCursor.sort({ canonicalNickname: 1, nickname: 1, accountId: 1 });
  if (profileCursor && typeof profileCursor.limit === 'function') profileCursor = profileCursor.limit(scanLimit);
  const directProfiles = profileCursor && typeof profileCursor.toArray === 'function' ? await profileCursor.toArray() : [];

  let metaCursor = db.collection('forum_core_user_metadata').find({ field: 'nick', value: { $regex: rx } });
  if (metaCursor && typeof metaCursor.sort === 'function') metaCursor = metaCursor.sort({ value: 1, userId: 1 });
  if (metaCursor && typeof metaCursor.limit === 'function') metaCursor = metaCursor.limit(scanLimit);
  const metaRows = metaCursor && typeof metaCursor.toArray === 'function' ? await metaCursor.toArray().catch(() => []) : [];

  const profileIds = Array.from(new Set([
    ...nickRows.map((row) => personProfileId(row)),
    ...metaRows.map((row) => personProfileId(row)),
    ...directProfiles.flatMap(profileCandidateKeys),
  ].filter(Boolean)));
  const canonicalMap = await readPeopleCanonicalMap(db, [
    ...profileIds,
    ...nickRows.flatMap((row) => personIdentityKeys(row, row.profile || {})),
    ...metaRows.flatMap((row) => personIdentityKeys(row, row.profile || {})),
    ...directProfiles.flatMap((profile) => personIdentityKeys(profile, profile)),
  ]);
  const profileById = new Map();
  for (const profile of directProfiles) {
    for (const key of profileCandidateKeys(profile)) {
      if (!profileById.has(key)) profileById.set(key, profile);
    }
  }
  if (profileIds.length) {
    const profileQuery = {
      $or: [
        { _id: { $in: profileIds.map((id) => `profile:${id}`) } },
        { userId: { $in: profileIds } },
        { accountId: { $in: profileIds } },
        { canonicalAccountId: { $in: profileIds } },
      ],
    };
    const profileCursor = db.collection('profiles').find(profileQuery).limit(Math.max(pageSize + 1, profileIds.length));
    const profileRows = profileCursor && typeof profileCursor.toArray === 'function' ? await profileCursor.toArray() : [];
    for (const profile of profileRows) {
      const keys = profileCandidateKeys(profile);
      for (const key of keys) if (!profileById.has(key)) profileById.set(key, profile);
    }
  }

  const candidates = new Map();
  const addCandidate = (row = {}) => {
    const id = personProfileId(row);
    if (!id) return;
    const profile = profileById.get(id) || row.profile || row;
    const merged = { ...row, profile };
    const person = publicPersonFromProfileRow(merged);
    if (!person.id || !person.nickname) return;
    const normalizedNick = normalizeProfileSearchText(person.nickname);
    if (!normalizedNick.startsWith(query)) return;
    const key = canonicalPersonSearchKey({ person, row, profile, canonicalMap });
    if (!candidates.has(key)) candidates.set(key, { person, normalizedNick });
  };
  for (const row of nickRows) addCandidate(row);
  for (const profile of directProfiles) addCandidate(profile);
  for (const row of metaRows) addCandidate({ ...row, nickname: row.value, normalizedNick: row.value, accountId: row.userId, userId: row.userId });

  const sorted = Array.from(candidates.values())
    .sort((left, right) => {
      const nickCmp = left.normalizedNick.localeCompare(right.normalizedNick);
      if (nickCmp) return nickCmp;
      return left.person.id.localeCompare(right.person.id);
    })
    .map((row) => row.person);
  const returnedRows = sorted.slice(offset, offset + pageSize);
  const nextCursor = sorted.length > offset + pageSize
    ? await encodeSignedCursor(DOMAIN_SEARCH, { after: { offset: offset + pageSize }, pageSize, sort: 'nickname', mode: 'people' }, { ttlMs: CURSOR_TTL_MS })
    : null;
  return sanitizePublicForumPayload({
    ok: true,
    kind: 'ql7-forum-search-page',
    source: 'mongo_profile_index',
    count: returnedRows.length,
    items: returnedRows.map((person) => ({
      id: person.id,
      entityId: person.id,
      kind: 'person',
      score: 0,
      userId: person.userId,
      accountId: person.accountId,
      surface: 'search',
      item: person,
    })),
    nextCursor,
    hasMore: Boolean(nextCursor),
    queryShape: { collection: 'profile_nick_index', profileCollection: 'profiles', limit: pageSize, cursorDomain: DOMAIN_SEARCH, mode: 'people' },
  });
}
async function readForumSearchPage({ input = {} } = {}) {
  const body = normalizeBody(input);
  const pageSize = clampPageSize('search', body.pageSize || body.limit);
  const cursorPayload = body.cursor ? await decodeSignedCursor(DOMAIN_SEARCH, body.cursor) : null;
  if (str(body.mode || '').toLowerCase() === 'people') {
    const db = await database();
    return readForumPeopleSearchPage({ db, input: body, cursorPayload, pageSize });
  }
  const plan = buildSearchPagePlan({ q: body.q || body.query || '', mode: body.mode || 'all', sort: body.sort || 'relevance', pageSize, cursor: cursorPayload });
  const db = await database();
  const rows = await filterRowsWithExistingCorePosts(db, await findRows(db, plan), { requirePost: false });
  const returnedRows = rows.slice(0, pageSize);
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, await hydratePostRowsWithThreadReplyCounts(db, await hydratePostRowsWithCoreCounters(db, await hydrateTopicRowsWithPostTotals(db, await hydrateTopicRowsWithCoreCounters(db, returnedRows)))));
  const items = hydratedRows.map((row) => publicResultRow(row, 'search'));
  const nextCursor = await makeNextCursor({ domain: DOMAIN_SEARCH, plan, rows, returnedRows, pageSize, sort: body.sort || 'relevance' });
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-search-page', source: 'mongo_projection_index', count: items.length, items, nextCursor, hasMore: Boolean(nextCursor), queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain } });
}
async function readForumThreadLocate({ input = {} } = {}) {
  const body = normalizeBody(input);
  const postId = str(body.postId || body.id || body.targetPostId);
  if (!postId) { const err = new Error('missing_postId'); err.status = 400; throw err; }
  const db = await database();
  const row = await db.collection('forum_thread_index').findOne({ postId });
  if (!row) { const err = new Error('not_found'); err.status = 404; throw err; }
  const liveRows = await filterRowsWithExistingCorePosts(db, [row]);
  if (!liveRows.length) { const err = new Error('not_found'); err.status = 404; throw err; }
  const chain = [...(Array.isArray(row.ancestorIds) ? row.ancestorIds.map(str).filter(Boolean) : []), postId];
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-thread-locate', source: 'mongo_projection_index', postId, topicId: str(row.topicId), parentId: row.parentId == null ? null : str(row.parentId), rootPostId: str(row.rootPostId || chain[0] || postId), depth: num(row.depth, 0), path: str(row.path), chain, locate: { mode: 'projection_thread_index', collection: 'forum_thread_index', hint: 'ql7_thread_post_lookup_v1' } });
}
async function readForumThreadPage({ request = null, input = {} } = {}) {
  const body = normalizeBody(input);
  const pageSize = clampPageSize('thread', body.pageSize || body.limit);
  const cursorPayload = await decodeCursorSafe(DOMAIN_THREAD, body.cursor);
  const mode = normalizeGeoMode(body.feedMode || body.geoMode || 'geo');
  const sort = normalizeThreadSurfaceSort(body.sort || 'new');
  const branchMode = str(body.mode || body.branchMode || 'children') || 'children';
  const plan = buildThreadPagePlan({ mode: branchMode, topicId: body.topicId, parentId: body.parentId, rootPostId: body.rootPostId, pageSize, cursor: null, sort });
  const db = await database();
  const rawRows = await findRows(db, { ...plan, limit: Math.max(pageSize + 1, 600) });
  const liveRows = await filterRowsWithExistingCorePosts(db, rawRows);
  const hydratedBaseRows = await hydratePostRowsWithThreadReplyCounts(db, await hydratePostRowsWithCoreCounters(db, liveRows));
  const geoPriorityByPostId = await readThreadGeoPriorityRanks(hydratedBaseRows, { mode, request });
  const rankByPostId = new Map();
  const sortedRows = hydratedBaseRows
    .slice()
    .sort(compareThreadRows(sort, geoPriorityByPostId))
    .map((row, index) => {
      const id = threadRowId(row);
      if (id) rankByPostId.set(id, index);
      return decorateThreadRank(row, { mode, sort, rank: index });
    });
  const cursorRows = sortedRows.filter((row) => threadRowAfterCursor(row, cursorPayload, sort, rankByPostId));
  const returnedRows = cursorRows.slice(0, pageSize);
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, returnedRows);
  const items = hydratedRows.map((row) => sanitizePublicForumPayload({ ...publicPostFromRow(row), thread: { rootPostId: str(row.rootPostId), depth: num(row.depth, 0), path: str(row.path), ancestorIds: Array.isArray(row.ancestorIds) ? row.ancestorIds.map(str).filter(Boolean) : [] } }));
  const nextCursor = await makeThreadNextCursor({ rows: cursorRows, returnedRows, pageSize, sort, rankByPostId });
  return sanitizePublicForumPayload({
    ok: true,
    kind: 'ql7-forum-thread-page',
    source: 'mongo_projection_index',
    mode,
    sort,
    count: items.length,
    items,
    nextCursor,
    hasMore: Boolean(nextCursor),
    queryShape: {
      collection: plan.collection,
      hint: plan.hint || null,
      limit: plan.limit,
      cursorDomain: plan.cursorDomain,
      geoRingPriority: mode === 'geo',
      surface: 'thread',
      branchMode,
    },
  });
}
async function readForumInboxRepliesPage({ input = {} } = {}) {
  const body = normalizeBody(input);
  const userId = str(body.userId || body.accountId || body.canonicalAccountId);
  const pageSize = clampPageSize('inbox', body.pageSize || body.limit);
  const cursorPayload = body.cursor ? await decodeSignedCursor(DOMAIN_INBOX, body.cursor) : null;
  const plan = buildInboxRepliesPlan({ userId, pageSize, cursor: cursorPayload });
  const db = await database();
  const rows = await filterRowsWithExistingCorePosts(db, await findRows(db, plan));
  const cursorRows = rows.slice(0, pageSize);
  const returnedRows = await hydrateRowsWithReplyMetadata(db, await hydratePostRowsWithThreadReplyCounts(db, await hydrateInboxRowsWithCanonicalCounters(db, await hydratePostRowsWithCoreCounters(db, cursorRows))));
  const items = returnedRows.map((row) => sanitizePublicForumPayload({ ...publicPostFromRow(row), unread: Boolean(row.unread), sourcePostId: str(row.sourcePostId), recipientCanonicalId: str(row.recipientCanonicalId) }));
  const nextCursor = await makeNextCursor({ domain: DOMAIN_INBOX, plan, rows, returnedRows: cursorRows, pageSize, sort: 'new' });
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-inbox-replies-page', source: 'mongo_projection_index', count: items.length, items, nextCursor, hasMore: Boolean(nextCursor), queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain } });
}
async function readForumUserPostsPage({ input = {} } = {}) {
  const body = normalizeBody(input);
  const pageSize = clampPageSize('userPosts', body.pageSize || body.limit);
  const cursorPayload = await decodeCursorSafe(DOMAIN_USER_POSTS, body.cursor);
  const db = await database();
  const rawUserId = body.userId || body.accountId || body.canonicalAuthorId;
  const sort = normalizeUserBranchSort(body.sort);
  const identityIds = await resolveUserBranchIdentityIds(db, rawUserId);
  const plan = buildUserPostsPlan({ userIds: identityIds, userId: rawUserId, sort, pageSize, cursor: null });
  const projectionRows = await findRows(db, { ...plan, limit: Math.max(pageSize + 1, 600) });
  const looseRows = await readLooseUserPostRows(db, identityIds);
  const liveRows = await filterRowsWithExistingCorePosts(db, mergeUserPostRowsByPostId([...projectionRows, ...looseRows]));
  const rows = (await hydratePostRowsWithThreadReplyCounts(db, await hydratePostRowsWithCoreCounters(db, liveRows))).sort(compareUserPostRows(sort));
  const statsTotal = await readUserBranchStatsPostTotal(db, identityIds);
  const cursorRows = rows.filter((row) => userPostRowAfterCursor(row, cursorPayload, sort));
  const returnedRows = cursorRows.slice(0, pageSize);
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, returnedRows);
  const items = hydratedRows.map(publicPostFromRow);
  const nextCursor = await makeUserPostsNextCursor({ rows: cursorRows, returnedRows, pageSize, sort });
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-user-posts-page', source: 'mongo_projection_index_alias_merged', count: items.length, totalCount: Math.max(statsTotal, rows.length), statsTotal, uniqueRowCount: rows.length, items, nextCursor, hasMore: Boolean(nextCursor), queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain, aliasCount: identityIds.length } });
}
async function readForumUserTopicsPage({ input = {} } = {}) {
  const body = normalizeBody(input);
  const pageSize = clampPageSize('userTopics', body.pageSize || body.limit);
  const cursorPayload = await decodeCursorSafe(DOMAIN_USER_TOPICS, body.cursor);
  const db = await database();
  const rawUserId = body.userId || body.accountId || body.canonicalAuthorId;
  const sort = normalizeUserBranchSort(body.sort);
  const identityIds = await resolveUserBranchIdentityIds(db, rawUserId);
  const plan = buildUserTopicsPlan({ userIds: identityIds, userId: rawUserId, sort, pageSize, cursor: null });
  const projectionRows = await findRows(db, { ...plan, limit: Math.max(pageSize + 1, 600) });
  const looseRows = await readLooseUserTopicRows(db, identityIds);
  const rows = (await hydrateTopicRowsWithPostTotals(db, await hydrateTopicRowsWithCoreCounters(db, mergeTopicRowsByTopicId([...projectionRows, ...looseRows])))).sort(compareTopicRows(sort));
  const statsTotal = await readUserBranchStatsTopicTotal(db, identityIds);
  const cursorRows = rows.filter((row) => topicRowAfterCursor(row, cursorPayload, sort));
  const returnedRows = cursorRows.slice(0, pageSize);
  const items = returnedRows.map(publicTopicFromRow);
  const nextCursor = await makeUserTopicsNextCursor({ rows: cursorRows, returnedRows: cursorRows.slice(0, pageSize), pageSize, sort });
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-user-topics-page', source: 'mongo_projection_index_alias_merged', count: items.length, totalCount: Math.max(statsTotal, rows.length), statsTotal, uniqueRowCount: rows.length, items, nextCursor, hasMore: Boolean(nextCursor), queryShape: { collection: plan.collection, hint: plan.hint, limit: plan.limit, cursorDomain: plan.cursorDomain, aliasCount: identityIds.length } });
}

function normalizeTopicSort(value) {
  const raw = str(value || 'new').toLowerCase();
  if (raw === 'reactions') return 'likes';
  return ['new', 'top', 'likes', 'views', 'replies'].includes(raw) ? raw : 'new';
}
function buildTopicCursorFilter(sort, cursorPayload) {
  const after = cursorPayload && cursorPayload.after && typeof cursorPayload.after === 'object' ? cursorPayload.after : null;
  const id = str(after?.id);
  const field = str(after?.field || ('sort.' + normalizeTopicSort(sort)));
  const value = after?.value;
  if (!id || value == null || field !== ('sort.' + normalizeTopicSort(sort))) return {};
  return { $or: [{ [field]: { $lt: value } }, { [field]: value, topicId: { $gt: id } }] };
}
function topicPlanFromInput(body = {}, cursorPayload = null) {
  const sort = normalizeTopicSort(body.sort || 'new');
  const pageSize = clampPageSize('userTopics', body.pageSize || body.limit);
  const field = 'sort.' + sort;
  return {
    collection: 'forum_user_topic_index',
    query: { 'visibility.deleted': false, ...buildTopicCursorFilter(sort, cursorPayload) },
    sort: { [field]: -1, topicId: 1 },
    limit: pageSize,
    hint: '',
    cursorDomain: DOMAIN_TOPICS,
  };
}
async function readForumTopicsPage({ input = {} } = {}) {
  // QL7_GEO111_TOPICS_PAGE_PROJECTION_V1
  const body = normalizeBody(input);
  const sort = normalizeTopicSort(body.sort || 'new');
  const pageSize = clampPageSize('userTopics', body.pageSize || body.limit);
  const cursorPayload = await decodeCursorSafe(DOMAIN_TOPICS, body.cursor);
  const plan = topicPlanFromInput({ ...body, sort, pageSize }, null);
  const db = await database();
  const rawRows = await findRows(db, { ...plan, limit: Math.max(pageSize + 1, 600) });
  const rows = (await hydrateTopicRowsWithPostTotals(db, await hydrateTopicRowsWithCoreCounters(db, rawRows))).sort(compareTopicRows(sort));
  const cursorRows = rows.filter((row) => topicRowAfterCursor(row, cursorPayload, sort));
  const returnedRows = cursorRows.slice(0, pageSize);
  const items = returnedRows.map(publicTopicFromRow);
  const nextCursor = await makeNextCursor({ domain: DOMAIN_TOPICS, plan, rows: cursorRows, returnedRows, pageSize, sort });
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-topics-page', source: 'mongo_projection_index', count: items.length, items, nextCursor, hasMore: Boolean(nextCursor), queryShape: { collection: plan.collection, hint: plan.hint || null, limit: plan.limit, cursorDomain: plan.cursorDomain } });
}
async function readForumProjectionSnapshot({ request = null, input = {} } = {}) {
  // QL7_GEO111_PROJECTION_SNAPSHOT_MODE_AWARE_V1
  const body = normalizeBody(input);
  const limit = Math.max(1, Math.min(10000, Math.floor(num(body.limit, 10000))));
  const rawMode = str(body.mode || 'geo').toLowerCase();
  const mode = rawMode === 'world' || rawMode === 'global' || rawMode === 'off' ? 'world' : 'geo';
  const sort = str(body.sort || 'new') || 'new';
  const randomBucket = Math.max(0, Math.min(1023, Math.floor(num(body.randomBucket, 0))));
  const viewerGeo = resolveRequestGeo(request || {}, { now: new Date() });
  const geoPlan = buildFeedSelectionPlan({ mode, sort, geo: viewerGeo });
  const postPlan = buildFeedPagePlan({ mode, sort, pageSize: limit, surface: body.surface || 'home', geoPlan, randomBucket });
  const db = await database();
  const topicCursor = db.collection('forum_user_topic_index').find({ 'visibility.deleted': false }).sort({ 'sort.new': -1, topicId: 1 }).limit(limit);
  let postCursor = db.collection(postPlan.collection).find(postPlan.query || {}).sort(postPlan.sort || {}).limit(limit);
  if (postCursor && typeof postCursor.hint === 'function' && postPlan.hint) {
    try { postCursor = postCursor.hint(postPlan.hint); } catch {}
  }
  const [rawTopicRows, rawPostRows] = await Promise.all([topicCursor.toArray(), postCursor.toArray()]);
  const [topicRows, postRows] = await Promise.all([
    hydrateTopicRowsWithPostTotals(db, await hydrateTopicRowsWithCoreCounters(db, rawTopicRows)),
    hydratePostRowsWithThreadReplyCounts(db, await hydratePostRowsWithCoreCounters(db, rawPostRows)),
  ]);
  const topicsById = new Map();
  for (const row of topicRows) {
    const topic = publicTopicFromRow(row);
    if (topic.id) topicsById.set(topic.id, topic);
  }
  const postsById = new Map();
  for (const row of postRows) {
    const post = publicPostFromRow(row);
    if (post.id) postsById.set(post.id, post);
  }
  return sanitizePublicForumPayload({
    ok: true,
    kind: 'ql7-forum-projection-snapshot',
    source: 'mongo_projection_index',
    rev: Date.now(),
    mode,
    sort,
    viewerGeo: publicSessionGeoSummary(viewerGeo, body.lang || 'en'),
    topics: Array.from(topicsById.values()),
    posts: Array.from(postsById.values()),
    bans: [],
    admins: [],
    cursor: null,
    queryShape: {
      topicCollection: 'forum_user_topic_index',
      postCollection: postPlan.collection,
      postHint: postPlan.hint,
      limit,
      cursorDomain: postPlan.cursorDomain,
    },
  });
}

async function readForumPostById({ input = {} } = {}) {
  const body = normalizeBody(input);
  const postId = str(body.postId || body.id);
  if (!postId) { const err = new Error('missing_postId'); err.status = 400; throw err; }
  const db = await database();
  let row = await db.collection('forum_thread_index').findOne({ postId });
  if (!row) row = await db.collection('forum_user_post_index').findOne({ postId });
  if (!row) { const err = new Error('not_found'); err.status = 404; throw err; }
  const liveRows = await filterRowsWithExistingCorePosts(db, [row]);
  if (!liveRows.length) { const err = new Error('not_found'); err.status = 404; throw err; }
  const hydratedRows = await hydrateRowsWithReplyMetadata(db, await hydratePostRowsWithThreadReplyCounts(db, await hydratePostRowsWithCoreCounters(db, liveRows)));
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-post-by-id', source: 'mongo_projection_index', post: publicPostFromRow(hydratedRows[0] || row) });
}
async function readForumPostMeta({ input = {} } = {}) {
  const payload = await readForumPostById({ input });
  const post = payload.post || {};
  const text = str(post.text || post.body || '');
  return sanitizePublicForumPayload({ ok: true, kind: 'ql7-forum-post-meta', source: 'mongo_projection_index', postId: str(post.id), topicId: str(post.topicId) || null, parentId: post.parentId == null ? null : str(post.parentId), authorName: str(post.nickname) || null, bodyTextPlain: text, ogDescription: text.length > 220 ? text.slice(0, 217).trim() + '...' : text, previewImageUrl: str(post.imageUrl || post.videoUrl || post.mediaUrl || '') || '/metab/forum1.png', createdAt: num(post.ts, 0) || null });
}
module.exports = {
  __setTestDb,
  readForumSearchPage,
  readForumThreadLocate,
  readForumThreadPage,
  readForumInboxRepliesPage,
  readForumUserPostsPage,
  readForumUserTopicsPage,
  readForumTopicsPage,
  readForumProjectionSnapshot,
  readForumPostById,
  readForumPostMeta,
  publicPostFromRow,
  publicTopicFromRow,
};
