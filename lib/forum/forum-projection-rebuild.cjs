// QL7_GEO111_FORUM_PROJECTION_REBUILD_V1B
// Rebuilds forum projection indexes from Mongo core topics/posts only. Legacy snapshot fallback is disabled.
// Destructive operations are limited to projection collections and require explicit --yes --drop-existing.
// V1B adds progress callbacks and keeps all writes limited to projection collections.

const { getMongoDb } = require('../mongo/client.cjs');
const { FORUM_INDEX_COLLECTIONS, ensureForumServerIndexes, auditLiveForumIndexes } = require('../mongo/forum-indexes-primary.cjs');
const maintenance = require('./forum-index-maintenance.cjs');

function str(value) { return String(value ?? '').trim(); }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)); } catch { return value; } }
function emitProgress(options, stage, data = {}) {
  if (options && typeof options.onProgress === 'function') {
    try { options.onProgress({ stage, ...data }); } catch {}
  }
}
async function database() {
  const handle = await getMongoDb();
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle;
  if (!db || typeof db.collection !== 'function') throw new Error('ql7_projection_rebuild_db_unavailable');
  return db;
}
function topicFromDoc(doc) {
  if (!doc) return null;
  const t = doc.topic && typeof doc.topic === 'object' ? doc.topic : doc;
  const id = str(t.id || t.topicId || doc.id || doc.topicId || '').replace(/^topic:/, '');
  if (!id) return null;
  return { ...clone(t), id, topicId: id, _geoOrigin: t._geoOrigin || doc._geoOrigin || null };
}
function postFromDoc(doc) {
  if (!doc) return null;
  const p = doc.post && typeof doc.post === 'object' ? doc.post : doc;
  const id = str(p.id || p.postId || doc.id || doc.postId || '').replace(/^post:/, '');
  if (!id) return null;
  return { ...clone(p), id, postId: id, topicId: str(p.topicId || doc.topicId), parentId: p.parentId == null ? null : str(p.parentId), _geoOrigin: p._geoOrigin || doc._geoOrigin || null };
}


async function readCoreForumRows(db) {
  const [topicDocs, postDocs] = await Promise.all([
    db.collection('forum_core_topics').find({ _del: { $ne: 1 } }).toArray().catch(() => []),
    db.collection('forum_core_posts').find({ _del: { $ne: 1 } }).toArray().catch(() => []),
  ]);
  let topics = topicDocs.map(topicFromDoc).filter(Boolean);
  let posts = postDocs.map(postFromDoc).filter(Boolean);
  let source = 'forum_core_collections';
  if (!topics.length && !posts.length) {
    // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
    // Premium runtime rebuild must not read legacy full snapshots.
    source = 'forum_core_collections_empty';
  }
  const topicsById = new Map();
  for (const topic of topics) topicsById.set(str(topic.id || topic.topicId), topic);
  posts.sort((a, b) => num(a.ts, 0) - num(b.ts, 0));
  return { source, topics, posts, topicsById };
}
async function clearProjectionCollections(db, options = {}) {
  const out = {};
  for (const name of Object.values(FORUM_INDEX_COLLECTIONS)) {
    emitProgress(options, 'clearing_collection', { collection: name });
    const result = await db.collection(name).deleteMany({});
    out[name] = Number(result?.deletedCount || 0);
  }
  return out;
}
async function countProjectionCollections(db) {
  const out = {};
  for (const name of Object.values(FORUM_INDEX_COLLECTIONS)) out[name] = await db.collection(name).countDocuments({}).catch(() => 0);
  return out;
}
async function rebuildForumProjectionIndexes(options = {}) {
  emitProgress(options, 'connecting_mongo');
  const db = await database();
  const yes = options.yes === true;
  const dropExisting = options.dropExisting === true;
  emitProgress(options, 'reading_core_forum_rows');
  const rows = await readCoreForumRows(db);
  emitProgress(options, 'core_rows_loaded', { source: rows.source, topics: rows.topics.length, posts: rows.posts.length });
  const before = await countProjectionCollections(db);
  emitProgress(options, 'projection_counts_before', { before });
  if (!yes) {
    emitProgress(options, 'dry_run_ready');
    return { ok: true, kind: 'ql7-forum-projection-rebuild-plan', dryRun: true, source: rows.source, topicsToIndex: rows.topics.length, postsToIndex: rows.posts.length, before, safety: { mongoMutated: false, projectionCollectionsOnly: true, requiresYesAndDropExistingForWrite: true } };
  }
  if (!dropExisting) {
    const err = new Error('drop_existing_required_for_projection_rebuild');
    err.code = 'QL7_DROP_EXISTING_REQUIRED';
    throw err;
  }
  emitProgress(options, 'ensuring_projection_indexes');
  await ensureForumServerIndexes(db);
  emitProgress(options, 'clearing_projection_collections');
  const deleted = await clearProjectionCollections(db, options);
  emitProgress(options, 'projection_collections_cleared', { deleted });
  let topicsIndexed = 0;
  let postsIndexed = 0;
  emitProgress(options, 'indexing_topics_start', { total: rows.topics.length });
  for (const topic of rows.topics) {
    const canonicalAuthorId = str(topic.userId || topic.accountId || topic.authorId);
    await maintenance.maintainForumIndexesForTopicCreated({ topic, canonicalAuthorId, geoOrigin: topic._geoOrigin || null });
    topicsIndexed += 1;
    if (topicsIndexed === rows.topics.length || topicsIndexed % 10 === 0) emitProgress(options, 'indexing_topics_progress', { done: topicsIndexed, total: rows.topics.length });
  }
  emitProgress(options, 'indexing_posts_start', { total: rows.posts.length });
  for (const post of rows.posts) {
    const topic = rows.topicsById.get(str(post.topicId)) || null;
    const canonicalAuthorId = str(post.userId || post.accountId || post.authorId);
    await maintenance.maintainForumIndexesForPostCreated({ post, topic, canonicalAuthorId, geoOrigin: post._geoOrigin || topic?._geoOrigin || null });
    postsIndexed += 1;
    if (postsIndexed === rows.posts.length || postsIndexed % 25 === 0) emitProgress(options, 'indexing_posts_progress', { done: postsIndexed, total: rows.posts.length });
  }
  emitProgress(options, 'counting_projection_collections_after');
  const after = await countProjectionCollections(db);
  emitProgress(options, 'auditing_live_indexes');
  const liveIndexes = await auditLiveForumIndexes(db);
  emitProgress(options, 'rebuild_done', { topicsIndexed, postsIndexed, liveIndexesOk: liveIndexes.ok });
  return { ok: liveIndexes.ok, kind: 'ql7-forum-projection-rebuild', dryRun: false, source: rows.source, topicsIndexed, postsIndexed, deleted, after, liveIndexesOk: liveIndexes.ok, liveIndexIssues: liveIndexes.issues || [], safety: { coreCollectionsDeleted: false, snapshotDeleted: false, projectionCollectionsOnly: true, dropExisting, mongoMutated: true } };
}
module.exports = { rebuildForumProjectionIndexes, readCoreForumRows, countProjectionCollections };
