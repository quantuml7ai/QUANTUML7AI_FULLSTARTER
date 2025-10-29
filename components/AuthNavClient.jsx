// components/AuthNavClient.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
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

/** Сформировать URL старта OAuth (same-tab), провайдер обязателен */
function buildAuthStartUrl(provider) {
  const base = (typeof window !== 'undefined' ? window.location.origin : '')
  const target = `${base}/api/auth/start`
  try {
    const cur = new URL(window.location.href)
    const u = new URL(target)
    u.searchParams.set('provider', (provider || 'google').toLowerCase())
    u.searchParams.set('return', cur.pathname + cur.search) // вернуться туда же
    const ua = (navigator.userAgent || '').toLowerCase()
    const isTG  = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram')
    const isGSA = /\bGSA\b/i.test(navigator.userAgent || '')
    if (isTG)  u.searchParams.set('bridge', 'tma')
    else if (isGSA) u.searchParams.set('bridge', 'gsa')
    return u.toString()
  } catch { return target }
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

/** Простой модал без сторонних зависимостей */
function UnifiedAuthModal({ open, onClose, onWallet, onOAuth }) {
  if (!open) return null
  return (
    <div className="ua-backdrop" role="dialog" aria-modal="true" aria-labelledby="ua-title" onClick={onClose}>
      <div className="ua-modal" onClick={(e)=>e.stopPropagation()}>
        <h3 id="ua-title">Sign in</h3>

        <div className="ua-section">
          <div className="ua-caption">Wallet</div>
          <button className="ua-btn primary" onClick={onWallet}>
            <img src="/icons/wallet.svg" alt="" width="18" height="18" style={{marginRight:8}}/>
            Connect wallet
          </button>
        </div>

        <div className="ua-section">
          <div className="ua-caption">Or continue with</div>
          <div className="ua-grid">
            <button className="ua-btn" onClick={() => onOAuth('google')}>
              <img src="/icons/google.svg" alt="" width="18" height="18" style={{marginRight:8}}/>
              Google
            </button>
            <button className="ua-btn" onClick={() => onOAuth('apple')}>
              <img src="/icons/apple.svg" alt="" width="18" height="18" style={{marginRight:8}}/>
              Apple
            </button>
            <button className="ua-btn" onClick={() => onOAuth('email')}>
              <img src="/icons/mail.svg" alt="" width="18" height="18" style={{marginRight:8}}/>
              Email
            </button>
          </div>
        </div>

        <button className="ua-close" onClick={onClose} aria-label="Close">×</button>

        <style jsx>{`
          .ua-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:1000}
          .ua-modal{position:relative;width:min(480px,calc(100% - 24px));background:#0c1119;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px 16px 12px 16px;box-shadow:0 16px 48px rgba(0,0,0,.5)}
          h3{margin:0 0 6px 0}
          .ua-section{margin-top:10px}
          .ua-caption{opacity:.7;font-size:13px;margin:6px 0 8px}
          .ua-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
          .ua-btn{display:flex;align-items:center;justify-content:center;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#0f1218;color:#e9f6ff;font-weight:700;cursor:pointer}
          .ua-btn.primary{border-color:#00d2ff;box-shadow:0 0 0 1px rgba(0,210,255,.22), inset 0 0 18px rgba(0,210,255,.18)}
          .ua-close{position:absolute;right:10px;top:8px;opacity:.7;background:transparent;border:0;font-size:22px;color:#fff;cursor:pointer}
        `}</style>
      </div>
    </div>
  )
}

export default function AuthNavClient() {
  const { isConnected, address } = useAccount()
  const { open } = useWeb3Modal()
  const { t } = useI18n()

  // ---- Состояние OAuth-сессии сайта (cookie sid)
  const [siteAuthed, setSiteAuthed] = useState(false)
  const [siteUser, setSiteUser] = useState(null)
  const [checking, setChecking] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [authMethod, setAuthMethod] = useState(null)
  const prevWalletRef = useRef(isConnected)

  // Telegram link
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

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
        try {
          window.__AUTH_ACCOUNT__ = j.user.userId
          window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: j.user.userId, provider: 'oauth' }}))
        } catch {}
      }
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
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'wallet' }}))
      } catch {}
      refreshSession()
    }
    prevWalletRef.current = isConnected
  }, [isConnected])

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

  // TG link
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
    } finally { checkingRef.current = false }
  }
  useEffect(() => { refreshTgLinkStatus() }, [isConnected, address, siteUser?.userId])

  // Возврат в TMA (startapp=auth_<code>)
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

  // Открыть единый модал
  function onMainButton() {
    if (!isSigned) setShowModal(true)
    // если уже залогинен — здесь можно показать меню аккаунта
  }

  // Кнопка «Wallet» внутри модала
  const handleWallet = async () => {
    try { await open() } catch {}
    // закрывать модал не будем насильно — пусть сам закроет после connect
  }

  // Кнопки «Google / Apple / Email» внутри модала
  const handleOAuth = (provider) => {
    setShowModal(false) // закрываем модал, сразу уходим на same-tab OAuth
    goSameTab(buildAuthStartUrl(provider))
  }

  // Привязка Telegram (опционально оставить)
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
    }catch{ alert('Network error') }
  }

  return (
    <>
      {/* ОДНА кнопка авторизации */}
      <button
        type="button"
        onClick={(e)=>{ e.preventDefault(); onMainButton() }}
        className={`nav-auth-btn ${isSigned ? 'is-auth' : 'is-guest'}`}
        aria-label="Open auth"
        data-auth={isSigned ? 'true' : 'false'}
        title={isSigned ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
      >
        {authLabel}
      </button>

      {/* (опционально) иконка TG привязки */}
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

      {/* ЕДИНЫЙ модал */}
      <UnifiedAuthModal
        open={!isSigned && showModal}
        onClose={() => setShowModal(false)}
        onWallet={handleWallet}
        onOAuth={handleOAuth}
      />
    </>
  )
}
