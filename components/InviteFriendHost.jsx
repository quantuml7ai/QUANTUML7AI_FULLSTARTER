'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const InviteFriendRuntime = dynamic(() => import('./InviteFriendProvider'), {
  ssr: false,
})

const FIRST_DELAY_MS = 7 * 60 * 1000      // оставляем как сейчас
const ACTIVE_WINDOW_MS = 10 * 60 * 1000   // оставляем как сейчас
const CHECK_EVERY_MS = 60 * 1000          // раз в минуту, как было

const LS_LAST_AUTH = 'invite:lastAuthAt'
const LS_LAST_ACTIVITY = 'invite:lastActivityAt'

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

function readLsNumber(key) {
  if (!isBrowser()) return 0
  const raw = window.localStorage.getItem(key)
  return raw ? Number(raw) || 0 : 0
}

export default function InviteFriendHost() {
  const [uid, setUid] = useState(() => readUnifiedAccountId())
  const [lastAuthAt, setLastAuthAt] = useState(() => readLsNumber(LS_LAST_AUTH))
  const [lastActivityAt, setLastActivityAt] = useState(() => readLsNumber(LS_LAST_ACTIVITY))
  const [runtime, setRuntime] = useState(null) // { key, accountId, reason }

  // Один автопоказ за текущую жизнь layout / до reload
  const autoShownRef = useRef(false)

  const openRuntime = useCallback((accountOverride, reason = 'manual') => {
    const effectiveUid = accountOverride || readUnifiedAccountId() || uid
    if (!effectiveUid) return

    setUid(effectiveUid)

    setRuntime({
      key: `${reason}:${effectiveUid}:${Date.now()}`,
      accountId: effectiveUid,
      reason,
    })
  }, [uid])

  const disposeRuntime = useCallback(() => {
    setRuntime(null)
  }, [])

  // Инициализация uid на mount
  useEffect(() => {
    if (!isBrowser()) return
    const now = Date.now()
    const initialUid = readUnifiedAccountId()
    const storedLastAuthAt = readLsNumber(LS_LAST_AUTH)
    const storedLastActivityAt = readLsNumber(LS_LAST_ACTIVITY)

    if (initialUid) {
      setUid(initialUid)

      // Если пользователь уже авторизован, но время авторизации ещё не было сохранено,
      // запускаем отсчёт первого автопоказа от текущего момента.
      if (!storedLastAuthAt) {
        setLastAuthAt(now)
        window.localStorage.setItem(LS_LAST_AUTH, String(now))
      }
    }

    // Стартовую активность считаем текущим моментом, чтобы автопоказ не зависел
    // от того, успел ли пользователь кликнуть/скроллить после загрузки.
    if (!storedLastActivityAt) {
      setLastActivityAt(now)
      window.localStorage.setItem(LS_LAST_ACTIVITY, String(now))
    }
  }, [])

  // Слушаем авторизацию
  useEffect(() => {
    if (!isBrowser()) return

    const handleAuth = () => {
      const acc = readUnifiedAccountId()
      if (!acc) return

      const now = Date.now()
      setUid(acc)
      setLastAuthAt(now)
      window.localStorage.setItem(LS_LAST_AUTH, String(now))

      // новый auth = разрешаем новый первый автопоказ
      autoShownRef.current = false
    }

    const handleLogout = () => {
      setUid(null)
      setRuntime(null)
      autoShownRef.current = false
    }

    window.addEventListener('auth:ok', handleAuth)
    window.addEventListener('auth:success', handleAuth)
    window.addEventListener('auth:logout', handleLogout)

    return () => {
      window.removeEventListener('auth:ok', handleAuth)
      window.removeEventListener('auth:success', handleAuth)
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [])

  // Слушаем ручной вызов из форума
  useEffect(() => {
    if (!isBrowser()) return

    const handleManualOpen = (e) => {
      const override = e?.detail?.accountId || null
      openRuntime(override, 'manual')
    }

    window.addEventListener('invite:open', handleManualOpen)
    return () => {
      window.removeEventListener('invite:open', handleManualOpen)
    }
  }, [openRuntime])

  // Лёгкий трекинг активности — только для первого автопоказа
  useEffect(() => {
    if (!isBrowser()) return

    const onActivity = () => {
      const now = Date.now()
      setLastActivityAt(now)
      window.localStorage.setItem(LS_LAST_ACTIVITY, String(now))
    }

    const events = [
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
      'focus',
      'scroll',
      'visibilitychange',
    ]

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity))
    }
  }, [])

  // Первый и единственный автопоказ по текущей заложенной логике
  useEffect(() => {
    if (!isBrowser()) return

    const id = window.setInterval(() => {
      if (autoShownRef.current) return
      if (runtime) return
      if (!uid) return
      if (!lastAuthAt) return

      const now = Date.now()
      const activeRecently = now - lastActivityAt < ACTIVE_WINDOW_MS
      if (!activeRecently) return

      if (now - lastAuthAt >= FIRST_DELAY_MS) {
        autoShownRef.current = true
        openRuntime(uid, 'auto')
      }
    }, CHECK_EVERY_MS)

    return () => {
      window.clearInterval(id)
    }
  }, [uid, lastAuthAt, lastActivityAt, runtime, openRuntime])

  if (!runtime) return null

  return (
    <InviteFriendRuntime
      key={runtime.key}
      accountId={runtime.accountId}
      mode={runtime.reason}
      onDispose={disposeRuntime}
    />
  )
}