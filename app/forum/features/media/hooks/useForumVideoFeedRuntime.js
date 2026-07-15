'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import useHtmlFlag from '../../../shared/hooks/useHtmlFlag'
import { useEvent } from '../../../shared/hooks/useEvent'
import useVideoFeedActions from './useVideoFeedActions'
import useVideoFeedLifecycle from './useVideoFeedLifecycle'
import useVideoFeedState from './useVideoFeedState'
import { snapVideoFeedToFirstCardTop as snapVideoFeedToFirstCardTopUtil } from '../utils/videoFeedScroll'
import { forumEntityId, mergeForumEntitiesById } from '../../feed/utils/postMerge'

const QL7_VIDEO_FEED_SORT_VALUES = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])

function normalizeVideoFeedSort(value) {
  const raw = String(value || '').trim().toLowerCase()
  return QL7_VIDEO_FEED_SORT_VALUES.has(raw) ? raw : 'random'
}

export function patchVideoFeedReactionOverlay(list, detail) {
  if (!Array.isArray(list) || !detail || typeof detail !== 'object') return list
  const postId = String(detail.postId || '').trim()
  const state = String(detail.state || '').trim().toLowerCase()
  if (!postId || (state !== 'like' && state !== 'dislike')) return list
  const likes = Number(detail.likes)
  const dislikes = Number(detail.dislikes)
  let changed = false
  const next = list.map((item) => {
    const id = String(forumEntityId(item) || item?._id || item?.uuid || item?.key || '').trim()
    if (!id || id !== postId) return item
    changed = true
    return {
      ...item,
      myReaction: state,
      likes: Number.isFinite(likes) ? likes : item?.likes,
      dislikes: Number.isFinite(dislikes) ? dislikes : item?.dislikes,
    }
  })
  return changed ? next : list
}

export default function useForumVideoFeedRuntime({
  data,
  allPosts,
  // QL7_GEO111_MEDIA_FEED_SERVER_BRIDGE_V1
  api,
  locale,
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
  inboxOpen,
  questOpen,
  selectedTopic,
  threadRoot,
}) {
  const [serverVideoPosts, setServerVideoPosts] = useState([])
  const [serverVideoLoading, setServerVideoLoading] = useState(false)
  const [serverVideoHasMore, setServerVideoHasMore] = useState(false)
  const serverVideoCursorRef = useRef(null)
  const serverVideoLoadingRef = useRef(false)
  const serverVideoHasMoreRef = useRef(false)
  const serverVideoRequestRef = useRef(0)
  const serverVideoPostsRef = useRef([])
  const videoFeedRefreshTeleportPendingRef = useRef(false)
  const videoFeedHardResetRef = useRef(null)

  useEffect(() => {
    serverVideoPostsRef.current = Array.isArray(serverVideoPosts) ? serverVideoPosts : []
  }, [serverVideoPosts])

  const {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    setVideoFeed,
    feedSort,
    setFeedSort,
    videoFeedEntryToken,
    setVideoFeedEntryToken,
    setVideoFeedUserSortLocked,
    setVideoFeedPageSalt,
    buildAndSetVideoFeed,
    visibleVideoFeed,
    videoHasMore,
    videoFeedContextKey,
  } = useVideoFeedState({
    data,
    allPosts,
    serverVideoPosts,
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onReactionOverlay = (event) => {
      const detail = event?.detail && typeof event.detail === 'object' ? event.detail : null
      if (!detail) return
      setServerVideoPosts((prev) => {
        const next = patchVideoFeedReactionOverlay(prev, detail)
        serverVideoPostsRef.current = Array.isArray(next) ? next : []
        return next
      })
      setVideoFeed((prev) => patchVideoFeedReactionOverlay(prev, detail))
    }
    window.addEventListener('forum:post-reaction-overlay', onReactionOverlay)
    return () => window.removeEventListener('forum:post-reaction-overlay', onReactionOverlay)
  }, [setVideoFeed])

  const snapVideoFeedToFirstCardTop = useCallback((opts = {}) => {
    snapVideoFeedToFirstCardTopUtil({
      opts,
      isBrowserFn,
      bodyRef,
      headAutoOpenRef,
      setHeadPinned,
      setHeadHidden,
    })
  }, [bodyRef, headAutoOpenRef, isBrowserFn, setHeadHidden, setHeadPinned])

  const scheduleVideoFeedFirstCardSnap = useCallback(() => {
    if (!videoFeedOpenRef.current) return
    const delays = [0, 80, 180, 360, 720, 1100]
    delays.forEach((delay) => {
      try {
        window.setTimeout(() => {
          try { snapVideoFeedToFirstCardTop({ hideHeader: true }) } catch {}
        }, delay)
      } catch {}
    })
  }, [snapVideoFeedToFirstCardTop, videoFeedOpenRef])

  const publishServerVideoItems = useCallback((items) => {
    if (!Array.isArray(items) || items.length <= 0) return
    try {
      if (typeof window === 'undefined') return
      window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
        detail: { posts: items, source: 'ql7-media-feed-server-page' },
      }))
    } catch {}
  }, [])

  const loadVideoFeedPage = useCallback(async (opts = {}) => {
    const reset = !!opts?.reset
    if (!api || typeof api.mediaFeedPage !== 'function') return { ok: false, skipped: true }
    if (serverVideoLoadingRef.current) {
      if (!reset) return { ok: false, skipped: true, loading: true }
      serverVideoRequestRef.current = Number(serverVideoRequestRef.current || 0) + 1
      serverVideoLoadingRef.current = false
    }
    if (!reset && !serverVideoHasMoreRef.current) return { ok: true, skipped: true, hasMore: false }
    const requestId = Number(serverVideoRequestRef.current || 0) + 1
    serverVideoRequestRef.current = requestId
    serverVideoLoadingRef.current = true
    if (reset) {
      serverVideoCursorRef.current = null
      serverVideoHasMoreRef.current = false
      setServerVideoHasMore(false)
      setServerVideoPosts([])
    }
    setServerVideoLoading(true)
    try {
      const limit = Math.max(20, Number(videoPageSize || 0) || 20)
      const res = await api.mediaFeedPage({
        mediaKind: 'all',
        sort: feedSort || 'random',
        lang: locale || 'ru',
        limit,
        cursor: reset ? null : serverVideoCursorRef.current,
      })
      if (requestId !== Number(serverVideoRequestRef.current || 0)) return { ok: false, stale: true }
      if (res?.ok === false) {
        serverVideoCursorRef.current = null
        serverVideoHasMoreRef.current = false
        setServerVideoHasMore(false)
        return res
      }
      const rawItems = Array.isArray(res?.items)
        ? res.items
        : (Array.isArray(res?.posts)
          ? res.posts
          : (Array.isArray(res?.data?.items)
            ? res.data.items
            : (Array.isArray(res?.data?.posts) ? res.data.posts : [])))
      const rankBase = reset ? 0 : Number(serverVideoPostsRef.current?.length || 0)
      const posts = rawItems
        .map((item, index) => {
          const post = item?.post && typeof item.post === 'object' ? item.post : item
          if (!post || typeof post !== 'object') return null
          const serverRank = Number(item?.__ql7ServerFeedRank ?? post?.__ql7ServerFeedRank ?? index)
          const geoRank = Number(item?.__ql7GeoFeedRank ?? post?.__ql7GeoFeedRank ?? item?.geoRank?.ringIndex)
          const serverMode = String(res?.mode || post?.__ql7ServerFeedMode || '')
          const next = {
            ...post,
            counters: post.counters && typeof post.counters === 'object' ? post.counters : item?.counters,
            sort: post.sort && typeof post.sort === 'object' ? post.sort : item?.sort,
            __ql7PostCountersCoreHydrated: Boolean(post.__ql7PostCountersCoreHydrated || item?.__ql7PostCountersCoreHydrated),
            __ql7PostCountersThreadIndexHydrated: Boolean(post.__ql7PostCountersThreadIndexHydrated || item?.__ql7PostCountersThreadIndexHydrated),
            __ql7InboxCountersReadFallback: Boolean(post.__ql7InboxCountersReadFallback || item?.__ql7InboxCountersReadFallback),
            __ql7CounterSource: String(post.__ql7CounterSource || item?.__ql7CounterSource || ''),
            __ql7ServerFeedRank: rankBase + (Number.isFinite(serverRank) ? serverRank : index),
            __ql7GeoFeedRank: serverMode.toLowerCase() === 'geo' && Number.isFinite(geoRank) ? geoRank : undefined,
            __ql7ServerFeedMode: serverMode,
            __ql7ServerFeedSort: String(res?.sort || post?.__ql7ServerFeedSort || feedSort || 'random'),
            __ql7ServerFeedSurface: 'media',
          }
          if (serverMode.toLowerCase() !== 'geo') delete next.__ql7GeoFeedRank
          return next
        })
        .filter((item) => item && typeof item === 'object')
      if (res?.ok) {
        setServerVideoPosts((prev) => (reset ? mergeForumEntitiesById([], posts) : mergeForumEntitiesById(prev, posts)))
        publishServerVideoItems(posts)
        if (reset && posts.length > 0) scheduleVideoFeedFirstCardSnap()
        serverVideoCursorRef.current = res?.nextCursor || res?.cursor || res?.data?.nextCursor || res?.data?.cursor || null
        const hasMore = posts.length > 0 && !!serverVideoCursorRef.current && res?.hasMore !== false && res?.data?.hasMore !== false
        serverVideoHasMoreRef.current = hasMore
        setServerVideoHasMore(hasMore)
      }
      return res
    } catch {
      serverVideoHasMoreRef.current = false
      setServerVideoHasMore(false)
      return { ok: false, error: 'network' }
    } finally {
      if (requestId === Number(serverVideoRequestRef.current || 0)) {
        serverVideoLoadingRef.current = false
        setServerVideoLoading(false)
      }
    }
  }, [api, feedSort, locale, publishServerVideoItems, scheduleVideoFeedFirstCardSnap, videoPageSize])

  useEffect(() => {
    if (!videoFeedOpen) return
    loadVideoFeedPage({ reset: true })
  }, [videoFeedOpen, feedSort, videoFeedEntryToken, loadVideoFeedPage])

  useEffect(() => {
    if (!videoFeedOpen || typeof window === 'undefined') return undefined
    const resetServerVideoFeed = (event) => {
      const detail = event?.detail || {}
      const nextSort = normalizeVideoFeedSort(detail?.sort || 'random')
      try {
        serverVideoRequestRef.current = Number(serverVideoRequestRef.current || 0) + 1
        serverVideoCursorRef.current = null
        serverVideoHasMoreRef.current = false
        serverVideoLoadingRef.current = false
      } catch {}
      try { setServerVideoPosts([]) } catch {}
      try { serverVideoPostsRef.current = [] } catch {}
      try { setServerVideoHasMore(false) } catch {}
      try { setServerVideoLoading(true) } catch {}
      try { setVideoFeed([]) } catch {}
      try { videoFeedHardResetRef.current?.() } catch {}
      try { setFeedSort(nextSort) } catch {}
      try { setVideoFeedUserSortLocked(String(detail?.explicit || '').trim() === 'true') } catch {}
      try { setVisibleVideoCount(videoPageSize) } catch {}
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
          return Math.max(prevNum + 1, now) + Math.floor(Math.random() * 9973)
        })
      } catch {}
    }
    window.addEventListener('forum:server-feed-sort-change', resetServerVideoFeed)
    return () => {
      window.removeEventListener('forum:server-feed-sort-change', resetServerVideoFeed)
    }
  }, [
    setFeedSort,
    setVideoFeed,
    setVideoFeedEntryToken,
    setVideoFeedPageSalt,
    setVideoFeedUserSortLocked,
    setVisibleVideoCount,
    videoFeedOpen,
    videoPageSize,
  ])

  useHtmlFlag('data-video-feed', videoFeedOpen ? '1' : null)

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
    snapVideoFeedToFirstCardTop,
    emitDiag,
    visibleVideoCount,
    videoFeed,
    videoFeedRefreshTeleportPendingRef,
    setVisibleVideoCount,
    videoPageSize,
    videoFeedHardResetRef,
  })

  const openVideoFeedEvent = useEvent(openVideoFeed)
  const buildAndSetVideoFeedEvent = useEvent(buildAndSetVideoFeed)

  useVideoFeedLifecycle({
    videoFeedOpen,
    videoFeedEntryToken,
    data,
    allPosts,
    feedSort,
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
    videoHasMore: videoHasMore || serverVideoHasMore,
    videoServerLoading: serverVideoLoading,
    videoServerHasMore: serverVideoHasMore,
    loadVideoFeedPage,
    videoFeedContextKey,
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    closeVideoFeed,
    videoFeedHardResetRef,
  }
}
