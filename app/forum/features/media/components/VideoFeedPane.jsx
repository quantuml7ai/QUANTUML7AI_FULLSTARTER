'use client'

import React from 'react'
import UserRecommendationsRail from '../../feed/components/UserRecommendationsRail'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'

const VIDEO_THREAD_OPEN_OPTIONS = Object.freeze({
  closeInbox: true,
  closeVideoFeed: true,
})

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`forum-skeleton-video:${index}`} className="forumSkeletonCard" aria-hidden="true">
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
  videoServerLoading,
  videoServerHasMore,
  loadVideoFeedPage,
  setVisibleVideoCount,
  visibleVideoCount,
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

  const loadedVideoCount = Number((videoFeed || []).length || 0)
  const currentVisibleVideoCount = Number(visibleVideoCount || 0)
  const localVideoHasMore = currentVisibleVideoCount < loadedVideoCount
  const serverVideoHasMore = !!videoServerHasMore
  const showVideoLoadFooter = loadedVideoCount > 0 && (localVideoHasMore || serverVideoHasMore || !!videoServerLoading)
  const showInitialVideoSkeleton = !!videoServerLoading && loadedVideoCount === 0

  React.useEffect(() => {
    // QL7_GEO111_MEDIA_FEED_PREFETCH_NEAR_END_V1
    if (!serverVideoHasMore) return
    if (videoServerLoading) return
    if (typeof loadVideoFeedPage !== 'function') return
    const winEnd = Number(vfWin?.end || 0)
    const threshold = Math.max(6, Math.floor(Number(videoPageSize || 20) * 0.6))
    if (loadedVideoCount > 0 && winEnd > 0 && loadedVideoCount - winEnd <= threshold) {
      loadVideoFeedPage({ prefetch: true })
    }
  }, [serverVideoHasMore, videoServerLoading, loadVideoFeedPage, loadedVideoCount, vfWin?.end, videoPageSize])

  return (
    <>
      <div data-forum-video-start="1" />
      <div className="meta">{t('')}</div>
      <div
        className="grid gap-2"
        data-ql7-video-feed-grid="1"
        data-vf-win-start={vfWin.start}
        data-vf-win-end={vfWin.end}
        data-vf-win-top={Math.round(Number(vfWin.top || 0))}
        data-vf-win-bottom={Math.round(Number(vfWin.bottom || 0))}
        suppressHydrationWarning
      >
        {showInitialVideoSkeleton && (
          <ForumPaneSkeleton rows={4} label={t?.('loading') || 'Loading'} />
        )}

        {!showInitialVideoSkeleton && vfWin.top > 0 && <div aria-hidden="true" style={{ height: vfWin.top }} />}

        {!showInitialVideoSkeleton && vfSlots.slice(vfWin.start, vfWin.end).map((slot) => {
          if (slot.type === 'recommendation_rail') {
            const railState = userRecommendationsRail?.getSlotState?.(slot.key) || null
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(slot.key)}
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
                ref={vfMeasureRef(slot.key)}
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
              <div key={slot.key} ref={vfMeasureRef(slot.key)}>
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
            <div key={slot.key} ref={vfMeasureRef(slot.key)}>
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

        {!showInitialVideoSkeleton && vfWin.bottom > 0 && <div aria-hidden="true" style={{ height: vfWin.bottom }} />}

        {!showInitialVideoSkeleton && showVideoLoadFooter && (
          <div className="loadMoreFooter">
            {(serverVideoHasMore || videoServerLoading) && (
              <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
            )}
            <LoadMoreSentinel
              onVisible={() => {
                // QL7_GEO111_MEDIA_FEED_SERVER_SENTINEL_V1
                try {
                  if (localVideoHasMore) {
                    setVisibleVideoCount((c) =>
                      Math.min(c + videoPageSize, Math.max((videoFeed || []).length, c)),
                    )
                    return
                  }
                  if (!videoServerLoading && serverVideoHasMore && typeof loadVideoFeedPage === 'function') {
                    Promise.resolve(loadVideoFeedPage()).then((res) => {
                      if (res?.ok === false) return
                      setVisibleVideoCount((c) => c + videoPageSize)
                    }).catch(() => {})
                  }
                } catch {}
              }}
            />
          </div>
        )}

        {!videoServerLoading && videoFeed?.length === 0 && (
          <div className="meta">
            {t('forum_search_empty')}
          </div>
        )}
      </div>
    </>
  )
}
