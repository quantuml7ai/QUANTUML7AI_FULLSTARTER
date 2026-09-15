'use client'

import React from 'react'
import UserRecommendationsRail from '../../feed/components/UserRecommendationsRail'
import { isLoadMoreSentinelInsideViewport } from '../../feed/components/LoadMoreSentinel'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'

const VIDEO_THREAD_OPEN_OPTIONS = Object.freeze({
  closeInbox: true,
  closeVideoFeed: true,
})

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`forum-skeleton-video:${index}`} className="forumSkeletonCard" aria-hidden="true">
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

export function useVideoFeedTailWatchdog({
  enabled,
  vfSlotsLength,
  vfWindowEnd,
  loadedVideoCount,
  frontierKey,
  tailElementRef,
  advanceVideoFeed,
  onTailExit,
  firstDelayMs = 520,
}) {
  const latestRef = React.useRef(null)
  const watchdogRef = React.useRef({
    tailEntered: false,
    tailFrontier: '',
    timer: 0,
    attemptInFlight: false,
  })

  latestRef.current = {
    enabled,
    vfSlotsLength,
    vfWindowEnd,
    loadedVideoCount,
    frontierKey: String(frontierKey || ''),
    tailElementRef,
    advanceVideoFeed,
    onTailExit,
  }

  const clearTimer = React.useCallback(() => {
    const state = watchdogRef.current
    if (!state.timer || typeof window === 'undefined') return
    window.clearTimeout(state.timer)
    state.timer = 0
  }, [])

  const isAtRenderedTail = React.useCallback((snapshot) => {
    const totalSlots = Math.max(0, Number(snapshot?.vfSlotsLength || 0))
    const winEnd = Math.max(0, Number(snapshot?.vfWindowEnd || 0))
    if (totalSlots <= 0) return Math.max(0, Number(snapshot?.loadedVideoCount || 0)) === 0
    return winEnd >= totalSlots
  }, [])

  const isAtPhysicalTail = React.useCallback((snapshot) => {
    if (!isAtRenderedTail(snapshot)) return false
    return isLoadMoreSentinelInsideViewport(snapshot?.tailElementRef?.current)
  }, [isAtRenderedTail])

  const scheduleAttemptRef = React.useRef(null)
  scheduleAttemptRef.current = (delayMs, expectedFrontier) => {
    if (typeof window === 'undefined') return
    const state = watchdogRef.current
    clearTimer()
    state.timer = window.setTimeout(async () => {
      state.timer = 0
      const latest = latestRef.current || {}
      if (
        !latest.enabled
        || !state.tailEntered
        || state.tailFrontier !== expectedFrontier
        || latest.frontierKey !== expectedFrontier
        || state.attemptInFlight
        || typeof latest.advanceVideoFeed !== 'function'
      ) return
      if (!isAtPhysicalTail(latest)) {
        state.tailEntered = false
        state.tailFrontier = ''
        try { latest.onTailExit?.() } catch {}
        return
      }

      state.attemptInFlight = true
      let result = null
      try {
        result = await latest.advanceVideoFeed({ reason: 'tail_watchdog', forceRecovery: true })
      } catch {}
      state.attemptInFlight = false

      const current = latestRef.current || {}
      if (
        result?.retryable === true
        && state.tailEntered
        && state.tailFrontier === expectedFrontier
        && current.frontierKey === expectedFrontier
        && isAtPhysicalTail(current)
      ) {
        const retryAfterMs = Math.max(1, Number(result?.retryAfterMs || 0) || 1)
        scheduleAttemptRef.current?.(retryAfterMs, expectedFrontier)
      }
    }, Math.max(0, Number(delayMs || 0)))
  }

  const evaluateTail = React.useCallback(() => {
    const state = watchdogRef.current
    const latest = latestRef.current || {}
    const atTail = !!latest.enabled && isAtPhysicalTail(latest)

    if (!atTail) {
      clearTimer()
      if (state.tailEntered) {
        state.tailEntered = false
        state.tailFrontier = ''
        try { latest.onTailExit?.() } catch {}
      }
      return
    }

    if (state.tailEntered) return
    state.tailEntered = true
    state.tailFrontier = latest.frontierKey
    scheduleAttemptRef.current?.(firstDelayMs, state.tailFrontier)
  }, [clearTimer, firstDelayMs, isAtPhysicalTail])

  React.useEffect(() => {
    evaluateTail()
  }, [enabled, evaluateTail, frontierKey, loadedVideoCount, vfSlotsLength, vfWindowEnd])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const node = latestRef.current?.tailElementRef?.current
    const scrollRoot = node?.closest?.('[data-forum-scroll="1"]') || window
    const handleGeometryChange = () => evaluateTail()
    scrollRoot.addEventListener?.('scroll', handleGeometryChange, { passive: true })
    window.addEventListener('resize', handleGeometryChange, { passive: true })
    return () => {
      scrollRoot.removeEventListener?.('scroll', handleGeometryChange)
      window.removeEventListener('resize', handleGeometryChange)
    }
  }, [enabled, evaluateTail, loadedVideoCount, vfSlotsLength])

  React.useEffect(() => () => {
    clearTimer()
    watchdogRef.current.tailEntered = false
    watchdogRef.current.tailFrontier = ''
  }, [clearTimer])
}

export default function VideoFeedPane({
  t,
  vfWin,
  vfSlots,
  vfMeasureRef,
  dataPosts,
  openThreadForPost,
  resolveNickForDisplay,
  openReportPopover,
  openSharePopover,
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
  pickAdUrlForSlot,
  compensateScrollOnResize,
  videoServerLoading,
  videoServerHasMore,
  loadVideoFeedPage,
  setVisibleVideoCount,
  visibleVideoCount,
  videoPageSize,
  videoFeed,
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
  userRecommendationsRail,
  userRecommendationsRuntime,
  onOpenUserPosts,
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

  const handleOpenThread = React.useCallback((post, options) => {
    openThreadForPost(post, options)
  }, [openThreadForPost])

  const loadedVideoCount = Number((videoFeed || []).length || 0)
  const currentVisibleVideoCount = Number(visibleVideoCount || 0)
  const localVideoHasMore = currentVisibleVideoCount < loadedVideoCount
  const serverVideoHasMore = !!videoServerHasMore
  const renderedVideoSlotCount = Number((vfSlots || []).length || 0)
  const videoProgressionFrontier = `${currentVisibleVideoCount}:${loadedVideoCount}:${Number(serverVideoHasMore)}`
  const showVideoLoadFooter = loadedVideoCount > 0 && (localVideoHasMore || serverVideoHasMore || !!videoServerLoading)
  const showInitialVideoSkeleton = !!videoServerLoading && loadedVideoCount === 0
  const progressionGovernorRef = React.useRef({
    claimedFrontier: '',
    inFlightFrontier: '',
    waitForTailExit: false,
    retryFrontier: '',
    retryNotBefore: 0,
  })
  const [layoutRearmCommit, setLayoutRearmCommit] = React.useState({ id: 0, fromFrontier: '', fromSlotsLength: 0 })
  const videoLoadFooterRef = React.useRef(null)
  const layoutRearmReady = Number(layoutRearmCommit?.id || 0) > 0
    && renderedVideoSlotCount > Number(layoutRearmCommit?.fromSlotsLength || 0)
    && (
      Math.max(0, Number(vfWin?.end || 0)) >= renderedVideoSlotCount
      || Math.max(0, Number(vfWin?.bottom || 0)) > 0
    )

  const releaseVideoFeedTail = React.useCallback(() => {
    const governor = progressionGovernorRef.current
    governor.waitForTailExit = false
    if (!governor.inFlightFrontier) governor.claimedFrontier = ''
  }, [])

  const revealNextVideoPage = React.useCallback(() => {
    setVisibleVideoCount((count) => {
      const current = Math.max(0, Number(count || 0))
      const next = current + Math.max(1, Number(videoPageSize || 0) || 1)
      return Math.min(next, Math.max(loadedVideoCount, current))
    })
  }, [loadedVideoCount, setVisibleVideoCount, videoPageSize])

  const requestNextVideoServerPage = React.useCallback(async ({ reason = 'sentinel', forceRecovery = false, revealOnSuccess = true } = {}) => {
    if (typeof loadVideoFeedPage !== 'function') return { ok: false, skipped: true, reason: 'missing_loader' }
    const result = await loadVideoFeedPage({ reason, forceRecovery })
    if (result?.ok === false || result?.skipped) return result
    if (revealOnSuccess && Number(result?.count || 0) > 0) {
      const revealCount = Math.max(1, Math.min(Math.max(1, Number(videoPageSize || 0) || 1), Number(result?.count || 0)))
      setVisibleVideoCount((count) => Math.max(0, Number(count || 0)) + revealCount)
    }
    return result
  }, [loadVideoFeedPage, setVisibleVideoCount, videoPageSize])

  const advanceVideoFeed = React.useCallback(async ({ reason = 'sentinel', forceRecovery = false } = {}) => {
    const governor = progressionGovernorRef.current
    const now = Date.now()

    if (localVideoHasMore) {
      if (governor.inFlightFrontier || governor.waitForTailExit || governor.claimedFrontier === videoProgressionFrontier) {
        return { ok: true, skipped: true, reason: 'frontier_claimed' }
      }
      governor.claimedFrontier = videoProgressionFrontier
      governor.inFlightFrontier = videoProgressionFrontier
      governor.waitForTailExit = true
      revealNextVideoPage()
      governor.inFlightFrontier = ''
      setLayoutRearmCommit((previous) => ({
        id: Number(previous?.id || 0) + 1,
        fromFrontier: videoProgressionFrontier,
        fromSlotsLength: renderedVideoSlotCount,
      }))
      return { ok: true, revealedLocalPage: true }
    }
    if (!serverVideoHasMore && !videoServerLoading) return { ok: true, skipped: true, reason: 'complete' }
    if (videoServerLoading || governor.inFlightFrontier) {
      return { ok: false, skipped: true, loading: true, reason: 'requesting' }
    }
    if (governor.waitForTailExit || governor.claimedFrontier === videoProgressionFrontier) {
      return { ok: true, skipped: true, reason: 'frontier_claimed' }
    }
    if (governor.retryFrontier === videoProgressionFrontier && now < governor.retryNotBefore) {
      return {
        ok: false,
        skipped: true,
        retryable: true,
        reason: 'recovery_cooldown',
        retryAfterMs: Math.max(1, governor.retryNotBefore - now),
      }
    }
    if (governor.retryFrontier && governor.retryFrontier !== videoProgressionFrontier) {
      governor.retryFrontier = ''
      governor.retryNotBefore = 0
    }

    governor.claimedFrontier = videoProgressionFrontier
    governor.inFlightFrontier = videoProgressionFrontier
    governor.waitForTailExit = true

    let result = null
    try {
      result = await requestNextVideoServerPage({ reason, forceRecovery, revealOnSuccess: true })
    } catch (error) {
      governor.claimedFrontier = ''
      governor.waitForTailExit = false
      throw error
    } finally {
      if (governor.inFlightFrontier === videoProgressionFrontier) governor.inFlightFrontier = ''
    }

    if (result?.retryable === true) {
      const retryAfterMs = Math.max(1, Number(result?.retryAfterMs || 0) || 1)
      governor.claimedFrontier = ''
      governor.waitForTailExit = false
      governor.retryFrontier = videoProgressionFrontier
      governor.retryNotBefore = Date.now() + retryAfterMs
    } else {
      governor.retryFrontier = ''
      governor.retryNotBefore = 0
      if (result?.ok !== false && !result?.skipped) {
        setLayoutRearmCommit((previous) => ({
          id: Number(previous?.id || 0) + 1,
          fromFrontier: videoProgressionFrontier,
          fromSlotsLength: renderedVideoSlotCount,
        }))
      }
    }
    return result
  }, [localVideoHasMore, renderedVideoSlotCount, revealNextVideoPage, requestNextVideoServerPage, serverVideoHasMore, videoProgressionFrontier, videoServerLoading])

  // QL7_MEDIA_FEED_TAIL_WATCHDOG_V2: one delayed recovery attempt per physical tail entry.
  useVideoFeedTailWatchdog({
    enabled: localVideoHasMore || serverVideoHasMore || !!videoServerLoading,
    vfSlotsLength: renderedVideoSlotCount,
    vfWindowEnd: vfWin?.end,
    loadedVideoCount,
    frontierKey: videoProgressionFrontier,
    tailElementRef: videoLoadFooterRef,
    advanceVideoFeed,
    onTailExit: releaseVideoFeedTail,
  })

  return (
    <>
      <div data-forum-video-start="1" />
      <div className="meta">{t('')}</div>
      <div
        className="grid gap-2"
        data-ql7-video-feed-grid="1"
        data-vf-win-start={vfWin.start}
        data-vf-win-end={vfWin.end}
        data-vf-win-top={Math.round(Number(vfWin.top || 0))}
        data-vf-win-bottom={Math.round(Number(vfWin.bottom || 0))}
        suppressHydrationWarning
      >
        {showInitialVideoSkeleton && (
          <ForumPaneSkeleton rows={4} label={t?.('loading') || 'Loading'} />
        )}

        {!showInitialVideoSkeleton && vfWin.top > 0 && <div aria-hidden="true" style={{ height: vfWin.top }} />}

        {!showInitialVideoSkeleton && vfSlots.slice(vfWin.start, vfWin.end).map((slot) => {
          if (slot.type === 'recommendation_rail') {
            const railState = userRecommendationsRail?.getSlotState?.(slot.key) || null
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(slot.key)}
                data-feed-card="1"
                data-feed-kind="recommendation_rail"
              >
                <UserRecommendationsRail
                  t={t}
                  railState={railState}
                  onOpenUserPosts={onOpenUserPosts}
                  hideScrollbar={!!userRecommendationsRuntime?.hideScrollbar}
                  desktopArrows={!!userRecommendationsRuntime?.desktopArrows}
                />
              </div>
            )
          }

          if (slot.type === 'item') {
            const p = slot.item
            const parent = p?.parentId ? (postsById.get(String(p.parentId)) || null) : null
            const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
            const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
            const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
            return (
              <div
                key={slot.key}
                ref={vfMeasureRef(slot.key)}
                id={`post_${p?.id || ''}`}
                data-feed-card="1"
                data-feed-kind="post"
              >
                <PostCard
                  p={p}
                  parentPost={parent}
                  parentAuthor={parent ? resolveNickForDisplay(parent.userId || parent.accountId, parent.nickname) : null}
                  parentText={parent ? (parent.text || parent.message || parent.body || '') : ''}
                  onReport={openReportPopover}
                  onShare={openSharePopover}
                  onOpenThread={handleOpenThread}
                  threadOpenOptions={VIDEO_THREAD_OPEN_OPTIONS}
                  onReact={reactMut}
                  isAdmin={isAdmin}
                  onDeletePost={delPost}
                  onOwnerDelete={delPostOwn}
                  onBanUser={banUser}
                  onUnbanUser={unbanUser}
                  isBanned={bannedSet.has(p?.accountId || p?.userId)}
                  authId={viewerId}
                  markView={markViewPost}
                  t={t}
                  isVideoFeed={true}
                  isSelfAuthor={isSelfAuthor}
                  isStarredAuthor={isStarredAuthor}
                  onToggleStar={toggleAuthorStar}
                  onUserInfoToggle={handleUserInfoToggle}
                />
              </div>
            )
          }

          const url = pickAdUrlForSlot(slot.key, 'video')
          if (!url) {
            return (
              <div key={slot.key} ref={vfMeasureRef(slot.key)}>
                <div
                  className="forumAdSlotPlaceholder mediaBox"
                  data-kind="ad"
                  data-slotkind="video"
                  data-slotkey={slot.key}
                  aria-hidden="true"
                />
              </div>
            )
          }

          return (
            <div key={slot.key} ref={vfMeasureRef(slot.key)}>
              <ForumAdSlot
                slotKey={slot.key}
                url={url}
                slotKind="video"
                nearId={slot.nearId}
                onResizeDelta={compensateScrollOnResize}
              />
            </div>
          )
        })}

        {!showInitialVideoSkeleton && vfWin.bottom > 0 && <div aria-hidden="true" style={{ height: vfWin.bottom }} />}

        {!showInitialVideoSkeleton && showVideoLoadFooter && (
          <div
            ref={videoLoadFooterRef}
            className={`loadMoreFooter${videoServerLoading ? ' isLoading' : ''}`}
            data-video-load-state={videoServerLoading ? 'loading' : 'idle'}
          >
            {videoServerLoading && (
              <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
            )}
            <LoadMoreSentinel
              rootMargin="0px"
              pending={!!videoServerLoading}
              hasMore={!!(localVideoHasMore || serverVideoHasMore)}
              loadKey={`video:${videoProgressionFrontier}`}
              requireExitBeforeReplay={true}
              onExit={releaseVideoFeedTail}
              layoutRearmKey={layoutRearmReady ? layoutRearmCommit.id : ''}
              layoutRearmFromLoadKey={`video:${layoutRearmCommit.fromFrontier}`}
              onLayoutRearm={releaseVideoFeedTail}
              onVisible={() => {
                // QL7_GEO111_MEDIA_FEED_SERVER_SENTINEL_V2
                Promise.resolve(advanceVideoFeed({ reason: 'sentinel' })).catch(() => {})
              }}
            />
          </div>
        )}

        {!videoServerLoading && videoFeed?.length === 0 && (
          <div className="meta forumFeedEmptyState">
            <span className="forumFeedEmptyStateText">{t('forum_search_empty')}</span>
          </div>
        )}
      </div>
    </>
  )
}
