// components/TopBar.js
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from './i18n'
import LanguageSwitcher from './LanguageSwitcher'
import dynamic from 'next/dynamic'
import Image from 'next/image'
 
const AuthNavClient = dynamic(() => import('./AuthNavClient'), { ssr: false })

const AUTH_LOCAL_STORAGE_KEYS = [
  'account',
  'wallet',
  'asherId',
  'ql7_uid',
  'ql7_account',
  'forum_user_id',
  'ql7_wallet_address',
  'ql7_wallet_address_lc',
  'ql7_wallet_account_id',
  'ql7_wallet_session_token',
  'ql7_wallet_session_expires_at',
  'ql7_wallet_session_provider',
  'ql7_vip',
  'ai_quota_vip',
  'ql7_admin',
  'w3m-auth-provider',
  'W3M_CONNECTED_CONNECTOR',
  'WEB3_CONNECT_CACHED_PROVIDER',
  'wagmi.store',
  'wagmi.recentConnectorId',
  'wagmi.injected.connected',
]

const AUTH_STORAGE_PREFIXES = [
  'w3m-',
  'W3M_',
  'wc@',
  'walletconnect',
  'WALLETCONNECT',
  '@w3m',
  'appkit',
  'reown',
]

const AUTH_LOGOUT_LOCK_KEY = 'ql7_auth_logout_lock'

function getAuthStorage(kind) {
  try {
    if (typeof window === 'undefined') return null
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function authStorageSet(kind, key, value) {
  try {
    getAuthStorage(kind)?.setItem(key, value)
  } catch {}
}

function authStorageRemove(kind, key) {
  try {
    getAuthStorage(kind)?.removeItem(key)
  } catch {}
}

function markWagmiDisconnected() {
  try {
    if (typeof window === 'undefined') return
    authStorageSet('local', 'wagmi.injected.disconnected', 'true')
    authStorageSet('session', 'wagmi.injected.disconnected', 'true')
    authStorageRemove('local', 'wagmi.injected.connected')
    authStorageRemove('session', 'wagmi.injected.connected')
    authStorageRemove('local', 'wagmi.recentConnectorId')
    authStorageRemove('session', 'wagmi.recentConnectorId')
  } catch {}
}

function markAuthLogoutLock() {
  try {
    if (typeof window === 'undefined') return
    const value = String(Date.now())
    authStorageSet('local', AUTH_LOGOUT_LOCK_KEY, value)
    authStorageSet('session', AUTH_LOGOUT_LOCK_KEY, value)
    window.__QL7_AUTH_LOGGED_OUT__ = true
  } catch {}
}

function clearCookie(name) {
  try {
    const host = window.location.hostname
    const base = `${encodeURIComponent(name)}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = base
    if (host && host !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      document.cookie = `${base}; domain=${host}`
      document.cookie = `${base}; domain=.${host.replace(/^\./, '')}`
    }
  } catch {}
}

function clearAuthClientState() {
  try {
    if (typeof window === 'undefined') return
    const w = window
    try { delete w.__AUTH_ACCOUNT__ } catch { w.__AUTH_ACCOUNT__ = undefined }
    try { delete w.__ASHER_ID__ } catch { w.__ASHER_ID__ = undefined }
    try { delete w.__QL7_UID__ } catch { w.__QL7_UID__ = undefined }
    try { delete w.__FORUM_USER__ } catch { w.__FORUM_USER__ = undefined }
    try { delete w.wallet } catch { w.wallet = undefined }
    try { delete w.account } catch { w.account = undefined }

    const clearStore = (store) => {
      if (!store) return
      const keys = []
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i)
        if (!key) continue
        if (
          AUTH_LOCAL_STORAGE_KEYS.includes(key) ||
          AUTH_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
        ) {
          keys.push(key)
        }
      }
      AUTH_LOCAL_STORAGE_KEYS.forEach((key) => keys.push(key))
      Array.from(new Set(keys)).forEach((key) => {
        try { store.removeItem(key) } catch {}
      })
    }

    clearStore(getAuthStorage('local'))
    clearStore(getAuthStorage('session'))
    markWagmiDisconnected()
    ;['asherId', 'account', 'wallet', 'ql7_uid', 'ql7_account', 'forum_user_id'].forEach(clearCookie)
    markAuthLogoutLock()
  } catch {}
}


const METAMARKET_GIFTS_SOURCE = 'metamarket_gifts'
const NOTIFICATION_COUNTS_STORAGE_KEY = 'ql7_notification_counts_v1'

function readMetaMarketGiftNotificationCount(detail = null) {
  try {
    const source = String(detail?.source || '').trim()
    if (source === METAMARKET_GIFTS_SOURCE) {
      return Math.max(0, Number(detail?.count) || 0)
    }
    const stateCount = Number(
      detail?.counts?.[METAMARKET_GIFTS_SOURCE] ??
      window.__QL7_NOTIFICATION_STATE__?.counts?.[METAMARKET_GIFTS_SOURCE] ??
      0,
    )
    if (stateCount > 0) return stateCount
    const storedCounts = JSON.parse(window.localStorage.getItem(NOTIFICATION_COUNTS_STORAGE_KEY) || '{}')
    return Math.max(0, Number(storedCounts?.[METAMARKET_GIFTS_SOURCE]) || 0)
  } catch {
    return 0
  }
}

// математика: точка на окружности по углу
function polarToCartesian (cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * (angleDeg - 90)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export default function TopBar () {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const [metaMarketGiftAlert, setMetaMarketGiftAlert] = useState(false)

  // слушатель логаута
  if (typeof window !== 'undefined') {
    window.__QL7_TOPBAR_LOGOUT_ONCE__ ||= (() => {
      const onLogout = () => {
        try { window.dispatchEvent(new Event('aiquota:flush')) } catch {}
        try { clearAuthClientState() } catch {}
        try { window.location.reload() } catch {}
      }
      window.addEventListener('auth:logout', onLogout)
      return true
    })()
  }


  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const updateGiftAlert = (detail = null) => {
      setMetaMarketGiftAlert(readMetaMarketGiftNotificationCount(detail) > 0)
    }
    const onCount = (event) => {
      const detail = event?.detail || {}
      if (String(detail?.source || '').trim() !== METAMARKET_GIFTS_SOURCE) return
      updateGiftAlert(detail)
    }
    const onState = (event) => updateGiftAlert(event?.detail || null)
    const onStorage = (event) => {
      if (!event || event.key === NOTIFICATION_COUNTS_STORAGE_KEY) updateGiftAlert()
    }

    updateGiftAlert()
    window.addEventListener('ql7:notification-count', onCount)
    window.addEventListener('ql7:notification-state', onState)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('ql7:notification-count', onCount)
      window.removeEventListener('ql7:notification-state', onState)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const items = [
    { href: '/exchange',  label: t('nav_exchange') },
    { href: '/academy',   label: t('nav_academy') },  
    { href: '/about',     label: t('nav_about') },
    { href: '/subscribe', label: t('nav_subscribe') }, 
    { href: '/forum',     label: t('forum_title') },    
  ] 
 
  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => isActive(item.href))
  )

  // ===== авто-масштаб под самые длинные лейблы (арабский и т.п.) =========
  const maxLabelLen = items.reduce(
    (max, item) => Math.max(max, (item.label || '').length),
    0
  )

  let orbitScale = 1
  if (maxLabelLen > 28) orbitScale = 0.6
  else if (maxLabelLen > 24) orbitScale = 0.68
  else if (maxLabelLen > 20) orbitScale = 0.78
  else if (maxLabelLen > 16) orbitScale = 0.88

  // ===== Геометрия монеты =================================================
  const VIEWBOX = 400
  const CX = VIEWBOX / 2
  const CY = VIEWBOX / 2
  const R  = 150
  const angleStep = 360 / items.length

  // активный сегмент всегда наверху: центр дуги = -90°
  const baseAngle = 0 - angleStep / 2

  // дуги под textPath
  const arcPaths = items.map((_, index) => {
    // чуть уменьшили зазор между дугами, чтобы «дуга к дуге»
    const paddingDeg = 2
    const startDeg = baseAngle + angleStep * index + paddingDeg
    const endDeg   = baseAngle + angleStep * (index + 1) - paddingDeg

    const start = polarToCartesian(CX, CY, R, startDeg)
    const end   = polarToCartesian(CX, CY, R, endDeg)

    const d = [
      `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
      `A ${R} ${R} 0 0 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
    ].join(' ')

    return { id: `ql7-nav-arc-${index}`, d }
  })

  const openMetaMarketFromBrand = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('metamarket:open', {
      detail: {
        source: 'topbar-brand',
        initialMode: metaMarketGiftAlert ? 'collections' : 'market',
        giftFlow: false,
      },
    }))
  }

  return (
    <header className="topbar">
      {/* логотип слева */}
      <Link href="/" className="brand" aria-label="Quantum L7 AI">
        <Image
          src="/branding/quantum_l7_logo.png"
          alt="Quantum L7 AI"
          className="brand-logo"
          width={160}
          height={40}
          priority
        />
      </Link>

      {/* колонка справа: орбита + под ней auth+lang */}
      <nav aria-label="Main" className="topbar-nav">
        <div className="nav-orbit-shell">
          <div
            className="nav-orbit"
            style={{
              '--orbit-count': items.length,
              '--orbit-active-index': activeIndex,
              '--orbit-scale': orbitScale,
            }}
          >
            {/* фоновые бегущие импульсные кольца */}
            <div className="nav-orbit-rings" aria-hidden="true" />

            {/* SVG-монета с текстом по дуге */}
            <svg
              className="nav-orbit-svg"
              viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
              aria-hidden="false"
              role="group"
            >
              <defs>
                {arcPaths.map((arc) => (
                  <path
                    key={arc.id}
                    id={arc.id}
                    d={arc.d}
                    fill="none"
                  />
                ))}

                {/* тёмное «узкое» кольцо-подложка под текстом */}
                <linearGradient id="ql7-orbit-band-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#020617" stopOpacity="0.9" />
                  <stop offset="40%"  stopColor="#020617" stopOpacity="0.85" />
                  <stop offset="60%"  stopColor="#020617" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.85" />
                </linearGradient>

                {/* мягкий свет вокруг кольца */}
                <radialGradient id="ql7-orbit-halo" cx="50%" cy="50%" r="65%">
                  <stop offset="0%"  stopColor="#9e03f8ff" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#facc15" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>

                {/* золотой градиент для букв */}
                <linearGradient id="ql7-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#ffe600ff" />

                </linearGradient>
              </defs>

              {/* вращаем всё кольцо: активный пункт в зените */}
              <g
                className="nav-orbit-ring-svg"
                style={{
                  transform: `rotate(${-angleStep * activeIndex}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                {/* световое пятно под монетой */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R + 32}
                  fill="url(#ql7-orbit-halo)"
                />

                {/* ТЁМНЫЙ УЗКИЙ РИНГ — подложка под текст, чтобы читалось */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R + 7}
                  fill="none"
                  stroke="url(#ql7-orbit-band-grad)"
                  strokeWidth="60"
                  className="nav-orbit-band"
                />

                {/* сами пункты меню по дуге */}
                {items.map((item, index) => {
                  const active = isActive(item.href)
                  const arcId = arcPaths[index].id
                  const label = (item.label || '').toUpperCase()

                  return (
                    <g
                      key={item.href}
                      className={
                        'nav-orbit-arc' + (active ? ' nav-orbit-arc--active' : '')
                      }
                      onClick={() => router.push(item.href)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(item.href)
                        }
                      }}
                      role="link"
                      aria-label={item.label}
                    >
                      <text className="nav-orbit-arc-text">
                        <textPath
                          href={`#${arcId}`}
                          startOffset="50%"
                          textAnchor="middle"
                        >
                         
                          {label}
                        
                          
                        </textPath>
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* центр орбиты: джойстик; всегда идеально по центру, без съезда на арабском */}
            <div className="nav-orbit-center">
              <Link
                href="/game"
                className="nav-game-btn nav-orbit-center-btn"
                aria-label={t('nav_game') || 'Game'}
              >
                <Image
                  src="/game/game.gif"
                  alt={t('nav_game') || 'Game'}
                  width={110}
                  height={110}
                  className="nav-game-icon"
                  priority={false}
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Auth + язык: всегда прямо под навигацией, по центру относительно орбиты */}
        <div className="nav-orbit-controls">
          <AuthNavClient />
          <button
            type="button"
            className={`topbarMetaMarketBtn ${metaMarketGiftAlert ? 'hasMetaGiftAlert' : ''}`}
            onClick={openMetaMarketFromBrand}
            aria-label={t('metamarket_open_aria') || 'Meta Market'}
            title={t('metamarket_open') || 'Meta Market'}
          >
            <span className="sr-only">{t('metamarket_open') || 'Meta Market'}</span>
            <svg className="topbarMetaMarketSvg" viewBox="0 0 112 34" aria-hidden="true">
              <defs>
                <linearGradient id="topbar-market-text-fill" x1="14" y1="0" x2="98" y2="0">
                  <stop offset="0%" stopColor="#f8ffff" />
                  <stop offset="38%" stopColor="#8ff7ff" />
                  <stop offset="62%" stopColor="#f5dc83" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                <filter id="topbar-market-glow" x="-28%" y="-95%" width="156%" height="290%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.75" floodColor="#f8ffff" floodOpacity="1" />
                  <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#22d3ee" floodOpacity="0.7" />
                  <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#facc15" floodOpacity="0.22" />
                </filter>
              </defs>
              <rect className="topbarMetaPlate" x="7" y="5" width="98" height="24" rx="12" />
              <path className="topbarMetaCircuit topbarMetaCircuit--top" d="M11 10H25L31 7H46M66 7H82L88 10H101" />
              <path className="topbarMetaCircuit topbarMetaCircuit--bottom" d="M12 25H35L41 28H70L76 25H100" />
              <circle className="topbarMetaNode topbarMetaNode--a" cx="14" cy="17" r="1.35" />
              <circle className="topbarMetaNode topbarMetaNode--b" cx="98" cy="17" r="1.35" />
              <path className="topbarMetaScanner" d="M18 17H94" />
              <g className="topbarMetaWord topbarMetaWord--meta">
                <text className="topbarMetaWordText topbarMetaWordText--meta" x="56" y="22" textAnchor="middle">Meta</text>
              </g>
              <g className="topbarMetaFragments">
                <circle className="topbarMetaShard topbarMetaShard--1" cx="39" cy="14" r="0.9" />
                <circle className="topbarMetaShard topbarMetaShard--2" cx="46" cy="20" r="0.75" />
                <circle className="topbarMetaShard topbarMetaShard--3" cx="52" cy="13" r="0.85" />
                <circle className="topbarMetaShard topbarMetaShard--4" cx="59" cy="21" r="0.75" />
                <circle className="topbarMetaShard topbarMetaShard--5" cx="66" cy="15" r="0.9" />
                <circle className="topbarMetaShard topbarMetaShard--6" cx="73" cy="19" r="0.7" />
                <path className="topbarMetaShard topbarMetaShard--7" d="M43 16l3 -2" />
                <path className="topbarMetaShard topbarMetaShard--8" d="M63 18l4 2" />
              </g>
              <g className="topbarMetaWord topbarMetaWord--market">
                <text className="topbarMetaWordText topbarMetaWordText--market" x="56" y="22" textAnchor="middle">Market</text>
              </g>
              <path className="topbarMetaComet" d="M21 26H91" />
            </svg>
            {metaMarketGiftAlert && (
              <span className="topbarMetaGiftBell" aria-hidden="true">
                <svg className="topbarMetaGiftBellSvg" viewBox="0 0 48 48" focusable="false">
                  <defs>
                    <radialGradient id="topbar-meta-gift-bell-glow" cx="50%" cy="45%" r="60%">
                      <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
                      <stop offset="38%" stopColor="#ff3b30" stopOpacity=".92" />
                      <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="topbar-meta-gift-bell-fill" x1="12" y1="8" x2="36" y2="40">
                      <stop offset="0%" stopColor="#fff7ed" />
                      <stop offset="28%" stopColor="#ff5a4f" />
                      <stop offset="68%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </linearGradient>
                    <filter id="topbar-meta-gift-bell-shadow" x="-70%" y="-70%" width="240%" height="240%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.35" floodColor="#fecaca" floodOpacity="1" />
                      <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#ef4444" floodOpacity=".76" />
                    </filter>
                  </defs>
                  <circle className="topbarMetaGiftBellAura" cx="24" cy="24" r="17" fill="url(#topbar-meta-gift-bell-glow)" />
                  <g className="topbarMetaGiftBellBody" filter="url(#topbar-meta-gift-bell-shadow)">
                    <path className="topbarMetaGiftBellStroke" d="M18.5 18.7c.55-4.1 2.95-6.85 5.5-6.85s4.95 2.75 5.5 6.85l.64 5.22c.2 1.66.82 3.08 1.86 4.25l1.2 1.36H14.8l1.2-1.36c1.04-1.17 1.66-2.59 1.86-4.25l.64-5.22Z" />
                    <path className="topbarMetaGiftBellStroke" d="M20.7 32.05c.62 1.82 1.76 2.94 3.3 2.94s2.68-1.12 3.3-2.94" />
                    <path className="topbarMetaGiftBellClapper" d="M22.1 29.45h3.8c-.15 1.16-.82 1.9-1.9 1.9s-1.75-.74-1.9-1.9Z" />
                    <path className="topbarMetaGiftBellSpark" d="M24 9.3v-3" />
                  </g>
                  <g className="topbarMetaGiftBellParticles">
                    <circle className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--1" cx="12" cy="16" r="1.35" />
                    <circle className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--2" cx="36" cy="15" r="1.2" />
                    <circle className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--3" cx="10" cy="28" r="1.05" />
                    <circle className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--4" cx="38" cy="29" r="1" />
                    <path className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--5" d="M8 21h4" />
                    <path className="topbarMetaGiftBellParticle topbarMetaGiftBellParticle--6" d="M36 22h4" />
                  </g>
                </svg>
              </span>
            )}
          </button>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}
