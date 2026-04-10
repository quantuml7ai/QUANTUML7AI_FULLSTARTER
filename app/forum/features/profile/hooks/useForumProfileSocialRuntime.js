'use client'

import { useCallback, useRef, useState } from 'react'

import useStarredAuthorsState from '../../subscriptions/hooks/useStarredAuthorsState'
import useAboutEditor from './useAboutEditor'
import useVipPayAction from './useVipPayAction'
import useVipSubscriptionState from './useVipSubscriptionState'

export default function useForumProfileSocialRuntime({
  auth,
  viewerId,
  api,
  requireAuthStrict,
  starMode,
  toast,
  t,
  profileBump,
  resolveProfileAccountIdFn,
  safeReadProfileFn,
  resolveNickForDisplayFn,
  resolveIconForDisplayFn,
  normalizeAboutForSaveFn,
  mergeProfileCacheFn,
  writeProfileAliasFn,
}) {
  const {
    starredAuthors,
    myFollowersCount,
    myFollowersLoading,
    toggleAuthorStar,
    activeStarredAuthors,
    starredFirst,
  } = useStarredAuthorsState({
    viewerId,
    api,
    requireAuthStrict,
    starMode,
    resolveProfileAccountIdFn,
  })

  const [vipOpen, setVipOpen] = useState(false)
  const vipBtnRef = useRef(null)
  const { vipActive, setVipActive } = useVipSubscriptionState({
    accountId: auth?.accountId,
    asherId: auth?.asherId,
  })
  const handleVipPay = useVipPayAction({
    auth,
    toast,
    t,
    setVipActive,
    setVipOpen,
  })

  const [qcoinModalOpen, setQcoinModalOpen] = useState(false)
  const withdrawBtnRef = useRef(null)

  const idShown = resolveProfileAccountIdFn(auth?.asherId || auth?.accountId || '')
  const profile = safeReadProfileFn(idShown)
  const nickShown = resolveNickForDisplayFn(idShown, profile?.nickname)
  const iconShown = resolveIconForDisplayFn(idShown, profile?.icon)
  const copyId = useCallback(async () => {
    try { await navigator.clipboard.writeText(idShown) } catch {}
  }, [idShown])

  const {
    aboutEditing,
    aboutDraft,
    aboutSaved,
    aboutSaving,
    setAboutDraft,
    startAboutEdit,
    cancelAboutEdit,
    saveAbout,
  } = useAboutEditor({
    idShown,
    profileBump,
    safeReadProfile: safeReadProfileFn,
    normalizeAboutForSave: normalizeAboutForSaveFn,
    mergeProfileCache: mergeProfileCacheFn,
    writeProfileAlias: writeProfileAliasFn,
  })

  const [profileOpen, setProfileOpen] = useState(false)
  const avatarRef = useRef(null)

  return {
    starredAuthors,
    myFollowersCount,
    myFollowersLoading,
    toggleAuthorStar,
    activeStarredAuthors,
    starredFirst,
    vipOpen,
    setVipOpen,
    vipBtnRef,
    vipActive,
    setVipActive,
    handleVipPay,
    qcoinModalOpen,
    setQcoinModalOpen,
    withdrawBtnRef,
    idShown,
    nickShown,
    iconShown,
    copyId,
    aboutEditing,
    aboutDraft,
    aboutSaved,
    aboutSaving,
    setAboutDraft,
    startAboutEdit,
    cancelAboutEdit,
    saveAbout,
    profileOpen,
    setProfileOpen,
    avatarRef,
  }
}
