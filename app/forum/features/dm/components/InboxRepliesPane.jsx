'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

const CLOSE_INBOX_THREAD_OPTIONS = Object.freeze({
  closeInbox: true,
})

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`forum-skeleton-inbox:${index}`} className="forumSkeletonCard" aria-hidden="true">
          <div className="forumSkeletonHeader">
            <div className="forumSkeletonAvatar" />
            <div className="forumSkeletonTitle" />
          </div>
          <div className="forumSkeletonBody">
            <div className="forumSkeletonLine" />
            <div className="forumSkeletonLine" />
            <div className="forumSkeletonMedia" />
          </div>
          <div className="forumSkeletonMetrics">
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InboxRepliesPane({
  visibleRepliesToMe,
  adEvery,
  interleaveAds,
  debugAdsSlots,
  dataPosts,
  resolveNickForDisplay,
  openReportPopover,
  openSharePopover,
  openThreadForPost,
  reactMut,
  isAdmin,
  delPost,
  delPostOwn,
  banUser,
  unbanUser,
  bannedSet,
  viewerId,
  markViewPost,
  t,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  pickAdUrlForSlot,
  compensateScrollOnResize,
  repliesHasMore,
  setVisibleRepliesCount,
  repliesPageSize,
  sortedRepliesLength,
  serverRepliesHasMore,
  serverRepliesLoading,
  loadInboxRepliesPage,
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
}) {
  const postsById = React.useMemo(() => {
    const map = new Map()
    for (const post of dataPosts || []) {
      const id = String(post?.id || '').trim()
      if (!id) continue
      map.set(id, post)
    }
    return map
  }, [dataPosts])

  const replySlots = React.useMemo(
    () => debugAdsSlots(
      'inbox',
      interleaveAds(
        visibleRepliesToMe || [],
        adEvery,
        {
          isSkippable: (p) => !p || !p.id,
          getId: (p) => p?.id || `${p?.topicId || 'ib'}:${p?.ts || 0}`,
        },
      ),
    ),
    [adEvery, debugAdsSlots, interleaveAds, visibleRepliesToMe],
  )

  const { win: replyWin, measureRef: replyMeasureRef } = useForumWindowing({
    active: true,
    items: replySlots,
    getItemKey: (slot, index) => String(slot?.key || `inbox:${slot?.item?.id || index}`),
    getItemDomId: (slot) => (
      slot?.type === 'item' && slot?.item?.id
        ? `post_${slot.item.id}`
        : ''
    ),
    estimateItemHeight: ({ item }) => (
      item?.type === 'item'
        ? readForumCardEstimate('post')
        : readForumCardEstimate('ad')
    ),
    maxRender: () => readForumWindowingMaxRender('post'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('post', velocity),
    listId: 'forum:inbox-replies',
  })
  const showInitialRepliesSkeleton = !!serverRepliesLoading && replySlots.length === 0

  return (
    <>
      {showInitialRepliesSkeleton && (
        <ForumPaneSkeleton rows={3} label={t?.('loading') || 'Loading'} />
      )}
      {!showInitialRepliesSkeleton && replyWin.top > 0 && <div aria-hidden="true" style={{ height: replyWin.top }} />}
      {!showInitialRepliesSkeleton && replySlots.slice(replyWin.start, replyWin.end).map((slot) => {
        if (slot.type === 'item') {
          const p = slot.item
          const parent = postsById.get(String(p.parentId)) || null
          const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
          const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
          const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
          return (
            <div
              key={slot.key}
              ref={replyMeasureRef(slot.key)}
              id={`post_${p.id}`}
              className="inboxReplyItem"
              data-reply-id={String(p.id || '')}
              data-feed-card="1"
              data-feed-kind="post"
            >
              <PostCard
                p={p}
                parentPost={parent || null}
                parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : ''}
                parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
                onReport={openReportPopover}
                onShare={openSharePopover}
                onOpenThread={openThreadForPost}
                threadOpenOptions={CLOSE_INBOX_THREAD_OPTIONS}
                onReact={reactMut}
                isAdmin={isAdmin}
                onDeletePost={delPost}
                onOwnerDelete={delPostOwn}
                onBanUser={banUser}
                onUnbanUser={unbanUser}
                isBanned={bannedSet.has(p.accountId || p.userId)}
                authId={viewerId}
                markView={markViewPost}
                t={t}
                isSelfAuthor={isSelfAuthor}
                isStarredAuthor={isStarredAuthor}
                onToggleStar={toggleAuthorStar}
                onUserInfoToggle={handleUserInfoToggle}
              />
            </div>
          )
        }

        const url = pickAdUrlForSlot(slot.key, 'inbox')
        if (!url) {
          return (
            <div
              key={slot.key}
              ref={replyMeasureRef(slot.key)}
            >
              <div
                className="forumAdSlotPlaceholder mediaBox"
                data-kind="ad"
                data-slotkind="inbox"
                data-slotkey={slot.key}
                aria-hidden="true"
              />
            </div>
          )
        }

        return (
          <div
            key={slot.key}
            ref={replyMeasureRef(slot.key)}
          >
            <ForumAdSlot
              slotKey={slot.key}
              url={url}
              slotKind="inbox"
              nearId={slot.nearId}
              onResizeDelta={compensateScrollOnResize}
            />
          </div>
        )
      })}
      {!showInitialRepliesSkeleton && replyWin.bottom > 0 && <div aria-hidden="true" style={{ height: replyWin.bottom }} />}

      {!showInitialRepliesSkeleton && repliesHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
          <LoadMoreSentinel
            disabled={!!serverRepliesLoading}
            onVisible={() => {
              if (serverRepliesHasMore && visibleRepliesToMe.length >= sortedRepliesLength) {
                try { loadInboxRepliesPage?.({ reset: false, reason: 'sentinel' }) } catch {}
                return
              }
              setVisibleRepliesCount((c) =>
                Math.min(c + repliesPageSize, sortedRepliesLength),
              )
            }}
          />
        </div>
      )}
      {!serverRepliesLoading && sortedRepliesLength === 0 && (
        <div className="meta">
          {t('forum_inbox_empty')}
        </div>
      )}
    </>
  )
}
