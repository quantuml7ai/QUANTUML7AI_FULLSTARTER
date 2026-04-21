import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
 
const VF_VIDEO_CARD_H_MOBILE = 650
const VF_VIDEO_CARD_H_TABLET = 550
const VF_VIDEO_CARD_H_DESKTOP = 550

const VF_AD_CARD_H_MOBILE = 200
const VF_AD_CARD_H_TABLET = 260
const VF_AD_CARD_H_DESKTOP = 320

const VF_ITEM_CHROME_EST = 240
const VF_SCROLL_SETTLE_MS = 140
const VF_HEIGHT_DELTA_IGNORE_PX = 2

function defaultIsBrowser() {
  return typeof window !== 'undefined'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
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

  const vfScrollStateRef = useRef({
    top: 0,
    ts: 0,
    velocity: 0,
    direction: 1,
  })

  const vfScrollActivityRef = useRef({
    activeUntil: 0,
    settleTimer: 0,
  })

  const vfScrollTargetRef = useRef({
    mode: 'window',
    el: null,
  })

  const vfBreakpointRef = useRef('mobile')
  const vfWinRef = useRef({ start: 0, end: 0, top: 0, bottom: 0 })

  const [vfWin, setVfWin] = useState(() => ({
    start: 0,
    end: 0,
    top: 0,
    bottom: 0,
  }))

  useEffect(() => {
    vfWinRef.current = vfWin
  }, [vfWin])

  const vfSlots = useMemo(() => {
    return debugAdsSlots(
      'video',
      interleaveAdsFn(visibleVideoFeed || [], adEvery, {
        isSkippable: (p) => !p || !p.id,
        getId: (p) => p?.id || `${p?.topicId || 'vf'}:${p?.ts || 0}`,
      })
    )
  }, [visibleVideoFeed, adEvery, debugAdsSlots, interleaveAdsFn])

  const vfGetBreakpoint = useCallback(() => {
    try {
      if (!isBrowserFn()) return 'tablet'
      const w = Number(window.innerWidth || 0)
      if (w >= 1024) return 'desktop'
      if (w >= 640) return 'tablet'
      return 'mobile'
    } catch {
      return 'tablet'
    }
  }, [isBrowserFn])

  const vfGetFixedItemH = useCallback(() => {
    const bp = vfGetBreakpoint()
    if (bp === 'desktop') return VF_VIDEO_CARD_H_DESKTOP
    if (bp === 'tablet') return VF_VIDEO_CARD_H_TABLET
    return VF_VIDEO_CARD_H_MOBILE
  }, [vfGetBreakpoint])

  const vfGetFixedAdH = useCallback(() => {
    const bp = vfGetBreakpoint()
    if (bp === 'desktop') return VF_AD_CARD_H_DESKTOP
    if (bp === 'tablet') return VF_AD_CARD_H_TABLET
    return VF_AD_CARD_H_MOBILE
  }, [vfGetBreakpoint])

  const vfGetMaxRender = useCallback(() => {
    try {
      if (!isBrowserFn()) return 12
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const dm = Number(window?.navigator?.deviceMemory || 0)

      if (coarse) return 10
      if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 12
      return 14
    } catch {
      return 12
    }
  }, [isBrowserFn])

  const vfGetOverscanPx = useCallback((vh = 0) => {
    try {
      if (!isBrowserFn()) return 1200
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      if (coarse) return Math.max(900, Math.round(vh * 1.1))
      return Math.max(1200, Math.round(vh * 1.35))
    } catch {
      return 1200
    }
  }, [isBrowserFn])

  const vfEstimateH = useCallback((i) => {
    const slot = vfSlots?.[i]
    if (slot && slot.type !== 'item') return vfGetFixedAdH()
    return vfGetFixedItemH() + VF_ITEM_CHROME_EST
  }, [vfSlots, vfGetFixedAdH, vfGetFixedItemH])

  const vfGetH = useCallback((i) => {
    const measured = vfHeightsRef.current.get(i)
    if (Number.isFinite(measured) && measured > 1) return measured
    return vfEstimateH(i)
  }, [vfEstimateH])

  const vfGetOffsetBefore = useCallback((index) => {
    let acc = 0
    for (let i = 0; i < index; i++) acc += vfGetH(i)
    return acc
  }, [vfGetH])

  const vfBuildWindow = useCallback((start, end, total) => {
    const top = vfGetOffsetBefore(start)
    let rendered = 0
    for (let i = start; i < end; i++) rendered += vfGetH(i)

    let all = top + rendered
    for (let i = end; i < total; i++) all += vfGetH(i)

    const bottom = Math.max(0, all - top - rendered)
    return { start, end, top, bottom }
  }, [vfGetH, vfGetOffsetBefore])

  const vfResolveScrollTarget = useCallback(() => {
    try {
      if (!isBrowserFn()) return { mode: 'window', el: null }

      const preferred = bodyRef?.current
      if (preferred && typeof preferred.addEventListener === 'function') {
        return { mode: 'inner', el: preferred }
      }

      const fallback = document.querySelector('[data-forum-scroll="1"]')
      if (fallback && typeof fallback.addEventListener === 'function') {
        return { mode: 'inner', el: fallback }
      }

      return { mode: 'window', el: null }
    } catch {
      return { mode: 'window', el: null }
    }
  }, [bodyRef, isBrowserFn])

  const vfGetScrollTarget = useCallback(() => {
    let target = vfScrollTargetRef.current
    if (!target || (target.mode === 'inner' && !target.el?.isConnected)) {
      target = vfResolveScrollTarget()
      vfScrollTargetRef.current = target
    }
    return target
  }, [vfResolveScrollTarget])

  const vfReadViewportState = useCallback(() => {
    const target = vfGetScrollTarget()

    if (target.mode === 'inner' && target.el) {
      return {
        st: Number(target.el.scrollTop || 0),
        vh: Number(target.el.clientHeight || 0),
        mode: 'inner',
      }
    }

    return {
      st: Number(window.pageYOffset || document.documentElement.scrollTop || 0),
      vh: Number(window.innerHeight || 0),
      mode: 'window',
    }
  }, [vfGetScrollTarget])

  const vfSetScrollTop = useCallback((nextTop) => {
    const target = vfGetScrollTarget()
    const top = Math.max(0, Math.round(nextTop || 0))

    if (target.mode === 'inner' && target.el) {
      target.el.scrollTop = top
      return
    }

    window.scrollTo(0, top)
  }, [vfGetScrollTarget])

  const vfRecalcWindow = useCallback(() => {
    if (!isBrowserFn()) return
    if (!videoFeedOpen) return

    const total = Number(vfSlots?.length || 0)
    if (!total) {
      const empty = { start: 0, end: 0, top: 0, bottom: 0 }
      vfWinRef.current = empty
      setVfWin(empty)
      return
    }

    const { st, vh } = vfReadViewportState()
    const velocity = Math.abs(Number(vfScrollStateRef.current.velocity || 0))
    const direction = Number(vfScrollStateRef.current.direction || 1)

    const overscanBase = vfGetOverscanPx(vh)
    const overscanPx = overscanBase + Math.min(800, Math.round(velocity * 420))

    const fromY = Math.max(0, st - overscanPx)
    const toY = st + vh + overscanPx

    let acc = 0
    let start = 0

    while (start < total) {
      const h = vfGetH(start)
      if ((acc + h) >= fromY) break
      acc += h
      start++
    }

    let end = start
    let acc2 = acc
    while (end < total && acc2 < toY) {
      acc2 += vfGetH(end)
      end++
    }

    const maxRender = vfGetMaxRender()
    if ((end - start) > maxRender) {
      if (direction >= 0) {
        end = Math.min(total, start + maxRender)
      } else {
        start = Math.max(0, end - maxRender)
      }
    }

    const scrollingNow = Date.now() < Number(vfScrollActivityRef.current.activeUntil || 0)
    const prev = vfWinRef.current

    if (scrollingNow && prev.end > prev.start) {
      // Не даём окну резко схлопываться во время живого мобильного скролла
      if (start > prev.start && (start - prev.start) <= 1) start = prev.start
      if (end < prev.end && (prev.end - end) <= 1) end = prev.end
    }

    const next = vfBuildWindow(start, end, total)

    const unchanged =
      prev.start === next.start &&
      prev.end === next.end &&
      prev.top === next.top &&
      prev.bottom === next.bottom

    if (unchanged) return

    vfWinRef.current = next
    setVfWin(next)
  }, [
    videoFeedOpen,
    vfSlots,
    vfReadViewportState,
    vfGetOverscanPx,
    vfGetH,
    vfGetMaxRender,
    vfBuildWindow,
    isBrowserFn,
  ])

  const vfScheduleRecalc = useCallback(() => {
    if (vfRafRef.current) return
    vfRafRef.current = requestAnimationFrame(() => {
      vfRafRef.current = 0
      try {
        vfRecalcWindow()
      } catch {}
    })
  }, [vfRecalcWindow])

  useEffect(() => {
    if (!videoFeedHardResetRef) return undefined

    videoFeedHardResetRef.current = () => {
      try {
        emitDiag?.(
          'video_feed_hard_reset',
          {
            source: 'videoFeedHardResetRef',
            slots: Number(vfSlots?.length || 0),
          },
          { force: true }
        )
      } catch {}

      try { vfHeightsRef.current.clear() } catch {}

      const next = {
        start: 0,
        end: Math.min(vfGetMaxRender(), Math.max(0, Number(vfSlots?.length || 0))),
        top: 0,
        bottom: 0,
      }

      vfWinRef.current = next
      setVfWin(next)

      try { vfSetScrollTop(0) } catch {}

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          vfScheduleRecalc()
        })
      })
    }

    return () => { 
      try { videoFeedHardResetRef.current = null } catch {}
    }
  }, [
    emitDiag,
    vfSlots,
    vfGetMaxRender,
    vfScheduleRecalc,
    vfSetScrollTop,
    videoFeedHardResetRef,
  ])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    vfBreakpointRef.current = vfGetBreakpoint()
    vfScrollTargetRef.current = vfResolveScrollTarget()

    const scrollActivity = vfScrollActivityRef.current

    const onScroll = () => {
      try {
        const vp = vfReadViewportState()
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
          ? performance.now()
          : Date.now()

        const top = Number(vp?.st || 0)
        const prev = vfScrollStateRef.current
        const dt = Math.max(1, now - Number(prev.ts || 0))
        const signedDy = top - Number(prev.top || 0)
        const dy = Math.abs(signedDy)
        const velocity = dt > 220 ? 0 : (dy / dt)
        const direction = dy < 2 ? Number(prev.direction || 1) : (signedDy >= 0 ? 1 : -1)

        vfScrollStateRef.current = {
          top,
          ts: now,
          velocity,
          direction,
        }

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
        const nextBp = vfGetBreakpoint()
        const prevBp = vfBreakpointRef.current

        // На мобильных resize часто летит из-за hide/show browser UI.
        // Heights чистим ТОЛЬКО если реально сменился breakpoint bucket.
        if (nextBp !== prevBp) {
          vfBreakpointRef.current = nextBp
          vfHeightsRef.current.clear()
        }

        vfScheduleRecalc()
      } catch {}
    }

    const target = vfGetScrollTarget()
    const opts = { passive: true }

    if (target.mode === 'inner' && target.el) {
      target.el.addEventListener('scroll', onScroll, opts)
    } else {
      window.addEventListener('scroll', onScroll, opts)
    }

    window.addEventListener('resize', onResize, opts)

    try {
      window.visualViewport?.addEventListener?.('resize', onResize, opts)
      window.visualViewport?.addEventListener?.('scroll', onResize, opts)
    } catch {}

    onScroll()

    return () => {
      if (target.mode === 'inner' && target.el) {
        try { target.el.removeEventListener('scroll', onScroll) } catch {}
      } else {
        window.removeEventListener('scroll', onScroll)
      }

      window.removeEventListener('resize', onResize)

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

      scrollActivity.activeUntil = 0

      vfScrollStateRef.current = {
        top: 0,
        ts: 0,
        velocity: 0,
        direction: 1,
      }
    }
  }, [
    videoFeedOpen,
    vfGetBreakpoint,
    vfGetScrollTarget,
    vfReadViewportState,
    vfResolveScrollTarget,
    vfScheduleRecalc,
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
          const rectH = node.getBoundingClientRect?.().height
          if (!Number.isFinite(rectH) || rectH <= 1) return

          const nextH = Math.round(rectH)
          const prevH = vfHeightsRef.current.get(idx)

          if (Number.isFinite(prevH) && Math.abs(prevH - nextH) < VF_HEIGHT_DELTA_IGNORE_PX) {
            return
          }

          vfHeightsRef.current.set(idx, nextH)

          if (Number.isFinite(prevH)) {
            const delta = nextH - prevH
            const currentWin = vfWinRef.current

            // Ключевая часть: если изменился элемент ВЫШЕ окна,
            // компенсируем scrollTop, чтобы мобильный скролл не "прыгал".
            if (delta !== 0 && idx < Number(currentWin.start || 0)) {
              const vp = vfReadViewportState()
              vfSetScrollTop(Number(vp.st || 0) + delta)
            }
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
  }, [vfReadViewportState, vfScheduleRecalc, vfSetScrollTop])

useEffect(() => {
  const currentRosRef = vfRosRef.current; // Копируем текущее значение ref
  return () => {
    try {
      currentRosRef.forEach((ro) => {
        try { ro.disconnect() } catch {}
      })
      currentRosRef.clear()
    } catch {}
  }
}, [])

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
} 