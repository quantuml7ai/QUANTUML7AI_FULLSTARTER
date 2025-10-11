// app/api/forum/admin/delete-post/route.js
import { bad, json, requireAdmin } from '../../_utils.js'
import { dbDeletePost, rebuildSnapshot, redis as redisDirect } from '../../_db.js'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    // только по admin-cookie
    await requireAdmin(req)

    const body = await req.json().catch(() => ({}))
    const postId = String(body?.postId ?? '').trim()
    if (!postId) return bad('missing_postId', 400)

    // 1) Удаляем пост через единый DB-слой (он чистит счётчики, снижает topicPostsCount, pushChange)
    const r = await dbDeletePost(postId)
    if (!r) return bad('not_found', 404)

    // 2) Мгновенно пересобираем снапшот — чтобы /snapshot сразу отдал консистентные данные
    await rebuildSnapshot()

    // 3) Оповещаем слушателей (локально и меж-инстансно)
    const evt = { type: 'post_deleted', postId, rev: r.rev, ts: Date.now() }
    try { bus.emit(evt) } catch {}
    try { await redisDirect.publish('forum:events', JSON.stringify(evt)) } catch {}

    // 4) Ответ
    return json({ ok: true, rev: r.rev })
  } catch (e) {
    console.error('deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
