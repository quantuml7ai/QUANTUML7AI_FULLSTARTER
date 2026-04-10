import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildVideoFeedItems } from '../utils/videoFeedBuilder'
import { createVideoFeedPageSalt } from '../utils/videoFeedSalt'

const VIDEO_FEED_ORDER_KEY = 'forum:video_feed_order:v1'
const VIDEO_FEED_LAST_MODE_KEY = 'forum:last_mode'

function readInitialVideoFeedOpen() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false
    const qs = new URLSearchParams(window.location.search || '')
    const hasDeepLink = qs.has('post') || qs.has('topic') || qs.has('root')
    if (hasDeepLink) return false
    const lastMode = String(window.sessionStorage.getItem(VIDEO_FEED_LAST_MODE_KEY) || '').trim()
    return lastMode === 'video_feed'
  } catch {
    return false
  }
}

function keyOfVideoFeedItem(item) {
  try {
    const id = item?.id ?? item?._id ?? item?.uuid ?? item?.key ?? null
    if (id != null && String(id).trim()) return `id:${String(id).trim()}`
    const topicId = item?.topicId ?? item?.threadId ?? null
    const ts = Number(item?.ts || 0)
    const text = String(item?.text || '').slice(0, 96)
    if (topicId != null || ts > 0 || text) return `f:${String(topicId || '')}:${ts}:${text}`
  } catch {}
  return ''
}

function buildVideoFeedContextSignature(list) {
  const keys = (Array.isArray(list) ? list : [])
    .map((item) => keyOfVideoFeedItem(item))
    .filter((key) => !!String(key || '').trim())

  const head = keys.slice(0, 5).join(',')
  const tail = keys.slice(-5).join(',')
  return `${keys.length}|${head}|${tail}`
}

function buildStarredSignature(starredAuthors) {
  if (!starredAuthors?.size) return 'off'
  return Array.from(starredAuthors).map(String).sort().join(',')
}

export default function useVideoFeedState({
  data,
  allPosts,
  isMediaUrl,
  extractUrlsFromText,
  viewerId,
  starredFirst,
  activeStarredAuthors,
  videoFeedOpenRef,
  navRestoringRef,
  emitDiag,
  visibleVideoCount,
  setVisibleVideoCount,
  videoPageSize,
}) {
  const [videoFeedOpen, setVideoFeedOpen] = useState(() => readInitialVideoFeedOpen())
  const [videoFeed, setVideoFeed] = useState([])
  const [feedSort, setFeedSort] = useState('new')
  const [videoFeedEntryToken, setVideoFeedEntryToken] = useState(0)
  const [videoFeedUserSortLocked, setVideoFeedUserSortLocked] = useState(false)
  const [videoFeedPageSalt, setVideoFeedPageSalt] = useState(() => createVideoFeedPageSalt())
  const lastBuildEntryTokenRef = useRef(0)
  const lastBuildOrderKeyRef = useRef('')
  const starredSignature = useMemo(
    () => buildStarredSignature(activeStarredAuthors),
    [activeStarredAuthors],
  )

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

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return
      const order = (videoFeed || [])
        .map((item) => keyOfVideoFeedItem(item))
        .filter((k) => !!String(k || '').trim())
        .slice(0, 600)
      window.sessionStorage.setItem(VIDEO_FEED_ORDER_KEY, JSON.stringify({ ts: Date.now(), order }))
    } catch {}
  }, [videoFeed])

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
    const buildOrderKeyNow = [
      String(videoFeedEntryToken || 0),
      String(videoFeedPageSalt || ''),
      String(videoFeedUserSortLocked ? '1' : '0'),
      String(feedSort || 'random'),
      starredSignature,
    ].join('|')
    const buildOrderChanged = buildOrderKeyNow !== String(lastBuildOrderKeyRef.current || '')
    lastBuildOrderKeyRef.current = buildOrderKeyNow

    setVideoFeed((prev) => {
      const prevList = Array.isArray(prev) ? prev : []
      const tokenNow = Number(videoFeedEntryToken || 0)
      const tokenChanged = tokenNow !== Number(lastBuildEntryTokenRef.current || 0)
      lastBuildEntryTokenRef.current = tokenNow

      if (!prevList.length) {
        // На холодном старте/после полного обновления страницы
        // лента должна рандомиться заново, а не восстанавливаться
        // из sessionStorage-слепка прошлого прохода.
        return nextFeed
      }
      if (videoFeedUserSortLocked) return nextFeed
      if (tokenChanged || buildOrderChanged) return nextFeed

      const prevIndex = new Map()
      prevList.forEach((item, idx) => {
        const k = keyOfVideoFeedItem(item)
        if (k && !prevIndex.has(k)) prevIndex.set(k, idx)
      })

      const existing = []
      const newcomers = []
      for (const item of nextFeed) {
        const k = keyOfVideoFeedItem(item)
        if (k && prevIndex.has(k)) existing.push(item)
        else newcomers.push(item)
      }

      existing.sort((a, b) => {
        const ka = keyOfVideoFeedItem(a)
        const kb = keyOfVideoFeedItem(b)
        return Number(prevIndex.get(ka) || 0) - Number(prevIndex.get(kb) || 0)
      })

      return [...existing, ...newcomers]
    })
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
    starredSignature,
  ])

  const visibleVideoFeed = useMemo(
    () => (videoFeed || []).slice(0, visibleVideoCount),
    [videoFeed, visibleVideoCount],
  )
  const videoHasMore = visibleVideoFeed.length < (videoFeed || []).length
  const videoFeedContextKey = useMemo(() => {
    return [
      String(feedSort || 'random'),
      String(videoFeedEntryToken || 0),
      String(videoFeedPageSalt || ''),
      String(videoFeedUserSortLocked ? '1' : '0'),
      starredSignature,
      buildVideoFeedContextSignature(videoFeed),
    ].join('|')
  }, [
    feedSort,
    videoFeed,
    videoFeedEntryToken,
    videoFeedPageSalt,
    videoFeedUserSortLocked,
    starredSignature,
  ])

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
    setVideoFeedPageSalt,
    buildAndSetVideoFeed,
    visibleVideoFeed,
    videoHasMore,
    videoFeedContextKey,
  }
}
