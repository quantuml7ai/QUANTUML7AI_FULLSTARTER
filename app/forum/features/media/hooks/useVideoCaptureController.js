import { useCallback, useEffect, useRef } from 'react'

export default function useVideoCaptureController({
  videoState,
  setVideoState,
  setVideoOpen,
  setVideoElapsed,
  videoElapsedRef,
  videoTimerRef,
  videoRecordStartedAtRef,
  videoStreamRef,
  videoRecRef,
  videoChunksRef,
  videoStopRequestedRef,
  videoAutoStopAtLimitRef,
  videoCancelRef,
  videoMirrorRef,
  pendingVideo,
  setPendingVideo,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  forumVideoMaxSeconds,
  forumVideoCameraRecordEpsilonSec,
  saveComposerScroll,
  restoreComposerScroll,
  readVideoDurationSecFn,
  createUnmirroredFrontStreamFn,
  emitDiag,
  showVideoLimitOverlay,
  toast,
  t,
  setVideoProgress,
  stopMediaProg,
  setMediaPipelineOn,
  mediaCancelRef,
  mediaAbortRef,
  clearMediaAbortController,
  setMediaBarOn,
  setMediaPhase,
  setMediaPct,
  setPendingImgs,
  pendingAudio,
  setPendingAudio,
  setOverlayMediaUrl,
  setOverlayMediaKind,
  overlayMediaKind,
  hasComposerMedia,
  setComposerActive,
}) {
  const stopVideoRef = useRef(null)

  const stopVideo = useCallback((opts = {}) => {
    const auto = !!opts?.auto
    if (videoStopRequestedRef.current) return
    const rec = videoRecRef.current
    const isActive = !!rec && (rec.state === 'recording' || rec.state === 'paused')
    if (!isActive) return
    videoStopRequestedRef.current = true
    try { videoAutoStopAtLimitRef.current = auto } catch {}
    setVideoState('processing')
    try { rec.requestData?.() } catch {}
    try { rec.stop?.() } catch {
      try { setVideoState('idle') } catch {}
      try { videoStopRequestedRef.current = false } catch {}
      try { videoAutoStopAtLimitRef.current = false } catch {}
    }
    clearInterval(videoTimerRef.current)
    videoTimerRef.current = null
  }, [
    setVideoState,
    videoAutoStopAtLimitRef,
    videoRecRef,
    videoStopRequestedRef,
    videoTimerRef,
  ])

  useEffect(() => {
    stopVideoRef.current = stopVideo
  }, [stopVideo])

  const startVideo = useCallback(async () => {
    const badStates = new Set(['opening', 'recording', 'processing', 'uploading'])
    if (badStates.has(videoState)) return

    try {
      try { videoAutoStopAtLimitRef.current = false } catch {}
      try { saveComposerScroll() } catch {}
      setVideoOpen(true)
      setVideoState('opening')

      let baseStream = videoStreamRef.current
      const hasTracks = !!baseStream && (baseStream.getTracks?.().length || 0) > 0

      try { videoCancelRef.current = false } catch {}
      try { videoStopRequestedRef.current = false } catch {}
      if (!hasTracks) {
        baseStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: { ideal: 'user' } },
          audio: true,
        })
        videoStreamRef.current = baseStream
      }

      try {
        if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror()
      } catch {}
      videoMirrorRef.current = null

      const mime = MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const vTrack = baseStream.getVideoTracks?.()[0] || null
      const aTracks = (baseStream.getAudioTracks?.() || []).filter((track) => track.readyState === 'live')

      let recStream = baseStream
      if (vTrack) {
        const settings = vTrack.getSettings?.() || {}
        const facing = String(settings.facingMode || '').toLowerCase()
        const isFront =
          facing.includes('user') ||
          facing.includes('front') ||
          facing.includes('face')

        if (isFront) {
          const mirrorStream = await createUnmirroredFrontStreamFn(baseStream)
          const fixedTrack = mirrorStream?.getVideoTracks?.()[0] || null
          if (mirrorStream && fixedTrack) {
            recStream = new MediaStream([
              ...aTracks,
              fixedTrack,
            ])
            videoMirrorRef.current = mirrorStream
          }
        }
      }

      const mediaRecorder = new MediaRecorder(recStream, { mimeType: mime })
      videoChunksRef.current = []

      mediaRecorder.ondataavailable = (evt) => {
        if (evt?.data?.size) videoChunksRef.current.push(evt.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(videoTimerRef.current)
        videoTimerRef.current = null
        try { videoRecRef.current = null } catch {}
        try { videoStopRequestedRef.current = false } catch {}
        const recordStartedAt = Number(videoRecordStartedAtRef.current || 0)
        try { videoRecordStartedAtRef.current = 0 } catch {}
        const autoStoppedAtLimit = !!videoAutoStopAtLimitRef.current
        try { videoAutoStopAtLimitRef.current = false } catch {}

        try {
          if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror()
        } catch {}
        videoMirrorRef.current = null
        try { videoStreamRef.current?.getTracks?.().forEach((track) => track.stop()) } catch {}
        try { videoStreamRef.current = null } catch {}

        try {
          if (videoCancelRef.current) {
            videoChunksRef.current = []
            try {
              if (pendingVideo && /^blob:/.test(pendingVideo)) {
                try { pendingVideoBlobMetaRef.current?.delete?.(String(pendingVideo)) } catch {}
                URL.revokeObjectURL(pendingVideo)
              }
            } catch {}
            setPendingVideo(null)
            try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
            setVideoState('idle')
            videoCancelRef.current = false
            return
          }

          const blob = new Blob(videoChunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' })
          videoChunksRef.current = []
          let recordedDurationSec = NaN
          try {
            recordedDurationSec = await readVideoDurationSecFn(blob)
          } catch {}

          if (!Number.isFinite(recordedDurationSec) || recordedDurationSec <= 0) {
            const elapsedByStart = recordStartedAt
              ? Math.max(0.1, Math.min(
                  forumVideoMaxSeconds,
                  (Date.now() - recordStartedAt) / 1000
                ))
              : NaN
            const elapsedByState = Math.max(0, Number(videoElapsedRef.current || 0))
            const derived =
              (autoStoppedAtLimit ? forumVideoMaxSeconds : NaN)
              || (Number.isFinite(elapsedByStart) && elapsedByStart > 0 ? elapsedByStart : NaN)
              || (Number.isFinite(elapsedByState) && elapsedByState > 0 ? elapsedByState : NaN)

            if (Number.isFinite(derived) && derived > 0) {
              recordedDurationSec = Math.max(0.1, Math.min(forumVideoMaxSeconds, derived))
            } else {
              recordedDurationSec = forumVideoMaxSeconds
            }
            try {
              emitDiag?.('camera_record_duration_fallback', {
                source: autoStoppedAtLimit ? 'auto_limit' : 'timer',
                durationSec: Math.round(recordedDurationSec * 100) / 100,
              })
            } catch {}
          }

          if (recordedDurationSec > (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec)) {
            try {
              setVideoOpen(false)
              setVideoState('idle')
              showVideoLimitOverlay?.({
                source: 'camera_record',
                durationSec: recordedDurationSec,
                reason: 'too_long',
              })
            } catch {}
            videoChunksRef.current = []
            try {
              if (pendingVideo && /^blob:/.test(pendingVideo)) {
                try { pendingVideoBlobMetaRef.current?.delete?.(String(pendingVideo)) } catch {}
                URL.revokeObjectURL(pendingVideo)
              }
            } catch {}
            setPendingVideo(null)
            try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
            try { restoreComposerScroll() } catch {}
            return
          }

          const url = URL.createObjectURL(blob)
          try {
            const prev = pendingVideo
            if (prev && /^blob:/.test(prev)) {
              try { pendingVideoBlobMetaRef.current?.delete?.(String(prev)) } catch {}
              URL.revokeObjectURL(prev)
            }
          } catch {}

          setPendingVideo(url)
          try {
            const map = pendingVideoBlobMetaRef.current
            if (map && typeof map.set === 'function' && /^blob:/.test(String(url || ''))) {
              map.set(String(url), {
                source: 'camera_record',
                durationSec: Math.min(forumVideoMaxSeconds, Math.max(0.1, Number(recordedDurationSec || 0))),
              })
              if (map.size > 32) {
                const first = map.keys().next()?.value
                if (first) map.delete(first)
              }
            }
          } catch {}
          try { pendingVideoInfoRef.current = { source: 'camera_record', durationSec: recordedDurationSec } } catch {}
          setVideoState('preview')
          try { restoreComposerScroll() } catch {}
        } catch {
          try { videoChunksRef.current = [] } catch {}
          setVideoState('idle')
        }
      }

      videoRecRef.current = mediaRecorder
      mediaRecorder.start(250)

      setVideoState('recording')
      setVideoElapsed(0)

      const started = Date.now()
      try { videoRecordStartedAtRef.current = started } catch {}
      clearInterval(videoTimerRef.current)
      videoTimerRef.current = setInterval(() => {
        const elapsedMs = Math.max(0, Date.now() - started)
        const sec = Math.floor(elapsedMs / 1000)
        setVideoElapsed(Math.min(forumVideoMaxSeconds, sec))
        if (elapsedMs >= ((forumVideoMaxSeconds * 1000) - 750)) {
          try { setVideoElapsed(forumVideoMaxSeconds) } catch {}
          try { stopVideoRef.current?.({ auto: true }) } catch {}
        }
      }, 200)
    } catch {
      setVideoState('idle')
      setVideoOpen(false)
      try { toast?.warn?.(t?.('forum_camera_denied')) } catch {}
    }
  }, [
    createUnmirroredFrontStreamFn,
    emitDiag,
    forumVideoCameraRecordEpsilonSec,
    forumVideoMaxSeconds,
    pendingVideo,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    readVideoDurationSecFn,
    restoreComposerScroll,
    saveComposerScroll,
    setPendingVideo,
    setVideoElapsed,
    setVideoOpen,
    setVideoState,
    showVideoLimitOverlay,
    t,
    toast,
    videoAutoStopAtLimitRef,
    videoCancelRef,
    videoChunksRef,
    videoElapsedRef,
    videoMirrorRef,
    videoRecRef,
    videoRecordStartedAtRef,
    videoState,
    videoStopRequestedRef,
    videoStreamRef,
    videoTimerRef,
  ])

  const resetVideo = useCallback(() => {
    const rec = videoRecRef.current
    const isActive = !!rec && (rec.state === 'recording' || rec.state === 'paused')

    if (isActive) {
      try { videoCancelRef.current = true } catch {}
      try { videoStopRequestedRef.current = true } catch {}
      try { rec.stop() } catch {}
    } else {
      try { videoCancelRef.current = false } catch {}
      try { videoStopRequestedRef.current = false } catch {}
    }

    try { videoStreamRef.current?.getTracks?.().forEach((track) => track.stop()) } catch {}
    try {
      if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror()
    } catch {}
    videoRecRef.current = null
    videoStreamRef.current = null
    videoMirrorRef.current = null
    try { videoStopRequestedRef.current = false } catch {}
    try { videoAutoStopAtLimitRef.current = false } catch {}
    try { videoRecordStartedAtRef.current = 0 } catch {}
    if (pendingVideo && /^blob:/.test(pendingVideo)) {
      try { pendingVideoBlobMetaRef.current?.delete?.(String(pendingVideo)) } catch {}
      try { URL.revokeObjectURL(pendingVideo) } catch {}
    }

    setPendingVideo(null)
    try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
    setVideoOpen(false)
    setVideoState('idle')
    setVideoElapsed(0)
    try { setVideoProgress(0) } catch {}
    try { restoreComposerScroll() } catch {}

    try { stopMediaProg() } catch {}
    try { setMediaPipelineOn(false) } catch {}
  }, [
    pendingVideo,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    restoreComposerScroll,
    setPendingVideo,
    setMediaPipelineOn,
    setVideoElapsed,
    setVideoOpen,
    setVideoProgress,
    setVideoState,
    stopMediaProg,
    videoAutoStopAtLimitRef,
    videoCancelRef,
    videoMirrorRef,
    videoRecRef,
    videoRecordStartedAtRef,
    videoStopRequestedRef,
    videoStreamRef,
  ])

  const cancelMediaOperation = useCallback(() => {
    try { mediaCancelRef.current = true } catch {}
    try { mediaAbortRef.current?.abort?.() } catch {}
    try { clearMediaAbortController?.() } catch {}

    try { stopMediaProg?.() } catch {}
    try { setMediaPipelineOn(false) } catch {}
    try { setMediaBarOn(false) } catch {}
    try { setMediaPhase('idle') } catch {}
    try { setMediaPct(0) } catch {}
    try { setVideoProgress(0) } catch {}

    try { setPendingImgs([]) } catch {}
    try {
      if (pendingAudio && /^blob:/.test(pendingAudio)) URL.revokeObjectURL(pendingAudio)
    } catch {}
    try { setPendingAudio(null) } catch {}
    try { resetVideo() } catch {}

    try { setVideoOpen(false) } catch {}
    try { setOverlayMediaUrl(null) } catch {}
    try { setOverlayMediaKind('video') } catch {}
  }, [
    clearMediaAbortController,
    mediaAbortRef,
    mediaCancelRef,
    pendingAudio,
    resetVideo,
    setMediaBarOn,
    setMediaPct,
    setMediaPhase,
    setMediaPipelineOn,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setPendingAudio,
    setPendingImgs,
    setVideoOpen,
    setVideoProgress,
    stopMediaProg,
  ])

  const closeMediaOverlay = useCallback(() => {
    try { setVideoOpen(false) } catch {}
    try { setOverlayMediaUrl(null) } catch {}
    try { setOverlayMediaKind('video') } catch {}
    try {
      if (!pendingVideo && overlayMediaKind === 'image') setVideoState('idle')
    } catch {}
    try { if (hasComposerMedia) setComposerActive(true) } catch {}
    try { restoreComposerScroll() } catch {}
  }, [
    hasComposerMedia,
    overlayMediaKind,
    pendingVideo,
    restoreComposerScroll,
    setComposerActive,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoOpen,
    setVideoState,
  ])

  const acceptMediaFromOverlay = useCallback(() => {
    closeMediaOverlay()
  }, [closeMediaOverlay])

  const resetOrCloseOverlay = useCallback(() => {
    if (videoState === 'live' || videoState === 'recording') {
      resetVideo()
      return
    }
    closeMediaOverlay()
  }, [closeMediaOverlay, resetVideo, videoState])

  const openPendingVideoFullscreen = useCallback(() => {
    try { saveComposerScroll() } catch {}
    try { setOverlayMediaKind?.('video') } catch {}
    try { setOverlayMediaUrl?.(null) } catch {}
    try { setVideoState?.('preview') } catch {}
    try { setVideoOpen?.(true) } catch {}
  }, [
    saveComposerScroll,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoOpen,
    setVideoState,
  ])

  const removePendingVideoAttachment = useCallback(() => {
    try {
      if (pendingVideo && /^blob:/i.test(String(pendingVideo))) {
        URL.revokeObjectURL(pendingVideo)
      }
    } catch {}
    try { setPendingVideo?.(null) } catch {}
    try { setOverlayMediaUrl?.(null) } catch {}
    try { setOverlayMediaKind?.('video') } catch {}
    try { setVideoOpen?.(false) } catch {}
    try { setVideoState?.('idle') } catch {}
    try { resetVideo?.() } catch {}
  }, [
    pendingVideo,
    resetVideo,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setPendingVideo,
    setVideoOpen,
    setVideoState,
  ])

  return {
    startVideo,
    stopVideo,
    resetVideo,
    cancelMediaOperation,
    closeMediaOverlay,
    acceptMediaFromOverlay,
    resetOrCloseOverlay,
    openPendingVideoFullscreen,
    removePendingVideoAttachment,
  }
}
