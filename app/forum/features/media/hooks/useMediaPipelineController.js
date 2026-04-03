import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function useMediaPipelineController({
  t,
  pendingImgs,
  pendingAudio,
  pendingVideo,
}) {
  const [videoProgress, setVideoProgress] = useState(0)
  const [mediaBarOn, setMediaBarOn] = useState(false)
  const [mediaPhase, setMediaPhase] = useState('idle')
  const [mediaPct, setMediaPct] = useState(0)
  const [mediaPipelineOn, setMediaPipelineOn] = useState(false)

  const mediaAbortRef = useRef(null)
  const mediaCancelRef = useRef(false)
  const mediaProgRef = useRef({ id: 0, timer: null, cap: 0, capMax: 0, stallUntil: 0 })

  const formatMediaPhase = useCallback((phase) => {
    const p = String(phase || '')
    if (!p || p === 'idle' || p === 'Ready') return t('forum_media_ready')
    if (p === 'Moderating') return t('forum_media_moderating')
    if (p === 'Uploading') return t('forum_media_uploading')
    if (p === 'Sending') return t('forum_media_sending')
    return p
  }, [t])

  const ensureMediaAbortController = useCallback(() => {
    try { mediaAbortRef.current?.abort?.() } catch {}
    const ac = new AbortController()
    mediaAbortRef.current = ac
    try { mediaCancelRef.current = false } catch {}
    return ac
  }, [])

  const clearMediaAbortController = useCallback(() => {
    try { mediaAbortRef.current = null } catch {}
    try { mediaCancelRef.current = false } catch {}
  }, [])

  const hasComposerMedia = useMemo(() => {
    return (pendingImgs?.length || 0) > 0 || !!pendingAudio || !!pendingVideo || !!mediaPipelineOn
  }, [pendingImgs, pendingAudio, pendingVideo, mediaPipelineOn])

  const stopMediaProg = useCallback(() => {
    const timer = mediaProgRef.current?.timer
    if (timer) {
      try { clearInterval(timer) } catch {}
    }
    if (mediaProgRef.current) mediaProgRef.current.timer = null
  }, [])

  const startSoftProgress = useCallback((cap = 32, stepMs = 120, capMax = 92) => {
    stopMediaProg()
    mediaProgRef.current.id = (mediaProgRef.current.id || 0) + 1
    const myId = mediaProgRef.current.id

    mediaProgRef.current.cap = Math.max(1, Number(cap || 0))
    mediaProgRef.current.capMax = Math.max(mediaProgRef.current.cap, Number(capMax || 0))
    mediaProgRef.current.stallUntil = 0

    try { setMediaPct((p) => Math.max(1, Number(p || 0))) } catch {}
    mediaProgRef.current.timer = setInterval(() => {
      if (mediaProgRef.current.id !== myId) return

      setMediaPct((p) => {
        const cur = Math.max(0, Math.min(100, Number(p || 0)))
        let capNow = Math.max(1, Number(mediaProgRef.current.cap || 0))
        const capMaxNow = Math.max(capNow, Number(mediaProgRef.current.capMax || 0))

        if (cur >= capNow && capNow < capMaxNow) {
          capNow = Math.min(capMaxNow, capNow + 0.45)
          mediaProgRef.current.cap = capNow
        }

        const hardCap = Math.min(99, capNow)
        if (cur >= hardCap) return cur

        const remain = hardCap - cur
        const step = Math.max(0.3, Math.min(2.2, remain * 0.12))
        return Math.min(hardCap, cur + step)
      })
    }, stepMs)
  }, [stopMediaProg])

  const beginMediaPipeline = useCallback((phase = 'Moderating') => {
    const ac = ensureMediaAbortController()
    setMediaPipelineOn(true)
    setMediaBarOn(true)
    setMediaPhase(phase)
    setMediaPct(1)
    if (String(phase || '').toLowerCase() === 'uploading') {
      startSoftProgress(55, 140, 92)
    } else {
      startSoftProgress(32, 120, 45)
    }
    return ac
  }, [startSoftProgress, ensureMediaAbortController])

  const endMediaPipeline = useCallback(() => {
    stopMediaProg()
    setMediaPipelineOn(false)
  }, [stopMediaProg])

  const markMediaReady = useCallback(() => {
    try { stopMediaProg() } catch {}
    try { setMediaPipelineOn(false) } catch {}
    try { setMediaBarOn(true) } catch {}
    try { setMediaPhase('Ready') } catch {}
    try { setMediaPct(100) } catch {}
  }, [stopMediaProg])

  useEffect(() => {
    const hasRealMedia =
      (pendingImgs?.length || 0) > 0 || !!pendingAudio || !!pendingVideo
    if (!hasRealMedia) return
    if (mediaPhase === 'Moderating' || mediaPhase === 'Uploading') {
      markMediaReady()
    }
  }, [pendingImgs, pendingAudio, pendingVideo, mediaPhase, markMediaReady])

  useEffect(() => {
    if (!hasComposerMedia) {
      stopMediaProg()
      setMediaBarOn(false)
      setMediaPipelineOn(false)
      setMediaPhase('idle')
      setMediaPct(0)
      setVideoProgress(0)
      return
    }
    setMediaBarOn(true)
    setMediaPhase((p) => (p && p !== 'idle' ? p : 'Ready'))
    setMediaPct((p) => {
      const cur = Number(p || 0)
      if (cur > 0) return cur
      return mediaPipelineOn ? 1 : 100
    })
  }, [hasComposerMedia, stopMediaProg, mediaPipelineOn])

  return {
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
    markMediaReady,
  }
}
