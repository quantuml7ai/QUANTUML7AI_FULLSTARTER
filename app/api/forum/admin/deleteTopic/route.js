// app/api/forum/admin/deleteTopic/route.js

import { bad, json, requireAdmin } from '../../_utils.js'
import { K, redis, safeParse, rebuildSnapshot, nextRev, pushChange } from '../../_db.js'
import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
 
// единый паблишер событий (локально + межинстансово)
async function publishForumEvent(evt){ const p={...evt,ts:Date.now()}; try{bus.emit(p)}catch{}; try{const r=Redis.fromEnv(); await r.publish('forum:events', JSON.stringify(p))}catch{} }

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
    const likeSetKey = (K?.postLikesSet ? K.postLikesSet(pid) : `post:${pid}:likes:set`)
    const disSetKey  = (K?.postDislikesSet ? K.postDislikesSet(pid) : `post:${pid}:dislikes:set`) 
      ops.push(
        redis.srem(K.postsSet, pid),
        redis.del(K.postKey(pid)),
        redis.del(K.postViews(pid)),
        redis.del(K.postLikes(pid)),
        redis.del(K.postDislikes(pid)),
        // уникальные множества реакций
        redis.del(likeSetKey),
        redis.del(disSetKey),     
       )
    }

    // 3) Удаляем саму тему и её счётчики
    ops.push(
      redis.srem(K.topicsSet, topicId),
      redis.del(K.topicKey(topicId)),
      redis.del(K.topicViews(topicId)),
      redis.del(K.topicPostsCount(topicId))
    )
    // удалить индекс множеств постов темы (если используется)
    if (K.topicPostsSet) ops.push(redis.del(K.topicPostsSet(topicId)))
    await Promise.allSettled(ops)

    // 4) Фиксируем ревизию и пишем событие в каноническом формате:
    //    kind: 'topic' с флагом _del — клиент применит удаление мгновенно
    const rev = await nextRev()
    await pushChange({ rev, kind:'topic', id:String(topicId), _del:1, deletedPosts: postIds, ts: Date.now() })
 

    // 5) Пересобираем снапшот, чтобы /snapshot сразу отдал консистентные данные
    try { await rebuildSnapshot() } catch {}
    // ✂️ ограничиваем рост журнала (последние 50k)
    try { await redis.ltrim(K.changes, -50000, -1) } catch {}

    // 6) (опционально) уведомляем SSE-слушателей
    await publishForumEvent({ type:'topic_deleted', topicId, posts: postIds.length, rev })


    return json({ ok: true, rev, removedPosts: postIds.length })
  } catch (e) {
    console.error('deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
