import { useEffect, useRef, useState } from 'react'

import {
  AdsCoordinator,
  FORUM_AD_LINKS_UPDATED_EVENT,
  getForumAdConf,
  resolveCurrentAdUrl,
} from '../../../ForumAds'
import useForumAdSlots from './useForumAdSlots'

export default function useForumAdsRuntime({ auth }) {
  const [adsRefreshTick, setAdsRefreshTick] = useState(0)
  const adConf = getForumAdConf()
  const linksLen = Array.isArray(adConf?.LINKS) ? adConf.LINKS.length : 0

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let stopped = false
    let interval = 0
    const timers = []
    const bump = () => {
      if (!stopped) setAdsRefreshTick((value) => value + 1)
    }
    const refresh = () => {
      getForumAdConf()
      bump()
    }
    const scheduleRefresh = (delay) => {
      timers.push(window.setTimeout(refresh, delay))
    }

    window.addEventListener(FORUM_AD_LINKS_UPDATED_EVENT, refresh)

    if (linksLen <= 0) {
      ;[100, 350, 900, 1800, 3500, 5500, 8000, 12000].forEach(scheduleRefresh)
      interval = window.setInterval(() => {
        refresh()
        const freshConf = getForumAdConf()
        if (Array.isArray(freshConf?.LINKS) && freshConf.LINKS.length > 0) {
          try { window.clearInterval(interval) } catch {}
          interval = 0
        }
      }, 1500)

      timers.push(window.setTimeout(() => {
        if (interval) {
          try { window.clearInterval(interval) } catch {}
          interval = 0
        }
      }, 20000))
    }

    return () => {
      stopped = true
      window.removeEventListener(FORUM_AD_LINKS_UPDATED_EVENT, refresh)
      if (interval) {
        try { window.clearInterval(interval) } catch {}
      }
      timers.forEach((timer) => {
        try { window.clearTimeout(timer) } catch {}
      })
    }
  }, [linksLen])

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

  useEffect(() => {
    adSessionRef.current = {
      bucket: null,
      used: new Set(),
      bySlot: new Map(),
    }
  }, [adsRefreshTick])

  const { debugAdsSlots, pickAdUrlForSlot } = useForumAdSlots({
    adConf,
    clientId,
    adSessionRef,
    resolveCurrentAdUrl,
    AdsCoordinator,
  })

  const pickAdUrlForSlotWithRefresh = (slotKey, slotKind) => {
    if (adsRefreshTick < 0) return null
    return pickAdUrlForSlot(slotKey, slotKind)
  }

  return {
    adConf,
    adEvery,
    debugAdsSlots,
    pickAdUrlForSlot: pickAdUrlForSlotWithRefresh,
  }
}
