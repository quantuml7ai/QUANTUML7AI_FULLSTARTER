'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { registerForumWindowingTarget } from '../utils/forumWindowingRegistry'

const DEFAULT_WINDOW_STICKY_MS = 780
const DEFAULT_LAYOUT_JITTER_PX = 32
const DEFAULT_SCROLL_SETTLE_MS = 320
const DEFAULT_HEIGHT_DELTA_IGNORE_PX = 2
const DEFAULT_ANCHOR_DELTA_IGNORE_PX = 3
const DEFAULT_ANCHOR_DELTA_MAX_PX = 64
const DEFAULT_ANCHOR_FLUSH_MS = 140
const DEFAULT_ANCHOR_ACTIVE_RETRY_MS = 120
const DEFAULT_REVEAL_HOLD_MS = 1800
const DEFAULT_MIN_SCROLLABLE_HEIGHT = 120
const DEFAULT_FALLBACK_MAX_RENDER = 8
const DEFAULT_FALLBACK_OVERSCAN_PX = 960
const STABLE_MEDIA_SHELL_SELECTOR = [
  '[data-stable-shell="1"]',
  '[data-windowing-keepalive="media"]',
  '[data-forum-windowing-stable="1"]',
  '[data-ads="1"]',
  '.forum-ad-card',
  '.forum-ad-media-slot',
  '.mediaBox[data-kind="video"]',
  '.mediaBox[data-kind="iframe"]',
  'video[data-forum-video="post"]',
  'iframe[data-forum-media]',
  '[data-forum-embed-kind]',
].join(', ')

function defaultIsBrowser() {
  return typeof window !== 'undefined'
}

function getNow() {
  try {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
  } catch {}
  return Date.now()
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function normalizeKey(raw, fallback = '') {
  const normalized = String(raw ?? fallback).trim()
  return normalized || String(fallback || '')
}

function resolveNumericConfig(valueOrFn, fallback, payload) {
  const defaultValue = Number(fallback || 0) || 0
  try {
    if (typeof valueOrFn === 'function') {
      const next = Number(valueOrFn(payload))
      return Number.isFinite(next) ? next : defaultValue
    }
    const next = Number(valueOrFn)
    return Number.isFinite(next) ? next : defaultValue
  } catch {
    return defaultValue
  }
}

function readDefaultLayoutKey(isBrowserFn) {
  try {
    if (!isBrowserFn?.()) return 'tablet'
    const w = Number(window?.innerWidth || 0)
    if (w >= 1024) return 'desktop'
    if (w >= 640) return 'tablet'
    return 'mobile'
  } catch {
    return 'tablet'
  }
}

function hasStableMediaShell(node) {
  try {
    if (!(node instanceof Element)) return false
    if (node.matches?.(STABLE_MEDIA_SHELL_SELECTOR)) return true
    return !!node.querySelector?.(STABLE_MEDIA_SHELL_SELECTOR)
  } catch {
    return false
  }
}

function readRecentScrollAgeMs() {
  try {
    const now = Date.now()
    const last = Math.max(
      Number(window?.__forumUserScrollTs || 0),
      Number(window?.__forumProgrammaticScrollTs || 0),
    )
    return last > 0 ? now - last : Number.POSITIVE_INFINITY
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

export default function useForumWindowing({
  active = true,
  items = [],
  getItemKey,
  getItemDomId,
  estimateItemHeight,
  itemGapPx = 0,
  maxRender = DEFAULT_FALLBACK_MAX_RENDER,
  overscanPx = DEFAULT_FALLBACK_OVERSCAN_PX,
  getScrollEl,
  getLayoutKey,
  isBrowserFn = defaultIsBrowser,
  hardResetRef = null,
  listId = '',
  emitDiag = null,
  diagPrefix = '',
  windowStickyMs = DEFAULT_WINDOW_STICKY_MS,
  layoutJitterPx = DEFAULT_LAYOUT_JITTER_PX,
  scrollSettleMs = DEFAULT_SCROLL_SETTLE_MS,
  heightDeltaIgnorePx = DEFAULT_HEIGHT_DELTA_IGNORE_PX,
  anchorDeltaIgnorePx = DEFAULT_ANCHOR_DELTA_IGNORE_PX,
  anchorDeltaMaxPx = DEFAULT_ANCHOR_DELTA_MAX_PX,
  anchorFlushMs = DEFAULT_ANCHOR_FLUSH_MS,
  anchorActiveRetryMs = DEFAULT_ANCHOR_ACTIVE_RETRY_MS,
  revealHoldMs = DEFAULT_REVEAL_HOLD_MS,
  minScrollableClientHeight = DEFAULT_MIN_SCROLLABLE_HEIGHT,
  scrollToTopOnHardReset = true,
}) {
  const heightsRef = useRef(new Map())
  const rosRef = useRef(new Map())
  const rafRef = useRef(0)
  const hardResetScheduleRef = useRef({ rafA: 0, rafB: 0, timeoutId: 0 })
  const scrollStateRef = useRef({ top: 0, ts: 0, velocity: 0, direction: 0 })
  const scrollActivityRef = useRef({ activeUntil: 0, settleTimer: 0 })
  const pendingAnchorDeltaRef = useRef(0)
  const pendingHeightsRef = useRef(new Map())
  const stableShrinkRef = useRef(new Map())
  const anchorFlushTimerRef = useRef(0)
  const winMetaRef = useRef({ ts: 0, start: 0, end: 0 })
  const winRef = useRef({ start: 0, end: 0, top: 0, bottom: 0 })
  const layoutKeyRef = useRef('unknown')
  const targetLockRef = useRef({ key: '', until: 0, windowSize: 0 })

  const emitWindowingDiag = useCallback((eventName, payload, options = undefined) => {
    if (typeof emitDiag !== 'function') return
    const suffix = String(eventName || '').trim()
    if (!suffix) return
    const prefix = String(diagPrefix || '').trim()
    try {
      emitDiag(prefix ? `${prefix}_${suffix}` : suffix, payload, options)
    } catch {}
  }, [diagPrefix, emitDiag])

  const itemList = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items],
  )
  const totalItems = itemList.length

  const itemKeys = useMemo(
    () => itemList.map((item, index) => normalizeKey(getItemKey?.(item, index), `${index}`)),
    [getItemKey, itemList],
  )

  const keyToIndex = useMemo(() => {
    const map = new Map()
    itemKeys.forEach((key, index) => {
      if (!key) return
      map.set(key, index)
    })
    return map
  }, [itemKeys])

  const domIdToKey = useMemo(() => {
    const map = new Map()
    if (typeof getItemDomId !== 'function') return map
    itemList.forEach((item, index) => {
      const domId = normalizeKey(getItemDomId(item, index), '')
      if (!domId) return
      map.set(domId, itemKeys[index] || '')
    })
    return map
  }, [getItemDomId, itemKeys, itemList])

  const itemKeysRef = useRef(itemKeys)
  const keyToIndexRef = useRef(keyToIndex)
  const domIdToKeyRef = useRef(domIdToKey)

  useEffect(() => {
    itemKeysRef.current = itemKeys
    keyToIndexRef.current = keyToIndex
    domIdToKeyRef.current = domIdToKey
  }, [domIdToKey, itemKeys, keyToIndex])

  const resolveMaxRender = useCallback((velocity = 0) => {
    const raw = resolveNumericConfig(maxRender, DEFAULT_FALLBACK_MAX_RENDER, {
      velocity,
      items: itemList,
      total: totalItems,
    })
    return Math.max(1, Math.round(raw || DEFAULT_FALLBACK_MAX_RENDER))
  }, [itemList, maxRender, totalItems])

  const resolveOverscanPx = useCallback((velocity = 0) => {
    const raw = resolveNumericConfig(overscanPx, DEFAULT_FALLBACK_OVERSCAN_PX, {
      velocity,
      items: itemList,
      total: totalItems,
    })
    return Math.max(80, Math.round(raw || DEFAULT_FALLBACK_OVERSCAN_PX))
  }, [itemList, overscanPx, totalItems])

  const estimateHeightAtIndex = useCallback((index) => {
    const item = itemList[index]
    const raw = resolveNumericConfig(estimateItemHeight, DEFAULT_FALLBACK_OVERSCAN_PX / 2, {
      index,
      item,
      items: itemList,
      total: totalItems,
    })
    return Math.max(40, Math.round(raw || 40))
  }, [estimateItemHeight, itemList, totalItems])

  const resolveItemGapPx = useCallback((index = 0) => {
    const raw = resolveNumericConfig(itemGapPx, 0, {
      index,
      item: itemList[index],
      items: itemList,
      total: totalItems,
    })
    return Math.max(0, Math.round(raw || 0))
  }, [itemGapPx, itemList, totalItems])

  const getHeightAtIndex = useCallback((index) => {
    const key = itemKeysRef.current[index]
    if (key) {
      const measured = Number(heightsRef.current.get(key) || 0)
      if (Number.isFinite(measured) && measured > 1) return measured
    }
    return estimateHeightAtIndex(index)
  }, [estimateHeightAtIndex])

  const getItemExtentAtIndex = useCallback((index, total = totalItems) => {
    const height = getHeightAtIndex(index)
    const gap = index < Math.max(0, Number(total || 0) - 1)
      ? resolveItemGapPx(index)
      : 0
    return height + gap
  }, [getHeightAtIndex, resolveItemGapPx, totalItems])

  const buildWindow = useCallback((start, end, total) => {
    let top = 0
    for (let i = 0; i < start; i += 1) top += getItemExtentAtIndex(i, total)
    if (start > 0) top = Math.max(0, top - resolveItemGapPx(start - 1))

    let bottom = 0
    for (let i = end; i < total; i += 1) bottom += getItemExtentAtIndex(i, total)

    return { start, end, top, bottom }
  }, [getItemExtentAtIndex, resolveItemGapPx])

  const buildInitialWindow = useCallback((total) => {
    const initialEnd = Math.min(resolveMaxRender(0), Math.max(0, Number(total || 0)))
    return { start: 0, end: initialEnd, top: 0, bottom: 0 }
  }, [resolveMaxRender])

  const [win, setWin] = useState(() => buildInitialWindow(totalItems))

  useEffect(() => {
    winRef.current = win
  }, [win])

  const readScrollEl = useCallback(() => {
    try {
      return getScrollEl?.() || document.querySelector('[data-forum-scroll="1"]') || null
    } catch {}
    return null
  }, [getScrollEl])

  const hasInnerScrollable = useCallback((el) => {
    try {
      if (!el) return false
      const clientH = Number(el.clientHeight || 0)
      const scrollH = Number(el.scrollHeight || 0)
      if (clientH < minScrollableClientHeight) return false
      return scrollH > (clientH + 1)
    } catch {
      return false
    }
  }, [minScrollableClientHeight])

  const readViewportState = useCallback(() => {
    const winTop = Number(
      window.pageYOffset ||
      document.documentElement?.scrollTop ||
      document.body?.scrollTop ||
      0,
    )
    const winH = Number(window.innerHeight || 0) || 0

    try {
      const el = readScrollEl()
      if (hasInnerScrollable(el)) {
        return {
          st: Number(el.scrollTop || 0),
          vh: Number(el.clientHeight || 0) || winH,
          mode: 'inner',
        }
      }
    } catch {}

    return { st: winTop, vh: winH, mode: 'window' }
  }, [hasInnerScrollable, readScrollEl])

  const isScrollActiveNow = useCallback(() => {
    try {
      const now = Date.now()
      if (Number(scrollActivityRef.current?.activeUntil || 0) > now) return true
      const velocity = Math.abs(Number(scrollStateRef.current?.velocity || 0))
      return velocity > 0.06
    } catch {
      return false
    }
  }, [])

  const scheduleRecalc = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      try {
        if (!active) return
        const total = itemKeysRef.current.length || 0
        if (!total) {
          const nextEmpty = { start: 0, end: 0, top: 0, bottom: 0 }
          winRef.current = nextEmpty
          setWin(nextEmpty)
          return
        }

        const vp = readViewportState()
        const st = Number(vp?.st || 0)
        const vh = Number(vp?.vh || 0) || Number(window.innerHeight || 0) || 800
        const velocity = Math.abs(Number(scrollStateRef.current?.velocity || 0))
        const direction = Number(scrollStateRef.current?.direction || 0)
        const nextOverscanPx = resolveOverscanPx(velocity)
        const fromY = Math.max(0, st - nextOverscanPx)
        const toY = st + vh + nextOverscanPx

        let start = 0
        let acc = 0
        while (start < total && (acc + getItemExtentAtIndex(start, total)) < fromY) {
          acc += getItemExtentAtIndex(start, total)
          start += 1
        }

        let end = start
        let acc2 = acc
        while (end < total && acc2 < toY) {
          acc2 += getItemExtentAtIndex(end, total)
          end += 1
        }

        const nextMaxRender = resolveMaxRender(velocity)

        if ((end - start) > nextMaxRender) {
          const windowSize = clamp(nextMaxRender, 1, total)

          if (direction < 0) {
            // При скролле назад нельзя центрировать окно:
            // иначе верхний/предыдущий media shell размонтируется прямо перед входом во viewport.
            const reverseBias = Math.min(2, Math.max(1, Math.floor(windowSize * 0.18)))
            start = Math.max(0, start - reverseBias)
            end = Math.min(total, start + windowSize)
          } else if (direction > 0) {
            // При скролле вперёд держим нижний край, чтобы не резать runway.
            const forwardBias = Math.min(1, Math.max(0, Math.floor(windowSize * 0.12)))
            end = Math.min(total, end + forwardBias)
            start = Math.max(0, end - windowSize)
          } else {
            const mid = Math.floor((start + end) / 2)
            const half = Math.floor(windowSize / 2)
            start = Math.max(0, mid - half)
            end = Math.min(total, start + windowSize)
          }

          if ((end - start) < windowSize) {
            start = Math.max(0, end - windowSize)
          }
        }

        const lock = targetLockRef.current
        if (lock?.key && Number(lock.until || 0) > Date.now()) {
          const targetIndex = Number(keyToIndexRef.current.get(lock.key))
          if (Number.isFinite(targetIndex) && targetIndex >= 0 && targetIndex < total) {
            const targetWindowSize = clamp(
              Number(lock.windowSize || nextMaxRender || 1),
              1,
              total,
            )
            if (targetIndex < start || targetIndex >= end) {
              start = clamp(
                targetIndex - Math.floor(targetWindowSize / 2),
                0,
                Math.max(0, total - targetWindowSize),
              )
              end = Math.min(total, start + targetWindowSize)
            }
          }
        } else if (lock?.key) {
          targetLockRef.current = { key: '', until: 0, windowSize: 0 }
        }

        setWin((prev) => {
          let nextStart = start
          let nextEnd = end

          const shrinkOnly =
            nextStart >= prev.start &&
            nextEnd <= prev.end &&
            (nextStart > prev.start || nextEnd < prev.end)

          if (shrinkOnly) {
            const now = Date.now()
            const scrollActiveNow =
              Number(scrollActivityRef.current?.activeUntil || 0) > now ||
              Math.abs(Number(scrollStateRef.current?.velocity || 0)) > 0.06

            if (scrollActiveNow && !targetLockRef.current?.key) {
              return prev
            }

            const recentWindowChange = (now - Number(winMetaRef.current?.ts || 0)) < windowStickyMs
            const stickyItems = velocity > 1.2 ? 2 : 1
            const stickyMaxRender = nextMaxRender + stickyItems
            const leadingTrim = Math.max(0, nextStart - prev.start)
            const trailingTrim = Math.max(0, prev.end - nextEnd)
            const smallShrink = leadingTrim <= stickyItems && trailingTrim <= stickyItems

            if (recentWindowChange || smallShrink) {
              nextStart = prev.start
              nextEnd = prev.end
            } else if (direction > 0 && trailingTrim > 0 && leadingTrim <= (stickyItems * 2)) {
              nextEnd = prev.end
            } else if (direction < 0 && leadingTrim > 0 && trailingTrim <= (stickyItems * 2)) {
              nextStart = prev.start
            }

            if ((nextEnd - nextStart) > stickyMaxRender) {
              if (direction >= 0 && nextEnd === prev.end) {
                nextStart = Math.max(prev.start, nextEnd - stickyMaxRender)
              } else if (direction <= 0 && nextStart === prev.start) {
                nextEnd = Math.min(prev.end, nextStart + stickyMaxRender)
              }
            }
          }

          const next = buildWindow(nextStart, nextEnd, total)
          const topDelta = Math.abs(Number(prev.top || 0) - Number(next.top || 0))
          const bottomDelta = Math.abs(Number(prev.bottom || 0) - Number(next.bottom || 0))

          if (
            prev.start === next.start &&
            prev.end === next.end &&
            prev.top === next.top &&
            prev.bottom === next.bottom
          ) {
            return prev
          }

          if (
            prev.start === next.start &&
            prev.end === next.end &&
            topDelta < layoutJitterPx &&
            bottomDelta < layoutJitterPx
          ) {
            return prev
          }

          winMetaRef.current = { ts: Date.now(), start: next.start, end: next.end }
          winRef.current = next
          return next
        })
      } catch {}
    })
  }, [
    active,
    buildWindow,
    getItemExtentAtIndex,
    layoutJitterPx,
    readViewportState,
    resolveMaxRender,
    resolveOverscanPx,
    windowStickyMs,
  ])

  const applyAnchoredScrollDelta = useCallback((delta, reason = 'height_delta') => {
    const raw = Number(delta || 0)
    if (!Number.isFinite(raw) || Math.abs(raw) < anchorDeltaIgnorePx) return

    if (Math.abs(raw) > anchorDeltaMaxPx) {
      emitWindowingDiag('anchor_large_delta_drop', {
        reason,
        delta: Math.round(raw),
      })
      return
    }

    if (isScrollActiveNow()) {
      emitWindowingDiag('anchor_adjust_deferred_active_scroll', {
        reason,
        delta: Math.round(raw),
        applied: 0,
      })
      return
    }

    let applied = 0

    try {
      const el = readScrollEl()
      const now = Date.now()

      if (hasInnerScrollable(el)) {
        const before = Number(el.scrollTop || 0)
        const maxScroll = Math.max(
          0,
          Number(el.scrollHeight || 0) - Number(el.clientHeight || 0),
        )
        const next = clamp(before + raw, 0, maxScroll || before + raw)

        el.scrollTop = next
        applied = Number(el.scrollTop || 0) - before
      } else if (typeof window !== 'undefined') {
        const doc = document.documentElement
        const body = document.body
        const before = Number(window.scrollY || window.pageYOffset || 0)
        const maxScroll = Math.max(
          0,
          Math.max(
            Number(doc?.scrollHeight || 0),
            Number(body?.scrollHeight || 0),
          ) - Number(window.innerHeight || 0),
        )
        const next = clamp(before + raw, 0, maxScroll || before + raw)

        window.__forumProgrammaticScrollTs = now
        window.scrollTo(0, next)
        applied = next - before
      }
    } catch {}

    emitWindowingDiag('anchor_adjust_apply', {
      reason,
      delta: Math.round(raw),
      applied: Math.round(applied),
    })
  }, [
    anchorDeltaIgnorePx,
    anchorDeltaMaxPx,
    emitWindowingDiag,
    hasInnerScrollable,
    isScrollActiveNow,
    readScrollEl,
  ])

  const applyPendingMeasuredHeights = useCallback((reason = 'flush') => {
    let applied = 0
    try {
      pendingHeightsRef.current.forEach((height, key) => {
        const nextHeight = Math.round(Number(height || 0))
        if (!key || !Number.isFinite(nextHeight) || nextHeight <= 1) return
        heightsRef.current.set(key, nextHeight)
        applied += 1
      })
      pendingHeightsRef.current.clear()
      if (applied > 0) {
        emitWindowingDiag('media_height_deferred_apply', {
          reason,
          applied,
        })
      }
    } catch {}
    return applied
  }, [emitWindowingDiag])

  const scheduleAnchorFlush = useCallback((delay = anchorFlushMs) => {
    try {
      if (anchorFlushTimerRef.current) {
        clearTimeout(anchorFlushTimerRef.current)
        anchorFlushTimerRef.current = 0
      }

      const flush = () => {
        anchorFlushTimerRef.current = 0

        if (isScrollActiveNow()) {
          anchorFlushTimerRef.current = setTimeout(flush, anchorActiveRetryMs)
          return
        }

        applyPendingMeasuredHeights('scroll_settled')

        const pending = Number(pendingAnchorDeltaRef.current || 0)
        pendingAnchorDeltaRef.current = 0

        if (Math.abs(pending) >= anchorDeltaIgnorePx) {
          if (Math.abs(pending) <= anchorDeltaMaxPx) {
            applyAnchoredScrollDelta(pending, 'deferred_height_above_window')
          } else {
            emitWindowingDiag('anchor_large_delta_drop', {
              reason: 'large_deferred_height_delta_above_window',
              pending: Math.round(pending),
            })
          }
        }

        scheduleRecalc()
      }

      anchorFlushTimerRef.current = setTimeout(flush, Math.max(16, Number(delay || 0)))
    } catch {}
  }, [
    anchorActiveRetryMs,
    anchorDeltaIgnorePx,
    anchorDeltaMaxPx,
    anchorFlushMs,
    applyAnchoredScrollDelta,
    applyPendingMeasuredHeights,
    emitWindowingDiag,
    isScrollActiveNow,
    scheduleRecalc,
  ])

  const ensureItemRenderedByKey = useCallback((rawKey, options = null) => {
    const key = normalizeKey(rawKey, '')
    if (!key) return false
    const targetIndex = keyToIndexRef.current.get(key)
    if (!Number.isFinite(targetIndex)) return false

    const nextWindowSize = clamp(
      Math.round(
        resolveNumericConfig(
          options?.windowSize,
          resolveMaxRender(Math.abs(Number(scrollStateRef.current?.velocity || 0))),
          { key, index: targetIndex },
        ),
      ),
      1,
      Math.max(1, itemKeysRef.current.length || 1),
    )

    targetLockRef.current = {
      key,
      until: Date.now() + Math.max(180, Number(options?.holdMs || revealHoldMs) || revealHoldMs),
      windowSize: nextWindowSize,
    }

    scheduleRecalc()
    return true
  }, [revealHoldMs, resolveMaxRender, scheduleRecalc])

  const ensureItemRenderedByDomId = useCallback((rawDomId, options = null) => {
    const domId = normalizeKey(rawDomId, '')
    if (!domId) return false
    const key = domIdToKeyRef.current.get(domId)
    if (!key) return false
    return ensureItemRenderedByKey(key, options)
  }, [ensureItemRenderedByKey])

  const measureRef = useCallback((rawKey) => (node) => {
    const key = normalizeKey(rawKey, '')
    if (!key) return
    try {
      if (!node) {
        const ro = rosRef.current.get(key)
        if (ro) {
          try { ro.disconnect() } catch {}
        }
        rosRef.current.delete(key)
        pendingHeightsRef.current.delete(key)
        stableShrinkRef.current.delete(key)
        return
      }

      const update = () => {
        try {
          const index = keyToIndexRef.current.get(key)
          if (!Number.isFinite(index)) return

          const h = node.getBoundingClientRect?.()?.height
          if (!Number.isFinite(h) || h <= 1) return

          const nextHeight = Math.round(h)
          const prev = Number(heightsRef.current.get(key) || 0)
          const stableMediaShell = hasStableMediaShell(node)

          if (
            stableMediaShell &&
            Number.isFinite(prev) &&
            prev > 0 &&
            nextHeight < prev &&
            (prev - nextHeight) >= Math.max(48, layoutJitterPx)
          ) {
            const now = Date.now()
            const prevShrink = stableShrinkRef.current.get(key)
            const sameShrink =
              prevShrink &&
              Math.abs(Number(prevShrink.height || 0) - nextHeight) < heightDeltaIgnorePx
            const firstSeenTs = sameShrink ? Number(prevShrink.firstSeenTs || now) : now
            stableShrinkRef.current.set(key, { height: nextHeight, firstSeenTs })

            const recentScroll = readRecentScrollAgeMs() < Math.max(520, scrollSettleMs * 2)
            const stableForMs = now - firstSeenTs
            const mayApplyShrink = !recentScroll && stableForMs >= Math.max(520, scrollSettleMs)

            if (!mayApplyShrink) {
              pendingHeightsRef.current.set(key, prev)
              emitWindowingDiag('stable_media_height_shrink_deferred', {
                key,
                prev: Math.round(prev),
                next: nextHeight,
                recentScroll,
              })
              scheduleAnchorFlush(scrollSettleMs)
              return
            }
          } else {
            stableShrinkRef.current.delete(key)
          }

          if (Number.isFinite(prev) && prev > 0 && Math.abs(prev - nextHeight) < heightDeltaIgnorePx) {
            return
          }

          if (Number.isFinite(prev) && prev > 0 && isScrollActiveNow() && stableMediaShell) {
            pendingHeightsRef.current.set(key, nextHeight)
            emitWindowingDiag('media_height_deferred_during_scroll', {
              key,
              prev: Math.round(prev),
              next: nextHeight,
            })
            scheduleAnchorFlush(scrollSettleMs)
            return
          }

          heightsRef.current.set(key, nextHeight)

          if (Number.isFinite(prev) && prev > 0) {
            const delta = nextHeight - prev
            const isAboveWindow = index < Number(winRef.current?.start || 0)

            if (delta !== 0 && isAboveWindow) {
              if (isScrollActiveNow()) {
                pendingAnchorDeltaRef.current += delta
                scheduleAnchorFlush()
              } else if (Math.abs(delta) <= anchorDeltaMaxPx) {
                applyAnchoredScrollDelta(delta, 'height_above_window')
              } else {
                emitWindowingDiag('anchor_large_delta_drop', {
                  reason: 'large_height_delta_above_window',
                  key,
                  index,
                  delta: Math.round(delta),
                })
              }
            }
          }

          if (isScrollActiveNow()) {
            scheduleAnchorFlush(scrollSettleMs)
            return
          }

          scheduleRecalc()
        } catch {}
      }

      update()

      if (!rosRef.current.get(key) && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => update())
        ro.observe(node)
        rosRef.current.set(key, ro)
      }
    } catch {}
  }, [
    anchorDeltaMaxPx,
    applyAnchoredScrollDelta,
    emitWindowingDiag,
    heightDeltaIgnorePx,
    isScrollActiveNow,
    layoutJitterPx,
    scheduleAnchorFlush,
    scheduleRecalc,
    scrollSettleMs,
  ])

  useEffect(() => {
    const activeKeys = new Set(itemKeys)

    heightsRef.current.forEach((_, key) => {
      if (!activeKeys.has(key)) heightsRef.current.delete(key)
    })

    pendingHeightsRef.current.forEach((_, key) => {
      if (!activeKeys.has(key)) pendingHeightsRef.current.delete(key)
    })

    stableShrinkRef.current.forEach((_, key) => {
      if (!activeKeys.has(key)) stableShrinkRef.current.delete(key)
    })

    rosRef.current.forEach((ro, key) => {
      if (activeKeys.has(key)) return
      try { ro.disconnect() } catch {}
      rosRef.current.delete(key)
    })

    if (targetLockRef.current?.key && !activeKeys.has(targetLockRef.current.key)) {
      targetLockRef.current = { key: '', until: 0, windowSize: 0 }
    }

    scheduleRecalc()
  }, [itemKeys, scheduleRecalc])

  useEffect(() => {
    if (!active) return undefined
    if (!isBrowserFn()) return undefined

    layoutKeyRef.current = normalizeKey(getLayoutKey?.(), readDefaultLayoutKey(isBrowserFn))
    const scrollActivity = scrollActivityRef.current
    const pendingHeights = pendingHeightsRef.current
    const stableShrinks = stableShrinkRef.current
    const doc = document

    const onScroll = () => {
      try {
        const vp = readViewportState()
        const now = getNow()
        const top = Number(vp?.st || 0)
        const prev = scrollStateRef.current
        const dt = Math.max(1, now - Number(prev?.ts || 0))
        const signedDy = top - Number(prev?.top || 0)
        const dy = Math.abs(signedDy)
        const velocity = dt > 220 ? 0 : (dy / dt)
        const direction = dy < 2 ? Number(prev?.direction || 0) : (signedDy > 0 ? 1 : -1)

        scrollStateRef.current = { top, ts: now, velocity, direction }

        scrollActivity.activeUntil = Date.now() + scrollSettleMs
        if (scrollActivity.settleTimer) {
          try { clearTimeout(scrollActivity.settleTimer) } catch {}
          scrollActivity.settleTimer = 0
        }

        scrollActivity.settleTimer = setTimeout(() => {
          scrollActivity.settleTimer = 0
          scheduleRecalc()
        }, scrollSettleMs)
      } catch {}

      scheduleRecalc()
    }

    const onResize = () => {
      try {
        const prevLayoutKey = layoutKeyRef.current
        const nextLayoutKey = normalizeKey(getLayoutKey?.(), readDefaultLayoutKey(isBrowserFn))
        if (prevLayoutKey !== nextLayoutKey) {
          layoutKeyRef.current = nextLayoutKey
          try { heightsRef.current.clear() } catch {}
          try { pendingHeights.clear() } catch {}
          try { stableShrinks.clear() } catch {}
          emitWindowingDiag('breakpoint_reset', {
            prevBp: prevLayoutKey,
            nextBp: nextLayoutKey,
            items: totalItems,
          })
        }
        scheduleRecalc()
      } catch {}
    }

    const passiveOpts = { passive: true }
    window.addEventListener('scroll', onScroll, passiveOpts)
    window.addEventListener('resize', onResize, passiveOpts)
    doc.addEventListener('scroll', onScroll, { passive: true, capture: true })

    try {
      window.visualViewport?.addEventListener?.('resize', onResize, passiveOpts)
      window.visualViewport?.addEventListener?.('scroll', onResize, passiveOpts)
    } catch {}

    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      doc.removeEventListener('scroll', onScroll, true)

      try {
        window.visualViewport?.removeEventListener?.('resize', onResize)
        window.visualViewport?.removeEventListener?.('scroll', onResize)
      } catch {}

      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current) } catch {}
        rafRef.current = 0
      }

      if (scrollActivity.settleTimer) {
        try { clearTimeout(scrollActivity.settleTimer) } catch {}
        scrollActivity.settleTimer = 0
      }

      if (anchorFlushTimerRef.current) {
        try { clearTimeout(anchorFlushTimerRef.current) } catch {}
        anchorFlushTimerRef.current = 0
      }

      pendingAnchorDeltaRef.current = 0
      try { pendingHeights.clear() } catch {}
      try { stableShrinks.clear() } catch {}
      scrollActivity.activeUntil = 0
      scrollStateRef.current = { top: 0, ts: 0, velocity: 0, direction: 0 }
    }
  }, [
    active,
    emitWindowingDiag,
    getLayoutKey,
    isBrowserFn,
    readViewportState,
    scheduleRecalc,
    scrollSettleMs,
    totalItems,
  ])

  useEffect(() => {
    if (!hardResetRef || typeof hardResetRef !== 'object') return undefined

    const cancelHardResetSchedule = () => {
      const scheduled = hardResetScheduleRef.current
      if (scheduled.rafA) {
        try { cancelAnimationFrame(scheduled.rafA) } catch {}
        scheduled.rafA = 0
      }
      if (scheduled.rafB) {
        try { cancelAnimationFrame(scheduled.rafB) } catch {}
        scheduled.rafB = 0
      }
      if (scheduled.timeoutId) {
        try { clearTimeout(scheduled.timeoutId) } catch {}
        scheduled.timeoutId = 0
      }
    }

    hardResetRef.current = () => {
      emitWindowingDiag('hard_reset', {
        source: 'hardResetRef',
        items: itemKeysRef.current.length || 0,
      }, { force: true })

      try { heightsRef.current.clear() } catch {}
      try { pendingHeightsRef.current.clear() } catch {}
      try { stableShrinkRef.current.clear() } catch {}
      try { pendingAnchorDeltaRef.current = 0 } catch {}
      try {
        if (anchorFlushTimerRef.current) clearTimeout(anchorFlushTimerRef.current)
        anchorFlushTimerRef.current = 0
      } catch {}
      targetLockRef.current = { key: '', until: 0, windowSize: 0 }

      const initial = buildInitialWindow(itemKeysRef.current.length || 0)
      winMetaRef.current = { ts: Date.now(), start: initial.start, end: initial.end }
      winRef.current = initial
      setWin(initial)

      try {
        if (scrollToTopOnHardReset) {
          const el = readScrollEl()
          if (hasInnerScrollable(el)) el.scrollTop = 0
          else window.scrollTo(0, 0)
        }
      } catch {}

      try {
        cancelHardResetSchedule()
        hardResetScheduleRef.current.rafA = requestAnimationFrame(() => {
          hardResetScheduleRef.current.rafB = requestAnimationFrame(() => {
            try { scheduleRecalc() } catch {}
          })
        })
      } catch {
        try {
          cancelHardResetSchedule()
          hardResetScheduleRef.current.timeoutId = setTimeout(() => {
            try { scheduleRecalc() } catch {}
          }, 0)
        } catch {}
      }
    }

    return () => {
      cancelHardResetSchedule()
      try { hardResetRef.current = null } catch {}
    }
  }, [
    buildInitialWindow,
    emitWindowingDiag,
    hardResetRef,
    hasInnerScrollable,
    readScrollEl,
    scheduleRecalc,
    scrollToTopOnHardReset,
  ])

  useEffect(() => {
    if (!active) return undefined
    const registryKey = normalizeKey(listId, '')
    if (!registryKey) return undefined

    return registerForumWindowingTarget(registryKey, {
      revealKey: (key, options) => ensureItemRenderedByKey(key, options),
      revealDomId: (domId, options) => ensureItemRenderedByDomId(domId, options),
    })
  }, [active, ensureItemRenderedByDomId, ensureItemRenderedByKey, listId])

  useEffect(() => {
    const ros = rosRef.current
    const pendingHeights = pendingHeightsRef.current
    const stableShrinks = stableShrinkRef.current
    return () => {
      try {
        ros.forEach((ro) => {
          try { ro.disconnect() } catch {}
        })
        ros.clear()
      } catch {}
      try {
        if (anchorFlushTimerRef.current) clearTimeout(anchorFlushTimerRef.current)
        anchorFlushTimerRef.current = 0
        pendingAnchorDeltaRef.current = 0
        pendingHeights.clear()
        stableShrinks.clear()
      } catch {}
    }
  }, [])

  const visibleItems = useMemo(
    () => itemList.slice(win.start, win.end),
    [itemList, win.end, win.start],
  )

  return {
    win,
    visibleItems,
    measureRef,
    ensureItemRenderedByKey,
    ensureItemRenderedByDomId,
  }
}
