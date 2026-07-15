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
  const requestedCursorRef = useRef('')

  useEffect(() => {
    requestedCursorRef.current = ''
  }, [dmWithUserId, dmThreadCursor])

  if (!dmThreadHasMore) return null
  return (
    <>
      <div className="loadMoreFooter dmLoadMoreFooter">
        <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
      </div>
      <LoadMoreSentinel
        disabled={dmThreadLoading || !dmThreadHasMore}
        onVisible={() => {
          if (!dmThreadCursor) return
          const key = `${String(dmWithUserId || '').trim()}:${String(dmThreadCursor || '').trim()}`
          if (requestedCursorRef.current === key) return
          requestedCursorRef.current = key
          loadDmThread(dmWithUserId, dmThreadCursor)
        }}
      />
    </>
  )
}
