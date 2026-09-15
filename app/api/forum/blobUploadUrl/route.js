// app/api/forum/blobUploadUrl/route.js
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import {
  createR2PresignedPutUrl,
  getR2BucketName,
  getR2Client,
  getR2PublicUrl,
} from '../../../../lib/storage/r2.js'
import { createMediaObjectKey, getMediaPrefixByKind } from '../../../../lib/storage/mediaKeys.js'
import { isMediaLockedForIdentity } from '../_db.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import { FORUM_VIDEO_MAX_BYTES } from '../../../forum/shared/constants/media.js'
import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'
import videoReceipt from '../../../../lib/forum/video-precommit-moderation-receipt.cjs'

export const runtime = 'nodejs'

const VIDEO_ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime']
const POSTER_ALLOWED = ['image/webp', 'image/jpeg']
const VIDEO_POSTER_MAX_BYTES = 768 * 1024
const MAX_SIZE = FORUM_VIDEO_MAX_BYTES // legacy video signer invariant (100MB)
const UPLOAD_URL_TTL_SECONDS = 10 * 60
const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const STAGING_CACHE_CONTROL = 'private, no-store, max-age=0'

async function deleteStagingBestEffort(client, bucket, stagingKey) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: stagingKey }))
  } catch (error) {
    try { console.warn('r2_video_staging_delete_failed', String(error?.message || error || 'unknown')) } catch {}
  }
}

async function readAndVerifyStagingObject({ client, bucket, proof }) {
  let remote
  try {
    remote = await client.send(new GetObjectCommand({ Bucket: bucket, Key: proof.stagingKey }))
  } catch {
    const error = new Error('video_upload_not_readable')
    error.code = 'video_upload_not_readable'
    throw error
  }
  if (!remote?.Body) {
    const error = new Error('video_upload_not_readable')
    error.code = 'video_upload_not_readable'
    throw error
  }

  const remoteMime = String(remote.ContentType || '').split(';')[0].trim().toLowerCase()
  if (remoteMime && remoteMime !== proof.mime) {
    const error = new Error('video_upload_mime_mismatch')
    error.code = 'video_upload_mime_mismatch'
    throw error
  }
  const remoteLength = Number(remote.ContentLength || 0)
  if (remoteLength && remoteLength !== proof.size) {
    const error = new Error('video_upload_size_mismatch')
    error.code = 'video_upload_size_mismatch'
    throw error
  }

  const hash = crypto.createHash('sha256')
  let receivedBytes = 0
  try {
    for await (const value of remote.Body) {
      const chunk = Buffer.from(value)
      receivedBytes += chunk.length
      if (receivedBytes > proof.size || receivedBytes > MAX_SIZE) {
        const error = new Error('video_upload_size_mismatch')
        error.code = 'video_upload_size_mismatch'
        throw error
      }
      hash.update(chunk)
    }
  } catch (error) {
    if (error?.code) throw error
    const wrapped = new Error('video_upload_not_readable')
    wrapped.code = 'video_upload_not_readable'
    throw wrapped
  }

  const actualSha256 = hash.digest('hex')
  if (receivedBytes !== proof.size || actualSha256 !== proof.sha256) {
    const error = new Error('video_upload_digest_mismatch')
    error.code = 'video_upload_digest_mismatch'
    throw error
  }

  const etag = String(remote.ETag || '').trim()
  if (!etag) {
    const error = new Error('video_upload_etag_missing')
    error.code = 'video_upload_etag_missing'
    throw error
  }

  return { etag, actualSha256, receivedBytes }
}

export async function POST(req) {
  const t0 = Date.now()

  const respond = (status, payload = {}) =>
    NextResponse.json(
      {
        ok: status >= 200 && status < 300,
        ...payload,
        timing_ms: Date.now() - t0,
      },
      { status, headers: { 'cache-control': 'no-store' } },
    )

  try {
    let j = {}
    try {
      j = (await req.json()) || {}
    } catch {
      j = {}
    }

    const headerId = req.headers.get('x-forum-user-id') || ''
    const bodyId =
      j?.userId ||
      j?.accountId ||
      j?.asherId ||
      j?.payload?.clientPayload?.userId ||
      j?.payload?.clientPayload?.accountId ||
      j?.payload?.clientPayload?.asherId
    const rawUserId = String(headerId || bodyId || '').trim()
    const userId = String((await resolveCanonicalAccountId(rawUserId).catch(() => '')) || rawUserId || '').trim()
    if (!userId) {
      return respond(401, { error: { code: 'missing_user_id', message: 'User id required' } })
    }

    const restriction = await restrictionGuard.guardBusinessAction({ accountId: userId, actionId: 'forum.upload' })
    if (!restriction.allowed) return respond(restriction.status || 423, restriction)
    const lock = await isMediaLockedForIdentity(userId)
    if (lock.locked) {
      return respond(403, { error: { code: 'media_locked', message: 'Media upload locked', untilMs: lock.untilMs } })
    }

    const action = String(j?.action || '').trim().toLowerCase()
    if (action === 'confirmvideoupload') {
      const uploadToken = String(j?.videoUploadToken || '').trim()
      let proof
      try {
        proof = await videoReceipt.verifyVideoUploadToken(uploadToken, { actorId: userId })
      } catch (error) {
        return respond(403, { error: { code: String(error?.code || 'video_upload_token_invalid').toLowerCase(), message: 'Video upload token is invalid or expired.' } })
      }

      const client = getR2Client()
      const bucket = getR2BucketName()
      let verified
      try {
        verified = await readAndVerifyStagingObject({ client, bucket, proof })
      } catch (error) {
        await deleteStagingBestEffort(client, bucket, proof.stagingKey)
        return respond(409, { error: { code: String(error?.code || 'video_upload_not_readable'), message: 'Uploaded staging object does not match the moderated MP4.' } })
      }

      try {
        await client.send(new CopyObjectCommand({
          Bucket: bucket,
          Key: proof.finalKey,
          CopySource: `${bucket}/${proof.stagingKey}`,
          CopySourceIfMatch: verified.etag,
          MetadataDirective: 'REPLACE',
          ContentType: proof.mime,
          CacheControl: CACHE_CONTROL,
        }))
      } catch (error) {
        await deleteStagingBestEffort(client, bucket, proof.stagingKey)
        return respond(409, { error: { code: 'video_upload_seal_conflict', message: 'Uploaded staging object changed before sealing and was rejected.' } })
      }

      await deleteStagingBestEffort(client, bucket, proof.stagingKey)
      const sealedPublicUrl = getR2PublicUrl(proof.finalKey)
      const videoApprovalToken = await videoReceipt.issueVideoApprovalToken({
        actorId: userId,
        surface: proof.surface,
        mediaUrl: sealedPublicUrl,
        sha256: proof.sha256,
        size: proof.size,
      })
      return respond(200, {
        videoApprovalToken,
        publicUrl: sealedPublicUrl,
        key: proof.finalKey,
        pathname: proof.finalKey,
        verifiedSha256: proof.sha256,
        verifiedSize: proof.size,
        sealed: true,
      })
    }

    const filename = String(j?.filename || j?.pathname || j?.name || 'video').trim()
    const kind = String(j?.kind || j?.mediaKind || 'forum_video').trim().toLowerCase()
    const mimeRaw = String(j?.mime || j?.contentType || '').trim()
    const mime = mimeRaw.split(';')[0].toLowerCase()
    const size = Number(j?.size || 0)

    const isPosterKind = kind === 'forum_video_poster' || kind === 'ads_video_poster'
    const isVideoKind = kind === 'forum_video' || kind === 'ads_video'
    const allowed = isPosterKind ? POSTER_ALLOWED : VIDEO_ALLOWED
    const maxSize = isPosterKind ? VIDEO_POSTER_MAX_BYTES : MAX_SIZE

    if (!allowed.includes(mime)) {
      return respond(415, {
        error: {
          code: 'bad_type',
          message: `Unsupported Content-Type: "${mimeRaw || 'unknown'}"`,
          hint: `Разрешены: ${allowed.join(', ')}`,
        },
        request_meta: { filename, kind, mime: mimeRaw, size },
      })
    }

    if (!size || size < 0) {
      return respond(400, {
        error: {
          code: 'bad_size',
          message: 'File size is required for R2 upload signing.',
        },
        request_meta: { filename, kind, mime: mimeRaw, size },
      })
    }

    if (size > maxSize) {
      return respond(413, {
        error: {
          code: 'too_large',
          message: `File is too large: ${size} bytes`,
          hint: `Максимум: ${maxSize} bytes.`,
        },
        request_meta: { filename, kind, mime: mimeRaw, size },
      })
    }

    let videoModerationProof = null
    if (!isPosterKind) {
      if (!isVideoKind || mime !== 'video/mp4') {
        return respond(415, { error: { code: 'video_final_mp4_required', message: 'Pre-moderated uploads require verified video/mp4.' } })
      }
      const surface = String(j?.surface || '').trim().toLowerCase()
      const moderationReceipt = String(j?.moderationReceipt || '').trim()
      const mediaSha256 = String(j?.mediaSha256 || '').trim().toLowerCase()
      if (!surface || !moderationReceipt || !/^[a-f0-9]{64}$/.test(mediaSha256)) {
        return respond(403, { error: { code: 'video_moderation_receipt_required', message: 'Video moderation receipt required before upload signing.' } })
      }
      try {
        videoModerationProof = await videoReceipt.verifyVideoModerationReceipt(moderationReceipt, {
          actorId: userId,
          surface,
          sha256: mediaSha256,
          size,
          mime,
        })
      } catch (error) {
        return respond(403, { error: { code: String(error?.code || 'video_moderation_receipt_invalid').toLowerCase(), message: 'Video moderation receipt is invalid or expired.' } })
      }
    }

    const prefix = getMediaPrefixByKind(kind)
    const finalKey = createMediaObjectKey({
      prefix,
      filename,
      contentType: mime,
      fallbackName: isPosterKind
        ? (kind === 'ads_video_poster' ? 'ad-video-poster' : 'forum-video-poster')
        : (kind === 'ads_video' ? 'ad-video' : 'forum-video'),
      fallbackExt: isPosterKind
        ? (mime === 'image/webp' ? 'webp' : 'jpg')
        : (mime.includes('quicktime') ? 'mov' : (mime.includes('mp4') ? 'mp4' : 'webm')),
    })
    const stagingKey = videoModerationProof
      ? createMediaObjectKey({
          prefix: `${prefix}/_ql7-precommit-staging`,
          filename,
          contentType: mime,
          fallbackName: kind === 'ads_video' ? 'ad-video-staging' : 'forum-video-staging',
          fallbackExt: 'mp4',
        })
      : ''
    const uploadKey = stagingKey || finalKey

    const signed = await createR2PresignedPutUrl({
      key: uploadKey,
      contentType: mime,
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      cacheControl: videoModerationProof ? STAGING_CACHE_CONTROL : CACHE_CONTROL,
    })

    const videoUploadToken = videoModerationProof
      ? await videoReceipt.issueVideoUploadToken({
          actorId: userId,
          surface: videoModerationProof.surface,
          stagingKey,
          finalKey,
          sha256: videoModerationProof.sha256,
          size: videoModerationProof.size,
          mime,
        })
      : ''

    return respond(200, {
      key: uploadKey,
      uploadUrl: signed.uploadUrl,
      method: signed.method,
      headers: signed.headers,
      ...(videoUploadToken
        ? { videoUploadToken, stagingKey, pathname: stagingKey }
        : { publicUrl: signed.publicUrl, url: signed.publicUrl, pathname: finalKey }),
      request_meta: { filename, kind, mime, size },
    })
  } catch (e) {
    const err = toErr(e)
    console.error('r2_upload_sign_failed', err)
    return respond(err.http || 500, {
      error: {
        code: err.code || 'server_error',
        message: err.message || 'R2 upload sign failed',
        debug: {
          name: err.name,
          stack: err.stack?.split('\n').slice(0, 4).join('\n'),
        },
      },
    })
  }
}

function toErr(e) {
  const x = e || {}
  return {
    name: x.name,
    message: String(x.message || ''),
    code: x.code,
    http: x.status || x.statusCode || undefined,
    stack: x.stack,
  }
}
