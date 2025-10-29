// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

// --- helpers ---------------------------------------------------------------
function isTMA() {
  try {
    return !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user?.id)
  } catch { return false }
}

// безопасное открытие внешней ссылки (Safari / TMA / обычный браузер)
function safeOpenExternal(url) {
  try {
    const wa = window.Telegram?.WebApp
    const ua = (navigator.userAgent || '').toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)

    if (wa?.openLink) { wa.openLink(url); return }
    if (isIOS) { window.location.href = url; return }
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    try { window.location.href = url } catch {}
  }
}

// читаем accountId как у тебя по месту
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

// --------------------------------------------------------------------------

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  // статус привязки TG (для веба показываем кнопку «связать»)
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  // ---------- 1) Авто-логин в Telegram Mini App ----------
  useEffect(() => {
    setMounted(true)
    if (!isTMA()) return
    ;(async () => {
      try {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
        if (!tgId) return

        // создаём серверную сессию (sid cookie)
        await fetch('/api/auth/tma/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tgId })
        })

        // подтянем user и сохраним accountId в глобалку
        const r = await fetch('/api/auth/me', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (j?.ok && j.user?.userId) {
          try { window.__AUTH_ACCOUNT__ = j.user.userId } catch {}
          window.dispatchEvent(new CustomEvent('auth:ok', {
            detail: { accountId: j.user.userId, provider: 'tma' }
          }))
        }
      } catch {}
    })()
  }, [])

  // ---------- 2) Старое поведение для кошельков (веб) ----------
  useEffect(() => {
    if (!mounted) return
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted, isConnected])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // после успешного коннекта кошелька оповещаем приложение
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

  // разлогин кошелька → reload
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

  // провайдерные эвенты (оставлено как было)
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

  // кросс-вкладочный логаут (как было)
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

  // ===== TG Link status (для веба показываем/скрываем гифку) =====
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
    } catch { return false }
    finally { checkingRef.current = false }
  }

  useEffect(() => {
    if (isTMA()) return // в TMA кнопок нет — статус не нужен
    refreshTgLinkStatus()
  }, [mounted, isConnected, address])

  // ===== UI (TMA ничего не рисуем) =====
  if (isTMA()) return null

  const isAuthed = !!(isConnected && address)
  const authLabel = useMemo(() => {
    if (isAuthed) return shortAddr(address)
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthed, address, authMethod, t])

  // "Связать Telegram" (веб)
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

      // лёгкий поллинг статуса 15 сек.
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
      {/* Кнопка авторизации (Web3Modal) — как было */}
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

      {/* Связать Telegram — оставляем в вебе */}
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
          onTouchEnd={(e) => { e.preventDefault(); onLinkTelegram?.() }}  // iOS
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLinkTelegram?.() } }}
        />
      )}
    </>
  )
}
