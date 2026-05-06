'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

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
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
}) {
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
        visibleFlat || [],
        adEvery,
        {
          isSkippable: (p) => !p || !p.id,
          getId: (p) => p?.id,
        },
      ),
    ),
    [adEvery, debugAdsSlots, interleaveAds, visibleFlat],
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
    itemGapPx: 8,
    maxRender: () => readForumWindowingMaxRender('post'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('post', velocity),
    listId: 'forum:thread-replies',
  })

  return (
    <div className="grid gap-2 threadRepliesPane">
      {threadWin.top > 0 && <div aria-hidden="true" style={{ height: threadWin.top }} />}
      {threadSlots.slice(threadWin.start, threadWin.end).map((slot) => {
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
      {threadWin.bottom > 0 && <div aria-hidden="true" style={{ height: threadWin.bottom }} />}
      {threadHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading')}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleThreadPostsCount((c) =>
                Math.min(c + threadPageSize, flatLength),
              )
            }
          />
        </div>
      )}
      {(!threadRoot && flatLength === 0) && (
        <div className="meta">
          {t('forum_no_posts_yet')}
        </div>
      )}
    </div>
  )
}
