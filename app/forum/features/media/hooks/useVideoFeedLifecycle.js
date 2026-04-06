import { useEffect, useLayoutEffect, useRef } from 'react'

const useBrowserLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function useVideoFeedLifecycle({
  videoFeedOpen,
  videoFeedEntryToken,
  data,
  allPosts,
  feedSort,
  activeStarredAuthors,
  buildAndSetVideoFeed,
  videoFeedRefreshTeleportPendingRef,
  emitDiag,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  setVisibleVideoCount,
  videoPageSize,
  videoFeedHardResetRef,
  snapVideoFeedToFirstCardTop,
  navRestoringRef,
  inboxOpen,
  questOpen,
  sel,
  threadRoot,
  openVideoFeed,
}) {
  const autoBootRef = useRef(false)
  const buildTimerRef = useRef(0)
  const lastBuildEntryTokenRef = useRef(Number(videoFeedEntryToken || 0))

  useEffect(() => {
    let rafA = 0
    let rafB = 0
    const timers = []
    const cancelScheduledBuild = () => {
      if (buildTimerRef.current) {
        try { clearTimeout(buildTimerRef.current) } catch {}
        buildTimerRef.current = 0
      }
    }
    const clearTimers = () => {
      timers.forEach((id) => {
        try { clearTimeout(id) } catch {}
      })
      timers.length = 0
    }
    if (!videoFeedOpen) return undefined

    const runBuild = () => {
      buildAndSetVideoFeed()
    }

    const scheduleBuildWhenIdle = (attempt = 0) => {
      const now = Date.now()
      const lastUserScrollTs = (() => {
        try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
      })()
      const idleFor = now - lastUserScrollTs
      const idleNeed = 320
      if (attempt < 10 && idleFor < idleNeed) {
        cancelScheduledBuild()
        buildTimerRef.current = setTimeout(() => {
          buildTimerRef.current = 0
          scheduleBuildWhenIdle(attempt + 1)
        }, Math.max(90, idleNeed - idleFor))
        return
      }
      runBuild()
    }

    const tokenNow = Number(videoFeedEntryToken || 0)
    const tokenChanged = tokenNow !== Number(lastBuildEntryTokenRef.current || 0)
    lastBuildEntryTokenRef.current = tokenNow

    if (tokenChanged && tokenNow > 0) {
      try {
        emitDiag?.('video_feed_refresh_build_immediate', {
          source: 'entry_token',
          token: tokenNow,
        }, { force: true })
      } catch {}
      runBuild()
    } else {
      scheduleBuildWhenIdle(0)
    }

    const applySoftRefreshWhenIdle = (attempt = 0) => {
      if (!videoFeedRefreshTeleportPendingRef.current) return
      const now = Date.now()
      const lastUserScrollTs = (() => {
        try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
      })()
      const lastProgrammaticScrollTs = (() => {
        try { return Number(window.__forumProgrammaticScrollTs || 0) } catch { return 0 }
      })()
      const idleFor = now - Math.max(lastUserScrollTs, lastProgrammaticScrollTs)
      const idleNeed = attempt <= 2 ? 340 : 460
      if (attempt < 12 && idleFor < idleNeed) {
        const wait = Math.max(90, idleNeed - idleFor)
        const id = setTimeout(() => applySoftRefreshWhenIdle(attempt + 1), wait)
        timers.push(id)
        return
      }
      try {
        emitDiag?.('video_feed_soft_refresh_apply', {
          stage: 'pre_teleport',
          attempt,
          idleFor,
        }, { force: true })
      } catch {}
      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
      try { setVisibleVideoCount(videoPageSize) } catch {}
      try { videoFeedHardResetRef.current?.() } catch {}
      try { snapVideoFeedToFirstCardTop({ hideHeader: true, anchorOnly: true }) } catch {}
      videoFeedRefreshTeleportPendingRef.current = false
    }

    if (videoFeedRefreshTeleportPendingRef.current) {
      try {
        rafA = requestAnimationFrame(() => {
          rafB = requestAnimationFrame(() => applySoftRefreshWhenIdle(0))
        })
      } catch {
        const id = setTimeout(() => applySoftRefreshWhenIdle(0), 0)
        timers.push(id)
      }
    }

    return () => {
      cancelScheduledBuild()
      clearTimers()
      try { if (rafA) cancelAnimationFrame(rafA) } catch {}
      try { if (rafB) cancelAnimationFrame(rafB) } catch {}
    }
  }, [
    videoFeedOpen,
    videoFeedEntryToken,
    data?.rev,
    data?.posts,
    data?.messages,
    data?.topics,
    allPosts,
    feedSort,
    activeStarredAuthors,
    buildAndSetVideoFeed,
    snapVideoFeedToFirstCardTop,
    setHeadHidden,
    setHeadPinned,
    emitDiag,
    setVisibleVideoCount,
    videoPageSize,
    videoFeedHardResetRef,
    videoFeedRefreshTeleportPendingRef,
    headAutoOpenRef,
  ])

  useBrowserLayoutEffect(() => {
    if (autoBootRef.current) return
    if (navRestoringRef.current) return

    if (videoFeedOpen || inboxOpen || questOpen || sel || threadRoot) {
      autoBootRef.current = true
      return
    }

    autoBootRef.current = true
    try { openVideoFeed('video_feed_auto', { skipPush: true, keepHeaderOpen: true }) } catch {}
  }, [videoFeedOpen, inboxOpen, questOpen, sel, threadRoot, openVideoFeed, navRestoringRef])
}
