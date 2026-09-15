'use client'

import { useEffect } from 'react'

import useForumHomeAction from './useForumHomeAction'
import useForumNavigationActions from './useForumNavigationActions'
import useNavStateSnapshot from './useNavStateSnapshot'

export default function useForumNavigationRuntime({
  snapshotArgs,
  navActionsArgs,
  bindNavActions,
  homeActionArgs,
}) {
  useNavStateSnapshot(snapshotArgs)

  const navActions = useForumNavigationActions(navActionsArgs)

  useEffect(() => {
    bindNavActions?.(navActions)
  }, [bindNavActions, navActions])

  const { handleGlobalBack, canGlobalBack } = navActions
  const goHome = useForumHomeAction(homeActionArgs)

  return {
    navActions,
    handleGlobalBack,
    canGlobalBack,
    goHome,
  }
}
