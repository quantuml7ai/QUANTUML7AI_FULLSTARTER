// app/api/forum/_db.js

import { Redis } from '@upstash/redis'

// Инициализация Redis через ENV (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
export const redis = Redis.fromEnv()

/* =========================
   Ключи
========================= */

const K = {
  topic: (id) => `forum:topic:${id}`,          // hash темы
  topicIdx: 'forum:topics',                    // zset тем по ts
  topicPostsIdx: (topicId) => `forum:topic:${topicId}:posts`, // zset постов по ts
  post: (id) => `forum:post:${id}`,            // hash поста
  reactUser: (postId, userId) => `forum:react:${postId}:${userId}`, // string '👍'|'👎'
  bannedSet: 'forum:banned',                   // set забаненных userId
  reportsList: 'forum:reports',                // list репортов
  viewMark: (postId, userId, day) => `forum:viewed:${postId}:${userId}:${day}`, // ключ отметки просмотра
  banned: 'forum:banned',
}

/* =========================
   Helpers
========================= */

export function uid() {
  // уникальный id
  return (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`)
}

export function now() {
  return Date.now()
}

/* =========================
   Вспомогательные конверторы
========================= */

function toStr(v) {
  if (v === undefined || v === null) return ''
  return String(v)
}

function parseIntSafe(x, d = 0) {
  const n = parseInt(x ?? '', 10)
  return Number.isFinite(n) ? n : d
}

function bool01(b) {
  return b ? '1' : '0'
}

// Проверка: забанен ли юзер
export async function dbIsBanned(userId) {
  if (!userId) return false
  try {
    return await redis.sismember(K.banned, userId)
  } catch (e) {
    console.error('dbIsBanned error', e)
    return false
  }
}

// Добавить бан
export async function dbBanUser(userId) {
  if (!userId) return
  try {
    await redis.sadd(K.banned, userId)
  } catch (e) {
    console.error('dbBanUser error', e)
    throw e
  }
}

// Снять бан
export async function dbUnbanUser(userId) {
  if (!userId) return
  try {
    await redis.srem(K.banned, userId)
  } catch (e) {
    console.error('dbUnbanUser error', e)
    throw e
  }
}

/* =========================
   Топики
========================= */

export async function dbCreateTopic({ id, title, description, ts, userId, nickname, icon, isAdmin }) {
  const t = {
    id,
    title: title || '',
    description: description || '',
    ts: toStr(ts || now()),
    userId: userId || '',
    nickname: nickname || '',
    icon: icon || '👤',
    isAdmin: bool01(!!isAdmin),
    // агрегаты
    posts_count: '1',       // будет 1, если создаём сразу первый пост — но пост создаётся отдельно; поэтому здесь ставим 0, а инкрементим при dbCreatePost
    likes_count: '0',
    dislikes_count: '0',
    views_count: '0',
  }
  // при создании темы агрегат постов = 0, так как первый пост создаётся отдельной операцией
  t.posts_count = '0'

  const pipe = redis.pipeline()
  pipe.hset(K.topic(id), t)
  pipe.zadd(K.topicIdx, { score: parseIntSafe(t.ts, now()), member: id })
  await pipe.exec()
}

export async function dbDeleteTopic(id) {
  if (!id) return
  // удалить все посты темы
  const ids = await redis.zrange(K.topicPostsIdx(id), 0, -1)
  const pipe = redis.pipeline()
  for (const pid of ids) {
    pipe.del(K.post(pid))
    // также удалим возможные ключи реакций пользователей — безопасно не знать точные userId, просто ключи не удалить
    // (поэтому счётчики остаются консистентными в агрегатах темы)
  }
  pipe.del(K.topicPostsIdx(id))
  pipe.del(K.topic(id))
  pipe.zrem(K.topicIdx, id)
  await pipe.exec()
}

export async function dbListTopics() {
  // отдаем все темы в порядке «новые сверху»
  const ids = await redis.zrange(K.topicIdx, 0, -1, { rev: true })
  if (!ids?.length) return []
  const pipe = redis.pipeline()
  for (const id of ids) pipe.hgetall(K.topic(id))
  const rows = await pipe.exec()
  const items = (rows || []).map(r => {
    const h = r || {}
    return {
      id: h.id,
      title: h.title || '',
      description: h.description || '',
      ts: parseIntSafe(h.ts, 0),
      userId: h.userId || '',
      nickname: h.nickname || '',
      icon: h.icon || '👤',
      isAdmin: h.isAdmin === '1',
      // агрегаты
      posts: parseIntSafe(h.posts_count, 0),
      likes: parseIntSafe(h.likes_count, 0),
      dislikes: parseIntSafe(h.dislikes_count, 0),
      views: parseIntSafe(h.views_count, 0),
    }
  })
  return items
}

/* =========================
   Посты
========================= */

export async function dbCreatePost({ id, topicId, parentId, text, ts, userId, nickname, icon, isAdmin }) {
  const p = {
    id,
    topicId,
    parentId: parentId || '',
    text: text || '',
    ts: toStr(ts || now()),
    userId: userId || '',
    nickname: nickname || '',
    icon: icon || '👤',
    isAdmin: bool01(!!isAdmin),
    // постовые счётчики
    likes: '0',
    dislikes: '0',
    views: '0',
  }

  const pipe = redis.pipeline()
  pipe.hset(K.post(id), p)
  pipe.zadd(K.topicPostsIdx(topicId), { score: parseIntSafe(p.ts, now()), member: id })
  // инкремент агрегата постов на теме
  pipe.hincrby(K.topic(topicId), 'posts_count', 1)
  await pipe.exec()
}

export async function dbDeletePost(id) {
  if (!id) return
  // нужно знать topicId для корректной зачистки индекса и агрегата
  const h = await redis.hgetall(K.post(id))
  const topicId = h?.topicId
  const pipe = redis.pipeline()
  pipe.del(K.post(id))
  if (topicId) {
    pipe.zrem(K.topicPostsIdx(topicId), id)
    // агрегат постов уменьшаем, но безопасно не уходить в минус
    pipe.hincrby(K.topic(topicId), 'posts_count', -1)
  }
  await pipe.exec()
}

export async function dbListPosts(topicId) {
  const ids = await redis.zrange(K.topicPostsIdx(topicId), 0, -1)
  if (!ids?.length) return []
  const pipe = redis.pipeline()
  for (const id of ids) pipe.hgetall(K.post(id))
  const rows = await pipe.exec()
  const items = (rows || []).map(h => ({
    id: h.id,
    topicId: h.topicId,
    parentId: h.parentId || null,
    text: h.text || '',
    ts: parseIntSafe(h.ts, 0),
    userId: h.userId || '',
    nickname: h.nickname || '',
    icon: h.icon || '👤',
    isAdmin: h.isAdmin === '1',
    reactions: { '👍': parseIntSafe(h.likes, 0), '👎': parseIntSafe(h.dislikes, 0) },
    views: parseIntSafe(h.views, 0),
  }))
  return items
}

/* =========================
   Реакции
========================= */

export async function dbGetMyReaction({ postId, userId }) {
  return await redis.get(K.reactUser(postId, userId)) // '👍'|'👎'|null
}

export async function dbReact({ postId, userId, emoji }) {
  if (!postId || !userId) return
  const key = K.reactUser(postId, userId)
  const was = await redis.get(key)

  if (emoji === '👍' || emoji === '👎') {
    const pipe = redis.pipeline()
    if (was && was !== emoji) {
      // снимаем противоположную
      if (was === '👍') pipe.hincrby(K.post(postId), 'likes', -1)
      if (was === '👎') pipe.hincrby(K.post(postId), 'dislikes', -1)
    }
    // ставим новую
    if (emoji === '👍') pipe.hincrby(K.post(postId), 'likes', was === '👍' ? 0 : 1)
    if (emoji === '👎') pipe.hincrby(K.post(postId), 'dislikes', was === '👎' ? 0 : 1)
    pipe.set(key, emoji)
    await pipe.exec()

    // обновим агрегаты темы
    const h = await redis.hgetall(K.post(postId))
    const topicId = h?.topicId
    if (topicId) {
      const tpipe = redis.pipeline()
      if (emoji === '👍' && was !== '👍') tpipe.hincrby(K.topic(topicId), 'likes_count', 1)
      if (emoji === '👎' && was !== '👎') tpipe.hincrby(K.topic(topicId), 'dislikes_count', 1)
      if (was && was !== emoji) {
        if (was === '👍') tpipe.hincrby(K.topic(topicId), 'likes_count', -1)
        if (was === '👎') tpipe.hincrby(K.topic(topicId), 'dislikes_count', -1)
      }
      await tpipe.exec()
    }
  } else {
    // снять реакцию
    if (was) {
      const pipe = redis.pipeline()
      if (was === '👍') pipe.hincrby(K.post(postId), 'likes', -1)
      if (was === '👎') pipe.hincrby(K.post(postId), 'dislikes', -1)
      pipe.del(key)
      await pipe.exec()

      const h = await redis.hgetall(K.post(postId))
      const topicId = h?.topicId
      if (topicId) {
        await redis.hincrby(K.topic(topicId), was === '👍' ? 'likes_count' : 'dislikes_count', -1)
      }
    }
  }
}

/* =========================
   Просмотры (идемпотентно 1/сутки/пост/юзер)
========================= */

export async function dbIncrementView({ postId, userId, day }) {
  if (!postId || !userId) return
  const mark = K.viewMark(postId, userId, day)
  // set NX EX 24h — если впервые, инкрементим счётчики
  const ok = await redis.set(mark, '1', { nx: true, ex: 60 * 60 * 24 })
  if (ok) {
    const pipe = redis.pipeline()
    pipe.hincrby(K.post(postId), 'views', 1)
    // обновим агрегат на теме
    const h = await redis.hgetall(K.post(postId))
    const topicId = h?.topicId
    if (topicId) pipe.hincrby(K.topic(topicId), 'views_count', 1)
    await pipe.exec()
  }
}

/* =========================
   Поиск (простой)
========================= */

export async function dbSearch(q) {
  const term = (q || '').toLowerCase().trim()
  if (!term) return []
  const topicIds = await redis.zrange(K.topicIdx, 0, -1, { rev: true })
  const pipe = redis.pipeline()
  for (const id of topicIds) pipe.hgetall(K.topic(id))
  const topics = (await pipe.exec()) || []

  const res = []
  for (const t of topics) {
    const title = t.title || ''
    const desc = t.description || ''
    if (title.toLowerCase().includes(term) || desc.toLowerCase().includes(term)) {
      res.push({ type: 'topic', id: t.id, title: t.title, snippet: t.description })
    }
    // поиск в постах темы
    const pids = await redis.zrange(K.topicPostsIdx(t.id), 0, -1, { rev: true })
    if (pids?.length) {
      const ppipe = redis.pipeline()
      for (const pid of pids) ppipe.hgetall(K.post(pid))
      const posts = await ppipe.exec()
      for (const p of posts) {
        const txt = (p.text || '').toLowerCase()
        if (txt.includes(term)) {
          res.push({ type: 'post', id: p.id, topicId: p.topicId, topicTitle: t.title, snippet: (p.text || '').slice(0, 160) })
        }
      }
    }
  }
  return res.slice(0, 200)
}

/* =========================
   Профиль
========================= */

export async function dbPatchUser({ userId, nickname, icon }) {
  // Храним профиль в теме/посте при создании. Отдельное место для профилей можно завести при желании.
  // Здесь просто no-op, но оставим хук для расширения
  return { ok: true }
}
