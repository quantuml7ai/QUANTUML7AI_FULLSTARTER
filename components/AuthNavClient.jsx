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

/** Детект webview/TMA (подстраховка на случай, если где-то понадобится) */
function detectWV() {
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

/** URL старта OAuth на сервере */
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

// Вспомогательное — как у тебя
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

  // ---- Новое: состояние OAuth-сессии сайта (НЕ кошелёк)
  const [siteAuthed, setSiteAuthed] = useState(false)
  const [siteUser, setSiteUser] = useState(null) // { userId, email, name } — по желанию
  const [checking, setChecking] = useState(false)

  const [authMethod, setAuthMethod] = useState(null)
  const announcedRef = useRef(false)
  const prevWalletRef = useRef(isConnected)

  // Telegram link state (как было)
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  // ---- Пингуем сервер: есть ли живая сессия по cookie sid
  async function refreshSession() {
    if (checking) return
    setChecking(true)
    try {
      const r = await fetch('/api/auth/me', { method: 'GET', credentials: 'include', headers: { 'accept': 'application/json' } })
      const j = await r.json().catch(()=>null)
      const ok = !!j?.ok
      setSiteAuthed(ok)
      setSiteUser(ok ? (j.user || null) : null)
      if (ok && j.user?.userId) {
        // даём сигнал остальным частям фронта
        try {
          window.__AUTH_ACCOUNT__ = j.user.userId
          window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: j.user.userId, provider: 'oauth' }}))
        } catch {}
      }
      return ok
    } catch {
      setSiteAuthed(false); setSiteUser(null); return false
    } finally {
      setChecking(false)
    }
  }

  // Первый чек + чек при возврате в вкладку/после OAuth
  useEffect(() => {
    refreshSession()
    const onFocus = () => refreshSession()
    const onVis = () => { if (document.visibilityState === 'visible') refreshSession() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Отслеживание способа авторизации web3modal (если пригодится в лейбле)
  useEffect(() => {
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [isConnected])

  // Сброс при дисконнекте кошелька — НЕ трогаем siteAuthed (OAuth остаётся)
  useEffect(() => {
    if (prevWalletRef.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'wallet' }}))
      } catch {}
      // перерисуемся, но без total reload
      refreshSession()
    }
    prevWalletRef.current = isConnected
  }, [isConnected])

  // Провайдерные эвенты (как у тебя)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const onAccountsChanged = (accs) => {
      if (!accs || accs.length === 0) {
        try {
          window.dispatchEvent(new Event('aiquota:flush'))
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'wallet' }}))
        } catch {}
        refreshSession()
      }
    }
    const onDisconnect = () => {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'wallet' }}))
      } catch {}
      refreshSession()
    }
    window.ethereum.on?.('accountsChanged', onAccountsChanged)
    window.ethereum.on?.('disconnect', onDisconnect)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener?.('disconnect', onDisconnect)
    }
  }, [])

  // ===== Проверка статуса привязки TG (как было)
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

  useEffect(() => { refreshTgLinkStatus() }, [isConnected, address])

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
          // cookie sid установлена сервером → просто обновим сессию и UI
          await refreshSession()
          window.location.replace(window.location.origin + window.location.pathname)
        } catch {}
      })()
    } catch {}
  }, [])

  // ===== Единое состояние «вход выполнен»
  const isSigned = !!(siteAuthed || (isConnected && address))

  // Видимая надпись на кнопке
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

  // ===== Основная кнопка авторизации — всегда same-tab OAuth
  function onAuthClick() {
    if (!isSigned) {
      goSameTab(buildAuthStartUrl())
      return
    }
    // здесь можешь открыть меню аккаунта, если нужно
  }

  // ===== "Связать Telegram"
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
      while(Date.now() < deadline) {
        await delay(1200)
        const linked = await refreshTgLinkStatus()
        if (linked) break
      }
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
