import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import interleaveRecommendationRails from '../../feed/utils/interleaveRecommendationRails'
import { readForumRuntimeConfig } from '../../../shared/config/runtime'

const VF_OVERSCAN_PX = 1120
const VF_OVERSCAN_PX_MOBILE = 860
const VF_OVERSCAN_PX_TABLET = 980
const VF_VIDEO_CARD_H_MOBILE = 650
const VF_VIDEO_CARD_H_TABLET = 550
const VF_VIDEO_CARD_H_DESKTOP = 550
const VF_AD_CARD_H_MOBILE = 520
const VF_AD_CARD_H_TABLET = 620
const VF_AD_CARD_H_DESKTOP = 650
const VF_RECOMMENDATION_CARD_H_MOBILE = 278
const VF_RECOMMENDATION_CARD_H_TABLET = 304
const VF_RECOMMENDATION_CARD_H_DESKTOP = 328
const VF_ITEM_CHROME_EST = 240
const VF_WINDOW_STICKY_MS = 780
const VF_LAYOUT_JITTER_PX = 32
const VF_SCROLL_SETTLE_MS = 320
const VF_HEIGHT_DELTA_IGNORE_PX = 2
const VF_ANCHOR_DELTA_IGNORE_PX = 3
const VF_ANCHOR_DELTA_MAX_PX = 180
const VF_ANCHOR_FLUSH_MS = 140
const VF_ANCHOR_ACTIVE_RETRY_MS = 120

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

export default function useVideoFeedWindowing({
  videoFeedOpen,
  visibleVideoFeed,
  adEvery,
  debugAdsSlots,
  interleaveAdsFn,
  bodyRef,
  emitDiag,
  videoFeedHardResetRef,
  isBrowserFn = defaultIsBrowser,
}) {
  const vfHeightsRef = useRef(new Map())
  const vfRosRef = useRef(new Map())
  const vfRafRef = useRef(0)
  const vfHardResetScheduleRef = useRef({ rafA: 0, rafB: 0, timeoutId: 0 })
  const vfScrollStateRef = useRef({ top: 0, ts: 0, velocity: 0, direction: 0 })
  const vfScrollActivityRef = useRef({ activeUntil: 0, settleTimer: 0 })
  const vfPendingAnchorDeltaRef = useRef(0)
  const vfAnchorFlushTimerRef = useRef(0)
  const vfLastAnchorAdjustTsRef = useRef(0)
  const vfWinMetaRef = useRef({ ts: 0, start: 0, end: 0 })
  const vfBreakpointRef = useRef('unknown')
  const vfWinRef = useRef({ start: 0, end: 0, top: 0, bottom: 0 })

  const [vfWin, setVfWin] = useState(() => ({ start: 0, end: 0, top: 0, bottom: 0 }))

  useEffect(() => {
    vfWinRef.current = vfWin
  }, [vfWin])

  const vfGetBreakpoint = useCallback(() => {
    try {
      if (!isBrowserFn()) return 'tablet'
      const w = Number(window?.innerWidth || 0)
      if (w >= 1024) return 'desktop'
      if (w >= 640) return 'tablet'
      return 'mobile'
    } catch {
      return 'tablet'
    }
  }, [isBrowserFn])

  const vfGetMaxRender = useCallback(() => {
    try {
      if (!isBrowserFn()) return 6
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const dm = Number(window?.navigator?.deviceMemory || 0)
if (coarse) return 8
if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 8
return 10
    } catch {
      return 6
    }
  }, [isBrowserFn])

  const vfGetOverscanPx = useCallback((velocity = 0) => {
    try {
      if (!isBrowserFn()) return VF_OVERSCAN_PX_TABLET
      const w = Number(window?.innerWidth || 0)
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const base =
        coarse || w < 700
          ? VF_OVERSCAN_PX_MOBILE
          : w < 1100
            ? VF_OVERSCAN_PX_TABLET
            : VF_OVERSCAN_PX

      const v = Math.min(1, Math.abs(Number(velocity || 0)) / 2.6)
      const boost = coarse ? 0.28 : 0.55

      return Math.round(base * (1 + v * boost))
    } catch {
      return VF_OVERSCAN_PX_MOBILE
    }
  }, [isBrowserFn])

  const vfGetFixedItemH = useCallback(() => {
    try {
      if (!isBrowserFn()) return VF_VIDEO_CARD_H_TABLET
      const w = window?.innerWidth || 0
      if (w >= 1024) return VF_VIDEO_CARD_H_DESKTOP
      if (w >= 640) return VF_VIDEO_CARD_H_TABLET
      return VF_VIDEO_CARD_H_MOBILE
    } catch {
      return VF_VIDEO_CARD_H_TABLET
    }
  }, [isBrowserFn])

  const vfGetFixedAdH = useCallback(() => {
    try {
      if (!isBrowserFn()) return VF_AD_CARD_H_TABLET
      const w = window?.innerWidth || 0
      if (w >= 1024) return VF_AD_CARD_H_DESKTOP
      if (w >= 640) return VF_AD_CARD_H_TABLET
      return VF_AD_CARD_H_MOBILE
    } catch {
      return VF_AD_CARD_H_TABLET
    }
  }, [isBrowserFn])

  const vfRecommendationsEvery = useMemo(() => {
    const runtimeCfg = readForumRuntimeConfig()
    return Math.max(0, Number(runtimeCfg?.userRecommendations?.every || 0) || 0)
  }, [])

  const vfSlots = useMemo(() => {
    const slotsWithAds = debugAdsSlots(
      'video',
      interleaveAdsFn(visibleVideoFeed || [], adEvery, {
        isSkippable: (p) => !p || !p.id,
        getId: (p) => p?.id || `${p?.topicId || 'vf'}:${p?.ts || 0}`,
      })
    )

    if (vfRecommendationsEvery <= 0) return slotsWithAds

    return interleaveRecommendationRails(slotsWithAds, vfRecommendationsEvery, {
      isSkippable: (slot) => {
        if (String(slot?.type || '') !== 'item') return true
        return !slot?.item?.id
      },
    })
  }, [visibleVideoFeed, adEvery, debugAdsSlots, interleaveAdsFn, vfRecommendationsEvery])

  const vfGetScrollEl = useCallback(() => {
    try {
      return bodyRef.current || document.querySelector('[data-forum-scroll="1"]') || null
    } catch {}
    return null
  }, [bodyRef])

  const vfHasInnerScrollable = useCallback((el) => {
    try {
      if (!el) return false
      const clientH = Number(el.clientHeight || 0)
      const scrollH = Number(el.scrollHeight || 0)
      if (clientH < 120) return false
      return scrollH > (clientH + 1)
    } catch {
      return false
    }
  }, [])

  const vfReadViewportState = useCallback(() => {
    const winTop = Number(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    const winH = Number(window.innerHeight || 0) || 0

    try {
      const el = vfGetScrollEl()
      if (vfHasInnerScrollable(el)) {
        return {
          st: Number(el.scrollTop || 0),
          vh: Number(el.clientHeight || 0) || winH,
          mode: 'inner',
        }
      }
    } catch {}

    return { st: winTop, vh: winH, mode: 'window' }
  }, [vfGetScrollEl, vfHasInnerScrollable])

  const vfAdjustScrollBy = useCallback((delta) => {
    const d = Number(delta || 0)
    if (!Number.isFinite(d) || Math.abs(d) < 1) return

    try {
      const el = vfGetScrollEl()
      if (vfHasInnerScrollable(el)) {
        el.scrollTop = Math.max(0, Number(el.scrollTop || 0) + d)
        return
      }
    } catch {}

    try {
      const nextTop = Math.max(
        0,
        Number(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) + d
      )
      window.scrollTo(0, nextTop)
    } catch {}
  }, [vfGetScrollEl, vfHasInnerScrollable])

  const vfGetFixedRecommendationH = useCallback(() => {
    try {
      if (!isBrowserFn()) return VF_RECOMMENDATION_CARD_H_TABLET
      const w = window?.innerWidth || 0
      if (w >= 1024) return VF_RECOMMENDATION_CARD_H_DESKTOP
      if (w >= 640) return VF_RECOMMENDATION_CARD_H_TABLET
      return VF_RECOMMENDATION_CARD_H_MOBILE
    } catch {
      return VF_RECOMMENDATION_CARD_H_TABLET
    }
  }, [isBrowserFn])

  const vfEstimateH = useCallback((i) => {
    const slot = vfSlots?.[i]
    if (slot?.type === 'recommendation_rail') return vfGetFixedRecommendationH()
    if (slot && slot.type !== 'item') return vfGetFixedAdH()
    return vfGetFixedItemH() + VF_ITEM_CHROME_EST
  }, [vfSlots, vfGetFixedRecommendationH, vfGetFixedAdH, vfGetFixedItemH])

  const vfGetH = useCallback((i) => {
    const h = vfHeightsRef.current.get(i)
    if (Number.isFinite(h) && h > 1) return h
    return vfEstimateH(i)
  }, [vfEstimateH])

  const vfBuildWindow = useCallback((start, end, total) => {
    let top = 0
    for (let i = 0; i < start; i++) top += vfGetH(i)

    let bottom = 0
    for (let i = end; i < total; i++) bottom += vfGetH(i)

    return { start, end, top, bottom }
  }, [vfGetH])

  const vfRecalcWindow = useCallback(() => {
    if (!isBrowserFn()) return
    if (!videoFeedOpen) return

    const total = vfSlots.length || 0
    if (!total) {
      const nextEmpty = { start: 0, end: 0, top: 0, bottom: 0 }
      vfWinRef.current = nextEmpty
      setVfWin(nextEmpty)
      return
    }

    const vp = vfReadViewportState()
    const st = Number(vp?.st || 0)
    const vh = Number(vp?.vh || 0) || Number(window.innerHeight || 0) || 800
    const velocity = Math.abs(Number(vfScrollStateRef.current?.velocity || 0))
    const direction = Number(vfScrollStateRef.current?.direction || 0)
    const overscanPx = vfGetOverscanPx(velocity)
    const fromY = Math.max(0, st - overscanPx)
    const toY = st + vh + overscanPx

    let acc = 0
    let start = 0
    while (start < total && (acc + vfGetH(start)) < fromY) {
      acc += vfGetH(start)
      start++
    }

    let end = start
    let acc2 = acc
    while (end < total && acc2 < toY) {
      acc2 += vfGetH(end)
      end++
    }

    const vfMaxRender =
      vfGetMaxRender() +
      (velocity > 1.0 && !(window?.matchMedia?.('(pointer: coarse)')?.matches) ? 1 : 0)

    if ((end - start) > vfMaxRender) {
      const mid = Math.floor((start + end) / 2)
      const half = Math.floor(vfMaxRender / 2)
      start = Math.max(0, mid - half)
      end = Math.min(total, start + vfMaxRender)
    }

    setVfWin((prev) => {
      let nextStart = start
      let nextEnd = end

      const shrinkOnly =
        nextStart >= prev.start &&
        nextEnd <= prev.end &&
        (nextStart > prev.start || nextEnd < prev.end)

      if (shrinkOnly) {
        const now = Date.now()
        const recentWindowChange = (now - Number(vfWinMetaRef.current?.ts || 0)) < VF_WINDOW_STICKY_MS
        const stickyItems = velocity > 1.2 ? 3 : velocity > 0.55 ? 2 : 2
        const stickyMaxRender = vfMaxRender + stickyItems
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

      const next = vfBuildWindow(nextStart, nextEnd, total)
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
        topDelta < VF_LAYOUT_JITTER_PX &&
        bottomDelta < VF_LAYOUT_JITTER_PX
      ) {
        return prev
      }

      vfWinMetaRef.current = { ts: Date.now(), start: next.start, end: next.end }
      vfWinRef.current = next
      return next
    })
  }, [
    videoFeedOpen,
    vfSlots.length,
    vfReadViewportState,
    vfGetH,
    vfGetMaxRender,
    vfGetOverscanPx,
    vfBuildWindow,
    isBrowserFn,
  ])

  const vfScheduleRecalc = useCallback(() => {
    if (vfRafRef.current) return
    vfRafRef.current = requestAnimationFrame(() => {
      vfRafRef.current = 0
      try { vfRecalcWindow() } catch {}
    })
  }, [vfRecalcWindow])

  const vfIsScrollActiveNow = useCallback(() => {
    try {
      const now = Date.now()
      if (Number(vfScrollActivityRef.current?.activeUntil || 0) > now) return true
      const velocity = Math.abs(Number(vfScrollStateRef.current?.velocity || 0))
      return velocity > 0.06
    } catch {
      return false
    }
  }, [])

  const vfApplyAnchoredScrollDelta = useCallback((delta, reason = 'height_delta') => {
    const raw = Number(delta || 0)
    if (!Number.isFinite(raw) || Math.abs(raw) < VF_ANCHOR_DELTA_IGNORE_PX) return

    const applied = Math.sign(raw) * Math.min(Math.abs(raw), VF_ANCHOR_DELTA_MAX_PX)
    vfLastAnchorAdjustTsRef.current = Date.now()

    try { vfAdjustScrollBy(applied) } catch {}

    try {
      emitDiag?.('video_feed_anchor_adjust', {
        reason,
        delta: Math.round(raw),
        applied: Math.round(applied),
        pendingLeft: Math.round(raw - applied),
      })
    } catch {}
  }, [vfAdjustScrollBy, emitDiag])

  const vfScheduleAnchorFlush = useCallback((delay = VF_ANCHOR_FLUSH_MS) => {
    try {
      if (vfAnchorFlushTimerRef.current) {
        clearTimeout(vfAnchorFlushTimerRef.current)
        vfAnchorFlushTimerRef.current = 0
      }

      const flush = () => {
        vfAnchorFlushTimerRef.current = 0

        if (vfIsScrollActiveNow()) {
          vfAnchorFlushTimerRef.current = setTimeout(flush, VF_ANCHOR_ACTIVE_RETRY_MS)
          return
        }

        const pending = Number(vfPendingAnchorDeltaRef.current || 0)
        vfPendingAnchorDeltaRef.current = 0

        if (Math.abs(pending) >= VF_ANCHOR_DELTA_IGNORE_PX) {
          vfApplyAnchoredScrollDelta(pending, 'deferred_height_above_window')
        }

        vfScheduleRecalc()
      }

      vfAnchorFlushTimerRef.current = setTimeout(flush, Math.max(16, Number(delay || 0)))
    } catch {}
  }, [vfApplyAnchoredScrollDelta, vfIsScrollActiveNow, vfScheduleRecalc])

  useEffect(() => {
    const cancelHardResetSchedule = () => {
      const scheduled = vfHardResetScheduleRef.current
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

    videoFeedHardResetRef.current = () => {
      try {
        emitDiag?.('video_feed_hard_reset', {
          source: 'videoFeedHardResetRef',
          slots: Number(vfSlots?.length || 0),
        }, { force: true })
      } catch {}

      try { vfHeightsRef.current.clear() } catch {}
      try { vfPendingAnchorDeltaRef.current = 0 } catch {}
      try {
        if (vfAnchorFlushTimerRef.current) clearTimeout(vfAnchorFlushTimerRef.current)
        vfAnchorFlushTimerRef.current = 0
      } catch {}

      const initialEnd = Math.min(vfGetMaxRender(), Math.max(0, vfSlots.length || 0))
      const initial = { start: 0, end: initialEnd, top: 0, bottom: 0 }

      vfWinMetaRef.current = { ts: Date.now(), start: initial.start, end: initial.end }
      vfWinRef.current = initial
      setVfWin(initial)

      try {
        const el = vfGetScrollEl()
        if (vfHasInnerScrollable(el)) el.scrollTop = 0
        else window.scrollTo(0, 0)
      } catch {}

      try {
        cancelHardResetSchedule()
        vfHardResetScheduleRef.current.rafA = requestAnimationFrame(() => {
          vfHardResetScheduleRef.current.rafB = requestAnimationFrame(() => {
            try { vfScheduleRecalc() } catch {}
          })
        })
      } catch {
        try {
          cancelHardResetSchedule()
          vfHardResetScheduleRef.current.timeoutId = setTimeout(() => {
            try { vfScheduleRecalc() } catch {}
          }, 0)
        } catch {}
      }
    }

    return () => {
      cancelHardResetSchedule()
      try { videoFeedHardResetRef.current = null } catch {}
    }
  }, [
    vfSlots.length,
    vfGetScrollEl,
    vfHasInnerScrollable,
    vfScheduleRecalc,
    emitDiag,
    videoFeedHardResetRef,
    vfGetMaxRender,
  ])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    vfBreakpointRef.current = vfGetBreakpoint()

    const scrollActivity = vfScrollActivityRef.current
    const doc = document

    const onScroll = () => {
      try {
        const vp = vfReadViewportState()
        const now = getNow()
        const top = Number(vp?.st || 0)
        const prev = vfScrollStateRef.current
        const dt = Math.max(1, now - Number(prev?.ts || 0))
        const signedDy = top - Number(prev?.top || 0)
        const dy = Math.abs(signedDy)
        const velocity = dt > 220 ? 0 : (dy / dt)
        const direction = dy < 2 ? Number(prev?.direction || 0) : (signedDy > 0 ? 1 : -1)

        vfScrollStateRef.current = { top, ts: now, velocity, direction }

        scrollActivity.activeUntil = Date.now() + VF_SCROLL_SETTLE_MS
        if (scrollActivity.settleTimer) {
          try { clearTimeout(scrollActivity.settleTimer) } catch {}
          scrollActivity.settleTimer = 0
        }

        scrollActivity.settleTimer = setTimeout(() => {
          scrollActivity.settleTimer = 0
          vfScheduleRecalc()
        }, VF_SCROLL_SETTLE_MS)
      } catch {}

      vfScheduleRecalc()
    }

    const onResize = () => {
      try {
        const prevBp = vfBreakpointRef.current
        const nextBp = vfGetBreakpoint()

        if (prevBp !== nextBp) {
          vfBreakpointRef.current = nextBp
          try { vfHeightsRef.current.clear() } catch {}

          try {
            emitDiag?.('video_feed_breakpoint_reset', {
              prevBp,
              nextBp,
              slots: Number(vfSlots?.length || 0),
            })
          } catch {}
        }

        vfScheduleRecalc()
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

      if (vfRafRef.current) {
        try { cancelAnimationFrame(vfRafRef.current) } catch {}
        vfRafRef.current = 0
      }

      if (scrollActivity.settleTimer) {
        try { clearTimeout(scrollActivity.settleTimer) } catch {}
        scrollActivity.settleTimer = 0
      }

      if (vfAnchorFlushTimerRef.current) {
        try { clearTimeout(vfAnchorFlushTimerRef.current) } catch {}
        vfAnchorFlushTimerRef.current = 0
      }
      vfPendingAnchorDeltaRef.current = 0

      scrollActivity.activeUntil = 0
      vfScrollStateRef.current = { top: 0, ts: 0, velocity: 0, direction: 0 }
    }
  }, [
    videoFeedOpen,
    vfScheduleRecalc,
    vfReadViewportState,
    vfGetBreakpoint,
    vfSlots.length,
    emitDiag,
    isBrowserFn,
  ])

  const vfMeasureRef = useCallback((idx) => (node) => {
    try {
      if (!node) {
        const ro = vfRosRef.current.get(idx)
        if (ro) {
          try { ro.disconnect() } catch {}
        }
        vfRosRef.current.delete(idx)
        return
      }

      const update = () => {
        try {
          const h = node.getBoundingClientRect?.()?.height
          if (!Number.isFinite(h) || h <= 1) return

          const nextH = Math.round(h)
          const prev = vfHeightsRef.current.get(idx)

          if (Number.isFinite(prev) && Math.abs(prev - nextH) < VF_HEIGHT_DELTA_IGNORE_PX) {
            return
          }

          vfHeightsRef.current.set(idx, nextH)

          if (Number.isFinite(prev)) {
            const delta = nextH - prev
            const isAboveWindow = idx < Number(vfWinRef.current?.start || 0)

            if (delta !== 0 && isAboveWindow) {
              if (vfIsScrollActiveNow()) {
                vfPendingAnchorDeltaRef.current += delta
                vfScheduleAnchorFlush()
              } else {
                vfApplyAnchoredScrollDelta(delta, 'height_above_window')
              }
            }
          }

          if (vfIsScrollActiveNow()) {
            vfScheduleAnchorFlush(VF_SCROLL_SETTLE_MS)
            return
          }

          vfScheduleRecalc()
        } catch {}
      }

      update()

      if (!vfRosRef.current.get(idx) && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => update())
        ro.observe(node)
        vfRosRef.current.set(idx, ro)
      }
    } catch {}
  }, [vfApplyAnchoredScrollDelta, vfIsScrollActiveNow, vfScheduleAnchorFlush, vfScheduleRecalc])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    const onResize = () => {
      try {
        const prevBp = vfBreakpointRef.current
        const nextBp = vfGetBreakpoint()
        if (prevBp !== nextBp) {
          vfBreakpointRef.current = nextBp
          try { vfHeightsRef.current.clear() } catch {}
        }
        vfScheduleRecalc()
      } catch {}
    }

    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [videoFeedOpen, vfScheduleRecalc, vfGetBreakpoint, isBrowserFn])

  useEffect(() => {
    const ros = vfRosRef.current

    return () => {
      try {
        ros.forEach((ro) => {
          try { ro.disconnect() } catch {}
        })
        ros.clear()
      } catch {}
      try {
        if (vfAnchorFlushTimerRef.current) clearTimeout(vfAnchorFlushTimerRef.current)
        vfAnchorFlushTimerRef.current = 0
        vfPendingAnchorDeltaRef.current = 0
      } catch {}
    }
  }, [])

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
}