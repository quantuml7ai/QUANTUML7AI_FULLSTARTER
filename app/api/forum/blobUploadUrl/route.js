// app/api/forum/blobUploadUrl/route.js
import { NextResponse } from 'next/server'
import { createR2PresignedPutUrl } from '../../../../lib/storage/r2.js'
import { createMediaObjectKey, getMediaPrefixByKind } from '../../../../lib/storage/mediaKeys.js'
import { isMediaLocked } from '../_db.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import { FORUM_VIDEO_MAX_BYTES } from '../../../forum/shared/constants/media.js'

export const runtime = 'nodejs'

const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_SIZE = FORUM_VIDEO_MAX_BYTES
const UPLOAD_URL_TTL_SECONDS = 10 * 60
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

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

    const lock = await isMediaLocked(userId)
    if (lock.locked) {
      return respond(403, { error: { code: 'media_locked', message: 'Media upload locked', untilMs: lock.untilMs } })
    }

    const filename = String(j?.filename || j?.pathname || j?.name || 'video').trim()
    const kind = String(j?.kind || j?.mediaKind || 'forum_video').trim().toLowerCase()
    const mimeRaw = String(j?.mime || j?.contentType || '').trim()
    const mime = mimeRaw.split(';')[0].toLowerCase()
    const size = Number(j?.size || 0)

    if (!ALLOWED.includes(mime)) {
      return respond(415, {
        error: {
          code: 'bad_type',
          message: `Unsupported Content-Type: "${mimeRaw || 'unknown'}"`,
          hint: `Разрешены: ${ALLOWED.join(', ')}`,
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

    if (size > MAX_SIZE) {
      return respond(413, {
        error: {
          code: 'too_large',
          message: `File is too large: ${size} bytes`,
          hint: `Максимум: ${MAX_SIZE} bytes (500MB).`,
        },
        request_meta: { filename, kind, mime: mimeRaw, size },
      })
    }

    const prefix = getMediaPrefixByKind(kind)
    const key = createMediaObjectKey({
      prefix,
      filename,
      contentType: mime,
      fallbackName: kind === 'ads_video' ? 'ad-video' : 'forum-video',
      fallbackExt: mime.includes('quicktime') ? 'mov' : (mime.includes('mp4') ? 'mp4' : 'webm'),
    })

    const signed = await createR2PresignedPutUrl({
      key,
      contentType: mime,
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      cacheControl: CACHE_CONTROL,
    })

    return respond(200, {
      ...signed,
      url: signed.publicUrl,
      pathname: key,
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
