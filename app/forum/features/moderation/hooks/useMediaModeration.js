import { useCallback } from 'react'
import {
  buildModerationFormData,
  ensureModerationResponse,
} from '../utils/http'

export default function useMediaModeration({
  toastI18n,
  fileToJpegBlob,
  extractVideoFrames,
  isStrictModeration,
}) {
  const moderateViaApi = useCallback(async (blobs, meta = {}, opts = {}) => {
    const fd = buildModerationFormData(blobs, meta)
    try {
      const actorId = String(opts?.actorId || '').trim()
      const res = await fetch('/api/forum/moderate', {
        method: 'POST',
        body: fd,
        cache: 'no-store',
        signal: opts?.signal,
        headers: actorId ? { 'x-forum-user-id': actorId } : undefined,
      })
      const j = await res.json().catch(() => null)
      return ensureModerationResponse(res, j)
    } catch (e) {
      throw e
    }
  }, [])

  const moderateImageFiles = useCallback(async (files, opts = {}) => {
    if (!Array.isArray(files) || !files.length) {
      return { decision: 'allow', reason: 'unknown' }
    }

    toastI18n('info', 'forum_moderation_checking')

    const pack = []
    let prepError = null
    for (const f of files.slice(0, 20)) {
      try {
        const jpeg = await fileToJpegBlob(f, { maxWidth: 640, quality: 0.82 })
        pack.push({ blob: jpeg, name: (f.name || 'image').replace(/\.(png|jpe?g|webp|gif)$/i, '.jpg') })
      } catch (e) {
        prepError = e
      }
    }
    if (!pack.length) {
      if (isStrictModeration) throw prepError || new Error('moderation_prepare_failed')
      return { decision: 'allow', reason: 'unknown', raw: { decision: 'allow', fallback: 'prepare_failed' } }
    }

    const r = await moderateViaApi(pack, { source: 'image' }, opts)
    let decision = String(r?.decision || 'allow')
    const reason = String(r?.reason || 'unknown')

    if (isStrictModeration && decision === 'review') decision = 'block'

    return { decision, reason, raw: r }
  }, [toastI18n, fileToJpegBlob, moderateViaApi, isStrictModeration])

  const moderateVideoSource = useCallback(async (videoSource, context = {}) => {
    const surface = String(context?.surface || '').trim().toLowerCase()
    const entityId = String(context?.entityId || '').trim()
    const actorId = String(context?.actorId || '').trim()
    const clientRequestId = String(context?.clientRequestId || `video-mod-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    const mediaUrl = String(context?.mediaUrl || context?.fallbackSource || (typeof videoSource === 'string' ? videoSource : '') || '').trim()
    if (!videoSource || !surface || !entityId || !actorId || !mediaUrl) {
      return { decision: 'pending', reason: 'unknown', status: 'pending', retryable: true, raw: null }
    }

    let lastError = null
    let frames = []
    const sourceCandidates = [videoSource, context?.fallbackSource]
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
    for (let sourceIndex = 0; sourceIndex < sourceCandidates.length && frames.length < 5; sourceIndex += 1) {
      const sourceCandidate = sourceCandidates[sourceIndex]
      for (let attempt = 0; attempt < 2 && frames.length < 5; attempt += 1) {
        try {
          const framesCount = 5 + Math.floor(Math.random() * 6)
          frames = await extractVideoFrames(sourceCandidate, {
            framesCount,
            minGapSec: 0.6,
            excludeHeadTail: 0.05,
            maxWidth: 640,
            quality: 0.82,
          })
        } catch (error) {
          lastError = error
          frames = []
        }
        if (frames.length < 5 && (attempt < 1 || sourceIndex < sourceCandidates.length - 1)) {
          await new Promise((resolve) => setTimeout(resolve, 450 + (attempt * 650)))
        }
      }
    }

    if (frames.length < 5) {
      try { console.warn('[moderation] post-commit video frame extraction pending', lastError || 'insufficient_frames') } catch {}
      return { decision: 'pending', reason: 'unknown', status: 'pending', retryable: true, raw: null }
    }

    const pack = frames.slice(0, 10).map((frame, idx) => ({
      blob: frame.blob,
      name: `frame-${idx + 1}.jpg`,
      timeSec: frame.timeSec,
    }))

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const r = await moderateViaApi(pack, {
          source: 'video_frame_postcommit',
          surface,
          entityId,
          mediaUrl,
          clientRequestId,
        }, { actorId })
        const status = String(r?.videoModeration?.status || '').toLowerCase()
        const decision = String(r?.decision || (status === 'rejected' ? 'block' : 'allow'))
        const reason = String(r?.reason || r?.videoModeration?.reason || 'unknown')
        return {
          decision,
          reason,
          status: status || (decision === 'block' ? 'rejected' : 'approved'),
          lockedUntil: Number(r?.videoModeration?.lockedUntil || 0) || 0,
          deleted: !!r?.videoModeration?.deleted,
          retryable: false,
          raw: r,
        }
      } catch (error) {
        lastError = error
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 + (attempt * 1300)))
      }
    }

    try { console.warn('[moderation] post-commit video moderation pending', lastError) } catch {}
    return { decision: 'pending', reason: 'unknown', status: 'pending', retryable: true, raw: null }
  }, [extractVideoFrames, moderateViaApi])

  return {
    moderateViaApi,
    moderateImageFiles,
    moderateVideoSource,
  }
}
