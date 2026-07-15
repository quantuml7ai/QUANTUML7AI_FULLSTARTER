import { useEffect, useMemo, useRef, useState } from 'react'
import useComposerScrollMemory from './useComposerScrollMemory'
import useComposerUiLifecycle from './useComposerUiLifecycle'
import useVoiceRecorder from '../../media/hooks/useVoiceRecorder'
import useMediaPipelineController from '../../media/hooks/useMediaPipelineController'

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
  const [pendingImgs, setPendingImgs] = useState([])
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
    setPendingImgs,
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
    cooldownLeft,
    setCooldownLeft,
    videoCancelRef,
    videoMirrorRef,
  }
}
