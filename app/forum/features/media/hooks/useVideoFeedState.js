import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildVideoFeedItems } from '../utils/videoFeedBuilder'
import { createVideoFeedPageSalt } from '../utils/videoFeedSalt'
import { forumEntityId, mergeForumEntityPreserving } from '../../feed/utils/postMerge'

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

function normalizeReactionState(value) {
  const raw = String(value || '').trim().toLowerCase()
  return raw === 'like' || raw === 'dislike' ? raw : null
}

export function mergeVideoFeedServerPostWithLocal(localItem, serverItem) {
  if (!localItem || typeof localItem !== 'object') return serverItem
  const merged = mergeForumEntityPreserving(localItem, serverItem)
  const localReaction = normalizeReactionState(localItem?.myReaction)
  if (localReaction) {
    merged.myReaction = localReaction
    merged.likes = Number.isFinite(Number(localItem.likes)) ? Number(localItem.likes) : merged.likes
    merged.dislikes = Number.isFinite(Number(localItem.dislikes)) ? Number(localItem.dislikes) : merged.dislikes
    merged.counters = merged.counters && typeof merged.counters === 'object'
      ? {
          ...merged.counters,
          likes: Number.isFinite(Number(localItem.counters?.likes)) ? Number(localItem.counters.likes) : merged.counters.likes,
          dislikes: Number.isFinite(Number(localItem.counters?.dislikes)) ? Number(localItem.counters.dislikes) : merged.counters.dislikes,
        }
      : merged.counters
  }
  return merged
}

export default function useVideoFeedState({
  data,
  allPosts,
  // QL7_GEO111_MEDIA_FEED_SERVER_STATE_BRIDGE_V1
  serverVideoPosts,
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
  const [videoFeedOpen, setVideoFeedOpen] = useState(() => readInitialVideoFeedOpen())
  const [videoFeed, setVideoFeed] = useState([])
  const [feedSort, setFeedSort] = useState('random')
  const [videoFeedEntryToken, setVideoFeedEntryToken] = useState(0)
  const [videoFeedUserSortLocked, setVideoFeedUserSortLocked] = useState(false)
  const [videoFeedPageSalt, setVideoFeedPageSalt] = useState(() => createVideoFeedPageSalt())
  const lastBuildEntryTokenRef = useRef(0)
  const lastBuildOrderKeyRef = useRef('')

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

  const mergedVideoFeedPosts = useMemo(() => {
    const server = Array.isArray(serverVideoPosts) ? serverVideoPosts : []
    const localThreadPosts = Array.isArray(allPosts) ? allPosts : []
    const localOverlayPosts = Array.isArray(data?.posts) ? data.posts : []
    const local = videoFeedOpen ? [...localThreadPosts, ...localOverlayPosts] : localThreadPosts
    if (!videoFeedOpen) return localThreadPosts
    if (!server.length) return []
    const localByKey = new Map()
    for (const item of local) {
      const id = forumEntityId(item) || item?._id || item?.uuid || item?.key || null
      if (id != null && String(id).trim()) localByKey.set(String(id).trim(), item)
    }
    return server.map((item) => {
      const id = forumEntityId(item) || item?._id || item?.uuid || item?.key || null
      const localItem = id != null && String(id).trim() ? localByKey.get(String(id).trim()) : null
      return localItem ? mergeVideoFeedServerPostWithLocal(localItem, item) : item
    })
  }, [serverVideoPosts, allPosts, data?.posts, videoFeedOpen])

  const buildAndSetVideoFeed = useCallback(() => {
    // In media feed mode the server page is the ordering authority. Passing the
    // old snapshot back into the builder lets stale global cards appear before
    // freshly requested Geo rings while the reset page is still in flight.
    const sourceData = videoFeedOpen
      ? { posts: [], messages: [], feed: [], topics: [] }
      : data
    const nextFeed = buildVideoFeedItems({
      data: sourceData,
      allPosts: mergedVideoFeedPosts,
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
    data,
    mergedVideoFeedPosts,
    extractUrlsFromText,
    feedSort,
    isMediaUrl,
    starredFirst,
    videoFeedEntryToken,
    videoFeedPageSalt,
    videoFeedOpen,
    videoFeedUserSortLocked,
    viewerId,
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
      buildVideoFeedContextSignature(videoFeed),
    ].join('|')
  }, [
    feedSort,
    videoFeed,
    videoFeedEntryToken,
    videoFeedPageSalt,
    videoFeedUserSortLocked,
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
