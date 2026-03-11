'use client'

import React from 'react'

export default function ThreadRepliesPane({
  visibleFlat,
  adEvery,
  interleaveAds,
  debugAdsSlots,
  allPosts,
  resolveNickForDisplay,
  openReportPopover,
  openSharePopover,
  setReplyTo,
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
  return (
    <div className="grid gap-2">
      {debugAdsSlots(
        'replies',
        interleaveAds(
          visibleFlat || [],
          adEvery,
          {
            isSkippable: (p) => !p || !p.id,
            getId: (p) => p?.id,
          },
        ),
      ).map((slot) => {
        if (slot.type === 'item') {
          const p = slot.item
          const parent = p.parentId
            ? allPosts.find((x) => String(x.id) === String(p.parentId))
            : null

          return (
            <div
              key={slot.key}
              id={`post_${p.id}`}
              data-feed-card="1"
              data-feed-kind="post"
              style={{ marginLeft: (p._lvl || 0) * 18 }}
            >
              <PostCard
                p={p}
                parentPost={parent}
                parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
                parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
                onReport={(post, rect, anchorEl) => openReportPopover(post, rect, anchorEl)}
                onShare={(post) => openSharePopover(post)}
                onReply={() => setReplyTo(p)}
                onOpenThread={(clickP) => { openThreadForPost(clickP || p) }}
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

        const url = pickAdUrlForSlot(slot.key, 'replies')
        if (!url) return null

        return (
          <ForumAdSlot
            key={slot.key}
            slotKey={slot.key}
            url={url}
            slotKind="replies"
            nearId={slot.nearId}
            onResizeDelta={compensateScrollOnResize}
          />
        )
      })}
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

