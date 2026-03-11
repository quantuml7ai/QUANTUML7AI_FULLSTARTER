import { useEffect, useMemo, useState } from 'react'

export default function useComposerUiLifecycle({
  composerActive,
  composerRef,
  setComposerActive,
  dmMode,
  hasComposerMedia,
  overlayMediaUrl,
  videoOpen,
}) {
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const composerLocked = useMemo(
    () => !!hasComposerMedia || !!overlayMediaUrl || !!videoOpen,
    [hasComposerMedia, overlayMediaUrl, videoOpen]
  )

  useEffect(() => {
    if (cooldownLeft <= 0) return
    const id = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldownLeft])

  useEffect(() => {
    if (!composerActive) return
    const onDown = (e) => {
      if (composerLocked) return
      const el = composerRef?.current
      if (el && !el.contains(e.target)) {
        setComposerActive(false)
      }
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [composerActive, composerLocked, composerRef, setComposerActive])

  useEffect(() => {
    if (!dmMode) return
    setComposerActive(true)
  }, [dmMode, setComposerActive])

  useEffect(() => {
    const sendBtn = document.querySelector('[data-composer-send], .forumComposer .planeBtn')
    if (!sendBtn) return
    const onClick = () => setComposerActive(false)
    sendBtn.addEventListener('click', onClick)
    return () => sendBtn.removeEventListener('click', onClick)
  }, [composerActive, setComposerActive])

  return {
    cooldownLeft,
    setCooldownLeft,
    composerLocked,
  }
}
