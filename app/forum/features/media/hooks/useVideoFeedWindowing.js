import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const VF_OVERSCAN_PX = 1500
const VF_VIDEO_CARD_H_MOBILE = 650
const VF_VIDEO_CARD_H_TABLET = 550
const VF_VIDEO_CARD_H_DESKTOP = 550
const VF_AD_CARD_H_MOBILE = 200
const VF_AD_CARD_H_TABLET = 260
const VF_AD_CARD_H_DESKTOP = 320
const VF_ITEM_CHROME_EST = 240

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
  const [vfWin, setVfWin] = useState(() => ({ start: 0, end: 0, top: 0, bottom: 0 }))

  const vfGetMaxRender = useCallback(() => {
    try {
      if (!isBrowserFn()) return 10
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const dm = Number(window?.navigator?.deviceMemory || 0)
      if (coarse) return 8
      if (Number.isFinite(dm) && dm > 0 && dm <= 4) return 9
      return 11
    } catch {
      return 10
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

  const vfSlots = useMemo(() => {
    return debugAdsSlots(
      'video',
      interleaveAdsFn(visibleVideoFeed || [], adEvery, {
        isSkippable: (p) => !p || !p.id,
        getId: (p) => p?.id || `${p?.topicId || 'vf'}:${p?.ts || 0}`,
      })
    )
  }, [visibleVideoFeed, adEvery, debugAdsSlots, interleaveAdsFn])

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

      const innerTop = Number(el.scrollTop || 0)
      const innerH = Number(el.clientHeight || 0) || winH
      const useWindow = winTop > (innerTop + 2) && winTop > 0
      if (useWindow) return { st: winTop, vh: winH, mode: 'window' }
      return { st: innerTop, vh: innerH, mode: 'inner' }
    } catch {}
    return { st: winTop, vh: winH, mode: 'window' }
  }, [vfGetScrollEl])

  const vfEstimateH = useCallback((i) => {
    const slot = vfSlots?.[i]
    if (slot && slot.type !== 'item') return vfGetFixedAdH()
    return vfGetFixedItemH() + VF_ITEM_CHROME_EST
  }, [vfSlots, vfGetFixedAdH, vfGetFixedItemH])

  const vfGetH = useCallback((i) => {
    const h = vfHeightsRef.current.get(i)
    if (Number.isFinite(h) && h > 1) return h
    return vfEstimateH(i)
  }, [vfEstimateH])

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
    const fromY = Math.max(0, st - VF_OVERSCAN_PX)
    const toY = st + vh + VF_OVERSCAN_PX

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

    const vfMaxRender = vfGetMaxRender()
    if ((end - start) > vfMaxRender) {
      const mid = Math.floor((start + end) / 2)
      const half = Math.floor(vfMaxRender / 2)
      start = Math.max(0, mid - half)
      end = Math.min(total, start + vfMaxRender)
    }

    let top = 0
    for (let i = 0; i < start; i++) top += vfGetH(i)
    let bottom = 0
    for (let i = end; i < total; i++) bottom += vfGetH(i)

    setVfWin((prev) => {
      if (prev.start === start && prev.end === end && prev.top === top && prev.bottom === bottom) {
        return prev
      }
      return { start, end, top, bottom }
    })
  }, [videoFeedOpen, vfSlots.length, vfReadViewportState, vfGetH, vfGetMaxRender, isBrowserFn])

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
        setVfWin({
          start: 0,
          end: Math.min(vfGetMaxRender(), Math.max(0, vfSlots.length || 0)),
          top: 0,
          bottom: 0,
        })
      } catch {}
      try {
        const el = vfGetScrollEl()
        if (el && el.scrollHeight > el.clientHeight + 1) el.scrollTop = 0
        else window.scrollTo(0, 0)
      } catch {}
      try {
        cancelHardResetSchedule()
        vfHardResetScheduleRef.current.rafA = requestAnimationFrame(() => {
          vfHardResetScheduleRef.current.rafB = requestAnimationFrame(() => {
            try { vfRecalcWindow() } catch {}
          })
        })
      } catch {
        try {
          cancelHardResetSchedule()
          vfHardResetScheduleRef.current.timeoutId = setTimeout(() => {
            try { vfRecalcWindow() } catch {}
          }, 0)
        } catch {}
      }
    }
    return () => {
      cancelHardResetSchedule()
      try { videoFeedHardResetRef.current = null } catch {}
    }
  }, [vfSlots.length, vfGetScrollEl, vfRecalcWindow, emitDiag, videoFeedHardResetRef, vfGetMaxRender])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined

    const onScroll = () => {
      if (vfRafRef.current) return
      vfRafRef.current = requestAnimationFrame(() => {
        vfRafRef.current = 0
        vfRecalcWindow()
      })
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
    }
  }, [videoFeedOpen, vfRecalcWindow, vfGetScrollEl, isBrowserFn])

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
          const prev = vfHeightsRef.current.get(idx)
          if (prev === h) return
          vfHeightsRef.current.set(idx, h)
          vfRecalcWindow()
        } catch {}
      }

      update()
      if (!vfRosRef.current.get(idx) && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => update())
        ro.observe(node)
        vfRosRef.current.set(idx, ro)
      }
    } catch {}
  }, [vfRecalcWindow])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    if (!videoFeedOpen) return undefined
    const onResize = () => {
      try { vfHeightsRef.current.clear() } catch {}
      vfRecalcWindow()
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [videoFeedOpen, vfRecalcWindow, isBrowserFn])

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
}
