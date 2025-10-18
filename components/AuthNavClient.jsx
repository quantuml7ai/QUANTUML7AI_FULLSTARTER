// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

// ——— helpers ———
function isTelegramWebApp () {
  if (typeof window === 'undefined') return false
  // Официальный объект TG mini-app
  if (window.Telegram && window.Telegram.WebApp) return true
  // Подстраховка по UA некоторых клиентов
  const ua = String(navigator.userAgent || '').toLowerCase()
  return ua.includes('telegram') || ua.includes('tgwebapp')
}

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider') // 'google' | 'email' | ...
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR') // 'walletConnect' | 'injected' | ...
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  // глобальный «открой авторизацию»
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // сообщаем об успешной авторизации
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

  // релогин/отключение
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

  // события провайдера
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

  // ========= визуал и поведение =========
  const isAuthed = !!(isConnected && address)
  const inTg = isTelegramWebApp()

  const authLabel = useMemo(() => {
    if (isAuthed) return shortAddr(address)
    if (authMethod) {
      const map = {
        google: t('auth_google') || 'Google',
        email: t('auth_email') || 'Email',
      }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthed, address, authMethod, t])

  const handleClick = () => {
    // ⚠️ Спец-поведение внутри Telegram Mini App:
    if (inTg) {
      try {
        const url = 'https://www.quantuml7ai.com/auth/bridge?from=tg-miniapp'
        // если доступен официальный API
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
          window.Telegram.WebApp.openLink(url, { try_instant_view: false })
        } else {
          // запасной вариант: обычная навигация
          window.location.href = url
        }
      } catch {
        // совсем fallback
        try { window.location.href = 'https://www.quantuml7ai.com/auth/bridge?from=tg-miniapp' } catch {}
      }
      return
    }

    // Обычные браузеры — как раньше
    open()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
      aria-label="Open connect modal"
      data-auth-open
      data-auth={isAuthed ? 'true' : 'false'}
      data-env={inTg ? 'tg' : 'web'}
      title={isAuthed ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
    >
      {authLabel}
    </button>
  )
}
