import { useCallback, useEffect, useMemo, useRef } from 'react'
import { readForumRuntimeConfig } from '../../../shared/config/runtime'
import interleaveRecommendationRails from '../../feed/utils/interleaveRecommendationRails'
 
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
  const runtimeCfg = readForumRuntimeConfig()
  const recommendationsEnabled = !!runtimeCfg?.userRecommendations?.enabled
  const recommendationsEvery = Math.max(0, Number(runtimeCfg?.userRecommendations?.every || 0) || 0)
  const flipHoldUntilRef = useRef(0)
  const directionFlipRef = useRef('')
  const lastScrollTopRef = useRef(0)
  const overscanBase = useMemo(() => {
    if (!isBrowserFn()) return 0
    try {
      const ua = String(window?.navigator?.userAgent || '')
      const isIOS = /iP(hone|ad|od)/i.test(ua)
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      if (isIOS) return 6
      if (coarse) return 4
      return 2
    } catch {
      return 2
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

  const vfWin = useMemo(() => {
    const total = Math.max(0, Number(vfSlots?.length || 0))
    if (!videoFeedOpen) {
      return { start: 0, end: 0, top: 0, bottom: 0, overscanBase, directionFlip: '', flipHoldUntil: 0 }
    }
    return {
      start: 0,
      end: total,
      top: 0,
      bottom: 0,
      overscanBase,
      directionFlip: directionFlipRef.current,
      flipHoldUntil: flipHoldUntilRef.current,
    }
  }, [overscanBase, videoFeedOpen, vfSlots.length])

  const noopMeasureNode = useCallback(() => {}, [])
  const vfMeasureRef = useCallback(() => noopMeasureNode, [noopMeasureNode])

  useEffect(() => { 
    videoFeedHardResetRef.current = () => {
      try {
        emitDiag?.('video_feed_hard_reset', {
          source: 'videoFeedHardResetRef',
          slots: Number(vfSlots?.length || 0),
          mode: 'full_render_slice',
        }, { force: true })
      } catch {}
    }

    return () => { 
      try { videoFeedHardResetRef.current = null } catch {}
    }
  }, [emitDiag, videoFeedHardResetRef, vfSlots.length])

  useEffect(() => {
    if (!isBrowserFn()) return undefined

    const readScrollTop = () => {
      try {
        const routeScroller = bodyRef?.current
        if (routeScroller && routeScroller.scrollHeight > routeScroller.clientHeight + 1) {
          return Number(routeScroller.scrollTop || 0)
        }
      } catch {}
      try {
        return Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
      } catch {
        return 0
      }
    }

    const onScroll = () => {
      const nextTop = readScrollTop()
      const prevTop = Number(lastScrollTopRef.current || 0)
      const delta = nextTop - prevTop
      lastScrollTopRef.current = nextTop
      if (!Number.isFinite(delta) || Math.abs(delta) < 8) return

      const nextDirection = delta > 0 ? 'down' : 'up'
      const prevDirection = String(directionFlipRef.current || '')
      if (prevDirection && prevDirection !== nextDirection) {
        directionFlipRef.current = nextDirection
        flipHoldUntilRef.current = Date.now() + 420
        try {
          emitDiag?.('video_feed_direction_flip', {
            directionFlip: nextDirection,
            flipHoldUntil: flipHoldUntilRef.current,
            overscanBase,
          })
        } catch {}
        return
      }
      directionFlipRef.current = nextDirection
    }

    const target = bodyRef?.current && bodyRef.current.addEventListener ? bodyRef.current : window
    try { target.addEventListener('scroll', onScroll, { passive: true }) } catch {}
    onScroll()
    return () => {
      try { target.removeEventListener('scroll', onScroll) } catch {}
    }
  }, [bodyRef, emitDiag, isBrowserFn, overscanBase])

  void bodyRef

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
} 
