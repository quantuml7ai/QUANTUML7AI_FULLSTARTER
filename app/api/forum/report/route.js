import { Redis } from '@upstash/redis'
import { bad, json, requireUserId } from '../_utils.js'
import { reportPost } from '../_db.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'

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
    const body = await req.json().catch(() => ({}))
    const reporterRaw = requireUserId(req, body)
    const reporterId = String((await resolveCanonicalAccountId(reporterRaw)) || reporterRaw || '').trim()
    const postId = String(body?.postId || '').trim()
    const reason = String(body?.reason || '').trim().toLowerCase()
    if (!postId) return bad('missing_postId', 400)
    if (!reason) return bad('missing_reason', 400)

    const result = await reportPost({ postId, reporterId, reason })
    const deletedPostIds = Array.isArray(result?.deletedPostIds)
      ? result.deletedPostIds.map(String)
      : (Array.isArray(result?.deleted) ? result.deleted.map(String) : [])
    if (result?.action?.startsWith?.('deleted') || result?.alreadyDeleted || deletedPostIds.length) {
      await publishForumEvent({ type: 'post_deleted', postId, deleted: deletedPostIds, deletedPostIds, rev: result.rev })
    }
    return json({ ...result, storagePrimary: 'mongo' }, 200)
  } catch (e) {
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
