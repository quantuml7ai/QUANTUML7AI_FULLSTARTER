import { useCallback } from 'react'

export default function useComposerActionHandlers({
  mediaLocked,
  composerMediaKind,
  videoState,
  saveComposerScroll,
  setComposerActive,
  setOverlayMediaKind,
  setOverlayMediaUrl,
  setVideoOpen,
  postingRef,
  cooldownLeft,
  setVideoState,
  pendingVideo,
  videoOpen,
  createPost,
  setCooldownLeft,
  setEmojiOpen,
  composerBusy = false,
  canSend = false,
}) {
  const handleComposerVideoButtonClick = useCallback((event) => {
    try { event?.preventDefault?.() } catch {}
    if (mediaLocked || composerMediaKind || videoState === 'uploading') return
    try { saveComposerScroll() } catch {}
    try { setComposerActive(true) } catch {}
    try { setOverlayMediaKind('video') } catch {}
    try { setOverlayMediaUrl(null) } catch {}
    try { setVideoOpen(true) } catch {}
    try { setVideoState('live') } catch {}
    try { document.activeElement?.blur?.() } catch {}
  }, [
    mediaLocked,
    composerMediaKind,
    saveComposerScroll,
    setComposerActive,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoOpen,
    setVideoState,
    videoState,
  ])

  const handleComposerSendButtonClick = useCallback(async () => {
    if (postingRef.current || cooldownLeft > 0 || composerBusy || !canSend) return
    try {
      setVideoState((state) => (pendingVideo ? 'uploading' : state))
      try { if (videoOpen) setVideoOpen(false) } catch {}
      const sent = await createPost()
      if (sent) {
        try { setCooldownLeft?.(10) } catch {}
      }
    } finally {
      try { setEmojiOpen(false) } catch {}
    }
  }, [
    cooldownLeft,
    composerBusy,
    createPost,
    canSend,
    pendingVideo,
    postingRef,
    setCooldownLeft,
    setVideoOpen,
    setVideoState,
    setEmojiOpen,
    videoOpen,
  ])

  return {
    handleComposerVideoButtonClick,
    handleComposerSendButtonClick,
  }
}
