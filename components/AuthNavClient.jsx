// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  // ---- локальные состояния/refs ----
  const [authMethod, setAuthMethod] = useState(null)  // 'google' | 'email' | 'walletConnect' | ...
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)                 // чтобы не дублировать auth:ok
  const prevConnectedRef = useRef(isConnected)       // прошлое состояние

  useEffect(() => { setMounted(true) }, [])

  // читаем сохранённый способ авторизации (для лейбла)
  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')           // 'google' | 'email'
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')     // 'walletConnect' | 'injected' | ...
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  // глобальный вызов модалки (exchange и т.п.)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // уведомляем страницу после успешного wallet-коннекта
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isConnected || !address) { announcedRef.current = false; return }
    if (announcedRef.current) return
    try {
      window.__AUTH_ACCOUNT__ = address
      window.dispatchEvent(new CustomEvent('auth:ok', {
        detail: { accountId: address, provider: authMethod || 'wallet' }
      }))
      announcedRef.current = true
    } catch {}
  }, [isConnected, address, authMethod])

  // перезагрузка при разлогине кошелька
  useEffect(() => {
    if (prevConnectedRef.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      if (typeof window !== 'undefined') window.location.reload()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  // события провайдера кошелька
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const onAccountsChanged = (accs) => {
      if (!accs || accs.length === 0) {
        try {
          window.dispatchEvent(new Event('aiquota:flush'))
          window.dispatchEvent(new CustomEvent('auth:logout'))
        } catch {}
        window.location.reload()
      }
    }
    const onDisconnect = () => {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      window.location.reload()
    }
    window.ethereum.on?.('accountsChanged', onAccountsChanged)
    window.ethereum.on?.('disconnect', onDisconnect)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener?.('disconnect', onDisconnect)
    }
  }, [])

  // синхронизация по localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return
      if (['ql7_uid','asherId','ql7_account','account','wallet'].includes(e.key)) {
        const a = localStorage.getItem('asherId') || localStorage.getItem('ql7_uid')
        const w = localStorage.getItem('ql7_account') || localStorage.getItem('account') || localStorage.getItem('wallet')
        if (!a && !w) {
          try {
            window.dispatchEvent(new Event('aiquota:flush'))
            window.dispatchEvent(new CustomEvent('auth:logout'))
          } catch {}
          window.location.reload()
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ======== детекция мини-аппа и сессии (кука) ========
  const isTg = typeof window !== 'undefined' && !!(window.Telegram && window.Telegram.WebApp)
  const hasSessionCookie = typeof document !== 'undefined' && document.cookie.includes('ql7_session=')
  const isAuthed = hasSessionCookie || (isConnected && !!address)

  // ======== Telegram WebApp login ========
  const loginViaTelegramWebApp = async () => {
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg) { open(); return } // на всякий случай — fallback к обычной авторизации
      tg.expand?.()
      const initData = tg.initData || ''
      const r = await fetch('/api/tg/webapp-login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ initData }),
        credentials: 'include',
      })
      const j = await r.json().catch(() => null)
      if (j?.ok) {
        // кука уже установлена на сервере — просто перезагрузим
        window.location.reload()
      } else {
        alert('Telegram login failed: ' + (j?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Telegram login error: ' + e)
    }
  }

  // ======== подпись/лейбл ========
  const authLabel = useMemo(() => {
    if (isAuthed && address) return shortAddr(address)
    if (isAuthed && !address) return t('auth_connected') || 'Connected' // сессия есть, но не кошелёк
    if (authMethod) {
      const map = {
        google: t('auth_google') || 'Google',
        email: t('auth_email') || 'Email',
      }
      return map[authMethod] || (t('auth_connected') || 'Connected')
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthed, address, authMethod, t])

  // ======== рендер ========
  // Внутри Telegram WebApp:
  //  - если уже авторизован (есть кука или кошелёк) — показать «Connected» (золото)
  //  - если нет — показать кнопку Telegram-логина
  if (isTg) {
    return (
      <button
        type="button"
        onClick={isAuthed ? undefined : loginViaTelegramWebApp}
        className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'} nav-auth-btn--tg`}
        aria-label={isAuthed ? 'Account' : 'Login via Telegram'}
        data-auth={isAuthed ? 'true' : 'false'}
        title={isAuthed ? (t('auth_account') || 'Account') : 'Continue with Telegram'}
      >
        {isAuthed ? (authLabel || 'Connected') : 'Continue with Telegram'}
      </button>
    )
  }

  // Обычные браузеры: старая логика — открываем w3m
  return (
    <button
      type="button"
      onClick={() => open()}
      className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
      aria-label="Open connect modal"
      data-auth-open
      data-auth={isAuthed ? 'true' : 'false'}
      title={isAuthed ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
    >
      {authLabel}
    </button>
  )
}
