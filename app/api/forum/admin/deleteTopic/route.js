// app/api/forum/admin/deleteTopic/route.js
import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, safeParse, rebuildSnapshot } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// универсальные геттеры ключей (поддержка K как функции/строки/дефолта)
const topicsSetKey = (typeof K?.topicsSet === 'function') ? K.topicsSet() : (K?.topicsSet || 'forum:topics')
const postsSetKey  = (typeof K?.postsSet  === 'function') ? K.postsSet()  : (K?.postsSet  || 'forum:posts')
const topicKey     = (id) => (K?.topicKey ? K.topicKey(id) : `forum:topic:${id}`)
const postKey      = (id) => (K?.postKey  ? K.postKey(id)  : `forum:post:${id}`)
const topicViews   = (id) => (K?.topicViews ? K.topicViews(id) : `forum:topic:${id}:views`)
const postViews    = (id) => (K?.postViews  ? K.postViews(id)  : `forum:post:${id}:views`)
const postLikes    = (id) => (K?.postLikes  ? K.postLikes(id)  : `forum:post:${id}:likes`)
const postDislikes = (id) => (K?.postDislikes ? K.postDislikes(id) : `forum:post:${id}:dislikes`)
const topicPostsCount = (id) => (K?.topicPostsCount ? K.topicPostsCount(id) : `forum:topic:${id}:posts_count`)
const postLikesSet = (id) => (typeof K?.postLikesSet === 'function' ? K.postLikesSet(id) : (K?.postLikesSet || `post:${id}:likes:set`))
const postDislikesSet = (id) => (typeof K?.postDislikesSet === 'function' ? K.postDislikesSet(id) : (K?.postDislikesSet || `post:${id}:dislikes:set`))
const topicPostsSet  = (id) => (typeof K?.topicPostsSet === 'function' ? K.topicPostsSet(id) : K?.topicPostsSet) // может быть undefined
const zTopicsKey = K?.zTopics || 'forum:z:topics'
const zTopicRootsKey = (id) => (K?.zTopicRoots ? K.zTopicRoots(id) : `forum:z:topic:${id}:roots`)
const zTopicAllKey = (id) => (K?.zTopicAll ? K.zTopicAll(id) : `forum:z:topic:${id}:all`)
const zParentRepliesKey = (id) => (K?.zParentReplies ? K.zParentReplies(id) : `forum:z:parent:${id}:replies`)
const zUserInboxKey = (id) => (K?.zUserInbox ? K.zUserInbox(id) : `forum:z:user:${id}:inbox`)
const zVideoFeedKey = K?.zVideoFeed || 'forum:z:feed:video'
export async function POST(req) {
  try {
    await requireAdmin(req) // только cookie forum_admin=1

    const body = await req.json().catch(() => ({}))
    const topicId = String(body.topicId || '').trim()
    if (!topicId) return bad('missing_topicId', 400)

    // 1) Собираем все посты темы
    let postIds = []
    try {
      const idx = topicPostsSet?.(topicId)
      if (idx) {
        postIds = await redis.smembers(idx)
      } else {
        const all = await redis.smembers(postsSetKey)
        for (const pid of all || []) {
          const raw = await redis.get(postKey(pid))
          const obj = safeParse(raw)
          if (obj?.topicId && String(obj.topicId) === String(topicId)) {
            postIds.push(String(pid))
          }
        }
      }
    } catch {}

    // 2) Удаляем посты темы и связанные счётчики/сеты
    const ops = []
    for (const pid of postIds) {
      let postObj = null
      try {
        const raw = await redis.get(postKey(pid))
        postObj = safeParse(raw)
      } catch {}      
      ops.push(
        redis.srem(postsSetKey, pid),
        redis.del(postKey(pid)),
        redis.del(postViews(pid)),
        redis.del(postLikes(pid)),
        redis.del(postDislikes(pid)),
        // возможные set'ы реакций:
        redis.del(postLikesSet(pid)),
        redis.del(postDislikesSet(pid)),
      )
      ops.push(redis.zrem(zVideoFeedKey, pid))
      if (postObj?.parentId) {
        ops.push(redis.zrem(zParentRepliesKey(String(postObj.parentId)), pid))
        try {
          const parentRaw = await redis.get(postKey(postObj.parentId))
          const parent = safeParse(parentRaw)
          const ownerId = parent?.userId || parent?.accountId
          if (ownerId) ops.push(redis.zrem(zUserInboxKey(String(ownerId)), pid))
        } catch {}
      }
    }

    // 3) Удаляем саму тему и её счётчики
    ops.push(
      redis.srem(topicsSetKey, topicId),
      redis.del(topicKey(topicId)),
      redis.del(topicViews(topicId)),
     redis.del(topicPostsCount(topicId)),
      redis.del(zTopicRootsKey(topicId)),
      redis.del(zTopicAllKey(topicId)),
      redis.zrem(zTopicsKey, topicId)
    )

    // 3.1) Если есть индекс topicPostsSet — почистим сам индекс
    const idxKey = topicPostsSet?.(topicId)
    if (idxKey) ops.push(redis.del(idxKey))

    await Promise.allSettled(ops)

    // 4) Ревизия + запись в changes (каноничный формат)
    const revKey = K?.rev || 'forum:rev'
    const changesKey = K?.changes || 'forum:changes'
    const rev = await redis.incr(revKey)
    await redis.lpush(
      changesKey,
      JSON.stringify({
        rev,
        kind: 'topic',
        id: String(topicId),
        _del: 1,
        deletedPosts: postIds,
        ts: Date.now(),
      })
    )

    // 5) Пересобираем снапшот
    try { await rebuildSnapshot() } catch {}

    // 6) Ивенты (SSE)
    try {
      await redis.publish(
        'forum:events',
        JSON.stringify({
          type: 'topic_deleted',
          topicId,
          posts: postIds.length,
          rev,
          ts: Date.now(),
        })
      )
    } catch {}

    return json({ ok: true, rev, removedPosts: postIds.length })
  } catch (e) {
    console.error('admin.deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
