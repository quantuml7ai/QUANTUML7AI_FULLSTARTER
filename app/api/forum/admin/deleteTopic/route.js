import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, safeParse } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    await requireAdmin(req)
    const body = await req.json().catch(() => ({}))
    const topicId = String(body.topicId || '').trim()
    if (!topicId) return bad('missing_topicId', 400)

    // собрать id постов темы
    let postIds = []
    if (K.topicPostsSet) {
      // если есть индекс множества постов темы
      postIds = await redis.smembers(K.topicPostsSet(topicId))
    } else {
      // fallback: пройти по всем постам и отфильтровать по topicId (без падений)
      const all = await redis.smembers(K.postsSet)
      for (const pid of all) {
        const raw = await redis.get(K.postKey(pid))
        const obj = safeParse(raw)         // не бросает, вернёт null для битых
        if (obj?.topicId === topicId) postIds.push(pid)
      }
    }

    // удалить посты и их счётчики
    const ops = []
    for (const pid of postIds) {
      ops.push(
        redis.srem(K.postsSet, pid),
        redis.del(K.postKey(pid)),
        redis.del(K.postViews(pid)),
        redis.del(K.postLikes(pid)),
        redis.del(K.postDislikes(pid))
      )
    }

    // удалить тему и её счётчики
    ops.push(
      redis.srem(K.topicsSet, topicId),
      redis.del(K.topicKey(topicId)),
      redis.del(K.topicViews(topicId)),
      redis.del(K.topicPostsCount(topicId))
    )

    await Promise.allSettled(ops)

    const rev = await redis.incr(K.rev)
    await redis.lpush(K.changes, JSON.stringify({
      rev, kind: 'delete_topic', id: topicId, posts: postIds, ts: Date.now()
    }))

    return json({ ok: true, rev, removedPosts: postIds.length })
  } catch (e) {
    console.error('deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
