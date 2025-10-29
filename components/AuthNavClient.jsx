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

function isWV() {
  try {
    const uaF = navigator.userAgent || ''
    const ua  = uaF.toLowerCase()
    const isIOS   = /iphone|ipad|ipod/.test(ua)
    const isTG    = !!(typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
    const isGSA   = /\bGSA\b/.test(uaF)
    const isWV    = /\bwv\b/.test(ua) || /Line\/|FBAN|FBAV|OKApp|VKClient|Instagram|KAKAOTALK/i.test(uaF)
    const isIOSwv = isIOS && !/safari/i.test(ua)
    const isAndWV = /Android/i.test(ua) && /\bwv\b/.test(ua)
    return isTG || isGSA || isWV || isIOSwv || isAndWV || isIOS
  } catch { return true }
}

function buildAuthUrl(provider) {
  const base = (typeof window !== 'undefined' ? window.location.origin : '')
  const target = `${base}/api/auth/start`
  try {
    const cur = new URL(window.location.href)
    const u = new URL(target)
    u.searchParams.set('provider', provider)
    u.searchParams.set('return', cur.pathname + cur.search)
    const ua = (navigator.userAgent || '').toLowerCase()
    const tg = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram')
    const gsa = /\bGSA\b/i.test(navigator.userAgent || '')
    if (tg)  u.searchParams.set('bridge', 'tma')
    else if (gsa) u.searchParams.set('bridge', 'gsa')
    return u.toString()
  } catch { return `${target}?provider=${provider}` }
}

async function fetchMe() {
  try {
    const r = await fetch('/api/auth/me', { credentials: 'include' })
    const j = await r.json().catch(()=>null)
    return j?.ok ? (j.user || null) : null
  } catch { return null }
}

export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()
  const inWV = isWV()

  // Состояние cookie-сессии (Google/Apple/Email)
  const [user, setUser] = useState(null)
  const [loadingMe, setLoadingMe] = useState(false)

  // Локальный модал
  const [showModal, setShowModal] = useState(false)

  // label web3modal
  const [method, setMethod] = useState(null)
  const prevWallet = useRef(isConnected)

  useEffect(() => {
    ;(async () => {
      setLoadingMe(true)
      setUser(await fetchMe())
      setLoadingMe(false)
    })()
    const onFocus = () => fetchMe().then(setUser)
    const onVis   = () => { if (document.visibilityState === 'visible') fetchMe().then(setUser) }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  useEffect(() => {
    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setMethod(m1 || m2 || null)
    } catch {}
  }, [isConnected])

  useEffect(() => {
    if (prevWallet.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { scope: 'wallet' }}))
      } catch {}
      fetchMe().then(setUser)
    }
    prevWallet.current = isConnected
  }, [isConnected])

  // Возврат из TMA (startapp=auth_<code>) — поднять cookie
  useEffect(() => {
    try {
      const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp
      const sp = wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param
      const m  = sp && /^auth_(\w{8,64})$/i.exec(sp)
      if (!m) return
      ;(async () => {
        try {
          await fetch('/api/tma/auth/exchange', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code: m[1] })
          })
          setUser(await fetchMe())
          window.location.replace(window.location.origin + window.location.pathname)
        } catch {}
      })()
    } catch {}
  }, [])

  const signed = !!(user || (isConnected && address))
  const label = useMemo(() => {
    if (isConnected && address) return shortAddr(address)
    if (user?.email) return user.email
    if (user) return t('auth_connected') || 'Connected'
    if (method) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[method] || (t('auth_connected') || 'Connected')
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isConnected, address, user, method, t])

  // --- действия
  const openSignIn = () => setShowModal(true)

  async function signOut() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch {}
    try { await disconnect?.() } catch {}
    try { ['ql7_uid','asherId','ql7_account','account','wallet'].forEach(k => localStorage.removeItem(k)) } catch {}
    setUser(await fetchMe())
    setShowModal(false)
  }

  async function switchAccount() {
    setShowModal(false)
    // соц. провайдеры — только same-tab:
    if (inWV) { goSameTab('/auth?return='+encodeURIComponent(location.pathname+location.search)) }
    else { try { await open() } catch {} }
  }

  // --- кнопки соц. провайдеров: только same-tab redirect (никаких попапов)
  const startSocial = (p) => () => { setShowModal(false); goSameTab(buildAuthUrl(p)) }
  const connectWallet = async () => { setShowModal(false); try { await open() } catch {} }

  return (
    <>
      <button
        type="button"
        onClick={() => (signed ? setShowModal(true) : openSignIn())}
        className={`nav-auth-btn ${signed ? 'is-auth' : 'is-guest'}`}
        aria-label="Sign in"
        data-auth={signed ? 'true' : 'false'}
        title={signed ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
      >
        {loadingMe ? '…' : label}
      </button>

      {showModal && (
        <div className="ql7-auth-overlay" role="dialog" aria-modal="true">
          <div className="ql7-auth-modal">
            {!signed ? (
              <>
                <h3>{t('auth_signin') || 'Sign in'}</h3>
                <div className="row">
                  <button className="btn w" onClick={connectWallet}>🔗 {t('connect_wallet') || 'Connect wallet'}</button>
                </div>
                <div className="or">{t('or_continue_with') || 'Or continue with'}</div>
                <div className="row">
                  <button className="btn" onClick={startSocial('google')}>G  Google</button>
                  <button className="btn" onClick={startSocial('apple')}> Apple</button>
                  <button className="btn" onClick={startSocial('email')}>✉ Email</button>
                </div>
                <div className="row"><button className="btn ghost" onClick={()=>setShowModal(false)}>Close</button></div>
              </>
            ) : (
              <>
                <h3>{t('auth_account') || 'Account'}</h3>
                <p className="muted">{user?.email || (isConnected && address) || 'Signed in'}</p>
                <div className="row">
                  <button className="btn" onClick={switchAccount}>{t('auth_switch') || 'Switch account'}</button>
                  <button className="btn danger" onClick={signOut}>{t('auth_logout') || 'Sign out'}</button>
                  <button className="btn ghost" onClick={()=>setShowModal(false)}>Close</button>
                </div>
              </>
            )}
          </div>
          <style jsx>{`
            .ql7-auth-overlay{position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.5);z-index:1000}
            .ql7-auth-modal{width:min(420px,calc(100% - 24px));background:#0f1116;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.45)}
            .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
            .btn{padding:10px 14px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:#151a22;color:#eaf6ff;font-weight:700}
            .btn.w{width:100%}
            .btn.ghost{background:transparent}
            .btn.danger{border-color:#ff6b6b}
            .or{opacity:.8;margin:12px 0 4px}
            .muted{opacity:.8;margin:0 0 8px}
          `}</style>
        </div>
      )}
    </>
  )
}
