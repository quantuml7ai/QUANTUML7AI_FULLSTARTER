// app/api/forum/_db.js
import { Buffer } from 'node:buffer'
import { Redis } from '@upstash/redis'
import { now, toStr, parseIntSafe } from './_utils.js'
import { resolveCanonicalAccountIds } from '../profile/_identity.js'

/* =========================
   helpers
========================= */
export const safeParse = (raw) => {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  if (raw === '[object Object]') return null
  try { return JSON.parse(raw) } catch { return null }
}

export const redis = Redis.fromEnv()

export const getInt = async (key, def = 0) => {
  const v = await redis.get(key)
  return parseIntSafe(v, def)  // ювелирная правка: устойчивый парс
}

const DAY_MS = 24 * 60 * 60 * 1000
const dayBucket = (ts = Date.now()) => Math.floor(ts / DAY_MS)

// Дедупликация просмотров не «навсегда», а в окне TTL (по умолчанию берём env или 1800 сек)
const VIEW_TTL_SEC = Number(process.env.FORUM_VIEW_TTL_SEC ?? 1800)
const TOTALS_INIT_LOCK_TTL = Number(process.env.FORUM_TOTALS_INIT_LOCK_TTL ?? 20)
const winBucket = (ttlSec = VIEW_TTL_SEC, ts = Date.now()) => {
  const s = Math.max(1, Number(ttlSec) || VIEW_TTL_SEC)
  return Math.floor((ts / 1000) / s)
}

const str = (x) => String(x ?? '').trim()
async function initUserTotalsFromSnapshot(userId) {
  const uid = str(userId)
  if (!uid) return null

  const lockTtl = Math.max(5, Number(TOTALS_INIT_LOCK_TTL) || 20)
  const lockKey = K.userTotalsInitLock(uid)
  const ok = await redis.set(lockKey, '1', { nx: true, ex: lockTtl })
  if (!ok) return null

  let postsTotal = 0
  let topicsTotal = 0
  let likesTotal = 0

  try {
    const raw = await redis.get(K.snapshot)
    const snap = safeParse(raw)
    const payload = snap?.payload || {}
    const posts = Array.isArray(payload.posts) ? payload.posts : []
    const topics = Array.isArray(payload.topics) ? payload.topics : []

    for (const post of posts) {
      if (!post || post._del) continue
      const authorId = str(post.userId || post.accountId)
      if (!authorId || authorId !== uid) continue
      postsTotal += 1
      likesTotal += Number(post.likes || 0)
    }

    for (const topic of topics) {
      if (!topic || topic._del) continue
      const authorId = str(topic.userId || topic.accountId)
      if (!authorId || authorId !== uid) continue
      topicsTotal += 1
    }
  } catch {}

  try {
    await redis
      .multi()
      .set(K.userPostsTotal(uid), String(postsTotal))
      .set(K.userTopicsTotal(uid), String(topicsTotal))
      .set(K.userLikesTotal(uid), String(likesTotal))
      .exec()
  } catch {}

  try { await redis.del(lockKey) } catch {}

  return { postsTotal, topicsTotal, likesTotal }
}

export async function getUserPostsTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  const key = K.userPostsTotal(uid)
  const raw = await redis.get(key)
  if (raw != null) return parseIntSafe(raw, 0)
  await initUserTotalsFromSnapshot(uid)
  return getInt(key, 0)
}

export async function getUserTopicsTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  const key = K.userTopicsTotal(uid)
  const raw = await redis.get(key)
  if (raw != null) return parseIntSafe(raw, 0)
  await initUserTotalsFromSnapshot(uid)
  return getInt(key, 0)
}

export async function getUserLikesTotal(userId) {
  const uid = str(userId)
  if (!uid) return 0
  const key = K.userLikesTotal(uid)
  const raw = await redis.get(key)
  if (raw != null) return parseIntSafe(raw, 0)
  await initUserTotalsFromSnapshot(uid)
  return getInt(key, 0)
}

export async function incrUserPostsTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return redis.incrby(K.userPostsTotal(uid), Number(delta) || 0)
}

export async function incrUserTopicsTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return redis.incrby(K.userTopicsTotal(uid), Number(delta) || 0)
}

export async function incrUserLikesTotal(userId, delta = 1) {
  const uid = str(userId)
  if (!uid) return 0
  return redis.incrby(K.userLikesTotal(uid), Number(delta) || 0)
}

/* =========================
   Ключи (BACKWARD-COMPAT)
========================= */
export const K = {
  rev: 'forum:rev',
  changes: 'forum:changes',

  topicsSet: 'forum:topics',
  postsSet:  'forum:posts',

  topicKey: (id) => `forum:topic:${id}`,
  postKey:  (id) => `forum:post:${id}`,

  // sequence counters
  seqTopic: 'forum:seq:topic',
  seqPost:  'forum:seq:post',

  bannedSet: 'forum:banned',
  adminsSet: 'forum:admins',
  snapshot:  'forum:snapshot',

  // nick index (case-insensitive)
  nickIdx:   (nickLower) => `forum:nick:${nickLower}`,
  userNick:  (userId)    => `forum:user:${userId}:nick`,

  userAvatar: (userId)   => `forum:user:${userId}:avatar`,
  userGender: (userId)   => `forum:user:${userId}:gender`,
  userBirthYear: (userId) => `forum:user:${userId}:birth_year`,

  userAbout:  (userId)   => `forum:user:${userId}:about`,
  userPostsTotal: (userId) => `forum:user:${userId}:posts_total`,
  userTopicsTotal: (userId) => `forum:user:${userId}:topics_total`,
  userLikesTotal: (userId) => `forum:user:${userId}:likes_total`,
  userTotalsInitLock: (userId) => `forum:user:${userId}:totals_init_lock`,    
  // per-topic
  topicPostsCount: (topicId) => `forum:topic:${topicId}:posts_count`,
  topicViews:      (topicId) => `forum:topic:${topicId}:views`,

  // per-post
  postViews:    (postId) => `forum:post:${postId}:views`,
  postLikes:    (postId) => `forum:post:${postId}:likes`,
  postDislikes: (postId) => `forum:post:${postId}:dislikes`,

  // sets для уникальных реакций
  postLikesSet:    (postId) => `forum:post:${postId}:likes:set`,
  postDislikesSet: (postId) => `forum:post:${postId}:dislikes:set`,

  // опциональный индекс постов темы
  topicPostsSet:   (topicId) => `forum:topic:${topicId}:posts`,
  // IP-баны (дополнительно к общему списку)
  bannedIpsSet:    'forum:banned:ips',

  // служебные ключи для суточной дедупликации просмотров/реакций
  dedupViewTopic: (topicId, userId, day) => `forum:dedup:view:topic:${topicId}:${userId}:${day}`,
  dedupViewPost:  (postId, userId, day)  => `forum:dedup:view:post:${postId}:${userId}:${day}`,
  reactStateDay:  (postId, userId, day)  => `forum:react:state:${postId}:${userId}:${day}`,

  // ===== SUBSCRIPTIONS (viewer -> authors) =====
  subsViewerSet:      (viewerId) => `forum:subs:viewer:${viewerId}`,
  subsFollowersCount: (authorId) => `forum:subs:followers_count:${authorId}`,
  subsFollowersSet:   (authorId) => `forum:subs:followers:${authorId}`,
  subsFollowingZSet:  (viewerId) => `forum:subs:following:z:${viewerId}`,
  subsFollowersZSet:  (authorId) => `forum:subs:followers:z:${authorId}`,

  // ===== USER SEARCH PREFIX INDEX =====
  userSearchPrefix: (prefix) => `forum:user_search:prefix:${prefix}`,
  userSearchTokens: (userId) => `forum:user_search:tokens:${userId}`,

  // ===== REPORTS / MEDIA LOCKS =====
  reportPostReasonSet: (postId, reason) => `forum:report:post:${postId}:${reason}:users`,
  reportPostAnySet:    (postId) => `forum:report:post:${postId}:users`,
  mediaLockKey:        (userId) => `forum:lock:media:${userId}`,  
}
const PORN_THRESHOLD = Number(process.env.FORUM_REPORT_PORN_THRESHOLD ?? 3)
const VIOLENCE_THRESHOLD = Number(process.env.FORUM_REPORT_VIOLENCE_THRESHOLD ?? 3)
const BORING_THRESHOLD = Number(process.env.FORUM_REPORT_BORING_THRESHOLD ?? 20)
const MEDIA_LOCK_MS = Number(process.env.FORUM_MEDIA_LOCK_MS ?? (3 * 24 * 60 * 60 * 1000))

/* =========================
   Ревизии / изменения
========================= */
export async function nextRev() {
  return parseIntSafe(await redis.incr(K.rev), 0)
}
export async function nextTopicId() {
  return parseIntSafe(await redis.incr(K.seqTopic), 0)
}
export async function nextPostId() {
  return parseIntSafe(await redis.incr(K.seqPost), 0)
}

/** Запись события в журнал изменений */
export async function pushChange(evt) {
  await redis.lpush(K.changes, JSON.stringify(evt))
}

/* =========================
   Пересборка снапшота
========================= */
export async function rebuildSnapshot() {
  const errors = []

  // Темы
  const topics = []
  const tIds = await redis.smembers(K.topicsSet)
  for (const tid of tIds) {
    try {
      const raw = await redis.get(K.topicKey(tid))
      const t = safeParse(raw)
      if (!t) { errors.push({ id: String(tid), kind: 'topic', reason: 'parse' }); continue }
      t.postsCount = await getInt(K.topicPostsCount(tid), 0)
      t.views      = await getInt(K.topicViews(tid), 0)
      topics.push(t)
    } catch {
      errors.push({ id: String(tid), kind: 'topic', reason: 'read_failed' })
    }
  }

  // Посты
  const posts = []
  const pIds = await redis.smembers(K.postsSet)
  for (const pid of pIds) {
    try {
      const raw = await redis.get(K.postKey(pid))
      const p = safeParse(raw)
      if (!p) { errors.push({ id: String(pid), kind: 'post', reason: 'parse' }); continue }
      p.views    = await getInt(K.postViews(pid), 0)
      p.likes    = await getInt(K.postLikes(pid), 0)
      p.dislikes = await getInt(K.postDislikes(pid), 0)
      posts.push(p)
    } catch {
      errors.push({ id: String(pid), kind: 'post', reason: 'read_failed' })
    }
  }

  // Бан-лист
  const banned = await redis.smembers(K.bannedSet)

  // Текущая ревизия и сохранение снапшота одним ключом
  const rev = parseIntSafe(await redis.get(K.rev), 0)
  const payload = { topics, posts, banned, errors }
  await redis.set(K.snapshot, JSON.stringify({ rev, payload }))

  // страховочный трим лога изменений
  try { await redis.ltrim(K.changes, -50000, -1) } catch {}

  return { rev, payload }
}
// ===== SNAPSHOT PATCH (точечное обновление без rebuild O(N)) =====
export async function patchSnapshotPartial({ rev, patch = {} }) {
  try {
    const raw = await redis.get(K.snapshot)
    const snap = safeParse(raw)
    if (!snap || !snap.payload) return false

    const payload = snap.payload || {}
    const topics = Array.isArray(payload.topics) ? payload.topics : []
    const posts  = Array.isArray(payload.posts)  ? payload.posts  : []

    // patch: { topics: { [id]: {views?, postsCount?} }, posts: { [id]: {views?, likes?, dislikes?} } }
    if (patch.topics && typeof patch.topics === 'object') {
      for (const [id, v] of Object.entries(patch.topics)) {
        const t = topics.find(x => String(x?.id) === String(id))
        if (t && v && typeof v === 'object') Object.assign(t, v)
      }
    }

    if (patch.posts && typeof patch.posts === 'object') {
      for (const [id, v] of Object.entries(patch.posts)) {
        const p = posts.find(x => String(x?.id) === String(id))
        if (p && v && typeof v === 'object') Object.assign(p, v)
      }
    }

    const next = { rev: Number(rev) || snap.rev || 0, payload }
    await redis.set(K.snapshot, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}

/* =========================
   CRUD: темы / посты
========================= */
export async function createTopic({ title, description, userId, nickname, icon, ts }) {
  const topicId = String(await nextTopicId())
  const rev = await nextRev()
  const t = {
    id:       topicId,
    title:    toStr(title),
    description: toStr(description),
    ts:       ts ?? now(),
    userId:   toStr(userId),
    nickname: toStr(nickname),
    icon:     toStr(icon),
    isAdmin:  '0',
  }

  await redis.multi()
    .sadd(K.topicsSet, topicId)
    .set(K.topicKey(topicId), JSON.stringify(t))
    .set(K.topicPostsCount(topicId), 0)
    .set(K.topicViews(topicId), 0)
    .exec()

  try { await incrUserTopicsTotal(t.userId, 1) } catch {}

  await pushChange({ rev, kind: 'topic', id: topicId, data: t, ts: t.ts })
  return { topic: t, rev }
}

export async function createPost({ topicId, parentId, text, userId, nickname, icon, ts }) {
  const postId = String(await nextPostId())
  const rev = await nextRev()
  const p = {
    id:       postId,
    topicId:  String(topicId),
    parentId: parentId ? String(parentId) : null,
    text:     toStr(text),
    ts:       ts ?? now(),
    userId:   toStr(userId),
    nickname: toStr(nickname),
    icon:     toStr(icon),
    isAdmin:  '0',
  }

  await redis.multi()
    .sadd(K.postsSet, postId)
    .set(K.postKey(postId), JSON.stringify(p))
    .incr(K.topicPostsCount(p.topicId))
    .set(K.postViews(postId), 0)
    .set(K.postLikes(postId), 0)
    .set(K.postDislikes(postId), 0)
    .sadd(K.topicPostsSet(p.topicId), postId)
    .exec()

  try { await incrUserPostsTotal(p.userId, 1) } catch {}

  await pushChange({ rev, kind: 'post', id: postId, data: p, ts: p.ts })
  return { post: p, rev }
}

/** инкременты просмотров (сумматоры) */
export async function incrementTopicViews(topicId, delta = 1) {
  await redis.incrby(K.topicViews(topicId), delta)
}
export async function incrementPostViews(postId, delta = 1) {
  await redis.incrby(K.postViews(postId), delta)
}

/** устаревшее (сумматор), оставлено для совместимости */
export async function reactPost(postId, kind /* 'like'|'dislike' */, delta = 1) {
  if (kind === 'like') await redis.incrby(K.postLikes(postId), delta)
  else if (kind === 'dislike') await redis.incrby(K.postDislikes(postId), delta)
  else throw new Error('bad_reaction_kind')
  const rev = await nextRev()
  await pushChange({ rev, kind: 'react', id: postId, data: { kind, delta }, ts: now() })
  return { rev }
}

/** уникальные реакции через множества */
export async function reactPostUnique(postId, userId, kind) {
  if (!postId || !userId || !['like','dislike'].includes(kind)) {
    throw new Error('bad_react_args')
  }
  const likeSet = K.postLikesSet(postId)
  const disSet  = K.postDislikesSet(postId)

  if (kind === 'like') {
    await redis.srem(disSet, userId)
    await redis.sadd(likeSet, userId)
  } else {
    await redis.srem(likeSet, userId)
    await redis.sadd(disSet, userId)
  }

  const [likes, dislikes] = await Promise.all([
    redis.scard(likeSet),
    redis.scard(disSet),
  ])

  await Promise.all([
    redis.set(K.postLikes(postId), String(likes)),
    redis.set(K.postDislikes(postId), String(dislikes)),
  ])

  return { likes, dislikes }
}

/* =========================
   Строгая бизнес-логика
========================= */
export async function incrementTopicViewsUnique(topicId, userId, ttlSec = VIEW_TTL_SEC) {

  const tid = str(topicId), uid = str(userId)
  if (!tid || !uid) return { inc: false, views: await getInt(K.topicViews(tid), 0) }
  const ttl = Math.min(24 * 60 * 60, Math.max(1, Number(ttlSec) || VIEW_TTL_SEC))
  const key = K.dedupViewTopic(tid, uid, winBucket(ttl))
  const ok = await redis.set(key, '1', { nx: true, ex: ttl })
  if (ok) await incrementTopicViews(tid, 1)
  const views = await getInt(K.topicViews(tid), 0)
  return { inc: !!ok, views }
}
export async function incrementPostViewsUnique(postId, userId, ttlSec = VIEW_TTL_SEC) {
 
  const pid = str(postId), uid = str(userId)
  if (!pid || !uid) return { inc: false, views: await getInt(K.postViews(pid), 0) }
  const ttl = Math.min(24 * 60 * 60, Math.max(1, Number(ttlSec) || VIEW_TTL_SEC))
  const key = K.dedupViewPost(pid, uid, winBucket(ttl))
  const ok = await redis.set(key, '1', { nx: true, ex: ttl })

  if (ok) await incrementPostViews(pid, 1)
  const views = await getInt(K.postViews(pid), 0)
  return { inc: !!ok, views }
}

export async function reactPostExclusiveDaily(postId, userId, kind) {
  const pid = str(postId), uid = str(userId)
  const target = kind === 'dislike' ? 'dislike' : 'like'
  if (!pid || !uid) throw new Error('bad_react_args')

  const stateKey = K.reactStateDay(pid, uid, dayBucket())
  let prev = null
  try { prev = await redis.get(stateKey) } catch {}

  if (prev === target) {
    const [likes, dislikes] = await Promise.all([
      getInt(K.postLikes(pid), 0),
      getInt(K.postDislikes(pid), 0),
    ])
    return { state: target, likes, dislikes, changed: false }
  }

  if (prev === 'like') {
    try { await redis.decr(K.postLikes(pid)) } catch {}
  } else if (prev === 'dislike') {
    try { await redis.decr(K.postDislikes(pid)) } catch {}
  }

  if (target === 'like') {
    await redis.incr(K.postLikes(pid))
  } else {
    await redis.incr(K.postDislikes(pid))
  }

  await redis.set(stateKey, target, { ex: 24*60*60 })

  const [likes, dislikes] = await Promise.all([
    getInt(K.postLikes(pid), 0),
    getInt(K.postDislikes(pid), 0),
  ])

  const rev = await nextRev()
  await pushChange({ rev, kind: 'post', id: pid, data: { likes, dislikes }, ts: now() })

  return { state: target, likes, dislikes, changed: true, rev }
}

/* =========================
   Баны (ювелирные правки)
========================= */
const truthy = (v) => v === 1 || v === '1' || v === true

export async function isBannedUser(userId) {
  const id = String(userId || '').trim().toLowerCase()
  if (!id) return false
  try {
    const v = await redis.sismember(K.bannedSet, id)
    return truthy(v)
  } catch { return false }
}

export async function isBannedIp(ip) {
  const ipLc = String(ip || '').trim().toLowerCase()
  if (!ipLc) return false
  try {
    const [a, b] = await Promise.allSettled([
      redis.sismember(K.bannedSet, ipLc),
      redis.sismember(K.bannedIpsSet, ipLc),
    ])
    const inA = (a.status === 'fulfilled') && truthy(a.value)
    const inB = (b.status === 'fulfilled') && truthy(b.value)
    return inA || inB
  } catch { return false }
}

export async function isBanned(userId, ip) {
  return (await isBannedUser(userId)) || (await isBannedIp(ip))
}

export async function dbBanUser(accountId) {
  const rev = await nextRev()
  const id = String(accountId || '').trim().toLowerCase()
  await redis.sadd(K.bannedSet, id)
  await pushChange({ rev, kind: 'ban', id, ts: now() })
  return { rev }
}
export async function dbUnbanUser(accountId) {
  const rev = await nextRev()
  const id = String(accountId || '').trim().toLowerCase()
  await redis.srem(K.bannedSet, id)
  await pushChange({ rev, kind: 'unban', id, ts: now() })
  return { rev }
}
export async function dbBanIp(ip) {
  const rev = await nextRev()
  const ipLc = String(ip || '').trim().toLowerCase()
  await Promise.allSettled([
    redis.sadd(K.bannedSet, ipLc),
    redis.sadd(K.bannedIpsSet, ipLc),
  ])
  await pushChange({ rev, kind: 'ban_ip', id: ipLc, ts: now() })
  return { rev }
}
export async function dbUnbanIp(ip) {
  const rev = await nextRev()
  const ipLc = String(ip || '').trim().toLowerCase()
  await Promise.allSettled([
    redis.srem(K.bannedSet, ipLc),
    redis.srem(K.bannedIpsSet, ipLc),
  ])
  await pushChange({ rev, kind: 'unban_ip', id: ipLc, ts: now() })
  return { rev }
}

/* =========================
   Удаления (HARD)
========================= */
export async function dbDeletePost(postId) {
  const raw = await redis.get(K.postKey(postId))
  if (!raw) return null
  const post = JSON.parse(raw)
  post._del = 1
  await redis.multi()
    .set(K.postKey(postId), JSON.stringify(post))
    .srem(K.postsSet, String(postId))
    .exec()
  const rev = await nextRev()
  await pushChange({ rev, kind: 'post', id: String(postId), _del: 1, ts: now() })
  return { rev, post }
}

export async function dbDeletePostHard(postId) {
  const pid = str(postId)
  const raw = await redis.get(K.postKey(pid))
  if (!raw) return { rev: await nextRev(), notFound: true }
  const post = safeParse(raw)
  const topicId = post?.topicId ? String(post.topicId) : null

  await Promise.allSettled([
    redis.srem(K.postsSet, pid),
    redis.del(K.postKey(pid)),
    redis.del(K.postViews(pid)),
    redis.del(K.postLikes(pid)),
    redis.del(K.postDislikes(pid)),
    topicId ? redis.srem(K.topicPostsSet(topicId), pid) : Promise.resolve(),
    topicId ? redis.decr(K.topicPostsCount(topicId)) : Promise.resolve(),
  ])

  const rev = await nextRev()
  await pushChange({ rev, kind: 'post', id: pid, _del: 1, ts: now(), topicId })
  return { rev, post }
}

export async function dbDeleteTopic(topicId) {
  const raw = await redis.get(K.topicKey(topicId))
  if (!raw) return null
  const topic = JSON.parse(raw)
  topic._del = 1
  await redis.set(K.topicKey(topicId), JSON.stringify(topic))
  await redis.srem(K.topicsSet, String(topicId))

  const posts = await redis.smembers(K.postsSet)
  const toDel = []
  for (const pid of posts) {
    const pr = await redis.get(K.postKey(pid))
    if (!pr) continue
    const p = JSON.parse(pr)
    if (String(p.topicId) === String(topicId)) {
      p._del = 1
      await redis.set(K.postKey(pid), JSON.stringify(p))
      await redis.srem(K.postsSet, pid)
      toDel.push(pid)
    }
  }
  const rev = await nextRev()
  await pushChange({ rev, kind: 'topic', id: String(topicId), _del: 1, ts: now(), deletedPosts: toDel })
  return { rev, topic, deletedPosts: toDel }
}

export async function dbDeleteTopicHard(topicId) {
  const tid = str(topicId)
  const raw = await redis.get(K.topicKey(tid))
  if (!raw) return { rev: await nextRev(), notFound: true }

  let pids = await redis.smembers(K.topicPostsSet(tid))
  if (!pids || !pids.length) {
    const all = await redis.smembers(K.postsSet)
    pids = []
    for (const pid of all) {
      const pr = await redis.get(K.postKey(pid))
      if (!pr) continue
      const p = safeParse(pr)
      if (p && String(p.topicId) === tid) pids.push(String(pid))
    }
  }

  const ops = []
  for (const pid of (pids || [])) {
    ops.push(['srem', K.postsSet, pid])
    ops.push(['del', K.postKey(pid)])
    ops.push(['del', K.postViews(pid)])
    ops.push(['del', K.postLikes(pid)])
    ops.push(['del', K.postDislikes(pid)])
  }
  ops.push(['del', K.topicPostsSet(tid)])
  ops.push(['del', K.topicKey(tid)])
  ops.push(['srem', K.topicsSet, tid])
  ops.push(['del', K.topicViews(tid)])
  ops.push(['del', K.topicPostsCount(tid)])

  if (ops.length) {
    const pipe = redis.pipeline ? redis.pipeline() : null
    if (pipe) {
      for (const op of ops) pipe[op[0]].apply(pipe, op.slice(1))
      await pipe.exec()
    } else {
      for (const op of ops) await redis[op[0]](...op.slice(1))
    }
  }

  const rev = await nextRev()
  await pushChange({ rev, kind: 'topic', id: tid, _del: 1, ts: now(), deletedPosts: pids })
  return { rev, deletedPosts: pids }
}
/* =========================
   Reports / Media Locks
========================= */
export async function getMediaLockUntil(userId) {
  const key = K.mediaLockKey(str(userId))
  const raw = await redis.get(key)
  return parseIntSafe(raw, 0)
}

export async function setMediaLockUntil(userId, untilMs) {
  const key = K.mediaLockKey(str(userId))
  await redis.set(key, String(Number(untilMs || 0)))
  return { ok: true, untilMs: Number(untilMs || 0) }
}

export async function isMediaLocked(userId) {
  const untilMs = await getMediaLockUntil(userId)
  const locked = Number(untilMs || 0) > now()
  if (!locked && untilMs) {
    try { await redis.del(K.mediaLockKey(str(userId))) } catch {}
  }
  return { locked, untilMs: locked ? Number(untilMs || 0) : 0 }
}

// O(N) обход по всем постам — соответствует текущей схеме
export async function collectPostBranch(rootId) {
  const root = str(rootId)
  const toDelete = new Set([root])
  try {
    const all = await redis.smembers(K.postsSet)
    let grow = true
    while (grow) {
      grow = false
      for (const pid of all || []) {
        const pidStr = String(pid)
        if (toDelete.has(pidStr)) continue
        const raw = await redis.get(K.postKey(pidStr))
        const po = safeParse(raw)
        if (po?.parentId && toDelete.has(String(po.parentId))) {
          toDelete.add(pidStr)
          grow = true
        }
      }
    }
  } catch {}
  return Array.from(toDelete)
}

export async function deletePostBranchHard(rootId) {
  const branch = await collectPostBranch(rootId)
  const deleted = []
  const topicCounts = new Map()
  const ops = []

  for (const pid of branch) {
    const raw = await redis.get(K.postKey(pid))
    if (!raw) continue
    const post = safeParse(raw)
    if (!post) continue

    deleted.push(String(pid))
    const topicId = post?.topicId ? String(post.topicId) : null
    if (topicId) {
      topicCounts.set(topicId, (topicCounts.get(topicId) || 0) + 1)
    }

    ops.push(['srem', K.postsSet, String(pid)])
    ops.push(['del', K.postKey(pid)])
    ops.push(['del', K.postViews(pid)])
    ops.push(['del', K.postLikes(pid)])
    ops.push(['del', K.postDislikes(pid)])
    if (typeof K.postLikesSet === 'function') ops.push(['del', K.postLikesSet(pid)])
    if (typeof K.postDislikesSet === 'function') ops.push(['del', K.postDislikesSet(pid)])    
    if (topicId) ops.push(['srem', K.topicPostsSet(topicId), String(pid)])
  }

  if (ops.length) {
    const pipe = redis.pipeline ? redis.pipeline() : null
    if (pipe) {
      for (const op of ops) pipe[op[0]].apply(pipe, op.slice(1))
      await pipe.exec()
    } else {
      for (const op of ops) await redis[op[0]](...op.slice(1))
    }
  }

  for (const [topicId, dec] of topicCounts.entries()) {
    const key = K.topicPostsCount(topicId)
    const current = await getInt(key, 0)
    const next = Math.max(0, current - dec)
    await redis.set(key, String(next))
  }

  return { deleted }
}

export async function reportPost({ postId, reporterId, reason }) {
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

  const raw = await redis.get(K.postKey(pid))
  const post = safeParse(raw)
  if (!post) {
    const err = new Error('post_not_found')
    err.status = 404
    throw err
  }

  const authorId = str(post?.userId || post?.accountId)
  if (authorId && authorId === rid) {
    const err = new Error('self_report')
    err.status = 403
    throw err
  }

  if (K.reportPostAnySet) {
    const anyAdded = await redis.sadd(K.reportPostAnySet(pid), rid)
    if (anyAdded !== 1) {
      return { ok: true, duplicate: true }
    }
  }

  const reasonKey = K.reportPostReasonSet(pid, rsn)
  const res = await redis.multi().sadd(reasonKey, rid).scard(reasonKey).exec()
  const added = Number(res?.[0] ?? 0)
  const count = Number(res?.[1] ?? 0)
  if (added !== 1) return { ok: true, duplicate: true }

  const shouldDelete =
    (rsn === 'porn' && count >= PORN_THRESHOLD) ||
    (rsn === 'violence' && count >= VIOLENCE_THRESHOLD) ||
    (rsn === 'boring' && count >= BORING_THRESHOLD)

  if (!shouldDelete) {
    return { ok: true, action: 'counted', count }
  }

  const { deleted } = await deletePostBranchHard(pid)
  const rev = await nextRev()
  await pushChange({ rev, kind: 'post', id: pid, _del: 1, deleted, ts: now() })
  await pushChange({ rev, kind: 'post_deleted', id: pid, deleted, ts: now() })
  await rebuildSnapshot()

  if (rsn === 'porn' || rsn === 'violence') {
    const lockedUntil = now() + MEDIA_LOCK_MS
    if (authorId) {
      await setMediaLockUntil(authorId, lockedUntil)
      return {
        ok: true,
        action: 'deleted_and_locked',
        count,
        lockedUntil,
        lockedUserId: authorId,
        deleted,
        rev,
      }
    }
    return { ok: true, action: 'deleted', count, deleted, rev }
  }

  return { ok: true, action: 'deleted', count, deleted, rev }
}

/* =========================
   Read helpers
========================= */
export async function getBannedUsers() {
  const ids = await redis.smembers(K.bannedSet)
  return new Set(ids || [])
}

export async function snapshot(sinceRev = 0, limit = 10000) {
  const currentRev = parseIntSafe(await redis.get(K.rev), 0)

  if (!sinceRev || sinceRev <= 0) {
    const raw = await redis.get(K.snapshot)
    if (raw) {
      const snap = safeParse(raw)
      if (snap && typeof snap.rev === 'number' && snap.payload) {
        return { rev: snap.rev, ...snap.payload }
      }
    }
    const snap = await rebuildSnapshot()
    return { rev: snap.rev, ...snap.payload }
  }

  const take = Math.max(1, Math.min(50000, Number(limit) || 10000))
  const rawList = await redis.lrange(K.changes, 0, take - 1)
  const parsed = rawList
    .map((r) => { try { return JSON.parse(r) } catch { return null } })
    .filter(Boolean)

  const revs = parsed
    .map((e) => Number(e?.rev || 0))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (revs.length) {
    const oldestRevInWindow = Math.min(...revs)
    const lostWindow = Number(sinceRev) > 0 && Number(currentRev) > Number(sinceRev) && Number(sinceRev) < oldestRevInWindow
    if (lostWindow) {
      const raw = await redis.get(K.snapshot)
      if (raw) {
        const snap = safeParse(raw)
        if (snap && typeof snap.rev === 'number' && snap.payload) {
          return { rev: snap.rev, ...snap.payload, full: true, gap: true }
        }
      }
      const snap = await rebuildSnapshot()
      return { rev: snap.rev, ...snap.payload, full: true, gap: true }
    }
  }

  const events = parsed
    .filter((e) => Number(e?.rev || 0) > Number(sinceRev || 0))
    .sort((a, b) => (a.rev || 0) - (b.rev || 0))

  return { rev: currentRev, events, full: false }
}
// --- Nickname helpers (compat) ---
export function normNick(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, ' ')
  return s.slice(0, 24)
}
export function nickKeyLower(raw) {
  return normNick(raw).toLowerCase()
}

export async function isNickFree(nick) {
  const key = K.nickIdx(nickKeyLower(nick))
  const owner = await redis.get(key)
  return !owner
}

export async function isNickAvailable(nick, userId) {
  const key = K.nickIdx(nickKeyLower(nick))
  const owner = await redis.get(key)
  if (!owner) return true
  return String(owner) === String(userId)
}

export async function getUserNick(userId) {
  return await redis.get(K.userNick(userId))
}

/**
 * Атомарная установка ника:
 * - SET NX резервирует новый ник
 * - пишем ник юзеру
 * - освобождаем старый индекс, если он принадлежал этому userId
 */
export async function setUserNick(userId, newNick) {
  const nn = normNick(newNick)
  if (!nn) throw new Error('empty_nick')

  const newKey = K.nickIdx(nickKeyLower(nn))
  const oldNick = await redis.get(K.userNick(userId))
  const oldKey  = oldNick ? K.nickIdx(nickKeyLower(oldNick)) : null

  // не меняется — сразу вернуть
  if (oldNick && nickKeyLower(oldNick) === nickKeyLower(nn)) {
    try { await indexUserSearchNick(userId, oldNick, oldNick) } catch {}
    return oldNick
  }

  // попытка забронировать новый ник (Upstash вернёт 'OK' или null)
  const ok = await redis.set(newKey, String(userId), { nx: true })
  if (!ok) throw new Error('nick_taken')

  await redis.set(K.userNick(userId), nn)
  if (oldKey) {
    try {
      const cur = await redis.get(oldKey)
      if (String(cur) === String(userId)) await redis.del(oldKey)
    } catch {}
  }
  try { await indexUserSearchNick(userId, nn, oldNick) } catch {}
  return nn
}
export async function getUserAvatar(userId) {
  try {
    const v = await redis.get(K.userAvatar(userId))
    return str(v || '')
  } catch {
    return ''
  }
}

export function normAvatar(raw) {
  const s0 = str(raw)
  if (!s0) return ''
  // URL из blob/uploads может быть длинным (query/hash/tokens).
  // Жёсткая обрезка до 256 ломает уже загруженные аватары.
  if (/^https?:\/\//i.test(s0) || s0.startsWith('/uploads/') || s0.startsWith('/avatars/') || s0.startsWith('/vip/')) {
    return s0.slice(0, 4096)
  }
  return s0.slice(0, 512)
}


export async function setUserAvatar(userId, icon) {
  const v = normAvatar(icon)
  try {
    if (!v) {
      // пустое значение — просто очищаем
      await redis.del(K.userAvatar(userId))
      return ''
    }
    await redis.set(K.userAvatar(userId), v)
    return v
  } catch {
    return v
  }
}
export function normUserGender(raw) {
  const value = str(raw).toLowerCase()
  if (value === 'male' || value === 'female') return value
  return ''
}

export async function getUserGender(userId) {
  try {
    const value = await redis.get(K.userGender(userId))
    return normUserGender(value)
  } catch {
    return ''
  }
}

export async function setUserGender(userId, gender) {
  const value = normUserGender(gender)
  try {
    if (!value) {
      await redis.del(K.userGender(userId))
      return ''
    }
    await redis.set(K.userGender(userId), value)
    return value
  } catch {
    return value
  }
}

export function getBirthYearBounds(nowYear = new Date().getFullYear()) {
  const max = Math.max(1900, Number(nowYear || 0) - 14)
  const min = max - 99
  return { min, max }
}

export function normUserBirthYear(raw, nowYear = new Date().getFullYear()) {
  const parsed = parseIntSafe(raw, 0)
  if (!parsed) return 0
  const { min, max } = getBirthYearBounds(nowYear)
  if (parsed < min || parsed > max) return 0
  return parsed
}

export async function getUserBirthYear(userId) {
  try {
    return normUserBirthYear(await redis.get(K.userBirthYear(userId)))
  } catch {
    return 0
  }
}

export async function setUserBirthYear(userId, birthYear) {
  const value = normUserBirthYear(birthYear)
  try {
    if (!value) {
      await redis.del(K.userBirthYear(userId))
      return 0
    }
    await redis.set(K.userBirthYear(userId), String(value))
    return value
  } catch {
    return value
  }
}

export function normAbout(raw) {
  const s = String(raw ?? '').replace(/\r\n/g, '\n')
  const trimmed = s.replace(/^[ \t]+|[ \t]+$/g, '')
  return trimmed.slice(0, 200)
}

export async function getUserAbout(userId) {
  try {
    const v = await redis.get(K.userAbout(userId))
    return str(v || '')
  } catch {
    return ''
  }
}

export async function setUserAbout(userId, about) {
  const v = normAbout(about)
  try {
    if (!v) {
      await redis.del(K.userAbout(userId))
      return ''
    }
    await redis.set(K.userAbout(userId), v)
    return v
  } catch {
    return v
  }
}

export async function getUserProfile(userId) {
  const [nick, avatar, gender, birthYear] = await Promise.all([
    getUserNick(userId),
    getUserAvatar(userId),
    getUserGender(userId),
    getUserBirthYear(userId),
  ])
  return {
    nickname: str(nick || ''),
    icon: str(avatar || ''),
    gender: normUserGender(gender),
    birthYear: normUserBirthYear(birthYear),
  }
}

export async function setUserProfile(userId, { nickname, icon, gender, birthYear } = {}) {
  const out = {}

  if (nickname != null && nickname !== '') {
    out.nickname = await setUserNick(userId, nickname)
  }

  if (icon != null) {
    out.icon = await setUserAvatar(userId, icon)
  }

  if (gender != null) {
    out.gender = await setUserGender(userId, gender)
  }

  if (birthYear != null) {
    out.birthYear = await setUserBirthYear(userId, birthYear)
  }

  return out
}
/* =========================
   SUBSCRIPTIONS (viewer -> authors)
========================= */

const normId = (x) => String(x ?? '').trim()
const SUBS_PAGE_LIMIT_DEFAULT = 50
const SUBS_PAGE_LIMIT_MAX = 100
export const SUBS_SEARCH_MIN_CHARS = 2
export const SUBS_SEARCH_MAX_CANDIDATES = 1000

const unwrapRedisResult = (value) => {
  if (value && typeof value === 'object' && 'result' in value) return value.result
  return value
}

const normalizeLimit = (limit, def = SUBS_PAGE_LIMIT_DEFAULT) => {
  const n = Number(limit || def)
  if (!Number.isFinite(n)) return def
  return Math.max(1, Math.min(SUBS_PAGE_LIMIT_MAX, Math.floor(n)))
}

const hashFraction = (input) => {
  const s = String(input || '')
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 1000) / 1000
}

export function subscriptionScore(viewerId, authorId, ts = Date.now()) {
  return Number(ts || Date.now()) + hashFraction(`${viewerId}:${authorId}`)
}

export function encodeSubscriptionCursor(payload) {
  if (!payload || typeof payload !== 'object') return null
  try {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  } catch {
    return null
  }
}

export function decodeSubscriptionCursor(raw) {
  const s = normId(raw)
  if (!s || s === '0') return null
  if (/^\d+$/.test(s)) return { kind: 'rank', offset: Math.max(0, Number(s) || 0) }
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function normalizeZrangeWithScores(raw) {
  const list = Array.isArray(raw) ? raw : []
  const out = []
  const push = (member, score) => {
    const m = normId(member)
    if (!m) return
    const s = Number(score ?? 0)
    out.push({ member: m, score: Number.isFinite(s) ? s : 0 })
  }

  if (!list.length) return out

  if (Array.isArray(list[0])) {
    for (const it of list) if (Array.isArray(it)) push(it[0], it[1])
    return out
  }

  if (list[0] && typeof list[0] === 'object') {
    for (const it of list) {
      if (!it) continue
      if (Array.isArray(it)) {
        push(it[0], it[1])
      } else if (typeof it === 'object' && ('member' in it || 'score' in it)) {
        push(it.member, it.score)
      } else {
        push(it, 0)
      }
    }
    return out
  }

  if (list.length % 2 === 0) {
    for (let i = 0; i < list.length; i += 2) push(list[i], list[i + 1])
    return out
  }

  for (const it of list) push(it, 0)
  return out
}

const normalizeScanResult = (raw) => {
  const list = Array.isArray(raw) ? raw : []
  return {
    cursor: String(list[0] ?? '0'),
    values: Array.isArray(list[1]) ? list[1].map(normId).filter(Boolean) : [],
  }
}

const readZSetPage = async (key, { limit, cursor } = {}) => {
  const safeLimit = normalizeLimit(limit)
  const parsed = decodeSubscriptionCursor(cursor)
  const take = safeLimit + 1
  let raw = []

  if (parsed?.kind === 'rank') {
    const start = Math.max(0, Number(parsed.offset || 0))
    raw = await redis.zrange(key, start, start + take - 1, { rev: true, withScores: true })
  } else {
    const startScore = parsed?.kind === 'z' && Number.isFinite(Number(parsed.score))
      ? `(${Number(parsed.score)}`
      : '+inf'
    raw = await redis.zrange(key, startScore, '-inf', {
      byScore: true,
      rev: true,
      withScores: true,
      offset: 0,
      count: take,
    })
  }

  const rows = normalizeZrangeWithScores(raw)
  const page = rows.slice(0, safeLimit)
  const hasMore = rows.length > safeLimit
  const last = page[page.length - 1]
  const nextCursor = hasMore && last
    ? encodeSubscriptionCursor(
        parsed?.kind === 'rank'
          ? { kind: 'rank', offset: Number(parsed.offset || 0) + safeLimit }
          : { kind: 'z', score: last.score, member: last.member },
      )
    : null

  return {
    ids: page.map((it) => it.member),
    rows: page,
    hasMore,
    nextCursor,
  }
}

const readSetPage = async (key, { limit, cursor } = {}) => {
  const safeLimit = normalizeLimit(limit)
  const parsed = decodeSubscriptionCursor(cursor)
  let scanCursor = parsed?.kind === 'set' ? String(parsed.cursor || '0') : '0'
  const ids = []
  let scans = 0

  do {
    const raw = await redis.sscan(key, scanCursor, { count: Math.max(safeLimit + 1, 50) })
    const page = normalizeScanResult(raw)
    scanCursor = page.cursor
    for (const id of page.values) {
      if (!ids.includes(id)) ids.push(id)
      if (ids.length > safeLimit) break
    }
    scans += 1
  } while (ids.length <= safeLimit && scanCursor !== '0' && scans < 4)

  const pageIds = ids.slice(0, safeLimit)
  const hasMore = ids.length > safeLimit || scanCursor !== '0'
  return {
    ids: pageIds,
    rows: pageIds.map((id) => ({ member: id, score: 0 })),
    hasMore,
    nextCursor: hasMore ? encodeSubscriptionCursor({ kind: 'set', cursor: scanCursor }) : null,
  }
}

const safeZCard = async (key) => {
  try { return Number(await redis.zcard(key) || 0) } catch { return 0 }
}

const safeSCard = async (key) => {
  try { return Number(await redis.scard(key) || 0) } catch { return 0 }
}

export function normalizeUserSearchText(raw) {
  const s = String(raw ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return Array.from(s).slice(0, 64).join('')
}

export function buildUserSearchPrefixes(nickname) {
  const normalized = normalizeUserSearchText(nickname)
  const chars = Array.from(normalized)
  const out = new Set()
  const max = Math.min(24, chars.length)
  for (let len = SUBS_SEARCH_MIN_CHARS; len <= max; len += 1) {
    out.add(chars.slice(0, len).join(''))
  }
  return Array.from(out).filter(Boolean)
}

export function isLikelyExactUserId(raw) {
  const s = normId(raw)
  if (!s) return false
  return /^(?:web_|tg:|tguid:|0x)[a-z0-9:_-]{1,}$/i.test(s) || /^[a-z0-9_-]{6,}$/i.test(s) || /^\d{5,}$/.test(s)
}

export async function removeUserSearchIndex(userId) {
  const uid = normId(userId)
  if (!uid) return 0
  const tokenKey = K.userSearchTokens(uid)
  let tokens = []
  try {
    tokens = (await redis.smembers(tokenKey) || []).map(normId).filter(Boolean)
  } catch {}
  if (!tokens.length) {
    try { await redis.del(tokenKey) } catch {}
    return 0
  }
  const pipe = redis.multi()
  tokens.forEach((token) => pipe.zrem(K.userSearchPrefix(token), uid))
  pipe.del(tokenKey)
  try {
    await pipe.exec()
    return tokens.length
  } catch {
    return 0
  }
}

export async function indexUserSearchNick(userId, newNick, oldNick = null) {
  const uid = normId(userId)
  const nick = normNick(newNick)
  if (!uid || !nick) {
    if (uid) await removeUserSearchIndex(uid)
    return 0
  }

  await removeUserSearchIndex(uid)

  const tokens = buildUserSearchPrefixes(nick)
  if (!tokens.length) return 0

  const score = subscriptionScore(uid, normalizeUserSearchText(nick))
  const pipe = redis.multi()
  tokens.forEach((token) => {
    pipe.zadd(K.userSearchPrefix(token), { score, member: uid })
    pipe.sadd(K.userSearchTokens(uid), token)
  })

  if (oldNick && nickKeyLower(oldNick) !== nickKeyLower(nick)) {
    for (const token of buildUserSearchPrefixes(oldNick)) {
      if (!tokens.includes(token)) pipe.zrem(K.userSearchPrefix(token), uid)
    }
  }

  try {
    await pipe.exec()
    return tokens.length
  } catch {
    return 0
  }
}

export async function searchUsersByPrefixPage({ q, cursor = '', limit = SUBS_PAGE_LIMIT_DEFAULT } = {}) {
  const query = normalizeUserSearchText(q)
  const safeLimit = normalizeLimit(limit)
  if (!query || Array.from(query).length < SUBS_SEARCH_MIN_CHARS) {
    return { ids: [], query, nextCursor: null, hasMore: false }
  }
  const page = await readZSetPage(K.userSearchPrefix(query), { limit: safeLimit, cursor })
  return {
    ...page,
    query,
  }
}

async function resolveSubscriptionIdsPreservingOrder(ids) {
  const pairs = await resolveSubscriptionPairsPreservingOrder(ids)
  return pairs.map((pair) => pair.canonical).filter(Boolean)
}

async function resolveSubscriptionPairsPreservingOrder(ids) {
  const rawList = Array.from(new Set((Array.isArray(ids) ? ids : []).map(normId).filter(Boolean)))
  if (!rawList.length) return []
  try {
    const resolved = await resolveCanonicalAccountIds(rawList, redis)
    const aliases = resolved?.aliases || {}
    const canonicalPool = Array.isArray(resolved?.ids) ? resolved.ids.map(normId).filter(Boolean) : []
    return rawList.map((id, idx) => ({
      raw: id,
      canonical: normId(aliases[id] || canonicalPool[idx] || id),
    })).filter((pair) => pair.raw && pair.canonical)
  } catch {
    return rawList.map((id) => ({ raw: id, canonical: id }))
  }
}

async function ensureFollowingPageIndexes(viewerId, authorIds) {
  const viewer = normId(viewerId)
  const authors = Array.from(new Set((Array.isArray(authorIds) ? authorIds : []).map(normId).filter(Boolean)))
    .filter((id) => id && id !== viewer)
    .slice(0, SUBS_PAGE_LIMIT_MAX)
  if (!viewer || !authors.length) return 0

  const pipe = redis.multi()
  const nowTs = Date.now()
  authors.forEach((authorId, idx) => {
    const score = subscriptionScore(viewer, authorId, nowTs - idx)
    pipe.zadd(K.subsFollowingZSet(viewer), { score, member: authorId })
    pipe.sadd(K.subsFollowersSet(authorId), viewer)
    pipe.zadd(K.subsFollowersZSet(authorId), { score, member: viewer })
  })
  try {
    await pipe.exec()
    return authors.length
  } catch {
    return 0
  }
}

async function cleanupSubscriptionPageRelations(ownerId, mode, pairs) {
  const owner = normId(ownerId)
  const safeMode = mode === 'following' ? 'following' : 'followers'
  const list = Array.isArray(pairs) ? pairs : []
  if (!owner || !list.length) return 0

  const seen = new Set()
  const pipe = redis.multi()
  let ops = 0
  const nowTs = Date.now()

  list.forEach((pair, idx) => {
    const raw = normId(pair?.raw)
    const canonical = normId(pair?.canonical)
    if (!raw || !canonical) return

    const selfRelation = canonical === owner || raw === owner
    const duplicate = seen.has(canonical)
    const shouldRemoveRaw = selfRelation || duplicate || raw !== canonical

    if (safeMode === 'following') {
      if (shouldRemoveRaw) {
        pipe.srem(K.subsViewerSet(owner), raw)
        pipe.zrem(K.subsFollowingZSet(owner), raw)
        pipe.srem(K.subsFollowersSet(raw), owner)
        pipe.zrem(K.subsFollowersZSet(raw), owner)
        ops += 4
      }
      if (!selfRelation && !duplicate && raw !== canonical) {
        const score = subscriptionScore(owner, canonical, nowTs - idx)
        pipe.sadd(K.subsViewerSet(owner), canonical)
        pipe.zadd(K.subsFollowingZSet(owner), { score, member: canonical })
        pipe.sadd(K.subsFollowersSet(canonical), owner)
        pipe.zadd(K.subsFollowersZSet(canonical), { score, member: owner })
        ops += 4
      }
    } else {
      if (shouldRemoveRaw) {
        pipe.srem(K.subsFollowersSet(owner), raw)
        pipe.zrem(K.subsFollowersZSet(owner), raw)
        pipe.srem(K.subsViewerSet(raw), owner)
        pipe.zrem(K.subsFollowingZSet(raw), owner)
        ops += 4
      }
      if (!selfRelation && !duplicate && raw !== canonical) {
        const score = subscriptionScore(canonical, owner, nowTs - idx)
        pipe.sadd(K.subsFollowersSet(owner), canonical)
        pipe.zadd(K.subsFollowersZSet(owner), { score, member: canonical })
        pipe.sadd(K.subsViewerSet(canonical), owner)
        pipe.zadd(K.subsFollowingZSet(canonical), { score, member: owner })
        ops += 4
      }
    }

    if (!selfRelation && !duplicate) seen.add(canonical)
  })

  if (!ops) return 0
  try {
    await pipe.exec()
    return ops
  } catch {
    return 0
  }
}

export async function getUsersPublicMini(ids) {
  const list = (await resolveSubscriptionIdsPreservingOrder(ids)).slice(0, SUBS_PAGE_LIMIT_MAX)
  if (!list.length) return []

  const pipe = redis.multi()
  list.forEach((uid) => {
    pipe.get(K.userNick(uid))
    pipe.get(K.userAvatar(uid))
  })
  const raw = await pipe.exec()
  const flat = Array.isArray(raw) ? raw.map(unwrapRedisResult) : []

  return list.map((uid, idx) => ({
    userId: uid,
    nickname: normId(flat[idx * 2]),
    icon: normId(flat[idx * 2 + 1]),
  }))
}

export async function getSubscriptionCounts(userId) {
  const uid = normId(userId)
  if (!uid) return { followers: 0, following: 0 }
  const [followersZ, followingZ, followersSet, followingSet, legacyFollowersCount] = await Promise.all([
    safeZCard(K.subsFollowersZSet(uid)),
    safeZCard(K.subsFollowingZSet(uid)),
    safeSCard(K.subsFollowersSet(uid)),
    safeSCard(K.subsViewerSet(uid)),
    getFollowersCount(uid),
  ])

  return {
    followers: Math.max(followersZ, followersSet, legacyFollowersCount),
    following: Math.max(followingZ, followingSet),
  }
}

export async function listSubscriptions(viewerId) {
  const vid = normId(viewerId)
  if (!vid) return []
  const arr = await redis.smembers(K.subsViewerSet(vid))
  return (arr || []).map(normId).filter(Boolean)
}

export async function getFollowersCount(authorId) {
  const aid = normId(authorId)
  if (!aid) return 0
  return await getInt(K.subsFollowersCount(aid), 0)
}

export async function listSubscriptionPeoplePage({
  userId,
  mode = 'followers',
  limit = SUBS_PAGE_LIMIT_DEFAULT,
  cursor = '',
} = {}) {
  const uid = normId(userId)
  if (!uid) {
    return { ids: [], users: [], totalCount: 0, nextCursor: null, hasMore: false }
  }

  const safeMode = mode === 'following' ? 'following' : 'followers'
  const safeLimit = normalizeLimit(limit)
  const counts = await getSubscriptionCounts(uid)
  const zKey = safeMode === 'following' ? K.subsFollowingZSet(uid) : K.subsFollowersZSet(uid)
  const setKey = safeMode === 'following' ? K.subsViewerSet(uid) : K.subsFollowersSet(uid)
  const zTotal = await safeZCard(zKey)
  const setTotal = await safeSCard(setKey)
  const useZSet = zTotal > 0 && zTotal >= setTotal
  const page = useZSet
    ? await readZSetPage(zKey, { limit: safeLimit, cursor })
    : await readSetPage(setKey, { limit: safeLimit, cursor })
  const pairs = await resolveSubscriptionPairsPreservingOrder(page.ids)
  const cleanupOps = await cleanupSubscriptionPageRelations(uid, safeMode, pairs)
  const pageIds = []
  for (const pair of pairs) {
    const canonical = normId(pair?.canonical)
    if (!canonical || canonical === uid || pageIds.includes(canonical)) continue
    pageIds.push(canonical)
  }
  if (safeMode === 'following' && pageIds.length) {
    await ensureFollowingPageIndexes(uid, pageIds)
  }
  const users = await getUsersPublicMini(pageIds)
  const nextCounts = cleanupOps ? await getSubscriptionCounts(uid) : counts

  return {
    ids: pageIds,
    users,
    totalCount: safeMode === 'following' ? nextCounts.following : nextCounts.followers,
    counts: nextCounts,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    source: useZSet ? 'zset' : 'set',
  }
}

export async function filterCandidatesBySubscriptionRelation({
  ownerId,
  mode = 'followers',
  candidateIds = [],
} = {}) {
  const owner = normId(ownerId)
  if (!owner) return []
  const safeMode = mode === 'following' ? 'following' : 'followers'
  const list = Array.from(new Set((Array.isArray(candidateIds) ? candidateIds : []).map(normId).filter(Boolean)))
    .filter((id) => id !== owner)
    .slice(0, SUBS_SEARCH_MAX_CANDIDATES)
  if (!list.length) return []

  const pipe = redis.multi()
  for (const candidate of list) {
    if (safeMode === 'followers') {
      pipe.zscore(K.subsFollowersZSet(owner), candidate)
      pipe.sismember(K.subsFollowersSet(owner), candidate)
    } else {
      pipe.zscore(K.subsFollowingZSet(owner), candidate)
      pipe.sismember(K.subsViewerSet(owner), candidate)
    }
  }

  const raw = await pipe.exec()
  const flat = Array.isArray(raw) ? raw.map(unwrapRedisResult) : []
  const out = []
  for (let i = 0; i < list.length; i += 1) {
    const score = flat[i * 2]
    const member = flat[i * 2 + 1]
    const inZSet = score !== null && score !== undefined
    const inSet = member === 1 || member === true || member === '1'
    if (inZSet || inSet) out.push(list[i])
  }
  return out
}

/**
 * toggle subscribe/unsubscribe
 * returns: { ok:true, subscribed:boolean, followersCount:number } OR { ok:false, error:string }
 */
export async function toggleSubscription(viewerId, authorId) {
  const vid = normId(viewerId)
  const aid = normId(authorId)
  if (!vid) return { ok:false, error:'no_viewer' }
  if (!aid) return { ok:false, error:'no_author' }
  if (vid === aid) return { ok:false, error:'self_subscribe' }

  const setKey = K.subsViewerSet(vid)
  const cntKey = K.subsFollowersCount(aid)
  const reverseSetKey = K.subsFollowersSet(aid)
  const followingZKey = K.subsFollowingZSet(vid)
  const followersZKey = K.subsFollowersZSet(aid)

  const isMember = await redis.sismember(setKey, aid)

  if (!isMember) {
    const added = await redis.sadd(setKey, aid) // 1 if new
    if (added === 1) {
      const score = subscriptionScore(vid, aid)
      await redis
        .multi()
        .sadd(reverseSetKey, vid)
        .zadd(followingZKey, { score, member: aid })
        .zadd(followersZKey, { score, member: vid })
        .incr(cntKey)
        .exec()
    }
    const followersCount = await getInt(cntKey, 0)
    return { ok:true, subscribed:true, followersCount }
  } else {
    const removed = await redis.srem(setKey, aid) // 1 if removed
    if (removed === 1) {
      const raw = await redis
        .multi()
        .srem(reverseSetKey, vid)
        .zrem(followingZKey, aid)
        .zrem(followersZKey, vid)
        .decr(cntKey)
        .exec()
      const flat = Array.isArray(raw) ? raw.map(unwrapRedisResult) : []
      const v = flat[flat.length - 1]
      if ((Number(v) || 0) < 0) await redis.set(cntKey, 0)
    }
    const followersCount = await getInt(cntKey, 0)
    return { ok:true, subscribed:false, followersCount }
  }
}
