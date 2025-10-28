// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')
// Единая точка внешнего открытия из /public/compat.js
const safeOpenExternal = (url) => {
  try {
    if (typeof window !== 'undefined' && typeof window.__safeOpenExternal === 'function') {
      return window.__safeOpenExternal(url);
    }
  } catch {}
  // запасной путь, если compat.js по какой-то причине не загрузился
  try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { try{ window.location.href = url }catch{} }
};

// Вспомогательно: достаём accountId так же, как у тебя уже делается по месту
function readAccountId() {
  try {
    if (typeof window === 'undefined') return null
    if (window.__AUTH_ACCOUNT__) return String(window.__AUTH_ACCOUNT__)
    const a1 = localStorage.getItem('asherId')
    const a2 = localStorage.getItem('ql7_uid')
    const a3 = localStorage.getItem('ql7_account') || localStorage.getItem('account') || localStorage.getItem('wallet')
    return (a1 || a2 || a3) ? String(a1 || a2 || a3) : null
  } catch { return null }
}

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  // NEW: статус привязки TG
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  // Глобальный вызов авторизации (exchange и т.п.)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // После успешной авторизации — сообщаем странице
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

  // Разлогин → reload
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

  // Эвенты провайдера
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

  // Кросс-вкладочный логаут
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

  // ===== ЕДИНАЯ проверка статуса привязки TG (POST /api/telegram/link/status) =====
  async function refreshTgLinkStatus() {
    if (checkingRef.current) return false
    checkingRef.current = true
    try {
      const accountId = readAccountId() || address || null
      if (!accountId) { setTgLinked(false); return false }
      const r = await fetch('/api/telegram/link/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId })
      })
      const j = await r.json().catch(() => null)
      const linked = !!j?.linked
      setTgLinked(linked)
      return linked
    } catch {
      return false
    } finally {
      checkingRef.current = false
    }
  }

  // Проверяем при монтировании и при смене аккаунта
  useEffect(() => {
    refreshTgLinkStatus()
  }, [mounted, isConnected, address])

  // ===== Вычисляем состояние авторизации для цвета кнопки =====
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

  // Действие по кнопке "Связать Telegram"
  async function onLinkTelegram() {
    try{
      const accountId = readAccountId() || address || null
      const r = await fetch('/api/telegram/link/start', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({ accountId })
      })
      const j = await r.json()
      if(!j.ok){ alert(j.error || 'Error'); return }
      const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot')
      const deepLink = j.deepLink || `https://t.me/${botName.replace('@','')}?start=ql7link_${j.token}`
      safeOpenExternal(deepLink)

      // Лёгкий поллинг статуса 15 сек.
      const deadline = Date.now() + 15000
      const delay = (ms)=>new Promise(r=>setTimeout(r,ms))
      while(Date.now() < deadline) {
        await delay(1200)
        const linked = await refreshTgLinkStatus()
        if (linked) break
      }
    }catch{
      alert('Network error')
    }
  }

  return (
    <>
      {/* Основная кнопка авторизации — как было */}
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

{/* "Связать Telegram" — кликабельная GIF-иконка без <button> */}
{!tgLinked && (
  <img
    src="/click/telegram.gif"
    alt={t('ql7ai_bot') || 'Link Telegram'}
    title={t('ql7ai_bot') || 'Link Telegram'}
    className="tgLinkIcon"
    role="button"
    tabIndex={0}
    style={{ width: 43, height: 43, cursor: 'pointer', display: 'inline-block', pointerEvents: 'auto' }}
    onClick={(e) => { e.preventDefault(); onLinkTelegram?.(); }}
    onTouchEnd={(e) => { e.preventDefault(); onLinkTelegram?.(); }}  // ← важно для iOS
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onLinkTelegram?.();
      }
    }}
  />
)}


     
    </>
  )
}
