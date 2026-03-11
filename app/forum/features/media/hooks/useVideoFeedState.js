import { useCallback, useEffect, useMemo, useState } from 'react'

import { buildVideoFeedItems } from '../utils/videoFeedBuilder'
import { createVideoFeedPageSalt } from '../utils/videoFeedSalt'

export default function useVideoFeedState({
  data,
  allPosts,
  isMediaUrl,
  extractUrlsFromText,
  viewerId,
  starredFirst,
  videoFeedOpenRef,
  navRestoringRef,
  emitDiag,
  visibleVideoCount,
  setVisibleVideoCount,
  videoPageSize,
}) {
  const [videoFeedOpen, setVideoFeedOpen] = useState(false)
  const [videoFeed, setVideoFeed] = useState([])
  const [feedSort, setFeedSort] = useState('new')
  const [videoFeedEntryToken, setVideoFeedEntryToken] = useState(0)
  const [videoFeedUserSortLocked, setVideoFeedUserSortLocked] = useState(false)
  const [videoFeedPageSalt] = useState(() => createVideoFeedPageSalt())

  useEffect(() => {
    videoFeedOpenRef.current = videoFeedOpen
  }, [videoFeedOpen, videoFeedOpenRef])

  useEffect(() => {
    if (!videoFeedOpen) return
    if (navRestoringRef.current) return
    try {
      emitDiag?.(
        'video_feed_visible_count_reset',
        { reason: 'feed_open', size: videoPageSize },
        { force: true },
      )
    } catch {}
    setVisibleVideoCount(videoPageSize)
  }, [
    emitDiag,
    navRestoringRef,
    setVisibleVideoCount,
    videoFeedOpen,
    videoPageSize,
  ])

  const buildAndSetVideoFeed = useCallback(() => {
    const nextFeed = buildVideoFeedItems({
      data,
      allPosts,
      isMediaUrl,
      extractUrlsFromText,
      videoFeedUserSortLocked,
      feedSort,
      viewerId,
      videoFeedPageSalt,
      videoFeedEntryToken,
      starredFirst,
    })
    setVideoFeed(nextFeed)
  }, [
    allPosts,
    data,
    extractUrlsFromText,
    feedSort,
    isMediaUrl,
    starredFirst,
    videoFeedEntryToken,
    videoFeedPageSalt,
    videoFeedUserSortLocked,
    viewerId,
  ])

  const visibleVideoFeed = useMemo(
    () => (videoFeed || []).slice(0, visibleVideoCount),
    [videoFeed, visibleVideoCount],
  )
  const videoHasMore = visibleVideoFeed.length < (videoFeed || []).length

  return {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    setVideoFeed,
    feedSort,
    setFeedSort,
    videoFeedEntryToken,
    setVideoFeedEntryToken,
    videoFeedUserSortLocked,
    setVideoFeedUserSortLocked,
    videoFeedPageSalt,
    buildAndSetVideoFeed,
    visibleVideoFeed,
    videoHasMore,
  }
}
