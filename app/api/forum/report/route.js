import { Redis } from '@upstash/redis'
import { bad, json, requireUserId } from '../_utils.js'
import { reportPost } from '../_db.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'
import {
  notifyQl7MediaLock,
  notifyQl7PostRemoved,
  notifyQl7ReportReceived,
  notifyQl7ReportThreshold,
  notifyQl7RulesWarning,
} from '../../../../lib/ql7-support/events.js'

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

    const reportedAt = new Date().toISOString()
    const postBeforeReport = await forumPrimary.getPost(postId).catch(() => null)
    const authorId = String(postBeforeReport?.userId || postBeforeReport?.accountId || '').trim()
    const result = await reportPost({ postId, reporterId, reason })
    if (!result?.duplicate && authorId) {
      await notifyQl7ReportReceived({
        userId: authorId,
        postId,
        reportType: reason,
        reporterId,
        reportedAt,
      }).catch((error) => {
        console.warn('[ql7-support:report-received]', error?.message || error)
      })
    }
    const deletedPostIds = Array.isArray(result?.deletedPostIds)
      ? result.deletedPostIds.map(String)
      : (Array.isArray(result?.deleted) ? result.deleted.map(String) : [])
    if (result?.action?.startsWith?.('deleted') || result?.alreadyDeleted || deletedPostIds.length) {
      await publishForumEvent({ type: 'post_deleted', postId, deleted: deletedPostIds, deletedPostIds, rev: result.rev })
      const ownerId = String(result?.lockedUserId || authorId || '').trim()
      if (ownerId) {
        await notifyQl7ReportThreshold({
          userId: ownerId,
          postId,
          reportType: reason,
          count: result?.count || 0,
          reachedAt: reportedAt,
        }).catch((error) => {
          console.warn('[ql7-support:report-threshold]', error?.message || error)
        })
        await notifyQl7PostRemoved({
          userId: ownerId,
          postId,
          reason,
          rev: result?.rev || '',
          removedAt: reportedAt,
        }).catch((error) => {
          console.warn('[ql7-support:post-removed]', error?.message || error)
        })
      }
    }
    if (result?.lockedUserId && result?.lockedUntil) {
      const until = new Date(Number(result.lockedUntil)).toISOString()
      await notifyQl7MediaLock({
        userId: result.lockedUserId,
        until,
        reason,
        lockedAt: reportedAt,
      }).catch((error) => {
        console.warn('[ql7-support:media-lock]', error?.message || error)
      })
      await notifyQl7RulesWarning({
        userId: result.lockedUserId,
        reason,
        warningId: `report:${postId}:${result.rev || reportedAt}`,
        warnedAt: reportedAt,
      }).catch((error) => {
        console.warn('[ql7-support:rules-warning]', error?.message || error)
      })
    }
    return json({ ...result, storagePrimary: 'mongo' }, 200)
  } catch (e) {
    return bad(e?.message || 'internal_error', e?.status || 500)
  }
}
