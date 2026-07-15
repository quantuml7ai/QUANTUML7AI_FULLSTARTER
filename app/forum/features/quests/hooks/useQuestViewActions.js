import { useCallback } from 'react'

export default function useQuestViewActions({
  readEnv,
  questOpen,
  questSel,
  pushNavStateStable,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  setInboxOpen,
  setVideoFeedOpen,
  setSel,
  setThreadRoot,
  setQuestOpen,
  setQuestSel,
  bodyRef,
}) {
  const scrollToQuestStart = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const marker = document.querySelector('[data-forum-quest-start="1"]')
          if (marker?.scrollIntoView) {
            marker.scrollIntoView({ behavior: 'auto', block: 'start' })
            return
          }
        } catch {}
        try {
          const scrollEl =
            bodyRef.current ||
            document.querySelector('[data-forum-scroll="1"]') ||
            null
          if (scrollEl) {
            scrollEl.scrollTop = 0
            return
          }
        } catch {}
        try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch {}
      })
    })
  }, [bodyRef])

  const openQuests = useCallback((entryId) => {
    if (readEnv?.('NEXT_PUBLIC_QUEST_ENABLED', '1') !== '1') return
    if (questOpen && !questSel) {
      scrollToQuestStart()
      return
    }

    try { pushNavStateStable(entryId || 'quest_btn') } catch {}
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
    setInboxOpen(false)
    setVideoFeedOpen(false)
    setSel(null)
    setThreadRoot(null)
    setQuestOpen(true)
    setQuestSel(null)
    scrollToQuestStart()
  }, [
    headAutoOpenRef,
    pushNavStateStable,
    questOpen,
    questSel,
    readEnv,
    scrollToQuestStart,
    setHeadHidden,
    setHeadPinned,
    setInboxOpen,
    setQuestOpen,
    setQuestSel,
    setSel,
    setThreadRoot,
    setVideoFeedOpen,
  ])

  const closeQuests = useCallback(() => {
    setQuestSel(null)
    setQuestOpen(false)
  }, [setQuestOpen, setQuestSel])

  return {
    openQuests,
    closeQuests,
  }
}
