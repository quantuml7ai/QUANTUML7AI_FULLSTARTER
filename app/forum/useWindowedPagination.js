'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const WINDOWING_CONSTANTS = {
  PAGE_SIZE: 5,
  WINDOW_SIZE_DEFAULT: 10,
  WINDOW_SIZE_MEDIA: 15,
  WINDOW_SIZE_STRICT: 5,
  TRIM_AHEAD: 4,
  OVERSCAN_BEFORE: 4,
  OVERSCAN_AFTER: 4,
  TRIM_MAX_PER_TICK: 5,
  TRIM_DEBOUNCE_MS: 120,
}

const getWindowSize = (mode) => {
  switch (mode) {
    case 'media':
      return WINDOWING_CONSTANTS.WINDOW_SIZE_MEDIA
    case 'strict':
      return WINDOWING_CONSTANTS.WINDOW_SIZE_STRICT
    case 'default':
    default:
      return WINDOWING_CONSTANTS.WINDOW_SIZE_DEFAULT
  }
}

export function useWindowedPagination({
  allItems,
  getKey,
  scrollElRef,
  mode = 'default',
  hasMore,
  isLoadingMore,
  loadMore,
  resetKey,
  ioRootMarginBottom = '220px',
  ioThresholds = [0, 0.1],
  overscanBefore = WINDOWING_CONSTANTS.OVERSCAN_BEFORE,
  overscanAfter = WINDOWING_CONSTANTS.OVERSCAN_AFTER,
  trimAhead = WINDOWING_CONSTANTS.TRIM_AHEAD,
  trimDebounceMs = WINDOWING_CONSTANTS.TRIM_DEBOUNCE_MS,
  trimMaxPerTick = WINDOWING_CONSTANTS.TRIM_MAX_PER_TICK,
} = {}) {
  const items = Array.isArray(allItems) ? allItems : []
  const windowSize = useMemo(() => getWindowSize(mode), [mode])
  const maxRenderCount = useMemo(
    () => windowSize + overscanBefore + overscanAfter,
    [windowSize, overscanBefore, overscanAfter],
  )

  const bottomSentinelRef = useRef(null)
  const itemElsRef = useRef(new Map())
  const heightMapRef = useRef(new Map())
  const resizeObserverRef = useRef(null)
  const visibilityObserverRef = useRef(null)
  const bottomObserverRef = useRef(null)
  const visibleSetRef = useRef(new Set())
  const rafVisibleRef = useRef(null)
  const lastTrimRef = useRef(0)
  const lastTrimReasonRef = useRef('init')
  const loadMoreInFlightRef = useRef(false)
  const loadMoreRef = useRef(loadMore)
  const hasMoreRef = useRef(hasMore)
  const isLoadingRef = useRef(isLoadingMore)
  const avgHeightRef = useRef(0)
  const sumHeightRef = useRef(0)
  const countHeightRef = useRef(0)

  const [windowStart, setWindowStart] = useState(0)
  const [trimmedHeightPx, setTrimmedHeightPx] = useState(0)
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0)

  useEffect(() => {
    loadMoreRef.current = loadMore
  }, [loadMore])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    isLoadingRef.current = isLoadingMore
  }, [isLoadingMore])

  useEffect(() => {
    setWindowStart(0)
    setTrimmedHeightPx(0)
    setFirstVisibleIndex(0)
    heightMapRef.current.clear()
    itemElsRef.current.clear()
    visibleSetRef.current.clear()
    lastTrimRef.current = 0
    lastTrimReasonRef.current = 'reset'
    sumHeightRef.current = 0
    countHeightRef.current = 0
    avgHeightRef.current = 0
  }, [resetKey])

  const windowEnd = useMemo(() => {
    if (items.length === 0) return 0
    const minEnd = windowStart + 1
    return Math.min(items.length, Math.max(windowStart + maxRenderCount, minEnd))
  }, [items.length, windowStart, maxRenderCount])

  useEffect(() => {
    if (items.length === 0 && (windowStart !== 0 || trimmedHeightPx !== 0)) {
      setWindowStart(0)
      setTrimmedHeightPx(0)
      setFirstVisibleIndex(0)
      return
    }
    if (windowStart >= items.length && items.length > 0) {
      setWindowStart(Math.max(0, items.length - maxRenderCount))
    }
  }, [items.length, windowStart, maxRenderCount, trimmedHeightPx])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    if (resizeObserverRef.current) return undefined
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const key = entry.target?.dataset?.windowKey
        if (!key) continue
        const nextHeight =
          entry.borderBoxSize?.[0]?.blockSize ??
          entry.contentRect?.height ??
          entry.target?.offsetHeight ??
          0
        if (!Number.isFinite(nextHeight) || nextHeight <= 0) continue

        const prevHeight = heightMapRef.current.get(key)
        if (typeof prevHeight === 'number') {
          sumHeightRef.current += nextHeight - prevHeight
        } else {
          sumHeightRef.current += nextHeight
          countHeightRef.current += 1
        }
        heightMapRef.current.set(key, nextHeight)
      }
      if (countHeightRef.current > 0) {
        avgHeightRef.current = sumHeightRef.current / countHeightRef.current
      }
    })
    return () => {
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
    }
  }, [])

  const scheduleVisibleUpdate = useCallback(() => {
    if (rafVisibleRef.current) return
    rafVisibleRef.current = requestAnimationFrame(() => {
      rafVisibleRef.current = null
      const indices = Array.from(visibleSetRef.current)
      if (!indices.length) {
        setFirstVisibleIndex(windowStart)
        return
      }
      const minIndex = Math.min(...indices)
      setFirstVisibleIndex((prev) => (prev === minIndex ? prev : minIndex))
    })
  }, [windowStart])

  useEffect(() => {
    return () => {
      if (rafVisibleRef.current) {
        cancelAnimationFrame(rafVisibleRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const root = scrollElRef?.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined

    visibilityObserverRef.current?.disconnect()
    visibilityObserverRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idxRaw = entry.target?.dataset?.windowIndex
          const idx = Number(idxRaw)
          if (!Number.isFinite(idx)) continue
          if (entry.isIntersecting) {
            visibleSetRef.current.add(idx)
          } else {
            visibleSetRef.current.delete(idx)
          }
        }
        scheduleVisibleUpdate()
      },
      {
        root,
        threshold: ioThresholds,
      },
    )

    itemElsRef.current.forEach((el) => {
      visibilityObserverRef.current?.observe(el)
    })

    return () => {
      visibilityObserverRef.current?.disconnect()
      visibilityObserverRef.current = null
    }
  }, [scrollElRef, ioThresholds, scheduleVisibleUpdate])

  useEffect(() => {
    const root = scrollElRef?.current
    const sentinel = bottomSentinelRef.current
    if (!root || !sentinel || typeof IntersectionObserver === 'undefined') return undefined

    bottomObserverRef.current?.disconnect()
    bottomObserverRef.current = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting)
        if (!hit) return
        if (!hasMoreRef.current || isLoadingRef.current || loadMoreInFlightRef.current) return
        if (typeof loadMoreRef.current !== 'function') return

        loadMoreInFlightRef.current = true
        Promise.resolve(loadMoreRef.current())
          .catch(() => {})
          .finally(() => {
            loadMoreInFlightRef.current = false
          })
      },
      {
        root,
        rootMargin: `0px 0px ${ioRootMarginBottom} 0px`,
        threshold: 0.01,
      },
    )

    bottomObserverRef.current.observe(sentinel)

    return () => {
      bottomObserverRef.current?.disconnect()
      bottomObserverRef.current = null
    }
  }, [scrollElRef, ioRootMarginBottom, hasMore])

  const setItemRef = useCallback((key, el) => {
    if (!key) return
    const map = itemElsRef.current
    const prev = map.get(key)
    if (prev && prev !== el) {
      resizeObserverRef.current?.unobserve(prev)
      visibilityObserverRef.current?.unobserve(prev)
    }
    if (!el) {
      map.delete(key)
      return
    }
    map.set(key, el)
    resizeObserverRef.current?.observe(el)
    visibilityObserverRef.current?.observe(el)
  }, [])

  useEffect(() => {
    if (!items.length) return

    const renderedCount = windowEnd - windowStart
    if (renderedCount <= windowSize + overscanAfter) return

    const safeTrimCount = firstVisibleIndex - (windowStart + trimAhead)
    if (safeTrimCount <= 0) return

    const extra = renderedCount - (windowSize + overscanAfter)
    const trimCount = Math.min(extra, trimMaxPerTick, safeTrimCount)
    if (trimCount <= 0) return

    const now = Date.now()
    if (now - lastTrimRef.current < trimDebounceMs) return

    const slice = items.slice(windowStart, windowStart + trimCount)
    let deltaHeight = 0
    for (const item of slice) {
      const key = getKey(item)
      const h = heightMapRef.current.get(key)
      if (typeof h === 'number') {
        deltaHeight += h
      } else if (avgHeightRef.current > 0) {
        deltaHeight += avgHeightRef.current
      }
    }

    lastTrimRef.current = now
    lastTrimReasonRef.current = 'trim'

    setWindowStart((prev) => prev + trimCount)
    setTrimmedHeightPx((prev) => prev + deltaHeight)

    const scroller = scrollElRef?.current
    if (scroller && deltaHeight) {
      scroller.scrollTop += deltaHeight
    }
  }, [
    items,
    windowEnd,
    windowStart,
    windowSize,
    overscanAfter,
    firstVisibleIndex,
    trimAhead,
    trimMaxPerTick,
    trimDebounceMs,
    getKey,
    scrollElRef,
  ])

  useEffect(() => {
    if (!visibleSetRef.current.size) return
    const toRemove = []
    visibleSetRef.current.forEach((idx) => {
      if (idx < windowStart) toRemove.push(idx)
    })
    if (toRemove.length) {
      toRemove.forEach((idx) => visibleSetRef.current.delete(idx))
    }
  }, [windowStart])

  const debugStats = useMemo(
    () => ({
      renderedCount: Math.max(0, windowEnd - windowStart),
      trimmedPx: trimmedHeightPx,
      avgHeight: avgHeightRef.current,
      lastTrimReason: lastTrimReasonRef.current,
    }),
    [windowEnd, windowStart, trimmedHeightPx],
  )

  return {
    windowStart,
    windowEnd,
    trimmedHeightPx,
    setItemRef,
    bottomSentinelRef,
    firstVisibleIndex,
    debugStats,
  }
}
