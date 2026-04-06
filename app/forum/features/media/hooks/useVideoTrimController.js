import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampTrimNum,
  readVideoDurationSec,
  trimVideoBlobNative,
} from '../utils/mediaRuntime'

const createClosedVideoLimitOverlay = () => ({
  open: false,
  durationSec: null,
  source: '',
  reason: '',
})

const createClosedVideoTrimPopover = () => ({
  open: false,
  source: '',
  blob: null,
  name: '',
  mime: '',
  durationSec: 0,
  startSec: 0,
  processing: false,
  processPct: 0,
  errorCode: '',
})

export default function useVideoTrimController({
  emitDiag,
  forumVideoMaxSeconds,
  pendingVideo,
  setPendingVideo,
  pendingVideoRef,
  pendingVideoBlobMetaRef,
  pendingVideoInfoRef,
  setOverlayMediaKind,
  setOverlayMediaUrl,
  setVideoOpen,
  setVideoState,
  saveComposerScroll,
  restoreComposerScroll,
}) {
  const [videoLimitOverlay, setVideoLimitOverlay] = useState(createClosedVideoLimitOverlay)
  const [videoTrimPopover, setVideoTrimPopover] = useState(createClosedVideoTrimPopover)

  const videoTrimPopoverRef = useRef(null)
  const videoTrimAbortRef = useRef(null)

  useEffect(() => {
    videoTrimPopoverRef.current = videoTrimPopover
  }, [videoTrimPopover])

  const closeVideoLimitOverlay = useCallback(() => {
    setVideoLimitOverlay(createClosedVideoLimitOverlay())
  }, [])

  const closeVideoTrimPopover = useCallback(() => {
    try { videoTrimAbortRef.current?.abort?.() } catch {}
    setVideoTrimPopover(() => {
      const next = createClosedVideoTrimPopover()
      try { videoTrimPopoverRef.current = next } catch {}
      return next
    })
  }, [])

  const openVideoTrimPopover = useCallback((payload = {}) => {
    const blob = payload?.blob || payload?.file || null
    if (!blob) return false
    const durationSec = Number(payload?.durationSec || 0)
    const normalizedDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0
    try { setVideoLimitOverlay(createClosedVideoLimitOverlay()) } catch {}
    try { videoTrimAbortRef.current = null } catch {}
    const next = {
      open: true,
      source: String(payload?.source || ''),
      blob,
      name: String(payload?.name || blob?.name || ''),
      mime: String(payload?.mime || blob?.type || ''),
      durationSec: normalizedDuration,
      startSec: 0,
      processing: false,
      processPct: 0,
      errorCode: '',
    }
    try { videoTrimPopoverRef.current = next } catch {}
    setVideoTrimPopover(next)
    try {
      emitDiag?.('video_trim_open', {
        source: String(payload?.source || ''),
        durationSec: normalizedDuration || null,
        maxSec: forumVideoMaxSeconds,
        size: Number(blob?.size || 0) || null,
      })
    } catch {}
    return true
  }, [emitDiag, forumVideoMaxSeconds])

  const showVideoLimitOverlay = useCallback((payload = {}) => {
    const durationSec = Number(payload?.durationSec)
    const reason = String(
      payload?.reason || (
        Number.isFinite(durationSec) && durationSec > forumVideoMaxSeconds ? 'too_long' : 'bad_duration'
      )
    )
    setVideoLimitOverlay({
      open: true,
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      source: String(payload?.source || ''),
      reason,
    })
    try {
      emitDiag?.('video_limit_reject', {
        source: String(payload?.source || ''),
        reason,
        durationSec: Number.isFinite(durationSec) ? Math.round(durationSec * 100) / 100 : null,
        maxSec: forumVideoMaxSeconds,
      })
    } catch {}
  }, [emitDiag, forumVideoMaxSeconds])

  const setVideoTrimStartSec = useCallback((nextSec) => {
    setVideoTrimPopover((prev) => {
      if (!prev?.open || prev?.processing) return prev
      const total = Math.max(0, Number(prev.durationSec || 0))
      const maxStart = Math.max(0, total - forumVideoMaxSeconds)
      const next = { ...prev, startSec: clampTrimNum(nextSec, 0, maxStart), errorCode: '' }
      try { videoTrimPopoverRef.current = next } catch {}
      return next
    })
  }, [forumVideoMaxSeconds])

  const applyVideoTrimPopover = useCallback(async () => {
    const snap = videoTrimPopoverRef.current || videoTrimPopover
    if (!snap?.open || snap?.processing || !snap?.blob) return
    const srcBlob = snap.blob
    const totalDur = Number(snap.durationSec || 0)
    const startSec = clampTrimNum(snap.startSec, 0, Math.max(0, totalDur - forumVideoMaxSeconds))
    const abortCtl = (typeof AbortController !== 'undefined') ? new AbortController() : null
    try { videoTrimAbortRef.current = abortCtl } catch {}
    setVideoTrimPopover((prev) => ({ ...prev, processing: true, processPct: 0.02, errorCode: '' }))

    try {
      try { saveComposerScroll?.() } catch {}
      try {
        emitDiag?.('video_trim_begin', {
          source: String(snap.source || ''),
          startSec: Math.round(startSec * 100) / 100,
          durationSec: Number.isFinite(totalDur) ? Math.round(totalDur * 100) / 100 : null,
          maxSec: forumVideoMaxSeconds,
        })
      } catch {}

      const out = await trimVideoBlobNative(srcBlob, {
        startSec,
        maxDurationSec: forumVideoMaxSeconds,
        signal: abortCtl?.signal,
        onProgress: (progressValue) => {
          setVideoTrimPopover((prev) => (prev?.open ? ({
            ...prev,
            processPct: Math.max(0.02, Math.min(0.96, Number(progressValue || 0))),
          }) : prev))
        },
      })

      const outBlob = out?.blob
      if (!outBlob || !Number(outBlob?.size || 0)) throw new Error('trim_empty')
      const finalBlob = outBlob
      const finalSource = 'trimmed_local'
      let outDur = Number(out?.durationSec || 0)
      if (!Number.isFinite(outDur) || outDur <= 0) {
        try { outDur = await readVideoDurationSec(outBlob) } catch {}
      }

      if (!Number.isFinite(outDur) || outDur <= 0 || outDur > (forumVideoMaxSeconds + 0.35)) {
        throw new Error('trim_bad_duration')
      }

      const outUrl = URL.createObjectURL(finalBlob)
      try {
        const prev = pendingVideo
        if (prev && /^blob:/.test(prev)) {
          try { pendingVideoBlobMetaRef.current?.delete?.(String(prev)) } catch {}
          URL.revokeObjectURL(prev)
        }
      } catch {}

      try { pendingVideoRef.current = outUrl } catch {}
      setPendingVideo(outUrl)
      try {
        const map = pendingVideoBlobMetaRef.current
        if (map && typeof map.set === 'function' && /^blob:/.test(String(outUrl || ''))) {
          map.set(String(outUrl), {
            source: finalSource,
            durationSec: Math.min(forumVideoMaxSeconds, Math.max(0.1, Number(outDur || 0))),
          })
          if (map.size > 32) {
            const first = map.keys().next()?.value
            if (first) map.delete(first)
          }
        }
      } catch {}
      try {
        pendingVideoInfoRef.current = {
          source: finalSource,
          durationSec: Math.min(forumVideoMaxSeconds, Math.max(0.1, Number(outDur || 0))),
        }
      } catch {}
      try { setOverlayMediaKind?.('video') } catch {}
      try { setOverlayMediaUrl?.(null) } catch {}
      try { setVideoOpen?.(true) } catch {}
      try { setVideoState?.('preview') } catch {}
      setVideoTrimPopover(createClosedVideoTrimPopover())
      try {
        emitDiag?.('video_trim_done', {
          source: String(snap.source || ''),
          outputSec: Number.isFinite(outDur) ? Math.round(outDur * 100) / 100 : null,
          startSec: Math.round(startSec * 100) / 100,
        })
      } catch {}
      try { restoreComposerScroll?.() } catch {}
    } catch (error) {
      const message = String(error?.message || '')
      const aborted = message.includes('aborted')
      const code = message.includes('unsupported')
        ? 'trim_unsupported'
        : (aborted ? 'trim_aborted' : 'trim_failed')

      if (aborted) {
        setVideoTrimPopover((prev) => (prev?.open ? createClosedVideoTrimPopover() : prev))
        try { restoreComposerScroll?.() } catch {}
      } else {
        setVideoTrimPopover((prev) => (
          prev?.open
            ? { ...prev, processing: false, processPct: 0, errorCode: code }
            : prev
        ))
      }

      try {
        emitDiag?.('video_trim_fail', {
          source: String(snap?.source || ''),
          code,
          message: String(error?.message || 'unknown'),
        })
      } catch {}
    } finally {
      if (videoTrimAbortRef.current === abortCtl) {
        try { videoTrimAbortRef.current = null } catch {}
      }
    }
  }, [
    videoTrimPopover,
    forumVideoMaxSeconds,
    saveComposerScroll,
    restoreComposerScroll,
    emitDiag,
    pendingVideo,
    setPendingVideo,
    pendingVideoRef,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoOpen,
    setVideoState,
  ])

  return {
    videoLimitOverlay,
    closeVideoLimitOverlay,
    showVideoLimitOverlay,
    videoTrimPopover,
    closeVideoTrimPopover,
    openVideoTrimPopover,
    setVideoTrimStartSec,
    applyVideoTrimPopover,
  }
}
