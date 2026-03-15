import { useCallback, useEffect, useRef } from 'react'

export default function useThreadOpenNavigation({
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
  const pendingScrollToPostIdRef = useRef(null)
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

  const openThreadForPost = useCallback((post, opts = {}) => {
    if (!post || !post.id) return
    const topicId = post.topicId
    const rootId = String(post.id)
    const entryId = String(opts.entryId || (post?.id ? 'post_' + post.id : '') || '')

    if (!opts.skipNav) {
      try { pushNavStateStable(entryId) } catch {}
    }

    pendingScrollToPostIdRef.current = rootId

    try { if (opts.closeInbox) setInboxOpen(false) } catch {}
    try { if (opts.closeVideoFeed) setVideoFeedOpen(false) } catch {}

    if (selId && String(selId) === String(topicId)) {
      const node = idMap?.get?.(rootId) || post
      try { setThreadRoot(node) } catch {}
      return
    }

    const topic = (dataTopics || []).find((item) => String(item.id) === String(topicId))
    if (!topic) return
    pendingThreadRootIdRef.current = rootId
    try { setSel(topic) } catch {}
  }, [
    selId,
    dataTopics,
    idMap,
    pushNavStateStable,
    setInboxOpen,
    setVideoFeedOpen,
    setThreadRoot,
    setSel,
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

    if (pendingId) {
      if (navPendingId) navPendingThreadRootRef.current = null
      else pendingThreadRootIdRef.current = null

      const node = idMapForPendingRootRef.current?.get?.(String(pendingId))
        || (dataPostsForPendingRootRef.current || []).find((item) => String(item.id) === String(pendingId))
        || null
      try { setThreadRoot(node || { id: String(pendingId) }) } catch {}
      return
    }

    if (navRestoringRef.current) return
    try { setThreadRoot(null) } catch {}
  }, [selId, navPendingThreadRootRef, navRestoringRef, setThreadRoot])

  useEffect(() => {
    const pendingId = pendingScrollToPostIdRef.current
    if (!pendingId) return
    if (!threadRoot) return
    if (!isBrowserFn?.()) return

    pendingScrollToPostIdRef.current = null

    const timer = setTimeout(() => {
      try {
        const threadStart = document.querySelector('[data-forum-thread-start="1"]')
        const threadRootId = String(threadRoot?.id || '')
        if (threadStart && threadRootId && threadRootId === String(pendingId)) {
          alignNodeToThreadTop(threadStart)
          return
        }
        const targetPost = document.getElementById('post_' + pendingId)
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
  }
}
