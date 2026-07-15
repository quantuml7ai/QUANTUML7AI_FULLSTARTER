'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import InviteFriendPopup from './InviteFriendPopup'
 
const isBrowser = () => typeof window !== 'undefined'

function readUnifiedAccountId() {
  if (!isBrowser()) return null
  const w = window
  const ls = window.localStorage

  const fromGlobal = w.__AUTH_ACCOUNT__ || w.__ASHER_ID__
  if (fromGlobal) return String(fromGlobal)

  const fromLs =
    ls.getItem('account') ||
    ls.getItem('wallet') ||
    ls.getItem('asherId') ||
    ls.getItem('ql7_uid')

  if (fromLs) return String(fromLs)
  return null
}
 
const LS_LAST_POPUP = 'invite:lastPopupAt'
 
export default function InviteFriendProvider({ accountId, mode = 'manual', onDispose }) {
  const [open, setOpen] = useState(false)
  const [referralUrl, setReferralUrl] = useState('')
  const [rewardQcoin, setRewardQcoin] = useState(0)
  const [invitedCount, setInvitedCount] = useState(0)
  const [vipThreshold, setVipThreshold] = useState(50)
  const [vipGoalReached, setVipGoalReached] = useState(false)
  const [vipGranted, setVipGranted] = useState(false)

  const disposeTimerRef = useRef(null)

  const closePopup = useCallback(() => {
    setOpen(false)

    const now = Date.now()
    if (isBrowser()) {
      window.localStorage.setItem(LS_LAST_POPUP, String(now))
    }

    if (disposeTimerRef.current) {
      clearTimeout(disposeTimerRef.current)
      disposeTimerRef.current = null
    }

    disposeTimerRef.current = setTimeout(() => {
      onDispose?.()
    }, 0)
  }, [onDispose])

  useEffect(() => {
    // console.log('[InviteFriendProvider] mount', { accountId, mode });
    let cancelled = false

    const boot = async () => {
      const effectiveUid = accountId || readUnifiedAccountId()
      if (!effectiveUid) {
        onDispose?.()
        return
      }

      try {
        const res = await fetch('/api/referral/link', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ accountId: effectiveUid }),
        })

        if (!res.ok) {
          onDispose?.()
          return
        }

        const data = await res.json()
        if (!data?.ok) {
          onDispose?.()
          return
        }

        if (cancelled) return

        setReferralUrl(data.url || '')
        setRewardQcoin(data.rewardQcoin || 0)
        setInvitedCount(data.invitedCount || 0)
        setVipThreshold(data.vipThreshold || 50)
        setVipGoalReached(!!data.vipGoalReached)
        setVipGranted(!!data.vipGranted)
 
        if (isBrowser()) {
          window.localStorage.setItem(LS_LAST_POPUP, String(Date.now()))
        }

        setOpen(true)
      } catch {
        if (!cancelled) {
          onDispose?.()
        }
      }
    }

    boot()

    return () => {
      // console.log('[InviteFriendProvider] unmount', { accountId, mode });
      cancelled = true
      if (disposeTimerRef.current) {
        clearTimeout(disposeTimerRef.current)
        disposeTimerRef.current = null
      }
    }
  }, [accountId, mode, onDispose])

  return (
    <InviteFriendPopup
      open={open}
      onClose={closePopup}
      referralUrl={referralUrl}
      rewardQcoin={rewardQcoin}
      invitedCount={invitedCount}
      vipThreshold={vipThreshold}
      vipGoalReached={vipGoalReached}
      vipGranted={vipGranted}
      config={{
        gifSrc: '/friends/invitation.gif',
        gifWidth: 260,
        gifHeight: 260,
      }}
    />
  )
} 