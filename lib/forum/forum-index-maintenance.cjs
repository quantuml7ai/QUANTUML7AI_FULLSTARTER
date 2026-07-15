// QL7 GEO111 forum index maintenance v1
// ASCII-only source to avoid PowerShell/Windows encoding traps.

const crypto = require('node:crypto');
const { getMongoDb } = require('../mongo/client.cjs');
const { FORUM_ARCHITECTURE } = require('./ql7-forum-architecture.cjs');

let testDatabase = null;

function str(value) { return String(value ?? '').trim(); }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function now() { return Date.now(); }
function nowIso() { return new Date().toISOString(); }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)); } catch { return value; } }
function sha256(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }

async function database() {
  if (testDatabase) return testDatabase;
  const handle = await getMongoDb();
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle;
  if (!db || typeof db.collection !== 'function') throw new Error('ql7_forum_index_maintenance_db_unavailable');
  return db;
}
function __setTestDb(db) { testDatabase = db || null; }

function canonicalId(value) { return str(value); }
function canonicalAuthorFrom(item = {}, fallback = '') {
  return canonicalId(item.canonicalAuthorId || item.userId || item.accountId || item.authorId || fallback);
}
function deletedVisibility(item = {}) {
  return { deleted: item?._del === 1 || item?.deleted === true || item?.visibility?.deleted === true };
}
function sortDoc(item = {}) {
  const ts = num(item.ts || item.createdAt || item.updatedAt, now());
  const likes = num(item.likes, 0);
  const dislikes = num(item.dislikes, 0);
  const reactions = Math.max(num(item.reactions ?? item.reactionCount, 0), likes + dislikes, 0);
  const views = num(item.views, 0);
  const replies = num(item.replies ?? item.replyCount ?? item.repliesCount ?? item.answersCount ?? item.commentsCount ?? item.postsCount, 0);
  return { new: ts, top: (reactions * 2) + replies + Math.floor(views * 0.2), likes: reactions, reactions, views, replies };
}
function snippet(value, max = 240) {
  const clean = str(value).replace(/\s+/g, ' ');
  return clean.length > max ? clean.slice(0, max) : clean;
}
function tokenize(value, max = 32) {
  const out = [];
  const seen = new Set();
  const words = str(value).toLowerCase().normalize('NFKD').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (const word of words) {
    if (word.length < 2 || seen.has(word)) continue;
    seen.add(word);
    out.push(word.slice(0, 48));
    if (out.length >= max) break;
  }
  return out;
}
function qHash(value) { return sha256(str(value).toLowerCase().replace(/\s+/g, ' ').trim()).slice(0, 24); }
function randomDoc(id) {
  const key = sha256(id || Math.random());
  const buckets = num(FORUM_ARCHITECTURE?.feed?.randomBuckets, 1024) || 1024;
  return { bucket: parseInt(key.slice(0, 8), 16) % buckets, key };
}
function cityScopeKeyVariants(key) {
  const clean = str(key);
  const parts = clean.split(':');
  if (parts.length !== 4 || parts[0] !== 'city') return [clean].filter(Boolean);
  const country = str(parts[1]).toLowerCase();
  const city = str(parts[3]).toLowerCase();
  if (!country || !city) return [clean].filter(Boolean);
  return Array.from(new Set([clean, `city:${country}:_:${city}`].filter(Boolean)));
}
function mediaFromPost(post = {}) {
  const candidates = [];
  for (const key of ['videoUrl', 'imageUrl', 'audioUrl', 'posterUrl', 'url']) {
    if (str(post[key])) candidates.push(str(post[key]));
  }
  const media = post.media && typeof post.media === 'object' ? post.media : null;
  if (media) for (const key of ['videoUrl', 'imageUrl', 'audioUrl', 'url']) if (str(media[key])) candidates.push(str(media[key]));
  for (const item of Array.isArray(post.attachments) ? post.attachments : []) {
    if (!item || typeof item !== 'object') continue;
    for (const key of ['videoUrl', 'imageUrl', 'audioUrl', 'url']) if (str(item[key])) candidates.push(str(item[key]));
  }
  for (const url of candidates) {
    const u = url.toLowerCase();
    if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(u)) return { kind: 'video', url };
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/.test(u)) return { kind: 'audio', url };
    if (/\.(webp|png|jpe?g|gif|avif)(\?|$)/.test(u)) return { kind: 'image', url };
  }
  const text = str(post.text);
  const match = text.match(/https?:\/\/\S+\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a|webp|png|jpe?g|gif|avif)(?:\?\S*)?/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  const kind = /^(mp4|webm|mov|m4v)$/.test(ext) ? 'video' : /^(mp3|wav|ogg|m4a)$/.test(ext) ? 'audio' : 'image';
  return { kind, url: match[0] };
}
function scopeKeysFromGeoOrigin(geoOrigin = null) {
  const scopes = geoOrigin?.scopes && typeof geoOrigin.scopes === 'object' ? geoOrigin.scopes : {};
  return Array.from(new Set([
    ...cityScopeKeyVariants(scopes.cityKey),
    scopes.regionKey,
    scopes.countryKey,
    scopes.globalKey || 'global',
  ].map(str).filter(Boolean)));
}
function buildForumGeoOriginForWrite(input = {}) {
  const geo = input.geo || input;
  if (!geo || geo.known !== true) return null;
  const scopes = geo.scopes && typeof geo.scopes === 'object' ? geo.scopes : {};
  const capturedAt = input.capturedAt || geo.capturedAt || now();
  return {
    known: true,
    country: str(geo.country).toUpperCase(),
    region: str(geo.region).toUpperCase(),
    city: str(geo.city),
    precision: str(geo.precision || 'country'),
    geoKey: str(geo.geoKey || scopes.cityKey || scopes.regionKey || scopes.countryKey || 'global'),
    scopes: {
      cityKey: str(scopes.cityKey),
      regionKey: str(scopes.regionKey),
      countryKey: str(scopes.countryKey),
      globalKey: str(scopes.globalKey || 'global'),
    },
    labels: geo.labels && typeof geo.labels === 'object' ? clone(geo.labels) : undefined,
    source: str(geo.source || 'trusted-header'),
    confidence: num(geo.confidence, 0.75),
    capturedAt,
    private: true,
  };
}
function topicMini(topic = {}) {
  if (!topic) return null;
  return {
    id: str(topic.id || topic.topicId),
    topicId: str(topic.topicId || topic.id),
    title: str(topic.title),
    description: str(topic.description),
    descriptionSnippet: snippet(topic.description, 220),
    userId: str(topic.userId || topic.accountId || topic.authorId),
    nickname: str(topic.nickname || topic.nick),
    icon: str(topic.icon || topic.avatar),
    ts: num(topic.ts, 0),
    likes: num(topic.likes, 0),
    views: num(topic.views, 0),
    postsCount: num(topic.postsCount, 0),
  };
}
function postMini(post = {}) {
  if (!post) return null;
  return {
    id: str(post.id || post.postId),
    postId: str(post.postId || post.id),
    topicId: str(post.topicId),
    parentId: post.parentId == null ? null : str(post.parentId),
    text: str(post.text || post.body || post.message),
    textSnippet: snippet(post.text || post.body || post.message, 260),
    imageUrl: str(post.imageUrl),
    videoUrl: str(post.videoUrl),
    audioUrl: str(post.audioUrl),
    userId: str(post.userId || post.accountId || post.authorId),
    nickname: str(post.nickname || post.nick),
    icon: str(post.icon || post.avatar),
    ts: num(post.ts, 0),
    likes: num(post.likes, 0),
    dislikes: num(post.dislikes, 0),
    reactions: Math.max(num(post.reactions ?? post.reactionCount, 0), num(post.likes, 0) + num(post.dislikes, 0), 0),
    views: num(post.views, 0),
    replyCount: num(post.replyCount ?? post.replies ?? post.repliesCount ?? post.answersCount ?? post.commentsCount, 0),
    repliesCount: num(post.repliesCount ?? post.replyCount ?? post.replies ?? post.answersCount ?? post.commentsCount, 0),
    answersCount: num(post.answersCount ?? post.replyCount ?? post.replies ?? post.repliesCount ?? post.commentsCount, 0),
    commentsCount: num(post.commentsCount ?? post.replyCount ?? post.replies ?? post.repliesCount ?? post.answersCount, 0),
  };
}
async function readTopic(db, topicId) {
  const tid = str(topicId);
  if (!tid) return null;
  return db.collection('forum_core_topics').findOne({ _id: `topic:${tid}` }).catch(() => null);
}
async function readPost(db, postId) {
  const pid = str(postId);
  if (!pid) return null;
  return db.collection('forum_core_posts').findOne({ _id: `post:${pid}` }).catch(() => null);
}
async function readThreadRow(db, postId) {
  const pid = str(postId);
  if (!pid) return null;
  return db.collection('forum_thread_index').findOne({ postId: pid }).catch(() => null);
}
async function upsertUserStats(db, canonicalAuthorId, inc = {}, set = {}) {
  const id = canonicalId(canonicalAuthorId);
  if (!id) return null;
  const cleanInc = {};
  for (const [key, value] of Object.entries(inc || {})) {
    const n = num(value, 0);
    if (n) cleanInc[`stats.${key}`] = n;
  }
  const cleanSet = {};
  for (const [key, value] of Object.entries(set || {})) {
    if (key === 'stats' || key.startsWith('stats.')) continue;
    cleanSet[key] = value;
  }
  const collection = db.collection('forum_user_stats');
  const stamp = nowIso();
  const insertUpdate = {
    $set: { canonicalAuthorId: id, updatedAt: stamp, storagePrimary: 'mongo', ...cleanSet },
    $setOnInsert: { _id: id, createdAt: stamp, stats: { posts: 0, topics: 0, likes: 0, repliesReceived: 0 } },
  };
  await collection.updateOne({ _id: id }, insertUpdate, { upsert: true });
  if (Object.keys(cleanInc).length) {
    await collection.updateOne({ _id: id }, { $inc: cleanInc, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } });
  }
  return true;
}
async function maintainForumUserStatsCountersChanged({ canonicalAuthorId, likesDelta = 0, viewsDelta = 0, repliesReceivedDelta = 0 } = {}) {
  const db = await database();
  const id = canonicalId(canonicalAuthorId);
  if (!id) return { ok: false, skipped: true, reason: 'missing_author' };
  const inc = {};
  if (num(likesDelta, 0)) inc.likes = num(likesDelta, 0);
  if (num(viewsDelta, 0)) inc.views = num(viewsDelta, 0);
  if (num(repliesReceivedDelta, 0)) inc.repliesReceived = num(repliesReceivedDelta, 0);
  await upsertUserStats(db, id, inc);
  return { ok: true, canonicalAuthorId: id, inc };
}
async function maintainForumIndexesForTopicCreated({ topic, canonicalAuthorId, geoOrigin } = {}) {
  const db = await database();
  const t = clone(topic) || {};
  const topicId = str(t.id || t.topicId);
  const authorId = canonicalAuthorFrom(t, canonicalAuthorId);
  if (!topicId || !authorId) return { ok: false, skipped: true, reason: 'missing_topic_or_author' };
  const ts = num(t.ts, now());
  const sort = sortDoc(t);
  const visibility = deletedVisibility(t);
  const geo = geoOrigin || t._geoOrigin || null;
  const scopeKeys = scopeKeysFromGeoOrigin(geo);
  const geoPrivate = { scopeKeys, origin: geo };
  const text = `${str(t.title)} ${str(t.description)}`;
  await Promise.all([
    db.collection('forum_user_topic_index').updateOne({ _id: `${authorId}:${topicId}` }, { $set: {
      _id: `${authorId}:${topicId}`, canonicalAuthorId: authorId, topicId, ts, title: str(t.title), descriptionSnippet: snippet(t.description),
      counters: { posts: num(t.postsCount, 0), likes: num(t.likes, 0), views: num(t.views, 0), replies: num(t.postsCount, 0), top: sort.top },
      visibility, sort, topic: topicMini(t), _geoOrigin: geo, geoPrivate, updatedAt: nowIso(), storagePrimary: 'mongo',
    }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }),
    db.collection('forum_search_index').updateOne({ _id: `topic:${topicId}` }, { $set: {
      _id: `topic:${topicId}`, kind: 'topic', entityId: topicId, topicId, canonicalAuthorId: authorId,
      text: { tokens: tokenize(text), qHash: qHash(text), snippet: snippet(text, 320) },
      sort: { ...sort, relevance: sort.top }, visibility, open: { type: 'topic', topicId }, topic: topicMini(t), _geoOrigin: geo, geoPrivate, updatedAt: nowIso(), storagePrimary: 'mongo',
    }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }),
    upsertUserStats(db, authorId, { topics: 1 }),
  ]);
  return { ok: true, topicId, canonicalAuthorId: authorId };
}
async function buildThreadShape(db, post = {}) {
  const parentId = post.parentId == null ? null : str(post.parentId);
  if (!parentId) return { rootPostId: str(post.id || post.postId), depth: 0, path: `${num(post.ts, now())}:${str(post.id || post.postId)}`, ancestorIds: [] };
  const parentRow = await readThreadRow(db, parentId);
  if (parentRow) {
    const ancestors = Array.isArray(parentRow.ancestorIds) ? parentRow.ancestorIds.map(str).filter(Boolean) : [];
    return { rootPostId: str(parentRow.rootPostId || parentId), depth: num(parentRow.depth, 0) + 1, path: `${str(parentRow.path)}.${num(post.ts, now())}:${str(post.id || post.postId)}`, ancestorIds: [...ancestors, parentId] };
  }
  const parent = await readPost(db, parentId);
  return { rootPostId: str(parent?.rootPostId || parent?.id || parentId), depth: 1, path: `${num(parent?.ts, 0)}:${parentId}.${num(post.ts, now())}:${str(post.id || post.postId)}`, ancestorIds: [parentId] };
}
async function maintainForumIndexesForPostCreated({ post, topic, canonicalAuthorId, geoOrigin } = {}) {
  const db = await database();
  const p = clone(post) || {};
  const postId = str(p.id || p.postId);
  const topicId = str(p.topicId);
  const authorId = canonicalAuthorFrom(p, canonicalAuthorId);
  if (!postId || !topicId || !authorId) return { ok: false, skipped: true, reason: 'missing_post_topic_or_author' };
  const t = topic || await readTopic(db, topicId) || {};
  const parentId = p.parentId == null ? null : str(p.parentId);
  const parent = parentId ? await readPost(db, parentId) : null;
  const recipientCanonicalId = parent ? canonicalAuthorFrom(parent) : '';
  const ts = num(p.ts, now());
  const sort = sortDoc(p);
  const visibility = deletedVisibility(p);
  const geo = geoOrigin || p._geoOrigin || t._geoOrigin || null;
  const scopeKeys = scopeKeysFromGeoOrigin(geo);
  const rand = randomDoc(postId);
  const thread = await buildThreadShape(db, p);
  const postDoc = postMini(p);
  const topicDoc = topicMini(t);
  const text = str(p.text);
  const media = mediaFromPost(p);
  const writes = [];
  writes.push(db.collection('forum_thread_index').updateOne({ postId }, { $set: {
    _id: `thread:${postId}`, postId, topicId, parentId, rootPostId: thread.rootPostId, depth: thread.depth, path: thread.path, ancestorIds: thread.ancestorIds,
    canonicalAuthorId: authorId, counters: { likes: num(p.likes, 0), dislikes: num(p.dislikes, 0), views: num(p.views, 0), replies: 0 },
    visibility, sort, post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
  }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
  writes.push(db.collection('forum_user_post_index').updateOne({ _id: `${authorId}:${postId}` }, { $set: {
    _id: `${authorId}:${postId}`, canonicalAuthorId: authorId, postId, topicId, parentId, ts, textSnippet: snippet(text),
    counters: { likes: num(p.likes, 0), dislikes: num(p.dislikes, 0), views: num(p.views, 0), replies: 0, top: sort.top },
    visibility, sort, post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
  }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
  writes.push(db.collection('forum_search_index').updateOne({ _id: `post:${postId}` }, { $set: {
    _id: `post:${postId}`, kind: 'post', entityId: postId, postId, topicId, parentId, rootPostId: thread.rootPostId, depth: thread.depth,
    canonicalAuthorId: authorId, text: { tokens: tokenize(text), qHash: qHash(text), snippet: snippet(text, 320) },
    sort: { ...sort, relevance: sort.top }, visibility, open: { type: 'post', requiresHydration: true, targetPostId: postId, topicId, rootPostId: thread.rootPostId, parentId, depth: thread.depth },
    post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
  }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
  writes.push(db.collection('forum_geo_feed_index').updateOne({ _id: `home:${postId}` }, { $set: {
    _id: `home:${postId}`, surface: 'home', mode: 'geo', postId, topicId, canonicalAuthorId: authorId,
    geo: { scopeKeys, origin: geo }, random: rand, ts, visibility, sort, post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
  }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
  if (media) writes.push(db.collection('forum_media_feed_index').updateOne({ _id: `${media.kind}:${postId}` }, { $set: {
    _id: `${media.kind}:${postId}`, mediaKind: media.kind, postId, topicId, canonicalAuthorId: authorId,
    media: { kind: media.kind, url: media.url }, geo: { scopeKeys, origin: geo }, random: rand, ts, visibility, sort, post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
  }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
  if (parentId && recipientCanonicalId && recipientCanonicalId !== authorId) {
    writes.push(db.collection('forum_reply_inbox_index').updateOne({ _id: `${recipientCanonicalId}:${postId}` }, { $set: {
      _id: `${recipientCanonicalId}:${postId}`, recipientCanonicalId, sourcePostId: postId, postId, topicId, parentId, rootPostId: thread.rootPostId,
      canonicalAuthorId: authorId, unread: true, ts, visibility, sort,
      counters: { likes: num(p.likes, 0), dislikes: num(p.dislikes, 0), views: num(p.views, 0), replies: num(p.replyCount ?? p.replies ?? p.repliesCount ?? p.answersCount ?? p.commentsCount, 0), top: sort.top },
      post: postDoc, topic: topicDoc, updatedAt: nowIso(), storagePrimary: 'mongo',
    }, $setOnInsert: { createdAt: nowIso() } }, { upsert: true }));
    writes.push(upsertUserStats(db, recipientCanonicalId, { repliesReceived: 1 }));
  }
  writes.push(upsertUserStats(db, authorId, { posts: 1 }));
  if (parentId) {
    writes.push(maintainForumIndexesForPostCountersChanged({ postId: parentId, replyDelta: 1 }).catch(() => null));
  }
  if (topicId) {
    writes.push(db.collection('forum_user_topic_index').updateMany({ topicId }, { $set: { 'counters.posts': num(t.postsCount, 0), 'counters.replies': num(t.postsCount, 0), 'topic.postsCount': num(t.postsCount, 0), updatedAt: nowIso(), storagePrimary: 'mongo' } }).catch(() => null));
  }
  await Promise.all(writes);
  return { ok: true, postId, topicId, canonicalAuthorId: authorId, mediaKind: media?.kind || null, inboxWritten: Boolean(parentId && recipientCanonicalId && recipientCanonicalId !== authorId) };
}
async function maintainForumIndexesForPostCountersChanged({ postId, likes, dislikes, views, replies, replyDelta } = {}) {
  const db = await database();
  const pid = str(postId);
  if (!pid) return { ok: false, skipped: true };
  const post = await readPost(db, pid) || {};
  const finiteLikes = Number.isFinite(Number(likes));
  const finiteDislikes = Number.isFinite(Number(dislikes));
  const finiteViews = Number.isFinite(Number(views));
  const finiteReplies = Number.isFinite(Number(replies));
  const finiteReplyDelta = Number.isFinite(Number(replyDelta)) && num(replyDelta, 0) !== 0;
  const set = { updatedAt: nowIso(), storagePrimary: 'mongo' };
  if (finiteLikes) { set['counters.likes'] = num(likes); set['sort.likes'] = num(likes); set['post.likes'] = num(likes); }
  if (finiteDislikes) { set['counters.dislikes'] = num(dislikes); set['post.dislikes'] = num(dislikes); }
  if (finiteViews) { set['counters.views'] = num(views); set['sort.views'] = num(views); set['post.views'] = num(views); }
  if (finiteReplies) {
    set['counters.replies'] = num(replies);
    set['sort.replies'] = num(replies);
    set['post.replyCount'] = num(replies);
    set['post.repliesCount'] = num(replies);
    set['post.answersCount'] = num(replies);
    set['post.commentsCount'] = num(replies);
  }
  if (finiteLikes || finiteDislikes || finiteViews || finiteReplies) {
    const nextLikes = finiteLikes ? num(likes) : num(post.likes, 0);
    const nextDislikes = finiteDislikes ? num(dislikes) : num(post.dislikes, 0);
    const nextViews = finiteViews ? num(views) : num(post.views, 0);
    const nextReplies = finiteReplies ? num(replies) : num(post.replies ?? post.repliesCount ?? post.replyCount, 0);
    set['sort.top'] = nextLikes + nextReplies + Math.floor(nextViews / 10) - nextDislikes;
  }
  const inc = {};
  if (finiteReplyDelta && !finiteReplies) {
    const delta = num(replyDelta, 0);
    inc['counters.replies'] = delta;
    inc['sort.replies'] = delta;
    inc['sort.top'] = delta;
    inc['post.replyCount'] = delta;
    inc['post.repliesCount'] = delta;
    inc['post.answersCount'] = delta;
    inc['post.commentsCount'] = delta;
  }
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(inc).length) update.$inc = inc;
  if (!update.$set && !update.$inc) return { ok: true, postId: pid, noop: true };
  await Promise.all([
    db.collection('forum_thread_index').updateMany({ postId: pid }, update),
    db.collection('forum_user_post_index').updateMany({ postId: pid }, update),
    db.collection('forum_search_index').updateMany({ postId: pid }, update),
    db.collection('forum_geo_feed_index').updateMany({ postId: pid }, update),
    db.collection('forum_media_feed_index').updateMany({ postId: pid }, update),
    db.collection('forum_reply_inbox_index').updateMany({ postId: pid }, update),
  ]);
  return { ok: true, postId: pid };
}
async function maintainForumIndexesForTopicCountersChanged({ topicId, views, postsCount, postsDelta } = {}) {
  const db = await database();
  const tid = str(topicId);
  if (!tid) return { ok: false, skipped: true };
  const set = { updatedAt: nowIso(), storagePrimary: 'mongo' };
  if (Number.isFinite(Number(views))) { set['counters.views'] = num(views); set['sort.views'] = num(views); set['topic.views'] = num(views); }
  if (Number.isFinite(Number(postsCount))) {
    set['counters.posts'] = num(postsCount);
    set['counters.replies'] = num(postsCount);
    set['sort.replies'] = num(postsCount);
    set['topic.postsCount'] = num(postsCount);
    set['topic.replies'] = num(postsCount);
    set['topic.repliesCount'] = num(postsCount);
  }
  const inc = {};
  if (!Number.isFinite(Number(postsCount)) && Number.isFinite(Number(postsDelta)) && num(postsDelta, 0) !== 0) {
    const delta = num(postsDelta, 0);
    inc['counters.posts'] = delta;
    inc['counters.replies'] = delta;
    inc['sort.replies'] = delta;
    inc['sort.top'] = delta;
    inc['topic.postsCount'] = delta;
    inc['topic.replies'] = delta;
    inc['topic.repliesCount'] = delta;
  }
  const update = { $set: set };
  if (Object.keys(inc).length) update.$inc = inc;
  await Promise.all([
    db.collection('forum_user_topic_index').updateMany({ topicId: tid }, update),
    db.collection('forum_search_index').updateMany({ topicId: tid, kind: 'topic' }, update),
  ]);
  return { ok: true, topicId: tid };
}
async function maintainForumIndexesForPostEdited({ postId, text } = {}) {
  const db = await database();
  const pid = str(postId);
  if (!pid) return { ok: false, skipped: true };
  const post = await readPost(db, pid) || { id: pid, text };
  const media = mediaFromPost({ ...post, text });
  const set = { 'text.snippet': snippet(text, 320), 'text.tokens': tokenize(text), 'text.qHash': qHash(text), textSnippet: snippet(text), updatedAt: nowIso() };
  await Promise.all([
    db.collection('forum_search_index').updateMany({ postId: pid }, { $set: set }),
    db.collection('forum_user_post_index').updateMany({ postId: pid }, { $set: { textSnippet: snippet(text), updatedAt: nowIso() } }),
    db.collection('forum_geo_feed_index').updateMany({ postId: pid }, { $set: { 'post.textSnippet': snippet(text), updatedAt: nowIso() } }),
    db.collection('forum_reply_inbox_index').updateMany({ postId: pid }, { $set: { 'post.text': str(text), 'post.textSnippet': snippet(text), textSnippet: snippet(text), updatedAt: nowIso() } }),
  ]);
  if (!media) await db.collection('forum_media_feed_index').deleteMany({ postId: pid }).catch(() => null);
  return { ok: true, postId: pid };
}
async function maintainForumIndexesForPostsDeleted({ postIds = [] } = {}) {
  const db = await database();
  const ids = Array.from(new Set((Array.isArray(postIds) ? postIds : [postIds]).map(str).filter(Boolean)));
  if (!ids.length) return { ok: true, deleted: 0 };
  await Promise.all([
    db.collection('forum_thread_index').deleteMany({ postId: { $in: ids } }),
    db.collection('forum_user_post_index').deleteMany({ postId: { $in: ids } }),
    db.collection('forum_search_index').deleteMany({ postId: { $in: ids } }),
    db.collection('forum_geo_feed_index').deleteMany({ postId: { $in: ids } }),
    db.collection('forum_media_feed_index').deleteMany({ postId: { $in: ids } }),
    db.collection('forum_reply_inbox_index').deleteMany({ $or: [{ postId: { $in: ids } }, { sourcePostId: { $in: ids } }] }),
  ]);
  return { ok: true, deleted: ids.length };
}
async function maintainForumIndexesForTopicDeleted({ topicId, postIds = [] } = {}) {
  const db = await database();
  const tid = str(topicId);
  const ids = Array.from(new Set((Array.isArray(postIds) ? postIds : []).map(str).filter(Boolean)));
  if (ids.length) await maintainForumIndexesForPostsDeleted({ postIds: ids });
  if (tid) await Promise.all([
    db.collection('forum_user_topic_index').deleteMany({ topicId: tid }),
    db.collection('forum_search_index').deleteMany({ topicId: tid }),
    db.collection('forum_geo_feed_index').deleteMany({ topicId: tid }),
    db.collection('forum_media_feed_index').deleteMany({ topicId: tid }),
    db.collection('forum_thread_index').deleteMany({ topicId: tid }),
    db.collection('forum_reply_inbox_index').deleteMany({ topicId: tid }),
  ]);
  return { ok: true, topicId: tid, deletedPosts: ids.length };
}
module.exports = {
  __setTestDb,
  buildForumGeoOriginForWrite,
  scopeKeysFromGeoOrigin,
  maintainForumUserStatsCountersChanged,
  maintainForumIndexesForTopicCreated,
  maintainForumIndexesForPostCreated,
  maintainForumIndexesForPostCountersChanged,
  maintainForumIndexesForTopicCountersChanged,
  maintainForumIndexesForPostEdited,
  maintainForumIndexesForPostsDeleted,
  maintainForumIndexesForTopicDeleted,
};
