import { useCallback } from 'react'
import {
  debugAdsSlots as debugAdsSlotsUtil,
  pickAdUrlForSlot as pickAdUrlForSlotUtil,
} from '../utils/adsSlots'

export default function useForumAdSlots({
  adConf,
  clientId,
  adSessionRef,
  resolveCurrentAdUrl,
  AdsCoordinator,
}) {
  const debugAdsSlots = useCallback((label, slots) => {
    return debugAdsSlotsUtil(label, slots)
  }, [])

  const pickAdUrlForSlot = useCallback((slotKey, slotKind) => {
    return pickAdUrlForSlotUtil({
      adConf,
      clientId,
      slotKey,
      slotKind,
      adSessionRef,
      resolveCurrentAdUrl,
      AdsCoordinator,
    })
  }, [adConf, clientId, adSessionRef, resolveCurrentAdUrl, AdsCoordinator])

  return {
    debugAdsSlots,
    pickAdUrlForSlot,
  }
}
