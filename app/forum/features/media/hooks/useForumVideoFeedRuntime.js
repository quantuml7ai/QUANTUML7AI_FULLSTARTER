'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useHtmlFlag from '../../../shared/hooks/useHtmlFlag'
import { useEvent } from '../../../shared/hooks/useEvent'
import useVideoFeedActions from './useVideoFeedActions'
import useVideoFeedLifecycle from './useVideoFeedLifecycle'
import useVideoFeedState from './useVideoFeedState'
import { snapVideoFeedToFirstCardTop as snapVideoFeedToFirstCardTopUtil } from '../utils/videoFeedScroll'
import { forumEntityId, mergeForumEntitiesById } from '../../feed/utils/postMerge'
import { queueVipProbes } from '../../profile/hooks/useVipFlag'
import {
  boundForumTransientProjectionItems,
  dispatchForumTransientProjectionRelease,
  forumMediaFeedProjectionOwner,
} from '../../feed/utils/transientProjectionRetention'

const QL7_VIDEO_FEED_SORT_VALUES = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])
const QL7_MEDIA_FEED_PROJECTION_OWNER = forumMediaFeedProjectionOwner()
const QL7_MEDIA_FEED_PROJECTION_PAGE_WINDOW = 3
const QL7_MEDIA_FEED_PROJECTION_MIN_ITEMS = 60
const QL7_MEDIA_FEED_PAGE_TIMEOUT_MS = 12000
const QL7_MEDIA_FEED_STALE_REQUEST_MS = 13500
const QL7_MEDIA_FEED_RECOVERY_BASE_MS = 1200
const QL7_MEDIA_FEED_RECOVERY_MAX_MS = 8000

export function isRetryableVideoFeedPageResult(result) {
  const status = Number(result?.status || 0)
  const error = String(result?.error || '').trim().toLowerCase()
  return result?.retryable === true
    || status === 0
    || status === 408
    || status === 425
    || status === 429
    || status >= 500
    || error === 'network'
    || error === 'timeout'
    || error === 'aborted'
}

export function videoFeedRecoveryDelayMs(attempt = 1) {
  const safeAttempt = Math.max(1, Math.floor(Number(attempt || 1)))
  return Math.min(QL7_MEDIA_FEED_RECOVERY_MAX_MS, QL7_MEDIA_FEED_RECOVERY_BASE_MS * (2 ** Math.min(3, safeAttempt - 1)))
}

function mediaFeedProjectionLimit(pageSize) {
  const safePageSize = Math.max(20, Math.floor(Number(pageSize || 0)) || 20)
  return Math.max(QL7_MEDIA_FEED_PROJECTION_MIN_ITEMS, safePageSize * QL7_MEDIA_FEED_PROJECTION_PAGE_WINDOW)
}

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
  tombstones = null,
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
  const serverVideoRequestStartedAtRef = useRef(0)
  const serverVideoAbortRef = useRef(null)
  const serverVideoRetryAttemptRef = useRef(0)
  const serverVideoRetryNotBeforeRef = useRef(0)
  const serverVideoPostsRef = useRef([])
  const videoFeedRefreshTeleportPendingRef = useRef(false)
  const videoFeedHardResetRef = useRef(null)
  const previousVideoFeedOpenRef = useRef(false)

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

  const visibleVideoFeedWithoutTombstones = useMemo(() => {
    const deletedPosts = tombstones?.posts && typeof tombstones.posts === 'object'
      ? tombstones.posts
      : null
    if (!deletedPosts) return visibleVideoFeed
    return (visibleVideoFeed || []).filter((post) => {
      const id = String(forumEntityId(post) || post?._id || post?.postId || '').trim()
      return !id || !deletedPosts[id]
    })
  }, [tombstones?.posts, visibleVideoFeed])

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

  const publishServerVideoItems = useCallback((items, { reset = false } = {}) => {
    const safeItems = Array.isArray(items) ? items : []
    if (!safeItems.length && !reset) return
    try {
      if (typeof window === 'undefined') return
      window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
        detail: {
          posts: safeItems,
          source: 'ql7-media-feed-server-page',
          projectionOwner: QL7_MEDIA_FEED_PROJECTION_OWNER,
          projectionReset: reset === true,
        },
      }))
    } catch {}
  }, [])

  const loadVideoFeedPage = useCallback(async (opts = {}) => {
    const reset = !!opts?.reset
    const forceRecovery = opts?.forceRecovery === true
    if (!api || typeof api.mediaFeedPage !== 'function') return { ok: false, skipped: true }

    const now = Date.now()
    if (serverVideoLoadingRef.current) {
      const ageMs = Math.max(0, now - Number(serverVideoRequestStartedAtRef.current || now))
      const canSupersede = reset || (forceRecovery && ageMs >= QL7_MEDIA_FEED_STALE_REQUEST_MS)
      if (!canSupersede) {
        return {
          ok: false,
          skipped: true,
          loading: true,
          retryable: true,
          retryAfterMs: Math.max(0, QL7_MEDIA_FEED_STALE_REQUEST_MS - ageMs),
        }
      }
      serverVideoRequestRef.current = Number(serverVideoRequestRef.current || 0) + 1
      try { serverVideoAbortRef.current?.abort?.() } catch {}
      serverVideoAbortRef.current = null
      serverVideoRequestStartedAtRef.current = 0
      serverVideoLoadingRef.current = false
      setServerVideoLoading(false)
    }

    if (!reset && !serverVideoHasMoreRef.current) {
      return { ok: true, skipped: true, hasMore: false, reason: 'complete' }
    }

    const retryNotBefore = Number(serverVideoRetryNotBeforeRef.current || 0)
    if (!reset && retryNotBefore > now) {
      return {
        ok: false,
        skipped: true,
        retryable: true,
        reason: 'recovery_cooldown',
        retryAfterMs: retryNotBefore - now,
      }
    }

    const requestId = Number(serverVideoRequestRef.current || 0) + 1
    serverVideoRequestRef.current = requestId
    serverVideoLoadingRef.current = true
    serverVideoRequestStartedAtRef.current = Date.now()
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null
    serverVideoAbortRef.current = abortController

    if (reset) {
      serverVideoCursorRef.current = null
      // A fresh session has an unknown frontier until page one answers. Keep it
      // recoverable so a transient first-page failure cannot permanently brick
      // the surface before a tail watchdog has a chance to retry it.
      serverVideoHasMoreRef.current = true
      serverVideoRetryAttemptRef.current = 0
      serverVideoRetryNotBeforeRef.current = 0
      setServerVideoHasMore(true)
      setServerVideoPosts([])
    }
    setServerVideoLoading(true)

    let timeoutId = 0
    try {
      const limit = Math.max(20, Number(videoPageSize || 0) || 20)
      const requestPromise = Promise.resolve(api.mediaFeedPage({
        mediaKind: 'all',
        sort: feedSort || 'random',
        lang: locale || 'ru',
        limit,
        cursor: reset ? null : serverVideoCursorRef.current,
        requestSignal: abortController?.signal || null,
      }))
      const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          try { abortController?.abort?.() } catch {}
          resolve({ ok: false, error: 'timeout', status: 0, retryable: true })
        }, QL7_MEDIA_FEED_PAGE_TIMEOUT_MS)
      })
      const res = await Promise.race([requestPromise, timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = 0

      if (requestId !== Number(serverVideoRequestRef.current || 0)) {
        return { ok: false, stale: true, reason: 'superseded_request' }
      }

      if (res?.ok === false) {
        if (isRetryableVideoFeedPageResult(res)) {
          const attempt = Number(serverVideoRetryAttemptRef.current || 0) + 1
          const retryAfterMs = videoFeedRecoveryDelayMs(attempt)
          serverVideoRetryAttemptRef.current = attempt
          serverVideoRetryNotBeforeRef.current = Date.now() + retryAfterMs
          // Preserve the last confirmed cursor/hasMore frontier. On a fresh
          // page-one attempt the frontier is still unknown/recoverable (true).
          return { ...res, retryable: true, retryAfterMs }
        }
        serverVideoCursorRef.current = null
        serverVideoHasMoreRef.current = false
        serverVideoRetryAttemptRef.current = 0
        serverVideoRetryNotBeforeRef.current = 0
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

      // Prime the shared VIP broker with the entire media page before windowed
      // PostCard mounts begin. Recommendation rails already carry materialized
      // isVip in their weekly snapshot and deliberately do not probe again.
      try {
        queueVipProbes(posts.map((post) => (
          post?.userId || post?.accountId || post?.authorId || post?.canonicalAuthorId || post?.ownerId || post?.uid || ''
        )))
      } catch {}

      // Keep the full ordered media-feed history local so reverse scrolling and
      // window geometry stay unchanged. Only the duplicated projection copied
      // into the global forum snapshot is bounded: that snapshot participates in
      // broad overlay/filter/map transforms that do not need the whole scroll
      // history resident at once.
      const priorServerVideoCount = reset ? 0 : Number(serverVideoPostsRef.current?.length || 0)
      const nextServerVideoPosts = reset
        ? mergeForumEntitiesById([], posts)
        : mergeForumEntitiesById(serverVideoPostsRef.current, posts)
      const addedCount = Math.max(0, nextServerVideoPosts.length - priorServerVideoCount)
      serverVideoPostsRef.current = nextServerVideoPosts
      setServerVideoPosts(nextServerVideoPosts)

      const projectionLimit = mediaFeedProjectionLimit(limit)
      const projectionPosts = boundForumTransientProjectionItems(nextServerVideoPosts, projectionLimit)
      // Replace this owner's transient projection every page. Canonical/home
      // rows survive mergeForumTransientProjection(reset=true); only stale
      // projection-only media rows fall out of the global snap.
      publishServerVideoItems(projectionPosts, { reset: true })
      if (reset && posts.length > 0) scheduleVideoFeedFirstCardSnap()
      serverVideoCursorRef.current = res?.nextCursor || res?.cursor || res?.data?.nextCursor || res?.data?.cursor || null
      const hasMore = posts.length > 0 && !!serverVideoCursorRef.current && res?.hasMore !== false && res?.data?.hasMore !== false
      serverVideoHasMoreRef.current = hasMore
      serverVideoRetryAttemptRef.current = 0
      serverVideoRetryNotBeforeRef.current = 0
      setServerVideoHasMore(hasMore)
      return { ...res, count: addedCount, hasMore }
    } catch (error) {
      if (requestId !== Number(serverVideoRequestRef.current || 0)) {
        return { ok: false, stale: true, reason: 'superseded_error' }
      }
      const attempt = Number(serverVideoRetryAttemptRef.current || 0) + 1
      const retryAfterMs = videoFeedRecoveryDelayMs(attempt)
      serverVideoRetryAttemptRef.current = attempt
      serverVideoRetryNotBeforeRef.current = Date.now() + retryAfterMs
      return { ok: false, error: String(error?.name || '') === 'AbortError' ? 'aborted' : 'network', status: 0, retryable: true, retryAfterMs }
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      if (requestId === Number(serverVideoRequestRef.current || 0)) {
        if (serverVideoAbortRef.current === abortController) serverVideoAbortRef.current = null
        serverVideoRequestStartedAtRef.current = 0
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
        try { serverVideoAbortRef.current?.abort?.() } catch {}
        serverVideoAbortRef.current = null
        serverVideoRequestStartedAtRef.current = 0
        serverVideoCursorRef.current = null
        serverVideoHasMoreRef.current = false
        serverVideoLoadingRef.current = false
        serverVideoRetryAttemptRef.current = 0
        serverVideoRetryNotBeforeRef.current = 0
      } catch {}
      try { dispatchForumTransientProjectionRelease(QL7_MEDIA_FEED_PROJECTION_OWNER) } catch {}
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

  useEffect(() => {
    const wasOpen = previousVideoFeedOpenRef.current
    previousVideoFeedOpenRef.current = videoFeedOpen
    if (!wasOpen || videoFeedOpen) return

    // The media renderer already owns player unload. This releases only the
    // duplicated server projection data after the media surface closes.
    serverVideoRequestRef.current = Number(serverVideoRequestRef.current || 0) + 1
    try { serverVideoAbortRef.current?.abort?.() } catch {}
    serverVideoAbortRef.current = null
    serverVideoRequestStartedAtRef.current = 0
    serverVideoCursorRef.current = null
    serverVideoLoadingRef.current = false
    serverVideoHasMoreRef.current = false
    serverVideoRetryAttemptRef.current = 0
    serverVideoRetryNotBeforeRef.current = 0
    serverVideoPostsRef.current = []
    setServerVideoPosts([])
    setServerVideoLoading(false)
    setServerVideoHasMore(false)
    setVideoFeed([])
    dispatchForumTransientProjectionRelease(QL7_MEDIA_FEED_PROJECTION_OWNER)
  }, [setVideoFeed, videoFeedOpen])

  useEffect(() => () => {
    dispatchForumTransientProjectionRelease(QL7_MEDIA_FEED_PROJECTION_OWNER)
  }, [])

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
    visibleVideoFeed: visibleVideoFeedWithoutTombstones,
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
