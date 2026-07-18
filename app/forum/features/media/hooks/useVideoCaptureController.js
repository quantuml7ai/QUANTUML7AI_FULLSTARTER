import { useCallback, useEffect, useRef } from 'react'

function stopCameraStream(stream) {
  try { stream?.__stopCameraFix?.() } catch {}
  try { stream?.__stopMirror?.() } catch {}
  try { stream?.getTracks?.().forEach((track) => track.stop()) } catch {}
}

function isLikelyBackCameraTrack(settings, track) {
  try {
    const facing = String(settings?.facingMode || '').toLowerCase()
    const label = String(track?.label || '').toLowerCase()
    return (
      facing.includes('environment') ||
      facing.includes('back') ||
      facing.includes('rear') ||
      label.includes('back') ||
      label.includes('rear') ||
      label.includes('environment')
    )
  } catch {
    return false
  }
}

function isLikelyFrontCameraTrack(settings, track) {
  try {
    if (isLikelyBackCameraTrack(settings, track)) return false
    const facing = String(settings?.facingMode || '').toLowerCase()
    const label = String(track?.label || '').toLowerCase()
    return (
      facing.includes('user') ||
      facing.includes('front') ||
      facing.includes('face') ||
      label.includes('front') ||
      label.includes('user') ||
      label.includes('face') ||
      !facing
    )
  } catch {
    return false
  }
}

function isAppleMobileRecorderRuntime() {
  try {
    const ua = String(navigator?.userAgent || '')
    const platform = String(navigator?.platform || '')
    const maxTouchPoints = Number(navigator?.maxTouchPoints || 0)
    return /iP(?:hone|ad|od)/i.test(ua) ||
      (/Macintosh/i.test(platform) && maxTouchPoints > 1)
  } catch {
    return false
  }
}

function isMobileRecorderRuntime() {
  try {
    return isAppleMobileRecorderRuntime() || /Android|Mobile/i.test(String(navigator?.userAgent || ''))
  } catch {
    return false
  }
}

function getCameraVideoConstraints() {
  if (isMobileRecorderRuntime()) {
    return {
      width: { ideal: 720, max: 1280 },
      height: { ideal: 1280, max: 1280 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: { ideal: 'user' },
    }
  }
  return {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: { ideal: 'user' },
  }
}

function selectVideoRecorderMimeType() {
  try {
    if (typeof MediaRecorder === 'undefined') return ''
    const apple = isAppleMobileRecorderRuntime()
    const candidates = apple
      ? [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4;codecs=h264,aac',
          'video/mp4',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ]
      : [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8',
          'video/webm;codecs=vp9',
          'video/webm',
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4',
        ]
    for (const mime of candidates) {
      try {
        if (!mime || MediaRecorder.isTypeSupported?.(mime)) return mime
      } catch {}
    }
  } catch {}
  return ''
}

function getRecorderTimesliceMs() {
  // iOS/WebKit can truncate MediaRecorder blobs when short timeslices are flushed.
  if (isAppleMobileRecorderRuntime()) return 0
  return 1000
}

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
  const recordingClockStartedRef = useRef(false)

  const stopVideo = useCallback((opts = {}) => {
    const auto = !!opts?.auto
    if (videoStopRequestedRef.current) return
    const rec = videoRecRef.current
    const isActive = !!rec && (rec.state === 'recording' || rec.state === 'paused')
    if (!isActive) return
    videoStopRequestedRef.current = true
    try { videoAutoStopAtLimitRef.current = auto } catch {}
    setVideoState('processing')
    try {
      if (!rec.__ql7SkipRequestDataOnStop) rec.requestData?.()
    } catch {}
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

  const restoreVideoComposerScroll = useCallback(() => {
    try { restoreComposerScroll?.() } catch {}
    if (typeof window === 'undefined') return

    const retry = () => {
      try { restoreComposerScroll?.() } catch {}
    }

    try {
      requestAnimationFrame(() => requestAnimationFrame(retry))
    } catch {}
    try { setTimeout(retry, 80) } catch {}
    try { setTimeout(retry, 180) } catch {}
  }, [restoreComposerScroll])

  const startVideo = useCallback(async () => {
    const badStates = new Set(['opening', 'recording', 'processing', 'uploading'])
    if (badStates.has(videoState)) return

    try {
      try { videoAutoStopAtLimitRef.current = false } catch {}
      if (videoState !== 'live') {
        try { saveComposerScroll() } catch {}
      }
      setVideoOpen(true)
      setVideoState('opening')

      let baseStream = videoStreamRef.current
      const hasTracks = !!baseStream && (baseStream.getTracks?.().length || 0) > 0

      try { videoCancelRef.current = false } catch {}
      try { videoStopRequestedRef.current = false } catch {}
      if (!hasTracks) {
        baseStream = await navigator.mediaDevices.getUserMedia({
          video: getCameraVideoConstraints(),
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        videoStreamRef.current = baseStream
      }

      try {
        if (videoMirrorRef.current?.__stopMirror) videoMirrorRef.current.__stopMirror()
      } catch {}
      videoMirrorRef.current = null

      const mime = selectVideoRecorderMimeType()

      const vTrack = baseStream.getVideoTracks?.()[0] || null
      const vSettings = (() => {
        try { return vTrack?.getSettings?.() || {} } catch { return {} }
      })()
      const recordedFromFrontCamera = !!(vTrack && isLikelyFrontCameraTrack(vSettings, vTrack))

      const recStream = baseStream
      const mediaRecorder = mime
        ? new MediaRecorder(recStream, { mimeType: mime })
        : new MediaRecorder(recStream)
      const recorderTimesliceMs = getRecorderTimesliceMs()
      mediaRecorder.__ql7SkipRequestDataOnStop = recorderTimesliceMs <= 0
      videoChunksRef.current = []
      recordingClockStartedRef.current = false

      mediaRecorder.ondataavailable = (evt) => {
        if (evt?.data?.size) videoChunksRef.current.push(evt.data)
      }

      const startRecordingClock = (source = 'recorder') => {
        if (recordingClockStartedRef.current) return
        recordingClockStartedRef.current = true
        const started = Date.now()
        try { videoRecordStartedAtRef.current = started } catch {}
        setVideoElapsed(0)
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
        try {
          emitDiag?.('camera_record_clock_start', {
            source,
            timesliceMs: recorderTimesliceMs,
            mimeType: mediaRecorder.mimeType || mime || '',
          })
        } catch {}
      }

      mediaRecorder.onstart = () => startRecordingClock('recorder_onstart')

      mediaRecorder.onstop = async () => {
        clearInterval(videoTimerRef.current)
        videoTimerRef.current = null
        try { recordingClockStartedRef.current = false } catch {}
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
        try { stopCameraStream(videoStreamRef.current) } catch {}
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

          const blob = new Blob(videoChunksRef.current, { type: mediaRecorder.mimeType || mime || 'video/webm' })
          videoChunksRef.current = []

          const deriveFallbackDurationSec = (emit = false) => {
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

            let fallbackDurationSec = forumVideoMaxSeconds
            if (Number.isFinite(derived) && derived > 0) {
              fallbackDurationSec = Math.max(0.1, Math.min(forumVideoMaxSeconds, derived))
            }
            if (emit) {
              try {
                emitDiag?.('camera_record_duration_fallback', {
                  source: autoStoppedAtLimit ? 'auto_limit' : 'timer',
                  durationSec: Math.round(fallbackDurationSec * 100) / 100,
                })
              } catch {}
            }
            return fallbackDurationSec
          }

          const url = URL.createObjectURL(blob)
          const writeCameraRecordMeta = (durationSec) => {
            try {
              const safeDurationSec = Math.min(
                forumVideoMaxSeconds,
                Math.max(0.1, Number(durationSec || 0))
              )
              const map = pendingVideoBlobMetaRef.current
              if (map && typeof map.set === 'function' && /^blob:/.test(String(url || ''))) {
                map.set(String(url), {
                  source: 'camera_record',
                  durationSec: safeDurationSec,
                  cameraFacingMode: recordedFromFrontCamera ? 'user' : 'environment',
                  frontCameraMirror: recordedFromFrontCamera,
                  mirrorVideo: recordedFromFrontCamera,
                })
                if (map.size > 32) {
                  const first = map.keys().next()?.value
                  if (first) map.delete(first)
                }
              }
              pendingVideoInfoRef.current = {
                source: 'camera_record',
                durationSec: safeDurationSec,
                cameraFacingMode: recordedFromFrontCamera ? 'user' : 'environment',
                frontCameraMirror: recordedFromFrontCamera,
                mirrorVideo: recordedFromFrontCamera,
              }
            } catch {}
          }
          const isCurrentRecordedPreview = () => {
            try {
              const map = pendingVideoBlobMetaRef.current
              return !map || typeof map.has !== 'function' || map.has(String(url))
            } catch {
              return true
            }
          }

          try {
            const prev = pendingVideo
            if (prev && /^blob:/.test(prev)) {
              try { pendingVideoBlobMetaRef.current?.delete?.(String(prev)) } catch {}
              URL.revokeObjectURL(prev)
            }
          } catch {}

          // Show the just-recorded blob immediately; duration probing continues in the background.
          setPendingVideo(url)
          writeCameraRecordMeta(deriveFallbackDurationSec(false))
          setVideoState('preview')
          try { restoreVideoComposerScroll() } catch {}

          void (async () => {
            let recordedDurationSec = NaN
            try {
              recordedDurationSec = await readVideoDurationSecFn(blob)
            } catch {}

            if (!Number.isFinite(recordedDurationSec) || recordedDurationSec <= 0) {
              recordedDurationSec = deriveFallbackDurationSec(true)
            }

            if (!isCurrentRecordedPreview()) return

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
              try { pendingVideoBlobMetaRef.current?.delete?.(String(url)) } catch {}
              try { URL.revokeObjectURL(url) } catch {}
              setPendingVideo(null)
              try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
              try { restoreVideoComposerScroll() } catch {}
              return
            }

            writeCameraRecordMeta(recordedDurationSec)
          })()
        } catch {
          try { videoChunksRef.current = [] } catch {}
          setVideoState('idle')
        }
      }

      videoRecRef.current = mediaRecorder
      if (recorderTimesliceMs > 0) mediaRecorder.start(recorderTimesliceMs)
      else mediaRecorder.start()

      setVideoState('recording')
      setVideoElapsed(0)
      setTimeout(() => {
        try {
          if (mediaRecorder.state === 'recording') startRecordingClock('recorder_onstart_fallback')
        } catch {}
      }, 350)
    } catch {
      try { recordingClockStartedRef.current = false } catch {}
      setVideoState('idle')
      setVideoOpen(false)
      try { toast?.warn?.(t?.('forum_camera_denied')) } catch {}
    }
  }, [
    emitDiag,
    forumVideoCameraRecordEpsilonSec,
    forumVideoMaxSeconds,
    pendingVideo,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    readVideoDurationSecFn,
    restoreVideoComposerScroll,
    saveComposerScroll,
    setPendingVideo,
    setVideoElapsed,
    recordingClockStartedRef,
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

    try { stopCameraStream(videoStreamRef.current) } catch {}
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
    try { restoreVideoComposerScroll() } catch {}

    try { stopMediaProg() } catch {}
    try { setMediaPipelineOn(false) } catch {}
  }, [
    pendingVideo,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    restoreVideoComposerScroll,
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
    try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
    try { pendingVideoBlobMetaRef.current?.clear?.() } catch {}
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
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
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
    try { restoreVideoComposerScroll() } catch {}
  }, [
    hasComposerMedia,
    overlayMediaKind,
    pendingVideo,
    restoreVideoComposerScroll,
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
    try { restoreVideoComposerScroll?.() } catch {}
  }, [
    pendingVideo,
    resetVideo,
    restoreVideoComposerScroll,
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
