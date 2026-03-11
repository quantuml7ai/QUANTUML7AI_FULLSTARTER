'use client'

export function openVideoFeedFlow(entryId, opts = {}, ctx) {
  const {
    setVideoFeedUserSortLocked,
    setVideoFeedEntryToken,
    pushNavState,
    setHeadPinned,
    setHeadHidden,
    headAutoOpenRef,
    videoFeedOpenRef,
    setVideoFeedOpen,
    setInboxOpen,
    setSel,
    setThreadRoot,
    setTopicFilterId,
    snapVideoFeedToFirstCardTop,
  } = ctx

  setVideoFeedUserSortLocked(false)
  setVideoFeedEntryToken((x) => x + 1)

  if (!opts?.skipPush) {
    try { pushNavState(entryId || 'video_feed_btn') } catch {}
  }
  if (opts?.keepHeaderOpen) {
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(false) } catch {}
  } else {
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
  }
  try { videoFeedOpenRef.current = true } catch {}
  setVideoFeedOpen(true)
  try { setInboxOpen?.(false) } catch {}
  try { setSel?.(null); setThreadRoot?.(null) } catch {}
  try { setTopicFilterId?.(null) } catch {}
  if (opts?.keepHeaderOpen) {
    try {
      setTimeout(() => document.querySelector('[data-forum-video-start="1"]')?.scrollIntoView({ behavior: 'auto', block: 'start' }), 0)
    } catch {}
  } else {
    snapVideoFeedToFirstCardTop({ hideHeader: true })
  }
}

export function closeVideoFeedFlow(ctx) {
  const { videoFeedOpenRef, setVideoFeedOpen } = ctx
  try { videoFeedOpenRef.current = false } catch {}
  setVideoFeedOpen(false)
}

