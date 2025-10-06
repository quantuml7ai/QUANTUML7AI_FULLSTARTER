// app/api/forum/_db.js
import { Redis } from '@upstash/redis'
import { now, toStr, parseIntSafe } from './_utils.js'
// ... твои импорты/константы ...

export const safeParse = (raw) => {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (raw === '[object Object]') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

// helper: безопасное чтение счётчика
export const getInt = async (key, def = 0) => {
  const v = await redis.get(key); const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

// Инициализация Redis из ENV (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
export const redis = Redis.fromEnv()

/* =========================
   Ключи
========================= */
export const K = {
  rev: 'forum:rev',                 // числовой курсор (INCR)
  changes: 'forum:changes',         // LIST с элементами JSON {rev, kind, id, data?, _del?, ts}

  topicsSet: 'forum:topics',        // SET: id тем
  postsSet:  'forum:posts',         // SET: id постов

  topicKey: (id) => `forum:topic:${id}`,
  postKey: (id)  => `forum:post:${id}`,

  // sequence counters
  seqTopic: 'forum:seq:topic',
  seqPost:  'forum:seq:post',

  bannedSet: 'forum:banned',
  adminsSet: 'forum:admins',
  snapshot: 'forum:snapshot',
  // per-topic counters
  topicPostsCount: (topicId) => `forum:topic:${topicId}:posts_count`,
  topicViews: (topicId) => `forum:topic:${topicId}:views`,

  // per-post counters
  postViews: (postId) => `forum:post:${postId}:views`,
  postLikes: (postId) => `forum:post:${postId}:likes`,
  postDislikes: (postId) => `forum:post:${postId}:dislikes`,
}

/* =========================
   Утилиты для записи изменений (event-sourcing)
   - генерируем rev, пушим в список changes, пишем объекты
========================= */

export async function nextRev() {
  // INCR ревизии
  return parseIntSafe(await redis.incr(K.rev), 0)
}

export async function nextTopicId() {
  return parseIntSafe(await redis.incr(K.seqTopic), 0)
}
export async function nextPostId() {
  return parseIntSafe(await redis.incr(K.seqPost), 0)
}

/**
 * Добавить событие в список `forum:changes`.
 * Должно вызываться после успешной записи основного объекта.
 */
export async function pushChange(evt) {
  const obj = JSON.stringify(evt)
  await redis.lpush(K.changes, obj)
}
// === ЕДИНАЯ пересборка снимка базы ===
export async function rebuildSnapshot() {
  const errors = [];

  // Темы
  const topics = [];
  const tIds = await redis.smembers(K.topicsSet);
  for (const tid of tIds) {
    try {
      const raw = await redis.get(K.topicKey(tid));
      const t = safeParse(raw);
      if (!t) { errors.push({ id: String(tid), kind: 'topic', reason: 'parse' }); continue; }
      t.postsCount = await getInt(K.topicPostsCount(tid), 0);
      t.views      = await getInt(K.topicViews(tid), 0);
      topics.push(t);
    } catch (e) {
      errors.push({ id: String(tid), kind: 'topic', reason: 'read_failed' });
    }
  }

  // Посты
  const posts = [];
  const pIds = await redis.smembers(K.postsSet);
  for (const pid of pIds) {
    try {
      const raw = await redis.get(K.postKey(pid));
      const p = safeParse(raw);
      if (!p) { errors.push({ id: String(pid), kind: 'post', reason: 'parse' }); continue; }
      p.likes    = await getInt(K.postLikes(pid), 0);
      p.dislikes = await getInt(K.postDislikes(pid), 0);
      posts.push(p);
    } catch (e) {
      errors.push({ id: String(pid), kind: 'post', reason: 'read_failed' });
    }
  }

  // Бан-лист
  const banned = await redis.smembers(K.bannedSet);

  // Текущая ревизия и сохранение снапшота одним ключом
  const rev = parseIntSafe(await redis.get(K.rev), 0);
  const payload = { topics, posts, banned, errors };
  await redis.set(K.snapshot, JSON.stringify({ rev, payload }));

  return { rev, payload };
}


/* =========================
   CRUD для тем/постов (высокоуровневое API)
   - все функции должны гарантировать, что данные записаны и соответствующие счётчики обновлены
========================= */

export async function createTopic({ title, description, userId, nickname, icon, ts }) {
  const topicId = String(await nextTopicId())
  const rev = await nextRev()
  const t = {
    id: topicId,
    title: toStr(title),
    description: toStr(description),
    ts: ts ?? now(),
    userId: toStr(userId),
    nickname: toStr(nickname),
    icon: toStr(icon),
    isAdmin: '0',
  }
  // multi: записать объект, добавить в set, создать счётчики
  await redis.multi()
    .sadd(K.topicsSet, topicId)
    .set(K.topicKey(topicId), JSON.stringify(t))
    .set(K.topicPostsCount(topicId), 0)
    .set(K.topicViews(topicId), 0)
    .exec()

  await pushChange({ rev, kind: 'topic', id: topicId, data: t, ts: t.ts })
  return { topic: t, rev }
}
// Один пользователь = один голос (like|dislike). Переключение — атомарно через множества.
export async function reactPostUnique(postId, userId, kind) {
  if (!postId || !userId || !['like','dislike'].includes(kind)) {
    throw new Error('bad_react_args')
  }
  const likeSet = K.postLikesSet(postId)
  const disSet  = K.postDislikesSet(postId)

  // Переключение: удаляем из противоположного множества, добавляем в целевое
  if (kind === 'like') {
    await redis.srem(disSet, userId)
    await redis.sadd(likeSet, userId)
  } else {
    await redis.srem(likeSet, userId)
    await redis.sadd(disSet, userId)
  }

  // Пересчитываем счётчики из кардинальностей множеств
  const [likes, dislikes] = await Promise.all([
    redis.scard(likeSet),
    redis.scard(disSet),
  ])

  // Сохраняем видимые числовые ключи (как раньше использовались)
  await Promise.all([
    redis.set(K.postLikes(postId), String(likes)),
    redis.set(K.postDislikes(postId), String(dislikes)),
  ])

  return { likes, dislikes }
}

export async function createPost({ topicId, parentId, text, userId, nickname, icon, ts }) {
  const postId = String(await nextPostId())
  const rev = await nextRev()
  const p = {
    id: postId,
    topicId: String(topicId),
    parentId: parentId ? String(parentId) : null,
    text: toStr(text),
    ts: ts ?? now(),
    userId: toStr(userId),
    nickname: toStr(nickname),
    icon: toStr(icon),
    isAdmin: '0',
  }

  // multi: записать пост, добавить в posts set, инкрементить счётчики
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

export async function incrementTopicViews(topicId, delta = 1) {
  await redis.incrby(K.topicViews(topicId), delta)
}

export async function incrementPostViews(postId, delta = 1) {
  await redis.incrby(K.postViews(postId), delta)
}

export async function reactPost(postId, kind /* 'like'|'dislike' */, delta = 1) {
  if (kind === 'like') await redis.incrby(K.postLikes(postId), delta)
  else if (kind === 'dislike') await redis.incrby(K.postDislikes(postId), delta)
  else throw new Error('bad_reaction_kind')
  const rev = await nextRev()
  await pushChange({ rev, kind: 'react', id: postId, data: { kind, delta }, ts: now() })
  return { rev }
}

/* Admin operations: ban/unban, delete post/topic (soft delete via _del flag + removing from sets) */

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
  // soft delete: mark post object with _del = 1, remove from postsSet
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

export async function dbDeleteTopic(topicId) {
  // mark topic _del, remove from topics set, and cascade delete posts belonging to topic
  const raw = await redis.get(K.topicKey(topicId))
  if (!raw) return null
  const topic = JSON.parse(raw)
  topic._del = 1
  await redis.set(K.topicKey(topicId), JSON.stringify(topic))
  await redis.srem(K.topicsSet, String(topicId))

  // find posts set (we don't have per-topic index of post ids, so we iterate over postsSet)
  const posts = await redis.smembers(K.postsSet) // may be large; acceptable for small forums, otherwise keep index
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

/* Read helpers */

export async function snapshot(sinceRev = 0, limit = 1000) {
  const currentRev = parseIntSafe(await redis.get(K.rev), 0)

  const safeParse = (raw, id, kind, errs) => {
    if (!raw) return null
    try {
      if (typeof raw === 'object') return raw // вдруг клиент Redis вернул уже объект
      // иногда в базе лежит "[object Object]" — такое пропускаем
      if (raw === '[object Object]') {
        errs.push({ id, kind, reason: 'bad_object_string' })
        return null
      }
      return JSON.parse(raw)
    } catch (e) {
      errs.push({ id, kind, reason: 'json_parse_failed' })
      return null
    }
  }
// Псевдопатч внутри snapshot():
if (!sinceRev || sinceRev <= 0) {
  const raw = await redis.get(K.snapshot)     // ОДИН GET
  if (!raw) {
    // fallback на старую сборку один раз (ниже см. rebuild), но не на каждом запросе!
    const snap = await rebuildSnapshot()      // см. шаг 2.2
    return { rev: snap.rev, ...snap.payload }
  }
  const snap = JSON.parse(raw)
  return { rev: snap.rev, ...snap.payload }
} else {
  // как было: читаем events из K.changes
}

  const getCounter = async (key) => parseIntSafe(await redis.get(key), 0)

  if (!sinceRev || sinceRev <= 0) {
    const errors = []
    const topics = []
    const tIds = await redis.smembers(K.topicsSet)
    for (const tid of tIds) {
      const raw = await redis.get(K.topicKey(tid))
      const t = safeParse(raw, tid, 'topic', errors)
      if (!t) continue
      t.postsCount = await getCounter(K.topicPostsCount(tid))
      t.views = await getCounter(K.topicViews(tid))
      topics.push(t)
    }

    const posts = []
    const pIds = await redis.smembers(K.postsSet)
    for (const pid of pIds) {
      const raw = await redis.get(K.postKey(pid))
      const p = safeParse(raw, pid, 'post', errors)
      if (!p) continue
      p.views = await getCounter(K.postViews(pid))
      p.likes = await getCounter(K.postLikes(pid))
      p.dislikes = await getCounter(K.postDislikes(pid))
      posts.push(p)
    }

    const banned = await redis.smembers(K.bannedSet)
    return { rev: currentRev, topics, posts, banned, errors }
  } else {
    const rawList = await redis.lrange(K.changes, 0, 10000) // newest first
    const events = rawList.map(r => {
      try { return JSON.parse(r) } catch { return null }
    }).filter(Boolean).filter(e => (e.rev || 0) > sinceRev)
    return { rev: currentRev, events }
  }
}
