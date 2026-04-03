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
  const firstPostId = String(visibleUserPosts?.[0]?.id || '').trim()

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!firstPostId) return undefined
    const forceAlign = (() => {
      try {
        const mode = String(window.__forumForceModeAlign || '').trim()
        const until = Number(window.__forumForceModeAlignUntil || 0)
        return mode === 'profile_branch' && until > Date.now()
      } catch {
        return false
      }
    })()
    let rafA = 0
    let retryTimer = 0
    let cancelled = false
    const startedAt = Date.now()

    const readScrollTop = () => {
      try {
        const scrollEl = document.querySelector('[data-forum-scroll="1"]')
        if (scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)) {
          return Number(scrollEl.scrollTop || 0)
        }
        return Number(
          window.pageYOffset ||
          document.documentElement?.scrollTop ||
          document.body?.scrollTop ||
          0,
        )
      } catch {
        return 0
      }
    }

    const alignStart = () => {
      try {
        const marker =
          document.querySelector('[data-profile-branch-start="1"]') ||
          document.querySelector('[data-profile-branch-root="1"] [data-feed-card="1"]') ||
          document.getElementById(`post_${firstPostId}`) ||
          null
        if (!(marker instanceof Element)) return false
        const scrollEl = document.querySelector('[data-forum-scroll="1"]')
        const rect = marker.getBoundingClientRect?.()
        if (!rect) return false
        const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
        const now = Date.now()
        if (useInner) {
          const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
          const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
          scrollEl.scrollTop = Math.max(0, targetTop)
        } else {
          const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top
          try { window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }) } catch { try { window.scrollTo(0, Math.max(0, y)) } catch {} }
        }
        try {
          window.__forumProgrammaticScrollTs = now
          window.__forumProgrammaticScrollReason = 'profile_posts_align_start'
        } catch {}
        return true
      } catch {}
      return false
    }

    const scheduleAlign = (attempt = 0, baselineTop = 0) => {
      if (cancelled) return
      if ((Date.now() - startedAt) > 2100) return
      const ok = alignStart()
      if (ok) {
        // A follow-up pass keeps the first card pinned if media/layout settles
        // right after mount, but we stop if user already started scrolling.
        if (attempt < 2) {
          retryTimer = setTimeout(() => {
            if (attempt > 0 && Math.abs(readScrollTop() - baselineTop) > 24) return
            scheduleAlign(attempt + 1, baselineTop)
          }, 120)
        }
        return
      }
      if (attempt >= 12) return
      const delay = attempt <= 2 ? 72 : (attempt <= 7 ? 110 : 150)
      retryTimer = setTimeout(() => {
        // If user is already scrolling manually, do not pull the feed back.
        if (attempt > 1 && Math.abs(readScrollTop() - baselineTop) > 24) return
        scheduleAlign(attempt + 1, baselineTop)
      }, delay)
    }

    try {
      const baselineTop = readScrollTop()
      rafA = requestAnimationFrame(() => scheduleAlign(0, baselineTop))
    } catch {
      scheduleAlign(0, readScrollTop())
    }

    if (forceAlign) {
      try {
        delete window.__forumForceModeAlign
        delete window.__forumForceModeAlignUntil
      } catch {}
    }

    return () => {
      cancelled = true
      try { if (rafA) cancelAnimationFrame(rafA) } catch {}
      try { if (retryTimer) clearTimeout(retryTimer) } catch {}
    }
  }, [branchUserId, firstPostId])

  return (
    <div className="userPostsBranchPane" data-profile-branch-root="1">
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

      {(visibleUserPosts || []).map((p, idx) => {
        const parent = p?.parentId ? (dataPosts || []).find((x) => String(x.id) === String(p.parentId)) : null
        return (
          <div
            key={`uprofile:${p?.id || ''}`}
            id={`post_${p?.id || ''}`}
            data-feed-card="1"
            data-feed-kind="post"
            data-profile-branch-start={idx === 0 ? '1' : undefined}
          >
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
    </div>
  )
}
