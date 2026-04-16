'use client'

import React from 'react'
import UserRecommendationsRail from '../../feed/components/UserRecommendationsRail'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'

const VIDEO_THREAD_OPEN_OPTIONS = Object.freeze({
  closeInbox: true,
  closeVideoFeed: true,
})

export default function VideoFeedPane({
  t,
  vfWin,
  vfSlots,
  vfMeasureRef,
  dataPosts,
  openThreadForPost,
  resolveNickForDisplay,
  openReportPopover,
  openSharePopover,
  reactMut,
  isAdmin,
  delPost,
  delPostOwn,
  banUser,
  unbanUser,
  bannedSet,
  viewerId,
  markViewPost,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  pickAdUrlForSlot,
  compensateScrollOnResize,
  videoHasMore,
  setVisibleVideoCount,
  videoPageSize,
  videoFeed,
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
  userRecommendationsRail,
  userRecommendationsRuntime,
  onOpenUserPosts,
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

  const handleOpenThread = React.useCallback((post, options) => {
    openThreadForPost(post, options)
  }, [openThreadForPost])

  return (
    <>
      <div data-forum-video-start="1" />
      <div className="meta">{t('')}</div>
      <div className="grid gap-2" suppressHydrationWarning>
        {vfWin.top > 0 && <div aria-hidden="true" style={{ height: vfWin.top }} />}

        {vfSlots.slice(vfWin.start, vfWin.end).map((slot, indexInWindow) => {
          const index = vfWin.start + indexInWindow
          if (slot.type === 'recommendation_rail') {
            const railState = userRecommendationsRail?.getSlotState?.(slot.key) || null
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(index)}
                data-feed-card="1"
                data-feed-kind="recommendation_rail"
              >
                <UserRecommendationsRail
                  t={t}
                  railState={railState}
                  onOpenUserPosts={onOpenUserPosts}
                  hideScrollbar={!!userRecommendationsRuntime?.hideScrollbar}
                  desktopArrows={!!userRecommendationsRuntime?.desktopArrows}
                />
              </div>
            )
          }

          if (slot.type === 'item') {
            const p = slot.item
            const parent = p?.parentId ? (postsById.get(String(p.parentId)) || null) : null
            const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
            const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
            const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(index)}
                id={`post_${p?.id || ''}`}
                data-feed-card="1"
                data-feed-kind="post"
              >
                <PostCard
                  p={p}
                  parentPost={parent}
                  parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
                  parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
                  onReport={openReportPopover}
                  onShare={openSharePopover}
                  onOpenThread={handleOpenThread}
                  threadOpenOptions={VIDEO_THREAD_OPEN_OPTIONS}
                  onReact={reactMut}
                  isAdmin={isAdmin}
                  onDeletePost={delPost}
                  onOwnerDelete={delPostOwn}
                  onBanUser={banUser}
                  onUnbanUser={unbanUser}
                  isBanned={bannedSet.has(p?.accountId || p?.userId)}
                  authId={viewerId}
                  markView={markViewPost}
                  t={t}
                  isVideoFeed={true}
                  isSelfAuthor={isSelfAuthor}
                  isStarredAuthor={isStarredAuthor}
                  onToggleStar={toggleAuthorStar}
                  onUserInfoToggle={handleUserInfoToggle}
                />
              </div>
            )
          }

          const url = pickAdUrlForSlot(slot.key, 'video')
          if (!url) {
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(index)}
                data-feed-card="1"
                data-feed-kind="ad"
              >
                <div
                  className="forumAdSlotPlaceholder mediaBox"
                  data-kind="ad"
                  data-slotkind="video"
                  data-slotkey={slot.key}
                  aria-hidden="true"
                />
              </div>
            )
          }

          return (
            <div
              key={slot.key}
              ref={vfMeasureRef(index)}
              data-feed-card="1"
              data-feed-kind="ad"
            >
              <ForumAdSlot
                slotKey={slot.key}
                url={url}
                slotKind="video"
                nearId={slot.nearId}
                onResizeDelta={compensateScrollOnResize}
              />
            </div>
          )
        })}

        {vfWin.bottom > 0 && <div aria-hidden="true" style={{ height: vfWin.bottom }} />}

        {videoHasMore && (
          <div className="loadMoreFooter">
            <div className="loadMoreShimmer">
              {t?.('loading')}
            </div>
            <LoadMoreSentinel
              onVisible={() =>
                setVisibleVideoCount((c) =>
                  Math.min(c + videoPageSize, (videoFeed || []).length),
                )
              }
            />
          </div>
        )}

        {videoFeed?.length === 0 && (
          <div className="meta">
            {t('forum_search_empty')}
          </div>
        )}
      </div>
    </>
  )
}
