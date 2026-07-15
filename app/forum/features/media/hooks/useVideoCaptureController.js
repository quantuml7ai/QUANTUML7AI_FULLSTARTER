import { useCallback, useEffect, useRef } from 'react'

function stopCameraStream(stream) {
  try { stream?.__stopCameraFix?.() } catch {}
  try { stream?.__stopMirror?.() } catch {}
  try { stream?.getTracks?.().forEach((track) => track.stop()) } catch {}
}


function isWebCoreCameraRuntime() {
  try {
    const ua = String(navigator?.userAgent || '')
    return !/Android|iPhone|iPad|iPod/i.test(ua)
  } catch {
    return false
  }
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

async function createWebCoreFrontMirrorRecorderStream(baseStream) {
  try {
    if (!isWebCoreCameraRuntime()) return null
    if (baseStream?.__ql7CameraFixed) return null

    const srcTrack = baseStream?.getVideoTracks?.()[0]
    if (!srcTrack) return null

    const settings = srcTrack.getSettings?.() || {}
    if (!isLikelyFrontCameraTrack(settings, srcTrack)) return null

    const srcStream = new MediaStream([srcTrack])
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.srcObject = srcStream
    video.style.position = 'fixed'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.left = '-10px'
    video.style.top = '-10px'
    document.body.appendChild(video)

    await new Promise((resolve) => {
      if (video.readyState >= 1 && (video.videoWidth || video.videoHeight)) return resolve()
      const onMeta = () => {
        video.removeEventListener('loadedmetadata', onMeta)
        resolve()
      }
      video.addEventListener('loadedmetadata', onMeta)
      setTimeout(resolve, 400)
    })

    try { await video.play() } catch {}

    const w = video.videoWidth || settings.width || 0
    const h = video.videoHeight || settings.height || 0
    if (!w || !h) {
      try { video.remove() } catch {}
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.style.position = 'fixed'
    canvas.style.opacity = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.width = '1px'
    canvas.style.height = '1px'
    canvas.style.left = '-10px'
    canvas.style.top = '-10px'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d', { alpha: false })
    let rafId = null
    const draw = () => {
      try {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, w, h)
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, w, h)
        ctx.restore()
      } catch {}
      rafId = requestAnimationFrame(draw)
    }
    draw()

    const fps = Math.max(15, Math.min(30, Number(settings.frameRate || 30) || 30))
    const outStream = canvas.captureStream(fps)
    const outTrack = outStream.getVideoTracks?.()[0]
    if (!outTrack) {
      try { if (rafId) cancelAnimationFrame(rafId) } catch {}
      try { outStream.getTracks().forEach((track) => track.stop()) } catch {}
      try { canvas.remove() } catch {}
      try { video.remove() } catch {}
      return null
    }

    const stopMirror = () => {
      try { if (rafId) cancelAnimationFrame(rafId) } catch {}
      try { outStream.getTracks().forEach((track) => track.stop()) } catch {}
      try { canvas.remove() } catch {}
      try { video.remove() } catch {}
    }

    outStream.__stopMirror = stopMirror
    outStream.__ql7WebCoreFrontMirrorRecorder = true
    outStream.__ql7CameraFix = {
      webCore: true,
      front: true,
      mirrorFront: true,
      recorderOnly: true,
      width: w,
      height: h,
    }
    return outStream
  } catch {
    return null
  }
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
        const mirrorStream = await createUnmirroredFrontStreamFn(baseStream)
        const fixedTrack = mirrorStream?.getVideoTracks?.()[0] || null
        if (mirrorStream && fixedTrack) {
          recStream = new MediaStream([
            ...aTracks,
            fixedTrack,
          ])
          recStream.__ql7CameraFixed = true
          recStream.__ql7CameraFix = mirrorStream.__ql7CameraFix || null
          videoMirrorRef.current = mirrorStream
        } else {
          const webCoreMirrorStream = await createWebCoreFrontMirrorRecorderStream(baseStream)
          const webCoreFixedTrack = webCoreMirrorStream?.getVideoTracks?.()[0] || null
          if (webCoreMirrorStream && webCoreFixedTrack) {
            recStream = new MediaStream([
              ...aTracks,
              webCoreFixedTrack,
            ])
            recStream.__ql7WebCoreFrontMirrorRecorder = true
            recStream.__ql7CameraFix = webCoreMirrorStream.__ql7CameraFix || null
            videoMirrorRef.current = webCoreMirrorStream
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
