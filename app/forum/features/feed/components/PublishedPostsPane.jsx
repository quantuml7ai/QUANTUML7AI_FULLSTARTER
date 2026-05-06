'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  estimateForumPostSlotHeight,
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

const CLOSE_INBOX_THREAD_OPTIONS = Object.freeze({
  closeInbox: true,
})

export default function PublishedPostsPane({
  visiblePublishedPosts,
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
  publishedHasMore,
  setVisiblePublishedCount,
  publishedPageSize,
  myPublishedPostsLength,
  PostCard,
  ForumAdSlot,
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

  const publishedSlots = React.useMemo(
    () => {
      const items = visiblePublishedPosts || []
      if (typeof interleaveAds !== 'function' || typeof debugAdsSlots !== 'function') {
        return items.map((item, index) => ({
          type: 'item',
          item,
          key: `item:${String(item?.id || `published:${index}`)}`,
        }))
      }
      return debugAdsSlots(
        'published',
        interleaveAds(
          items,
          adEvery,
          {
            isSkippable: (p) => !p || !p.id,
            getId: (p) => p?.id,
          },
        ),
      )
    },
    [adEvery, debugAdsSlots, interleaveAds, visiblePublishedPosts],
  )

  const { win: publishedWin, measureRef: publishedMeasureRef } = useForumWindowing({
    active: true,
    items: publishedSlots,
    getItemKey: (slot, index) => String(slot?.key || `published:${slot?.item?.id || index}`),
    getItemDomId: (slot) => (
      slot?.type === 'item' && slot?.item?.id
        ? `post_${slot.item.id}`
        : ''
    ),
    estimateItemHeight: ({ item }) => (
      item?.type === 'item'
        ? estimateForumPostSlotHeight(item)
        : readForumCardEstimate('ad')
    ),
    maxRender: () => readForumWindowingMaxRender('post'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('post', velocity),
    listId: 'forum:published-posts',
  })

  return (
    <>
      {publishedWin.top > 0 && <div aria-hidden="true" style={{ height: publishedWin.top }} />}
      {publishedSlots.slice(publishedWin.start, publishedWin.end).map((slot) => {
        if (slot.type !== 'item') {
          const url = pickAdUrlForSlot?.(slot.key, 'published')
          if (!url || !ForumAdSlot) {
            return (
              <div key={slot.key} ref={publishedMeasureRef(slot.key)}>
                <div
                  className="forumAdSlotPlaceholder mediaBox"
                  data-kind="ad"
                  data-slotkind="published"
                  data-slotkey={slot.key}
                  aria-hidden="true"
                />
              </div>
            )
          }

          return (
            <div key={slot.key} ref={publishedMeasureRef(slot.key)}>
              {ForumAdSlot ? (
                <ForumAdSlot
                  slotKey={slot.key}
                  url={url}
                  slotKind="published"
                  nearId={slot.nearId}
                  onResizeDelta={compensateScrollOnResize}
                />
              ) : null}
            </div>
          )
        }

        const p = slot.item
        const parent = p?.parentId ? (postsById.get(String(p.parentId)) || null) : null
        const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
        const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
        const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
        return (
          <div
            key={slot.key}
            ref={publishedMeasureRef(slot.key)}
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
