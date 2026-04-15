'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'

const CLOSE_INBOX_THREAD_OPTIONS = Object.freeze({
  closeInbox: true,
})

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
  const postsById = React.useMemo(() => {
    const map = new Map()
    for (const post of dataPosts || []) {
      const id = String(post?.id || '').trim()
      if (!id) continue
      map.set(id, post)
    }
    return map
  }, [dataPosts])

  return (
    <>
      {(visiblePublishedPosts || []).map((p) => {
        const parent = p?.parentId ? (postsById.get(String(p.parentId)) || null) : null
        const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
        const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
        const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
        return (
          <div key={`pub:${p?.id || ''}`} id={`post_${p?.id || ''}`} data-feed-card="1" data-feed-kind="post">
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
