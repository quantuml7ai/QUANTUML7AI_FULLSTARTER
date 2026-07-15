import { useCallback, useEffect, useRef, useState } from 'react'
import { revealForumWindowedDomId } from '../../../shared/utils/forumWindowingRegistry'

function str(value) {
  return String(value ?? '').trim()
}

function normalizeThreadPosts(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : (Array.isArray(payload?.posts) ? payload.posts : [])
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if (item.post && typeof item.post === 'object') {
        return {
          ...item.post,
          id: str(item.post.id || item.post.postId || item.postId || item.id),
          postId: str(item.post.postId || item.post.id || item.postId || item.id),
          topicId: str(item.post.topicId || item.topicId),
        }
      }
      if (item.item && typeof item.item === 'object' && String(item.kind || '').toLowerCase() === 'post') {
        return {
          ...item.item,
          id: str(item.item.id || item.item.postId || item.postId || item.entityId || item.id),
          postId: str(item.item.postId || item.item.id || item.postId || item.entityId || item.id),
          topicId: str(item.item.topicId || item.topicId),
        }
      }
      return {
        ...item,
        id: str(item.id || item.postId),
        postId: str(item.postId || item.id),
        topicId: str(item.topicId),
      }
    })
    .filter((item) => item && item.id)
}

function normalizePostById(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.post && typeof payload.post === 'object') {
    return {
      ...payload.post,
      id: str(payload.post.id || payload.post.postId || payload.postId),
      postId: str(payload.post.postId || payload.post.id || payload.postId),
      topicId: str(payload.post.topicId || payload.topicId),
    }
  }
  if (payload.item && typeof payload.item === 'object') {
    return {
      ...payload.item,
      id: str(payload.item.id || payload.item.postId || payload.postId),
      postId: str(payload.item.postId || payload.item.id || payload.postId),
      topicId: str(payload.item.topicId || payload.topicId),
    }
  }
  if (payload.id || payload.postId) {
    return {
      ...payload,
      id: str(payload.id || payload.postId),
      postId: str(payload.postId || payload.id),
      topicId: str(payload.topicId),
    }
  }
  return null
}

function dispatchServerItemsMerge(posts, source = 'thread_open') {
  const list = Array.isArray(posts) ? posts.filter((post) => post && post.id) : []
  if (!list.length || typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: {
        posts: list,
        topics: [],
        rev: Date.now(),
        source,
      },
    }))
  } catch {}
}

export default function useThreadOpenNavigation({
  api,
  selId,
  dataTopics,
  dataPosts,
  idMap,
  pushNavStateStable,
  setInboxOpen,
  setVideoFeedOpen,
  setThreadRoot,
  setSel,
  navPendingThreadRootRef,
  navRestoringRef,
  isBrowserFn,
  threadRoot,
}) {
  const pendingThreadRootIdRef = useRef(null)
  const pendingThreadRootSeedRef = useRef(null)
  const pendingScrollToPostIdRef = useRef(null)
  const threadOpenSeqRef = useRef(0)
  const hydrateThreadTargetRef = useRef(null)
  const lastSelectedTopicIdRef = useRef(str(selId))
  const [threadOpening, setThreadOpening] = useState({
    active: false,
    targetId: '',
    status: 'idle',
    error: '',
  })
  const alignNodeToThreadTop = useCallback((node) => {
    if (!(node instanceof Element)) return false
    try {
      const scrollEl =
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      const rect = node.getBoundingClientRect?.()
      if (!rect) return false
      const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
      if (useInner) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
        if (Math.abs(Number(scrollEl.scrollTop || 0) - targetTop) > 2) {
          scrollEl.scrollTop = Math.max(0, targetTop)
        }
        return true
      }
      const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top
      try {
        window.scrollTo({ top: Math.max(0, y), behavior: 'auto' })
      } catch {
        try { window.scrollTo(0, Math.max(0, y)) } catch {}
      }
      return true
    } catch {}
    return false
  }, [])

  const setOpeningState = useCallback((patch) => {
    setThreadOpening((prev) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch),
    }))
  }, [])

  const createThreadSeed = useCallback((post) => {
    const id = str(post?.id || post?.postId)
    if (!id) return null
    return {
      ...post,
      id,
      postId: str(post?.postId || id),
      topicId: str(post?.topicId),
      __threadOpening: true,
      __threadSeed: true,
    }
  }, [])

  const hydrateThreadTarget = useCallback(async (seed, seq, attempt = 0) => {
    const targetId = str(seed?.id)
    const topicId = str(seed?.topicId)
    if (!targetId || !topicId || !api) {
      setOpeningState({ active: false, targetId, status: 'ready', error: '' })
      return
    }

    const isCurrent = () => Number(threadOpenSeqRef.current || 0) === Number(seq)
    const applyReady = (targetPost = null) => {
      if (!isCurrent()) return
      const nextRoot = {
        ...(targetPost && typeof targetPost === 'object' ? targetPost : seed),
        id: targetId,
        postId: str(targetPost?.postId || seed?.postId || targetId),
        topicId: str(targetPost?.topicId || seed?.topicId || topicId),
        __threadOpening: false,
        __threadSeed: false,
      }
      try { setThreadRoot(nextRoot) } catch {}
      setOpeningState({ active: false, targetId, status: 'ready', error: '' })
    }

    try {
      setOpeningState({ active: true, targetId, status: 'locating', error: '' })
      const locate = typeof api.threadLocate === 'function'
        ? await api.threadLocate({ postId: targetId, topicId })
        : null
      if (!isCurrent()) return

      const rootPostId = str(locate?.rootPostId || seed?.rootPostId || targetId)
      const locatedPosts = []
      const locatedTarget = normalizePostById(locate?.post || locate?.targetPost || locate?.item || null)
      if (locatedTarget) locatedPosts.push(locatedTarget)
      if (locatedPosts.length) dispatchServerItemsMerge([seed, ...locatedPosts], 'thread_open_locate')

      setOpeningState({ active: true, targetId, status: 'loading', error: '' })
      let page = null
      if (typeof api.threadPage === 'function') {
        page = await api.threadPage({
          mode: 'branch',
          topicId,
          rootPostId,
          targetPostId: targetId,
          pageSize: 120,
        })
      }
      if (!isCurrent()) return

      let pagePosts = normalizeThreadPosts(page)
      let targetPost = pagePosts.find((post) => str(post?.id) === targetId) || locatedTarget || null

      if (!targetPost && typeof api.threadPage === 'function') {
        setOpeningState({ active: true, targetId, status: 'retrying', error: '' })
        await new Promise((resolve) => setTimeout(resolve, 180))
        if (!isCurrent()) return
        const retryPage = await api.threadPage({
          mode: 'branch',
          topicId,
          rootPostId,
          targetPostId: targetId,
          pageSize: 160,
        })
        if (!isCurrent()) return
        const retryPosts = normalizeThreadPosts(retryPage)
        if (retryPosts.length) pagePosts = retryPosts
        targetPost = pagePosts.find((post) => str(post?.id) === targetId) || targetPost
      }

      if (!targetPost && typeof api.postById === 'function') {
        const targetPayload = await api.postById({ postId: targetId, topicId })
        if (!isCurrent()) return
        targetPost = normalizePostById(targetPayload)
        if (targetPost) pagePosts = [targetPost, ...pagePosts]
      }

      dispatchServerItemsMerge([seed, ...pagePosts], 'thread_open_page')
      applyReady(targetPost)
    } catch (error) {
      if (!isCurrent()) return
      try { setThreadRoot({ ...seed, __threadOpening: true, __threadSeed: true }) } catch {}
      if (Number(attempt || 0) < 1) {
        setOpeningState({
          active: true,
          targetId,
          status: 'retrying',
          error: str(error?.message || error || 'thread_open_retry'),
        })
        setTimeout(() => {
          if (!isCurrent()) return
          try { hydrateThreadTargetRef.current?.(seed, seq, Number(attempt || 0) + 1) } catch {}
        }, 420)
        return
      }
      try { setThreadRoot({ ...seed, __threadOpening: false, __threadSeed: true, __threadOpenError: true }) } catch {}
      setOpeningState({
        active: false,
        targetId,
        status: 'error',
        error: str(error?.message || error || 'thread_open_failed'),
      })
    }
  }, [api, setOpeningState, setThreadRoot])

  useEffect(() => {
    hydrateThreadTargetRef.current = hydrateThreadTarget
  }, [hydrateThreadTarget])

  const openThreadForPost = useCallback((post, opts = {}) => {
    if (!post || !post.id) return
    const seed = createThreadSeed(post)
    if (!seed) return
    const topicId = seed.topicId
    const rootId = String(seed.id)
    const entryId = String(opts.entryId || (post?.id ? 'post_' + post.id : '') || '')
    const seq = Number(threadOpenSeqRef.current || 0) + 1
    threadOpenSeqRef.current = seq
    setOpeningState({ active: true, targetId: rootId, status: 'locating', error: '' })
    dispatchServerItemsMerge([seed], 'thread_open_seed')

    if (!opts.skipNav) {
      try { pushNavStateStable(entryId) } catch {}
    }

    pendingScrollToPostIdRef.current = rootId

    try { if (opts.closeInbox) setInboxOpen(false) } catch {}
    try { if (opts.closeVideoFeed) setVideoFeedOpen(false) } catch {}

    if (selId && String(selId) === String(topicId)) {
      const node = idMap?.get?.(rootId) || seed
      try { setThreadRoot({ ...node, __threadOpening: true, __threadSeed: !idMap?.get?.(rootId) }) } catch {}
      try { hydrateThreadTarget(seed, seq) } catch {}
      return
    }

    const topic = (dataTopics || []).find((item) => String(item.id) === String(topicId))
      || (
        topicId
          ? {
              ...(post?.topic && typeof post.topic === 'object' ? post.topic : {}),
              id: topicId,
              topicId,
              title: str(post?.topic?.title || post?.topicTitle || ''),
            }
          : null
      )
    if (!topic) {
      setOpeningState({ active: false, targetId: rootId, status: 'error', error: 'missing_topic' })
      return
    }
    pendingThreadRootIdRef.current = rootId
    pendingThreadRootSeedRef.current = seed
    try { setSel(topic) } catch {}
  }, [
    createThreadSeed,
    selId,
    dataTopics,
    idMap,
    pushNavStateStable,
    setInboxOpen,
    setVideoFeedOpen,
    setThreadRoot,
    setSel,
    setOpeningState,
    hydrateThreadTarget,
  ])

  const idMapForPendingRootRef = useRef(idMap)
  const dataPostsForPendingRootRef = useRef(dataPosts)

  useEffect(() => {
    idMapForPendingRootRef.current = idMap
  }, [idMap])

  useEffect(() => {
    dataPostsForPendingRootRef.current = dataPosts
  }, [dataPosts])

  useEffect(() => {
    const navPendingId = navPendingThreadRootRef.current
    const pendingId = navPendingId || pendingThreadRootIdRef.current
    const currentTopicId = str(selId)
    const previousTopicId = str(lastSelectedTopicIdRef.current)
    const topicChanged = previousTopicId !== currentTopicId
    lastSelectedTopicIdRef.current = currentTopicId

    if (pendingId) {
      if (navPendingId) navPendingThreadRootRef.current = null
      else pendingThreadRootIdRef.current = null

      const node = idMapForPendingRootRef.current?.get?.(String(pendingId))
        || (dataPostsForPendingRootRef.current || []).find((item) => String(item.id) === String(pendingId))
        || pendingThreadRootSeedRef.current
        || null
      const seed = createThreadSeed(node || pendingThreadRootSeedRef.current || { id: String(pendingId), topicId: selId })
      pendingThreadRootSeedRef.current = null
      const seq = Number(threadOpenSeqRef.current || 0)
      try { setThreadRoot({ ...(seed || { id: String(pendingId), topicId: selId }), __threadOpening: true }) } catch {}
      if (seed) {
        dispatchServerItemsMerge([seed], 'thread_open_pending_seed')
        try { hydrateThreadTarget(seed, seq) } catch {}
      }
      return
    }

    if (navRestoringRef.current) return
    if (!topicChanged) return
    try { setThreadRoot(null) } catch {}
    setOpeningState({ active: false, targetId: '', status: 'idle', error: '' })
  }, [selId, navPendingThreadRootRef, navRestoringRef, setThreadRoot, setOpeningState, createThreadSeed, hydrateThreadTarget])

  useEffect(() => {
    const pendingId = pendingScrollToPostIdRef.current
    if (!pendingId) return
    if (!threadRoot) return
    if (!isBrowserFn?.()) return

    pendingScrollToPostIdRef.current = null

    const timer = setTimeout(() => {
      try {
        const threadStart = document.querySelector('[data-forum-thread-start="1"]')
        const threadRootNode = document.querySelector('[data-thread-branch-root="1"]')
        const threadRootId = String(threadRoot?.id || '')
        try {
          revealForumWindowedDomId(`post_${pendingId}`, { holdMs: 1800 })
        } catch {}
        const targetPost = document.getElementById('post_' + pendingId)
        if (threadRootId && threadRootId === String(pendingId)) {
          if (threadRootNode) {
            alignNodeToThreadTop(threadRootNode)
            return
          }
          if (targetPost) {
            alignNodeToThreadTop(targetPost)
            return
          }
          if (threadStart) {
            alignNodeToThreadTop(threadStart)
            return
          }
        }
        if (targetPost) {
          alignNodeToThreadTop(targetPost)
          return
        }
        if (threadStart) alignNodeToThreadTop(threadStart)
      } catch {}
    }, 120)

    return () => clearTimeout(timer)
  }, [alignNodeToThreadTop, isBrowserFn, selId, threadRoot])

  return {
    openThreadForPost,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
    threadOpening,
  }
}
