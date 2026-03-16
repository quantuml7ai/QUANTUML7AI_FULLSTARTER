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
        document.getElementById('post_' + pendingId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      } catch {}
    }, 120)

    return () => clearTimeout(timer)
  }, [selId, threadRoot, isBrowserFn])

  return {
    openThreadForPost,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
  }
}
