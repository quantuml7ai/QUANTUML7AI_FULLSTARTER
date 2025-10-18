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

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)
  const triedTgAutoRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider') // 'google' | 'email' | ...
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR') // 'walletConnect' | 'injected' | ...
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  // глобальный вызов авторизации (как было)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // анонс успешной авторизации (как было)
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

  // реакция на разлогин (как было)
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

  // события кошелька (как было)
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

  // синхронизация при чистке локалки (как было)
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

  // ===== Telegram WebApp: авто-логин и перехват клика =====
  const tg = (typeof window !== 'undefined') ? (window.Telegram && window.Telegram.WebApp) : null

  // Достаём initData наиболее терпимо
  const getTgInitData = () => {
    try {
      if (tg?.initData) return tg.initData
      const h = new URLSearchParams((typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, ''))
      const fromHash = h.get('tgWebAppData')
      if (fromHash) return fromHash
      const s = new URLSearchParams((typeof window !== 'undefined' ? window.location.search : ''))
      const fromSearch = s.get('tgWebAppData')
      if (fromSearch) return fromSearch
    } catch {}
    return ''
  }

  const isTgWebApp = !!(tg && (tg.initDataUnsafe?.user || getTgInitData()))

  const tgLogin = async () => {
    try {
      if (!isTgWebApp) return
      tg?.ready?.()
      tg?.expand?.()

      const initData = getTgInitData()
      const user = tg?.initDataUnsafe?.user ? JSON.stringify(tg.initDataUnsafe.user) : ''

      const r = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ initData, user })
      })
      const j = await r.json().catch(() => null)

      if (j?.ok && j?.accountId) {
        try { localStorage.setItem('asherId', j.accountId) } catch {}
        window.dispatchEvent(new CustomEvent('auth:ok', {
          detail: { accountId: j.accountId, provider: 'telegram' }
        }))
      } else {
        console.warn('Telegram login failed:', j?.error || j)
      }
    } catch (e) {
      console.warn('Telegram WebApp login error:', e)
    }
  }

  // АВТО-ЛОГИН: внутри Telegram и ещё не авторизованы локально → сразу пробуем
  useEffect(() => {
    if (!isTgWebApp) return
    if (triedTgAutoRef.current) return
    const hasLocal = !!(localStorage.getItem('asherId') || localStorage.getItem('ql7_uid'))
    if (!hasLocal) {
      triedTgAutoRef.current = true
      tgLogin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTgWebApp])

  // ===== состояние для цвета основной кнопки =====
  const isAuthed = !!(isConnected && address) || !!(typeof window !== 'undefined' && localStorage.getItem('asherId'))

  const authLabel = useMemo(() => {
    if (isConnected && address) return shortAddr(address)
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isConnected, address, authMethod, t])

  // Клик по кнопке:
  // - В Telegram WebApp: пробуем tgLogin()
  // - В обычном браузере: открываем Web3Modal как раньше
  const handleClick = () => {
    if (isTgWebApp) tgLogin()
    else open()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
