'use client'

import { useCallback, useState } from 'react'

import useForumQuestConfig from './useForumQuestConfig'
import useForumQuestProgress from './useForumQuestProgress'
import useQuestClaimAction from './useQuestClaimAction'
import useQuestViewActions from './useQuestViewActions'

export default function useForumQuestRuntime({
  auth,
  pushNavStateStable,
  requireAuthStrict,
  openAuth,
  toast,
  t,
  vipActive,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  setInboxOpen,
  setVideoFeedOpen,
  setSelectedTopic,
  setThreadRoot,
  bodyRef,
  questOpen: controlledQuestOpen,
  setQuestOpen: controlledSetQuestOpen,
  questSel: controlledQuestSel,
  setQuestSel: controlledSetQuestSel,
}) {
  const [localQuestOpen, setLocalQuestOpen] = useState(false)
  const [localQuestSel, setLocalQuestSel] = useState(null)
  const questOpen = controlledQuestOpen ?? localQuestOpen
  const setQuestOpen = controlledSetQuestOpen ?? setLocalQuestOpen
  const questSel = controlledQuestSel ?? localQuestSel
  const setQuestSel = controlledSetQuestSel ?? setLocalQuestSel

  const {
    readEnv,
    questEnabled,
    quests,
  } = useForumQuestConfig()

  const {
    meUid,
    claimFx,
    setClaimFx,
    questProg,
    writeQuestProg,
    openQuestCardChecked,
    taskDelayMs,
    getTaskRemainMs,
    markTaskDone,
    isCardCompleted,
    isCardClaimable,
    getCardTotalTasks,
    normalizeCardId,
  } = useForumQuestProgress({
    auth,
    readEnv,
    quests,
    setQuestSel,
    pushNavStateStable,
    requireAuthStrict,
    openAuth,
    toast,
    t,
    vipActive,
  })

  const claimQuestReward = useQuestClaimAction({
    auth,
    requireAuthStrict,
    openAuth,
    normalizeCardId,
    quests,
    vipActive,
    getCardTotalTasks,
    writeQuestProg,
    toast,
  })

  const closeQuestClaimOverlay = useCallback(() => {
    setClaimFx({ open: false, cardId: '', amount: '', pieces: [] })
  }, [setClaimFx])

  const confirmQuestClaim = useCallback(async () => {
    return claimQuestReward(claimFx)
  }, [claimFx, claimQuestReward])

  const { openQuests, closeQuests } = useQuestViewActions({
    readEnv,
    questOpen,
    questSel,
    pushNavStateStable,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    setInboxOpen,
    setVideoFeedOpen,
    setSel: setSelectedTopic,
    setThreadRoot,
    setQuestOpen,
    setQuestSel,
    bodyRef,
  })

  return {
    readEnv,
    questEnabled,
    quests,
    questOpen,
    setQuestOpen,
    questSel,
    setQuestSel,
    meUid,
    claimFx,
    setClaimFx,
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
  }
}
