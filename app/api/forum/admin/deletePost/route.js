// app/api/forum/admin/deletePost/route.js
import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, safeParse, rebuildSnapshot } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// универсальные ключи/функции
const postsSetKey  = (typeof K?.postsSet  === 'function') ? K.postsSet()  : (K?.postsSet  || 'forum:posts')
const postKey      = (id) => (K?.postKey  ? K.postKey(id)  : `forum:post:${id}`)
const postViews    = (id) => (K?.postViews  ? K.postViews(id)  : `forum:post:${id}:views`)
const postLikes    = (id) => (K?.postLikes  ? K.postLikes(id)  : `forum:post:${id}:likes`)
const postDislikes = (id) => (K?.postDislikes ? K.postDislikes(id) : `forum:post:${id}:dislikes`)
const postLikesSet = (id) => (typeof K?.postLikesSet === 'function' ? K.postLikesSet(id) : (K?.postLikesSet || `post:${id}:likes:set`))
const postDislikesSet = (id) => (typeof K?.postDislikesSet === 'function' ? K.postDislikesSet(id) : (K?.postDislikesSet || `post:${id}:dislikes:set`))
const topicPostsCount = (id) => (K?.topicPostsCount ? K.topicPostsCount(id) : `forum:topic:${id}:posts_count`)
const topicPostsSet   = (id) => (typeof K?.topicPostsSet === 'function' ? K.topicPostsSet(id) : K?.topicPostsSet)

export async function POST(req) {
  try {
    await requireAdmin(req) // cookie forum_admin=1

    const body   = await req.json().catch(() => ({}))
    const postId = String(body.postId || '').trim()
    if (!postId) return bad('missing_postId', 400)

    // 0) Читаем пост — пригодится topicId для ответа/ивента
    let postObj = null
    try {
      const raw = await redis.get(postKey(postId))
      postObj = safeParse(raw)
    } catch {}

    if (!postObj) {
      // идемпотентность: уже удалён — вернём ok и актуальную ревизию
      const revKey = K?.rev || 'forum:rev'
      const rev = await redis.incr(revKey) // инкрементим, чтобы клиенты могли синхронизироваться
      const changesKey = K?.changes || 'forum:changes'
      await redis.lpush(
        changesKey,
        JSON.stringify({ rev, kind: 'post', id: String(postId), _del: 1, duplicate: true, ts: Date.now() })
      )
      try { await rebuildSnapshot() } catch {}
      try {
        await redis.publish('forum:events',
          JSON.stringify({ type: 'post_deleted', postId, topicId: undefined, rev, ts: Date.now() })
        )
      } catch {}
      return json({ ok: true, rev, postId, notFound: true })
    }

    const topicId = String(postObj.topicId || '')
    // 1) Удаляем сам пост и счётчики/сеты
    const ops = [
      redis.srem(postsSetKey, postId),
      redis.del(postKey(postId)),
      redis.del(postViews(postId)),
      redis.del(postLikes(postId)),
      redis.del(postDislikes(postId)),
      redis.del(postLikesSet(postId)),
      redis.del(postDislikesSet(postId)),
    ]

    // 1.1) Если есть индекс topicPostsSet — вычистим из индекса
    const idxKey = topicPostsSet?.(topicId)
    if (idxKey) ops.push(redis.srem(idxKey, postId))

    // 1.2) Декремент счётчика постов темы (но не уйдём в минус)
    if (topicId) {
      try {
        const cRaw = await redis.get(topicPostsCount(topicId))
        const c = parseInt(cRaw, 10) || 0
        if (c > 0) ops.push(redis.decr(topicPostsCount(topicId)))
      } catch {}
    }

    await Promise.allSettled(ops)

    // 2) Ревизия + лента изменений
    const revKey = K?.rev || 'forum:rev'
    const changesKey = K?.changes || 'forum:changes'
    const rev = await redis.incr(revKey)

    // Сохраним совместимый формат (как в mutate): post удалён + явное событие post_deleted
    await redis.lpush(
      changesKey,
      JSON.stringify({ rev, kind: 'post', id: String(postId), _del: 1, ts: Date.now() })
    )
    await redis.lpush(
      changesKey,
      JSON.stringify({ rev, kind: 'post_deleted', id: String(postId), topicId, ts: Date.now() })
    )

    // 3) Пересобираем снапшот
    try { await rebuildSnapshot() } catch {}

    // 4) SSE событие
    try {
      await redis.publish(
        'forum:events',
        JSON.stringify({ type: 'post_deleted', postId, topicId, rev, ts: Date.now() })
      )
    } catch {}

    return json({ ok: true, rev, postId, topicId })
  } catch (e) {
    console.error('admin.deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
