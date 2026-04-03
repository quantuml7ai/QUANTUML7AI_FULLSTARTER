'use client'

import { useCallback, useRef } from 'react'

import useHtmlFlag from '../../../shared/hooks/useHtmlFlag'
import { useEvent } from '../../../shared/hooks/useEvent'
import useVideoFeedActions from './useVideoFeedActions'
import useVideoFeedLifecycle from './useVideoFeedLifecycle'
import useVideoFeedState from './useVideoFeedState'
import { snapVideoFeedToFirstCardTop as snapVideoFeedToFirstCardTopUtil } from '../utils/videoFeedScroll'

export default function useForumVideoFeedRuntime({
  data,
  allPosts,
  isMediaUrlFn,
  extractUrlsFromTextFn,
  viewerId,
  starredFirstFn,
  videoFeedOpenRef,
  navRestoringRef,
  emitDiag,
  visibleVideoCount,
  setVisibleVideoCount,
  videoPageSize,
  isBrowserFn,
  bodyRef,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  pushNavState,
  setInboxOpen,
  setSelectedTopic,
  setThreadRoot,
  setTopicFilterId,
  activeStarredAuthors,
  inboxOpen,
  questOpen,
  selectedTopic,
  threadRoot,
}) {
  const {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    feedSort,
    setFeedSort,
    videoFeedEntryToken,
    setVideoFeedEntryToken,
    setVideoFeedUserSortLocked,
    setVideoFeedPageSalt,
    buildAndSetVideoFeed,
    visibleVideoFeed,
    videoHasMore,
  } = useVideoFeedState({
    data,
    allPosts,
    isMediaUrl: isMediaUrlFn,
    extractUrlsFromText: extractUrlsFromTextFn,
    viewerId,
    starredFirst: starredFirstFn,
    videoFeedOpenRef,
    navRestoringRef,
    emitDiag,
    visibleVideoCount,
    setVisibleVideoCount,
    videoPageSize,
  })

  useHtmlFlag('data-video-feed', videoFeedOpen ? '1' : null)

  const snapVideoFeedToFirstCardTop = useCallback(
    (opts = {}) => {
      snapVideoFeedToFirstCardTopUtil({
        opts,
        isBrowserFn,
        bodyRef,
        headAutoOpenRef,
        setHeadPinned,
        setHeadHidden,
      })
    },
    [bodyRef, headAutoOpenRef, isBrowserFn, setHeadHidden, setHeadPinned]
  )

  const videoFeedRefreshTeleportPendingRef = useRef(false)
  const videoFeedHardResetRef = useRef(null)

  const {
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    closeVideoFeed,
  } = useVideoFeedActions({
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
    setSel: setSelectedTopic,
    setThreadRoot,
    setTopicFilterId,
    emitDiag,
    visibleVideoCount,
    videoFeed,
    videoFeedRefreshTeleportPendingRef,
    setVisibleVideoCount,
    videoPageSize,
    videoFeedHardResetRef,
  })

  const openVideoFeedEvent = useEvent(openVideoFeed)
  const closeVideoFeedEvent = useEvent(closeVideoFeed)
  const refreshVideoFeedWithoutReloadEvent = useEvent(refreshVideoFeedWithoutReload)
  const buildAndSetVideoFeedEvent = useEvent(buildAndSetVideoFeed)

  useVideoFeedLifecycle({
    videoFeedOpen,
    videoFeedEntryToken,
    data,
    allPosts,
    feedSort,
    activeStarredAuthors,
    buildAndSetVideoFeed: buildAndSetVideoFeedEvent,
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
    sel: selectedTopic,
    threadRoot,
    openVideoFeed: openVideoFeedEvent,
  })

  return {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    feedSort,
    setFeedSort,
    setVideoFeedUserSortLocked,
    visibleVideoFeed,
    videoHasMore,
    refreshVideoFeedWithoutReload: refreshVideoFeedWithoutReloadEvent,
    openVideoFeed: openVideoFeedEvent,
    closeVideoFeed: closeVideoFeedEvent,
    videoFeedHardResetRef,
  }
} 
