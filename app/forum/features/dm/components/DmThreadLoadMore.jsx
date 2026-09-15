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
  const retryTimerRef = useRef(0)
  const retryAttemptRef = useRef(0)
  const [retryKey, setRetryKey] = React.useState(0)

  const clearRetryTimer = React.useCallback(() => {
    if (!retryTimerRef.current || typeof window === 'undefined') return
    try { window.clearTimeout(retryTimerRef.current) } catch {}
    retryTimerRef.current = 0
  }, [])

  useEffect(() => {
    clearRetryTimer()
    retryAttemptRef.current = 0
    setRetryKey(0)
  }, [clearRetryTimer, dmWithUserId, dmThreadCursor])

  useEffect(() => () => clearRetryTimer(), [clearRetryTimer])

  const scheduleRetryRearm = React.useCallback(() => {
    if (typeof window === 'undefined') return
    clearRetryTimer()
    const attempt = Math.max(1, Number(retryAttemptRef.current || 0) + 1)
    retryAttemptRef.current = attempt
    const delay = Math.min(8000, 1800 * (2 ** Math.min(2, attempt - 1)))
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = 0
      setRetryKey((value) => Number(value || 0) + 1)
    }, delay)
  }, [clearRetryTimer])

  const requestNextPage = React.useCallback(async () => {
    if (dmThreadLoading || !dmThreadHasMore || !dmThreadCursor) return
    try {
      const result = await loadDmThread(dmWithUserId, dmThreadCursor)
      if (result?.retryable === true && !result?.stale && result?.reason !== 'history_complete') {
        scheduleRetryRearm()
      } else if (result?.ok) {
        clearRetryTimer()
        retryAttemptRef.current = 0
      }
    } catch {
      scheduleRetryRearm()
    }
  }, [clearRetryTimer, dmThreadCursor, dmThreadHasMore, dmThreadLoading, dmWithUserId, loadDmThread, scheduleRetryRearm])

  if (!dmThreadHasMore) return null
  const pending = !!dmThreadLoading
  return (
    <div data-dm-thread-loadmore-anchor="1">
      <div
        className="loadMoreFooter dmLoadMoreFooter"
        style={{ visibility: pending ? 'visible' : 'hidden' }}
        aria-hidden={pending ? undefined : 'true'}
      >
        {pending && (
          <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
        )}
      </div>
      <LoadMoreSentinel
        disabled={pending || !dmThreadHasMore || !dmThreadCursor}
        pending={pending}
        hasMore={!!dmThreadHasMore && !!dmThreadCursor}
        loadKey={`dm-thread:${String(dmWithUserId || '')}:${String(dmThreadCursor || '')}`}
        retryKey={String(retryKey)}
        rootMargin="1800px 0px"
        onVisible={requestNextPage}
      />
    </div>
  )
}
