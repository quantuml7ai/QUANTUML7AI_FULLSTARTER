'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

function isTMA() {
  try {
    return typeof window !== 'undefined' && !!(window.Telegram && window.Telegram.WebApp)
  } catch { return false }
}

function safeOpenExternal(url) {
  try {
    if (isTMA() && window.Telegram.WebApp.openLink) {
      window.Telegram.WebApp.openLink(url); return
    }
    const ua = (navigator.userAgent || '').toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    if (isIOS) { window.location.href = url; return }
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch { try { window.location.href = url } catch {} }
}

// вспомогательное
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

  // статус сайта (через sid)
  const [siteAuthed, setSiteAuthed] = useState(false)
  const [siteUser, setSiteUser] = useState(null)
  const [checking, setChecking] = useState(false)

  const [authMethod, setAuthMethod] = useState(null)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  // TG-link для веба
  const [tgLinked, setTgLinked] = useState(false)
  const linkingRef = useRef(false)

  // ---------- helpers ----------
  async function refreshMe() {
    if (checking) return
    setChecking(true)
    try {
      const r = await fetch('/api/auth/me', { cache:'no-store' })
      const j = await r.json().catch(()=>null)
      const ok = !!j?.ok
      setSiteAuthed(ok)
      setSiteUser(ok ? j.user : null)
      if (ok && j?.user?.userId) {
        try {
          window.__AUTH_ACCOUNT__ = j.user.userId
          window.dispatchEvent(new CustomEvent('auth:ok', { detail:{ accountId:j.user.userId, provider:'tma' }}))
        } catch {}
      }
      return ok
    } finally { setChecking(false) }
  }

  // ---------- авто-логин в MiniApp ----------
  useEffect(() => {
    if (!isTMA()) return
    ;(async () => {
      // если cookie уже есть — просто обновим state
      const ok = await refreshMe()
      if (ok) return
      try {
        const wa = window.Telegram.WebApp
        const tgId = String(wa?.initDataUnsafe?.user?.id || '')
        if (!tgId) return
        const r = await fetch('/api/tma/login', {
          method:'POST',
          headers:{ 'content-type':'application/json' },
          body: JSON.stringify({ tgId }),
          cache: 'no-store',
        })
        await r.json().catch(()=>null)
      } catch {}
      await refreshMe()
    })()
  }, [])

  // ---------- web3modal bookkeeping (браузер как было) ----------
  useEffect(() => {
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [isConnected])

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

  useEffect(() => {
    if (prevConnectedRef.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      refreshMe()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const onAccountsChanged = (accs) => {
      if (!accs || accs.length === 0) {
        try {
          window.dispatchEvent(new Event('aiquota:flush'))
          window.dispatchEvent(new CustomEvent('auth:logout'))
        } catch {}
        refreshMe()
      }
    }
    const onDisconnect = () => {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      refreshMe()
    }
    window.ethereum.on?.('accountsChanged', onAccountsChanged)
    window.ethereum.on?.('disconnect', onDisconnect)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener?.('disconnect', onDisconnect)
    }
  }, [])

  // ----- TG link status (только для WEB) -----
  async function refreshTgLinkStatus() {
    if (linkingRef.current) return false
    linkingRef.current = true
    try {
      const accountId = readAccountId() || address || siteUser?.userId || null
      if (!accountId) { setTgLinked(false); return false }
      const r = await fetch('/api/telegram/link/status', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ accountId })
      })
      const j = await r.json().catch(()=>null)
      const linked = !!j?.linked
      setTgLinked(linked)
      return linked
    } catch { return false }
    finally { linkingRef.current = false }
  }
  useEffect(() => { if (!isTMA()) refreshTgLinkStatus() }, [isConnected, address, siteAuthed])

  // ----- UI state -----
  const isSigned = !!(siteAuthed || (isConnected && address))

  const authLabel = useMemo(() => {
    if (isTMA()) return isSigned ? (siteUser?.userId ? `${t('auth_connected') || 'Connected'}` : '...') : '...'
    if (isConnected && address) return shortAddr(address)
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || (t('auth_connected') || 'Connected')
    }
    const v = t('auth_signin'); return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [siteAuthed, siteUser, isConnected, address, authMethod, t])

  // ----- actions -----
  function onAuthClick() {
    if (isTMA()) return  // в mini-app кнопки не показываем, но если вдруг — ничего не делаем
    try { open() } catch {}
  }

  async function onLinkTelegram() {
    try{
      const accountId = readAccountId() || siteUser?.userId || address || null
      const r = await fetch('/api/telegram/link/start', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({ accountId })
      })
      const j = await r.json()
      if (!j.ok) { alert(j.error || 'Error'); return }
      const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot')
      const deepLink = j.deepLink || `https://t.me/${botName.replace('@','')}?start=ql7link_${j.token}`
      safeOpenExternal(deepLink)

      const deadline = Date.now() + 15000
      const delay = (ms)=>new Promise(r=>setTimeout(r,ms))
      while(Date.now() < deadline) {
        await delay(1200)
        const linked = await refreshTgLinkStatus()
        if (linked) break
      }
    } catch { alert('Network error') }
  }

  // ----- Render -----
  // В MINI APP не рисуем ни кнопку авторизации, ни «связать Telegram»
  if (isTMA()) return null

  return (
    <>
      <button
        type="button"
        onClick={onAuthClick}
        className={`nav-auth-btn ${isSigned ? 'is-auth' : 'is-guest'}`}
        aria-label="Open connect modal"
        data-auth-open
        data-auth={isSigned ? 'true' : 'false'}
        title={isSigned ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
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
