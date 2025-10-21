// app/api/forum/admin/deletePost/route.js

import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, rebuildSnapshot, nextRev, pushChange } from '../../_db.js'
import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// ЕДИНАЯ публикация событий (локально + межинстансово)
async function publishForumEvent(evt) {
  const payload = { ...evt, ts: Date.now() }
  try { bus.emit(payload) } catch {}
  try {
    const r = Redis.fromEnv()
    await r.publish('forum:events', JSON.stringify(payload))
  } catch {}
}


export async function POST(req) {
  try {
    await requireAdmin(req) // теперь только cookie
    const body = await req.json().catch(() => ({}))
    const postId = String(body.postId || '').trim()
    if (!postId) return bad('missing_postId', 400)

    const likeSetKey = (K?.postLikesSet ? K.postLikesSet(postId) : `post:${postId}:likes:set`)
    const disSetKey  = (K?.postDislikesSet ? K.postDislikesSet(postId) : `post:${postId}:dislikes:set`)
    await Promise.allSettled([
      redis.srem(K.postsSet, postId),
      redis.del(K.postKey(postId)),
      redis.del(K.postViews(postId)),
      redis.del(K.postLikes(postId)),      // числовой счётчик (совместимость)
      redis.del(K.postDislikes(postId)),   // числовой счётчик (совместимость)
      // уникальные реакции (множества)
      redis.del(likeSetKey),
      redis.del(disSetKey),
    ])

    // 2) Фиксируем ревизию и пишем событие в каноническом формате,
    //    чтобы клиент применил удаление мгновенно (kind: 'post', _del:1)
    const rev = await nextRev()
    await pushChange({ rev, kind: 'post', id: String(postId), _del: 1, ts: Date.now() })
 

    // 3) Мгновенно пересобираем снапшот, чтобы следующий snapshot() был консистентным
    try { await rebuildSnapshot() } catch {}
    // ✂️ ограничиваем рост журнала (последние 50k)
    try { await redis.ltrim(K.changes, -50000, -1) } catch {}

    // 4) (опционально) уведомим слушателей SSE
    await publishForumEvent({ type: 'post_deleted', postId, rev })

    return json({ ok: true, rev })
  } catch (e) {
    console.error('deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
