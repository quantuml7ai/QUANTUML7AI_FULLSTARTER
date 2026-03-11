'use client'

import React from 'react'

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
}) {
  return (
    <>
      <div data-forum-video-start="1" />
      <div className="meta">{t('')}</div>
      <div className="grid gap-2" suppressHydrationWarning>
        {vfWin.top > 0 && <div aria-hidden="true" style={{ height: vfWin.top }} />}

        {vfSlots.slice(vfWin.start, vfWin.end).map((slot, indexInWindow) => {
          const index = vfWin.start + indexInWindow
          if (slot.type === 'item') {
            const p = slot.item
            const parent = p?.parentId
              ? (dataPosts || []).find((x) => String(x.id) === String(p.parentId))
              : null
            const openThreadHere = (clickP) => {
              openThreadForPost(clickP || p, { closeInbox: true, closeVideoFeed: true })
            }
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
                  onReport={(post, rect, anchorEl) => openReportPopover(post, rect, anchorEl)}
                  onShare={(post) => openSharePopover(post)}
                  onOpenThread={openThreadHere}
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
                  viewerId={viewerId}
                  starredAuthors={starredAuthors}
                  onToggleStar={toggleAuthorStar}
                  onUserInfoToggle={handleUserInfoToggle}
                />
              </div>
            )
          }

          const url = pickAdUrlForSlot(slot.key, 'video')
          if (!url) return null

          return (
            <div key={slot.key} ref={vfMeasureRef(index)}>
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

