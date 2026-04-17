import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readForumRuntimeConfig } from '../../../shared/config/runtime'
import interleaveRecommendationRails from '../../feed/utils/interleaveRecommendationRails'

const VF_OVERSCAN_PX = 1900
const VF_VIDEO_CARD_H_MOBILE = 650
const VF_VIDEO_CARD_H_TABLET = 550
const VF_VIDEO_CARD_H_DESKTOP = 550
const VF_AD_CARD_H_MOBILE = 200
const VF_AD_CARD_H_TABLET = 260
const VF_AD_CARD_H_DESKTOP = 320
const VF_RECOMMENDATION_RAIL_H_MOBILE = 278
const VF_RECOMMENDATION_RAIL_H_TABLET = 304
const VF_RECOMMENDATION_RAIL_H_DESKTOP = 328
const VF_ITEM_CHROME_EST = 240
const VF_WINDOW_STICKY_MS = 320
const VF_LAYOUT_JITTER_PX = 28
const VF_SCROLL_SETTLE_MS = 180

function defaultIsBrowser() {
  return typeof window !== 'undefined'
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
  const vfPendingHeightCompRef = useRef({ node: null, delta: 0, reason: '', timerId: 0 })
  const vfScrollStateRef = useRef({ top: 0, ts: 0, velocity: 0, direction: 0 })
  const vfScrollActivityRef = useRef({ activeUntil: 0, settleTimer: 0 })
  const vfWinMetaRef = useRef({ ts: 0, start: 0, end: 0 })
  const [vfWin, setVfWin] = useState(() => ({ start: 0, end: 0, top: 0, bottom: 0 }))

  const runtimeCfg = readForumRuntimeConfig()
  const recommendationsEnabled = !!runtimeCfg?.userRecommendations?.enabled
  const recommendationsEvery = Math.max(0, Number(runtimeCfg?.userRecommendations?.every || 0) || 0)

  const vfGetMaxRender = useCallback(() => {
    try {
      if (!isBrowserFn()) return 13
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const dm = Number(window?.navigator?.deviceMemory || 0)
      if (coarse) return 12
      if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 13
      return 16
    } catch {
      return 13
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

  const vfGetFixedRecommendationH = useCallback(() => {
    try {
      if (!isBrowserFn()) return VF_RECOMMENDATION_RAIL_H_TABLET
      const w = window?.innerWidth || 0
      if (w >= 1024) return VF_RECOMMENDATION_RAIL_H_DESKTOP
      if (w >= 640) return VF_RECOMMENDATION_RAIL_H_TABLET
      return VF_RECOMMENDATION_RAIL_H_MOBILE
    } catch {
      return VF_RECOMMENDATION_RAIL_H_TABLET
    }
  }, [isBrowserFn])

  const vfSlots = useMemo(() => {
    const adSlots = debugAdsSlots(
      'video',
      interleaveAdsFn(visibleVideoFeed || [], adEvery, {
        isSkippable: (p) => !p || !p.id,
        getId: (p) => p?.id || `${p?.topicId || 'vf'}:${p?.ts || 0}`,
      })
    )
    if (!recommendationsEnabled || !recommendationsEvery) return adSlots
    return interleaveRecommendationRails(adSlots, recommendationsEvery, {
      isSkippable: (slot) => String(slot?.type || '') !== 'item' || !slot?.item?.id,
    })
  }, [
    visibleVideoFeed,
    adEvery,
    debugAdsSlots,
    interleaveAdsFn,
    recommendationsEnabled,
    recommendationsEvery,
  ])

  const vfGetScrollEl = useCallback(() => {
    try {
      return bodyRef.current || document.querySelector('[data-forum-scroll="1"]') || null
    } catch {}
    return null
  }, [bodyRef])

  const vfReadViewportState = useCallback(() => {
    const winTop = Number(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    const winH = Number(window.innerHeight || 0) || 0
    try {
      const el = vfGetScrollEl()
      const innerScrollable = !!el && (el.scrollHeight > (el.clientHeight + 1))
      if (!innerScrollable) return { st: winTop, vh: winH, mode: 'window' }
      return {
        st: Number(el.scrollTop || 0),
        vh: Number(el.clientHeight || 0) || winH,
        mode: 'inner',
      }
    } catch {}
    return { st: winTop, vh: winH, mode: 'window' }
  }, [vfGetScrollEl])

  const vfIsNodeAboveViewport = useCallback((node) => {
    if (!node || !node.isConnected) return false
    if (!isBrowserFn()) return false
    try {
      const rect = node.getBoundingClientRect?.()
      if (!rect) return false
      const scrollEl = vfGetScrollEl()
      const useInner = !!scrollEl && (Number(scrollEl.scrollHeight || 0) > (Number(scrollEl.clientHeight || 0) + 1))
      if (useInner && scrollEl) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        return rect.bottom <= (Number(hostRect.top || 0) + 1)
      }
      return rect.bottom <= 0
    } catch {
      return false
    }
  }, [isBrowserFn, vfGetScrollEl])

  const vfMarkProgrammaticScroll = useCallback((reason = 'video_feed_windowing_compensation') => {
    try {
      window.__forumProgrammaticScrollTs = Date.now()
      window.__forumProgrammaticScrollReason = String(reason || 'video_feed_windowing_compensation')
    } catch {}
  }, [])

  const vfIsProgrammaticCooldown = useCallback((windowMs = 260) => {
    try {
      const now = Date.now()
      const last = Number(window.__forumProgrammaticScrollTs || 0)
      return (now - last) < Math.max(80, Number(windowMs || 0))
    } catch {
      return false
    }
  }, [])

  const vfApplyOffscreenHeightDelta = useCallback((node, delta, reason = 'video_feed_height_correction') => {
    const shift = Math.max(-180, Math.min(180, Math.round(Number(delta || 0))))
    if (!node || !node.isConnected) return
    if (!Number.isFinite(shift) || Math.abs(shift) < 2) return
    if (!isBrowserFn()) return
    if (!vfIsNodeAboveViewport(node)) return

    try {
      const scrollEl = vfGetScrollEl()
      const useInner = !!scrollEl && (Number(scrollEl.scrollHeight || 0) > (Number(scrollEl.clientHeight || 0) + 1))
      if (useInner && scrollEl) {
        const prevTop = Number(scrollEl.scrollTop || 0)
        const maxTop = Math.max(0, Number(scrollEl.scrollHeight || 0) - Number(scrollEl.clientHeight || 0))
        const nextTop = Math.max(0, Math.min(maxTop, prevTop + shift))
        if (Math.abs(nextTop - prevTop) < 1) return
        vfMarkProgrammaticScroll(reason)
        scrollEl.scrollTop = nextTop
        return
      }

      const curY = Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
      const nextY = Math.max(0, curY + shift)
      if (Math.abs(nextY - curY) < 1) return
      vfMarkProgrammaticScroll(reason)
      try {
        window.scrollTo({ top: nextY, behavior: 'auto' })
      } catch {
        try { window.scrollTo(0, nextY) } catch {}
      }
    } catch {}
  }, [isBrowserFn, vfGetScrollEl, vfIsNodeAboveViewport, vfMarkProgrammaticScroll])

  const vfEstimateH = useCallback((i) => {
    const slot = vfSlots?.[i]
    if (!slot || slot.type === 'item') return vfGetFixedItemH() + VF_ITEM_CHROME_EST
    if (slot.type === 'recommendation_rail') return vfGetFixedRecommendationH()
    if (slot.type === 'ad') return vfGetFixedAdH()
    return vfGetFixedItemH() + VF_ITEM_CHROME_EST
  }, [vfSlots, vfGetFixedAdH, vfGetFixedItemH, vfGetFixedRecommendationH])

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
      setVfWin({ start: 0, end: 0, top: 0, bottom: 0 })
      return
    }

    const vp = vfReadViewportState()
    const st = Number(vp?.st || 0)
    const vh = Number(vp?.vh || 0)
    const velocity = Math.abs(Number(vfScrollStateRef.current?.velocity || 0))
    const direction = Number(vfScrollStateRef.current?.direction || 0)
    const velocityBoost = Math.min(1100, Math.round(velocity * 520))
    const overscanPx = VF_OVERSCAN_PX + velocityBoost
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

    const vfMaxRender = vfGetMaxRender() + (velocity > 0.6 ? 2 : 0) + (velocity > 1.2 ? 2 : 0)
    if ((end - start) > vfMaxRender) {
      if (direction > 0) {
        start = Math.max(0, end - vfMaxRender)
      } else if (direction < 0) {
        end = Math.min(total, start + vfMaxRender)
      } else {
        const mid = Math.floor((start + end) / 2)
        const half = Math.floor(vfMaxRender / 2)
        start = Math.max(0, mid - half)
        end = Math.min(total, start + vfMaxRender)
      }
    }

    setVfWin((prev) => {
      let nextStart = start
      let nextEnd = end
      const now = Date.now()
      const isScrollActive = Number(vfScrollActivityRef.current?.activeUntil || 0) > now
      const stickyItems = velocity > 1.2 ? 4 : velocity > 0.55 ? 3 : 2

      if (isScrollActive) {
        const activeMaxRender = vfMaxRender + stickyItems + 2
        nextStart = Math.min(prev.start, nextStart)
        nextEnd = Math.max(prev.end, nextEnd)

        if ((nextEnd - nextStart) > activeMaxRender) {
          if (direction > 0) {
            nextStart = Math.max(0, nextEnd - activeMaxRender)
          } else if (direction < 0) {
            nextEnd = Math.min(total, nextStart + activeMaxRender)
          } else {
            const trimFromStart = Math.max(0, nextEnd - activeMaxRender)
            const trimFromEnd = Math.min(total, nextStart + activeMaxRender)
            if (Math.abs(trimFromStart - prev.start) <= Math.abs(trimFromEnd - prev.end)) {
              nextStart = trimFromStart
            } else {
              nextEnd = trimFromEnd
            }
          }
        }
      }

      const shrinkOnly =
        nextStart >= prev.start &&
        nextEnd <= prev.end &&
        (nextStart > prev.start || nextEnd < prev.end)

      if (!isScrollActive && shrinkOnly) {
        const recentWindowChange = (now - Number(vfWinMetaRef.current?.ts || 0)) < VF_WINDOW_STICKY_MS
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

      if (prev.start === next.start && prev.end === next.end && prev.top === next.top && prev.bottom === next.bottom) {
        return prev
      }
      if (prev.start === next.start && prev.end === next.end && topDelta < VF_LAYOUT_JITTER_PX && bottomDelta < VF_LAYOUT_JITTER_PX) {
        return prev
      }

      vfWinMetaRef.current = { ts: Date.now(), start: next.start, end: next.end }
      return next
    })
  }, [videoFeedOpen, vfSlots.length, vfReadViewportState, vfGetH, vfGetMaxRender, vfBuildWindow, isBrowserFn])

  const vfScheduleRecalc = useCallback(() => {
    if (vfRafRef.current) return
    vfRafRef.current = requestAnimationFrame(() => {
      vfRafRef.current = 0
      try { vfRecalcWindow() } catch {}
    })
  }, [vfRecalcWindow])

  const vfQueueOffscreenHeightDelta = useCallback((node, delta, reason = 'video_feed_height_correction') => {
    const pending = vfPendingHeightCompRef.current
    const clamped = Math.max(-180, Math.min(180, Number(delta || 0)))
    if (!node || !node.isConnected) return
    if (!Number.isFinite(clamped) || Math.abs(clamped) < 2) return
    if (!vfIsNodeAboveViewport(node)) return

    if (!pending.node || !pending.node.isConnected) {
      pending.node = node
      pending.delta = clamped
    } else if (pending.node === node) {
      pending.delta = Math.max(-220, Math.min(220, Number(pending.delta || 0) + clamped))
    } else {
      pending.node = node
      pending.delta = clamped
    }

    pending.reason = String(reason || 'video_feed_height_correction')

    const flush = () => {
      const current = vfPendingHeightCompRef.current
      current.timerId = 0
      const now = Date.now()
      const activeUntil = Number(vfScrollActivityRef.current?.activeUntil || 0)

      if (now < activeUntil || vfIsProgrammaticCooldown(220)) {
        current.timerId = setTimeout(flush, Math.max(90, VF_SCROLL_SETTLE_MS))
        return
      }

      const targetNode = current.node
      const totalDelta = Math.max(-180, Math.min(180, Number(current.delta || 0)))
      const targetReason = String(current.reason || 'video_feed_height_correction')

      current.node = null
      current.delta = 0
      current.reason = ''

      if (!targetNode || !targetNode.isConnected) return
      if (!vfIsNodeAboveViewport(targetNode)) return
      if (!Number.isFinite(totalDelta) || Math.abs(totalDelta) < 2) return

      vfApplyOffscreenHeightDelta(targetNode, totalDelta, targetReason)
      try { vfScheduleRecalc() } catch {}
    }

    if (pending.timerId) {
      try { clearTimeout(pending.timerId) } catch {}
      pending.timerId = 0
    }

    pending.timerId = setTimeout(flush, Math.max(220, VF_SCROLL_SETTLE_MS + 60))
  }, [vfApplyOffscreenHeightDelta, vfIsNodeAboveViewport, vfIsProgrammaticCooldown, vfScheduleRecalc])

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

      try {
        const pending = vfPendingHeightCompRef.current
        if (pending.timerId) {
          try { clearTimeout(pending.timerId) } catch {}
          pending.timerId = 0
        }
        pending.node = null
        pending.delta = 0
        pending.reason = ''
      } catch {}

      try {
        vfWinMetaRef.current = {
          ts: Date.now(),
          start: 0,
          end: Math.min(vfGetMaxRender(), Math.max(0, vfSlots.length || 0)),
        }
        setVfWin({
          start: 0,
          end: Math.min(vfGetMaxRender(), Math.max(0, vfSlots.length || 0)),
          top: 0,
          bottom: 0,
        })
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
  }, [vfSlots.length, vfScheduleRecalc, emitDiag, videoFeedHardResetRef, vfGetMaxRender])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    const scrollActivity = vfScrollActivityRef.current

    const onScroll = () => {
      try {
        const vp = vfReadViewportState()
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
          ? performance.now()
          : Date.now()
        const top = Number(vp?.st || 0)
        const prev = vfScrollStateRef.current

        if (vfIsProgrammaticCooldown(220)) {
          vfScrollStateRef.current = {
            top,
            ts: now,
            velocity: 0,
            direction: Number(prev?.direction || 0),
          }
          return
        }

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

    const el = vfGetScrollEl()
    const useInnerScroll = !!el && (Number(el.scrollHeight || 0) > (Number(el.clientHeight || 0) + 1))
    const opts = { passive: true }

    if (useInnerScroll) {
      try { el?.addEventListener?.('scroll', onScroll, opts) } catch {}
    } else {
      window.addEventListener('scroll', onScroll, opts)
    }
    window.addEventListener('resize', onScroll, opts)

    onScroll()

    return () => {
      if (useInnerScroll) {
        try { el?.removeEventListener?.('scroll', onScroll) } catch {}
      } else {
        window.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', onScroll)

      if (vfRafRef.current) {
        try { cancelAnimationFrame(vfRafRef.current) } catch {}
        vfRafRef.current = 0
      }
      if (scrollActivity.settleTimer) {
        try { clearTimeout(scrollActivity.settleTimer) } catch {}
        scrollActivity.settleTimer = 0
      }

      scrollActivity.activeUntil = 0
      vfScrollStateRef.current = { top: 0, ts: 0, velocity: 0, direction: 0 }
    }
  }, [videoFeedOpen, vfScheduleRecalc, vfGetScrollEl, vfReadViewportState, vfIsProgrammaticCooldown, isBrowserFn])

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

          const prevMeasured = vfHeightsRef.current.get(idx)
          const prevH = (Number.isFinite(prevMeasured) && prevMeasured > 1)
            ? prevMeasured
            : vfEstimateH(idx)

          const nextH = Math.round(h)
          const delta = nextH - prevH
          if (Math.abs(delta) < 2) return

          vfHeightsRef.current.set(idx, nextH)

          const now = Date.now()
          const isAboveViewport = vfIsNodeAboveViewport(node)

          if (!isAboveViewport) {
            vfScheduleRecalc()
            return
          }

          if (Number(vfScrollActivityRef.current.activeUntil || 0) > now || vfIsProgrammaticCooldown(220)) {
            vfQueueOffscreenHeightDelta(node, delta, `video_feed_measure_delta:${idx}`)
            return
          }

          vfApplyOffscreenHeightDelta(node, delta, `video_feed_measure_delta:${idx}`)
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
  }, [vfApplyOffscreenHeightDelta, vfEstimateH, vfIsNodeAboveViewport, vfIsProgrammaticCooldown, vfQueueOffscreenHeightDelta, vfScheduleRecalc])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    const onResize = () => {
      try { vfHeightsRef.current.clear() } catch {}
      vfScheduleRecalc()
    }

    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [videoFeedOpen, vfScheduleRecalc, isBrowserFn])

  useEffect(() => {
    const pending = vfPendingHeightCompRef.current

    return () => {
      if (pending.timerId) {
        try { clearTimeout(pending.timerId) } catch {}
        pending.timerId = 0
      }
      pending.node = null
      pending.delta = 0
      pending.reason = ''
    }
  }, [])

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
} 