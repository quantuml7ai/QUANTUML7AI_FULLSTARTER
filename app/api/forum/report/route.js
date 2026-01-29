// app/api/forum/report/route.js
import { bad, json, requireUserId } from '../_utils.js'
import { reportPost } from '../_db.js'
import { Redis } from '@upstash/redis'
import { bus } from '../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function publishForumEvent(evt) {
  const payload = { ...evt, ts: Date.now() }
  try { bus.emit(payload) } catch {}
  try {
    const redis = Redis.fromEnv()
    await redis.publish('forum:events', JSON.stringify(payload))
  } catch (e) {
    console.warn('publishForumEvent failed', e?.message || e)
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const reporterId = String(requireUserId(request, body) || '').trim()

    const postId = String(body?.postId || '').trim()
    const reason = String(body?.reason || '').trim().toLowerCase()
    if (!postId) return bad('missing_post_id', 400)

    const result = await reportPost({ postId, reporterId, reason })

    if (result?.action === 'deleted' || result?.action === 'deleted_and_locked') {
      await publishForumEvent({
        type: 'post_deleted',
        postId,
        deleted: result?.deleted || [postId],
        rev: result?.rev,
      })
    }

    return json({ ok: true, ...result })
  } catch (e) {
    const msg = String(e?.message || 'bad_request')
    const status = Number(e?.status || 400)
    return bad(msg, status)
  }
}