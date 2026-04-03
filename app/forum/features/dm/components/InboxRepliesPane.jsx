'use client'

import React from 'react'

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
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
}) {
  return (
    <>
      {debugAdsSlots(
        'inbox',
        interleaveAds(
          visibleRepliesToMe || [],
          adEvery,
          {
            isSkippable: (p) => !p || !p.id,
            getId: (p) => p?.id || `${p?.topicId || 'ib'}:${p?.ts || 0}`,
          },
        ),
      ).map((slot) => {
        if (slot.type === 'item') {
          const p = slot.item
          const parent = (dataPosts || []).find((x) => String(x.id) === String(p.parentId))
          return (
            <div
              key={slot.key}
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
                onReport={(post, rect, anchorEl) => openReportPopover(post, rect, anchorEl)}
                onShare={(post) => openSharePopover(post)}
                onOpenThread={(clickP) => {
                  openThreadForPost(clickP || p, { closeInbox: true })
                }}
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
                viewerId={viewerId}
                starredAuthors={starredAuthors}
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
              className="forumAdSlotPlaceholder mediaBox"
              data-kind="ad"
              data-slotkind="inbox"
              data-slotkey={slot.key}
              aria-hidden="true"
            />
          )
        }

        return (
          <ForumAdSlot
            key={slot.key}
            slotKey={slot.key}
            url={url}
            slotKind="inbox"
            nearId={slot.nearId}
            onResizeDelta={compensateScrollOnResize}
          />
        )
      })}

      {repliesHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading')}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleRepliesCount((c) =>
                Math.min(c + repliesPageSize, sortedRepliesLength),
              )
            }
          />
        </div>
      )}
      {sortedRepliesLength === 0 && (
        <div className="meta">
          {t('forum_inbox_empty')}
        </div>
      )}
    </>
  )
}
