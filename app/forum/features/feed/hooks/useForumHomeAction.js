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
    setTimeout(() => {
      try {
        document
          .querySelector('[data-forum-topics-start="1"]')
          ?.scrollIntoView({ block: 'start' })
      } catch {}
    }, 0)
  }, [
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
