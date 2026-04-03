'use client'

import React from 'react'

export default function PublishedPostsPane({
  visiblePublishedPosts,
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
  publishedHasMore,
  setVisiblePublishedCount,
  publishedPageSize,
  myPublishedPostsLength,
  PostCard,
  LoadMoreSentinel,
}) {
  return (
    <>
      {(visiblePublishedPosts || []).map((p) => {
        const parent = p?.parentId ? (dataPosts || []).find((x) => String(x.id) === String(p.parentId)) : null
        return (
          <div key={`pub:${p?.id || ''}`} id={`post_${p?.id || ''}`} data-feed-card="1" data-feed-kind="post">
            <PostCard
              p={p}
              parentPost={parent || null}
              parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : ''}
              parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
              onReport={(post, rect, anchorEl) => openReportPopover(post, rect, anchorEl)}
              onShare={(post) => openSharePopover(post)}
              onOpenThread={(clickP) => { openThreadForPost(clickP || p, { closeInbox: true }) }}
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
      })}
      {publishedHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading')}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisiblePublishedCount((c) =>
                Math.min(c + publishedPageSize, myPublishedPostsLength),
              )
            }
          />
        </div>
      )}
      {myPublishedPostsLength === 0 && (
        <div className="meta">
          {t('empty_published')}
        </div>
      )}
    </>
  )
}

