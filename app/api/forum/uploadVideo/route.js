import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { putR2Object } from '../../../../lib/storage/r2.js'
import { createMediaObjectKey } from '../../../../lib/storage/mediaKeys.js'
import { FORUM_VIDEO_MAX_BYTES } from '../../../forum/shared/constants/media.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'
import { isMediaLockedForIdentity } from '../_db.js'
import videoReceipt from '../../../../lib/forum/video-precommit-moderation-receipt.cjs'

export const runtime = 'nodejs'

// webm/mp4 — то, что даёт MediaRecorder и обычные клипы
const ALLOWED_MIME = /^(video\/webm|video\/mp4|video\/quicktime)$/i
// legacy route: длинные видео должны идти через /api/forum/blobUploadUrl direct R2 PUT
const MAX_SIZE_BYTES = FORUM_VIDEO_MAX_BYTES
const VIDEO_SURFACES = new Set(['forum', 'dm'])

function response(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

export async function POST(req) {
  try {
    const form = await req.formData()
    const headerId = req.headers.get('x-forum-user-id')
    const formId = form.get('userId') || form.get('accountId') || form.get('asherId')
    const rawUserId = String(headerId || formId || '').trim()
    const userId = String((await resolveCanonicalAccountId(rawUserId).catch(() => '')) || rawUserId || '').trim()
    if (!userId) return NextResponse.json({ ok:false, error:'missing_user_id' }, { status:401, headers:{'cache-control':'no-store'} })
    const restriction = await restrictionGuard.guardBusinessAction({ accountId:userId, actionId:'forum.upload' })
    if (!restriction.allowed) return NextResponse.json(restriction, { status:restriction.status || 423, headers:{'cache-control':'no-store'} })

    const f = form.get('file')
    if (!f) return response({ urls: [], errors: ['no_file'] }, 400)

    const lock = await isMediaLockedForIdentity(userId)
    if (lock.locked) return response({ urls: [], errors: ['media_locked'], untilMs: lock.untilMs }, 403)

    const contentType = String(f.type || '').split(';')[0].trim().toLowerCase()
    if (!ALLOWED_MIME.test(contentType)) return response({ urls: [], errors: ['bad_type'] }, 415)
    if (contentType !== 'video/mp4') return response({ urls: [], errors: ['video_final_mp4_required'] }, 415)

    const buf = Buffer.from(await f.arrayBuffer())
    if (!buf.length) return response({ urls: [], errors: ['bad_size'] }, 400)
    if (buf.length > MAX_SIZE_BYTES) return response({ urls: [], errors: ['too_large'] }, 413)

    const surface = String(form.get('surface') || '').trim().toLowerCase()
    const moderationReceipt = String(form.get('moderationReceipt') || '').trim()
    const providedSha256 = String(form.get('mediaSha256') || '').trim().toLowerCase()
    const actualSha256 = crypto.createHash('sha256').update(buf).digest('hex')
    if (!VIDEO_SURFACES.has(surface) || !moderationReceipt || providedSha256 !== actualSha256) {
      return response({ urls: [], errors: ['video_moderation_receipt_required'] }, 403)
    }

    let proof
    try {
      proof = await videoReceipt.verifyVideoModerationReceipt(moderationReceipt, {
        actorId: userId,
        surface,
        sha256: actualSha256,
        size: buf.length,
        mime: contentType,
      })
    } catch {
      return response({ urls: [], errors: ['video_moderation_receipt_invalid'] }, 403)
    }

    const key = createMediaObjectKey({
      prefix: 'forum/videos',
      filename: f.name || 'video.mp4',
      contentType,
      fallbackName: 'video',
      fallbackExt: 'mp4',
    })

    const { url } = await putR2Object({ key, body: buf, contentType })
    const videoApprovalToken = await videoReceipt.issueVideoApprovalToken({
      actorId: userId,
      surface: proof.surface,
      mediaUrl: url,
      sha256: proof.sha256,
      size: proof.size,
    })

    return response({ urls: [url], errors: [], videoApprovalToken })
  } catch (e) {
    console.error('upload_video_failed', e)
    return response({ urls: [], errors: ['upload_failed'] }, 500)
  }
}
