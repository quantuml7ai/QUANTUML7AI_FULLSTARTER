'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from './i18n'

function readStoredAuthMethod() {
  try {
    if (typeof window === 'undefined') return null
    return (
      localStorage.getItem('w3m-auth-provider') ||
      localStorage.getItem('W3M_CONNECTED_CONNECTOR') ||
      null
    )
  } catch {
    return null
  }
}

function readWalletBridgeState() {
  try {
    if (typeof window === 'undefined') return null
    return window.__QL7_WALLET_RUNTIME_STATE__?.() || null
  } catch {
    return null
  }
}

function markStartup(label, extra = {}) {
  try {
    window?.markForumStartup?.(label, extra)
  } catch {}
}

const shortAddr = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '')

function readCookie(name) {
  try {
    const m = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    )
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

function isTelegramLink(url) {
  if (!url) return false
  const s = String(url)
  return /^https?:\/\/t\.me\//i.test(s) || /^tg:\/\//i.test(s)
}

function safeOpenExternal(url) {
  try {
    const isTG =
      typeof window !== 'undefined' &&
      window.Telegram &&
      window.Telegram.WebApp

    const tg = isTG ? window.Telegram.WebApp : null

    const ua =
      typeof navigator !== 'undefined'
        ? navigator.userAgent.toLowerCase()
        : ''

    const isIOS = /iphone|ipad|ipod/.test(ua)

    const isStandalone =
      (typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.standalone) ||
      (typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(display-mode: standalone)').matches)

    const tgLink = isTelegramLink(url)

    if (isTG && tg) {
      if (tgLink && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(url)
        return
      }

      if (typeof tg.openLink === 'function') {
        tg.openLink(url)
        return
      }
    }

    if (isIOS || isStandalone) {
      window.location.href = url
      return
    }

    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (!w) {
      window.location.href = url
    }
  } catch {
    try { window.location.href = url } catch {}
  }
}

function readAccountId() {
  try {
    if (typeof window === 'undefined') return null
    if (window.__AUTH_ACCOUNT__) return String(window.__AUTH_ACCOUNT__)
    const a1 = localStorage.getItem('asherId')
    const a2 = localStorage.getItem('ql7_uid')
    const a3 = localStorage.getItem('ql7_account') || localStorage.getItem('account') || localStorage.getItem('wallet')
    const c1 = readCookie('asherId')
    return (a1 || a2 || a3 || c1) ? String(a1 || a2 || a3 || c1) : null
  } catch {
    return null
  }
}

function detectTMAHard() {
  try {
    if (typeof window === 'undefined') return false
    const tg = window.Telegram && window.Telegram.WebApp
    if (!tg) return false
    if (tg.initData && typeof tg.initData === 'string' && tg.initData.includes('hash=')) return true
    const h = (window.location.hash || '')
    if (h.includes('tgWebAppData=') || h.includes('tgwebappdata=')) return true
    return false
  } catch { return false }
}

export default function AuthNavClient() {
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)

  const [isTMA, setIsTMA] = useState(false)
  const [tmaAuthed, setTmaAuthed] = useState(false)

  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  const tgLinkedRef = useRef(false)
  const linkFnRef = useRef(null)
  const refreshFnRef = useRef(null)

  const syncWalletSnapshot = useCallback((fallbackProvider = null) => {
    const bridgeState = readWalletBridgeState()
    const nextProvider = fallbackProvider || readStoredAuthMethod()

    if (bridgeState?.isConnected && bridgeState?.address) {
      setWalletConnected(true)
      setWalletAddress(String(bridgeState.address))
      setAuthMethod(nextProvider || bridgeState.provider || null)
      return
    }

    setWalletConnected(false)
    setWalletAddress(null)
    setAuthMethod(nextProvider || null)
  }, [])

  useEffect(() => {
    markStartup('auth_nav_mount')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const tma = detectTMAHard()
    setIsTMA(tma)

    const acc = readAccountId()
    setTmaAuthed(!!acc)

    try {
      if (acc && !window.__AUTH_ACCOUNT__) {
        window.__AUTH_ACCOUNT__ = acc
        markStartup('auth_ok_dispatch', { provider: 'tma_bootstrap' })
        window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: acc, provider: 'tma' } }))
      }
    } catch {}

    syncWalletSnapshot(readStoredAuthMethod())
  }, [mounted, syncWalletSnapshot])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onAuthOk = (ev) => {
      try {
        const acc = (ev && ev.detail && ev.detail.accountId) || readAccountId()
        const provider = String(ev?.detail?.provider || '') || readStoredAuthMethod() || null
        if (acc) setTmaAuthed(true)
        syncWalletSnapshot(provider)
      } catch {}
    }

    const onAuthLogout = () => {
      setWalletConnected(false)
      setWalletAddress(null)
      syncWalletSnapshot(readStoredAuthMethod())
    }

    const onWalletState = (ev) => {
      const detail = ev?.detail || {}
      const nextProvider =
        (detail.provider ? String(detail.provider) : null) ||
        readStoredAuthMethod() ||
        null

      if (detail.isConnected && detail.address) {
        setWalletConnected(true)
        setWalletAddress(String(detail.address))
        setAuthMethod(nextProvider)
        return
      }

      setWalletConnected(false)
      setWalletAddress(null)
      setAuthMethod(nextProvider)
    }

    const onRuntimeReady = () => {
      syncWalletSnapshot(readStoredAuthMethod())
    }

    window.addEventListener('auth:ok', onAuthOk)
    window.addEventListener('auth:logout', onAuthLogout)
    window.addEventListener('ql7:wallet-state', onWalletState)
    window.addEventListener('ql7:wallet-runtime-ready', onRuntimeReady)

    return () => {
      window.removeEventListener('auth:ok', onAuthOk)
      window.removeEventListener('auth:logout', onAuthLogout)
      window.removeEventListener('ql7:wallet-state', onWalletState)
      window.removeEventListener('ql7:wallet-runtime-ready', onRuntimeReady)
    }
  }, [syncWalletSnapshot])

  const requestOpenAuth = useCallback((source = 'topbar_button', view = '') => {
    try {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: { source, view } }))
    } catch {}
  }, [])

  const refreshTgLinkStatus = useCallback(async () => {
    if (checkingRef.current) return false
    checkingRef.current = true
    try {
      const accountId = readAccountId() || walletAddress || null
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
  }, [walletAddress])

  useEffect(() => { refreshTgLinkStatus() }, [mounted, walletConnected, walletAddress, refreshTgLinkStatus])

  const isAuthedWallet = !!(walletConnected && walletAddress)

  const authLabel = useMemo(() => {
    if (isAuthedWallet) return shortAddr(walletAddress)
    if (authMethod) {
      const methodKey = String(authMethod).trim().toLowerCase()
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      if (map[methodKey]) return map[methodKey]
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthedWallet, walletAddress, authMethod, t])

  async function onLinkTelegram() {
    try {
      const accountId = readAccountId() || walletAddress || null

      if (!accountId) {
        requestOpenAuth('telegram_link')
        return
      }

      const r = await fetch('/api/telegram/link/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId })
      })
      const j = await r.json().catch(() => null)
      if (!j || !j.ok) { alert((j && j.error) || 'Error'); return }

      const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot')
      const deepLink = j.deepLink || `https://t.me/${botName.replace('@', '')}?start=ql7link_${j.token}`
      safeOpenExternal(deepLink)

      const deadline = Date.now() + 15000
      const delay = (ms) => new Promise(r => setTimeout(r, ms))
      while (Date.now() < deadline) {
        await delay(1200)
        const linked = await refreshTgLinkStatus()
        if (linked) break
      }
    } catch {
      alert('Network error')
    }
  }

  useEffect(() => {
    tgLinkedRef.current = !!tgLinked
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tg:link-status', { detail: { linked: !!tgLinked } }))
      }
    } catch {}
  }, [tgLinked])

  useEffect(() => {
    linkFnRef.current = onLinkTelegram
    refreshFnRef.current = refreshTgLinkStatus
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.__QL7_TG_LINK_START__ = () => {
      try { linkFnRef.current && linkFnRef.current() } catch {}
    }
    window.__QL7_TG_LINK_REFRESH__ = async () => {
      try { return await (refreshFnRef.current ? refreshFnRef.current() : false) } catch { return false }
    }
    window.__QL7_TG_LINK_GET__ = () => {
      try { return !!tgLinkedRef.current } catch { return false }
    }

    return () => {
      try { delete window.__QL7_TG_LINK_START__ } catch {}
      try { delete window.__QL7_TG_LINK_REFRESH__ } catch {}
      try { delete window.__QL7_TG_LINK_GET__ } catch {}
    }
  }, [])

  if (isTMA && tmaAuthed) return null

  return (
    <>
      <button
        type="button"
        onClick={() => requestOpenAuth('topbar_button', isAuthedWallet ? 'account' : 'connect')}
        className={`nav-auth-btn ${isAuthedWallet ? 'is-auth' : 'is-guest'}`}
        aria-label="Open connect modal"
        data-auth-open
        data-auth={isAuthedWallet ? 'true' : 'false'}
        title={isAuthedWallet ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
        translate="no"
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
          onClick={(e) => { e.preventDefault(); onLinkTelegram() }}
          onTouchEnd={(e) => { e.preventDefault(); onLinkTelegram() }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLinkTelegram() }
          }}
        />
      )}
    </>
  )
}
