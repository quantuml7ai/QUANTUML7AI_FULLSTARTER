import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, safeParse, rebuildSnapshot } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    await requireAdmin(req) // теперь только cookie
    const body = await req.json().catch(() => ({}))
    const topicId = String(body.topicId || '').trim()
    if (!topicId) return bad('missing_topicId', 400)

    // 1) Собираем все посты темы (через индекс, если есть; иначе — по всем постам)
    let postIds = []
    if (K.topicPostsSet) {
      postIds = await redis.smembers(K.topicPostsSet(topicId))
    } else {
      const all = await redis.smembers(K.postsSet)
      for (const pid of all) {
        const raw = await redis.get(K.postKey(pid))
        const obj = safeParse(raw)
        if (obj?.topicId === topicId) postIds.push(pid)
      }
    }

    // 2) Удаляем посты темы и связанные счётчики
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

    // 3) Удаляем саму тему и её счётчики
    ops.push(
      redis.srem(K.topicsSet, topicId),
      redis.del(K.topicKey(topicId)),
      redis.del(K.topicViews(topicId)),
      redis.del(K.topicPostsCount(topicId))
    )

    await Promise.allSettled(ops)

    // 4) Фиксируем ревизию и пишем событие в каноническом формате:
    //    kind: 'topic' с флагом _del — клиент применит удаление мгновенно
    const rev = await redis.incr(K.rev)
    await redis.lpush(
      K.changes,
      JSON.stringify({
        rev,
        kind: 'topic',
        id: String(topicId),
        _del: 1,
        deletedPosts: postIds,
        ts: Date.now()
      })
    )

    // 5) Пересобираем снапшот, чтобы /snapshot сразу отдал консистентные данные
    await rebuildSnapshot()

    // 6) (опционально) уведомляем SSE-слушателей
    try {
      await redis.publish(
        'forum:events',
        JSON.stringify({
          type: 'topic_deleted',
          topicId,
          posts: postIds.length,
          rev,
          ts: Date.now()
        })
      )
    } catch {}

    return json({ ok: true, rev, removedPosts: postIds.length })
  } catch (e) {
    console.error('deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
