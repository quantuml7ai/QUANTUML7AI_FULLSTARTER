import { useCallback } from 'react'
import { closeVideoFeedFlow, openVideoFeedFlow } from '../utils/videoFeedActions'

export default function useVideoFeedActions({
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
  emitDiag,
  visibleVideoCount,
  videoFeed,
  videoFeedRefreshTeleportPendingRef,
  setVisibleVideoCount,
  videoPageSize,
  videoFeedHardResetRef,
}) {
  const refreshVideoFeedWithoutReload = useCallback(() => {
    try {
      emitDiag?.('video_feed_soft_refresh_request', {
        source: 'button',
        visibleVideoCount,
        totalFeed: Array.isArray(videoFeed) ? videoFeed.length : 0,
      }, { force: true })
    } catch {}
    try { videoFeedRefreshTeleportPendingRef.current = true } catch {}
    try { setVideoFeedUserSortLocked(false) } catch {}
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
    try { setVisibleVideoCount(videoPageSize) } catch {}
    try { videoFeedHardResetRef.current?.() } catch {}
    try {
      snapVideoFeedToFirstCardTop({ hideHeader: true, anchorOnly: true })
    } catch {}
    try { setVideoFeedEntryToken((x) => x + 1) } catch {}
  }, [
    emitDiag,
    visibleVideoCount,
    videoFeed,
    videoFeedRefreshTeleportPendingRef,
    setVideoFeedUserSortLocked,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    setVisibleVideoCount,
    videoPageSize,
    videoFeedHardResetRef,
    snapVideoFeedToFirstCardTop,
    setVideoFeedEntryToken,
  ])

  const openVideoFeed = useCallback((entryId, opts = {}) => {
    openVideoFeedFlow(entryId, opts, {
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
    })
  }, [
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
  ])

  const closeVideoFeed = useCallback(() => {
    closeVideoFeedFlow({
      videoFeedOpenRef,
      setVideoFeedOpen,
    })
  }, [videoFeedOpenRef, setVideoFeedOpen])

  return {
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    closeVideoFeed,
  }
}
