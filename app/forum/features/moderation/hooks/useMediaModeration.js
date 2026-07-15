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
      const res = await fetch('/api/forum/moderate', {
        method: 'POST',
        body: fd,
        cache: 'no-store',
        signal: opts?.signal,
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

  const moderateVideoSource = useCallback(async (videoSource) => {
    toastI18n('info', 'forum_moderation_checking')

    let frames = []
    try {
      frames = await extractVideoFrames(videoSource, {
        framesCount: 14,
        minGapSec: 0.6,
        excludeHeadTail: 0.05,
        maxWidth: 640,
        quality: 0.82,
      })
    } catch {
      frames = []
    }

    if (!frames.length) {
      if (isStrictModeration) {
        return { decision: 'block', reason: 'unknown', raw: null, hard: true }
      }
      try {
        console.warn('[moderation] video frames extraction failed -> allow (balanced)')
      } catch {}
      return { decision: 'allow', reason: 'unknown', raw: null, hard: false }
    }

    const pack = frames.slice(0, 20).map((f, idx) => ({
      blob: f.blob,
      name: `frame-${idx + 1}.jpg`,
      timeSec: f.timeSec,
    }))

    const r = await moderateViaApi(pack, { source: 'video_frame' })

    let decision = String(r?.decision || 'allow')
    const reason = String(r?.reason || 'unknown')
    if (isStrictModeration && decision === 'review') decision = 'block'

    return { decision, reason, raw: r }
  }, [toastI18n, extractVideoFrames, moderateViaApi, isStrictModeration])

  return {
    moderateViaApi,
    moderateImageFiles,
    moderateVideoSource,
  }
}
