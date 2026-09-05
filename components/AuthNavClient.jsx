'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from './i18n'
import ViewportAnimatedImage from './visual-runtime/ViewportAnimatedImage'
import {
  clearWalletAuthStorage,
  getStoredWalletSession,
  hydrateLegacyAuth,
  logoutStoredWalletSession,
  verifyStoredWalletSession,
} from '../lib/walletSessionClient'

const MOBILE_OAUTH_GRACE_KEY = 'ql7_wallet_mobile_oauth_grace_until'
const MOBILE_OAUTH_GRACE_MS = 15000
const WALLET_SESSION_FOCUS_REVERIFY_MS = 20 * 1000

const AUTH_IDENTITY_GLYPHS = Object.freeze(['i', 'd', 'e', 'n', 't', 'i', 't', 'y'])
const AUTH_VERIFIED_GLYPHS = Object.freeze(['v', 'e', 'r', 'i', 'f', 'i', 'e', 'd'])
const AUTH_IDENTITY_PARTICLES = Object.freeze([
  { cx: 36, cy: 31, dx: -15, dy: -13, r: 0.62, delay: 0.00 },
  { cx: 40, cy: 38, dx: -13, dy: 11, r: 0.50, delay: 0.04 },
  { cx: 44, cy: 30, dx: -8, dy: -16, r: 0.58, delay: 0.08 },
  { cx: 48, cy: 39, dx: -5, dy: 14, r: 0.46, delay: 0.12 },
  { cx: 52, cy: 30, dx: 0, dy: -18, r: 0.68, delay: 0.02 },
  { cx: 56, cy: 39, dx: 5, dy: 14, r: 0.46, delay: 0.10 },
  { cx: 60, cy: 30, dx: 8, dy: -16, r: 0.58, delay: 0.06 },
  { cx: 64, cy: 38, dx: 13, dy: 11, r: 0.50, delay: 0.14 },
  { cx: 68, cy: 31, dx: 15, dy: -13, r: 0.62, delay: 0.03 },
  { cx: 42, cy: 34, dx: -18, dy: 1, r: 0.38, delay: 0.16 },
  { cx: 62, cy: 34, dx: 18, dy: -2, r: 0.38, delay: 0.18 },
  { cx: 58, cy: 35, dx: 11, dy: 18, r: 0.42, delay: 0.20 },
])

function AuthIdentityShield({ isAuthed, guestLabel, busy }) {
  return (
    <>
      <span className="sr-only">{isAuthed ? 'Identity verified' : guestLabel}</span>

      {!isAuthed && (
        <span
          className="navAuthGuestLens"
          aria-hidden="true"
        />
      )}

      <svg
        className="navAuthShieldSvg"
        viewBox="0 0 104 74"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="nav-auth-guest-shell" x1="24" y1="7" x2="80" y2="67">
            <stop offset="0%" stopColor="#ff6d75" stopOpacity="0.48" />
            <stop offset="24%" stopColor="#ef3340" stopOpacity="0.40" />
            <stop offset="66%" stopColor="#97121d" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#360308" stopOpacity="0.52" />
          </linearGradient>

          <radialGradient id="nav-auth-guest-core" cx="38%" cy="28%" r="88%">
            <stop offset="0%" stopColor="#ff5b68" stopOpacity="0.050" />
            <stop offset="48%" stopColor="#b41424" stopOpacity="0.032" />
            <stop offset="100%" stopColor="#560710" stopOpacity="0.060" />
          </radialGradient>

          <linearGradient id="nav-auth-gold-shell" x1="24" y1="5" x2="80" y2="69">
            <stop offset="0%" stopColor="#fff1a0" />
            <stop offset="13%" stopColor="#ffd23b" />
            <stop offset="41%" stopColor="#f6b900" />
            <stop offset="70%" stopColor="#c57b00" />
            <stop offset="100%" stopColor="#704000" />
          </linearGradient>

          <radialGradient id="nav-auth-gold-core" cx="38%" cy="24%" r="90%">
            <stop offset="0%" stopColor="#382300" />
            <stop offset="36%" stopColor="#171005" />
            <stop offset="100%" stopColor="#050403" />
          </radialGradient>

<linearGradient id="nav-auth-identity-fill" x1="28" y1="0" x2="76" y2="0">
  <stop offset="0%" stopColor="#ffffff" />
  <stop offset="38%" stopColor="#ffffff" />
  <stop offset="70%" stopColor="#effbff" />
  <stop offset="100%" stopColor="#ffffff" />
</linearGradient>

<linearGradient id="nav-auth-verified-fill" x1="28" y1="0" x2="76" y2="0">
  <stop offset="0%" stopColor="#f7fff9" />
  <stop offset="22%" stopColor="#c8ffdc" />
  <stop offset="54%" stopColor="#62ffa8" />
  <stop offset="100%" stopColor="#00f078" />
</linearGradient>

          <radialGradient id="nav-auth-particle-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#ffe894" />
            <stop offset="100%" stopColor="#d79312" stopOpacity="0" />
          </radialGradient>

          <filter
            id="nav-auth-shell-glow"
            x="-45%"
            y="-35%"
            width="190%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="0.9"
              floodColor="#000000"
              floodOpacity="0.74"
            />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.65"
              floodColor="#f7b800"
              floodOpacity="0.52"
            />
          </filter>

<filter
  id="nav-auth-glyph-glow"
  x="-80%"
  y="-170%"
  width="260%"
  height="440%"
>
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="0.28"
    floodColor="#ffffff"
    floodOpacity="1"
  />
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="0.82"
    floodColor="#ffffff"
    floodOpacity="1"
  />
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="1.72"
    floodColor="#b7eeff"
    floodOpacity="0.98"
  />
</filter>

<filter
  id="nav-auth-verified-glow"
  x="-80%"
  y="-170%"
  width="260%"
  height="440%"
>
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="0.28"
    floodColor="#ffffff"
    floodOpacity="1"
  />
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="0.88"
    floodColor="#7cffb5"
    floodOpacity="1"
  />
  <feDropShadow
    dx="0"
    dy="0"
    stdDeviation="1.82"
    floodColor="#00ed78"
    floodOpacity="0.96"
  />
</filter>

          <clipPath id="nav-auth-shield-clip">
            <path d="M52 3C64 8 76 10 88 11V32C88 49 76 61 52 71C28 61 16 49 16 32V11C28 10 40 8 52 3Z" />
          </clipPath>

          <symbol id="nav-auth-glyph-i" viewBox="0 0 10 12">
            <path d="M1 0H9M5 0V12M1 12H9" />
          </symbol>

          <symbol id="nav-auth-glyph-d" viewBox="0 0 10 12">
            <path d="M1 0V12H4.7C7.5 12 9 9.9 9 6S7.5 0 4.7 0H1Z" />
          </symbol>

          <symbol id="nav-auth-glyph-e" viewBox="0 0 10 12">
            <path d="M9 0H1V12H9M1 6H7.5" />
          </symbol>

          <symbol id="nav-auth-glyph-n" viewBox="0 0 10 12">
            <path d="M1 12V0L9 12V0" />
          </symbol>

          <symbol id="nav-auth-glyph-t" viewBox="0 0 10 12">
            <path d="M0 0H10M5 0V12" />
          </symbol>

          <symbol id="nav-auth-glyph-y" viewBox="0 0 10 12">
            <path d="M0 0L5 6L10 0M5 6V12" />
          </symbol>

          <symbol id="nav-auth-glyph-v" viewBox="0 0 10 12">
            <path d="M0 0L5 12L10 0" />
          </symbol>

          <symbol id="nav-auth-glyph-r" viewBox="0 0 10 12">
            <path d="M1 12V0H5C7.7 0 9 1.4 9 3.5S7.7 7 5 7H1M5 7L10 12" />
          </symbol>

          <symbol id="nav-auth-glyph-f" viewBox="0 0 10 12">
            <path d="M1 12V0H9M1 6H7.5" />
          </symbol>
        </defs>

        <ellipse
          className="navAuthShieldHalo"
          cx="52"
          cy="36"
          rx="39"
          ry="32"
        />

        <path
          className="navAuthShieldBody"
          d="M52 3C64 8 76 10 88 11V32C88 49 76 61 52 71C28 61 16 49 16 32V11C28 10 40 8 52 3Z"
          fill="none"
        />

        <path
          className="navAuthShieldInner"
          d="M52 8C62.5 12 72.5 14 81 15V32C81 44.5 71 54.5 52 63C33 54.5 23 44.5 23 32V15C31.5 14 41.5 12 52 8Z"
          fill={isAuthed ? 'url(#nav-auth-gold-core)' : 'url(#nav-auth-guest-core)'}
        />

        <path
          className="navAuthShieldRim"
          d="M52 8C62.5 12 72.5 14 81 15V32C81 44.5 71 54.5 52 63C33 54.5 23 44.5 23 32V15C31.5 14 41.5 12 52 8Z"
        />

        <path
          className="navAuthShieldCrown"
          d="M27 18L52 9.8L77 18"
        />

        <path
          className="navAuthShieldBevel"
          d="M27 46.5C33 53 41.5 58.5 52 63C62.5 58.5 71 53 77 46.5"
        />

        <path
          className="navAuthShieldCircuit navAuthShieldCircuit--left"
          d="M23 25H31L36 21.5H42"
        />
        <path
          className="navAuthShieldCircuit navAuthShieldCircuit--right"
          d="M81 25H73L68 21.5H62"
        />

        <circle
          className="navAuthShieldNode navAuthShieldNode--left"
          cx="27"
          cy="25"
          r="0.95"
        />
        <circle
          className="navAuthShieldNode navAuthShieldNode--right"
          cx="77"
          cy="25"
          r="0.95"
        />

        {isAuthed && (
          <>
            <g clipPath="url(#nav-auth-shield-clip)">
              <path
                className="navAuthShieldScan"
                d="M24 36H80"
              />
              <path
                className="navAuthShieldGlint"
                d="M33 6L13 68"
              />
            </g>

            <g
              className="navAuthIdentityWord navAuthIdentityWord--identity"
              filter="url(#nav-auth-glyph-glow)"
            >
              {AUTH_IDENTITY_GLYPHS.map((glyph, index) => (
                <use
                  key={`identity-${index}`}
                  className="navAuthIdentityLetter"
                  href={`#nav-auth-glyph-${glyph}`}
                  x={26 + (index * 6.55)}
                  y="29"
                  width="5.4"
                  height="9"
                  style={{
                    '--auth-letter-delay': `${index * 0.07}s`,
                  }}
                />
              ))}
            </g>

            <g className="navAuthIdentityParticles">
              {AUTH_IDENTITY_PARTICLES.map((particle, index) => (
                <circle
                  key={`identity-particle-${index}`}
                  className="navAuthIdentityParticle"
                  cx={particle.cx}
                  cy={particle.cy}
                  r={particle.r}
                  style={{
                    '--auth-particle-x': `${particle.dx}px`,
                    '--auth-particle-y': `${particle.dy}px`,
                    '--auth-particle-rx': `${particle.dx * -0.82}px`,
                    '--auth-particle-ry': `${particle.dy * -0.82}px`,
                    '--auth-particle-delay': `${particle.delay}s`,
                  }}
                />
              ))}
            </g>

            <g
              className="navAuthIdentityWord navAuthIdentityWord--verified"
              filter="url(#nav-auth-verified-glow)"
            >
              {AUTH_VERIFIED_GLYPHS.map((glyph, index) => (
                <use
                  key={`verified-${index}`}
                  className="navAuthIdentityLetter"
                  href={`#nav-auth-glyph-${glyph}`}
                  x={26 + (index * 6.55)}
                  y="29"
                  width="5.4"
                  height="9"
                  style={{
                    '--auth-letter-delay': `${index * 0.07}s`,
                  }}
                />
              ))}
            </g>

            <path
              className="navAuthIdentityComet"
              d="M28 47H76"
            />
          </>
        )}

        {busy && (
          <path
            className="navAuthBusyTrace"
            d="M52 3C64 8 76 10 88 11V32C88 49 76 61 52 71C28 61 16 49 16 32V11C28 10 40 8 52 3Z"
            pathLength="100"
          />
        )}
      </svg>

      {!isAuthed && (
        <span className="navAuthGuestLabel">
          {guestLabel}
        </span>
      )}

    </>
  )
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
    if (!stored.token) return ''
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

function isWalletRuntimeInteractionActive() {
  try {
    if (typeof window === 'undefined') return false
    const status = typeof window.__QL7_WALLET_RUNTIME_STATUS__ === 'function'
      ? window.__QL7_WALLET_RUNTIME_STATUS__()
      : null
    return !!(
      status?.runtimeActive
      || status?.runtimeOpening
      || status?.modalOpen
      || status?.accountRestorePending
      || status?.accountRestoreHidden
    )
  } catch {
    return false
  }
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
  const { t, lang } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [checking, setChecking] = useState(true)
  const [opening, setOpening] = useState(false)
  const [isTMA, setIsTMA] = useState(false)
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)
  const openingTimerRef = useRef(null)
  const verifyInFlightRef = useRef(null)
  const lastVerifyAtRef = useRef(0)

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

  const verifySession = useCallback(async (options = {}) => {
    const silent = !!options.silent
    const force = options.force === true
    const minAgeMs = Math.max(0, Number(options.minAgeMs || 0))
    const verifiedRecently = !force && minAgeMs > 0 && Date.now() - Number(lastVerifyAtRef.current || 0) < minAgeMs
    if (verifiedRecently) return !!readAccountId()
    if (!silent) setChecking(true)
    if (verifyInFlightRef.current) {
      try {
        return await verifyInFlightRef.current
      } finally {
        if (!silent) setChecking(false)
      }
    }
    const task = (async () => {
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
        if (result?.transient) {
          const fallbackAccount = stored.accountId || stored.walletAddress || ''
          if (fallbackAccount) setAccountId(fallbackAccount)
          return !!fallbackAccount
        }
        setAccountId('')
        return false
      } finally {
        lastVerifyAtRef.current = Date.now()
        verifyInFlightRef.current = null
      }
    })()
    verifyInFlightRef.current = task
    try {
      return await task
    } finally {
      if (!silent) setChecking(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const tmaMode = detectTMAHard()
    setIsTMA(tmaMode)
    refreshLocalAuth()
    void verifySession({ force: true })
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
      if (next) {
        setOpening(false)
        setAccountId(next)
      }
    }
    const onLogout = () => {
      setOpening(false)
      setAccountId('')
    }
    const onFocus = () => {
      if (isWalletRuntimeInteractionActive()) return
      void verifySession({ minAgeMs: WALLET_SESSION_FOCUS_REVERIFY_MS })
    }
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

  useEffect(() => () => {
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current)
  }, [])

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

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return undefined
    const refreshAfterReturn = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void refreshTgLinkStatus()
    }
    window.addEventListener('focus', refreshAfterReturn)
    window.addEventListener('pageshow', refreshAfterReturn)
    document.addEventListener('visibilitychange', refreshAfterReturn)
    return () => {
      window.removeEventListener('focus', refreshAfterReturn)
      window.removeEventListener('pageshow', refreshAfterReturn)
      document.removeEventListener('visibilitychange', refreshAfterReturn)
    }
  }, [mounted, refreshTgLinkStatus])

  const onOpenAuth = useCallback(() => {
    const account = readAccountId()
    const mode = account ? 'account' : 'connect'
    if (!account && accountId) setAccountId('')
    if (mode === 'connect') markMobileOAuthGrace()
    setOpening(true)
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current)
    openingTimerRef.current = window.setTimeout(() => setOpening(false), 8000)
    openWalletRuntime(mode)
  }, [accountId])

  const onLogout = useCallback(async () => {
    await logoutStoredWalletSession()
    clearWalletAuthStorage()
    setOpening(false)
    setAccountId('')
  }, [])

  const onLinkTelegram = useCallback(async () => {
    try {
      const stored = getStoredWalletSession()
      const account = readAccountId() || accountId || ''
      if (!account || !stored.token) {
        openWalletRuntime('connect')
        return
      }
      const res = await fetch('/api/telegram/link/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          accountId: account,
          walletAddress: stored.walletAddress || account,
          walletSessionToken: stored.token,
        }),
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

const effectiveAccountId = isTMA ? accountId : readAccountId()
const isAuthed = !!effectiveAccountId
const authLabel = useMemo(() => {
  const v = t('auth_signin')
  return v && v !== 'auth_signin' ? v : 'Sign in'
}, [t])

  if (!mounted) return null
  if (isTMA && isAuthed) return null

  return (
    <>
<button
  type="button"
  onClick={onOpenAuth}
  className={`nav-auth-btn ${isAuthed ? 'is-auth' : 'is-guest'}`}
  aria-label={isAuthed ? 'Identity verified. Open account.' : authLabel}
  data-auth-open
  data-auth={isAuthed ? 'true' : 'false'}
  data-checking={(checking || opening) ? 'true' : 'false'}
  data-ql7-visual-scope="auth-identity"
  data-ql7-visual-margin="near50"
  data-ql7-visual-root="viewport"
  data-ql7-visual-pause-css="1"
  aria-busy={checking || opening ? 'true' : 'false'}
  title={isAuthed ? (t('auth_account') || 'Account') : authLabel}
  translate="no"
  dir={isAuthed ? 'ltr' : 'auto'}
  lang={isAuthed ? 'en' : lang}
>
  <AuthIdentityShield
    isAuthed={isAuthed}
    guestLabel={authLabel}
    busy={checking || opening}
  />
</button>

      {!tgLinked && (
        <ViewportAnimatedImage
          animatedSrc="/click/telegram.gif"
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
