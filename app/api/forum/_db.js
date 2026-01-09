// app/api/forum/_db.js
import { Redis } from '@upstash/redis'
import { now, toStr, parseIntSafe } from './_utils.js'

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
const winBucket = (ttlSec = VIEW_TTL_SEC, ts = Date.now()) => {
  const s = Math.max(1, Number(ttlSec) || VIEW_TTL_SEC)
  return Math.floor((ts / 1000) / s)
}

const str = (x) => String(x ?? '').trim()
const scoreWithId = (ts, id) => {
  const base = Number(ts || 0)
  const num = Number.parseInt(String(id || '').replace(/\D+/g, ''), 10)
  const frac = Number.isFinite(num) ? (num % 1000000) / 1000000 : (Math.random() / 1000000)
  return base + frac
}

const VIDEO_URL_RE =
  /(https?:\/\/[^\s<>'")]+?\.(?:mp4|webm|mov|m4v|mkv)(?:[?#][^\s<>'")]+)?)/i
const VIDEO_HINT_RE =
  /(vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo)/i
const hasVideoInText = (text) => {
  const s = String(text || '')
  if (!s) return false
  return VIDEO_URL_RE.test(s) || VIDEO_HINT_RE.test(s)
}

async function getPostById(id) {
  try {
    const raw = await redis.get(K.postKey(id))
    return safeParse(raw)
  } catch {
    return null
  }
}

async function updateTopicAggregateViews(topicId, delta) {
  if (!topicId) return
  try {
    await redis.incrby(K.topicViewsTotal(topicId), delta)
  } catch {}
}

async function updateTopicAggregateReacts(topicId, kind, delta) {
  if (!topicId || !delta) return
  const key = kind === 'dislike' ? K.topicDislikes(topicId) : K.topicLikes(topicId)
  try {
    await redis.incrby(key, delta)
  } catch {}
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

  
  // per-topic
  topicPostsCount: (topicId) => `forum:topic:${topicId}:posts_count`,
  topicViews:      (topicId) => `forum:topic:${topicId}:views`,
  topicLikes:      (topicId) => `forum:topic:${topicId}:likes`,
  topicDislikes:   (topicId) => `forum:topic:${topicId}:dislikes`,
  topicViewsTotal: (topicId) => `forum:topic:${topicId}:views_total`,

  // per-post
  postViews:    (postId) => `forum:post:${postId}:views`,
  postLikes:    (postId) => `forum:post:${postId}:likes`,
  postDislikes: (postId) => `forum:post:${postId}:dislikes`,

  // sets для уникальных реакций
  postLikesSet:    (postId) => `forum:post:${postId}:likes:set`,
  postDislikesSet: (postId) => `forum:post:${postId}:dislikes:set`,

  // опциональный индекс постов темы
  topicPostsSet:   (topicId) => `forum:topic:${topicId}:posts`,

  // pagination indexes (ZSET)
  zTopics:         'forum:z:topics',
  zTopicAll:       (topicId) => `forum:z:topic:${topicId}:all`,
  zTopicRoots:     (topicId) => `forum:z:topic:${topicId}:roots`,
  zParentReplies:  (parentId) => `forum:z:parent:${parentId}:replies`,
  zInbox:          (userId) => `forum:z:user:${userId}:inbox`,
  zVideoFeed:      'forum:z:feed:video',
  // IP-баны (дополнительно к общему списку)
  bannedIpsSet:    'forum:banned:ips',

  // служебные ключи для суточной дедупликации просмотров/реакций
  dedupViewTopic: (topicId, userId, day) => `forum:dedup:view:topic:${topicId}:${userId}:${day}`,
  dedupViewPost:  (postId, userId, day)  => `forum:dedup:view:post:${postId}:${userId}:${day}`,
  reactStateDay:  (postId, userId, day)  => `forum:react:state:${postId}:${userId}:${day}`,

  // ===== SUBSCRIPTIONS (viewer -> authors) =====
  subsViewerSet:      (viewerId) => `forum:subs:viewer:${viewerId}`,
  subsFollowersCount: (authorId) => `forum:subs:followers_count:${authorId}`,
}

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
    .set(K.topicLikes(topicId), 0)
    .set(K.topicDislikes(topicId), 0)
    .set(K.topicViewsTotal(topicId), 0)
    .zadd(K.zTopics, { score: scoreWithId(t.ts, topicId), member: topicId })
    .exec()

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
    .zadd(K.zTopicAll(p.topicId), { score: scoreWithId(p.ts, postId), member: postId })
    .exec()
  if (!p.parentId) {
    try {
      await redis.zadd(K.zTopicRoots(p.topicId), { score: scoreWithId(p.ts, postId), member: postId })
    } catch {}
  } else {
    try {
      await redis.zadd(K.zParentReplies(p.parentId), { score: scoreWithId(p.ts, postId), member: postId })
    } catch {}
    try {
      const parent = await getPostById(p.parentId)
      const parentAuthorId = String(parent?.userId || parent?.accountId || '')
      if (parentAuthorId && parentAuthorId !== p.userId) {
        await redis.zadd(K.zInbox(parentAuthorId), { score: scoreWithId(p.ts, postId), member: postId })
      }
    } catch {}
  }

  if (hasVideoInText(p.text)) {
    try {
      await redis.zadd(K.zVideoFeed, { score: scoreWithId(p.ts, postId), member: postId })
    } catch {}
  }
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
  if (ok) {
    await incrementTopicViews(tid, 1)
    await updateTopicAggregateViews(tid, 1)
  }
  const views = await getInt(K.topicViews(tid), 0)
  return { inc: !!ok, views }
}
export async function incrementPostViewsUnique(postId, userId, ttlSec = VIEW_TTL_SEC) {
 
  const pid = str(postId), uid = str(userId)
  if (!pid || !uid) return { inc: false, views: await getInt(K.postViews(pid), 0) }
  const ttl = Math.min(24 * 60 * 60, Math.max(1, Number(ttlSec) || VIEW_TTL_SEC))
  const key = K.dedupViewPost(pid, uid, winBucket(ttl))
  const ok = await redis.set(key, '1', { nx: true, ex: ttl })

  if (ok) {
    await incrementPostViews(pid, 1)
    try {
      const post = await getPostById(pid)
      const topicId = String(post?.topicId || '')
      if (topicId) await updateTopicAggregateViews(topicId, 1)
    } catch {}
  }
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
  try {
    const post = await getPostById(pid)
    const topicId = String(post?.topicId || '')
    if (topicId) {
      if (prev === 'like') await updateTopicAggregateReacts(topicId, 'like', -1)
      if (prev === 'dislike') await updateTopicAggregateReacts(topicId, 'dislike', -1)
      await updateTopicAggregateReacts(topicId, target, 1)
    }
  } catch {}

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
    ops.push(['zrem', K.zTopicAll(tid), pid])
    ops.push(['zrem', K.zTopicRoots(tid), pid])
    ops.push(['zrem', K.zVideoFeed, pid])
  }
  ops.push(['del', K.topicPostsSet(tid)])
  ops.push(['del', K.topicKey(tid)])
  ops.push(['srem', K.topicsSet, tid])
  ops.push(['del', K.topicViews(tid)])
  ops.push(['del', K.topicLikes(tid)])
  ops.push(['del', K.topicDislikes(tid)])
  ops.push(['del', K.topicViewsTotal(tid)])
  ops.push(['del', K.topicPostsCount(tid)])
  ops.push(['zrem', K.zTopics, tid])
  ops.push(['del', K.zTopicRoots(tid)])
  ops.push(['del', K.zTopicAll(tid)])

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
   Read helpers
========================= */
export async function getBannedUsers() {
  const ids = await redis.smembers(K.bannedSet)
  return new Set(ids || [])
}
export async function ensurePaginationIndexes() {
  try {
    const exists = await redis.exists(K.zTopics)
    if (exists) return
  } catch {}

  try {
    const topicIds = await redis.smembers(K.topicsSet)
    const postIds = await redis.smembers(K.postsSet)

    const postMap = new Map()
    for (const pid of postIds || []) {
      try {
        const raw = await redis.get(K.postKey(pid))
        const post = safeParse(raw)
        if (!post) continue
        const views = await getInt(K.postViews(pid), 0)
        const likes = await getInt(K.postLikes(pid), 0)
        const dislikes = await getInt(K.postDislikes(pid), 0)
        post.views = views
        post.likes = likes
        post.dislikes = dislikes
        postMap.set(String(pid), post)
      } catch {}
    }

    const pipe = redis.pipeline ? redis.pipeline() : null
    const ops = pipe || redis

    for (const tid of topicIds || []) {
      const topicRaw = await redis.get(K.topicKey(tid))
      const topic = safeParse(topicRaw)
      if (!topic) continue
      const score = scoreWithId(topic.ts, tid)
      if (pipe) {
        ops.zadd(K.zTopics, { score, member: String(tid) })
        ops.set(K.topicLikes(tid), 0)
        ops.set(K.topicDislikes(tid), 0)
        ops.set(K.topicViewsTotal(tid), await getInt(K.topicViews(tid), 0))
      } else {
        await ops.zadd(K.zTopics, { score, member: String(tid) })
        await ops.set(K.topicLikes(tid), 0)
        await ops.set(K.topicDislikes(tid), 0)
        await ops.set(K.topicViewsTotal(tid), await getInt(K.topicViews(tid), 0))
      }
    }

    for (const [pid, post] of postMap.entries()) {
      const topicId = String(post.topicId || '')
      if (!topicId) continue
      const score = scoreWithId(post.ts, pid)
      if (pipe) {
        ops.zadd(K.zTopicAll(topicId), { score, member: pid })
      } else {
        await ops.zadd(K.zTopicAll(topicId), { score, member: pid })
      }

      if (!post.parentId) {
        if (pipe) {
          ops.zadd(K.zTopicRoots(topicId), { score, member: pid })
        } else {
          await ops.zadd(K.zTopicRoots(topicId), { score, member: pid })
        }
      } else {
        if (pipe) {
          ops.zadd(K.zParentReplies(String(post.parentId)), { score, member: pid })
        } else {
          await ops.zadd(K.zParentReplies(String(post.parentId)), { score, member: pid })
        }
        const parent = postMap.get(String(post.parentId))
        const parentAuthorId = String(parent?.userId || parent?.accountId || '')
        if (parentAuthorId && parentAuthorId !== String(post.userId || post.accountId || '')) {
          if (pipe) {
            ops.zadd(K.zInbox(parentAuthorId), { score, member: pid })
          } else {
            await ops.zadd(K.zInbox(parentAuthorId), { score, member: pid })
          }
        }
      }

      if (hasVideoInText(post.text)) {
        if (pipe) {
          ops.zadd(K.zVideoFeed, { score, member: pid })
        } else {
          await ops.zadd(K.zVideoFeed, { score, member: pid })
        }
      }

      const likes = Number(post.likes || 0)
      const dislikes = Number(post.dislikes || 0)
      const views = Number(post.views || 0)
      if (likes) await updateTopicAggregateReacts(topicId, 'like', likes)
      if (dislikes) await updateTopicAggregateReacts(topicId, 'dislike', dislikes)
      if (views) await updateTopicAggregateViews(topicId, views)
    }

    if (pipe) await pipe.exec()
  } catch (e) {
    console.warn('ensurePaginationIndexes failed', e?.message || e)
  }
}

async function loadPostsByIds(ids) {
  if (!ids.length) return []
  const pipe = redis.pipeline ? redis.pipeline() : null
  const ops = pipe || redis
  for (const id of ids) {
    ops.get(K.postKey(id))
    ops.get(K.postViews(id))
    ops.get(K.postLikes(id))
    ops.get(K.postDislikes(id))
  }
  const raw = pipe ? await pipe.exec() : []
  const items = []
  for (let i = 0; i < ids.length; i++) {
    const baseIndex = i * 4
    const postRaw = pipe ? raw[baseIndex]?.[1] : raw[baseIndex]
    const viewsRaw = pipe ? raw[baseIndex + 1]?.[1] : raw[baseIndex + 1]
    const likesRaw = pipe ? raw[baseIndex + 2]?.[1] : raw[baseIndex + 2]
    const dislikesRaw = pipe ? raw[baseIndex + 3]?.[1] : raw[baseIndex + 3]
    const post = safeParse(postRaw)
    if (!post) continue
    post.views = parseIntSafe(viewsRaw, 0)
    post.likes = parseIntSafe(likesRaw, 0)
    post.dislikes = parseIntSafe(dislikesRaw, 0)
    items.push(post)
  }
  return items
}

async function loadTopicsByIds(ids) {
  if (!ids.length) return []
  const pipe = redis.pipeline ? redis.pipeline() : null
  const ops = pipe || redis
  for (const id of ids) {
    ops.get(K.topicKey(id))
    ops.get(K.topicPostsCount(id))
    ops.get(K.topicViewsTotal(id))
    ops.get(K.topicLikes(id))
    ops.get(K.topicDislikes(id))
  }
  const raw = pipe ? await pipe.exec() : []
  const items = []
  for (let i = 0; i < ids.length; i++) {
    const baseIndex = i * 5
    const topicRaw = pipe ? raw[baseIndex]?.[1] : raw[baseIndex]
    const postsRaw = pipe ? raw[baseIndex + 1]?.[1] : raw[baseIndex + 1]
    const viewsRaw = pipe ? raw[baseIndex + 2]?.[1] : raw[baseIndex + 2]
    const likesRaw = pipe ? raw[baseIndex + 3]?.[1] : raw[baseIndex + 3]
    const dislikesRaw = pipe ? raw[baseIndex + 4]?.[1] : raw[baseIndex + 4]
    const topic = safeParse(topicRaw)
    if (!topic) continue
    topic.postsCount = parseIntSafe(postsRaw, 0)
    topic.views = parseIntSafe(viewsRaw, 0)
    topic.likes = parseIntSafe(likesRaw, 0)
    topic.dislikes = parseIntSafe(dislikesRaw, 0)
    items.push(topic)
  }
  return items
}

export async function readFeed({ kind, limit = 25, cursor, sort, topicId, parentId, userId }) {
  await ensurePaginationIndexes()

  const maxLimit = Number(process.env.FORUM_FEED_MAX_LIMIT ?? 50)
  const take = Math.max(1, Math.min(Number(limit) || 25, maxLimit))
  const offset = Math.max(0, Number(cursor) || 0)

  let zkey = ''
  if (kind === 'topics') zkey = K.zTopics
  if (kind === 'topic_roots' && topicId) zkey = K.zTopicRoots(String(topicId))
  if (kind === 'replies' && parentId) zkey = K.zParentReplies(String(parentId))
  if (kind === 'inbox' && userId) zkey = K.zInbox(String(userId))
  if (kind === 'video') zkey = K.zVideoFeed

  if (!zkey) return { items: [], hasMore: false, nextCursor: null, rev: await getInt(K.rev, 0), total: 0 }

  const [total, ids] = await Promise.all([
    redis.zcard(zkey),
    redis.zrange(zkey, offset, offset + take - 1, { rev: true }),
  ])
  const list = Array.isArray(ids) ? ids.map(String) : []
  let items = []
  if (kind === 'topics') {
    items = await loadTopicsByIds(list)
  } else {
    items = await loadPostsByIds(list)
  }

  if (kind === 'inbox') {
    const parentIds = Array.from(new Set(items.map((p) => String(p.parentId || '')).filter(Boolean)))
    if (parentIds.length) {
      const parents = await loadPostsByIds(parentIds)
      const byId = new Map(parents.map((p) => [String(p.id), p]))
      items = items.map((p) => {
        const parent = byId.get(String(p.parentId || ''))
        return {
          ...p,
          parentAuthor: parent?.nickname || '',
          parentAuthorId: parent?.userId || parent?.accountId || '',
        }
      })
    }
  }

  if (kind === 'topic_roots') {
    const pipe = redis.pipeline ? redis.pipeline() : null
    const ops = pipe || redis
    for (const item of items) {
      ops.zcard(K.zParentReplies(String(item.id)))
    }
    const repliesRaw = pipe ? await pipe.exec() : []
    items = items.map((item, idx) => {
      const raw = pipe ? repliesRaw[idx]?.[1] : repliesRaw[idx]
      const count = parseIntSafe(raw, 0)
      return { ...item, repliesCount: count, replies: count }
    })
  }

  const hasMore = offset + list.length < Number(total || 0)
  const nextCursor = hasMore ? String(offset + list.length) : null
  const rev = await getInt(K.rev, 0)

  const payload = { items, hasMore, nextCursor, rev }
  if (kind === 'inbox') payload.total = Number(total || 0)
  if (kind === 'topics') payload.total = Number(total || 0)
  if (kind === 'video') payload.total = Number(total || 0)
  return payload
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

  const end = -1
  const start = Math.max(-limit, -10000)
  const rawList = await redis.lrange(K.changes, start, end)
  const events = rawList
    .map(r => { try { return JSON.parse(r) } catch { return null } })
    .filter(Boolean)
    .filter(e => (e.rev || 0) > sinceRev)
    .sort((a, b) => (a.rev || 0) - (b.rev || 0))

  return { rev: currentRev, events }
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
  // URL для /uploads/... часто длиннее 64. Режем мягко, но безопасно.
  return s0.slice(0, 256)
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

export async function getUserProfile(userId) {
  const [nick, avatar] = await Promise.all([
    getUserNick(userId),
    getUserAvatar(userId),
  ])
  return {
    nickname: str(nick || ''),
    icon: str(avatar || ''),
  }
}

export async function setUserProfile(userId, { nickname, icon } = {}) {
  const out = {}

  if (nickname != null && nickname !== '') {
    out.nickname = await setUserNick(userId, nickname)
  }

  if (icon != null) {
    out.icon = await setUserAvatar(userId, icon)
  }

  return out
}
/* =========================
   SUBSCRIPTIONS (viewer -> authors)
========================= */

const normId = (x) => String(x ?? '').trim()

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

  const isMember = await redis.sismember(setKey, aid)

  if (!isMember) {
    const added = await redis.sadd(setKey, aid) // 1 if new
    if (added === 1) await redis.incr(cntKey)
    const followersCount = await getInt(cntKey, 0)
    return { ok:true, subscribed:true, followersCount }
  } else {
    const removed = await redis.srem(setKey, aid) // 1 if removed
    if (removed === 1) {
      const v = await redis.decr(cntKey)
      if ((Number(v) || 0) < 0) await redis.set(cntKey, 0)
    }
    const followersCount = await getInt(cntKey, 0)
    return { ok:true, subscribed:false, followersCount }
  }
}
