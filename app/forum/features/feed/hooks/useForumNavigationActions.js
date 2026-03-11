import { useCallback, useMemo } from 'react'

import { alignInboxStartUnderTabs as alignInboxStartUnderTabsUtil } from '../../dm/utils/alignInboxStartUnderTabs'
import { captureNavStateSnapshot, pushNavStateSnapshot } from '../utils/navState'
import {
  applyNavStateSnapshot,
  computeCanGlobalBack,
  handleGlobalBackFlow,
} from '../utils/navOrchestrator'

export default function useForumNavigationActions({
  isBrowserFn,
  bodyRef,
  navStateRef,
  navRestoringRef,
  navStackRef,
  navDepth,
  setNavDepth,
  setHeadHidden,
  setHeadPinned,
  headAutoOpenRef,
  setInboxOpen,
  setInboxTab,
  setDmWithUserId,
  setVideoFeedOpen,
  setQuestOpen,
  QUESTS,
  setQuestSel,
  setProfileBranchMode,
  setProfileBranchUserId,
  setProfileBranchUserNick,
  setTopicFilterId,
  setTopicSort,
  setPostSort,
  setFeedSort,
  setStarMode,
  setQ,
  setDrop,
  setSortOpen,
  data,
  setReplyTo,
  setSel,
  setThreadRoot,
  sel,
  navPendingThreadRootRef,
  idMap,
  restoreNavEntryPosition,
  restoreNavScrollSnapshot,
  getNavScrollSnapshot,
  getNavEntryOffset,
  videoOpen,
  overlayMediaUrl,
  resetOrCloseOverlay,
  videoFeedOpen,
  closeVideoFeed,
  inboxOpen,
  dmWithUserId,
  questOpen,
  questSel,
  profileBranchMode,
  clearProfileBranch,
  closeQuests,
  threadRoot,
}) {
  const getScrollEl = useCallback(() => {
    if (!isBrowserFn?.()) return null
    return (
      bodyRef.current ||
      document.querySelector('[data-forum-scroll="1"]') ||
      null
    )
  }, [bodyRef, isBrowserFn])

  const alignInboxStartUnderTabs = useCallback((attempt = 0) => {
    alignInboxStartUnderTabsUtil({
      attempt,
      isBrowserFn,
      getScrollEl,
    })
  }, [getScrollEl, isBrowserFn])

  const captureNavState = useCallback((entryId) => {
    return captureNavStateSnapshot({
      entryId,
      navStateRef,
      isBrowserFn,
      getScrollEl,
      getNavScrollSnapshot,
      getNavEntryOffset,
    })
  }, [
    getNavEntryOffset,
    getNavScrollSnapshot,
    getScrollEl,
    isBrowserFn,
    navStateRef,
  ])

  const pushNavState = useCallback((entryId) => {
    pushNavStateSnapshot({
      entryId,
      navRestoringRef,
      navStackRef,
      setNavDepth,
      captureNavState,
    })
  }, [
    captureNavState,
    navRestoringRef,
    navStackRef,
    setNavDepth,
  ])

  const applyNavState = useCallback((state) => {
    applyNavStateSnapshot(state, {
      navRestoringRef,
      setHeadHidden,
      setHeadPinned,
      headAutoOpenRef,
      setInboxOpen,
      setInboxTab,
      setDmWithUserId,
      setVideoFeedOpen,
      setQuestOpen,
      QUESTS,
      setQuestSel,
      setProfileBranchMode,
      setProfileBranchUserId,
      setProfileBranchUserNick,
      setTopicFilterId,
      setTopicSort,
      setPostSort,
      setFeedSort,
      setStarMode,
      setQ,
      setDrop,
      setSortOpen,
      data,
      setReplyTo,
      setSel,
      setThreadRoot,
      sel,
      navPendingThreadRootRef,
      idMap,
      restoreNavEntryPosition,
      restoreNavScrollSnapshot,
      isBrowserFn,
      getScrollEl,
    })
  }, [
    QUESTS,
    data,
    getScrollEl,
    headAutoOpenRef,
    idMap,
    isBrowserFn,
    navPendingThreadRootRef,
    navRestoringRef,
    restoreNavEntryPosition,
    restoreNavScrollSnapshot,
    sel,
    setDmWithUserId,
    setDrop,
    setFeedSort,
    setHeadHidden,
    setHeadPinned,
    setInboxOpen,
    setInboxTab,
    setPostSort,
    setQ,
    setQuestOpen,
    setQuestSel,
    setProfileBranchMode,
    setProfileBranchUserId,
    setProfileBranchUserNick,
    setReplyTo,
    setSel,
    setSortOpen,
    setStarMode,
    setThreadRoot,
    setTopicFilterId,
    setTopicSort,
    setVideoFeedOpen,
  ])

  const handleGlobalBack = useCallback(() => {
    handleGlobalBackFlow({
      videoOpen,
      overlayMediaUrl,
      resetOrCloseOverlay,
      navStackRef,
      setNavDepth,
      applyNavState,
      videoFeedOpen,
      closeVideoFeed,
      inboxOpen,
      dmWithUserId,
      setDmWithUserId,
      setInboxTab,
      setInboxOpen,
      questOpen,
      questSel,
      setQuestSel,
      closeQuests,
      profileBranchMode,
      clearProfileBranch,
      threadRoot,
      setReplyTo,
      setThreadRoot,
      sel,
      setSel,
    })
  }, [
    applyNavState,
    closeQuests,
    closeVideoFeed,
    dmWithUserId,
    inboxOpen,
    navStackRef,
    overlayMediaUrl,
    questOpen,
    questSel,
    profileBranchMode,
    clearProfileBranch,
    resetOrCloseOverlay,
    sel,
    setDmWithUserId,
    setInboxOpen,
    setInboxTab,
    setNavDepth,
    setQuestSel,
    setReplyTo,
    setSel,
    setThreadRoot,
    threadRoot,
    videoFeedOpen,
    videoOpen,
  ])

  const canGlobalBack = useMemo(() => {
    const depthFromState = Number(navDepth)
    const effectiveNavDepth = Number.isFinite(depthFromState)
      ? depthFromState
      : Number(navStackRef?.current?.length || 0)
    return computeCanGlobalBack({
      navDepth: effectiveNavDepth,
      videoOpen,
      overlayMediaUrl,
      videoFeedOpen,
      inboxOpen,
      questOpen,
      profileBranchMode,
      threadRoot,
      sel,
      dmWithUserId,
    })
  }, [
    dmWithUserId,
    inboxOpen,
    navDepth,
    navStackRef,
    overlayMediaUrl,
    questOpen,
    profileBranchMode,
    sel,
    threadRoot,
    videoFeedOpen,
    videoOpen,
  ])

  return {
    getScrollEl,
    alignInboxStartUnderTabs,
    captureNavState,
    pushNavState,
    applyNavState,
    handleGlobalBack,
    canGlobalBack,
  }
}
