'use client'

import React, { useCallback, useEffect, useState } from 'react'
import InviteFriendPopup from './InviteFriendPopup'

// Простейшая проверка браузера
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

const FIRST_DELAY_MS = 5 * 60 * 1000      // 5 минут после авторизации
const INTERVAL_MS = 60 * 60 * 1000        // каждый час
const ACTIVE_WINDOW_MS = 10 * 60 * 1000   // пользователь активен в последние 10 минут

const LS_LAST_AUTH = 'invite:lastAuthAt'
const LS_LAST_POPUP = 'invite:lastPopupAt'
const LS_LAST_ACTIVITY = 'invite:lastActivityAt'

const INVITE_TEST_MODE =
  process.env.NEXT_PUBLIC_INVITE_TEST_MODE === '1'

export default function InviteFriendProvider() {
  const [uid, setUid] = useState(null)
  const [open, setOpen] = useState(false)
  const [referralUrl, setReferralUrl] = useState('')
  const [rewardQcoin, setRewardQcoin] = useState(0)
  const [invitedCount, setInvitedCount] = useState(0)
  const [vipThreshold, setVipThreshold] = useState(50)
  const [vipGoalReached, setVipGoalReached] = useState(false)
  const [vipGranted, setVipGranted] = useState(false)

  const [lastAuthAt, setLastAuthAt] = useState(() => {
    if (!isBrowser()) return 0
    const raw = window.localStorage.getItem(LS_LAST_AUTH)
    return raw ? Number(raw) || 0 : 0
  })

  const [lastPopupAt, setLastPopupAt] = useState(() => {
    if (!isBrowser()) return 0
    const raw = window.localStorage.getItem(LS_LAST_POPUP)
    return raw ? Number(raw) || 0 : 0
  })

  const [lastActivityAt, setLastActivityAt] = useState(() => {
    if (!isBrowser()) return 0
    const raw = window.localStorage.getItem(LS_LAST_ACTIVITY)
    return raw ? Number(raw) || 0 : 0
  })

  // --- Функции открытия / закрытия поповера ---

  // ВАЖНО: даём возможность передать accountId напрямую,
  // чтобы не зависеть от того, успел ли обновиться стейт uid.
  const openPopup = useCallback(
    async (accountOverride) => {
      const effectiveUid = accountOverride || uid
      if (!effectiveUid) return

      try {
        const res = await fetch('/api/referral/link', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ accountId: effectiveUid }),
        })

        if (!res.ok) {
          return
        }

        const data = await res.json()
        if (!data.ok) return

        setReferralUrl(data.url)
        setRewardQcoin(data.rewardQcoin || 0)
        setInvitedCount(data.invitedCount || 0)
        setVipThreshold(data.vipThreshold || 50)
        setVipGoalReached(!!data.vipGoalReached)
        setVipGranted(!!data.vipGranted)

        const now = Date.now()
        setLastPopupAt(now)
        if (isBrowser()) {
          window.localStorage.setItem(LS_LAST_POPUP, String(now))
        }

        setOpen(true)
      } catch {
        // тишина
      }
    },
    [uid],
  )

  const closePopup = useCallback(() => {
    setOpen(false)
    const now = Date.now()
    setLastPopupAt(now)
    if (isBrowser()) {
      window.localStorage.setItem(LS_LAST_POPUP, String(now))
    }
  }, [])

  // --- Инициализация uid при загрузке ---

  useEffect(() => {
    if (!isBrowser()) return
    const initial = readUnifiedAccountId()
    if (initial) {
      setUid(initial)

      // В тестовом режиме можно сразу открыть поповер при наличии uid
      if (INVITE_TEST_MODE) {
        openPopup(initial)
      }
    }
  }, [openPopup])

  // --- Слушаем события авторизации ---

  useEffect(() => {
    if (!isBrowser()) return

    const handleAuth = () => {
      const acc = readUnifiedAccountId()
      if (!acc) return
      const now = Date.now()
      setUid(acc)
      setLastAuthAt(now)
      window.localStorage.setItem(LS_LAST_AUTH, String(now))

      if (INVITE_TEST_MODE) {
        // В тестовом режиме сразу открываем поповер, не ждём 5 минут
        openPopup(acc)
      }
    }

    window.addEventListener('auth:ok', handleAuth)
    window.addEventListener('auth:success', handleAuth)

    return () => {
      window.removeEventListener('auth:ok', handleAuth)
      window.removeEventListener('auth:success', handleAuth)
    }
  }, [openPopup])
  // --- Принудительное открытие попапа по глобальному событию --- 
  useEffect(() => {
    if (!isBrowser()) return

    const handler = (e) => {
      // можем поддерживать detail.accountId, если захочешь дергать с явным uid
      const override = e?.detail?.accountId
      const effectiveUid = override || uid
      if (!effectiveUid) return

      openPopup(effectiveUid)
    }

    window.addEventListener('invite:open', handler)
    return () => {
      window.removeEventListener('invite:open', handler)
    }
  }, [uid, openPopup])

  // --- Отслеживаем активность пользователя ---

  useEffect(() => {
    if (!isBrowser()) return

    const onActivity = () => {
      const now = Date.now()
      setLastActivityAt(now)
      window.localStorage.setItem(LS_LAST_ACTIVITY, String(now))
    }

    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focus', 'scroll', 'visibilitychange']

    events.forEach((ev) => window.addEventListener(ev, onActivity))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity))
    }
  }, [])

  // --- Основной интервал для нормального режима (не тест) ---

  useEffect(() => {
    if (!isBrowser()) return
    if (INVITE_TEST_MODE) return

    const id = window.setInterval(() => {
      if (!uid) return
      const now = Date.now()
      const activeRecently = now - lastActivityAt < ACTIVE_WINDOW_MS

      // первый показ после авторизации
      if (!lastPopupAt && lastAuthAt && now - lastAuthAt >= FIRST_DELAY_MS && activeRecently) {
        openPopup()
        return
      }

      // регулярный показ каждый час активного присутствия
      if (lastPopupAt && now - lastPopupAt >= INTERVAL_MS && activeRecently) {
        openPopup()
      }
    }, 60 * 1000)

    return () => {
      window.clearInterval(id)
    }
  }, [uid, lastAuthAt, lastPopupAt, lastActivityAt, openPopup])

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
