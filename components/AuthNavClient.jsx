// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, disconnect } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

function goSameTab(url) {
  try {
    const wa = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null
    if (wa && typeof wa.openLink === 'function') { wa.openLink(url); return }
  } catch {}
  try { window.location.href = url } catch {}
}

function isWebViewLike() {
  try {
    const uaFull = navigator.userAgent || ''
    const ua = uaFull.toLowerCase()
    const isIOS   = /iphone|ipad|ipod/.test(ua)
    const isTG    = !!(typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
    const isGSA   = /\bGSA\b/.test(uaFull)
    const isWV    = /\bwv\b/.test(ua) || /Line\/|FBAN|FBAV|OKApp|VKClient|Instagram|KAKAOTALK/i.test(uaFull)
    const isIOSwv = isIOS && !/safari/i.test(ua)
    const isAndWV = /Android/i.test(ua) && /\bwv\b/.test(ua)
    return isTG || isGSA || isWV || isIOSwv || isAndWV || isIOS
  } catch { return true }
}

function buildAuthStartUrl() {
  const base = (typeof window !== 'undefined' ? window.location.origin : '')
  const target = `${base}/auth`
  try {
    const cur = new URL(window.location.href)
    const u = new URL(target, base)
    u.searchParams.set('return', cur.pathname + cur.search)
    const ua = (navigator.userAgent || '').toLowerCase()
    const isTG  = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram')
    const isGSA = /\bGSA\b/i.test(navigator.userAgent || '')
    if (isTG)  u.searchParams.set('bridge', 'tma')
    else if (isGSA) u.searchParams.set('bridge', 'gsa')
    return u.toString()
  } catch { return target }
}

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

// синхронизируем cookie-сессию -> твои локальные маркеры
function mirrorUserToLocals(user) {
  try {
    const id = String(user?.userId || '')
    if (!id) return
    localStorage.setItem('ql7_uid', id)
    localStorage.setItem('asherId', id)
    localStorage.setItem('ql7_account', id)
    window.__AUTH_ACCOUNT__ = id
    window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: id, provider: 'oauth' }}))
  } catch {}
}

function clearLocalAuth() {
  try {
    ;['ql7_uid','asherId','ql7_account','account','wallet'].forEach(k => localStorage.removeItem(k))
    window.__AUTH_ACCOUNT__ = ''
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'site' }}))
  } catch {}
}

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const inWV = isWebViewLike()

  const [siteAuthed, setSiteAuthed] = useState(false)
  const [siteUser, setSiteUser]     = useState(null)
  const [checking, setChecking]     = useState(false)

  const [authMethod, setAuthMethod] = useState(null)
  const prevWalletRef = useRef(isConnected)

  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  async function refreshSession() {
    if (checking) return
    setChecking(true)
    try {
      const r = await fetch('/api/auth/me', { method: 'GET', credentials: 'include', headers: { accept: 'application/json' } })
      const j = await r.json().catch(()=>null)
      const ok = !!j?.ok
      setSiteAuthed(ok)
      setSiteUser(ok ? (j.user || null) : null)
      if (ok && j.user?.userId) mirrorUserToLocals(j.user)
      return ok
    } catch {
      setSiteAuthed(false); setSiteUser(null); clearLocalAuth(); return false
    } finally { setChecking(false) }
  }

  useEffect(() => {
    refreshSession()
    const onFocus = () => refreshSession()
    const onVis = () => { if (document.visibilityState === 'visible') refreshSession() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  useEffect(() => {
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [isConnected])

  useEffect(() => {
    if (prevWalletRef.current === true && isConnected === false) {
      try { window.dispatchEvent(new Event('aiquota:flush')) } catch {}
      refreshSession()
    }
    prevWalletRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const onAny = () => { try { window.dispatchEvent(new Event('aiquota:flush')) } catch {}; refreshSession() }
    window.ethereum.on?.('accountsChanged', onAny)
    window.ethereum.on?.('disconnect', onAny)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAny)
      window.ethereum.removeListener?.('disconnect', onAny)
    }
  }, [])

  async function refreshTgLinkStatus() {
    if (checkingRef.current) return false
    checkingRef.current = true
    try {
      const accountId = readAccountId() || siteUser?.userId || address || null
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
  useEffect(() => { refreshTgLinkStatus() }, [isConnected, address, siteAuthed, siteUser?.userId])

  // возврат из TMA (startapp)
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
            credentials: 'include',
            body: JSON.stringify({ code: m[1] })
          })
          await refreshSession()
          window.location.replace(window.location.origin + window.location.pathname)
        } catch {}
      })()
    } catch {}
  }, [])

  const isSigned = !!(siteAuthed || (isConnected && address))

  const authLabel = useMemo(() => {
    if (isConnected && address) return shortAddr(address)
    if (siteAuthed) {
      const email = siteUser?.email
      if (email) return email
      return t('auth_connected') || 'Connected'
    }
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || (t('auth_connected') || 'Connected')
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isConnected, address, siteAuthed, siteUser, authMethod, t])

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    clearLocalAuth()
    try { await disconnect?.() } catch {}
    await refreshSession()
  }

  async function openAccountMenu() {
    const action = window.prompt(
      'Account\n\nType:\n 1 — Switch account\n 2 — Sign out\n\n(esc — cancel)',
      '1'
    )
    if (action === '2') { await signOut(); return }
    if (action === '1') {
      if (inWV) goSameTab(buildAuthStartUrl())
      else try { await open() } catch {}
    }
  }

  async function onAuthClick() {
    if (isSigned) { await openAccountMenu(); return }
    if (inWV) { goSameTab(buildAuthStartUrl()); return }
    try { await open() } catch {}
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
      if(!j.ok){ alert(j.error || 'Error'); return }
      const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot')
      const deepLink = j.deepLink || `https://t.me/${botName.replace('@','')}?start=ql7link_${j.token}`
      goSameTab(deepLink)
      const deadline = Date.now() + 15000
      const delay = (ms)=>new Promise(r=>setTimeout(r,ms))
      while(Date.now() < deadline) { await delay(1200); if (await refreshTgLinkStatus()) break }
    }catch{ alert('Network error') }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e)=>{ e.preventDefault(); onAuthClick() }}
        className={`nav-auth-btn ${isSigned ? 'is-auth' : 'is-guest'}`}
        aria-label="Open auth"
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
