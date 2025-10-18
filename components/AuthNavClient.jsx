// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

function isInTelegramWebApp() {
  if (typeof window === 'undefined') return false
  // Надёжная проверка на наличие WebApp SDK
  if (window.Telegram && window.Telegram.WebApp) return true
  // fallback по UA (на случай кастомных оболочек)
  const ua = String(navigator.userAgent || '')
  return /telegram|tgwebapp/i.test(ua)
}

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [isTg, setIsTg] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  useEffect(() => {
    setMounted(true)
    setIsTg(isInTelegramWebApp())
  }, [])

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
        window.dispatchEvent(new Event('aiquota:flush'))
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

  // Если в другой вкладке стерли локальное состояние — обновим (с сохранением квоты)
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

  // ===== Telegram Mini App логин =====
  const tgLogin = useCallback(async () => {
    setBusy(true); setErr('')
    try {
      const tg = window.Telegram?.WebApp
      if (!tg) throw new Error('Telegram WebApp is not available')

      const initData = String(tg.initData || '')
      const user = tg.initDataUnsafe?.user ? JSON.stringify(tg.initDataUnsafe.user) : ''

      const r = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ initData, user })
      })
      const j = await r.json().catch(() => null)
      if (!j?.ok) throw new Error(j?.error || 'Auth failed')

      // Зафиксируем локально — как у тебя в проекте принято
      try { localStorage.setItem('asherId', j.accountId) } catch {}
      try {
        window.dispatchEvent(new CustomEvent('auth:ok', {
          detail: { accountId: j.accountId, provider: 'telegram' }
        }))
      } catch {}

      // Обновим страницу, чтобы всё подтянулось (форум, VIP и т.п.)
      try { window.location.reload() } catch {}
    } catch (e) {
      setErr(String(e?.message || e))
      // опционально можно показать toast, если у тебя глобальный toast есть
      try { window.dispatchEvent(new CustomEvent('toast:error', { detail: String(e?.message || e) })) } catch {}
    } finally {
      setBusy(false)
    }
  }, [])

  // ===== новинка: вычисляем состояние авторизации для цвета кнопки =====
  const isAuthed = !!(isConnected && address) || !!(mounted && localStorage.getItem('asherId'))

  const authLabel = useMemo(() => {
    if (isAuthed && address) return shortAddr(address)
    if (isTg) {
      // внутри TG показываем понятный текст
      return busy ? 'Connecting…' : (t('auth_continue_telegram') || 'Continue with Telegram')
    }
    if (authMethod) {
      const map = {
        google: t('auth_google') || 'Google',
        email: t('auth_email') || 'Email',
      }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthed, address, authMethod, isTg, busy, t])

  const onClick = useCallback(() => {
    if (busy) return
    if (isTg) {
      // Внутри Telegram Mini App — авторизуемся через initData
      tgLogin()
      return
    }
    // Обычный браузер — Web3Modal
    open()
  }, [busy, isTg, tgLogin, open])

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
        aria-label={isTg ? 'Continue with Telegram' : 'Open connect modal'}
        data-auth-open
        data-auth={isAuthed ? 'true' : 'false'}
        title={
          isAuthed
            ? (t('auth_account') || 'Account')
            : (isTg ? (t('auth_continue_telegram') || 'Continue with Telegram') : (t('auth_signin') || 'Sign in'))
        }
        disabled={busy}
      >
        {authLabel}
      </button>
      {/* компактная ошибка прямо в топбаре (если случится) */}
      {err && (
        <span className="nav-auth-error" style={{ marginLeft: 8, fontSize: 12, opacity: 0.9 }}>
          {err}
        </span>
      )}
    </>
  )
}
