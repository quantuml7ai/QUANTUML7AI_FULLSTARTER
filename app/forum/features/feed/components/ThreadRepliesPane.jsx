'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`forum-skeleton-thread:${index}`} className="forumSkeletonCard" aria-hidden="true">
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

export default function ThreadRepliesPane({
  visibleFlat,
  adEvery,
  interleaveAds,
  debugAdsSlots,
  allPosts,
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
  threadHasMore,
  setVisibleThreadPostsCount,
  threadPageSize,
  flatLength,
  threadRoot,
  topicRootsLoading,
  topicRootsReady,
  topicRootsHasMore,
  loadTopicRootsPage,
  threadOpening,
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
}) {
  const threadOpeningActive = Boolean(
    threadRoot &&
    (
      threadOpening?.active ||
      threadRoot?.__threadOpening
    ),
  )
  const visibleCount = Number((visibleFlat || []).length || 0)
  const showCenterOpeningLoader = threadOpeningActive && visibleCount === 0
  const showInlineOpeningLoader = threadOpeningActive && visibleCount > 0 && Number(flatLength || 0) <= 1
  const topicRootsLoadingActive = !threadRoot && Boolean(topicRootsLoading)
  const topicRootsPending = !threadRoot && topicRootsReady === false
  const visibleRows = React.useMemo(
    () => (topicRootsPending ? [] : (visibleFlat || [])),
    [topicRootsPending, visibleFlat],
  )
  const renderVisibleCount = Number(visibleRows.length || 0)
  const showCenterTopicLoader = topicRootsPending || (topicRootsLoadingActive && renderVisibleCount === 0)
  const showInlineTopicLoader = !topicRootsPending && topicRootsLoadingActive && renderVisibleCount > 0
  const canLoadMoreThread = !topicRootsPending && Boolean(threadHasMore || (!threadRoot && topicRootsHasMore))

  const postsById = React.useMemo(() => {
    const map = new Map()
    for (const post of allPosts || []) {
      const id = String(post?.id || '').trim()
      if (!id) continue
      map.set(id, post)
    }
    return map
  }, [allPosts])

  const threadSlots = React.useMemo(
    () => debugAdsSlots(
      'replies',
      interleaveAds(
        visibleRows,
        adEvery,
        {
          isSkippable: (p) => !p || !p.id,
          getId: (p) => p?.id,
        },
      ),
    ),
    [adEvery, debugAdsSlots, interleaveAds, visibleRows],
  )

  const { win: threadWin, measureRef: threadMeasureRef } = useForumWindowing({
    active: true,
    items: threadSlots,
    getItemKey: (slot, index) => String(slot?.key || `thread:${slot?.item?.id || index}`),
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
    listId: 'forum:thread-replies',
  })

  const showInitialThreadSkeleton = showCenterOpeningLoader || showCenterTopicLoader

  return (
    <div
      className="grid gap-2 threadRepliesPane"
      data-thread-replies-pane="1"
      data-thread-replies-mode={threadRoot ? 'branch' : 'topic-roots'}
    >
      <div data-thread-replies-start="1" aria-hidden="true" />
      {!showInitialThreadSkeleton && threadWin.top > 0 && (
        <div
          data-thread-window-top-spacer="1"
          aria-hidden="true"
          style={{ height: threadWin.top }}
        />
      )}
      {showInitialThreadSkeleton && (
        <ForumPaneSkeleton rows={3} label={t?.('loading') || 'Loading'} />
      )}
      {!showInitialThreadSkeleton && threadSlots.slice(threadWin.start, threadWin.end).map((slot, renderedIndex) => {
        const slotIndex = Number(threadWin.start || 0) + renderedIndex
        if (slot.type === 'item') {
          const p = slot.item
const isThreadBranchRoot =
  !!threadRoot &&
  String(p?.id || '') === String(threadRoot?.id || '')
const isThreadBranchReply = !!threadRoot && !isThreadBranchRoot
const visualLevel = Number(p?._lvl || 0)
const offsetLevel = threadRoot ? Math.max(0, visualLevel - 1) : visualLevel
const replyIndent = Math.min(64, 12 + (Math.max(1, offsetLevel) * 14))
          const parent = p.parentId
            ? (
              isThreadBranchRoot
                ? null
                : (postsById.get(String(p.parentId)) || null)
            )
            : null
          const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
          const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
          const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)

          return (
            <div
              key={slot.key}
              ref={threadMeasureRef(slot.key)}
              id={`post_${p.id}`}
              data-feed-card="1"
              data-feed-kind="post"
              data-thread-slot-index={slotIndex}
              data-thread-list-first-card={slotIndex === 0 ? '1' : undefined}
data-thread-branch-root={isThreadBranchRoot ? '1' : undefined}
data-thread-branch-child={isThreadBranchReply ? '1' : undefined}
className={
  isThreadBranchRoot
    ? 'threadBranchRootCard'
    : (isThreadBranchReply ? 'threadBranchReplyEntry' : undefined)
}
style={
  isThreadBranchReply
    ? {
        '--thread-reply-indent': `${replyIndent}px`,
      }
    : undefined
}
            >
              <PostCard
                p={p}
                parentPost={parent}
                parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
                parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
                onReport={openReportPopover}
                onShare={openSharePopover}
                onOpenThread={openThreadForPost}
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
              {isThreadBranchRoot && (
                <div
                  className="forumDividerRail forumDividerRail--gold threadBranchRootRail"
                  aria-hidden="true"
                />
              )}
            </div>
          )
        }

        const url = pickAdUrlForSlot(slot.key, 'replies')
        if (!url) {
          return (
            <div
              key={slot.key}
              ref={threadMeasureRef(slot.key)}
            >
              <div
                className="forumAdSlotPlaceholder mediaBox"
                data-kind="ad"
                data-slotkind="replies"
                data-slotkey={slot.key}
                aria-hidden="true"
              />
            </div>
          )
        }

        return (
          <div
            key={slot.key}
            ref={threadMeasureRef(slot.key)}
          >
            <ForumAdSlot
              slotKey={slot.key}
              url={url}
              slotKind="replies"
              nearId={slot.nearId}
              onResizeDelta={compensateScrollOnResize}
            />
          </div>
        )
      })}
      {!showInitialThreadSkeleton && threadWin.bottom > 0 && <div aria-hidden="true" style={{ height: threadWin.bottom }} />}
      {(showInlineOpeningLoader || showInlineTopicLoader) && (
        <div className="threadOpeningLoader threadOpeningLoader--inline" role="status" aria-live="polite">
          <div className="threadOpeningSpinner" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      {canLoadMoreThread && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
          <LoadMoreSentinel
            onVisible={() => {
              if (!threadRoot && topicRootsHasMore && !topicRootsLoadingActive && typeof loadTopicRootsPage === 'function') {
                loadTopicRootsPage()
              }
              setVisibleThreadPostsCount((c) => (
                !threadRoot && topicRootsHasMore
                  ? c + threadPageSize
                  : Math.min(c + threadPageSize, flatLength)
              ))
            }}
          />
        </div>
      )}
      {(!threadRoot && !topicRootsPending && !topicRootsLoadingActive && flatLength === 0) && (
        <div className="meta">
          {t('forum_no_posts_yet')}
        </div>
      )}
    </div>
  )
}
