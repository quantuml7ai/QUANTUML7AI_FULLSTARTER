import { useCallback } from 'react'
import { closeVideoFeedFlow, openVideoFeedFlow } from '../utils/videoFeedActions'

export default function useVideoFeedActions({
  setVideoFeedUserSortLocked,
  setFeedSort,
  setVideoFeedEntryToken,
  setVideoFeedPageSalt,
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
    // Soft refresh is now applied in a single place (useVideoFeedLifecycle),
    // to avoid double hard-reset / double align and scroll jitter.
    try { setVideoFeedUserSortLocked(false) } catch {}
    try { setFeedSort?.('random') } catch {}
    try {
      const pageSize = Math.max(1, Number(videoPageSize || 0) || 1)
      setVisibleVideoCount?.(pageSize)
    } catch {}
    try {
      setVideoFeedPageSalt(() => {
        const ts = Date.now()
        const rndA = Math.random().toString(36).slice(2)
        const rndB = Math.random().toString(36).slice(2)
        return `${ts}-${rndA}-${rndB}`
      })
    } catch {}
    try {
      setVideoFeedEntryToken((prev) => {
        const now = Date.now()
        const prevNum = Number(prev || 0)
        const base = Math.max(prevNum + 1, now)
        const rnd = Math.floor(Math.random() * 9973) + 1
        return base + rnd
      })
    } catch {}
  }, [
    emitDiag,
    visibleVideoCount,
    videoFeed,
    videoFeedRefreshTeleportPendingRef,
    setVideoFeedUserSortLocked,
    setFeedSort,
    setVisibleVideoCount,
    videoPageSize,
    setVideoFeedPageSalt,
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
