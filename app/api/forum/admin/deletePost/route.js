import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, rebuildSnapshot } from'../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    await requireAdmin(req) // теперь только cookie
    const body = await req.json().catch(() => ({}))
    const postId = String(body.postId || '').trim()
    if (!postId) return bad('missing_postId', 400)

    // 1) Удаляем объект и связанные счётчики (мягко: игнорируем частичные ошибки)
    await Promise.allSettled([
      redis.srem(K.postsSet, postId),
      redis.del(K.postKey(postId)),
      redis.del(K.postViews(postId)),
      redis.del(K.postLikes(postId)),
      redis.del(K.postDislikes(postId)),
    ])

    // 2) Фиксируем ревизию и пишем событие в каноническом формате,
    //    чтобы клиент применил удаление мгновенно (kind: 'post', _del:1)
    const rev = await redis.incr(K.rev)
    await redis.lpush(
      K.changes,
      JSON.stringify({ rev, kind: 'post', id: String(postId), _del: 1, ts: Date.now() })
    )

    // 3) Мгновенно пересобираем снапшот, чтобы следующий snapshot() был консистентным
    await rebuildSnapshot()

    // 4) (опционально) уведомим слушателей SSE
    try {
      await redis.publish(
        'forum:events',
        JSON.stringify({ type: 'post_deleted', postId, rev, ts: Date.now() })
      )
    } catch {}

    return json({ ok: true, rev })
  } catch (e) {
    console.error('deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
