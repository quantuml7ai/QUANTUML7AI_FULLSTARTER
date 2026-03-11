import { useEffect, useRef } from 'react'

export default function useVideoFeedLifecycle({
  videoFeedOpen,
  videoFeedEntryToken,
  data,
  allPosts,
  feedSort,
  activeStarredAuthors,
  buildAndSetVideoFeed,
  videoFeedRefreshTeleportPendingRef,
  emitDiag,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  setVisibleVideoCount,
  videoPageSize,
  videoFeedHardResetRef,
  snapVideoFeedToFirstCardTop,
  navRestoringRef,
  inboxOpen,
  questOpen,
  sel,
  threadRoot,
  openVideoFeed,
}) {
  const autoBootRef = useRef(false)

  useEffect(() => {
    let rafA = 0
    let rafB = 0
    if (!videoFeedOpen) return undefined

    buildAndSetVideoFeed()
    if (videoFeedRefreshTeleportPendingRef.current) {
      try {
        rafA = requestAnimationFrame(() => {
          rafB = requestAnimationFrame(() => {
            if (!videoFeedRefreshTeleportPendingRef.current) return
            try {
              emitDiag?.('video_feed_soft_refresh_apply', {
                stage: 'pre_teleport',
              }, { force: true })
            } catch {}
            try { headAutoOpenRef.current = false } catch {}
            try { setHeadPinned(false) } catch {}
            try { setHeadHidden(true) } catch {}
            try { setVisibleVideoCount(videoPageSize) } catch {}
            try { videoFeedHardResetRef.current?.() } catch {}
            snapVideoFeedToFirstCardTop({ hideHeader: true, anchorOnly: true })
            videoFeedRefreshTeleportPendingRef.current = false
          })
        })
      } catch {}
    }

    return () => {
      try { if (rafA) cancelAnimationFrame(rafA) } catch {}
      try { if (rafB) cancelAnimationFrame(rafB) } catch {}
    }
  }, [
    videoFeedOpen,
    videoFeedEntryToken,
    data?.rev,
    data?.posts,
    data?.messages,
    data?.topics,
    allPosts,
    feedSort,
    activeStarredAuthors,
    buildAndSetVideoFeed,
    snapVideoFeedToFirstCardTop,
    setHeadHidden,
    setHeadPinned,
    emitDiag,
    setVisibleVideoCount,
    videoPageSize,
    videoFeedHardResetRef,
    videoFeedRefreshTeleportPendingRef,
    headAutoOpenRef,
  ])

  useEffect(() => {
    if (autoBootRef.current) return
    if (navRestoringRef.current) return

    if (videoFeedOpen || inboxOpen || questOpen || sel || threadRoot) {
      autoBootRef.current = true
      return
    }

    autoBootRef.current = true
    try { openVideoFeed('video_feed_auto', { skipPush: true, keepHeaderOpen: true }) } catch {}
  }, [videoFeedOpen, inboxOpen, questOpen, sel, threadRoot, openVideoFeed, navRestoringRef])
}
