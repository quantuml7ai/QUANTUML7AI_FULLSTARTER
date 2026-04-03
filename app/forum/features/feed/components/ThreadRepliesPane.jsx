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
    <div className="grid gap-2 threadRepliesPane">
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
          const isThreadBranchRoot =
            !!threadRoot &&
            String(p?.id || '') === String(threadRoot?.id || '')
          const visualLevel = Number(p?._lvl || 0)
          const offsetLevel = threadRoot ? Math.max(0, visualLevel - 1) : visualLevel
          const replyIndent = Math.min(64, 12 + (Math.max(1, offsetLevel) * 14))
          const parent = p.parentId
            ? (
              isThreadBranchRoot
                ? null
                : allPosts.find((x) => String(x.id) === String(p.parentId))
            )
            : null

          return (
            <div
              key={slot.key}
              id={`post_${p.id}`}
              data-feed-card="1"
              data-feed-kind="post"
              data-thread-branch-root={isThreadBranchRoot ? '1' : undefined}
              data-thread-branch-child={isThreadBranchRoot ? undefined : '1'}
              className={isThreadBranchRoot ? 'threadBranchRootCard' : 'threadBranchReplyEntry'}
              style={
                isThreadBranchRoot
                  ? undefined
                  : {
                      '--thread-reply-indent': `${replyIndent}px`,
                    }
              }
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
              {isThreadBranchRoot && (
                <div
                  className="forumDividerRail forumDividerRail--gold threadBranchRootRail"
                  aria-hidden="true"
                />
              )}
            </div>
          )
        }

        const url = pickAdUrlForSlot(slot.key, 'replies')
        if (!url) {
          return (
            <div
              key={slot.key}
              className="forumAdSlotPlaceholder mediaBox"
              data-kind="ad"
              data-slotkind="replies"
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
