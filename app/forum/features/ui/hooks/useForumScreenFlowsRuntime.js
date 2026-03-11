import React from 'react'
import useForumVideoFeedRuntime from '../../media/hooks/useForumVideoFeedRuntime'
import useDmOpenEvents from '../../dm/hooks/useDmOpenEvents'
import useOpenInboxGlobalAction from '../../dm/hooks/useOpenInboxGlobalAction'
import useForumQuestRuntime from '../../quests/hooks/useForumQuestRuntime'
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

  const {
    readEnv,
    questEnabled,
    quests,
    meUid,
    claimFx,
    questProg,
    openQuestCardChecked,
    taskDelayMs,
    getTaskRemainMs,
    markTaskDone,
    isCardCompleted,
    isCardClaimable,
    closeQuestClaimOverlay,
    confirmQuestClaim,
    openQuests,
    closeQuests,
  } = useForumQuestRuntime({
    ...questArgs,
    setVideoFeedOpen,
  })

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
      questOpen: questArgs.questOpen,
      questSel: questArgs.questSel,
    },
    navActionsArgs: {
      ...(navigationArgs?.navActionsArgs || {}),
      setVideoFeedOpen,
      setFeedSort,
      videoFeedOpen,
      closeVideoFeed,
      QUESTS: quests,
      questOpen: questArgs.questOpen,
      questSel: questArgs.questSel,
      closeQuests,
    },
    homeActionArgs: {
      ...(navigationArgs?.homeActionArgs || {}),
      videoFeedOpen,
      closeVideoFeed,
      questOpen: questArgs.questOpen,
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
