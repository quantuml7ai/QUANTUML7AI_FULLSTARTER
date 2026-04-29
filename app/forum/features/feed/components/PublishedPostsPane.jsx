'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

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

  const { win: publishedWin, measureRef: publishedMeasureRef } = useForumWindowing({
    active: true,
    items: visiblePublishedPosts || [],
    getItemKey: (post, index) => String(post?.id || `published:${index}`),
    getItemDomId: (post) => (post?.id ? `post_${post.id}` : ''),
    estimateItemHeight: () => readForumCardEstimate('post'),
    maxRender: () => readForumWindowingMaxRender('post'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('post', velocity),
    listId: 'forum:published-posts',
  })

  return (
    <>
      {publishedWin.top > 0 && <div aria-hidden="true" style={{ height: publishedWin.top }} />}
      {(visiblePublishedPosts || []).slice(publishedWin.start, publishedWin.end).map((p) => {
        const parent = p?.parentId ? (postsById.get(String(p.parentId)) || null) : null
        const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
        const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
        const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
        return (
          <div
            key={`pub:${p?.id || ''}`}
            ref={publishedMeasureRef(String(p?.id || ''))}
            id={`post_${p?.id || ''}`}
            data-feed-card="1"
            data-feed-kind="post"
          >
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
      {publishedWin.bottom > 0 && <div aria-hidden="true" style={{ height: publishedWin.bottom }} />}
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
