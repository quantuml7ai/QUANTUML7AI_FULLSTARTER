import { useCallback, useMemo } from 'react'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import { readForumRuntimeConfig } from '../../../shared/config/runtime'
import interleaveRecommendationRails from '../../feed/utils/interleaveRecommendationRails'

const VF_OVERSCAN_PX = 1180
const VF_OVERSCAN_PX_MOBILE = 820
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
  const vfGetMaxRender = useCallback(() => {
    try {
      if (!isBrowserFn()) return 5

      const w = Number(window?.innerWidth || 0)
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
      const dm = Number(window?.navigator?.deviceMemory || 0)
      const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 4

      if (lowMem || coarse || w < 640) return 4
      return 5
    } catch {
      return 5
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

      const v = Math.min(1, Math.abs(Number(velocity || 0)) / 3.2)
      const boost = coarse ? 0.1 : 0.16
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
      }),
    )

    if (vfRecommendationsEvery <= 0) return slotsWithAds

    return interleaveRecommendationRails(slotsWithAds, vfRecommendationsEvery, {
      isSkippable: (slot) => {
        if (String(slot?.type || '') !== 'item') return true
        return !slot?.item?.id
      },
    })
  }, [adEvery, debugAdsSlots, interleaveAdsFn, vfRecommendationsEvery, visibleVideoFeed])

  const vfGetScrollEl = useCallback(() => {
    try {
      return bodyRef.current || document.querySelector('[data-forum-scroll="1"]') || null
    } catch {}
    return null
  }, [bodyRef])

  const vfEstimateH = useCallback(({ item, index }) => {
    const slot = item || vfSlots?.[index]
    if (slot?.type === 'recommendation_rail') return vfGetFixedRecommendationH()
    if (slot && slot.type !== 'item') return vfGetFixedAdH()
    return vfGetFixedItemH() + VF_ITEM_CHROME_EST
  }, [vfGetFixedAdH, vfGetFixedItemH, vfGetFixedRecommendationH, vfSlots])

  const { win: vfWin, measureRef: vfMeasureRef } = useForumWindowing({
    active: !!videoFeedOpen,
    items: vfSlots,
    getItemKey: (slot, index) => String(slot?.key || `video:${index}`),
    getItemDomId: (slot) => (
      slot?.type === 'item' && slot?.item?.id
        ? `post_${slot.item.id}`
        : ''
    ),
    estimateItemHeight: vfEstimateH,
    maxRender: () => vfGetMaxRender(),
    overscanPx: ({ velocity }) => vfGetOverscanPx(velocity),
    getScrollEl: vfGetScrollEl,
    isBrowserFn,
    hardResetRef: videoFeedHardResetRef,
    listId: 'forum:video-feed',
    emitDiag,
    diagPrefix: 'video_feed',
  })

  return {
    vfSlots,
    vfWin,
    vfMeasureRef,
  }
}
