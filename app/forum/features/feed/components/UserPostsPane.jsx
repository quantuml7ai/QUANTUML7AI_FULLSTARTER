'use client'

import React from 'react'

export default function UserPostsPane({
  t,
  branchUserNick,
  branchUserId,
  onClearBranch,
  visibleUserPosts,
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
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  userPostsHasMore,
  setVisibleUserPostsCount,
  userPostsPageSize,
  allUserPostsLength,
  PostCard,
  LoadMoreSentinel,
}) {
  const userLabel = String(branchUserNick || resolveNickForDisplay?.(branchUserId, '') || branchUserId || '').trim()

  return (
    <>
      <div className="userBranchHeader">
        <div className="userBranchTitle">
          {t?.('forum_user_popover_posts')}:
          {' '}
          <span className="userBranchTitleNick" translate="no">{userLabel || '...'}</span>
        </div>
        <button
          type="button"
          className="userBranchClose"
          onClick={onClearBranch}
          aria-label={t?.('forum_back') || 'Back'}
          title={t?.('forum_back') || 'Back'}
        >
          <span aria-hidden>&times;</span>
        </button>
      </div>

      {(visibleUserPosts || []).map((p) => {
        const parent = p?.parentId ? (dataPosts || []).find((x) => String(x.id) === String(p.parentId)) : null
        return (
          <div key={`uprofile:${p?.id || ''}`} id={`post_${p?.id || ''}`} data-feed-card="1" data-feed-kind="post">
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

      {userPostsHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">{t?.('loading')}</div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleUserPostsCount((c) =>
                Math.min(c + userPostsPageSize, allUserPostsLength),
              )
            }
          />
        </div>
      )}

      {allUserPostsLength === 0 && (
        <div className="meta">{t?.('forum_no_posts_yet')}</div>
      )}
    </>
  )
}
