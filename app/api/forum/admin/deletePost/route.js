// app/api/forum/admin/deletePost/route.js
import { Redis } from '@upstash/redis'
import { bad, json, requireAdmin } from '../../_utils.js'
import { dbDeletePostHard } from '../../_db.js'

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
    const postId = String(body.postId || '').trim()
    if (!postId) return bad('missing_postId', 400)

    const result = await dbDeletePostHard(postId)
    const rev = Number(result?.rev || 0)
    const topicId = String(result?.post?.topicId || '')
    await publishForumEvent({ type: 'post_deleted', postId, topicId: topicId || undefined, rev })
    return json({ ok: true, rev, postId, topicId: topicId || undefined, notFound: result?.notFound === true, source: 'mongo_primary' })
  } catch (e) {
    console.error('admin.deletePost error', e)
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
