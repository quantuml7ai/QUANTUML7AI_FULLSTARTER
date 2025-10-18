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

  // Читаем способ авторизации, чтобы показывать Google/Email/Connected
  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false) // чтобы не дублировать auth:ok
  const prevConnectedRef = useRef(isConnected) // прошлое состояние
function LinkTelegramButton({ accountId, t }) {
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState(null)

  const click = async () => {
    if (!accountId) return
    setBusy(true); setErr(null)
    try {
      const r = await fetch('/api/telegram/link/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const j = await r.json().catch(() => null)
      if (!j?.ok || !j?.deepLink) throw new Error(j?.error || 'FAILED_START')

      // Если запущено внутри Telegram WebApp — откроем нативно
      const isTg = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp
      if (isTg && window.Telegram.WebApp.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(j.deepLink)
      } else {
        window.open(j.deepLink, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      setErr(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className="nav-auth-btn link-tg"
      onClick={click}
      disabled={busy || !accountId}
      title={t?.('auth_link_telegram') || 'Link Telegram'}
      aria-label="Link Telegram"
    >
      {busy ? (t?.('auth_wait') || 'Wait…') : (t?.('auth_link_telegram') || 'Link Telegram')}
    </button>
  )
}

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider') // 'google' | 'email' | ...
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR') // 'walletConnect' | 'injected' | ...
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  // Глобальный вызов авторизации (exchange и т.п.) — слушаем 'open-auth'
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // После успешной авторизации — сообщаем странице и сохраняем ID
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

  // Перезагрузка при разлогине/отключении кошелька — с сохранением квоты
  useEffect(() => {
    if (prevConnectedRef.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))   // ← сохранить квоту
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      if (typeof window !== 'undefined') window.location.reload()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  // События провайдера кошелька (если доступен)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const onAccountsChanged = (accs) => {
      if (!accs || accs.length === 0) {
        try {
          window.dispatchEvent(new Event('aiquota:flush')) // ← сохранить квоту
          window.dispatchEvent(new CustomEvent('auth:logout'))
        } catch {}
        window.location.reload()
      }
    }
    const onDisconnect = () => {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))   // ← сохранить квоту
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

  // Если в другой вкладке стерли локальное состояние — обновим (с сохранением квоты)
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return
      if (['ql7_uid','asherId','ql7_account','account','wallet'].includes(e.key)) {
        const a = localStorage.getItem('asherId') || localStorage.getItem('ql7_uid')
        const w = localStorage.getItem('ql7_account') || localStorage.getItem('account') || localStorage.getItem('wallet')
        if (!a && !w) {
          try {
            window.dispatchEvent(new Event('aiquota:flush')) // ← сохранить квоту
            window.dispatchEvent(new CustomEvent('auth:logout'))
          } catch {}
          window.location.reload()
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ===== новинка: вычисляем состояние авторизации для цвета кнопки =====
  const isAuthed = !!(isConnected && address)

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

return (
  <>
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

    {/* ДОБАВЛЕНО: показываем «Связать с Telegram» только когда уже авторизован */}
    {isAuthed && <LinkTelegramButton accountId={address} t={t} />}
  </>
)

}
