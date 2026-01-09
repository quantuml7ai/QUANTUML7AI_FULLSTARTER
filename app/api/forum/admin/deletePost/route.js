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
const topicLikes = (id) => (K?.topicLikes ? K.topicLikes(id) : `forum:topic:${id}:likes`)
const topicDislikes = (id) => (K?.topicDislikes ? K.topicDislikes(id) : `forum:topic:${id}:dislikes`)
const topicViewsTotal = (id) => (K?.topicViewsTotal ? K.topicViewsTotal(id) : `forum:topic:${id}:views_total`)
const zTopicAll = (id) => (K?.zTopicAll ? K.zTopicAll(id) : `forum:z:topic:${id}:all`)
const zTopicRoots = (id) => (K?.zTopicRoots ? K.zTopicRoots(id) : `forum:z:topic:${id}:roots`)
const zParentReplies = (id) => (K?.zParentReplies ? K.zParentReplies(id) : `forum:z:parent:${id}:replies`)
const zInbox = (id) => (K?.zInbox ? K.zInbox(id) : `forum:z:user:${id}:inbox`)
const zVideoFeed = (K?.zVideoFeed || 'forum:z:feed:video')

const VIDEO_URL_RE =
  /(https?:\/\/[^\s<>'")]+?\.(?:mp4|webm|mov|m4v|mkv)(?:[?#][^\s<>'")]+)?)/i
const VIDEO_HINT_RE =
  /(vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo)/i
const textHasVideo = (s) => {
  const str = String(s || '')
  if (!str) return false
  return VIDEO_URL_RE.test(str) || VIDEO_HINT_RE.test(str)
}
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
        const parentId = postObj.parentId ? String(postObj.parentId) : ''
    let parentAuthorId = ''
    if (parentId) {
      try {
        const parentRaw = await redis.get(postKey(parentId))
        const parentObj = safeParse(parentRaw)
        parentAuthorId = String(parentObj?.userId || parentObj?.accountId || '')
      } catch {}
    }
    const views = parseInt(await redis.get(postViews(postId)), 10) || 0
    const likes = parseInt(await redis.get(postLikes(postId)), 10) || 0
    const dislikes = parseInt(await redis.get(postDislikes(postId)), 10) || 0
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
    if (topicId) {
      ops.push(
        redis.zrem(zTopicAll(topicId), postId),
      )
      if (parentId) {
        ops.push(redis.zrem(zParentReplies(parentId), postId))
      } else {
        ops.push(redis.zrem(zTopicRoots(topicId), postId))
      }
      if (parentAuthorId) {
        ops.push(redis.zrem(zInbox(parentAuthorId), postId))
      }
      if (views) ops.push(redis.decrby(topicViewsTotal(topicId), views))
      if (likes) ops.push(redis.decrby(topicLikes(topicId), likes))
      if (dislikes) ops.push(redis.decrby(topicDislikes(topicId), dislikes))
    }
    if (textHasVideo(postObj.text)) {
      ops.push(redis.zrem(zVideoFeed, postId))
    }
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
