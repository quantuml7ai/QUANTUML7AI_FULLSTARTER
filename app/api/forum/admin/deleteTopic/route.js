// app/api/forum/admin/delete-topic/route.js
import { bad, json, requireAdmin } from '../../_utils.js'
import { dbDeleteTopic, rebuildSnapshot, redis as redisDirect } from '../../_db.js'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    // только по admin-cookie
    await requireAdmin(req)

    const body = await req.json().catch(() => ({}))
    const topicId = String(body?.topicId ?? '').trim()
    if (!topicId) return bad('missing_topicId', 400)

    // 1) Удаляем тему через единый DB-слой (он пометит посты, почистит счётчики, pushChange)
    const { rev, deletedPosts = [] } = await dbDeleteTopic(topicId) || {}
    if (!rev) return bad('not_found', 404)

    // 2) Мгновенно пересобираем снапшот — чтобы /snapshot отдал консистентные данные
    await rebuildSnapshot()

    // 3) Оповещаем слушателей (локально и меж-инстансно)
    const evt = {
      type: 'topic_deleted',
      topicId,
      posts: deletedPosts.length,
      rev,
      ts: Date.now(),
    }
    try { bus.emit(evt) } catch {}
    try { await redisDirect.publish('forum:events', JSON.stringify(evt)) } catch {}

    // 4) Ответ
    return json({ ok: true, rev, removedPosts: deletedPosts.length })
  } catch (e) {
    console.error('deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
