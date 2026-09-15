import {
  createNativeVideoPosterFromCanvas,
  QL7_NATIVE_VIDEO_POSTER_MAX_EDGE,
  resolveNativeVideoPosterTime,
} from '../../../../../lib/nativeVideoPoster'
import { buildModerationFormData, ensureModerationResponse } from '../../moderation/utils/http'

const PREPARED_VIDEO_ARTIFACTS = new WeakMap()
let mediabunnyPromise = null
const VIDEO_PRECOMMIT_REQUEST_POLICY = 'single-attempt-user-retry-v1'

function createAbortError() {
  const error = new Error('Video moderation aborted')
  error.name = 'AbortError'
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError()
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function sha256Blob(blob) {
  if (!globalThis.crypto?.subtle?.digest) throw new Error('video_moderation_sha256_unavailable')
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))
}

function normalizeContext({ surface, userId, mirrorX = false } = {}) {
  const cleanSurface = String(surface || '').trim().toLowerCase()
  const actorId = String(userId || '').trim()
  if (!['forum', 'dm', 'ads'].includes(cleanSurface) || !actorId) throw new Error('video_moderation_context_required')
  return { surface: cleanSurface, userId: actorId, mirrorX: !!mirrorX }
}

function contextKey(context) {
  return `${context.surface}\u0000${context.userId}\u0000${context.mirrorX ? 1 : 0}`
}

export function getPreparedVideoArtifacts(file, context = {}) {
  if (!(file instanceof Blob)) return null
  let normalized
  try { normalized = normalizeContext(context) } catch { return null }
  const record = PREPARED_VIDEO_ARTIFACTS.get(file)?.get(contextKey(normalized)) || null
  if (!record) return null
  if (record.file !== file || Number(record.mediaSize || 0) !== Number(file.size || 0)) return null
  return record
}

function storePreparedVideoArtifacts(file, context, record) {
  let perFile = PREPARED_VIDEO_ARTIFACTS.get(file)
  if (!perFile) {
    perFile = new Map()
    PREPARED_VIDEO_ARTIFACTS.set(file, perFile)
  }
  perFile.set(contextKey(context), record)
}

async function loadMediabunny() {
  if (!mediabunnyPromise) mediabunnyPromise = import('mediabunny')
  return mediabunnyPromise
}

function createSamplingTimestamps(startTimestamp, endTimestamp, count = 8) {
  const start = Math.max(0, Number(startTimestamp || 0))
  const end = Number(endTimestamp || 0)
  const span = end - start
  if (!Number.isFinite(span) || span <= 0) throw new Error('video_metadata_unavailable')
  const n = Math.max(5, Math.min(10, Math.round(Number(count || 8))))
  return Array.from({ length: n }, (_, index) => {
    const ratio = n === 1 ? 0.5 : 0.05 + (0.9 * index) / (n - 1)
    return start + span * ratio
  })
}

function canvasToJpeg(canvas, { maxWidth = 640, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    try {
      const sourceWidth = Math.max(1, Number(canvas?.width || 0))
      const sourceHeight = Math.max(1, Number(canvas?.height || 0))
      const scale = Math.min(1, Math.max(1, Number(maxWidth || 640)) / sourceWidth)
      const target = document.createElement('canvas')
      target.width = Math.max(1, Math.round(sourceWidth * scale))
      target.height = Math.max(1, Math.round(sourceHeight * scale))
      const ctx = target.getContext('2d', { alpha: false })
      if (!ctx) return resolve(null)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, target.width, target.height)
      ctx.drawImage(canvas, 0, 0, target.width, target.height)
      target.toBlob((blob) => resolve(blob?.size ? blob : null), 'image/jpeg', quality)
    } catch {
      resolve(null)
    }
  })
}

function emitProgress(onProgress, event) {
  try { onProgress?.(event) } catch {}
}

export async function preparePreparedVideoArtifacts({
  file,
  surface,
  userId,
  signal,
  mirrorX = false,
  sourceName = '',
  onProgress,
} = {}) {
  if (!(file instanceof Blob) || !Number(file.size || 0)) throw new Error('video_moderation_file_required')
  if (String(file.type || '').split(';')[0].trim().toLowerCase() !== 'video/mp4') throw new Error('video_moderation_requires_final_mp4')
  if (typeof document === 'undefined') throw new Error('video_moderation_canvas_unavailable')
  const context = normalizeContext({ surface, userId, mirrorX })
  const cached = getPreparedVideoArtifacts(file, context)
  if (cached) return cached
  throwIfAborted(signal)

  emitProgress(onProgress, { stage: 'sampling', progress: 0 })
  const mediabunny = await loadMediabunny()
  const input = new mediabunny.Input({
    formats: mediabunny.ALL_FORMATS,
    source: new mediabunny.BlobSource(file),
  })
  const disposeOnAbort = () => {
    try { input.dispose() } catch {}
  }
  try { signal?.addEventListener?.('abort', disposeOnAbort, { once: true }) } catch {}

  const frames = []
  const seenFrameTimestamps = new Set()
  let poster = null
  let posterFallbackCanvas = null
  let posterFallbackTimestamp = 0
  let durationSec = 0
  let displayWidth = 0
  let displayHeight = 0
  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack || !(await videoTrack.canDecode())) throw new Error('video_moderation_decoder_unavailable')

    const rawDisplayWidth = Number(await videoTrack.getDisplayWidth())
    const rawDisplayHeight = Number(await videoTrack.getDisplayHeight())
    if (!Number.isFinite(rawDisplayWidth) || rawDisplayWidth <= 0 || !Number.isFinite(rawDisplayHeight) || rawDisplayHeight <= 0) {
      throw new Error('video_metadata_unavailable')
    }
    displayWidth = Math.max(1, rawDisplayWidth)
    displayHeight = Math.max(1, rawDisplayHeight)
    const firstTimestamp = Number(await videoTrack.getFirstTimestamp())
    const endTimestamp = Number(await videoTrack.computeDuration())
    const visibleStart = Math.max(0, Number.isFinite(firstTimestamp) ? firstTimestamp : 0)
    durationSec = endTimestamp - visibleStart
    if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('video_metadata_unavailable')

    const moderationTimestamps = createSamplingTimestamps(visibleStart, endTimestamp, 8)
    const posterTimestamp = Math.min(endTimestamp - Math.min(0.001, durationSec / 1000), visibleStart + resolveNativeVideoPosterTime(durationSec))
    const requests = [
      ...moderationTimestamps.map((timestamp) => ({ timestamp, moderation: true, poster: false })),
      { timestamp: Math.max(visibleStart, posterTimestamp), moderation: false, poster: true },
    ].sort((a, b) => a.timestamp - b.timestamp)

    const sinkOptions = { alpha: false }
    if (displayWidth >= displayHeight) sinkOptions.width = Math.min(QL7_NATIVE_VIDEO_POSTER_MAX_EDGE, displayWidth)
    else sinkOptions.height = Math.min(QL7_NATIVE_VIDEO_POSTER_MAX_EDGE, displayHeight)
    const sink = new mediabunny.CanvasSink(videoTrack, sinkOptions)

    let index = 0
    for await (const result of sink.canvasesAtTimestamps(requests.map((request) => request.timestamp))) {
      throwIfAborted(signal)
      const request = requests[index++]
      if (!result?.canvas) continue
      const resultTimestamp = Number(result.timestamp)
      const frameKey = Number.isFinite(resultTimestamp) ? Math.round(resultTimestamp * 1000) : null

      if (request?.moderation && (frameKey == null || !seenFrameTimestamps.has(frameKey))) {
        const blob = await canvasToJpeg(result.canvas, { maxWidth: 640, quality: 0.82 })
        if (blob?.size) {
          if (frameKey != null) seenFrameTimestamps.add(frameKey)
          frames.push({ blob, timestamp: resultTimestamp })
        }
      }

      if (!posterFallbackCanvas) {
        posterFallbackCanvas = result.canvas
        posterFallbackTimestamp = resultTimestamp
      }
      if (request?.poster) {
        poster = await createNativeVideoPosterFromCanvas({
          canvas: result.canvas,
          sourceName: sourceName || file?.name || 'video.mp4',
          timeSec: resultTimestamp,
          durationSec,
          mirrorX: context.mirrorX,
        })
      }
      emitProgress(onProgress, { stage: 'sampling', progress: Math.min(1, index / requests.length) })
    }
    if (!poster && posterFallbackCanvas) {
      poster = await createNativeVideoPosterFromCanvas({
        canvas: posterFallbackCanvas,
        sourceName: sourceName || file?.name || 'video.mp4',
        timeSec: posterFallbackTimestamp,
        durationSec,
        mirrorX: context.mirrorX,
      })
    }
  } catch (error) {
    if (signal?.aborted) throw createAbortError()
    throw error
  } finally {
    try { signal?.removeEventListener?.('abort', disposeOnAbort) } catch {}
    try { input.dispose?.() } catch {}
  }

  if (frames.length < 5) throw new Error('video_moderation_insufficient_frames')
  if (!(poster?.blob instanceof Blob) || !poster.blob.size) throw new Error('video_poster_missing_from_sample_session')

  throwIfAborted(signal)
  emitProgress(onProgress, { stage: 'moderating', progress: 0 })
  const mediaSha256 = await sha256Blob(file)
  const pack = frames.slice(0, 10).map((frame, frameIndex) => ({
    blob: frame.blob,
    name: `frame-${frameIndex + 1}.jpg`,
  }))
  const clientRequestId = `video-precommit-${Date.now()}-${Math.random().toString(36).slice(2)}`
  // A precommit request can consume tens of seconds of CPU. Retrying the same
  // frames automatically after an ambiguous network/response failure can execute
  // the model three times because this contour has no durable terminal entity yet.
  // Keep it fail-closed and let an explicit user retry create the next attempt.
  void VIDEO_PRECOMMIT_REQUEST_POLICY
  throwIfAborted(signal)
  const form = buildModerationFormData(pack, {
    source: 'video_frame_precommit',
    surface: context.surface,
    clientRequestId,
  })
  form.append('mediaSha256', mediaSha256)
  form.append('mediaSize', String(file.size))
  form.append('mediaMime', 'video/mp4')
  const response = await fetch('/api/forum/moderate', {
    method: 'POST',
    body: form,
    cache: 'no-store',
    signal,
    headers: { 'x-forum-user-id': context.userId },
  })
  const json = await response.json().catch(() => null)
  const checked = ensureModerationResponse(response, json)
  const status = String(checked?.videoModeration?.status || '').trim().toLowerCase()
  if (status === 'rejected') {
    const error = new Error(`video_moderation_rejected:${String(checked?.reason || 'unknown')}`)
    error.code = 'VIDEO_MODERATION_REJECTED'
    error.reason = String(checked?.reason || 'unknown')
    error.lockedUntil = Number(checked?.videoModeration?.lockedUntil || 0) || 0
    throw error
  }
  const moderationReceipt = String(checked?.moderationReceipt || '').trim()
  if (status !== 'approved' || !moderationReceipt) throw new Error('video_moderation_approval_missing')
  const record = Object.freeze({
    file,
    status: 'approved',
    reason: String(checked?.reason || 'unknown'),
    mediaSha256,
    mediaSize: Number(file.size),
    moderationReceipt,
    poster,
    frameCount: pack.length,
    durationSec,
    width: displayWidth,
    height: displayHeight,
    surface: context.surface,
    userId: context.userId,
    mirrorX: context.mirrorX,
    sampleSession: 'mediabunny-canvas-sink-monotonic-v1',
  })
  storePreparedVideoArtifacts(file, context, record)
  emitProgress(onProgress, { stage: 'moderating', progress: 1 })
  emitProgress(onProgress, { stage: 'moderated', progress: 1 })
  return record
}

export default async function moderatePreparedVideoForUpload(options = {}) {
  const record = await preparePreparedVideoArtifacts(options)
  return {
    status: record.status,
    reason: record.reason,
    mediaSha256: record.mediaSha256,
    mediaSize: record.mediaSize,
    moderationReceipt: record.moderationReceipt,
  }
}
