import React from 'react'
import useForumVideoFeedRuntime from '../../media/hooks/useForumVideoFeedRuntime'
import useDmOpenEvents from '../../dm/hooks/useDmOpenEvents'
import useOpenInboxGlobalAction from '../../dm/hooks/useOpenInboxGlobalAction'
import useForumNavigationRuntime from '../../feed/hooks/useForumNavigationRuntime'
import useForumAdsRuntime from './useForumAdsRuntime'
import useVideoFeedWindowing from '../../media/hooks/useVideoFeedWindowing'
import useDmDeleteCopy from '../../dm/hooks/useDmDeleteCopy'

export default function useForumScreenFlowsRuntime({
  videoFeedArgs,
  dmOpenEventsArgs,
  openInboxGlobalArgs,
  questArgs,
  navigationArgs,
  adsArgs,
  windowingArgs,
  dmDeleteCopyArgs,
  setVideoFeedOpenRef,
}) {
  const {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    feedSort,
    setFeedSort,
    setVideoFeedUserSortLocked,
    visibleVideoFeed,
    videoHasMore,
    videoServerLoading,
    videoServerHasMore,
    loadVideoFeedPage,
    videoFeedContextKey,
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    closeVideoFeed,
    videoFeedHardResetRef,
  } = useForumVideoFeedRuntime(videoFeedArgs)

  React.useEffect(() => {
    setVideoFeedOpenRef.current = setVideoFeedOpen
  }, [setVideoFeedOpenRef, setVideoFeedOpen])

  useDmOpenEvents({
    ...dmOpenEventsArgs,
    closeVideoFeed,
  })

  const setQuestOpen = questArgs?.setQuestOpen
  const setQuestSel = questArgs?.setQuestSel
  const questOpen = false
  const questSel = null

  React.useEffect(() => {
    setQuestOpen?.(false)
    setQuestSel?.(null)
  }, [setQuestOpen, setQuestSel])

  const readEnv = React.useCallback((_, fallback = '') => fallback, [])
  const questEnabled = false
  const quests = []
  const meUid = ''
  const claimFx = null
  const questProg = React.useMemo(() => ({}), [])
  const openQuestCardChecked = React.useCallback(async () => false, [])
  const taskDelayMs = 0
  const getTaskRemainMs = React.useCallback(() => 0, [])
  const markTaskDone = React.useCallback(() => false, [])
  const isCardCompleted = React.useCallback(() => false, [])
  const isCardClaimable = React.useCallback(() => false, [])
  const closeQuestClaimOverlay = React.useCallback(() => {}, [])
  const confirmQuestClaim = React.useCallback(async () => false, [])
  const closeQuests = React.useCallback(() => {
    setQuestSel?.(null)
    setQuestOpen?.(false)
  }, [setQuestOpen, setQuestSel])
  const openQuests = React.useCallback(() => {
    closeQuests()
    return false
  }, [closeQuests])

  const openInboxGlobal = useOpenInboxGlobalAction({
    ...openInboxGlobalArgs,
    videoFeedOpen,
    closeVideoFeed,
    closeQuests,
  })

  const { handleGlobalBack, canGlobalBack, goHome } = useForumNavigationRuntime({
    ...navigationArgs,
    snapshotArgs: {
      ...(navigationArgs?.snapshotArgs || {}),
      videoFeedOpen,
      feedSort,
      questOpen,
      questSel,
    },
    navActionsArgs: {
      ...(navigationArgs?.navActionsArgs || {}),
      setVideoFeedOpen,
      setFeedSort,
      videoFeedOpen,
      closeVideoFeed,
      QUESTS: quests,
      questOpen,
      questSel,
      closeQuests,
    },
    homeActionArgs: {
      ...(navigationArgs?.homeActionArgs || {}),
      videoFeedOpen,
      closeVideoFeed,
      questOpen,
      closeQuests,
    },
  })

  const {
    adEvery,
    debugAdsSlots,
    pickAdUrlForSlot,
  } = useForumAdsRuntime(adsArgs)

  const { vfSlots, vfWin, vfMeasureRef } = useVideoFeedWindowing({
    ...windowingArgs,
    videoFeedOpen,
    visibleVideoFeed,
    adEvery,
    debugAdsSlots,
    videoFeedHardResetRef,
  })

  const {
    dmDeleteText,
    dmDeleteCheckboxLabel,
  } = useDmDeleteCopy(dmDeleteCopyArgs)

  return {
    videoFeedOpen,
    setVideoFeedOpen,
    videoFeed,
    feedSort,
    setFeedSort,
    setVideoFeedUserSortLocked,
    visibleVideoFeed,
    videoHasMore,
    videoServerLoading,
    videoServerHasMore,
    loadVideoFeedPage,
    videoFeedContextKey,
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    closeVideoFeed,
    videoFeedHardResetRef,
    openInboxGlobal,
    readEnv,
    QUEST_ENABLED: questEnabled,
    QUESTS: quests,
    meUid,
    claimFx,
    questProg,
    openQuestCardChecked,
    TASK_DELAY_MS: taskDelayMs,
    getTaskRemainMs,
    markTaskDone,
    isCardCompleted,
    isCardClaimable,
    closeQuestClaimOverlay,
    confirmQuestClaim,
    openQuests,
    closeQuests,
    handleGlobalBack,
    canGlobalBack,
    goHome,
    adEvery,
    debugAdsSlots,
    pickAdUrlForSlot,
    vfSlots,
    vfWin,
    vfMeasureRef,
    dmDeleteText,
    dmDeleteCheckboxLabel,
  }
}
