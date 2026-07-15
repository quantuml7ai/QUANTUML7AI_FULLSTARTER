'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useForumDeepLinkFlow from './useForumDeepLinkFlow'
import useThreadOpenNavigation from './useThreadOpenNavigation'
import useThreadPostsModel from './useThreadPostsModel'
import useTopicDiscoveryModel from './useTopicDiscoveryModel'
import { useEvent } from '../../../shared/hooks/useEvent'
import { snapVideoFeedToFirstCardTop as snapVideoFeedToFirstCardTopUtil } from '../../media/utils/videoFeedScroll'
import {
  centerNodeInScroll as centerNodeInScrollUtil,
  centerPostAfterDom as centerPostAfterDomUtil,
  centerAndFlashPostAfterDom as centerAndFlashPostAfterDomUtil,
} from '../utils/postFocus'

function normalizeThreadPagePosts(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  return items
    .map((item) => {
      if (item?.post && typeof item.post === 'object') {
        return {
          ...item.post,
          id: String(item.post.id || item.post.postId || item.postId || item.id || '').trim(),
          postId: String(item.post.postId || item.post.id || item.postId || item.id || '').trim(),
          topicId: String(item.post.topicId || item.topicId || '').trim(),
          thread: item.thread && typeof item.thread === 'object' ? item.thread : item.post.thread,
        }
      }
      if (item && typeof item === 'object' && (item.id || item.postId || item.text || item.body)) {
        return {
          ...item,
          id: String(item.id || item.postId || '').trim(),
          postId: String(item.postId || item.id || '').trim(),
          topicId: String(item.topicId || '').trim(),
        }
      }
      return null
    })
    .filter((post) => post && post.id)
}

function dispatchTopicRootPostsMerge(posts, topicId) {
  if (typeof window === 'undefined') return
  const cleanPosts = (Array.isArray(posts) ? posts : [])
    .filter((post) => post && post.id)
    .map((post) => ({
      ...post,
      topicId: String(post.topicId || topicId || '').trim(),
      __ql7TopicRootsHydrated: true,
    }))
  if (!cleanPosts.length) return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: {
        source: 'topic_roots_server_hydrate',
        posts: cleanPosts,
        topics: [],
        rev: Date.now(),
      },
    }))
  } catch {}
}

export default function useForumFeedRuntime({
  api,
  selectedTopicId,
  setSelectedTopic,
  data,
  postSort,
  topicSort,
  topicFilterId,
  authorFilterUserId,
  query,
  visibleThreadPostsCount,
  setVisibleThreadPostsCount,
  threadPageSize,
  visibleTopicsCount,
  setTopicFilterId,
  setInboxOpen,
  setVideoFeedOpenFn,
  pushNavStateStable,
  isBrowserFn,
  bodyRef,
  toast,
  t,
  resolveNickForDisplayFn,
  extractDmStickersFromTextFn,
  stripMediaUrlsFromTextFn,
  extractUrlsFromTextFn,
  isImageUrlFn,
  isVideoUrlFn,
  isAudioUrlFn,
  isYouTubeUrlFn,
  isTikTokUrlFn,
  buildSearchVideoMediaFn,
  starredFirstFn,
  resolveProfileAccountIdFn,
}) {
  const [threadRoot, setThreadRoot] = useState(null)
  const navStackRef = useRef([])
  const [navDepth, setNavDepth] = useState(0)
  const navRestoringRef = useRef(false)
  const navPendingThreadRootRef = useRef(null)
  const navStateRef = useRef({})
  const topicRootsRequestSeqRef = useRef(0)
  const [topicRootsState, setTopicRootsState] = useState({
    key: '',
    loading: false,
    loaded: false,
    cursor: null,
    hasMore: false,
    error: '',
  })
  const topicRootsStateRef = useRef(topicRootsState)

  useEffect(() => {
    topicRootsStateRef.current = topicRootsState
  }, [topicRootsState])

  const {
    allPosts,
    idMap,
    flat,
    visibleFlat,
    threadHasMore,
  } = useThreadPostsModel({
    selectedTopicId,
    posts: data?.posts,
    threadRoot,
    postSort,
    visibleThreadPostsCount,
    resolveProfileAccountIdFn,
  })

  const {
    openThreadForPost,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
    threadOpening,
  } = useThreadOpenNavigation({
    api,
    selId: selectedTopicId,
    dataTopics: data?.topics,
    dataPosts: data?.posts,
    idMap,
    pushNavStateStable,
    setInboxOpen,
    setVideoFeedOpen: setVideoFeedOpenFn,
    setThreadRoot,
    setSel: setSelectedTopic,
    navPendingThreadRootRef,
    navRestoringRef,
    isBrowserFn,
    threadRoot,
  })

  const centerNodeInScroll = useCallback((node, behavior = 'auto') => {
    centerNodeInScrollUtil(node, {
      behavior,
      isBrowserFn,
      getScrollEl: () => (
        bodyRef.current ||
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      ),
    })
  }, [bodyRef, isBrowserFn])

  const centerPostAfterDom = useCallback((postId, behavior = 'auto') => {
    centerPostAfterDomUtil(postId, {
      behavior,
      isBrowserFn,
      centerNodeInScrollFn: centerNodeInScroll,
    })
  }, [centerNodeInScroll, isBrowserFn])

  const centerAndFlashPostAfterDom = useCallback((postId, behavior = 'auto') => {
    centerAndFlashPostAfterDomUtil(postId, {
      behavior,
      isBrowserFn,
      centerNodeInScrollFn: centerNodeInScroll,
      getScrollEl: () => (
        bodyRef.current ||
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      ),
      postsLen: Array.isArray(data?.posts) ? data.posts.length : 0,
      visibleThreadPostsCount,
      setVisibleThreadPostsCount,
    })
  }, [
    bodyRef,
    centerNodeInScroll,
    data?.posts,
    isBrowserFn,
    setVisibleThreadPostsCount,
    visibleThreadPostsCount,
  ])

  const { deeplinkUI } = useForumDeepLinkFlow({
    isBrowserFn,
    data,
    selectedTopicId,
    idMap,
    allPosts,
    openThreadForPost,
    setTopicFilterId,
    setSel: setSelectedTopic,
    setVisibleThreadPostsCount,
    centerAndFlashPostAfterDom,
    toast,
    t,
  })

  useEffect(() => {
    setVisibleThreadPostsCount(threadPageSize)
  }, [postSort, selectedTopicId, setVisibleThreadPostsCount, threadPageSize, threadRoot])

  const loadTopicRootsPage = useCallback(async ({ reset = false } = {}) => {
    const topicId = String(selectedTopicId || '').trim()
    if (!topicId || threadRoot || typeof api?.threadPage !== 'function') {
      return { ok: false, skipped: true, reason: 'inactive' }
    }
    const current = topicRootsStateRef.current || {}
    if (current.loading) return { ok: false, skipped: true, reason: 'loading' }
    if (!reset && current.loaded && !current.hasMore) return { ok: true, skipped: true, reason: 'complete' }

    const seq = Number(topicRootsRequestSeqRef.current || 0) + 1
    topicRootsRequestSeqRef.current = seq
    const cursor = reset ? null : (current.cursor || null)
    setTopicRootsState((prev) => ({
      key: topicId,
      loading: true,
      loaded: reset ? false : Boolean(prev.loaded && prev.key === topicId),
      cursor: reset ? null : (prev.cursor || null),
      hasMore: reset ? false : Boolean(prev.hasMore),
      error: '',
    }))

    try {
      const page = await api.threadPage({
        mode: 'topic_roots',
        topicId,
        pageSize: 80,
        limit: 80,
        ...(cursor ? { cursor } : null),
      })
      if (topicRootsRequestSeqRef.current !== seq) return { ok: false, skipped: true, reason: 'stale' }
      if (!page?.ok) throw new Error(page?.error || 'topic_roots_page_failed')
      const posts = normalizeThreadPagePosts(page)
        .filter((post) => String(post.topicId || topicId) === topicId)
      dispatchTopicRootPostsMerge(posts, topicId)
      const nextCursor = page?.nextCursor || page?.cursor || null
      const nextState = {
        key: topicId,
        loading: false,
        loaded: true,
        cursor: nextCursor,
        hasMore: Boolean(page?.hasMore || nextCursor),
        error: '',
      }
      topicRootsStateRef.current = nextState
      setTopicRootsState(nextState)
      return { ok: true, count: posts.length, hasMore: nextState.hasMore }
    } catch (error) {
      if (topicRootsRequestSeqRef.current !== seq) return { ok: false, skipped: true, reason: 'stale_error' }
      const nextState = {
        key: topicId,
        loading: false,
        loaded: false,
        cursor: null,
        hasMore: false,
        error: String(error?.message || error || 'topic_roots_page_failed'),
      }
      topicRootsStateRef.current = nextState
      setTopicRootsState(nextState)
      return { ok: false, error: nextState.error }
    }
  }, [api, selectedTopicId, threadRoot])

  useEffect(() => {
    const topicId = String(selectedTopicId || '').trim()
    topicRootsRequestSeqRef.current += 1
    if (!topicId || threadRoot || typeof api?.threadPage !== 'function') {
      const nextState = { key: topicId, loading: false, loaded: false, cursor: null, hasMore: false, error: '' }
      topicRootsStateRef.current = nextState
      setTopicRootsState(nextState)
      return undefined
    }
    const nextState = { key: topicId, loading: false, loaded: false, cursor: null, hasMore: false, error: '' }
    topicRootsStateRef.current = nextState
    setTopicRootsState(nextState)
    const timer = setTimeout(() => {
      loadTopicRootsPage({ reset: true })
    }, 0)
    return () => clearTimeout(timer)
  }, [api, loadTopicRootsPage, selectedTopicId, threadRoot])

  const bannedSet = useMemo(() => new Set(data?.bans || []), [data?.bans])

  const {
    aggregates,
    results,
    sortedTopics,
    visibleTopics,
    topicsHasMore,
  } = useTopicDiscoveryModel({
    query,
    topics: data?.topics,
    posts: data?.posts,
    authorFilterUserId,
    resolveNickForDisplayFn,
    extractDmStickersFromTextFn,
    stripMediaUrlsFromTextFn,
    extractUrlsFromTextFn,
    isImageUrlFn,
    isVideoUrlFn,
    isAudioUrlFn,
    isYouTubeUrlFn,
    isTikTokUrlFn,
    buildSearchVideoMediaFn,
    topicSort,
    topicFilterId,
    starredFirstFn,
    visibleTopicsCount,
    setTopicFilterId,
    resolveProfileAccountIdFn,
  })

  return {
    threadRoot,
    setThreadRoot,
    navStackRef,
    navDepth,
    setNavDepth,
    navRestoringRef,
    navPendingThreadRootRef,
    navStateRef,
    allPosts,
    idMap,
    flat,
    visibleFlat,
    threadHasMore,
    topicRootsLoading: Boolean(topicRootsState.loading),
    topicRootsReady: Boolean(threadRoot || !selectedTopicId || topicRootsState.loaded),
    topicRootsHasMore: Boolean(!threadRoot && topicRootsState.hasMore),
    loadTopicRootsPage,
    openThreadForPost,
    threadOpening,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
    centerNodeInScroll,
    centerPostAfterDom,
    centerAndFlashPostAfterDom,
    deeplinkUI,
    bannedSet,
    aggregates,
    results,
    sortedTopics,
    visibleTopics,
    topicsHasMore,
  }
}

export function useForumScrollAlignmentRuntime({
  alignInboxStartUnderTabs,
  getScrollEl,
  bodyRef,
  isBrowserFn,
}) {
  const lastUserScrollTsRef = useRef(0)
  const markProgrammaticScroll = useEvent((reason = 'align') => {
    try {
      const now = Date.now()
      window.__forumProgrammaticScrollTs = now
      window.__forumProgrammaticScrollReason = String(reason || 'align')
    } catch {}
  })
  const isProgrammaticCooldown = useEvent((windowMs = 220) => {
    try {
      const now = Date.now()
      const last = Number(window.__forumProgrammaticScrollTs || 0)
      return (now - last) < Math.max(80, Number(windowMs || 0))
    } catch {
      return false
    }
  })

  const readAutoAlignIdleMs = useCallback(() => {
    try {
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      return coarse ? 360 : 220
    } catch {
      return 240
    }
  }, [])

  const markUserScrollActive = useEvent(() => {
    try {
      const now = Date.now()
      lastUserScrollTsRef.current = now
      window.__forumUserScrollTs = now
    } catch {}
  })

  useEffect(() => {
    if (!isBrowserFn?.()) return undefined
    const opts = { passive: true, capture: true }
    try { window.addEventListener('scroll', markUserScrollActive, opts) } catch {}
    try { document.addEventListener('scroll', markUserScrollActive, opts) } catch {}
    try { window.addEventListener('wheel', markUserScrollActive, opts) } catch {}
    try { window.addEventListener('touchmove', markUserScrollActive, opts) } catch {}
    return () => {
      try { window.removeEventListener('scroll', markUserScrollActive, true) } catch {}
      try { document.removeEventListener('scroll', markUserScrollActive, true) } catch {}
      try { window.removeEventListener('wheel', markUserScrollActive, true) } catch {}
      try { window.removeEventListener('touchmove', markUserScrollActive, true) } catch {}
    }
  }, [isBrowserFn, markUserScrollActive])

  const canAutoAlignNow = useEvent(() => {
    try {
      const now = Date.now()
      const idleMs = readAutoAlignIdleMs()
      const lastLocalTs = Number(lastUserScrollTsRef.current || 0)
      const lastGlobalTs = Number(window.__forumUserScrollTs || 0)
      const lastTs = Math.max(lastLocalTs, lastGlobalTs)
      if ((now - lastTs) < idleMs) return false
      if (isProgrammaticCooldown(180)) return false
      return true
    } catch {
      return true
    }
  })

  const alignInboxStartUnderTabsEvent = useEvent((options = {}) => {
    alignInboxStartUnderTabs?.(options)
  })

  const requestAlignInboxStartUnderTabs = useCallback((options = {}) => {
    const baseOptions = options && typeof options === 'object' ? options : { attempt: Number(options || 0) || 0 }
    ;[0, 60, 140, 260].forEach((delay, idx) => {
      setTimeout(() => {
        try {
          alignInboxStartUnderTabsEvent({
            ...baseOptions,
            attempt: idx,
            resetToStart: !!baseOptions.resetToStart && idx === 0,
          })
        } catch {}
      }, delay)
    })
  }, [alignInboxStartUnderTabsEvent])

  const alignNodeToTop = useEvent((node) => {
    if (!node || !isBrowserFn?.()) return
    if (isProgrammaticCooldown(180)) return
    try {
      const scrollEl =
        getScrollEl?.() ||
        bodyRef?.current ||
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      const rect = node.getBoundingClientRect?.()
      if (!rect) return
      const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
      if (useInner) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
        const nextTop = Math.max(0, targetTop)
        if (Math.abs(Number(scrollEl.scrollTop || 0) - nextTop) >= 1) {
          markProgrammaticScroll('align_node_top_inner')
          scrollEl.scrollTop = nextTop
        }
        return
      }
      const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top
      const nextY = Math.max(0, Number(y || 0))
      const curY = Number(window.pageYOffset || document.documentElement.scrollTop || 0)
      if (Math.abs(nextY - curY) >= 1) {
        markProgrammaticScroll('align_node_top_window')
        try { window.scrollTo({ top: nextY, behavior: 'auto' }) } catch { try { window.scrollTo(0, nextY) } catch {} }
      }
    } catch {}
  })

  return {
    requestAlignInboxStartUnderTabs,
    alignNodeToTop,
    canAutoAlignNow,
  }
}

export function useForumModeSync({
  videoFeedOpenRef,
  questOpen,
  questId,
  inboxOpen,
  inboxTab,
  dmWithUserId,
  selectedTopicId,
  threadRootId,
  profileBranchMode,
  normalizedProfileBranchUserId,
  navRestoringRef,
  deeplinkActive,
  requestAlignInboxStartUnderTabs,
  bodyRef,
  getScrollEl,
  alignNodeToTop,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  isBrowserFn,
  topicsCardsCount = 0,
  canAutoAlignNow = () => true,
}) {
  const forumModeKey = useMemo(() => {
    if (videoFeedOpenRef.current === true) return 'video_feed'
    if (questOpen) return `quest:${String(questId || '')}`
    if (inboxOpen) {
      if (inboxTab === 'messages' && dmWithUserId) return `inbox:dm:${String(dmWithUserId)}`
      return `inbox:list:${String(inboxTab || 'messages')}`
    }
    // Профильная ветка должна иметь приоритет над выбранной темой:
    // иначе align может уйти в thread/topics path и стартовать "снизу".
    if (profileBranchMode) {
      return `profile_branch:${profileBranchMode}:${String(normalizedProfileBranchUserId || '')}`
    }
    if (selectedTopicId) {
      if (threadRootId) return `thread:replies:${String(threadRootId)}`
      return `thread:topic:${String(selectedTopicId)}`
    }
    return 'topics'
  }, [
    questOpen,
    questId,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    selectedTopicId,
    threadRootId,
    profileBranchMode,
    normalizedProfileBranchUserId,
    videoFeedOpenRef,
  ])

  const prevForumModeKeyRef = useRef(forumModeKey)
  const startupTopicsAlignedRef = useRef(false)
  const markStartupTopicsAligned = useCallback(() => {
    startupTopicsAlignedRef.current = true
    try { window.__forumStartupTopicsAligned = '1' } catch {}
  }, [])

  useEffect(() => {
    if (!isBrowserFn?.()) return
    try {
      if (String(window.__forumStartupTopicsAligned || '') === '1') {
        startupTopicsAlignedRef.current = true
      }
    } catch {}
  }, [isBrowserFn])

  useEffect(() => {
    if (!isBrowserFn?.()) return undefined
    let prev = null
    try {
      if ('scrollRestoration' in window.history) {
        prev = window.history.scrollRestoration
        window.history.scrollRestoration = 'manual'
      }
    } catch {}
    return () => {
      if (prev == null) return
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = prev
        }
      } catch {}
    }
  }, [isBrowserFn])

  useEffect(() => {
    const prevMode = String(prevForumModeKeyRef.current || '')
    const nextMode = String(forumModeKey || '')
    if (prevMode === nextMode) return undefined
    prevForumModeKeyRef.current = nextMode

    if (navRestoringRef.current) return undefined
    if (deeplinkActive) return undefined

    const isDmThreadMode = nextMode.startsWith('inbox:dm:')
    if (isDmThreadMode) return undefined

    const isProfileBranchMode = nextMode.startsWith('profile_branch:')
    const runAlign = () => {
      if (!canAutoAlignNow?.()) return false
      try {
        if (nextMode === 'video_feed') {
          snapVideoFeedToFirstCardTopUtil({
            opts: { hideHeader: true },
            isBrowserFn,
            bodyRef,
            headAutoOpenRef,
            setHeadPinned,
            setHeadHidden,
          })
          return true
        }
        if (nextMode.startsWith('inbox:list:')) {
          requestAlignInboxStartUnderTabs()
          return true
        }
        const scrollEl =
          getScrollEl?.() ||
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        const root = scrollEl || document
        let branchStart = null
        if (nextMode === 'topics') {
          // Topics mode must align only to the first real card, not to technical anchors.
          branchStart =
            root.querySelector?.('[data-feed-card="1"]') ||
            document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
            null
          if (!branchStart && root !== document) {
            branchStart =
              document.querySelector?.('[data-feed-card="1"]') ||
              document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
              null
          }
        } else if (isProfileBranchMode) {
          const profileRoot =
            root.querySelector?.('[data-profile-branch-root="1"]') ||
            document.querySelector?.('[data-profile-branch-root="1"]') ||
            null
          branchStart =
            profileRoot?.querySelector?.('[data-profile-branch-start="1"]') ||
            root.querySelector?.('[data-profile-branch-start="1"]') ||
            profileRoot?.querySelector?.('[data-feed-card="1"]') ||
            null
          if (!branchStart && root !== document) {
            branchStart =
              profileRoot?.querySelector?.('[data-profile-branch-start="1"]') ||
              document.querySelector?.('[data-profile-branch-start="1"]') ||
              profileRoot?.querySelector?.('[data-feed-card="1"]') ||
              null
          }
        } else {
          branchStart =
            root.querySelector?.('[data-forum-thread-start="1"]') ||
            root.querySelector?.('[data-forum-topics-start="1"]') ||
            root.querySelector?.('.inboxBody [data-feed-card="1"]') ||
            root.querySelector?.('[data-feed-card="1"]') ||
            null
          if (!branchStart && root !== document) {
            branchStart =
              document.querySelector?.('[data-forum-thread-start="1"]') ||
              document.querySelector?.('[data-forum-topics-start="1"]') ||
              document.querySelector?.('.inboxBody [data-feed-card="1"]') ||
              document.querySelector?.('[data-feed-card="1"]') ||
              null
          }
        }
        if (branchStart) {
          alignNodeToTop(branchStart)
          return true
        }
      } catch {}
      return false
    }

    const startUserScrollTs = (() => {
      try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
    })()
    const forceAlignMode = (() => {
      try {
        const mode = String(window.__forumForceModeAlign || '').trim()
        const until = Number(window.__forumForceModeAlignUntil || 0)
        if (!mode || !until) return ''
        if (until < Date.now()) return ''
        return mode
      } catch {
        return ''
      }
    })()
    const shouldForceAlign = forceAlignMode === 'profile_branch'

    const timers = []
    let rafA = 0
    let rafB = 0
    let cancelled = false
    const clearTimers = () => {
      timers.forEach((id) => {
        try { clearTimeout(id) } catch {}
      })
      timers.length = 0
    }
    const scheduleAlign = (attempt = 0) => {
      if (cancelled) return
      const currentUserScrollTs = (() => {
        try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
      })()
      if (!shouldForceAlign && attempt > 0 && currentUserScrollTs > startUserScrollTs) return
      const ok = !!runAlign()
      if (ok) {
        if (shouldForceAlign) {
          try {
            delete window.__forumForceModeAlign
            delete window.__forumForceModeAlignUntil
          } catch {}
        }
        return
      }
      if (attempt >= 9) return
      const delay = attempt <= 1 ? 72 : (attempt <= 5 ? 120 : 180)
      const id = setTimeout(() => scheduleAlign(attempt + 1), delay)
      timers.push(id)
    }
    try {
      rafA = requestAnimationFrame(() => {
        rafB = requestAnimationFrame(() => scheduleAlign(0))
      })
    } catch {
      const id = setTimeout(() => scheduleAlign(0), 0)
      timers.push(id)
    }
    return () => {
      cancelled = true
      try { if (rafA) cancelAnimationFrame(rafA) } catch {}
      try { if (rafB) cancelAnimationFrame(rafB) } catch {}
      clearTimers()
    }
  }, [
    forumModeKey,
    navRestoringRef,
    deeplinkActive,
    requestAlignInboxStartUnderTabs,
    bodyRef,
    getScrollEl,
    alignNodeToTop,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    isBrowserFn,
    canAutoAlignNow,
  ])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.__forumModeKey = String(forumModeKey || 'topics')
      }
    } catch {}
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('forum:last_mode', String(forumModeKey || 'topics'))
      }
    } catch {}
  }, [forumModeKey])

  useEffect(() => {
    if (startupTopicsAlignedRef.current) return undefined
    if (forumModeKey !== 'topics') return undefined
    if (navRestoringRef.current) return undefined
    if (deeplinkActive) return undefined
    if (Number(topicsCardsCount || 0) <= 0) return undefined

    const currentTop = (() => {
      try {
        const scrollEl =
          getScrollEl?.() ||
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          return Number(scrollEl.scrollTop || 0)
        }
        return Number(
          window.pageYOffset ||
          document.documentElement?.scrollTop ||
          document.body?.scrollTop ||
          0,
        )
      } catch {
        return 0
      }
    })()
    if (currentTop > 10) {
      markStartupTopicsAligned()
      return undefined
    }

    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}

    const runAlign = () => {
      if (!canAutoAlignNow?.()) return false
      try {
        const scrollEl =
          getScrollEl?.() ||
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        const root = scrollEl || document
        const firstCard =
          root.querySelector?.('[data-feed-card="1"]') ||
          document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
          document.querySelector?.('[data-feed-card="1"]') ||
          null
        if (!firstCard) return false
        alignNodeToTop(firstCard)
        return true
      } catch {}
      return false
    }

    const startUserScrollTs = (() => {
      try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
    })()

    const timers = []
    let cancelled = false
    const clearTimers = () => {
      timers.forEach((id) => {
        try { clearTimeout(id) } catch {}
      })
      timers.length = 0
    }
    const scheduleAlign = (attempt = 0) => {
      if (cancelled) return
      const currentUserScrollTs = (() => {
        try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
      })()
      if (attempt > 0 && currentUserScrollTs > startUserScrollTs) return
      const aligned = !!runAlign()
      if (aligned) {
        markStartupTopicsAligned()
        clearTimers()
        return
      }
      if (attempt >= 13) return
      const delay = attempt <= 1 ? 72 : (attempt <= 5 ? 140 : 220)
      const id = setTimeout(() => scheduleAlign(attempt + 1), delay)
      timers.push(id)
    }

    let rafA = 0
    let rafB = 0
    try {
      rafA = requestAnimationFrame(() => {
        rafB = requestAnimationFrame(() => scheduleAlign(0))
      })
    } catch {
      const id = setTimeout(() => scheduleAlign(0), 0)
      timers.push(id)
    }

    return () => {
      cancelled = true
      try { if (rafA) cancelAnimationFrame(rafA) } catch {}
      try { if (rafB) cancelAnimationFrame(rafB) } catch {}
      clearTimers()
    }
  }, [
    forumModeKey,
    navRestoringRef,
    deeplinkActive,
    topicsCardsCount,
    getScrollEl,
    bodyRef,
    alignNodeToTop,
    canAutoAlignNow,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    markStartupTopicsAligned,
  ])

  return { forumModeKey }
}
