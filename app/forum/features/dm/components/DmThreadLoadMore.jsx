'use client'

import React from 'react'

export default function DmThreadLoadMore({
  dmThreadHasMore,
  dmThreadLoading,
  dmThreadCursor,
  dmWithUserId,
  loadDmThread,
  t,
  LoadMoreSentinel,
}) {
  if (!dmThreadHasMore) return null
  return (
    <>
      <div className="loadMoreFooter dmLoadMoreFooter">
        <div className="loadMoreShimmer">
          {t?.('loading')}
        </div>
      </div>
      <LoadMoreSentinel
        disabled={dmThreadLoading || !dmThreadHasMore}
        onVisible={() => {
          if (dmThreadCursor) loadDmThread(dmWithUserId, dmThreadCursor)
        }}
      />
    </>
  )
}
