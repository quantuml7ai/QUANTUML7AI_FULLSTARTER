import { useCallback } from 'react'

function clearForumDeepLinkQuery() {
  if (typeof window === 'undefined') return
  try {
    const u = new URL(window.location.href)
    const hasDeepLink =
      u.searchParams.has('post') ||
      u.searchParams.has('topic') ||
      u.searchParams.has('root')
    if (!hasDeepLink) return
    u.searchParams.delete('post')
    u.searchParams.delete('topic')
    u.searchParams.delete('root')
    window.history.replaceState({}, '', u.pathname + u.search + u.hash)
  } catch {}
}

export default function useForumHomeAction({
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  videoFeedOpen,
  closeVideoFeed,
  questOpen,
  closeQuests,
  clearProfileBranch,
  setInboxOpen,
  setReplyTo,
  setThreadRoot,
  setSel,
}) {
  const alignFirstTopicsCardToTop = useCallback(() => {
    try {
      const scrollEl = document.querySelector('[data-forum-scroll="1"]') || null
      const root = scrollEl || document
      let target =
        root.querySelector?.('[data-feed-card="1"]') ||
        document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
        null
      if (!target && root !== document) {
        target =
          document.querySelector?.('[data-feed-card="1"]') ||
          document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
          null
      }
      if (!target) {
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          scrollEl.scrollTop = 0
          return true
        }
        try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch { try { window.scrollTo(0, 0) } catch {} }
        return true
      }
      const rect = target.getBoundingClientRect?.()
      if (!rect) return false
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
        scrollEl.scrollTop = Math.max(0, targetTop)
        return true
      }
      const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top
      try { window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }) } catch { try { window.scrollTo(0, Math.max(0, y)) } catch {} }
      return true
    } catch {}
    return false
  }, [])

  return useCallback(() => {
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
    if (videoFeedOpen) { try { closeVideoFeed?.() } catch {} }
    if (questOpen) { try { closeQuests?.() } catch {} }
    try { clearProfileBranch?.() } catch {}
    try { setInboxOpen(false) } catch {}
    try { setReplyTo(null) } catch {}
    try { setThreadRoot(null) } catch {}
    try { setSel(null) } catch {}
    clearForumDeepLinkQuery()
    const delays = [0, 60, 140, 260]
    delays.forEach((delay) => {
      setTimeout(() => {
        try { alignFirstTopicsCardToTop() } catch {}
      }, delay)
    })
  }, [
    alignFirstTopicsCardToTop,
    closeQuests,
    closeVideoFeed,
    clearProfileBranch,
    headAutoOpenRef,
    questOpen,
    setHeadHidden,
    setHeadPinned,
    setInboxOpen,
    setReplyTo,
    setSel,
    setThreadRoot,
    videoFeedOpen,
  ])
}
