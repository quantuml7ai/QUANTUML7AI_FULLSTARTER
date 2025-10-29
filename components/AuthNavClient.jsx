// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

/** Открыть строго в той же вкладке: TMA → openLink, иначе → location.href */
function goSameTab(url) {
  try {
    const wa = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null
    if (wa && typeof wa.openLink === 'function') { wa.openLink(url); return }
  } catch {}
  try { window.location.href = url } catch {}
}

/** Собираем URL старта OAuth на сервере */
function buildAuthStartUrl() {
  const base = (typeof window !== 'undefined' ? window.location.origin : '')
  const target = `${base}/api/auth/start`
  try {
    const cur = new URL(window.location.href)
    const u = new URL(target)
    u.searchParams.set('return', cur.pathname + cur.search) // вернуться туда же
    const ua = (navigator.userAgent || '').toLowerCase()
    const isTG  = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram')
    const isGSA = /\bGSA\b/i.test(navigator.userAgent || '')
    if (isTG)  u.searchParams.set('bridge', 'tma')
    else if (isGSA) u.searchParams.set('bridge', 'gsa')
    u.searchParams.set('provider', 'google') // по умолчанию Google
    return u.toString()
  } catch {
    return target
  }
}

// Берём accountId как у тебя
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
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [mounted, setMounted] = useState(false)
  const [authMethod, setAuthMethod] = useState(null)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  // Telegram link state
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

  // Держим событие open-auth: всегда идём на наш API-роут (никаких попапов)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { goSameTab(buildAuthStartUrl()) } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [])

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

  // Эвенты провайдера (если установлен кошелёк)
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

  // ===== Проверка статуса привязки TG
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

  useEffect(() => {
    refreshTgLinkStatus()
  }, [mounted, isConnected, address])

  // ===== Возврат из внешнего браузера в TMA (startapp=auth_<code>)
  useEffect(() => {
    try {
      const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp
      const sp = wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param
      const m = sp && /^auth_(\w{8,64})$/i.exec(sp)
      if (!m) return
      ;(async () => {
        try {
          await fetch('/api/tma/auth/exchange', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ code: m[1] })
          })
          window.location.replace(window.location.origin + window.location.pathname)
        } catch {}
      })()
    } catch {}
  }, [])

  // ===== UI state
  const isAuthed = !!(isConnected && address)
  const authLabel = useMemo(() => {
    if (isAuthed) return shortAddr(address)
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || (t('auth_connected') || 'Connected')
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthed, address, authMethod, t])

  // ===== Основная кнопка авторизации — ВСЕГДА same-tab OAuth
  function onAuthClick() {
    goSameTab(buildAuthStartUrl())
  }

  // ===== "Связать Telegram"
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
      goSameTab(deepLink)

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
      <button
        type="button"
        onClick={(e)=>{ e.preventDefault(); onAuthClick() }}
        className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
        aria-label="Open auth"
        data-auth-open
        data-auth={isAuthed ? 'true' : 'false'}
        title={isAuthed ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
      >
        {authLabel}
      </button>

      {!tgLinked && (
        <img
          src="/click/telegram.gif"
          alt={t('ql7ai_bot') || 'Link Telegram'}
          title={t('ql7ai_bot') || 'Link Telegram'}
          className="tgLinkIcon"
          role="button"
          tabIndex={0}
          style={{ width: 43, height: 43, cursor: 'pointer', display: 'inline-block', pointerEvents: 'auto' }}
          onClick={(e) => { e.preventDefault(); onLinkTelegram?.() }}
          onTouchEnd={(e) => { e.preventDefault(); onLinkTelegram?.() }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLinkTelegram?.() } }}
        />
      )}
    </>
  )
}
