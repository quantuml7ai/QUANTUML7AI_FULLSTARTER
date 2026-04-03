import { useRef } from 'react'

import { AdsCoordinator, getForumAdConf, resolveCurrentAdUrl } from '../../../ForumAds'
import useForumAdSlots from './useForumAdSlots'

export default function useForumAdsRuntime({ auth }) {
  const adConf = getForumAdConf()

  const clientId =
    auth?.accountId ||
    auth?.asherId ||
    (typeof window !== 'undefined' && window.__forumClientId) ||
    'guest'

  const adEvery = adConf?.EVERY && adConf.EVERY > 0 ? adConf.EVERY : 1

  const adSessionRef = useRef({
    bucket: null,
    used: new Set(),
    bySlot: new Map(),
  })

  const { debugAdsSlots, pickAdUrlForSlot } = useForumAdSlots({
    adConf,
    clientId,
    adSessionRef,
    resolveCurrentAdUrl,
    AdsCoordinator,
  })

  return {
    adConf,
    adEvery,
    debugAdsSlots,
    pickAdUrlForSlot,
  }
}
