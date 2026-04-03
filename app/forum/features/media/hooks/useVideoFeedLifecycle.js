import { useEffect, useLayoutEffect, useRef } from 'react'

const useBrowserLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function readGlobalTs(key) {
  try {
    if (typeof window === 'undefined') return 0
    return Number(window[key] || 0)
  } catch {
    return 0
  }
}

function markProgrammaticScrollTs() {
  try {
    if (typeof window === 'undefined') return
    window.__forumProgrammaticScrollTs = Date.now()
  } catch {}
}

function clearSafeTimeout(id) {
  try {
    if (id) clearTimeout(id)
  } catch {}
}

function clearSafeAnimationFrame(id) {
  try {
    if (id) cancelAnimationFrame(id)
  } catch {}
}

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
  const lifecycleTimersRef = useRef([])
  const lifecycleRafRef = useRef({ a: 0, b: 0 })

  const clearLifecycleQueues = () => {
    const timers = lifecycleTimersRef.current
    while (timers.length) {
      clearSafeTimeout(timers.pop())
    }
    const rafs = lifecycleRafRef.current
    clearSafeAnimationFrame(rafs.a)
    clearSafeAnimationFrame(rafs.b)
    rafs.a = 0
    rafs.b = 0
  }

  useEffect(() => {
    let disposed = false
    clearLifecycleQueues()
    const rafs = lifecycleRafRef.current
    const timers = lifecycleTimersRef.current

    const cancelScheduledBuild = () => {
      if (buildTimerRef.current) {
        clearSafeTimeout(buildTimerRef.current)
        buildTimerRef.current = 0
      }
    }

    const clearTimers = () => {
      while (timers.length) {
        clearSafeTimeout(timers.pop())
      }
    }

    const scheduleTimer = (fn, ms) => {
      const id = setTimeout(fn, ms)
      timers.push(id)
      return id
    }

    const cleanup = () => {
      disposed = true
      cancelScheduledBuild()
      clearTimers()
      try {
        if (rafs.a) cancelAnimationFrame(rafs.a)
      } catch {}
      try {
        if (rafs.b) cancelAnimationFrame(rafs.b)
      } catch {}
      rafs.a = 0
      rafs.b = 0
    }

    if (!videoFeedOpen) return cleanup

    const runBuild = (source = 'scheduled') => {
      if (disposed) return
      cancelScheduledBuild()

      try {
        emitDiag?.(
          'video_feed_build_run',
          {
            source,
            token: Number(videoFeedEntryToken || 0),
          },
          { force: source === 'entry_token' }
        )
      } catch {}

      try {
        buildAndSetVideoFeed()
      } catch {}
    }

    const scheduleBuildWhenIdle = (attempt = 0) => {
      if (disposed || !videoFeedOpen) return

      const now = Date.now()
      const lastUserScrollTs = readGlobalTs('__forumUserScrollTs')
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

      runBuild(attempt > 0 ? 'idle_retry' : 'idle')
    }

    const tokenNow = Number(videoFeedEntryToken || 0)
    const tokenChanged =
      tokenNow !== Number(lastBuildEntryTokenRef.current || 0)

    lastBuildEntryTokenRef.current = tokenNow

    if (tokenChanged && tokenNow > 0) {
      try {
        emitDiag?.(
          'video_feed_refresh_build_immediate',
          {
            source: 'entry_token',
            token: tokenNow,
          },
          { force: true }
        )
      } catch {}

      runBuild('entry_token')
    } else {
      scheduleBuildWhenIdle(0)
    }

    const applySoftRefreshWhenIdle = (attempt = 0) => {
      if (disposed || !videoFeedOpen) return
      if (!videoFeedRefreshTeleportPendingRef.current) return

      const now = Date.now()
      const lastUserScrollTs = readGlobalTs('__forumUserScrollTs')
      const lastProgrammaticScrollTs = readGlobalTs(
        '__forumProgrammaticScrollTs'
      )
      const idleFor = now - Math.max(lastUserScrollTs, lastProgrammaticScrollTs)
      const idleNeed = attempt <= 2 ? 340 : 460

      if (attempt < 12 && idleFor < idleNeed) {
        scheduleTimer(() => applySoftRefreshWhenIdle(attempt + 1), Math.max(90, idleNeed - idleFor))
        return
      }

      try {
        emitDiag?.(
          'video_feed_soft_refresh_apply',
          {
            stage: 'pre_teleport',
            attempt,
            idleFor,
          },
          { force: true }
        )
      } catch {}

      try {
        headAutoOpenRef.current = false
      } catch {}

      try {
        setHeadPinned(false)
      } catch {}

      try {
        setHeadHidden(true)
      } catch {}

      try {
        setVisibleVideoCount(videoPageSize)
      } catch {}

      try {
        videoFeedHardResetRef.current?.()
      } catch {}

      try {
        markProgrammaticScrollTs()
      } catch {}

      try {
        snapVideoFeedToFirstCardTop({
          hideHeader: true,
          anchorOnly: true,
        })
      } catch {}

      try {
        markProgrammaticScrollTs()
      } catch {}

      videoFeedRefreshTeleportPendingRef.current = false
    }

    if (videoFeedRefreshTeleportPendingRef.current) {
      try {
        rafs.a = requestAnimationFrame(() => {
          rafs.b = requestAnimationFrame(() => {
            applySoftRefreshWhenIdle(0)
          })
        })
      } catch {
        scheduleTimer(() => applySoftRefreshWhenIdle(0), 0)
      }
    }

    return () => {
      cleanup()
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

  useEffect(() => {
    return () => {
      clearLifecycleQueues()
      if (buildTimerRef.current) {
        clearSafeTimeout(buildTimerRef.current)
        buildTimerRef.current = 0
      }
    }
  }, [])

  useBrowserLayoutEffect(() => {
    if (autoBootRef.current) return
    if (navRestoringRef.current) return

    if (videoFeedOpen) {
      autoBootRef.current = true
      return
    }

    if (inboxOpen || questOpen || sel || threadRoot) {
      return
    }

    try {
      autoBootRef.current = true
      openVideoFeed('video_feed_auto', {
        skipPush: true,
        keepHeaderOpen: true,
      })
    } catch {
      autoBootRef.current = false
    }
  }, [
    videoFeedOpen,
    inboxOpen,
    questOpen,
    sel,
    threadRoot,
    openVideoFeed,
    navRestoringRef,
  ])
} 
