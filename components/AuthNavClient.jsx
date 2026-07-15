'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from './i18n'
import {
  clearWalletAuthStorage,
  getStoredWalletSession,
  hydrateLegacyAuth,
  logoutStoredWalletSession,
  verifyStoredWalletSession,
} from '../lib/walletSessionClient'

const MOBILE_OAUTH_GRACE_KEY = 'ql7_wallet_mobile_oauth_grace_until'
const MOBILE_OAUTH_GRACE_MS = 15000

const shortAddr = (value) => {
  const address = String(value || '').trim()
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
}

function isMobileOAuthBrowser() {
  try {
    const ua = String(navigator?.userAgent || '').toLowerCase()
    return /android|iphone|ipad|ipod|mobile|crios|fxios|edgios/.test(ua)
  } catch {
    return false
  }
}

function markMobileOAuthGrace(ms = MOBILE_OAUTH_GRACE_MS) {
  try {
    if (!isMobileOAuthBrowser()) return
    window.sessionStorage?.setItem(MOBILE_OAUTH_GRACE_KEY, String(Date.now() + Math.max(1000, Number(ms) || MOBILE_OAUTH_GRACE_MS)))
  } catch {}
}

function isMobileOAuthGraceActive() {
  try {
    return Number(window.sessionStorage?.getItem(MOBILE_OAUTH_GRACE_KEY) || 0) > Date.now()
  } catch {
    return false
  }
}

function isTelegramLink(url) {
  if (!url) return false
  const s = String(url)
  return /^https?:\/\/t\.me\//i.test(s) || /^tg:\/\//i.test(s)
}

function safeOpenExternal(url) {
  try {
    const isTG = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp
    const tg = isTG ? window.Telegram.WebApp : null
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isStandalone =
      (typeof window !== 'undefined' && window.navigator && window.navigator.standalone) ||
      (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)

    if (isTG && tg) {
      if (isTelegramLink(url) && typeof tg.openTelegramLink === 'function') {
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
    if (!w) window.location.href = url
  } catch {
    try { window.location.href = url } catch {}
  }
}

function readCookie(name) {
  try {
    if (typeof document === 'undefined') return ''
    const escaped = String(name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : ''
  } catch {
    return ''
  }
}

function readTmaAccountId() {
  try {
    if (typeof window === 'undefined') return ''
    const direct =
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ID__ ||
      window.__QL7_UID__ ||
      window.__FORUM_USER__ ||
      ''
    if (direct) return String(direct).trim()

    const local = window.localStorage
    const keys = ['asherId', 'ql7_uid', 'ql7_account', 'account', 'forum_user_id', 'wallet']
    for (const key of keys) {
      const value = local?.getItem(key)
      if (value) return String(value).trim()
    }

    return String(readCookie('asherId') || '').trim()
  } catch {
    return ''
  }
}

function publishTmaAuth(accountId) {
  try {
    if (typeof window === 'undefined' || !accountId) return
    window.__AUTH_ACCOUNT__ = accountId
    window.__ASHER_ID__ = accountId
    window.__QL7_UID__ = accountId
    window.__FORUM_USER__ = accountId
    window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId, provider: 'tma' } }))
  } catch {}
}

function publishTgLinkStatus(linked, detail = {}) {
  try {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('tg:link-status', {
      detail: {
        linked: !!linked,
        accountId: String(detail?.accountId || '').trim(),
        tgId: detail?.tgId || null,
      },
    }))
  } catch {}
}

function readAccountId() {
  try {
    if (typeof window === 'undefined') return ''
    const stored = getStoredWalletSession()
    return String(stored.accountId || stored.walletAddress || '').trim()
  } catch {
    return ''
  }
}

function openWalletRuntime(mode) {
  try {
    window.__QL7_WALLET_PENDING_MODE__ = mode
    if (typeof window.__QL7_OPEN_WALLET_RUNTIME__ === 'function') {
      window.__QL7_OPEN_WALLET_RUNTIME__(mode)
      return
    }
    window.dispatchEvent(new CustomEvent('ql7:wallet-runtime:mount', { detail: { mode } }))
  } catch {}
}

function detectTMAHard() {
  try {
    if (typeof window === 'undefined') return false
    const tg = window.Telegram && window.Telegram.WebApp
    if (!tg) return false
    if (tg.initData && typeof tg.initData === 'string' && tg.initData.includes('hash=')) return true
    const h = window.location.hash || ''
    return h.includes('tgWebAppData=') || h.includes('tgwebappdata=')
  } catch { return false }
}

export default function AuthNavClient() {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [checking, setChecking] = useState(true)
  const [isTMA, setIsTMA] = useState(false)
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  const refreshLocalAuth = useCallback(() => {
    const tmaMode = detectTMAHard()
    if (tmaMode) {
      const tmaAccount = readTmaAccountId()
      if (tmaAccount) {
        publishTmaAuth(tmaAccount)
        setAccountId(tmaAccount)
        return tmaAccount
      }
      setAccountId('')
      return ''
    }

    const account = readAccountId()
    if (account) {
      hydrateLegacyAuth({ accountId: account, walletAddress: getStoredWalletSession().walletAddress || account })
      setAccountId(account)
    } else {
      setAccountId('')
    }
    return account
  }, [])

  const verifySession = useCallback(async () => {
    setChecking(true)
    try {
      if (detectTMAHard()) {
        const tmaAccount = readTmaAccountId()
        if (tmaAccount) {
          publishTmaAuth(tmaAccount)
          setAccountId(tmaAccount)
          return true
        }
        setAccountId('')
        return false
      }

      const stored = getStoredWalletSession()
      if (!stored.token) {
        if (isMobileOAuthGraceActive()) return false
        setAccountId('')
        return false
      }
      const result = await verifyStoredWalletSession()
      if (result?.authorized) {
        setAccountId(result.accountId || result.walletAddress || '')
        return true
      }
      setAccountId('')
      return false
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const tmaMode = detectTMAHard()
    setIsTMA(tmaMode)
    refreshLocalAuth()
    void verifySession()
  }, [refreshLocalAuth, verifySession])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onAuthOk = (event) => {
      const next = String(
        event?.detail?.accountId ||
        event?.detail?.walletAddress ||
        (detectTMAHard() ? readTmaAccountId() : readAccountId()) ||
        ''
      ).trim()
      if (next) setAccountId(next)
    }
    const onLogout = () => setAccountId('')
    const onFocus = () => { void verifySession() }
    window.addEventListener('auth:ok', onAuthOk)
    window.addEventListener('wallet-session:verified', onAuthOk)
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('auth:ok', onAuthOk)
      window.removeEventListener('wallet-session:verified', onAuthOk)
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('focus', onFocus)
    }
  }, [verifySession])

  const refreshTgLinkStatus = useCallback(async () => {
    if (checkingRef.current) return false
    checkingRef.current = true
    try {
      const account = (detectTMAHard() ? readTmaAccountId() : readAccountId()) || accountId || ''
      if (!account) {
        setTgLinked(false)
        publishTgLinkStatus(false, { accountId: '' })
        return false
      }
      const res = await fetch('/api/telegram/link/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId: account }),
      })
      const data = await res.json().catch(() => null)
      const linked = !!data?.linked
      setTgLinked(linked)
      publishTgLinkStatus(linked, { accountId: data?.accountId || account, tgId: data?.tgId || null })
      return linked
    } catch {
      return false
    } finally {
      checkingRef.current = false
    }
  }, [accountId])

  useEffect(() => { if (mounted) void refreshTgLinkStatus() }, [mounted, accountId, refreshTgLinkStatus])

  const onOpenAuth = useCallback(() => {
    const account = readAccountId() || accountId
    const mode = account ? 'account' : 'connect'
    if (mode === 'connect') markMobileOAuthGrace()
    openWalletRuntime(mode)
  }, [accountId])

  const onLogout = useCallback(async () => {
    await logoutStoredWalletSession()
    clearWalletAuthStorage()
    setAccountId('')
  }, [])

  const onLinkTelegram = useCallback(async () => {
    try {
      const account = (detectTMAHard() ? readTmaAccountId() : readAccountId()) || accountId || ''
      if (!account) {
        openWalletRuntime('connect')
        return
      }
      const res = await fetch('/api/telegram/link/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId: account }),
      })
      const data = await res.json().catch(() => null)
      if (!data?.ok) { alert(data?.error || 'Error'); return }
      const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot'
      const deepLink = data.deepLink || `https://t.me/${botName.replace('@', '')}?start=ql7link_${data.token}`
      safeOpenExternal(deepLink)
    } catch {
      alert('Network error')
    }
  }, [accountId])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    window.__QL7_AUTH_LOGOUT__ = () => { void onLogout() }
    window.__QL7_TG_LINK_START__ = () => { void onLinkTelegram() }
    window.__QL7_TG_LINK_REFRESH__ = refreshTgLinkStatus
    window.__QL7_TG_LINK_GET__ = () => !!tgLinked
    return () => {
      try { delete window.__QL7_AUTH_LOGOUT__ } catch {}
      try { delete window.__QL7_TG_LINK_START__ } catch {}
      try { delete window.__QL7_TG_LINK_REFRESH__ } catch {}
      try { delete window.__QL7_TG_LINK_GET__ } catch {}
    }
  }, [onLinkTelegram, onLogout, refreshTgLinkStatus, tgLinked])

  const isAuthed = !!accountId
  const authLabel = useMemo(() => {
    if (isAuthed) return shortAddr(accountId)
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [accountId, isAuthed, t])

  if (!mounted) return null
  if (isTMA && isAuthed) return null

  return (
    <>
      <button
        type="button"
        onClick={onOpenAuth}
        className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
        aria-label="Open connect modal"
        data-auth-open
        data-auth={isAuthed ? 'true' : 'false'}
        data-checking={checking ? 'true' : 'false'}
        title={isAuthed ? (t('auth_account') || 'Account') : (t('auth_signin') || 'Sign in')}
        translate="no"
        dir="ltr"
        lang="en"
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
