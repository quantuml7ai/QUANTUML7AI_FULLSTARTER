import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    await requireAdmin(req) // принимает cookie ИЛИ заголовок x-admin-token
    const body = await req.json().catch(() => ({}))
    const postId = String(body.postId || '').trim()
    if (!postId) return bad('missing_postId', 400)

    // ключи поста
    await Promise.allSettled([
      redis.srem(K.postsSet, postId),
      redis.del(K.postKey(postId)),
      redis.del(K.postViews(postId)),
      redis.del(K.postLikes(postId)),
      redis.del(K.postDislikes(postId)),
    ])

    // событие
    const rev = await redis.incr(K.rev)
    await redis.lpush(K.changes, JSON.stringify({
      rev, kind: 'delete_post', id: postId, ts: Date.now()
    }))

    return json({ ok: true, rev })
  } catch (e) {
    console.error('deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
