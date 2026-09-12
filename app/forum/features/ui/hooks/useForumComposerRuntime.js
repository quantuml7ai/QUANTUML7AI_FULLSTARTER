import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useComposerScrollMemory from './useComposerScrollMemory'
import useComposerUiLifecycle from './useComposerUiLifecycle'
import useVoiceRecorder from '../../media/hooks/useVoiceRecorder'
import useMediaPipelineController from '../../media/hooks/useMediaPipelineController'

function revokeLocalImageUrl(url) {
  const value = String(url || '')
  if (!/^blob:/i.test(value)) return
  try { URL.revokeObjectURL(value) } catch {}
}

export default function useForumComposerRuntime({
  bodyRef,
  t,
  toast,
  dmMode,
  readAudioDurationSecFn,
  forumAudioMaxSeconds,
}) {
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [pendingImgsState, setPendingImgsState] = useState([])
  const pendingImgsRef = useRef([])
  const pendingImageDraftsRef = useRef(new Map())
  const setPendingImgs = useCallback((nextValue) => {
    setPendingImgsState((previousValue) => {
      const previous = Array.isArray(previousValue) ? previousValue : []
      const resolved = typeof nextValue === 'function' ? nextValue(previous) : nextValue
      const next = Array.isArray(resolved) ? resolved.filter(Boolean) : []
      const retained = new Set(next.map((value) => String(value || '')))
      previous.forEach((value) => {
        const key = String(value || '')
        if (retained.has(key)) return
        try { pendingImageDraftsRef.current.delete(key) } catch {}
        revokeLocalImageUrl(value)
      })
      pendingImgsRef.current = next
      return next
    })
  }, [])
  const pendingImgs = pendingImgsState
  const clearPendingImages = useCallback(() => setPendingImgs([]), [setPendingImgs])
  const removePendingImageAt = useCallback((index) => {
    setPendingImgs((previous) => {
      if (!previous.length) return previous
      const safeIndex = Math.max(0, Math.min(previous.length - 1, Number(index || 0)))
      return previous.filter((_, currentIndex) => currentIndex !== safeIndex)
    })
  }, [setPendingImgs])
  useEffect(() => {
    pendingImgsRef.current = pendingImgs
  }, [pendingImgs])
  useEffect(() => () => {
    pendingImgsRef.current.forEach(revokeLocalImageUrl)
    pendingImgsRef.current = []
    try { pendingImageDraftsRef.current.clear() } catch {}
  }, [])

  const [pendingSticker, setPendingSticker] = useState(null)

  const [composerActive, setComposerActive] = useState(false)
  const composerRef = useRef(null)
  const { saveComposerScroll, restoreComposerScroll } = useComposerScrollMemory({ bodyRef })

  const [pendingAudio, setPendingAudio] = useState(null)
  const {
    recState,
    recElapsed,
    startRecord,
    stopRecord,
  } = useVoiceRecorder({
    setPendingAudio,
    saveComposerScroll,
    restoreComposerScroll,
    readAudioDurationSec: readAudioDurationSecFn,
    maxAudioSeconds: forumAudioMaxSeconds,
    toast,
  })

  const [videoState, setVideoState] = useState('idle')
  const [videoOpen, setVideoOpen] = useState(false)
  const [videoElapsed, setVideoElapsed] = useState(0)
  const videoElapsedRef = useRef(0)
  const videoTimerRef = useRef(null)
  const videoRecordStartedAtRef = useRef(0)
  const videoStreamRef = useRef(null)
  const videoRecRef = useRef(null)
  const videoChunksRef = useRef([])
  const videoStopRequestedRef = useRef(false)
  const videoAutoStopAtLimitRef = useRef(false)
  const pendingVideoInfoRef = useRef({ source: '', durationSec: Number.NaN })
  const pendingVideoBlobMetaRef = useRef(new Map())
  const [pendingVideo, setPendingVideo] = useState(null)
  const pendingVideoRef = useRef(null)
  useEffect(() => {
    pendingVideoRef.current = pendingVideo
  }, [pendingVideo])

  useEffect(() => {
    videoElapsedRef.current = Number(videoElapsed || 0)
  }, [videoElapsed])

  const {
    videoProgress,
    setVideoProgress,
    mediaBarOn,
    setMediaBarOn,
    mediaPhase,
    setMediaPhase,
    mediaPct,
    setMediaPct,
    formatMediaPhase,
    mediaPipelineOn,
    setMediaPipelineOn,
    mediaAbortRef,
    mediaCancelRef,
    ensureMediaAbortController,
    clearMediaAbortController,
    hasComposerMedia,
    stopMediaProg,
    startSoftProgress,
    beginMediaPipeline,
    endMediaPipeline,
  } = useMediaPipelineController({
    t,
    pendingImgs,
    pendingAudio,
    pendingVideo,
  })

  const [overlayMediaKind, setOverlayMediaKind] = useState('video')
  const [overlayMediaUrl, setOverlayMediaUrl] = useState(null)
  const [overlayImageIndex, setOverlayImageIndex] = useState(0)
  const openPendingImageFullscreen = useCallback((index = 0) => {
    const images = pendingImgsRef.current
    if (!images.length) return
    const safeIndex = Math.max(0, Math.min(images.length - 1, Number(index || 0)))
    setOverlayImageIndex(safeIndex)
    setOverlayMediaKind('image')
    setOverlayMediaUrl(images[safeIndex] || null)
    setVideoState('preview')
    setVideoOpen(true)
  }, [])

  useEffect(() => {
    if (overlayMediaKind !== 'image') return
    if (!pendingImgs.length) {
      setOverlayImageIndex(0)
      setOverlayMediaUrl(null)
      if (videoOpen) setVideoOpen(false)
      return
    }
    const safeIndex = Math.max(0, Math.min(pendingImgs.length - 1, Number(overlayImageIndex || 0)))
    if (safeIndex !== overlayImageIndex) setOverlayImageIndex(safeIndex)
    const nextUrl = pendingImgs[safeIndex] || null
    if (nextUrl !== overlayMediaUrl) setOverlayMediaUrl(nextUrl)
  }, [overlayImageIndex, overlayMediaKind, overlayMediaUrl, pendingImgs, videoOpen])

  const { cooldownLeft, setCooldownLeft } = useComposerUiLifecycle({
    composerActive,
    composerRef,
    setComposerActive,
    dmMode,
    hasComposerMedia,
    overlayMediaUrl,
    videoOpen,
  })

  const videoCancelRef = useRef(false)
  const videoMirrorRef = useRef(null)
  const composerMediaKind = useMemo(() => {
    if ((pendingImgs?.length || 0) > 0) return 'image'
    if (pendingVideo) return 'video'
    if (pendingAudio) return 'audio'
    if (pendingSticker?.src) return 'sticker'
    return null
  }, [pendingAudio, pendingImgs, pendingSticker, pendingVideo])

  return {
    text,
    setText,
    replyTo,
    setReplyTo,
    pendingImgs,
    pendingImgsRef,
    pendingImageDraftsRef,
    setPendingImgs,
    clearPendingImages,
    removePendingImageAt,
    pendingSticker,
    setPendingSticker,
    composerMediaKind,
    composerActive,
    setComposerActive,
    composerRef,
    saveComposerScroll,
    restoreComposerScroll,
    pendingAudio,
    setPendingAudio,
    recState,
    recElapsed,
    startRecord,
    stopRecord,
    videoState,
    setVideoState,
    videoOpen,
    setVideoOpen,
    videoElapsed,
    setVideoElapsed,
    videoElapsedRef,
    videoTimerRef,
    videoRecordStartedAtRef,
    videoStreamRef,
    videoRecRef,
    videoChunksRef,
    videoStopRequestedRef,
    videoAutoStopAtLimitRef,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    pendingVideo,
    setPendingVideo,
    pendingVideoRef,
    videoProgress,
    setVideoProgress,
    mediaBarOn,
    setMediaBarOn,
    mediaPhase,
    setMediaPhase,
    mediaPct,
    setMediaPct,
    formatMediaPhase,
    mediaPipelineOn,
    setMediaPipelineOn,
    mediaAbortRef,
    mediaCancelRef,
    ensureMediaAbortController,
    clearMediaAbortController,
    hasComposerMedia,
    stopMediaProg,
    startSoftProgress,
    beginMediaPipeline,
    endMediaPipeline,
    overlayMediaKind,
    setOverlayMediaKind,
    overlayMediaUrl,
    setOverlayMediaUrl,
    overlayImageIndex,
    setOverlayImageIndex,
    openPendingImageFullscreen,
    cooldownLeft,
    setCooldownLeft,
    videoCancelRef,
    videoMirrorRef,
  }
}
