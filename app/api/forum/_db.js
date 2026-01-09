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

    // ===== индексы (ZSET) =====
  topicsIdxTs: 'forum:idx:topics:ts',
  topicPostsIdxTs: (topicId) => `forum:idx:posts:topic:${topicId}:ts`,
  videoPostsIdxTs: 'forum:idx:posts:video:ts',
  repliesIdxTs:    (rootId) => `forum:idx:posts:root:${rootId}:ts`,

  // ===== inbox =====
  inboxIdxTs:       (viewerId) => `forum:inbox:viewer:${viewerId}:ts`,
  inboxUnreadSet:   (viewerId) => `forum:inbox:unread:viewer:${viewerId}`,

  // ===== сортировки (агрегаты) =====
  topicsIdxViews:   'forum:idx:topics:views',
  topicsIdxReplies: 'forum:idx:topics:replies',
  postsIdxLikes:    'forum:idx:posts:likes',
  postsIdxViews:    'forum:idx:posts:views',
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
}
const VIDEO_TEXT_RE =
  /(https?:\/\/[^\s<>'")]+?\.(?:mp4|webm|mov|m4v|mkv)(?:$|[?#])|\/uploads\/video\/|\/forum\/video\/|vercel[-]?blob|vercel[-]?storage|youtube\.com\/watch\?v=|youtu\.be\/|tiktok\.com\/@[\w.\-]+\/video\/\d+)/i

const textHasVideo = (s) => {
  if (!s) return false
  return VIDEO_TEXT_RE.test(String(s))
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
    .zadd(K.topicsIdxTs, { score: t.ts, member: topicId })
    .zadd(K.topicsIdxViews, { score: 0, member: topicId })
    .zadd(K.topicsIdxReplies, { score: 0, member: topicId })
    .exec()

  await pushChange({ rev, kind: 'topic', id: topicId, data: t, ts: t.ts })
  return { topic: t, rev }
}

export async function createPost({ topicId, parentId, text, userId, nickname, icon, ts }) {
  const postId = String(await nextPostId())
  const rev = await nextRev()
    let rootId = postId
  if (parentId) {
    try {
      const raw = await redis.get(K.postKey(parentId))
      const parent = safeParse(raw)
      rootId = String(parent?.rootId || parent?.parentId || parent?.id || parentId)
    } catch {
      rootId = String(parentId)
    }
  }
  const p = {
    id:       postId,
    topicId:  String(topicId),
    parentId: parentId ? String(parentId) : null,
    rootId:   rootId ? String(rootId) : postId,    
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
    .zadd(K.topicPostsIdxTs(p.topicId), { score: p.ts, member: postId })
    .zadd(K.repliesIdxTs(p.rootId), { score: p.ts, member: postId })
    .zadd(K.postsIdxLikes, { score: 0, member: postId })
    .zadd(K.postsIdxViews, { score: 0, member: postId })
    .zadd(K.topicsIdxReplies, { score: 1, member: p.topicId })
    .exec()
  if (textHasVideo(p.text)) {
    try { await redis.zadd(K.videoPostsIdxTs, { score: p.ts, member: postId }) } catch {}
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
