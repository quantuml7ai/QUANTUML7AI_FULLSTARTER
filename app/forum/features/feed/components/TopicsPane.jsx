'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

const EMPTY_TOPIC_AGG = Object.freeze({
  posts: 0,
  likes: 0,
  dislikes: 0,
  views: 0,
})

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`forum-skeleton-topic:${index}`} className="forumSkeletonCard" aria-hidden="true">
          <div className="forumSkeletonHeader">
            <div className="forumSkeletonAvatar" />
            <div className="forumSkeletonTitle" />
          </div>
          <div className="forumSkeletonBody">
            <div className="forumSkeletonLine" />
            <div className="forumSkeletonLine" />
            <div className="forumSkeletonMedia" />
          </div>
          <div className="forumSkeletonMetrics">
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
            <div className="forumSkeletonMetric" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TopicsPane({
  visibleTopics,
  aggregates,
  branchUserNick,
  branchUserId,
  onClearBranch,
  onGoHome,
  resolveNickForDisplay,
  pushNavState,
  setSel,
  setThreadRoot,
  markViewTopic,
  isAdmin,
  delTopic,
  viewerId,
  delTopicOwn,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  formatCount,
  topicsHasMore,
  topicsLoading,
  setVisibleTopicsCount,
  topicPageSize,
  sortedTopicsLength,
  profileBranchMode,
  t,
  TopicItem,
  LoadMoreSentinel,
}) {
  const isProfileTopicsBranch = profileBranchMode === 'topics'
  const userLabel = String(branchUserNick || resolveNickForDisplay?.(branchUserId, '') || branchUserId || '').trim()
  const firstTopicId = String((visibleTopics || [])[0]?.id || (visibleTopics || [])[0]?.topicId || '')
  const showInitialTopicsSkeleton = !!topicsLoading && !(visibleTopics || []).length
  const closeProfileTopicsBranch = React.useCallback(() => {
    if (typeof onGoHome === 'function') {
      onGoHome()
      return
    }
    onClearBranch?.()
  }, [onClearBranch, onGoHome])

  React.useEffect(() => {
    if (!isProfileTopicsBranch || !firstTopicId || typeof window === 'undefined') return undefined
    let cancelled = false
    const timers = []
    let raf = 0

    const alignNode = (node) => {
      if (!node) return false
      try {
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
        const rect = node.getBoundingClientRect()
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          const rootRect = scrollEl.getBoundingClientRect()
          scrollEl.scrollTop = Math.max(0, Number(scrollEl.scrollTop || 0) + rect.top - rootRect.top)
        } else {
          const top = Math.max(0, Number(window.pageYOffset || document.documentElement?.scrollTop || 0) + rect.top)
          window.scrollTo({ top, behavior: 'auto' })
        }
        try { window.__forumProgrammaticScrollTs = Date.now() } catch {}
        return true
      } catch {
        return false
      }
    }

    const attemptAlign = () => {
      if (cancelled) return true
      const root = document.querySelector?.('[data-profile-branch-root="1"]') || document
      const node =
        root.querySelector?.('[data-profile-branch-start="1"]') ||
        root.querySelector?.('[data-feed-card="1"]') ||
        null
      return alignNode(node)
    }

    const schedule = (delay) => {
      const id = window.setTimeout(() => {
        if (cancelled) return
        attemptAlign()
      }, delay)
      timers.push(id)
    }

    try {
      raf = window.requestAnimationFrame(() => {
        attemptAlign()
        ;[64, 128, 240, 420, 700, 960].forEach(schedule)
      })
    } catch {
      ;[0, 64, 128, 240, 420, 700, 960].forEach(schedule)
    }

    return () => {
      cancelled = true
      if (raf) {
        try { window.cancelAnimationFrame(raf) } catch {}
      }
      timers.forEach((id) => {
        try { window.clearTimeout(id) } catch {}
      })
    }
  }, [firstTopicId, isProfileTopicsBranch])

  const handleOpenTopic = React.useCallback((topic, entryId) => {
    pushNavState(entryId || `topic_${topic?.id}`)
    setSel(topic)
    setThreadRoot(null)
  }, [pushNavState, setSel, setThreadRoot])

  const { win: topicsWin, measureRef: topicsMeasureRef } = useForumWindowing({
    active: true,
    items: visibleTopics || [],
    getItemKey: (topic, index) => String(topic?.id || `topic:${index}`),
    getItemDomId: (topic) => (topic?.id ? `topic_${topic.id}` : ''),
    estimateItemHeight: () => readForumCardEstimate('topic'),
    maxRender: () => readForumWindowingMaxRender('topic'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('topic', velocity),
    listId: 'forum:topics',
  })

  return (
    <>
      <div
        className={isProfileTopicsBranch ? 'userPostsBranchPane grid gap-2 mt-2' : 'grid gap-2 mt-2'}
        suppressHydrationWarning
        data-profile-branch-root={isProfileTopicsBranch ? '1' : undefined}
      >
        {isProfileTopicsBranch && (
          <div className="userBranchHeader">
            <div className="userBranchTitle">
              {t?.('forum_user_popover_topics')}:
              {' '}
              <span className="userBranchTitleNick" translate="no">{userLabel || '...'}</span>
            </div>
            <button
              type="button"
              className="userBranchClose"
              onClick={closeProfileTopicsBranch}
              aria-label={t?.('forum_back') || 'Back'}
              title={t?.('forum_back') || 'Back'}
            >
              <span aria-hidden>&times;</span>
            </button>
          </div>
        )}
        {showInitialTopicsSkeleton && (
          <ForumPaneSkeleton rows={isProfileTopicsBranch ? 3 : 4} label={t?.('loading') || 'Loading'} />
        )}
        {!showInitialTopicsSkeleton && topicsWin.top > 0 && <div aria-hidden="true" style={{ height: topicsWin.top }} />}
        {!showInitialTopicsSkeleton && (visibleTopics || []).slice(topicsWin.start, topicsWin.end).map((topic, indexInWindow) => {
          const idx = topicsWin.start + indexInWindow
          const agg = aggregates.get(topic.id) || EMPTY_TOPIC_AGG
          const authorId = String(resolveProfileAccountId(topic?.userId || topic?.accountId) || '').trim()
          const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
          const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
          return (
            <div key={`t:${topic.id}`} ref={topicsMeasureRef(String(topic?.id || ''))}>
              <TopicItem
                t={topic}
                dataProfileBranchStart={isProfileTopicsBranch && idx === 0 ? '1' : undefined}
                agg={agg}
                onOpen={handleOpenTopic}
                onView={markViewTopic}
                isAdmin={isAdmin}
                onDelete={delTopic}
                authId={viewerId}
                onOwnerDelete={delTopicOwn}
                isSelfAuthor={isSelfAuthor}
                isStarredAuthor={isStarredAuthor}
                onToggleStar={toggleAuthorStar}
                onUserInfoToggle={handleUserInfoToggle}
                formatCount={formatCount}
              />
            </div>
          )
        })}
        {!showInitialTopicsSkeleton && topicsWin.bottom > 0 && <div aria-hidden="true" style={{ height: topicsWin.bottom }} />}
        {isProfileTopicsBranch && !topicsLoading && !topicsHasMore && !(visibleTopics || []).length && (
          <div className="meta">{t?.('forum_no_topics_yet') || t?.('forum_no_posts_yet')}</div>
        )}
      </div>
      {!showInitialTopicsSkeleton && topicsHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleTopicsCount((c) =>
                Math.min(c + topicPageSize, sortedTopicsLength),
              )
            }
          />
        </div>
      )}
    </>
  )
}
