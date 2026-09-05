// app/forum/features/media/services/uploadR2MediaFile.js

import { prepareForumVideoForUpload } from '../../../../../lib/forumClientVideoOptimizer'
import { createNativeVideoPoster } from '../../../../../lib/nativeVideoPoster'
import moderatePreparedVideoForUpload from './moderatePreparedVideoForUpload'

function parseUploadErrorPayload(payload, fallback) {
  if (!payload || typeof payload !== 'object') return fallback

  const direct = payload.message || payload.errorMessage || payload.error
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const nested = payload.error
  if (nested && typeof nested === 'object') {
    const message = nested.message || nested.code
    if (typeof message === 'string' && message.trim()) return message.trim()
  }

  return fallback
}

function createAbortError() {
  const error = new Error('R2 upload aborted')
  error.name = 'AbortError'
  return error
}

async function readJsonResponse(response) {
  const text = await response.text().catch(() => '')
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

function normalizeUploadHeaders(headers) {
  const normalized = {}

  if (!headers || typeof headers !== 'object') return normalized

  Object.entries(headers).forEach(([name, value]) => {
    const cleanName = String(name || '').trim()
    if (!cleanName) return
    if (value == null) return

    const cleanValue = String(value).trim()
    if (!cleanValue) return

    normalized[cleanName] = cleanValue
  })

  return normalized
}

function putFileWithProgress({
  uploadUrl,
  file,
  headers = {},
  signal,
  onUploadProgress,
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false

    const settleResolve = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const settleReject = (error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const onAbortSignal = () => {
      try {
        xhr.abort()
      } catch {}
      settleReject(createAbortError())
    }

    const cleanup = () => {
      if (signal) {
        try {
          signal.removeEventListener('abort', onAbortSignal)
        } catch {}
      }
    }

    if (signal?.aborted) {
      settleReject(createAbortError())
      return
    }

    if (signal) {
      try {
        signal.addEventListener('abort', onAbortSignal, { once: true })
      } catch {}
    }

    xhr.open('PUT', uploadUrl, true)

    const uploadHeaders = normalizeUploadHeaders(headers)
    Object.entries(uploadHeaders).forEach(([name, value]) => {
      try {
        xhr.setRequestHeader(name, value)
      } catch {}
    })

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !event.total) return

      const pct = Math.max(0, Math.min(100, (event.loaded / event.total) * 100))
      try {
        onUploadProgress?.(pct)
      } catch {}
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          onUploadProgress?.(100)
        } catch {}
        settleResolve()
        return
      }

      settleReject(
        new Error(
          `R2 upload failed with HTTP ${xhr.status}${xhr.responseText ? `: ${xhr.responseText}` : ''}`,
        ),
      )
    }

    xhr.onerror = () => {
      settleReject(
        new Error(
          'R2 upload failed: network/CORS error. Check Cloudflare R2 bucket CORS Policy for PUT from the current site.',
        ),
      )
    }

    xhr.onabort = () => {
      settleReject(createAbortError())
    }

    xhr.send(file)
  })
}

function canUseForumVideoFallback(kind) {
  return String(kind || '').trim().toLowerCase() === 'forum_video'
}

function resolveModerationSurface(kind, requestedSurface = '') {
  const requested = String(requestedSurface || '').trim().toLowerCase()
  if (['forum', 'dm', 'ads'].includes(requested)) return requested
  return String(kind || '').trim().toLowerCase() === 'ads_video' ? 'ads' : 'forum'
}

async function uploadForumVideoViaServer({
  file,
  userId = '',
  filename = '',
  moderationSurface = '',
  moderationReceipt = '',
  mediaSha256 = '',
  signal,
  onUploadProgress,
} = {}) {
  if (signal?.aborted) throw createAbortError()

  const fd = new FormData()
  fd.append('file', file, String(filename || file?.name || 'video.mp4'))
  fd.append('surface', String(moderationSurface || 'forum'))
  fd.append('moderationReceipt', String(moderationReceipt || ''))
  fd.append('mediaSha256', String(mediaSha256 || ''))

  try {
    onUploadProgress?.(92)
  } catch {}

  const response = await fetch('/api/forum/uploadVideo', {
    method: 'POST',
    body: fd,
    cache: 'no-store',
    headers: userId ? { 'x-forum-user-id': String(userId) } : undefined,
    signal,
  })

  const payload = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(parseUploadErrorPayload(payload, `forum video upload failed with HTTP ${response.status}`))
  }

  const url = String(
    (Array.isArray(payload?.urls) && payload.urls[0]) ||
    payload?.url ||
    payload?.publicUrl ||
    '',
  ).trim()

  if (!url) throw new Error('forum video upload response is missing url')

  try {
    onUploadProgress?.(100)
  } catch {}

  return {
    ok: true,
    key: '',
    url,
    publicUrl: url,
    pathname: '',
    fallback: 'forum_upload_video',
    videoApprovalToken: String(payload?.videoApprovalToken || ''),
  }
}

function posterKindForVideoKind(kind) {
  return String(kind || '').trim().toLowerCase() === 'ads_video'
    ? 'ads_video_poster'
    : 'forum_video_poster'
}

export default async function uploadR2MediaFile({
  file,
  kind = 'forum_video',
  userId = '',
  filename = '',
  contentType = '',
  signal,
  onPrepareProgress,
  onUploadProgress,
  videoPolicy = null,
  videoPoster = null,
  moderationSurface = '',
  posterFactory = createNativeVideoPoster,
} = {}) {
  if (!file) {
    throw new Error('R2 upload file is required')
  }

  const preparation = await prepareForumVideoForUpload({
    file,
    kind,
    filename,
    contentType,
    signal,
    onProgress: onPrepareProgress,
    videoPolicy,
  })

  const uploadFile = preparation?.file || file
  const resolvedFilename = String(preparation?.filename || filename || uploadFile?.name || 'media').trim() || 'media'
  const resolvedContentType = String(preparation?.contentType || contentType || uploadFile?.type || 'application/octet-stream').trim()
  const size = Number(uploadFile?.size || 0)

  if (!uploadFile || size <= 0) {
    throw new Error('R2 upload prepared file is empty')
  }
  if (preparation?.isVideo && resolvedContentType !== 'video/mp4') {
    throw new Error('R2 video gateway requires verified video/mp4 output')
  }

  let videoModeration = null
  if (preparation?.isVideo) {
    videoModeration = await moderatePreparedVideoForUpload({
      file: uploadFile,
      surface: resolveModerationSurface(kind, moderationSurface),
      userId,
      signal,
    })
    if (videoModeration?.status !== 'approved' || !videoModeration?.moderationReceipt || !videoModeration?.mediaSha256) {
      throw new Error('R2 video gateway requires pre-upload moderation approval')
    }
  }

  let posterUpload = null
  let posterRecord = null
  if (preparation?.isVideo) {
    const precomputed = videoPoster?.blob instanceof Blob || videoPoster?.file instanceof Blob ? videoPoster : null
    posterRecord = precomputed || await posterFactory({
      source: uploadFile,
      sourceName: resolvedFilename,
      mirrorX: !!videoPolicy?.mirrorX,
      signal,
    })
    const posterFile = posterRecord?.file instanceof Blob ? posterRecord.file : posterRecord?.blob
    const posterMime = String(posterRecord?.mime || posterFile?.type || '').split(';')[0].trim().toLowerCase()
    const posterFilename = String(posterRecord?.filename || `video-poster.${posterMime === 'image/webp' ? 'webp' : 'jpg'}`)
    if (!(posterFile instanceof Blob) || !posterFile.size || !['image/webp', 'image/jpeg'].includes(posterMime)) {
      throw new Error('Native video poster generation did not produce a valid bounded image')
    }
    posterUpload = await signAndPutMedia({
      file: posterFile,
      kind: posterKindForVideoKind(kind),
      userId,
      filename: posterFilename,
      contentType: posterMime,
      signal,
    })
  }

  const signResponse = await fetch('/api/forum/blobUploadUrl', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(userId ? { 'x-forum-user-id': String(userId) } : {}),
    },
    body: JSON.stringify({
      filename: resolvedFilename,
      name: resolvedFilename,
      contentType: resolvedContentType,
      mime: resolvedContentType,
      size,
      kind,
      userId,
      ...(preparation?.isVideo ? {
        surface: resolveModerationSurface(kind, moderationSurface),
        moderationReceipt: videoModeration?.moderationReceipt,
        mediaSha256: videoModeration?.mediaSha256,
      } : {}),
    }),
    signal,
  })

  const signPayload = await readJsonResponse(signResponse)
  if (!signResponse.ok || !signPayload?.ok) {
    throw new Error(parseUploadErrorPayload(signPayload, `R2 sign failed with HTTP ${signResponse.status}`))
  }

  const uploadUrl = String(signPayload.uploadUrl || '').trim()
  const signedPublicUrl = String(signPayload.publicUrl || signPayload.url || '').trim()
  const signedKey = String(signPayload.key || signPayload.pathname || '').trim()
  const videoUploadToken = String(signPayload.videoUploadToken || '').trim()

  if (!uploadUrl) {
    throw new Error('R2 sign response is missing uploadUrl')
  }
  if (preparation?.isVideo && !videoUploadToken) {
    throw new Error('R2 sign response is missing video upload confirmation token')
  }
  if (!preparation?.isVideo && !signedPublicUrl) {
    throw new Error('R2 sign response is missing publicUrl')
  }

  try {
    await putFileWithProgress({
      uploadUrl,
      file: uploadFile,
      headers: signPayload.headers || {},
      signal,
      onUploadProgress,
    })
    if (preparation?.isVideo) {
      // Do not mint a publishable approval token until the server has re-read the
      // exact uploaded R2 object and matched its SHA-256 + byte size to moderation.
    }
  } catch (error) {
    if (error?.name === 'AbortError' || signal?.aborted || !canUseForumVideoFallback(kind)) {
      throw error
    }
    try {
      console.warn('ql7_forum_video_direct_upload_failed_server_fallback', error)
    } catch {}
    const fallbackResult = await uploadForumVideoViaServer({
      file: uploadFile,
      userId,
      filename: resolvedFilename,
      moderationSurface: resolveModerationSurface(kind, moderationSurface),
      moderationReceipt: videoModeration?.moderationReceipt,
      mediaSha256: videoModeration?.mediaSha256,
      signal,
      onUploadProgress,
    })
    return {
      ...fallbackResult,
      videoApprovalToken: String(fallbackResult?.videoApprovalToken || ''),
      posterUrl: String(posterUpload?.publicUrl || ''),
      poster: posterRecord ? {
        url: String(posterUpload?.publicUrl || ''),
        key: String(posterUpload?.key || ''),
        mime: String(posterRecord?.mime || ''),
        width: Number(posterRecord?.width || 0) || null,
        height: Number(posterRecord?.height || 0) || null,
        timeSec: Number(posterRecord?.timeSec || 0),
        sizeBytes: Number(posterRecord?.sizeBytes || 0) || null,
        policyId: posterRecord?.policyId || null,
      } : null,
      preparation: {
        isVideo: !!preparation?.isVideo,
        optimized: !!preparation?.optimized,
        bypassReason: String(preparation?.bypassReason || ''),
        policyId: preparation?.policyId || null,
        durationSec: Number(preparation?.durationSec) || null,
        width: Number(preparation?.width) || null,
        height: Number(preparation?.height) || null,
        frameRate: Number(preparation?.frameRate) || null,
        profileId: preparation?.profileId || null,
        sourceSizeBytes: Number(preparation?.sourceSizeBytes || file?.size || 0),
        outputSizeBytes: size,
      },
    }
  }

  if (!preparation?.isVideo) {
    return {
      ok: true,
      key: signedKey,
      url: signedPublicUrl,
      publicUrl: signedPublicUrl,
      pathname: signedKey,
      posterUrl: String(posterUpload?.publicUrl || ''),
      poster: posterRecord ? {
        url: String(posterUpload?.publicUrl || ''),
        key: String(posterUpload?.key || ''),
        mime: String(posterRecord?.mime || ''),
        width: Number(posterRecord?.width || 0) || null,
        height: Number(posterRecord?.height || 0) || null,
        timeSec: Number(posterRecord?.timeSec || 0),
        sizeBytes: Number(posterRecord?.sizeBytes || 0) || null,
        policyId: posterRecord?.policyId || null,
      } : null,
      preparation: {
        isVideo: !!preparation?.isVideo,
        optimized: !!preparation?.optimized,
        bypassReason: String(preparation?.bypassReason || ''),
        policyId: preparation?.policyId || null,
        durationSec: Number(preparation?.durationSec) || null,
        width: Number(preparation?.width) || null,
        height: Number(preparation?.height) || null,
        frameRate: Number(preparation?.frameRate) || null,
        profileId: preparation?.profileId || null,
        targetOutputBytes: Number(preparation?.targetOutputBytes) || null,
        sourceSizeBytes: Number(preparation?.sourceSizeBytes || file?.size || 0),
        outputSizeBytes: size,
      },
    }
  }

  const confirmedVideo = await confirmUploadedVideo({ userId, videoUploadToken, signal })
  const finalPublicUrl = confirmedVideo?.publicUrl || ''
  const finalKey = confirmedVideo?.key || ''
  const videoApprovalToken = String(confirmedVideo?.videoApprovalToken || '')

  if (!finalPublicUrl || !finalKey) {
    throw new Error('R2 upload did not produce a sealed public object')
  }

  return {
    ok: true,
    key: finalKey,
    url: finalPublicUrl,
    publicUrl: finalPublicUrl,
    pathname: finalKey,
    videoApprovalToken,
    posterUrl: String(posterUpload?.publicUrl || ''),
    poster: posterRecord ? {
      url: String(posterUpload?.publicUrl || ''),
      key: String(posterUpload?.key || ''),
      mime: String(posterRecord?.mime || ''),
      width: Number(posterRecord?.width || 0) || null,
      height: Number(posterRecord?.height || 0) || null,
      timeSec: Number(posterRecord?.timeSec || 0),
      sizeBytes: Number(posterRecord?.sizeBytes || 0) || null,
      policyId: posterRecord?.policyId || null,
    } : null,
    preparation: {
      isVideo: !!preparation?.isVideo,
      optimized: !!preparation?.optimized,
      bypassReason: String(preparation?.bypassReason || ''),
      policyId: preparation?.policyId || null,
      durationSec: Number(preparation?.durationSec) || null,
      width: Number(preparation?.width) || null,
      height: Number(preparation?.height) || null,
      frameRate: Number(preparation?.frameRate) || null,
      profileId: preparation?.profileId || null,
      targetOutputBytes: Number(preparation?.targetOutputBytes) || null,
      sourceSizeBytes: Number(preparation?.sourceSizeBytes || file?.size || 0),
      outputSizeBytes: size,
    },
  }
}

async function signAndPutMedia({
  file,
  kind,
  userId,
  filename,
  contentType,
  signal,
  onUploadProgress,
}) {
  const size = Number(file?.size || 0)
  if (!file || size <= 0) throw new Error('R2 upload prepared file is empty')

  const signResponse = await fetch('/api/forum/blobUploadUrl', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(userId ? { 'x-forum-user-id': String(userId) } : {}),
    },
    body: JSON.stringify({
      filename,
      name: filename,
      contentType,
      mime: contentType,
      size,
      kind,
      userId,
    }),
    signal,
  })
  const signPayload = await readJsonResponse(signResponse)
  if (!signResponse.ok || !signPayload?.ok) {
    throw new Error(parseUploadErrorPayload(signPayload, `R2 sign failed with HTTP ${signResponse.status}`))
  }
  const uploadUrl = String(signPayload.uploadUrl || '').trim()
  const publicUrl = String(signPayload.publicUrl || signPayload.url || '').trim()
  const key = String(signPayload.key || signPayload.pathname || '').trim()
  if (!uploadUrl || !publicUrl) throw new Error('R2 sign response is missing uploadUrl or publicUrl')
  await putFileWithProgress({ uploadUrl, file, headers: signPayload.headers || {}, signal, onUploadProgress })
  return { key, publicUrl, pathname: key }
}

async function confirmUploadedVideo({ userId = '', videoUploadToken = '', signal } = {}) {
  if (!videoUploadToken) throw new Error('R2 video upload confirmation token is required')
  const response = await fetch('/api/forum/blobUploadUrl', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(userId ? { 'x-forum-user-id': String(userId) } : {}),
    },
    body: JSON.stringify({ action: 'confirmVideoUpload', videoUploadToken }),
    signal,
  })
  const payload = await readJsonResponse(response)
  if (!response.ok || !payload?.ok) {
    throw new Error(parseUploadErrorPayload(payload, `R2 video confirmation failed with HTTP ${response.status}`))
  }
  const approvalToken = String(payload?.videoApprovalToken || '').trim()
  const publicUrl = String(payload?.publicUrl || '').trim()
  const key = String(payload?.key || payload?.pathname || '').trim()
  if (!approvalToken || !publicUrl || !key || payload?.sealed !== true) {
    throw new Error('R2 video confirmation is missing sealed approval proof')
  }
  return { videoApprovalToken: approvalToken, publicUrl, key }
}
