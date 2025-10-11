// app/api/forum/_db.js
import { Redis } from '@upstash/redis'
import { now, toStr, parseIntSafe } from './_utils.js'

// ---------- helpers ----------
export const safeParse = (raw) => {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  if (raw === '[object Object]') return null
  try { return JSON.parse(raw) } catch { return null }
}

export const redis = Redis.fromEnv()

export const getInt = async (key, def = 0) => {
  const v = await redis.get(key)
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

/* =========================
   Ключи
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

  // per-topic
  topicPostsCount: (topicId) => `forum:topic:${topicId}:posts_count`,
  topicViews:      (topicId) => `forum:topic:${topicId}:views`,

  // per-post
  postViews:    (postId) => `forum:post:${postId}:views`,
  postLikes:    (postId) => `forum:post:${postId}:likes`,
  postDislikes: (postId) => `forum:post:${postId}:dislikes`,

  // sets для уникальных реакций (если используете reactPostUnique)
  postLikesSet:    (postId) => `forum:post:${postId}:likes:set`,
  postDislikesSet: (postId) => `forum:post:${postId}:dislikes:set`,
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

  // ✂️ страховочный трим лога изменений (держим хвост на разумном уровне)
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
    icon:     toStr(icon),  // ← сервер сохраняет иконку автора темы
    isAdmin:  '0',
  }

  // атомарная запись темы и счётчиков
  await redis.multi()
    .sadd(K.topicsSet, topicId)
    .set(K.topicKey(topicId), JSON.stringify(t))
    .set(K.topicPostsCount(topicId), 0)
    .set(K.topicViews(topicId), 0)
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

  // атомарная запись поста и счётчиков
  await redis.multi()
    .sadd(K.postsSet, postId)
    .set(K.postKey(postId), JSON.stringify(p))
    .incr(K.topicPostsCount(p.topicId))
    .set(K.postViews(postId), 0)
    .set(K.postLikes(postId), 0)
    .set(K.postDislikes(postId), 0)
    .exec()

  await pushChange({ rev, kind: 'post', id: postId, data: p, ts: p.ts })
  return { post: p, rev }
}

/** инкременты просмотров */
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

/** уникальные реакции через множества (опционально) */
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
   Admin ops
========================= */
export async function dbBanUser(accountId) {
  const rev = await nextRev()
  await redis.sadd(K.bannedSet, String(accountId))
  await pushChange({ rev, kind: 'ban', id: String(accountId), ts: now() })
  return { rev }
}
export async function dbUnbanUser(accountId) {
  const rev = await nextRev()
  await redis.srem(K.bannedSet, String(accountId))
  await pushChange({ rev, kind: 'unban', id: String(accountId), ts: now() })
  return { rev }
}
export async function dbDeletePost(postId) {
  const raw = await redis.get(K.postKey(postId))
  if (!raw) return null
  const post = safeParse(raw)
  if (!post) return null
  post._del = 1
  const topicId = String(post.topicId || '')
  // атомарно: снять пост из множества, пометить удалённым, скорректировать счётчик темы и подчистить счётчики поста
  const m = redis.multi()
    .set(K.postKey(postId), JSON.stringify(post))
    .srem(K.postsSet, String(postId))
    .del(K.postViews(postId))
    .del(K.postLikes(postId))
    .del(K.postDislikes(postId))
  if (topicId) m.decr(K.topicPostsCount(topicId))
  await m.exec()
  // нижняя граница: если упали ниже 0 (гоночка), вернуть к 0
  if (topicId) {
    try {
      const v = parseInt(await redis.get(K.topicPostsCount(topicId)), 10) || 0
      if (v < 0) await redis.set(K.topicPostsCount(topicId), '0')
    } catch {}
  }
  const rev = await nextRev()
  await pushChange({ rev, kind: 'post', id: String(postId), _del: 1, ts: now() })
  return { rev, post }
}
export async function dbDeleteTopic(topicId) {
  const raw = await redis.get(K.topicKey(topicId))
  if (!raw) return null
  const topic = safeParse(raw)
  if (!topic) return null
  topic._del = 1
  await redis.set(K.topicKey(topicId), JSON.stringify(topic))
  await redis.srem(K.topicsSet, String(topicId))

  // пометим и удалим все посты темы
  const posts = await redis.smembers(K.postsSet)
  const toDel = []
  for (const pid of posts) {
    const pr = await redis.get(K.postKey(pid))
    if (!pr) continue
    const p = safeParse(pr)
    if (!p) continue
    if (String(p.topicId) === String(topicId)) {
      p._del = 1
      await redis.set(K.postKey(pid), JSON.stringify(p))
      await redis.srem(K.postsSet, pid)
      // подчистим счётчики поста (на случай старых значений)
      await redis.del(K.postViews(pid))
      await redis.del(K.postLikes(pid))
      await redis.del(K.postDislikes(pid))
      toDel.push(pid)
    }
  }

  // подчистим счётчики темы
  await redis.del(K.topicPostsCount(topicId))
  await redis.del(K.topicViews(topicId))

  const rev = await nextRev()
  await pushChange({ rev, kind: 'topic', id: String(topicId), _del: 1, ts: now(), deletedPosts: toDel })
  return { rev, topic, deletedPosts: toDel }
}

/* =========================
   Read helpers
========================= */
export async function getBannedUsers() {
  const ids = await redis.smembers(K.bannedSet)
  return new Set(ids || [])
}

/**
 * Снапшот/инкремент:
 * - sinceRev <= 0 → вернуть полный снапшот из K.snapshot (или пересобрать один раз)
 * - sinceRev > 0   → вернуть события с ревизией > sinceRev, по возрастанию rev
 */
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
    // нет валидного снапшота — соберём
    const snap = await rebuildSnapshot()
    return { rev: snap.rev, ...snap.payload }
  }

  // Инкрементальные события: читаем хвост лога (newest first) и фильтруем > sinceRev
  const end = -1
  const start = Math.max(-limit, -10000) // ограничиваем сдвиг
  const rawList = await redis.lrange(K.changes, start, end) // newest first
  const events = rawList
    .map(r => { try { return JSON.parse(r) } catch { return null } })
    .filter(Boolean)
    .filter(e => (e.rev || 0) > sinceRev)
    .sort((a, b) => (a.rev || 0) - (b.rev || 0)) // ↑ по возрастанию

  return { rev: currentRev, events }
}
