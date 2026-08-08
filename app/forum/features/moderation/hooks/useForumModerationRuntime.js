'use client'

import { useCallback } from 'react'

import useAdminActions from './useAdminActions'
import useAdminFlag from './useAdminFlag'
import useForumModerationUi from './useForumModerationUi'
import useMediaModeration from './useMediaModeration'
import useReportController from './useReportController'

export default function useForumModerationRuntime({
  api,
  readAuth,
  openAuth,
  isBrowserFn,
  toast,
  t,
  human,
  persistTombstones,
  tombstoneTtlMs,
  setMediaLock,
  persistSnap,
  emitPostDeleted,
  openSharePopoverRaw,
  fileToJpegBlob,
  extractVideoFrames,
}) {
  const {
    reportUI,
    reportBusy,
    reportPopoverRef,
    closeReportPopover,
    openReportPopover,
    handleReportSelect,
  } = useReportController({
    api,
    readAuth,
    openAuth,
    isBrowser: isBrowserFn,
    toast,
    t,
    human,
    persistTombstones,
    tombstoneTtlMs,
    setMediaLock,
  })

  const openSharePopover = useCallback((post) => {
    if (!post || !post.id) return
    try { closeReportPopover?.() } catch {}
    openSharePopoverRaw?.(post)
  }, [closeReportPopover, openSharePopoverRaw])

  const { isAdmin } = useAdminFlag()

  const { delTopic, delPost, banUser, unbanUser } = useAdminActions({
    isAdmin,
    api,
    persistSnap,
    toast,
    t,
    emitPostDeleted,
  })

  const { isStrictModeration, toastI18n, reasonKey, reasonFallbackEN } = useForumModerationUi({
    t,
    toast,
  })

  const { moderateImageFiles } = useMediaModeration({
    toastI18n,
    fileToJpegBlob,
    extractVideoFrames,
    isStrictModeration,
  })

  return {
    reportUI,
    reportBusy,
    reportPopoverRef,
    closeReportPopover,
    openReportPopover,
    handleReportSelect,
    openSharePopover,
    isAdmin,
    delTopic,
    delPost,
    banUser,
    unbanUser,
    isStrictModeration,
    toastI18n,
    reasonKey,
    reasonFallbackEN,
    moderateImageFiles,
  }
}
