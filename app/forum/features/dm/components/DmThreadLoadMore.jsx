'use client'

import React, { useEffect, useRef } from 'react'

export default function DmThreadLoadMore({
  dmThreadHasMore,
  dmThreadLoading,
  dmThreadCursor,
  dmWithUserId,
  loadDmThread,
  t,
  LoadMoreSentinel,
}) {
  const requestedCursorRef = useRef({ key: '', ts: 0 })
  const anchorRef = useRef(null)

  useEffect(() => {
    requestedCursorRef.current = { key: '', ts: 0 }
  }, [dmWithUserId, dmThreadCursor])

  const requestNextPage = React.useCallback(() => {
    if (dmThreadLoading || !dmThreadHasMore || !dmThreadCursor) return
    const key = `${String(dmWithUserId || '').trim()}:${String(dmThreadCursor || '').trim()}`
    const now = Date.now()
    const prev = requestedCursorRef.current || { key: '', ts: 0 }
    if (prev.key === key && (now - Number(prev.ts || 0)) < 2200) return
    requestedCursorRef.current = { key, ts: now }
    loadDmThread(dmWithUserId, dmThreadCursor)
  }, [dmThreadCursor, dmThreadHasMore, dmThreadLoading, dmWithUserId, loadDmThread])

  useEffect(() => {
    if (!dmThreadHasMore || dmThreadLoading || !dmThreadCursor || typeof window === 'undefined') return undefined
    let rafId = 0
    const checkNearHistoryEnd = () => {
      rafId = 0
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = Number(window.innerHeight || 0) || 0
      if (rect.top - vh <= 1800 && rect.bottom >= -400) requestNextPage()
    }
    const queue = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(checkNearHistoryEnd)
    }
    queue()
    const timers = [180, 520, 1100].map((ms) => window.setTimeout(queue, ms))
    window.addEventListener('scroll', queue, { passive: true, capture: true })
    window.addEventListener('resize', queue, { passive: true })
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      timers.forEach((timerId) => window.clearTimeout(timerId))
      window.removeEventListener('scroll', queue, { capture: true })
      window.removeEventListener('resize', queue)
    }
  }, [dmThreadCursor, dmThreadHasMore, dmThreadLoading, requestNextPage])

  if (!dmThreadHasMore) return null
  return (
    <div ref={anchorRef} data-dm-thread-loadmore-anchor="1">
      <div className="loadMoreFooter dmLoadMoreFooter">
        <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
      </div>
      <LoadMoreSentinel
        disabled={dmThreadLoading || !dmThreadHasMore}
        rootMargin="1800px 0px"
        repeatMs={650}
        onVisible={requestNextPage}
      />
    </div>
  )
}
