import { extractVideoFrames } from '../utils/moderationPrep'
import { buildModerationFormData, ensureModerationResponse } from '../../moderation/utils/http'

function createAbortError() {
  const error = new Error('Video moderation aborted')
  error.name = 'AbortError'
  return error
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function sha256Blob(blob) {
  if (!globalThis.crypto?.subtle?.digest) throw new Error('video_moderation_sha256_unavailable')
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))
}

export default async function moderatePreparedVideoForUpload({
  file,
  surface,
  userId,
  signal,
} = {}) {
  if (!(file instanceof Blob) || !Number(file.size || 0)) throw new Error('video_moderation_file_required')
  if (String(file.type || '').split(';')[0].trim().toLowerCase() !== 'video/mp4') throw new Error('video_moderation_requires_final_mp4')
  const cleanSurface = String(surface || '').trim().toLowerCase()
  const actorId = String(userId || '').trim()
  if (!['forum', 'dm', 'ads'].includes(cleanSurface) || !actorId) throw new Error('video_moderation_context_required')
  if (signal?.aborted) throw createAbortError()

  const mediaSha256 = await sha256Blob(file)
  let frames = []
  let lastError = null
  for (let attempt = 0; attempt < 2 && frames.length < 5; attempt += 1) {
    if (signal?.aborted) throw createAbortError()
    try {
      frames = await extractVideoFrames(file, {
        framesCount: 5 + Math.floor(Math.random() * 6),
        minGapSec: 0.6,
        excludeHeadTail: 0.05,
        maxWidth: 640,
        quality: 0.82,
      })
    } catch (error) {
      lastError = error
      frames = []
    }
    if (frames.length < 5 && attempt < 1) await new Promise((resolve) => setTimeout(resolve, 350))
  }
  if (frames.length < 5) throw lastError || new Error('video_moderation_insufficient_frames')

  const pack = frames.slice(0, 10).map((frame, index) => ({
    blob: frame.blob,
    name: `frame-${index + 1}.jpg`,
  }))
  const clientRequestId = `video-precommit-${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastNetworkError = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (signal?.aborted) throw createAbortError()
    try {
      const form = buildModerationFormData(pack, {
        source: 'video_frame_precommit',
        surface: cleanSurface,
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
        headers: { 'x-forum-user-id': actorId },
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
      return {
        status: 'approved',
        reason: String(checked?.reason || 'unknown'),
        mediaSha256,
        mediaSize: Number(file.size),
        moderationReceipt,
      }
    } catch (error) {
      if (error?.code === 'VIDEO_MODERATION_REJECTED' || error?.name === 'AbortError') throw error
      lastNetworkError = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 550 + (attempt * 850)))
    }
  }
  throw lastNetworkError || new Error('video_moderation_failed')
}
