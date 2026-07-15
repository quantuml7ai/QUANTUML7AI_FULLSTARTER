// Mongo-primary forum repository compatible with the existing forum_core_* read model.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7ForumPrimaryIndexesV1'
let testDatabase = null

function str(value) { return String(value ?? '').trim() }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function now() { return Date.now() }
function nowIso() { return new Date().toISOString() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return value } }

async function db() {
  if (testDatabase) return testDatabase
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')

  // Redis etalon did not block read endpoints on index creation.
  // Mongo migration must not keep Quantum Family loading while Atlas creates/checks indexes.
  if (!globalThis[INDEX_KEY]) {
    globalThis[INDEX_KEY] = ensureIndexes(database).catch((error) => {
      delete globalThis[INDEX_KEY]
      console.warn('[QL7][forum-primary] ensureIndexes background failed:', error?.message || error)
    })
  }

  return database
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection('forum_core_counters').createIndex({ _id: 1 }),
    database.collection('forum_core_topics').createIndex({ id: 1 }, { unique: true, sparse: true }),
    database.collection('forum_core_posts').createIndex({ id: 1 }, { unique: true, sparse: true }),
    database.collection('forum_core_posts').createIndex({ topicId: 1, ts: 1 }),
    database.collection('forum_core_posts').createIndex({ parentId: 1 }),
    database.collection('forum_core_change_events').createIndex({ rev: 1 }),
    database.collection('forum_subscription_sets').createIndex({ _id: 1 }),
    database.collection('forum_subscription_counts').createIndex({ _id: 1 }),
    database.collection('forum_admin_state').createIndex({ key: 1 }, { unique: true, sparse: true }),
    database.collection('forum_reports').createIndex({ postId: 1, reporterId: 1 }, { unique: true, sparse: true }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

async function readMaxNumericId(database, collectionName, fields = ['id']) {
  const collection = database.collection(collectionName)
  try {
    if (typeof collection.aggregate === 'function') {
      const projected = fields.map((field) => ({
        $convert: { input: `$${field}`, to: 'long', onError: 0, onNull: 0 },
      }))
      const pipeline = [
        { $project: { n: { $max: projected } } },
        { $group: { _id: null, max: { $max: '$n' } } },
      ]
      const rows = await collection.aggregate(pipeline).toArray()
      return num(rows?.[0]?.max, 0)
    }
  } catch {}

  const rows = await collection.find({}).limit(100000).toArray().catch(() => [])
  let max = 0
  for (const row of rows || []) {
    for (const field of fields) {
      max = Math.max(max, num(row?.[field], 0))
    }
  }
  return max
}

async function syncCounterFloor(database, name, floorValue = 0) {
  const floor = Math.max(0, Math.floor(num(floorValue, 0)))
  if (!floor) return
  await database.collection('forum_core_counters').updateOne(
    { _id: `counter:${name}` },
    {
      $max: { value: floor },
      $set: { updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso(), raw: String(floor), parsed: floor },
    },
    { upsert: true },
  )
}

async function nextCounter(name, floorValue = 0) {
  const database = await db()
  await syncCounterFloor(database, name, floorValue)
  const result = await database.collection('forum_core_counters').findOneAndUpdate(
    { _id: `counter:${name}` },
    {
      $inc: { value: 1 },
      $set: { raw: null, updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && result._id ? result : result?.value
  const value = num(doc?.value, 0)
  await database.collection('forum_core_counters').updateOne(
    { _id: `counter:${name}` },
    { $set: { raw: String(value), parsed: value } },
    { upsert: true },
  )
  return value
}

async function nextRev() { return nextCounter('forum:rev') }
async function nextTopicId() {
  const database = await db()
  const floor = await readMaxNumericId(database, 'forum_core_topics', ['id', 'topicId'])
  return nextCounter('forum:seq:topic', floor)
}
async function nextPostId() {
  const database = await db()
  const floor = await readMaxNumericId(database, 'forum_core_posts', ['id', 'postId'])
  return nextCounter('forum:seq:post', floor)
}

async function readCounter(name, fallback = 0) {
  const database = await db()
  const doc = await database.collection('forum_core_counters').findOne({ _id: `counter:${name}` }).catch(() => null)
  return num(doc?.value ?? doc?.raw ?? doc?.parsed, fallback)
}

async function writeChange(evt = {}) {
  const database = await db()
  const clean = clone(evt) || {}
  const rev = num(clean.rev, 0) || await readCounter('forum:rev', 0)
  const kind = str(clean.kind || 'event') || 'event'
  const id = str(clean.id || clean.postId || clean.topicId || clean.data?.id || 'na') || 'na'
  await database.collection('forum_core_change_events').updateOne(
    { _id: `forum:change:${rev}:${kind}:${id}:${num(clean.ts, now())}` },
    {
      $set: {
        rev,
        kind,
        id,
        raw: JSON.stringify(clean),
        parsed: clean,
        ts: num(clean.ts, now()),
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return true
}

function readTopicFromDoc(doc) {
  if (!doc) return null
  const t = doc.topic && typeof doc.topic === 'object' ? doc.topic : doc
  return {
    ...clone(t),
    id: str(t.id || t.topicId || doc.id || doc.topicId),
    postsCount: num(t.postsCount ?? doc.postsCount, 0),
    views: num(t.views ?? doc.views, 0),
  }
}

function readPostFromDoc(doc) {
  if (!doc) return null
  const p = doc.post && typeof doc.post === 'object' ? doc.post : doc
  return {
    ...clone(p),
    id: str(p.id || p.postId || doc.id || doc.postId),
    topicId: str(p.topicId ?? doc.topicId),
    parentId: p.parentId == null ? null : str(p.parentId),
    likes: num(p.likes ?? doc.likes, 0),
    dislikes: num(p.dislikes ?? doc.dislikes, 0),
    views: num(p.views ?? doc.views, 0),
  }
}

async function readSnapshotRaw() {
  // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
  // Legacy full snapshot collection is no longer a runtime data source.
  return { rev: 0, payload: { topics: [], posts: [], banned: [], errors: [] }, legacyDisabled: true, source: 'mongo_core_canonical_only' }
}

async function readLegacySnapshotRaw(database) {
  const doc = await database.collection('forum_core_snapshot')
    .findOne({ _id: 'forum:snapshot' })
    .catch(() => null)
  const parsed = doc?.parsed && typeof doc.parsed === 'object' ? doc.parsed : null
  if (parsed?.payload && typeof parsed.payload === 'object') {
    return {
      rev: num(parsed.rev ?? doc?.rev, 0),
      payload: parsed.payload,
      source: 'mongo_core_snapshot_legacy_totals_fallback',
    }
  }
  if (doc?.raw) {
    try {
      const raw = JSON.parse(String(doc.raw))
      if (raw?.payload && typeof raw.payload === 'object') {
        return {
          rev: num(raw.rev ?? doc?.rev, 0),
          payload: raw.payload,
          source: 'mongo_core_snapshot_legacy_totals_fallback',
        }
      }
    } catch {}
  }
  return { rev: 0, payload: { topics: [], posts: [], banned: [], errors: [] }, source: 'mongo_core_snapshot_legacy_empty' }
}


function sortForumList(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && !item._del)
    .sort((a, b) => num(b?.ts || b?.updatedAt, 0) - num(a?.ts || a?.updatedAt, 0))
}

function hasAnyTextField(item = {}, fields = []) {
  return fields.some((field) => str(item?.[field]))
}

function hasForumMediaPayload(item = {}) {
  if (!item || typeof item !== 'object') return false
  if (str(item.imageUrl || item.videoUrl || item.audioUrl || item.posterUrl)) return true
  const media = item.media && typeof item.media === 'object' ? item.media : null
  if (media && str(media.imageUrl || media.videoUrl || media.audioUrl || media.url)) return true
  const attachments = Array.isArray(item.attachments) ? item.attachments : []
  return attachments.some((entry) => entry && str(entry.url || entry.imageUrl || entry.videoUrl || entry.audioUrl))
}

function hasAuthorShape(item = {}) {
  return hasAnyTextField(item, ['userId', 'accountId', 'authorId', 'ownerId', 'uid', 'nickname', 'nick', 'icon', 'avatar'])
}

function isFullTopicShape(item = {}) {
  return Boolean(
    str(item?.id) &&
    hasAnyTextField(item, ['title', 'description']) &&
    hasAuthorShape(item),
  )
}

function isFullPostShape(item = {}) {
  return Boolean(
    str(item?.id) &&
    (str(item?.topicId) || str(item?.parentId)) &&
    (hasAnyTextField(item, ['text', 'message', 'body', 'html']) || hasForumMediaPayload(item)) &&
    hasAuthorShape(item),
  )
}

function addIdentityVariants(target, raw) {
  const value = str(raw)
  if (!value) return
  target.add(value)
  const lower = value.toLowerCase()
  if (/^0x[a-f0-9]{40}$/i.test(value)) {
    target.add(lower)
    target.add(`wallet:${lower}`)
  } else if (/^wallet:0x[a-f0-9]{40}$/i.test(value)) {
    const address = value.slice('wallet:'.length)
    target.add(address)
    target.add(address.toLowerCase())
    target.add(`wallet:${address.toLowerCase()}`)
  }
  const telegramPrefixes = ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:']
  let stripped = value
  for (const prefix of telegramPrefixes) {
    if (lower.startsWith(prefix)) {
      stripped = value.slice(prefix.length)
      break
    }
  }
  if (stripped && stripped !== value) target.add(stripped)
  if (/^\d+$/.test(stripped)) {
    target.add(`telegram:${stripped}`)
    target.add(`telegramid:${stripped}`)
    target.add(`telegram:id:${stripped}`)
    target.add(`tguid:${stripped}`)
    target.add(`tg:${stripped}`)
  }
}

async function getLinkedIdentityIds(database, userId) {
  const seed = str(userId)
  const ids = new Set()
  addIdentityVariants(ids, seed)
  if (!seed) return []
  const seedVariants = Array.from(ids)
  const walletRegexClauses = seedVariants
    .filter((id) => /^0x[a-f0-9]{40}$/i.test(id))
    .flatMap((id) => {
      const exact = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      return [
        { accountId: exact },
        { canonicalAccountId: exact },
        { userId: exact },
        { alias: exact },
        { aliasId: exact },
        { aliasValue: exact },
      ]
    })
  const aliases = await database.collection('account_aliases').find({
    $or: [
      { accountId: seed },
      { canonicalAccountId: seed },
      { userId: seed },
      { alias: { $in: seedVariants } },
      { aliasId: { $in: seedVariants } },
      { aliasValue: { $in: seedVariants } },
      ...walletRegexClauses,
    ],
  }).limit(500).toArray().catch(() => [])
  for (const row of aliases || []) {
    addIdentityVariants(ids, row?.accountId)
    addIdentityVariants(ids, row?.canonicalAccountId)
    addIdentityVariants(ids, row?.userId)
    addIdentityVariants(ids, row?.alias)
    addIdentityVariants(ids, row?.aliasId)
    addIdentityVariants(ids, row?.aliasValue)
  }
  return Array.from(ids).filter(Boolean)
}

function cleanTopicList(list = []) {
  return sortForumList((Array.isArray(list) ? list : []).filter(isFullTopicShape))
}

function cleanPostList(list = []) {
  return sortForumList((Array.isArray(list) ? list : []).filter(isFullPostShape))
}

async function readCanonicalPayload(database) {
  const [topicsRaw, postsRaw, bannedDoc] = await Promise.all([
    database.collection('forum_core_topics').find({ _del: { $ne: 1 } }).toArray().catch(() => []),
    database.collection('forum_core_posts').find({ _del: { $ne: 1 } }).toArray().catch(() => []),
    database.collection('forum_admin_state').findOne({ key: 'banned_users' }).catch(() => null),
  ])
  return {
    topics: cleanTopicList(topicsRaw.map(readTopicFromDoc).filter(Boolean)),
    posts: cleanPostList(postsRaw.map(readPostFromDoc).filter(Boolean)),
    banned: Array.isArray(bannedDoc?.members) ? bannedDoc.members : [],
    errors: [],
  }
}

function mergeSnapshotWithCanonical(snapshotPayload = {}, canonicalPayload = {}) {
  const mergeList = (snapshotList = [], canonicalList = [], isFullShape = () => true) => {
    const map = new Map()
    for (const item of Array.isArray(snapshotList) ? snapshotList : []) {
      const id = str(item?.id)
      if (id && !item?._del && isFullShape(item)) map.set(id, clone(item))
    }
    for (const item of Array.isArray(canonicalList) ? canonicalList : []) {
      const id = str(item?.id)
      if (id && !item?._del && isFullShape(item)) map.set(id, { ...(map.get(id) || {}), ...clone(item) })
    }
    return sortForumList(Array.from(map.values()))
  }
  const banned = Array.isArray(canonicalPayload.banned) && canonicalPayload.banned.length
    ? canonicalPayload.banned
    : (Array.isArray(snapshotPayload.banned) ? snapshotPayload.banned : [])
  const errors = Array.isArray(snapshotPayload.errors) ? snapshotPayload.errors : []
  return {
    topics: mergeList(snapshotPayload.topics, canonicalPayload.topics, isFullTopicShape),
    posts: mergeList(snapshotPayload.posts, canonicalPayload.posts, isFullPostShape),
    banned,
    errors,
  }
}

async function readSnapshot({ sinceRev = 0, limit = 10000 } = {}) {
  const database = await db()
  const currentRev = await readCounter('forum:rev', 0)
  const since = num(sinceRev, 0)

  if (!since || since <= 0) {
    const [snap, canonical] = await Promise.all([
      readSnapshotRaw(database),
      readCanonicalPayload(database),
    ])
    const payload = mergeSnapshotWithCanonical(snap.payload || {}, canonical)
    return { rev: Math.max(num(snap.rev, 0), currentRev), ...payload }
  }

  const take = Math.max(1, Math.min(50000, Number(limit) || 10000))
  const docs = await database.collection('forum_core_change_events')
    .find({ rev: { $gt: since } })
    .sort({ rev: 1, ts: 1 })
    .limit(take)
    .toArray()
  const events = docs
    .map((doc) => {
      if (doc?.parsed && typeof doc.parsed === 'object') return doc.parsed
      if (doc?.raw) {
        try { return JSON.parse(String(doc.raw)) } catch {}
      }
      return null
    })
    .filter(Boolean)

  if (currentRev > since && events.length === 0) {
    const [snap, canonical] = await Promise.all([
      readSnapshotRaw(database),
      readCanonicalPayload(database),
    ])
    const payload = mergeSnapshotWithCanonical(snap.payload || {}, canonical)
    return { rev: Math.max(num(snap.rev, 0), currentRev), ...payload, full: true, gap: true }
  }

  return { rev: currentRev, events, full: false }
}

async function writeSnapshotRaw(database, snap) {
  // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
  // Keep the old method shape for callers, but do not write any legacy full snapshot collection.
  void database
  const clean = {
    rev: num(snap?.rev, 0),
    payload: {
      topics: cleanTopicList(Array.isArray(snap?.payload?.topics) ? snap.payload.topics : []),
      posts: cleanPostList(Array.isArray(snap?.payload?.posts) ? snap.payload.posts : []),
      banned: Array.isArray(snap?.payload?.banned) ? snap.payload.banned : [],
      errors: Array.isArray(snap?.payload?.errors) ? snap.payload.errors : [],
    },
    skippedLegacyWrite: true,
    source: 'mongo_core_canonical_only',
  }
  return clean
}


function removeListIds(list, ids) {
  const set = new Set((Array.isArray(ids) ? ids : [ids]).map(str).filter(Boolean))
  return (Array.isArray(list) ? list : []).filter((item) => !set.has(str(item?.id)))
}

function patchListItem(list, id, value, isFullShape) {
  const arr = Array.isArray(list) ? list : []
  if (!value || typeof value !== 'object') return arr
  const cleanId = str(value?.id || id)
  if (!cleanId) return arr
  const idx = arr.findIndex((row) => str(row?.id) === cleanId)
  const next = { ...clone(value), id: cleanId }
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...next }
    return arr
  }
  if (isFullShape(next)) arr.unshift(next)
  return arr
}

async function patchSnapshot({ rev, patch = {} } = {}) {
  // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
  // Projection indexes/change-events are the runtime sync source; old full snapshot patching is disabled.
  void rev
  void patch
  return true
}


async function rebuildSnapshot() {
  // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
  // Compatibility no-op: build canonical payload for callers, but do not persist a legacy full snapshot.
  const database = await db()
  const rev = await readCounter('forum:rev', 0)
  const payload = await readCanonicalPayload(database)
  return { rev, payload, skippedLegacyWrite: true, source: 'mongo_core_canonical_only' }
}


async function createTopic({ title, description, userId, nickname, icon, ts, _geoOrigin = null }) {
  const database = await db()
  const topicId = String(await nextTopicId())
  const rev = await nextRev()
  const t = {
    id: topicId,
    topicId,
    title: str(title),
    description: str(description),
    ts: ts ?? now(),
    userId: str(userId),
    nickname: str(nickname),
    icon: str(icon),
    isAdmin: '0',
    postsCount: 0,
    views: 0,
    storagePrimary: 'mongo',
    updatedAt: nowIso(),
  }
  if (_geoOrigin && typeof _geoOrigin === 'object') t._geoOrigin = clone(_geoOrigin)
  await database.collection('forum_core_topics').updateOne(
    { _id: `topic:${topicId}` },
    { $set: t, $setOnInsert: { createdAt: nowIso() } },
    { upsert: true },
  )
  await writeChange({ rev, kind: 'topic', id: topicId, data: t, ts: t.ts })
  await patchSnapshot({ rev, patch: { topics: { [topicId]: t } } })
  return { topic: t, rev }
}

async function createPost({ topicId, parentId, text, userId, nickname, icon, ts, _geoOrigin = null }) {
  const database = await db()
  const postId = String(await nextPostId())
  const rev = await nextRev()
  const tid = str(topicId)
  const p = {
    id: postId,
    postId,
    topicId: tid,
    parentId: parentId ? str(parentId) : null,
    text: str(text),
    ts: ts ?? now(),
    userId: str(userId),
    nickname: str(nickname),
    icon: str(icon),
    isAdmin: '0',
    likes: 0,
    dislikes: 0,
    views: 0,
    storagePrimary: 'mongo',
    updatedAt: nowIso(),
  }
  if (_geoOrigin && typeof _geoOrigin === 'object') p._geoOrigin = clone(_geoOrigin)
  await database.collection('forum_core_posts').updateOne(
    { _id: `post:${postId}` },
    { $set: p, $setOnInsert: { createdAt: nowIso() } },
    { upsert: true },
  )
  const topicUpdate = await database.collection('forum_core_topics').findOneAndUpdate(
    { _id: `topic:${tid}` },
    { $inc: { postsCount: 1 }, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  ).catch(() => null)
  const topic = readTopicFromDoc(topicUpdate?.value || topicUpdate)
  await writeChange({ rev, kind: 'post', id: postId, data: p, ts: p.ts })
  await patchSnapshot({
    rev,
    patch: {
      topics: topic ? { [tid]: topic } : {},
      posts: { [postId]: p },
    },
  })
  return { post: p, rev }
}

async function getTopic(topicId) {
  const database = await db()
  const tid = str(topicId)
  if (!tid) return null
  return readTopicFromDoc(await database.collection('forum_core_topics').findOne({ _id: `topic:${tid}` }))
}

async function getPost(postId) {
  const database = await db()
  const pid = str(postId)
  if (!pid) return null
  return readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${pid}` }))
}

async function getUserTotals(userId) {
  const database = await db()
  const uid = str(userId)
  if (!uid) return { postsTotal: 0, topicsTotal: 0, likesTotal: 0 }
  const identityIds = await getLinkedIdentityIds(database, uid)
  const identitySet = new Set(identityIds)
  const [postsRaw, topicsRaw, snap] = await Promise.all([
    database.collection('forum_core_posts').find({
      _del: { $ne: 1 },
      $or: [{ userId: { $in: identityIds } }, { accountId: { $in: identityIds } }],
    }).toArray(),
    database.collection('forum_core_topics').find({
      _del: { $ne: 1 },
      $or: [{ userId: { $in: identityIds } }, { accountId: { $in: identityIds } }],
    }).toArray(),
    readLegacySnapshotRaw(database).catch(() => ({ payload: {} })),
  ])
  const postsById = new Map()
  const topicsById = new Map()
  const addPost = (post) => {
    const row = readPostFromDoc(post)
    const id = str(row?.id)
    const authorId = str(row?.userId || row?.accountId)
    if (id && identitySet.has(authorId) && isFullPostShape(row)) postsById.set(id, { ...(postsById.get(id) || {}), ...row })
  }
  const addTopic = (topic) => {
    const row = readTopicFromDoc(topic)
    const id = str(row?.id)
    const authorId = str(row?.userId || row?.accountId)
    if (id && identitySet.has(authorId) && isFullTopicShape(row)) topicsById.set(id, { ...(topicsById.get(id) || {}), ...row })
  }
  postsRaw.forEach(addPost)
  topicsRaw.forEach(addTopic)
  for (const post of Array.isArray(snap?.payload?.posts) ? snap.payload.posts : []) addPost(post)
  for (const topic of Array.isArray(snap?.payload?.topics) ? snap.payload.topics : []) addTopic(topic)
  const posts = Array.from(postsById.values())
  return {
    postsTotal: postsById.size,
    topicsTotal: topicsById.size,
    likesTotal: posts.reduce((sum, post) => sum + num(post?.likes, 0), 0),
  }
}

async function updatePostText(postId, text) {
  const database = await db()
  const pid = str(postId)
  if (!pid) return { post: null, notFound: true }
  const result = await database.collection('forum_core_posts').findOneAndUpdate(
    { _id: `post:${pid}` },
    { $set: { text: str(text), tsEdited: now(), updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  )
  const post = readPostFromDoc(result?.value || result)
  if (!post) return { post: null, notFound: true }
  const rev = await nextRev()
  await writeChange({ rev, kind: 'post_edit', id: pid, data: { text: str(text) }, ts: now() })
  await patchSnapshot({ rev, patch: { posts: { [pid]: post } } })
  return { post, rev }
}

async function updatePostCounters(postId, patch = {}) {
  const pid = str(postId)
  if (!pid) return null
  const database = await db()
  await database.collection('forum_core_posts').updateOne(
    { _id: `post:${pid}` },
    { $set: { ...patch, updatedAt: nowIso(), storagePrimary: 'mongo' } },
  )
  const doc = readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${pid}` }))
  if (doc) await patchSnapshot({ rev: await readCounter('forum:rev', 0), patch: { posts: { [pid]: doc } } })
  return doc
}

async function incrementPostCounters(postId, patch = {}) {
  const pid = str(postId)
  if (!pid) return null
  const inc = {}
  if (Number.isFinite(Number(patch.likes))) inc.likes = Number(patch.likes)
  if (Number.isFinite(Number(patch.dislikes))) inc.dislikes = Number(patch.dislikes)
  if (!Object.keys(inc).length) return getPost(pid)
  const database = await db()
  const result = await database.collection('forum_core_posts').findOneAndUpdate(
    { _id: `post:${pid}` },
    { $inc: inc, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  )
  const post = readPostFromDoc(result?.value || result)
  if (post) await patchSnapshot({ rev: await readCounter('forum:rev', 0), patch: { posts: { [pid]: post } } })
  return post
}

async function incrementPostViews(postId, delta = 1) {
  const database = await db()
  const pid = str(postId)
  if (!pid) return 0
  const result = await database.collection('forum_core_posts').findOneAndUpdate(
    { _id: `post:${pid}` },
    { $inc: { views: num(delta, 1) }, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  )
  const post = readPostFromDoc(result?.value || result)
  if (post) await patchSnapshot({ rev: await readCounter('forum:rev', 0), patch: { posts: { [pid]: post } } })
  return num(post?.views, 0)
}

async function incrementTopicViews(topicId, delta = 1) {
  const database = await db()
  const tid = str(topicId)
  if (!tid) return 0
  const result = await database.collection('forum_core_topics').findOneAndUpdate(
    { _id: `topic:${tid}` },
    { $inc: { views: num(delta, 1) }, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  )
  const topic = readTopicFromDoc(result?.value || result)
  if (topic) await patchSnapshot({ rev: await readCounter('forum:rev', 0), patch: { topics: { [tid]: topic } } })
  return num(topic?.views, 0)
}

async function setReaction({ postId, userId, kind }) {
  const pid = str(postId)
  const uid = str(userId)
  const target = kind === 'dislike' ? 'dislike' : 'like'
  if (!pid || !uid) throw new Error('bad_react_args')
  const database = await db()
  const key = `reaction:${pid}:${uid}`
  const existing = await database.collection('forum_post_reactions').findOne({ _id: key }).catch(() => null)
  const prev = str(existing?.kind)
  if (prev === target) {
    const post = readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${pid}` }))
    return { state: target, likes: num(post?.likes, 0), dislikes: num(post?.dislikes, 0), changed: false }
  }
  const inc = {}
  if (prev === 'like') inc.likes = -1
  if (prev === 'dislike') inc.dislikes = -1
  if (target === 'like') inc.likes = (inc.likes || 0) + 1
  if (target === 'dislike') inc.dislikes = (inc.dislikes || 0) + 1
  await database.collection('forum_post_reactions').updateOne(
    { _id: key },
    { $set: { postId: pid, userId: uid, kind: target, updatedAt: nowIso(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: nowIso() } },
    { upsert: true },
  )
  const result = await database.collection('forum_core_posts').findOneAndUpdate(
    { _id: `post:${pid}` },
    { $inc: inc, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    { returnDocument: 'after' },
  )
  const post = readPostFromDoc(result?.value || result)
  const rev = await nextRev()
  await writeChange({ rev, kind: 'post', id: pid, data: { likes: num(post?.likes, 0), dislikes: num(post?.dislikes, 0) }, ts: now() })
  if (post) await patchSnapshot({ rev, patch: { posts: { [pid]: post } } })
  return { state: target, likes: num(post?.likes, 0), dislikes: num(post?.dislikes, 0), changed: true, rev }
}

async function setPostReactionState({ postId, userId, state }) {
  const pid = str(postId)
  const uid = str(userId)
  if (!pid || !uid) throw new Error('bad_react_args')
  const database = await db()
  const existing = await database.collection('forum_post_reactions')
    .findOne({ _id: `reaction:${pid}:${uid}` })
    .catch(() => null)
  const prev = str(existing?.kind)
  const next = state === 'like' || state === 'dislike' ? state : prev
  const postBefore = readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${pid}` }))
  if (!next || prev === next) {
    return {
      state: next || null,
      likes: num(postBefore?.likes, 0),
      dislikes: num(postBefore?.dislikes, 0),
      changed: false,
      likeDelta: 0,
      authorId: str(postBefore?.userId || postBefore?.accountId) || null,
    }
  }
  const result = await setReaction({ postId: pid, userId: uid, kind: next })
  const likeDelta = (next === 'like' ? 1 : 0) - (prev === 'like' ? 1 : 0)
  return {
    ...result,
    likeDelta,
    authorId: str(postBefore?.userId || postBefore?.accountId) || null,
  }
}

async function deletePostHard(postId) {
  const database = await db()
  const pid = str(postId)
  const post = readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${pid}` }))
  if (!post) return { rev: await nextRev(), notFound: true }
  await database.collection('forum_core_posts').deleteOne({ _id: `post:${pid}` })
  if (post.topicId) {
    await database.collection('forum_core_topics').updateOne(
      { _id: `topic:${post.topicId}` },
      { $inc: { postsCount: -1 }, $set: { updatedAt: nowIso(), storagePrimary: 'mongo' } },
    )
  }
  const rev = await nextRev()
  await writeChange({ rev, kind: 'post', id: pid, _del: 1, ts: now(), topicId: post.topicId })
  await patchSnapshot({ rev, patch: { removePostIds: [pid] } })
  return { rev, post }
}

async function collectPostBranch(rootId) {
  const database = await db()
  const root = str(rootId)
  if (!root) return []
  const all = (await database.collection('forum_core_posts').find({}).toArray()).map(readPostFromDoc).filter(Boolean)
  const toDelete = new Set([root])
  let grow = true
  while (grow) {
    grow = false
    for (const post of all) {
      const pid = str(post?.id)
      if (!pid || toDelete.has(pid)) continue
      if (post?.parentId && toDelete.has(str(post.parentId))) {
        toDelete.add(pid)
        grow = true
      }
    }
  }
  for (const id of await collectProjectionPostBranchIds(database, root)) toDelete.add(id)
  return Array.from(toDelete)
}

async function collectProjectionPostBranchIds(database, rootId) {
  const root = str(rootId)
  if (!root) return []
  const branchQuery = {
    $or: [
      { postId: root },
      { sourcePostId: root },
      { rootPostId: root },
      { parentId: root },
      { ancestorIds: root },
      { 'post.postId': root },
      { 'post.id': root },
      { 'post.rootPostId': root },
      { 'post.parentId': root },
      { 'post.ancestorIds': root },
    ],
  }
  const rows = (await Promise.all([
    database.collection('forum_thread_index').find(branchQuery).limit(10000).toArray().catch(() => []),
    database.collection('forum_user_post_index').find(branchQuery).limit(10000).toArray().catch(() => []),
    database.collection('forum_search_index').find(branchQuery).limit(10000).toArray().catch(() => []),
    database.collection('forum_geo_feed_index').find(branchQuery).limit(10000).toArray().catch(() => []),
    database.collection('forum_media_feed_index').find(branchQuery).limit(10000).toArray().catch(() => []),
    database.collection('forum_reply_inbox_index').find(branchQuery).limit(10000).toArray().catch(() => []),
  ])).flat()
  const ids = new Set([root])
  for (const row of rows || []) {
    const pid = str(row?.postId || row?.sourcePostId || row?.entityId || row?.post?.postId || row?.post?.id || row?._id).replace(/^post:/, '')
    if (pid) ids.add(pid)
  }
  return Array.from(ids)
}

function postAuthorId(post = {}) {
  return str(post?.canonicalAuthorId || post?.accountId || post?.userId || post?.authorId || post?.ownerId || post?.uid)
}

function postIdentityFilter(ids = []) {
  const clean = unique(ids)
  if (!clean.length) return { _id: '__ql7_no_identity__' }
  return {
    $or: [
      { canonicalAuthorId: { $in: clean } },
      { accountId: { $in: clean } },
      { userId: { $in: clean } },
      { authorId: { $in: clean } },
      { ownerId: { $in: clean } },
      { uid: { $in: clean } },
    ],
  }
}

function topicIdentityFilter(ids = []) {
  return postIdentityFilter(ids)
}

async function deletePostProjectionRows(database, postIds = []) {
  const ids = unique(postIds)
  if (!ids.length) return { deleted: 0, collections: {} }
  const specs = [
    ['forum_thread_index', { postId: { $in: ids } }],
    ['forum_user_post_index', { postId: { $in: ids } }],
    ['forum_search_index', { postId: { $in: ids } }],
    ['forum_geo_feed_index', { postId: { $in: ids } }],
    ['forum_media_feed_index', { postId: { $in: ids } }],
    ['forum_reply_inbox_index', { $or: [{ postId: { $in: ids } }, { sourcePostId: { $in: ids } }] }],
  ]
  const collections = {}
  let deleted = 0
  for (const [name, filter] of specs) {
    const result = await database.collection(name).deleteMany(filter).catch(() => ({ deletedCount: 0 }))
    const count = num(result?.deletedCount, 0)
    collections[name] = count
    deleted += count
  }
  return { deleted, collections }
}

async function collectProjectionRowsForPostIds(database, postIds = []) {
  const ids = unique(postIds)
  if (!ids.length) return []
  const filter = { $or: [{ postId: { $in: ids } }, { sourcePostId: { $in: ids } }] }
  return (await Promise.all([
    database.collection('forum_thread_index').find(filter).limit(10000).toArray().catch(() => []),
    database.collection('forum_user_post_index').find(filter).limit(10000).toArray().catch(() => []),
    database.collection('forum_search_index').find(filter).limit(10000).toArray().catch(() => []),
    database.collection('forum_geo_feed_index').find(filter).limit(10000).toArray().catch(() => []),
    database.collection('forum_media_feed_index').find(filter).limit(10000).toArray().catch(() => []),
    database.collection('forum_reply_inbox_index').find(filter).limit(10000).toArray().catch(() => []),
  ])).flat()
}

function projectionPostFromRow(row = {}) {
  const embedded = row.post && typeof row.post === 'object' ? row.post : {}
  return {
    ...clone(embedded),
    id: str(row.postId || row.sourcePostId || embedded.id || embedded.postId || row.id || row._id).replace(/^post:/, ''),
    postId: str(row.postId || row.sourcePostId || embedded.postId || embedded.id || row.id || row._id).replace(/^post:/, ''),
    topicId: str(row.topicId ?? embedded.topicId),
    parentId: row.parentId == null && embedded.parentId == null ? null : str(row.parentId ?? embedded.parentId),
    canonicalAuthorId: str(row.canonicalAuthorId || embedded.canonicalAuthorId),
    accountId: str(row.accountId || embedded.accountId),
    userId: str(row.userId || embedded.userId),
    authorId: str(row.authorId || embedded.authorId),
    ownerId: str(row.ownerId || embedded.ownerId),
    uid: str(row.uid || embedded.uid),
  }
}

async function reconcileTopicPostCounts(database, topicIds = []) {
  const ids = unique(topicIds)
  const out = {}
  for (const topicId of ids) {
    const postsCount = await database.collection('forum_core_posts').countDocuments({
      topicId,
      _del: { $ne: 1 },
    }).catch(() => 0)
    const topicUpdate = {
      postsCount,
      replies: postsCount,
      repliesCount: postsCount,
      updatedAt: nowIso(),
      storagePrimary: 'mongo',
    }
    await database.collection('forum_core_topics').updateOne(
      { _id: `topic:${topicId}` },
      { $set: topicUpdate },
    ).catch(() => null)
    const projectionSet = {
      'counters.posts': postsCount,
      'counters.replies': postsCount,
      'counters.repliesCount': postsCount,
      'sort.posts': postsCount,
      'sort.replies': postsCount,
      'sort.repliesCount': postsCount,
      'topic.postsCount': postsCount,
      'topic.replies': postsCount,
      'topic.repliesCount': postsCount,
      updatedAt: nowIso(),
      storagePrimary: 'mongo',
    }
    await Promise.allSettled([
      database.collection('forum_user_topic_index').updateMany({ topicId }, { $set: projectionSet }),
      database.collection('forum_search_index').updateMany({ kind: 'topic', topicId }, { $set: projectionSet }),
    ])
    out[topicId] = postsCount
  }
  return out
}

async function reconcileParentReplyCounts(database, parentIds = []) {
  const ids = unique(parentIds)
  const out = {}
  for (const parentId of ids) {
    const replies = await database.collection('forum_core_posts').countDocuments({
      parentId,
      _del: { $ne: 1 },
    }).catch(() => 0)
    const set = {
      replies,
      replyCount: replies,
      repliesCount: replies,
      answersCount: replies,
      commentsCount: replies,
      __repliesCount: replies,
      'counters.replies': replies,
      'counters.replyCount': replies,
      'counters.repliesCount': replies,
      'counters.answersCount': replies,
      'counters.commentsCount': replies,
      'sort.replies': replies,
      'sort.replyCount': replies,
      'sort.repliesCount': replies,
      'sort.answersCount': replies,
      'sort.commentsCount': replies,
      updatedAt: nowIso(),
      storagePrimary: 'mongo',
    }
    const projectionSet = {
      ...set,
      'post.replies': replies,
      'post.replyCount': replies,
      'post.repliesCount': replies,
      'post.answersCount': replies,
      'post.commentsCount': replies,
      'post.__repliesCount': replies,
    }
    await Promise.allSettled([
      database.collection('forum_core_posts').updateOne({ _id: `post:${parentId}` }, { $set: set }),
      database.collection('forum_thread_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      database.collection('forum_user_post_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      database.collection('forum_search_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      database.collection('forum_geo_feed_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      database.collection('forum_media_feed_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      database.collection('forum_reply_inbox_index').updateMany({ postId: parentId }, { $set: projectionSet }),
    ])
    out[parentId] = replies
  }
  return out
}

async function reconcileForumUserStats(database, userIds = []) {
  const seeds = unique(userIds)
  const out = {}
  for (const seed of seeds) {
    const linked = await getLinkedIdentityIds(database, seed).catch(() => [seed])
    const ids = unique([seed, ...(Array.isArray(linked) ? linked : [])])
    const authorFilter = postIdentityFilter(ids)
    const topicFilter = topicIdentityFilter(ids)
    const [postRows, topicRows, inboxCount] = await Promise.all([
      database.collection('forum_core_posts').find({ _del: { $ne: 1 }, ...authorFilter }).limit(50000).toArray().catch(() => []),
      database.collection('forum_core_topics').find({ _del: { $ne: 1 }, ...topicFilter }).limit(50000).toArray().catch(() => []),
      database.collection('forum_reply_inbox_index').countDocuments({ recipientCanonicalId: { $in: ids }, 'visibility.deleted': false }).catch(() => 0),
    ])
    const postsById = new Map()
    for (const row of postRows || []) {
      const post = readPostFromDoc(row)
      if (post?.id) postsById.set(post.id, post)
    }
    const topicsById = new Map()
    for (const row of topicRows || []) {
      const topic = readTopicFromDoc(row)
      if (topic?.id) topicsById.set(topic.id, topic)
    }
    const stats = {
      posts: postsById.size,
      topics: topicsById.size,
      likes: Array.from(postsById.values()).reduce((sum, post) => sum + num(post?.likes, 0), 0),
      repliesReceived: num(inboxCount, 0),
    }
    const writeIds = unique([seed, preferredIdentityKey(ids, seed)])
    for (const id of writeIds) {
      await database.collection('forum_user_stats').updateOne(
        { _id: id },
        {
          $set: {
            canonicalAuthorId: id,
            stats,
            updatedAt: nowIso(),
            storagePrimary: 'mongo',
          },
          $setOnInsert: { createdAt: nowIso() },
        },
        { upsert: true },
      ).catch(() => null)
    }
    out[seed] = stats
  }
  return out
}

async function deletePostBranchHard(rootId) {
  const branch = await collectPostBranch(rootId)
  const database = await db()
  const posts = branch.length
    ? (await database.collection('forum_core_posts').find({ _id: { $in: branch.map((id) => `post:${id}`) } }).toArray())
        .map(readPostFromDoc)
        .filter(Boolean)
    : []
  const projectionRows = await collectProjectionRowsForPostIds(database, branch)
  const postById = new Map(posts.map((post) => [str(post?.id), post]).filter(([id]) => id))
  const deletedSet = new Set(branch)
  const topicCounts = new Map()
  const touchedTopicIds = new Set()
  const touchedUserIds = new Set()
  const touchedParentIds = new Set()
  const orphanProjectionPosts = projectionRows
    .map(projectionPostFromRow)
    .filter((post) => {
      const pid = str(post?.id || post?.postId)
      return pid && !postById.has(pid)
    })
  for (const post of [...posts, ...orphanProjectionPosts]) {
    const tid = str(post?.topicId)
    if (tid) {
      topicCounts.set(tid, (topicCounts.get(tid) || 0) + 1)
      touchedTopicIds.add(tid)
    }
    const authorId = postAuthorId(post)
    if (authorId) touchedUserIds.add(authorId)
    const parentId = post?.parentId == null ? '' : str(post.parentId)
    if (parentId) {
      const parent = postById.get(parentId) || readPostFromDoc(await database.collection('forum_core_posts').findOne({ _id: `post:${parentId}` }).catch(() => null))
      const recipientId = postAuthorId(parent)
      if (recipientId) touchedUserIds.add(recipientId)
      if (!deletedSet.has(parentId)) touchedParentIds.add(parentId)
    }
  }
  for (const row of projectionRows) {
    const recipientId = str(row?.recipientCanonicalId || row?.recipientId)
    if (recipientId) touchedUserIds.add(recipientId)
  }
  if (branch.length) {
    await database.collection('forum_core_posts').deleteMany({ _id: { $in: branch.map((id) => `post:${id}`) } })
  }
  const projectionCleanup = await deletePostProjectionRows(database, branch)
  const topicPostCounts = await reconcileTopicPostCounts(database, Array.from(touchedTopicIds))
  const parentReplyCounts = await reconcileParentReplyCounts(database, Array.from(touchedParentIds))
  const userStats = await reconcileForumUserStats(database, Array.from(touchedUserIds))
  const rev = await nextRev()
  const ts = now()
  await writeChange({ rev, kind: 'post', id: str(rootId), _del: 1, deleted: branch, deletedPostIds: branch, ts })
  await writeChange({ rev, kind: 'post_deleted', id: str(rootId), deleted: branch, deletedPostIds: branch, ts })
  const topicPatch = {}
  for (const topicId of topicCounts.keys()) {
    const topic = await getTopic(topicId)
    if (topic) topicPatch[topicId] = topic
  }
  await patchSnapshot({ rev, patch: { topics: topicPatch, removePostIds: branch } })
  return {
    deleted: branch,
    deletedPostIds: branch,
    rev,
    alreadyDeleted: posts.length === 0,
    postsDeletedCount: posts.length,
    projectionCleanup,
    topicPostCounts,
    parentReplyCounts,
    userStats,
  }
}

async function deleteTopicHard(topicId) {
  const database = await db()
  const tid = str(topicId)
  const posts = (await database.collection('forum_core_posts').find({ topicId: tid }).toArray()).map(readPostFromDoc).filter(Boolean)
  const postIds = posts.map((post) => str(post.id)).filter(Boolean)
  await Promise.allSettled([
    database.collection('forum_core_topics').deleteOne({ _id: `topic:${tid}` }),
    postIds.length ? database.collection('forum_core_posts').deleteMany({ _id: { $in: postIds.map((id) => `post:${id}`) } }) : Promise.resolve(),
  ])
  const rev = await nextRev()
  await writeChange({ rev, kind: 'topic_deleted', id: tid, deletedPosts: postIds, ts: now() })
  await patchSnapshot({ rev, patch: { removeTopicIds: [tid], removePostIds: postIds } })
  return { rev, deletedPosts: postIds }
}

async function readSetDoc(id) {
  const database = await db()
  return database.collection('forum_subscription_sets').findOne({ _id: id }).catch(() => null)
}

function unique(list) {
  return Array.from(new Set((Array.isArray(list) ? list : []).map(str).filter(Boolean)))
}

function preferredIdentityKey(ids = [], fallback = '') {
  const list = unique([...(Array.isArray(ids) ? ids : []), fallback])
  const wallet = list.find((id) => /^0x[a-f0-9]{40}$/i.test(id) || /^wallet:0x[a-f0-9]{40}$/i.test(id))
  if (wallet) return String(wallet).replace(/^wallet:/i, '').toLowerCase()

  const first = list[0] || str(fallback)
  const lower = first.toLowerCase()
  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
    if (lower.startsWith(prefix)) return first.slice(prefix.length)
  }

  return first
}

async function canonicalSubscriptionMember(database, member) {
  const raw = str(member)
  if (!raw) return ''
  const linked = await getLinkedIdentityIds(database, raw).catch(() => [])
  const preferred = preferredIdentityKey(linked, raw)
  return preferred || raw
}

function rowsFromSetDoc(doc = {}) {
  if (!doc) return []

  if (Array.isArray(doc?.rows) && doc.rows.length) {
    return doc.rows
      .map((row, idx) => ({
        member: str(row?.member || row?.userId || row?.id || row),
        score: num(row?.score, doc.rows.length - idx),
      }))
      .filter((row) => row.member)
  }

  const members = unique([
    ...(Array.isArray(doc?.members) ? doc.members : []),
    ...(Array.isArray(doc?.value) ? doc.value : []),
    ...(Array.isArray(doc?.ids) ? doc.ids : []),
  ])

  return members.map((member, idx) => ({ member, score: members.length - idx }))
}

async function readSubscriptionRowsForIdentity(userId, mode = 'followers') {
  const uid = str(userId)
  if (!uid) return { rows: [], identityIds: [] }

  const safeMode = mode === 'following' ? 'following' : 'followers'
  const database = await db()

  const identitySeed = new Set()
  addIdentityVariants(identitySeed, uid)

  const linked = await getLinkedIdentityIds(database, uid).catch(() => [])
  for (const id of linked || []) addIdentityVariants(identitySeed, id)

  const identityIds = unique(Array.from(identitySeed)).slice(0, 120)
  const prefixes = safeMode === 'following' ? ['followingZ:', 'viewer:'] : ['followersZ:', 'followers:']
  const docKeys = unique(identityIds.flatMap((id) => prefixes.map((prefix) => `${prefix}${id}`)))

  const walletRegexClauses = identityIds
    .filter((id) => /^0x[a-f0-9]{40}$/i.test(id) || /^wallet:0x[a-f0-9]{40}$/i.test(id))
    .flatMap((id) => {
      const wallet = String(id).replace(/^wallet:/i, '')
      const escaped = wallet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return prefixes.map((prefix) => ({ _id: new RegExp(`^${prefix}(?:wallet:)?${escaped}$`, 'i') }))
    })

  let docs = []
  if (docKeys.length || walletRegexClauses.length) {
    docs = await database.collection('forum_subscription_sets')
      .find({ $or: [{ _id: { $in: docKeys } }, ...walletRegexClauses] })
      .maxTimeMS(3000)
      .limit(500)
      .toArray()
      .catch(() => [])
  }

  const ownerKeys = new Set(identityIds.map((id) => preferredIdentityKey([id], id)).filter(Boolean))
  const byKey = new Map()

  for (const doc of docs) {
    for (const row of rowsFromSetDoc(doc)) {
      const rawMember = str(row.member)
      if (!rawMember) continue

      const key = preferredIdentityKey([rawMember], rawMember)
      if (!key || ownerKeys.has(key)) continue

      // Etalon behavior: relation set member is already the source of truth.
      // Profile hydration happens after this layer; do not alias-resolve every member here.
      const current = byKey.get(key)
      const next = { member: rawMember, score: num(row.score, 0) }
      if (!current || next.score > current.score) byKey.set(key, next)
    }
  }

  const rows = Array.from(byKey.values()).sort((a, b) => num(b.score, 0) - num(a.score, 0))
  return { rows, identityIds }
}

async function writeSetDoc(id, members, rows = null) {
  const database = await db()
  const cleanMembers = unique(members)
  await database.collection('forum_subscription_sets').updateOne(
    { _id: id },
    {
      $set: {
        members: cleanMembers,
        rows: Array.isArray(rows) ? rows : cleanMembers.map((member, idx) => ({ member, score: cleanMembers.length - idx })),
        count: cleanMembers.length,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
}

function subscriptionWriteIds(primary, aliases = []) {
  const ids = new Set()
  for (const value of [primary, ...(Array.isArray(aliases) ? aliases : [])]) {
    addIdentityVariants(ids, value)
  }
  return unique(Array.from(ids)).slice(0, 80)
}

function rankedRows(members = [], score = now()) {
  return unique(members).map((member, idx) => ({ member, score: score - idx }))
}

async function writeSubscriptionRelationDocs({ ownerIds = [], mode = 'followers', members = [], rows = null } = {}) {
  const safeMode = mode === 'following' ? 'following' : 'followers'
  const ids = subscriptionWriteIds('', ownerIds)
  if (!ids.length) return
  const cleanMembers = unique(members)
  const cleanRows = Array.isArray(rows) ? rows : rankedRows(cleanMembers)
  const writes = []
  for (const id of ids) {
    if (safeMode === 'following') {
      writes.push(writeSetDoc(`viewer:${id}`, cleanMembers))
      writes.push(writeSetDoc(`followingZ:${id}`, cleanMembers, cleanRows))
    } else {
      writes.push(writeSetDoc(`followers:${id}`, cleanMembers))
      writes.push(writeSetDoc(`followersZ:${id}`, cleanMembers, cleanRows))
      writes.push(setCountDoc(`followers:${id}`, cleanMembers.length))
    }
  }
  await Promise.all(writes)
}

async function setCountDoc(id, value) {
  const database = await db()
  await database.collection('forum_subscription_counts').updateOne(
    { _id: id },
    { $set: { value: num(value, 0), raw: String(num(value, 0)), updatedAt: nowIso(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt: nowIso() } },
    { upsert: true },
  )
}

async function listSubscriptions(viewerId) {
  const { rows } = await readSubscriptionRowsForIdentity(viewerId, 'following')
  return unique(rows.map((row) => row.member))
}

function parseOffsetCursor(raw) {
  const s = str(raw)
  if (!s) return 0
  if (/^\d+$/.test(s)) return Math.max(0, Number(s) || 0)
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))
    if (parsed?.kind === 'rank') return Math.max(0, Number(parsed.offset || 0) || 0)
  } catch {}
  return 0
}

async function listSubscriptionPeoplePage({
  userId,
  mode = 'followers',
  limit = 50,
  cursor = '',
} = {}) {
  const uid = str(userId)
  if (!uid) return { ids: [], totalCount: 0, nextCursor: null, hasMore: false, source: 'mongo' }
  const safeMode = mode === 'following' ? 'following' : 'followers'
  const take = Math.max(1, Math.min(100, Math.floor(Number(limit || 50) || 50)))
  const { rows } = await readSubscriptionRowsForIdentity(uid, safeMode)
  const offset = parseOffsetCursor(cursor)
  const page = rows.slice(offset, offset + take)
  const nextOffset = offset + take
  return {
    ids: page.map((row) => row.member),
    totalCount: rows.length,
    nextCursor: nextOffset < rows.length ? String(nextOffset) : null,
    hasMore: nextOffset < rows.length,
    source: 'mongo',
  }
}

async function getSubscriptionCounts(userId) {
  const uid = str(userId)
  if (!uid) return { followers: 0, following: 0 }
  const [followers, following] = await Promise.all([
    readSubscriptionRowsForIdentity(uid, 'followers'),
    readSubscriptionRowsForIdentity(uid, 'following'),
  ])
  return { followers: unique(followers.rows.map((row) => row.member)).length, following: unique(following.rows.map((row) => row.member)).length }
}

async function getFollowersCount(authorId) {
  return (await getSubscriptionCounts(authorId)).followers
}

async function filterCandidatesBySubscriptionRelation({ ownerId, mode = 'followers', candidateIds = [] } = {}) {
  const owner = str(ownerId)
  if (!owner) return []
  const safeMode = mode === 'following' ? 'following' : 'followers'
  const candidates = unique(candidateIds).filter((id) => id !== owner)
  if (!candidates.length) return []
  const database = await db()
  const { rows } = await readSubscriptionRowsForIdentity(owner, safeMode)
  const members = new Set(rows.map((row) => preferredIdentityKey([row.member], row.member)))
  const out = []
  for (const id of candidates) {
    const linked = await getLinkedIdentityIds(database, id).catch(() => [id])
    const candidateKeys = unique([...linked, id]).map((value) => preferredIdentityKey([value], value))
    if (candidateKeys.some((key) => members.has(key))) out.push(id)
  }
  return out
}

async function toggleSubscription(viewerId, authorId) {
  const viewer = str(viewerId)
  const author = str(authorId)
  if (!viewer) return { ok: false, error: 'no_viewer' }
  if (!author) return { ok: false, error: 'no_author' }
  if (viewer === author) return { ok: false, error: 'self_subscribe' }
  const database = await db()
  const [viewerRows, followerRows, viewerAliases, authorAliases] = await Promise.all([
    readSubscriptionRowsForIdentity(viewer, 'following'),
    readSubscriptionRowsForIdentity(author, 'followers'),
    getLinkedIdentityIds(database, viewer).catch(() => [viewer]),
    getLinkedIdentityIds(database, author).catch(() => [author]),
  ])
  const following = new Set(unique(viewerRows.rows.map((row) => row.member)))
  const followers = new Set(unique(followerRows.rows.map((row) => row.member)))
  const authorKeys = new Set(unique([...authorAliases, author]).map((id) => preferredIdentityKey([id], id)))
  const viewerKeys = new Set(unique([...viewerAliases, viewer]).map((id) => preferredIdentityKey([id], id)))
  if (Array.from(viewerKeys).some((key) => authorKeys.has(key))) return { ok: false, error: 'self_subscribe' }
  const subscribed = !Array.from(following).some((id) => authorKeys.has(preferredIdentityKey([id], id)))
  if (subscribed) {
    following.add(author)
    followers.add(viewer)
  } else {
    for (const id of Array.from(following)) {
      if (authorKeys.has(preferredIdentityKey([id], id))) following.delete(id)
    }
    for (const id of Array.from(followers)) {
      if (viewerKeys.has(preferredIdentityKey([id], id))) followers.delete(id)
    }
  }
  const score = now()
  await Promise.all([
    writeSubscriptionRelationDocs({
      ownerIds: subscriptionWriteIds(viewer, viewerAliases),
      mode: 'following',
      members: Array.from(following),
      rows: rankedRows(Array.from(following), score),
    }),
    writeSubscriptionRelationDocs({
      ownerIds: subscriptionWriteIds(author, authorAliases),
      mode: 'followers',
      members: Array.from(followers),
      rows: rankedRows(Array.from(followers), score),
    }),
  ])
  return { ok: true, subscribed, followersCount: followers.size, followingCount: following.size }
}

async function isBannedUser(userId) {
  const id = str(userId).toLowerCase()
  if (!id) return false
  const doc = await readSetDoc('banned_users')
  return unique(doc?.members).map((x) => x.toLowerCase()).includes(id)
}

async function isBannedIp(ip) {
  const id = str(ip).toLowerCase()
  if (!id) return false
  const doc = await readSetDoc('banned_ips')
  return unique(doc?.members).map((x) => x.toLowerCase()).includes(id)
}

async function setBannedUser(accountId, banned) {
  const id = str(accountId).toLowerCase()
  const doc = await readSetDoc('banned_users')
  const set = new Set(unique(doc?.members).map((x) => x.toLowerCase()))
  if (banned) set.add(id)
  else set.delete(id)
  await writeSetDoc('banned_users', Array.from(set))
  const rev = await nextRev()
  await writeChange({ rev, kind: banned ? 'ban' : 'unban', id, ts: now() })
  await patchSnapshot({ rev, patch: { banned: Array.from(set) } })
  return { rev }
}

async function setBannedIp(ip, banned) {
  const id = str(ip).toLowerCase()
  const doc = await readSetDoc('banned_ips')
  const set = new Set(unique(doc?.members).map((x) => x.toLowerCase()))
  if (banned) set.add(id)
  else set.delete(id)
  await writeSetDoc('banned_ips', Array.from(set))
  const rev = await nextRev()
  await writeChange({ rev, kind: banned ? 'ban_ip' : 'unban_ip', id, data: { ip: id }, ts: now() })
  return { rev }
}

async function listBannedUsers() {
  const doc = await readSetDoc('banned_users')
  return unique(doc?.members)
}

async function reportPost({ postId, reporterId, reason, thresholds = {} } = {}) {
  const pid = str(postId)
  const rid = str(reporterId)
  const rsn = str(reason).toLowerCase()
  if (!pid || !rid) {
    const err = new Error('bad_request')
    err.status = 400
    throw err
  }
  if (!['porn', 'violence', 'boring'].includes(rsn)) {
    const err = new Error('bad_reason')
    err.status = 400
    throw err
  }

  const post = await getPost(pid)
  if (!post) {
    const result = await deletePostBranchHard(pid)
    return {
      ok: true,
      action: 'already_deleted',
      alreadyDeleted: true,
      count: 0,
      deleted: result.deleted || [pid],
      deletedPostIds: result.deletedPostIds || result.deleted || [pid],
      rev: result.rev,
      projectionCleanup: result.projectionCleanup,
    }
  }

  const database = await db()
  const authorId = str(post.userId || post.accountId)
  const [authorAliases, reporterAliases] = await Promise.all([
    authorId ? getLinkedIdentityIds(database, authorId).catch(() => [authorId]) : Promise.resolve([]),
    getLinkedIdentityIds(database, rid).catch(() => [rid]),
  ])
  const authorKeys = new Set(unique([...authorAliases, authorId]).map((id) => preferredIdentityKey([id], id)))
  const reporterKeys = unique([...reporterAliases, rid]).map((id) => preferredIdentityKey([id], id))
  if (authorId && reporterKeys.some((key) => authorKeys.has(key))) {
    const err = new Error('self_report')
    err.status = 403
    throw err
  }
  const reporterKey = preferredIdentityKey([...reporterAliases, rid], rid)

  const reportId = `post:${pid}:reporter:${reporterKey || rid}`
  const existing = await database.collection('forum_reports').findOne({ _id: reportId }).catch(() => null)
  if (existing) return { ok: true, duplicate: true }

  await database.collection('forum_reports').updateOne(
    { _id: reportId },
    {
      $set: {
        postId: pid,
        reporterId: rid,
        reporterKey: reporterKey || rid,
        reason: rsn,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )

  const reportRows = await database.collection('forum_reports').find({ postId: pid, reason: rsn }).limit(5000).toArray().catch(() => [])
  const count = new Set((reportRows || []).map((row) => str(row?.reporterKey || row?.reporterId)).filter(Boolean)).size
  const shouldDelete =
    (rsn === 'porn' && count >= num(thresholds.porn, 3)) ||
    (rsn === 'violence' && count >= num(thresholds.violence, 3)) ||
    (rsn === 'boring' && count >= num(thresholds.boring, 20))

  if (!shouldDelete) return { ok: true, action: 'counted', count }

  const result = await deletePostBranchHard(pid)
  const deleted = result.deleted || [pid]
  const deletedPostIds = result.deletedPostIds || deleted
  const rev = result.rev
  await rebuildSnapshot()

  if (rsn === 'porn' || rsn === 'violence') {
    return {
      ok: true,
      action: authorId ? 'deleted_and_locked' : 'deleted',
      count,
      lockedUserId: authorId || undefined,
      deleted,
      deletedPostIds,
      rev,
      projectionCleanup: result.projectionCleanup,
    }
  }

  return { ok: true, action: 'deleted', count, deleted, deletedPostIds, rev, projectionCleanup: result.projectionCleanup }
}

module.exports = {
  __setTestDb,
  collectPostBranch,
  createPost,
  createTopic,
  deletePostBranchHard,
  deletePostHard,
  deleteTopicHard,
  getFollowersCount,
  getLinkedIdentityIds,
  getPost,
  getSubscriptionCounts,
  getTopic,
  getUserTotals,
  filterCandidatesBySubscriptionRelation,
  incrementPostViews,
  incrementPostCounters,
  incrementTopicViews,
  isBannedIp,
  isBannedUser,
  listBannedUsers,
  listSubscriptionPeoplePage,
  listSubscriptions,
  nextPostId,
  nextRev,
  nextTopicId,
  patchSnapshot,
  readCounter,
  readSnapshot,
  rebuildSnapshot,
  reportPost,
  setBannedIp,
  setBannedUser,
  setPostReactionState,
  setReaction,
  toggleSubscription,
  updatePostCounters,
  updatePostText,
  writeChange,
}
