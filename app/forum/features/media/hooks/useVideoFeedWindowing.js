import { useCallback, useEffect, useMemo } from 'react'
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
      return { start: 0, end: 0, top: 0, bottom: 0 }
    }
    return { start: 0, end: total, top: 0, bottom: 0 }
  }, [videoFeedOpen, vfSlots.length])

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

  void bodyRef
  void isBrowserFn

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
} 