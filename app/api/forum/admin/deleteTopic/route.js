// app/api/forum/admin/deleteTopic/route.js
import { Redis } from '@upstash/redis'
import { bad, json, requireAdmin } from '../../_utils.js'
import { dbDeleteTopicHard } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function publishForumEvent(payload) {
  try {
    await Redis.fromEnv().publish('forum:events', JSON.stringify({ ...payload, ts: Date.now() }))
  } catch {}
}

export async function POST(req) {
  try {
    await requireAdmin(req)
    const body = await req.json().catch(() => ({}))
    const topicId = String(body.topicId || '').trim()
    if (!topicId) return bad('missing_topicId', 400)

    const result = await dbDeleteTopicHard(topicId)
    const rev = Number(result?.rev || 0)
    const removedPosts = Array.isArray(result?.deletedPosts) ? result.deletedPosts.length : 0
    await publishForumEvent({ type: 'topic_deleted', topicId, posts: removedPosts, rev })
    return json({ ok: true, rev, topicId, removedPosts, notFound: result?.notFound === true, source: 'mongo_primary' })
  } catch (e) {
    console.error('admin.deleteTopic error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
