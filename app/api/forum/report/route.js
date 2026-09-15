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
import { extractQl7SupportMediaEvidence, stripQl7SupportMediaUrlsFromText } from '../../../../lib/ql7-support/mediaEvidence.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function publishForumEvent(payload) {
  try {
    await Redis.fromEnv().publish('forum:events', JSON.stringify({ ...payload, ts: Date.now() }))
  } catch {}
}

function str(value) { return String(value ?? '').trim() }
function isoDate(value = '') {
  const clean = str(value)
  if (!clean) return ''
  const numeric = Number(clean)
  const epoch = Number.isFinite(numeric) && numeric > 0
    ? (numeric < 1e12 ? numeric * 1000 : numeric)
    : clean
  const date = new Date(epoch)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}
function maskId(value = '') {
  const clean = str(value)
  if (!clean) return ''
  return clean.length > 10 ? `${clean.slice(0, 4)}…${clean.slice(-4)}` : `${clean.slice(0, 2)}***`
}
function moderationMediaSnapshot(post = {}) {
  const attachments = [
    ...(Array.isArray(post?.attachments) ? post.attachments : []),
    ...(Array.isArray(post?.media) ? post.media : []),
    post?.imageUrl || post?.image ? { type: 'image', url: post?.imageUrl || post?.image } : null,
    post?.videoUrl || post?.video ? { type: 'video', url: post?.videoUrl || post?.video, poster: post?.poster || post?.thumbnail } : null,
    post?.audioUrl || post?.audio ? { type: 'audio', url: post?.audioUrl || post?.audio } : null,
  ].filter(Boolean)
  return extractQl7SupportMediaEvidence({
    text: str(post?.text || post?.content || post?.body || post?.message),
    attachments,
    limit: 6,
  })
}

function moderationContentType(media = [], text = '') {
  const types = new Set((Array.isArray(media) ? media : []).map((item) => str(item?.type)))
  if (types.has('embed') || types.has('video')) return 'video'
  if (types.has('image')) return 'image'
  if (types.has('audio')) return 'audio'
  return str(text) ? 'text' : 'unknown'
}

function buildModerationSnapshot(post = {}, { postId = '', reason = '', reportedAt = '' } = {}) {
  const rawText = str(post?.text || post?.content || post?.body || post?.message)
  const media = moderationMediaSnapshot(post)
  const id = str(postId || post?.id || post?._id)
  const author = str(post?.userId || post?.accountId || post?.authorId)
  return {
    postId: id,
    permalink: id ? `/forum/p/${encodeURIComponent(id)}` : '',
    authorIdMasked: maskId(author),
    authorDisplayName: str(post?.nickname || post?.authorNickname || post?.nick).slice(0, 140),
    text: stripQl7SupportMediaUrlsFromText(rawText, media).slice(0, 3000),
    contentType: moderationContentType(media, rawText),
    topicId: str(post?.topicId || post?.topic?.id),
    parentId: str(post?.parentId || post?.replyToId),
    createdAt: isoDate(post?.createdAt || post?.publishedAt || post?.ts),
    updatedAt: isoDate(post?.updatedAt),
    reportType: str(reason),
    thresholdCount: 0,
    removed: false,
    media,
    capturedAt: str(reportedAt) || new Date().toISOString(),
  }
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
    const ownerLocale = str(postBeforeReport?.locale || postBeforeReport?.language || postBeforeReport?.preferredLocale)
    const moderationSnapshot = buildModerationSnapshot(postBeforeReport || {}, { postId, reason, reportedAt })
    const result = await reportPost({ postId, reporterId, reason })
    if (!result?.duplicate && authorId) {
      await notifyQl7ReportReceived({
        userId: authorId,
        locale: ownerLocale,
        postId,
        reportType: reason,
        reporterId,
        reportedAt,
        snapshot: moderationSnapshot,
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
          locale: ownerLocale,
          postId,
          reportType: reason,
          count: result?.count || 0,
          reachedAt: reportedAt,
          snapshot: { ...moderationSnapshot, thresholdCount: Number(result?.count || 0), removed: true },
        }).catch((error) => {
          console.warn('[ql7-support:report-threshold]', error?.message || error)
        })
        await notifyQl7PostRemoved({
          userId: ownerId,
          locale: ownerLocale,
          postId,
          reason,
          rev: result?.rev || '',
          removedAt: reportedAt,
          snapshot: { ...moderationSnapshot, thresholdCount: Number(result?.count || 0), removed: true },
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
