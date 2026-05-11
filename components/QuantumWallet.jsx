'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from './i18n'
import useQCoinLive from '../app/forum/features/qcoin/hooks/useQCoinLive'
import { formatQCoinBalance } from '../app/forum/features/qcoin/utils/formatQCoinBalance'

const WALLET_Z_INDEX = 2147482400

const FALLBACKS = {
  quantum_wallet_title: 'Quantum Wallet',
  quantum_wallet_open_aria: 'Open Quantum Wallet',
  quantum_wallet_back: 'Back',
  quantum_wallet_close: 'Close',
  quantum_wallet_info: 'Info',
  quantum_wallet_info_title: 'QCoin Information',
  quantum_wallet_balance_label: 'QCoin',
  quantum_wallet_receive: 'Receive',
  quantum_wallet_send: 'Send',
  quantum_wallet_swap: 'Swap',
  quantum_wallet_exchange: 'Exchange',
  quantum_wallet_zigzag: 'ZIG ZAG',
  quantum_wallet_quest: 'Quest',
  quantum_wallet_blockchain: 'Blockchain',
  quantum_wallet_chain_l7: 'L7',
  quantum_wallet_meta_market: 'Meta Market',
  quantum_wallet_coming_soon: 'Coming soon',
  quantum_wallet_disabled_hint: 'Available soon',
  quantum_wallet_go_exchange: 'Open exchange',
  quantum_wallet_layer_home: 'Wallet home',
  quantum_wallet_layer_info: 'QCoin information',
  forum_qcoin_desc: 'Next-generation cryptocurrency with a proof-of-activity reward model.',
  forum_qcoin_withdraw_note: 'The L7 blockchain is under development. Withdrawals will be available after the blockchain launch.',
}

function splitParagraphs(value) {
  return String(value || '')
    .replace(/([.!?])\s+(?=[A-ZА-ЯЁ"“])/g, '$1\n\n')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function IconGlyph({ type }) {
  const common = {
    viewBox: '0 0 32 32',
    width: '100%',
    height: '100%',
    fill: 'none',
    'aria-hidden': 'true',
  }

  if (type === 'receive') {
    return (
      <svg {...common}>
        <path d="M16 6v15" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10 16l6 6 6-6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 26h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      </svg>
    )
  }

  if (type === 'send') {
    return (
      <svg {...common}>
        <path d="M16 26V11" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10 16l6-6 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      </svg>
    )
  }

  if (type === 'swap') {
    return (
      <svg {...common}>
        <path d="M8 11h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 7l4 4-4 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 21H10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 17l-4 4 4 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'exchange') {
    return (
      <svg {...common}>
        <path d="M10 22 22 10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M14 10h8v8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 24c5.5 1.6 12.5-.6 16-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      </svg>
    )
  }

  if (type === 'zigzag') {
    return (
      <svg {...common}>
        <path d="M9 12.2h14l-1.4 13.1a3 3 0 0 1-3 2.7h-5.2a3 3 0 0 1-3-2.7L9 12.2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M12.5 12.2V10a3.5 3.5 0 0 1 7 0v2.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="m14 17 4-1.2-2 3.4 3.8-1.1-5.1 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
        <path d="M7 8.4l2.2-2.2M23 7.7l2.4-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".48" />
      </svg>
    )
  }

  if (type === 'meta') {
    return (
      <svg {...common}>
        <path d="M7 14h18v12H7V14Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M5.5 9.5h21v5H5.5v-5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M16 9.5V26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 9.5c-4.4-.2-6.5-1.2-6.5-3.1 0-1.4 1.1-2.4 2.6-2.4 2 0 3.2 2 3.9 5.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M16 9.5c4.4-.2 6.5-1.2 6.5-3.1 0-1.4-1.1-2.4-2.6-2.4-2 0-3.2 2-3.9 5.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M10 20h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".36" />
      </svg>
    )
  }

  if (type === 'quest') {
    return (
      <svg {...common}>
        <path d="M16 6l3 6 6.6.9-4.8 4.7 1.1 6.6L16 21l-5.9 3.2 1.1-6.6-4.8-4.7L13 12l3-6Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'chain') {
    return (
      <svg {...common}>
        <path d="M12.4 18.7 9.8 21.3a5 5 0 1 1-7.1-7.1l3.4-3.4a5 5 0 0 1 7.4.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19.6 13.3 22.2 10.7a5 5 0 1 1 7.1 7.1l-3.4 3.4a5 5 0 0 1-7.4-.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M11.5 16h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M8 24 16 6l8 18-8-4-8 4Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M16 6v14" stroke="currentColor" strokeWidth="1.8" opacity=".55" />
    </svg>
  )
}

function QuantumTitle() {
  return (
    <svg className="qw-title-svg" viewBox="0 0 520 76" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="qwTitleGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4df7ff" />
          <stop offset="28%" stopColor="#7a5cff" />
          <stop offset="52%" stopColor="#f9d66b" />
          <stop offset="76%" stopColor="#60f7ce" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <filter id="qwTitleGlow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.25 0 0 0 0 0.95 0 0 0 0 1 0 0 0 .85 0" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="qwTitleSweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset=".5" stopColor="rgba(255,255,255,.95)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <text className="qw-title-back" x="260" y="48" textAnchor="middle">Quantum Wallet</text>
      <text className="qw-title-main" x="260" y="48" textAnchor="middle">Quantum Wallet</text>
      <rect className="qw-title-sweep" x="-160" y="18" width="130" height="38" rx="18" fill="url(#qwTitleSweep)" />
    </svg>
  )
}

function QuantumReactor() {
  const nodes = [
    [52, 26], [88, 51], [44, 79], [72, 106], [119, 92], [137, 39], [168, 69], [204, 34], [222, 97], [184, 124], [132, 139], [76, 144], [33, 121],
  ]

  return (
    <svg className="qw-reactor-svg" viewBox="0 0 256 178" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="qwReactorCore" cx="50%" cy="44%" r="58%">
          <stop offset="0%" stopColor="rgba(253,224,71,.9)" />
          <stop offset="24%" stopColor="rgba(45,212,191,.44)" />
          <stop offset="64%" stopColor="rgba(59,130,246,.12)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
        <linearGradient id="qwLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset=".45" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <ellipse className="qw-reactor-core" cx="128" cy="88" rx="118" ry="76" fill="url(#qwReactorCore)" />
      <g className="qw-reactor-grid" opacity=".35">
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={`h-${i}`} d={`M12 ${22 + i * 18} C72 ${8 + i * 12}, 178 ${44 + i * 5}, 244 ${24 + i * 17}`} stroke="url(#qwLine)" strokeWidth=".7" fill="none" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={`v-${i}`} d={`M${26 + i * 34} 10 C${56 + i * 16} 70, ${18 + i * 40} 105, ${52 + i * 26} 168`} stroke="url(#qwLine)" strokeWidth=".55" fill="none" />
        ))}
      </g>
      <g className="qw-reactor-links">
        {nodes.slice(0, -1).map(([x, y], i) => {
          const [nx, ny] = nodes[i + 1]
          return <path key={`l-${i}`} d={`M${x} ${y} L${nx} ${ny}`} stroke="url(#qwLine)" strokeWidth="1" opacity=".62" />
        })}
        <path d="M52 26 137 39 222 97 132 139 44 79 168 69" stroke="url(#qwLine)" strokeWidth="1" opacity=".36" fill="none" />
      </g>
      <g className="qw-reactor-nodes">
        {nodes.map(([x, y], i) => (
          <g key={`n-${i}`} className={`qw-node qw-node-${i % 5}`}>
            <circle cx={x} cy={y} r={i % 3 === 0 ? 3.4 : 2.5} fill={i % 4 === 0 ? '#facc15' : '#67e8f9'} />
            <circle cx={x} cy={y} r={i % 3 === 0 ? 7 : 5} fill="none" stroke={i % 4 === 0 ? '#facc15' : '#67e8f9'} strokeWidth=".8" opacity=".45" />
          </g>
        ))}
      </g>
      <ellipse className="qw-orbit qw-orbit-a" cx="128" cy="89" rx="88" ry="34" fill="none" stroke="#67e8f9" strokeWidth="1.2" opacity=".7" />
      <ellipse className="qw-orbit qw-orbit-b" cx="128" cy="89" rx="104" ry="42" fill="none" stroke="#facc15" strokeWidth="1" opacity=".54" transform="rotate(-27 128 89)" />
      <ellipse className="qw-orbit qw-orbit-c" cx="128" cy="89" rx="76" ry="88" fill="none" stroke="#a78bfa" strokeWidth=".9" opacity=".46" transform="rotate(16 128 89)" />
      <path className="qw-energy-beam" d="M39 129 C84 72, 168 142, 226 48" stroke="#fff7ad" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".78" />
    </svg>
  )
}

function MetaMarketMark({ label }) {
  const parts = String(label || 'Meta Market').split(/\s+/)
  const first = parts[0] || 'Meta'
  const second = parts.slice(1).join(' ') || 'Market'

  return (
    <svg className="qw-meta-mark" viewBox="0 0 170 54" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="qwMetaGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="42%" stopColor="#c084fc" />
          <stop offset="72%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <text className="qw-meta-word qw-meta-word-a" x="85" y="22" textAnchor="middle" textLength="118" lengthAdjust="spacingAndGlyphs">{first}</text>
      <text className="qw-meta-word qw-meta-word-b" x="85" y="42" textAnchor="middle" textLength="132" lengthAdjust="spacingAndGlyphs">{second}</text>
      <path className="qw-meta-comet" d="M18 44 C58 18, 114 64, 152 18" stroke="url(#qwMetaGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}


function ActionWordMark({ actionKey, label, sublabel, premium = false }) {
  const safeKey = String(actionKey || 'module').replace(/[^a-z0-9_-]/gi, '') || 'module'
  const main = String(label || '').trim() || 'Module'
  const sub = String(sublabel || '').trim()
  const hasSub = !!sub
  const mainTextLength = hasSub ? (main.length <= 3 ? 66 : 142) : 154
  const subTextLength = sub.length <= 4 ? 82 : 132
  const gradientId = `qwActionGradient-${safeKey}`

  return (
    <svg className={`qw-action-mark ${premium ? 'is-premium' : ''}`} viewBox="0 0 190 58" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="34%" stopColor="#c084fc" />
          <stop offset="64%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <text
        className="qw-action-word qw-action-word-main"
        x="95"
        y={hasSub ? 27 : 35}
        textAnchor="middle"
        stroke={`url(#${gradientId})`}
        textLength={mainTextLength}
        lengthAdjust="spacingAndGlyphs"
      >
        {main}
      </text>
      {hasSub && (
        <text
          className="qw-action-word qw-action-word-sub"
          x="95"
          y="46"
          textAnchor="middle"
          stroke={`url(#${gradientId})`}
          textLength={subTextLength}
          lengthAdjust="spacingAndGlyphs"
        >
          {sub}
        </text>
      )}
      <path className="qw-action-comet" d="M17 47 C60 18, 132 68, 173 19" stroke={`url(#${gradientId})`} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle className="qw-action-star qw-action-star-a" cx="32" cy="18" r="1.8" fill="#facc15" />
      <circle className="qw-action-star qw-action-star-b" cx="160" cy="42" r="1.6" fill="#67e8f9" />
    </svg>
  )
}

function QuantumParticleField() {
  const particles = [
    [7, 16, 0, 'gold'], [14, 73, 2, 'cyan'], [22, 42, 4, 'violet'], [29, 86, 1, 'cyan'], [36, 19, 3, 'gold'],
    [43, 63, 5, 'cyan'], [51, 31, 2, 'violet'], [58, 82, 4, 'gold'], [65, 13, 1, 'cyan'], [72, 54, 3, 'violet'],
    [79, 76, 5, 'cyan'], [86, 27, 2, 'gold'], [92, 66, 4, 'cyan'], [18, 24, 5, 'violet'], [48, 91, 1, 'gold'],
    [69, 39, 2, 'cyan'], [11, 52, 3, 'gold'], [90, 47, 5, 'violet'], [31, 57, 4, 'cyan'], [60, 70, 0, 'gold'],
  ]

  return (
    <div className="qw-particle-field" aria-hidden="true">
      <svg className="qw-field-lines" viewBox="0 0 620 760" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qwFieldLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(103,232,249,.08)" />
            <stop offset=".48" stopColor="rgba(250,204,21,.26)" />
            <stop offset="1" stopColor="rgba(192,132,252,.1)" />
          </linearGradient>
        </defs>
        <path className="qw-field-flow qw-field-flow-a" d="M-40 652 C114 410, 255 716, 682 332" stroke="url(#qwFieldLine)" strokeWidth="1.2" fill="none" />
        <path className="qw-field-flow qw-field-flow-b" d="M48 -28 C150 206, 470 90, 584 805" stroke="url(#qwFieldLine)" strokeWidth="1" fill="none" />
        <path className="qw-field-flow qw-field-flow-c" d="M-24 314 C176 220, 338 512, 652 178" stroke="url(#qwFieldLine)" strokeWidth=".85" fill="none" />
      </svg>
      {particles.map(([x, y, delay, tone], index) => (
        <span
          key={`qw-p-${index}`}
          className={`qw-field-particle is-${tone}`}
          style={{ '--x': `${x}%`, '--y': `${y}%`, '--d': `${delay * -0.65}s`, '--r': `${28 + (index % 5) * 10}px` }}
        />
      ))}
    </div>
  )
}

export default function QuantumWallet({ onClose, userKey = '', vipActive = false }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const initialPathRef = useRef(pathname)
  const shellRef = useRef(null)
  const closeRef = useRef(null)
  const lastFocusRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [stack, setStack] = useState(['home'])
  const [coinFailed, setCoinFailed] = useState(false)

  const qcoin = useQCoinLive(userKey, !!vipActive)
  const balanceText = useMemo(
    () => formatQCoinBalance(qcoin.balanceDisplay ?? qcoin.balance ?? 0),
    [qcoin.balanceDisplay, qcoin.balance],
  )

  const tx = useCallback((key, fallback) => {
    const value = typeof t === 'function' ? t(key) : ''
    if (!value || value === key) return fallback || FALLBACKS[key] || key
    return value
  }, [t])

  const closeWallet = useCallback(() => {
    setStack(['home'])
    onClose?.()
  }, [onClose])

  const openLayer = useCallback((layer) => {
    setStack((prev) => (prev[prev.length - 1] === layer ? prev : [...prev, layer]))
  }, [])

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)))
  }, [])

  const goExchange = useCallback(() => {
    closeWallet()
    try {
      if (pathname !== '/exchange') router.push('/exchange')
    } catch {
      try {
        if (typeof window !== 'undefined' && window.location.pathname !== '/exchange') {
          window.location.assign('/exchange')
        }
      } catch {}
    }
  }, [closeWallet, pathname, router])

  const openQuests = useCallback(() => {
    closeWallet()
    try {
      window.setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('quantum-wallet:quest-open', { detail: { entryId: 'quantum_wallet_quest' } }))
        } catch {}
      }, 0)
    } catch {}
  }, [closeWallet])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const id = window.setTimeout(() => {
      try {
        closeRef.current?.focus?.()
      } catch {}
    }, 0)

    return () => {
      window.clearTimeout(id)
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
      try {
        lastFocusRef.current?.focus?.()
      } catch {}
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeWallet()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [closeWallet])

  useEffect(() => {
    if (!initialPathRef.current) initialPathRef.current = pathname
    if (pathname && initialPathRef.current && pathname !== initialPathRef.current) {
      closeWallet()
    }
  }, [pathname, closeWallet])

  const activeLayer = stack[stack.length - 1] || 'home'
  const canGoBack = stack.length > 1

  const infoParagraphs = useMemo(() => [
    ...splitParagraphs(tx('forum_qcoin_desc', FALLBACKS.forum_qcoin_desc)),
    ...splitParagraphs(tx('forum_qcoin_withdraw_note', FALLBACKS.forum_qcoin_withdraw_note)),
  ], [tx])

  const actions = useMemo(() => [
    { key: 'receive', label: tx('quantum_wallet_receive'), icon: 'receive', active: false },
    { key: 'send', label: tx('quantum_wallet_send'), icon: 'send', active: false },
    { key: 'swap', label: tx('quantum_wallet_swap'), icon: 'swap', active: false },
    { key: 'exchange', label: tx('quantum_wallet_exchange'), icon: 'exchange', active: true, primary: true, onClick: goExchange },
    { key: 'zigzag', label: tx('quantum_wallet_zigzag'), icon: 'zigzag', active: false, locked: true },
    { key: 'quest', label: tx('quantum_wallet_quest'), icon: 'quest', active: true, quest: true, onClick: openQuests },
    { key: 'chain', label: tx('quantum_wallet_chain_l7'), sublabel: tx('quantum_wallet_blockchain'), icon: 'chain', active: false },
    { key: 'meta', label: tx('quantum_wallet_meta_market'), icon: 'meta', active: false, meta: true },
  ], [goExchange, openQuests, tx])

  if (!mounted) return null

  return createPortal(
    <div
      className="qw-overlay"
      role="presentation"
      style={{ '--qw-z': WALLET_Z_INDEX }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) closeWallet()
      }}
    >
      <div className="qw-backdrop-orbit qw-backdrop-orbit-a" aria-hidden="true" />
      <div className="qw-backdrop-orbit qw-backdrop-orbit-b" aria-hidden="true" />
      <section
        ref={shellRef}
        className={`qw-shell qw-layer-${activeLayer}`}
        role="dialog"
        aria-modal="true"
        aria-label={tx('quantum_wallet_title')}
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="qw-shell-chrome" aria-hidden="true" />
        <div className="qw-shell-grid" aria-hidden="true" />
        <QuantumParticleField />
        <div className="qw-shell-scan" aria-hidden="true" />

        <header className="qw-topbar">
          <button
            type="button"
            className={`qw-round qw-back ${canGoBack ? 'is-live' : 'is-muted'}`}
            aria-label={tx('quantum_wallet_back')}
            aria-disabled={!canGoBack}
            disabled={!canGoBack}
            onClick={goBack}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 6.5 9 12l5.5 5.5" />
              <path d="M9.8 12H20" />
            </svg>
          </button>

          <div className="qw-top-spacer" />

          <button
            type="button"
            className={`qw-round qw-info ${activeLayer === 'info' ? 'is-active' : ''}`}
            aria-label={tx('quantum_wallet_info')}
            onClick={() => openLayer('info')}
          >
            i
          </button>
          <button
            ref={closeRef}
            type="button"
            className="qw-round qw-close"
            aria-label={tx('quantum_wallet_close')}
            onClick={closeWallet}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          </button>
        </header>

        <div className="qw-content">
          {activeLayer === 'info' ? (
            <div className="qw-info-panel">
              <QuantumTitle />
              <div className="qw-info-card">
                <div className="qw-info-kicker">L7 / QCOIN / PROOF OF ACTIVITY</div>
                <h2>{tx('quantum_wallet_info_title')}</h2>
                <div className="qw-info-scroll">
                  {infoParagraphs.map((paragraph, index) => (
                    <article className="qw-info-piece" key={`${index}-${paragraph.slice(0, 12)}`}>
                      <span className="qw-info-index">{String(index + 1).padStart(2, '0')}</span>
                      <p>{paragraph}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="qw-home" aria-label={tx('quantum_wallet_layer_home')}>
              <QuantumTitle />

              <div className="qw-stage">
                <QuantumReactor />
                <div className="qw-coin-aura" aria-hidden="true" />
                <div className="qw-coin-ring qw-coin-ring-a" aria-hidden="true" />
                <div className="qw-coin-ring qw-coin-ring-b" aria-hidden="true" />
                <div className="qw-coin-wrap">
                  {coinFailed ? (
                    <div className="qw-coin-fallback" aria-hidden="true">Q</div>
                  ) : (
                    <Image
                      className="qw-coin"
                      src="/qcoin-32.png"
                      alt=""
                      width={256}
                      height={256}
                      sizes="(max-width: 640px) 148px, 210px"
                      onError={() => setCoinFailed(true)}
                    />
                  )}
                </div>
              </div>

              <div className="qw-balance" translate="no">
                <div className="qw-balance-label">{tx('quantum_wallet_balance_label')}</div>
                <div className={`qw-balance-value ${qcoin.paused ? 'is-paused' : 'is-live'}`} suppressHydrationWarning>
                  {balanceText}
                </div>
              </div>

              <div className="qw-actions" aria-label={tx('quantum_wallet_layer_home')}>
                {actions.map((action) => {
                  const disabled = !action.active
                  return (
                    <button
                      key={action.key}
                      type="button"
                      className={`qw-action qw-action-${action.key} ${action.active ? 'is-active' : 'is-disabled'} ${action.locked ? 'is-locked' : ''}`}
                      disabled={disabled}
                      aria-disabled={disabled}
                      title={action.quest ? tx('quantum_wallet_quest') : action.active ? tx('quantum_wallet_go_exchange') : tx('quantum_wallet_disabled_hint')}
                      onClick={action.active ? action.onClick : undefined}
                    >
                      <span className="qw-action-bg" aria-hidden="true" />
                      <span className="qw-action-icon" aria-hidden="true">
                        <IconGlyph type={action.icon} />
                      </span>
                      <span className="qw-action-mark-wrap" aria-hidden="true">
                        {action.meta ? (
                          <MetaMarketMark label={action.label} />
                        ) : (
                          <ActionWordMark actionKey={action.key} label={action.label} sublabel={action.sublabel} premium={action.primary || action.quest} />
                        )}
                      </span>
                      <span className="sr-only">{action.label}{action.sublabel ? ` ${action.sublabel}` : ''}</span>
                      {disabled && <span className="qw-action-soon">{tx('quantum_wallet_coming_soon')}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .qw-overlay {
          position: fixed;
          inset: 0;
          z-index: var(--qw-z);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 22%, rgba(56, 189, 248, .22), transparent 38%),
            radial-gradient(circle at 82% 15%, rgba(250, 204, 21, .18), transparent 34%),
            radial-gradient(circle at 55% 78%, rgba(124, 58, 237, .18), transparent 42%),
            rgba(1, 5, 16, .78);
          -webkit-backdrop-filter: blur(16px) saturate(1.18);
          backdrop-filter: blur(16px) saturate(1.18);
          isolation: isolate;
        }

        .qw-overlay::before,
        .qw-overlay::after {
          content: '';
          position: absolute;
          inset: -16%;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(103, 232, 249, .08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250, 204, 21, .055) 1px, transparent 1px);
          background-size: 72px 72px, 72px 72px;
          mask-image: radial-gradient(circle at center, #000 0 44%, transparent 78%);
          opacity: .65;
          transform: perspective(900px) rotateX(62deg) translateY(8%);
          animation: qwOverlayGrid 22s linear infinite;
        }

        .qw-overlay::after {
          inset: 0;
          background:
            radial-gradient(circle at 48% 41%, rgba(255,255,255,.1), transparent 2px),
            radial-gradient(circle at 26% 70%, rgba(103,232,249,.16), transparent 2px),
            radial-gradient(circle at 74% 62%, rgba(250,204,21,.18), transparent 2px),
            radial-gradient(circle at 18% 30%, rgba(192,132,252,.14), transparent 2px);
          background-size: 180px 160px, 220px 190px, 260px 210px, 310px 260px;
          opacity: .42;
          transform: none;
          animation: qwParticles 18s ease-in-out infinite alternate;
        }

        .qw-backdrop-orbit {
          position: absolute;
          pointer-events: none;
          border: 1px solid rgba(103, 232, 249, .2);
          border-radius: 999px;
          filter: drop-shadow(0 0 18px rgba(56, 189, 248, .28));
          opacity: .46;
          z-index: -1;
        }

        .qw-backdrop-orbit-a {
          width: min(74vw, 980px);
          height: min(40vw, 520px);
          transform: rotate(-11deg);
          animation: qwFloatA 17s ease-in-out infinite;
        }

        .qw-backdrop-orbit-b {
          width: min(60vw, 760px);
          height: min(54vw, 620px);
          border-color: rgba(250, 204, 21, .18);
          transform: rotate(34deg);
          animation: qwFloatB 21s ease-in-out infinite;
        }

        .qw-shell {
          --qw-shell-w: min(620px, calc(100vw - 32px));
          --qw-pad: clamp(14px, 2.2vw, 24px);
          --qw-radius: clamp(22px, 4vw, 34px);
          position: relative;
          width: var(--qw-shell-w);
          max-height: min(90dvh, 860px);
          color: #ecfeff;
          border-radius: var(--qw-radius);
          border: 1px solid rgba(103, 232, 249, .52);
          background:
            linear-gradient(135deg, rgba(8, 15, 35, .96), rgba(2, 6, 18, .985) 44%, rgba(10, 17, 42, .97)),
            radial-gradient(circle at 50% 0%, rgba(56,189,248,.18), transparent 42%);
          box-shadow:
            0 28px 90px rgba(0, 0, 0, .86),
            0 0 0 1px rgba(255, 255, 255, .05) inset,
            0 0 70px rgba(56, 189, 248, .20),
            0 0 110px rgba(250, 204, 21, .08);
          overflow: hidden;
          transform: translateZ(0);
          animation: qwShellIn .34s cubic-bezier(.2,.9,.2,1) both;
        }

        .qw-shell::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(from 210deg, rgba(103,232,249,.1), rgba(96,165,250,.72), rgba(192,132,252,.42), rgba(250,204,21,.78), rgba(45,212,191,.7), rgba(103,232,249,.1));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: .92;
          animation: qwBorderSpin 12s linear infinite;
        }

        .qw-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 18% 10%, rgba(103,232,249,.18), transparent 26%),
            radial-gradient(circle at 78% 3%, rgba(250,204,21,.18), transparent 26%),
            linear-gradient(180deg, rgba(255,255,255,.07), transparent 24%, rgba(0,0,0,.18));
          pointer-events: none;
        }

        .qw-shell-chrome,
        .qw-shell-grid,
        .qw-shell-scan {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .qw-shell-chrome {
          background:
            radial-gradient(circle at 50% -10%, rgba(103,232,249,.28), transparent 34%),
            radial-gradient(circle at 50% 64%, rgba(250,204,21,.09), transparent 40%),
            linear-gradient(90deg, transparent, rgba(255,255,255,.06) 50%, transparent);
          mix-blend-mode: screen;
          opacity: .86;
        }

        .qw-shell-grid {
          background-image:
            linear-gradient(rgba(103,232,249,.065) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,.055) 1px, transparent 1px);
          background-size: 38px 38px;
          opacity: .78;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.95), rgba(0,0,0,.42) 74%, transparent);
        }

        .qw-shell-scan {
          background: linear-gradient(180deg, transparent, rgba(103,232,249,.08), transparent);
          height: 34%;
          top: -34%;
          animation: qwScan 8s ease-in-out infinite;
          opacity: .38;
        }

        .qw-topbar {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: clamp(14px, 2.2vw, 20px) clamp(14px, 2.4vw, 22px) 0;
        }

        .qw-top-spacer { flex: 1; }

        .qw-round {
          width: clamp(34px, 5.2vw, 44px);
          height: clamp(34px, 5.2vw, 44px);
          border: 1px solid rgba(125, 211, 252, .34);
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #e0fbff;
          background:
            radial-gradient(circle at 32% 18%, rgba(255,255,255,.2), transparent 32%),
            linear-gradient(135deg, rgba(8, 22, 50, .88), rgba(2, 6, 18, .94));
          box-shadow:
            0 0 0 1px rgba(255,255,255,.055) inset,
            0 10px 24px rgba(0,0,0,.38),
            0 0 20px rgba(56,189,248,.12);
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, opacity .18s ease;
        }

        .qw-round svg {
          width: 58%;
          height: 58%;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .qw-round:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.035);
          border-color: rgba(250, 204, 21, .7);
          box-shadow: 0 0 0 1px rgba(250,204,21,.14) inset, 0 0 22px rgba(103,232,249,.28), 0 0 34px rgba(250,204,21,.14);
        }

        .qw-round:disabled {
          opacity: .42;
          cursor: default;
        }

        .qw-info {
          font-weight: 950;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(16px, 2.6vw, 22px);
          text-shadow: 0 0 10px rgba(103,232,249,.85);
        }

        .qw-info.is-active {
          border-color: rgba(250, 204, 21, .72);
          color: #fff7ad;
        }

        .qw-content {
          position: relative;
          z-index: 2;
          max-height: calc(min(90dvh, 860px) - 62px);
          padding: 0 var(--qw-pad) var(--qw-pad);
          overflow: hidden;
        }

        .qw-home,
        .qw-info-panel {
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .qw-title-svg {
          width: min(78%, 430px);
          height: auto;
          margin: clamp(-2px, .4vw, 2px) auto clamp(1px, .8vw, 8px);
          overflow: visible;
          filter: drop-shadow(0 0 16px rgba(103,232,249,.28));
        }

        .qw-title-back,
        .qw-title-main {
          font-family: ui-serif, Georgia, 'Times New Roman', serif;
          font-size: 38px;
          font-weight: 950;
          letter-spacing: .045em;
        }

        .qw-title-back {
          fill: transparent;
          stroke: rgba(15, 23, 42, .96);
          stroke-width: 8px;
        }

        .qw-title-main {
          fill: rgba(236, 254, 255, .18);
          stroke: url(#qwTitleGradient);
          stroke-width: 1.6px;
          filter: url(#qwTitleGlow);
          paint-order: stroke fill;
          stroke-dasharray: 780;
          stroke-dashoffset: 780;
          animation: qwTitleDraw 3.4s ease-in-out infinite alternate;
        }

        .qw-title-sweep {
          opacity: .38;
          filter: blur(.3px);
          transform: skewX(-18deg);
          animation: qwTitleSweep 3.8s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        .qw-stage {
          position: relative;
          width: min(74%, 360px);
          aspect-ratio: 1.22 / .88;
          min-height: clamp(168px, 32vw, 258px);
          margin: clamp(-6px, -1vw, -2px) auto clamp(2px, 1vw, 10px);
          display: grid;
          place-items: center;
          overflow: visible;
        }

        .qw-reactor-svg {
          position: absolute;
          inset: 1% -8% -4%;
          width: 116%;
          height: 104%;
          opacity: .95;
          filter: drop-shadow(0 0 22px rgba(45, 212, 191, .22));
        }

        .qw-reactor-grid,
        .qw-reactor-links {
          stroke-dasharray: 4 8;
          animation: qwDash 11s linear infinite;
        }

        .qw-reactor-core {
          animation: qwCorePulse 4.6s ease-in-out infinite;
        }

        .qw-node {
          filter: drop-shadow(0 0 5px currentColor);
          animation: qwNodePulse 3.4s ease-in-out infinite;
        }

        .qw-node-1 { animation-delay: -.4s; }
        .qw-node-2 { animation-delay: -.8s; }
        .qw-node-3 { animation-delay: -1.2s; }
        .qw-node-4 { animation-delay: -1.8s; }

        .qw-orbit-a { transform-origin: 128px 89px; animation: qwOrbitA 9s linear infinite; }
        .qw-orbit-b { transform-origin: 128px 89px; animation: qwOrbitB 12s linear infinite reverse; }
        .qw-orbit-c { transform-origin: 128px 89px; animation: qwOrbitC 15s linear infinite; }
        .qw-energy-beam { stroke-dasharray: 34 150; animation: qwBeam 3.2s ease-in-out infinite; }

        .qw-coin-aura {
          position: absolute;
          width: clamp(134px, 29vw, 230px);
          height: clamp(134px, 29vw, 230px);
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(254,240,138,.52), rgba(45,212,191,.22) 32%, rgba(59,130,246,.1) 58%, transparent 72%);
          filter: blur(14px);
          animation: qwAura 4.8s ease-in-out infinite;
        }

        .qw-coin-ring {
          position: absolute;
          width: clamp(142px, 31vw, 248px);
          height: clamp(142px, 31vw, 248px);
          border-radius: 999px;
          border: 1px solid rgba(103,232,249,.42);
          transform: rotateX(62deg) rotateZ(0deg);
          box-shadow: 0 0 24px rgba(103,232,249,.16);
        }

        .qw-coin-ring-a { animation: qwRingSpin 8s linear infinite; }
        .qw-coin-ring-b {
          width: clamp(170px, 36vw, 286px);
          height: clamp(104px, 22vw, 180px);
          border-color: rgba(250,204,21,.38);
          transform: rotateX(58deg) rotateZ(-28deg);
          animation: qwRingSpinB 12s linear infinite reverse;
        }

        .qw-coin-wrap {
          position: relative;
          width: clamp(132px, 30vw, 218px);
          height: clamp(132px, 30vw, 218px);
          display: grid;
          place-items: center;
          border-radius: 999px;
          filter: drop-shadow(0 18px 26px rgba(0,0,0,.45)) drop-shadow(0 0 22px rgba(250,204,21,.36));
          animation: qwCoinFloat 4.8s ease-in-out infinite;
        }

        .qw-coin {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
        }

        .qw-coin-fallback {
          width: 86%;
          height: 86%;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #3f2d00;
          font-size: clamp(58px, 13vw, 104px);
          font-weight: 1000;
          background: radial-gradient(circle at 35% 24%, #fff7ad, #facc15 42%, #8a5a05 100%);
          box-shadow: inset 0 0 0 8px rgba(70,40,0,.24), 0 0 32px rgba(250,204,21,.42);
        }

        .qw-balance {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(4px, .9vw, 8px);
          margin-top: clamp(-8px, -1vw, -2px);
          margin-bottom: clamp(12px, 2vw, 20px);
        }

        .qw-balance-label {
          font-size: clamp(26px, 5.2vw, 42px);
          line-height: 1;
          font-weight: 1000;
          letter-spacing: .035em;
          color: #fff7ad;
          text-shadow: 0 0 10px rgba(250,204,21,.85), 0 0 26px rgba(103,232,249,.28);
        }

        .qw-balance-value {
          min-width: min(72vw, 300px);
          border-radius: 999px;
          padding: clamp(6px, 1.4vw, 10px) clamp(16px, 3vw, 28px);
          text-align: center;
          color: #fff27a;
          font-size: clamp(22px, 4.5vw, 34px);
          font-weight: 1000;
          line-height: 1;
          letter-spacing: .035em;
          background:
            radial-gradient(circle at 50% 0, rgba(250,204,21,.18), transparent 54%),
            linear-gradient(180deg, rgba(3,12,28,.86), rgba(0,0,0,.64));
          border: 1px solid rgba(250,204,21,.54);
          box-shadow: 0 0 0 1px rgba(103,232,249,.16) inset, 0 0 22px rgba(250,204,21,.24), 0 0 34px rgba(103,232,249,.14);
          text-shadow: 0 0 10px rgba(250,204,21,.9), 0 0 20px rgba(250,204,21,.4);
        }

        .qw-balance-value.is-paused { opacity: .72; }

        .qw-actions {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: clamp(7px, 1.35vw, 12px);
          padding: clamp(10px, 1.8vw, 14px);
          border-radius: clamp(18px, 3vw, 26px);
          background:
            radial-gradient(circle at 50% 0%, rgba(56,189,248,.13), transparent 50%),
            linear-gradient(180deg, rgba(4, 13, 31, .72), rgba(0,0,0,.3));
          border: 1px solid rgba(103,232,249,.18);
          box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 18px 40px rgba(0,0,0,.22);
          overflow: hidden;
          direction: ltr;
        }

        .qw-action {
          position: relative;
          min-width: 0;
          min-height: clamp(58px, 10.2vw, 78px);
          border-radius: clamp(13px, 2.4vw, 20px);
          border: 1px solid rgba(103,232,249,.24);
          color: rgba(220, 252, 255, .86);
          background:
            radial-gradient(circle at 50% 0%, rgba(103,232,249,.11), transparent 55%),
            linear-gradient(150deg, rgba(13, 23, 48, .95), rgba(3, 7, 18, .94));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(2px, .45vw, 4px);
          padding: clamp(5px, 1vw, 8px) clamp(3px, .8vw, 8px);
          overflow: hidden;
          cursor: default;
          box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 12px 22px rgba(0,0,0,.24);
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, color .18s ease;
        }

        .qw-action::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 0 22%, rgba(255,255,255,.12) 36%, transparent 50% 100%);
          transform: translateX(-130%);
          opacity: .7;
          pointer-events: none;
        }

        .qw-action-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent, rgba(103,232,249,.08), transparent),
            radial-gradient(circle at 24% 20%, rgba(255,255,255,.12), transparent 26%);
          opacity: .55;
          pointer-events: none;
        }

        .qw-action-icon {
          position: relative;
          z-index: 1;
          width: clamp(17px, 3.4vw, 25px);
          height: clamp(17px, 3.4vw, 25px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #67e8f9;
          filter: drop-shadow(0 0 8px rgba(103,232,249,.42));
        }

        .qw-action-label,
        .qw-action-sub,
        .qw-action-soon {
          position: relative;
          z-index: 1;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          text-align: center;
        }

        .qw-action-label {
          font-size: clamp(9px, 1.85vw, 13px);
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1.05;
          text-shadow: 0 0 9px rgba(103,232,249,.36);
        }

        .qw-action-sub {
          margin-top: -1px;
          font-size: clamp(7px, 1.28vw, 10px);
          font-weight: 800;
          color: rgba(191, 219, 254, .66);
          line-height: 1;
        }

        .qw-action-soon {
          position: absolute;
          right: clamp(4px, .8vw, 8px);
          bottom: clamp(3px, .65vw, 6px);
          max-width: 72%;
          font-size: clamp(5.8px, 1.02vw, 8px);
          font-weight: 1000;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(226,232,240,.58);
        }

        .qw-action.is-active {
          cursor: pointer;
          color: #fff7ad;
          border-color: rgba(250, 204, 21, .66);
          background:
            radial-gradient(circle at 50% 0%, rgba(250,204,21,.24), transparent 55%),
            linear-gradient(150deg, rgba(52, 35, 7, .84), rgba(3, 9, 22, .96));
          box-shadow: 0 0 0 1px rgba(250,204,21,.18) inset, 0 0 22px rgba(250,204,21,.24), 0 0 36px rgba(103,232,249,.15), 0 13px 24px rgba(0,0,0,.28);
        }

        .qw-action.is-active::before {
          animation: qwButtonShine 2.7s ease-in-out infinite;
        }

        .qw-action.is-active .qw-action-icon {
          color: #fde68a;
          filter: drop-shadow(0 0 8px rgba(250,204,21,.7));
        }

        .qw-action.is-active:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 247, 173, .95);
          box-shadow: 0 0 0 1px rgba(250,204,21,.22) inset, 0 0 28px rgba(250,204,21,.36), 0 0 42px rgba(103,232,249,.24), 0 18px 32px rgba(0,0,0,.34);
        }

        .qw-action.is-disabled {
          opacity: .78;
        }

        .qw-action.is-locked {
          opacity: .62;
          background:
            repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 3px, transparent 3px 9px),
            linear-gradient(150deg, rgba(9, 14, 24, .98), rgba(0,0,0,.94));
          border-color: rgba(71, 85, 105, .65);
        }

        .qw-action-chain .qw-action-label {
          color: #9ff4ff;
          font-size: clamp(10px, 2.25vw, 15px);
        }

        .qw-action-meta {
          padding: clamp(3px, .8vw, 6px);
        }

        .qw-action-meta .qw-action-icon {
          width: 92%;
          height: 74%;
        }

        .qw-meta-mark {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 0 6px rgba(103,232,249,.28));
        }

        .qw-meta-word {
          font-family: ui-serif, Georgia, 'Times New Roman', serif;
          font-size: 18px;
          font-weight: 1000;
          letter-spacing: .05em;
          fill: rgba(236, 254, 255, .12);
          stroke: url(#qwMetaGradient);
          stroke-width: .9px;
          paint-order: stroke fill;
          stroke-dasharray: 180;
          stroke-dashoffset: 180;
        }

        .qw-meta-word-a { animation: qwMetaDraw 4.2s ease-in-out infinite; }
        .qw-meta-word-b { animation: qwMetaDraw 4.2s ease-in-out .58s infinite; }
        .qw-meta-comet { stroke-dasharray: 24 126; animation: qwMetaComet 3.8s ease-in-out infinite; opacity: .72; }

        .qw-info-panel {
          width: 100%;
          min-height: min(640px, calc(90dvh - 88px));
        }

        .qw-info-panel .qw-title-svg {
          width: min(80%, 420px);
          margin-bottom: clamp(10px, 2vw, 18px);
        }

        .qw-info-card {
          width: 100%;
          flex: 1;
          min-height: 0;
          border-radius: clamp(18px, 3vw, 26px);
          padding: clamp(14px, 2.4vw, 22px);
          background:
            radial-gradient(circle at 50% 0%, rgba(103,232,249,.14), transparent 46%),
            linear-gradient(180deg, rgba(8, 20, 45, .78), rgba(2, 6, 18, .82));
          border: 1px solid rgba(103,232,249,.24);
          box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 18px 42px rgba(0,0,0,.28);
          display: flex;
          flex-direction: column;
        }

        .qw-info-kicker {
          color: #facc15;
          font-size: clamp(9px, 1.7vw, 12px);
          letter-spacing: .18em;
          font-weight: 1000;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 8px;
        }

        .qw-info-card h2 {
          margin: 0 0 14px;
          text-align: center;
          color: #ecfeff;
          font-size: clamp(22px, 4.4vw, 34px);
          line-height: 1.05;
          letter-spacing: .025em;
          text-shadow: 0 0 16px rgba(103,232,249,.38);
        }

        .qw-info-scroll {
          min-height: 0;
          overflow-y: auto;
          padding-right: 6px;
          color: rgba(226, 232, 240, .94);
          font-size: clamp(13px, 2.35vw, 16px);
          line-height: 1.52;
          overscroll-behavior: contain;
        }

        .qw-info-scroll p {
          margin: 0 0 12px;
          padding: 12px 13px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(15, 23, 42, .52), rgba(2, 6, 18, .28));
          border: 1px solid rgba(148, 163, 184, .14);
        }

        .qw-info-scroll p:last-child { margin-bottom: 0; }

        @media (max-width: 640px) {
          .qw-overlay {
            align-items: flex-start;
            padding: max(56px, calc(env(safe-area-inset-top) + 18px)) 8px max(26px, env(safe-area-inset-bottom));
            overflow-y: auto;
          }

          .qw-shell {
            --qw-shell-w: min(94vw, 620px);
            max-height: min(82dvh, 760px);
            border-radius: 22px;
          }

          .qw-content {
            max-height: calc(min(82dvh, 760px) - 54px);
            overflow-y: auto;
            overscroll-behavior: contain;
          }

          .qw-topbar {
            padding: 12px 12px 0;
          }

          .qw-stage {
            width: min(82%, 330px);
            min-height: clamp(150px, 42vw, 210px);
          }

          .qw-title-svg {
            width: min(86%, 400px);
          }

          .qw-actions {
            gap: clamp(5px, 1.65vw, 9px);
            padding: clamp(7px, 2.2vw, 10px);
          }

          .qw-action {
            min-height: clamp(52px, 15vw, 68px);
          }

          .qw-action-soon {
            max-width: 64%;
          }
        }

        @media (max-width: 380px) {
          .qw-actions { gap: 5px; }
          .qw-action { min-height: 50px; border-radius: 12px; }
          .qw-action-label { letter-spacing: 0; }
          .qw-action-soon { display: none; }
          .qw-action-icon { width: 16px; height: 16px; }
          .qw-action-meta .qw-action-icon { width: 96%; height: 80%; }
          .qw-meta-word { font-size: 16px; letter-spacing: .025em; }
        }

        @media (prefers-reduced-motion: reduce) {
          .qw-overlay::before,
          .qw-overlay::after,
          .qw-backdrop-orbit,
          .qw-shell,
          .qw-shell::before,
          .qw-shell-scan,
          .qw-title-main,
          .qw-title-sweep,
          .qw-reactor-grid,
          .qw-reactor-links,
          .qw-reactor-core,
          .qw-node,
          .qw-orbit,
          .qw-energy-beam,
          .qw-coin-aura,
          .qw-coin-ring,
          .qw-coin-wrap,
          .qw-action.is-active::before,
          .qw-meta-word,
          .qw-meta-comet {
            animation: none !important;
          }
        }

        @keyframes qwShellIn {
          from { opacity: 0; transform: translateY(18px) scale(.965); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes qwBorderSpin { to { transform: rotate(360deg); } }
        @keyframes qwScan { 0%, 30% { transform: translateY(0); } 62%, 100% { transform: translateY(390%); } }
        @keyframes qwOverlayGrid { to { background-position: 72px 72px, -72px 72px; } }
        @keyframes qwParticles { to { background-position: 30px -18px, -42px 32px, 54px 20px, -38px -26px; opacity: .62; } }
        @keyframes qwFloatA { 0%,100% { transform: rotate(-11deg) scale(1); } 50% { transform: rotate(-6deg) scale(1.04); } }
        @keyframes qwFloatB { 0%,100% { transform: rotate(34deg) scale(1); } 50% { transform: rotate(28deg) scale(.98); } }
        @keyframes qwTitleDraw { to { stroke-dashoffset: 0; } }
        @keyframes qwTitleSweep { 0% { transform: translateX(0) skewX(-18deg); opacity: 0; } 20% { opacity: .38; } 80%,100% { transform: translateX(780px) skewX(-18deg); opacity: 0; } }
        @keyframes qwDash { to { stroke-dashoffset: -120; } }
        @keyframes qwCorePulse { 0%,100% { opacity: .54; transform: scale(.98); transform-origin: 128px 89px; } 50% { opacity: .92; transform: scale(1.035); transform-origin: 128px 89px; } }
        @keyframes qwNodePulse { 0%,100% { opacity: .55; transform: scale(.9); transform-origin: center; } 50% { opacity: 1; transform: scale(1.16); transform-origin: center; } }
        @keyframes qwOrbitA { to { transform: rotate(360deg); } }
        @keyframes qwOrbitB { to { transform: rotate(333deg); } }
        @keyframes qwOrbitC { to { transform: rotate(376deg); } }
        @keyframes qwBeam { 0% { stroke-dashoffset: 190; opacity: .18; } 45% { opacity: .88; } 100% { stroke-dashoffset: -110; opacity: .18; } }
        @keyframes qwAura { 0%,100% { transform: scale(.96); opacity: .68; } 50% { transform: scale(1.06); opacity: .96; } }
        @keyframes qwRingSpin { to { transform: rotateX(62deg) rotateZ(360deg); } }
        @keyframes qwRingSpinB { to { transform: rotateX(58deg) rotateZ(332deg); } }
        @keyframes qwCoinFloat { 0%,100% { transform: translateY(0) rotateZ(-.7deg); } 50% { transform: translateY(-7px) rotateZ(.7deg); } }
        @keyframes qwButtonShine { 0% { transform: translateX(-130%); } 48%,100% { transform: translateX(130%); } }
        @keyframes qwMetaDraw { 0% { stroke-dashoffset: 180; opacity: .2; } 32%,74% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: -180; opacity: .25; } }
        @keyframes qwMetaComet { 0% { stroke-dashoffset: 144; opacity: .12; } 50% { opacity: .78; } 100% { stroke-dashoffset: -144; opacity: .12; } }


        /* Quantum Wallet v4 premium calibration: fixed invite-like modal, one-scroll info body, full-surface particles. */
        .qw-overlay {
          align-items: flex-start !important;
          justify-content: center !important;
          overflow: hidden !important;
          padding: clamp(22px, 5dvh, 54px) max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)) !important;
        }

        .qw-shell {
          --qw-shell-w: min(620px, calc(100vw - 32px)) !important;
          width: var(--qw-shell-w) !important;
          max-width: 620px !important;
          max-height: min(88dvh, 860px) !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        .qw-shell-grid {
          background-size: 34px 34px;
          opacity: .5;
          mask-image: radial-gradient(circle at 50% 36%, rgba(0,0,0,.95), rgba(0,0,0,.55) 58%, transparent 92%);
        }

        .qw-particle-field {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
          border-radius: inherit;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.22), rgba(0,0,0,.95) 18%, rgba(0,0,0,.95) 94%, transparent);
        }

        .qw-field-lines {
          position: absolute;
          inset: -7% -6%;
          width: 112%;
          height: 114%;
          opacity: .86;
          filter: drop-shadow(0 0 18px rgba(103,232,249,.16));
        }

        .qw-field-flow {
          stroke-dasharray: 12 42;
          animation: qwFieldFlow 8.5s linear infinite;
        }
        .qw-field-flow-b { animation-duration: 11s; animation-direction: reverse; opacity: .75; }
        .qw-field-flow-c { animation-duration: 13s; opacity: .62; }

        .qw-field-particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: clamp(3px, .72vw, 6px);
          height: clamp(3px, .72vw, 6px);
          border-radius: 999px;
          transform: translate(-50%, -50%);
          background: #67e8f9;
          box-shadow: 0 0 10px currentColor, 0 0 28px currentColor;
          opacity: .64;
          animation: qwFieldParticle 8.6s ease-in-out infinite;
          animation-delay: var(--d);
        }
        .qw-field-particle::before {
          content: '';
          position: absolute;
          inset: calc(var(--r) * -.5);
          border: 1px solid currentColor;
          border-radius: 999px;
          opacity: .12;
          transform: scale(.65);
          animation: qwFieldParticleRing 5.8s ease-in-out infinite;
          animation-delay: var(--d);
        }
        .qw-field-particle.is-gold { color: #facc15; background: #facc15; }
        .qw-field-particle.is-cyan { color: #67e8f9; background: #67e8f9; }
        .qw-field-particle.is-violet { color: #c084fc; background: #c084fc; }

        .qw-topbar,
        .qw-content {
          position: relative;
          z-index: 4;
        }

        .qw-content {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: hidden !important;
          padding: clamp(2px, .5vw, 4px) var(--qw-pad) var(--qw-pad) !important;
        }

        .qw-home {
          min-height: 0;
          overflow: visible;
        }

        .qw-stage {
          width: min(74%, 340px) !important;
          min-height: clamp(158px, 26vw, 238px) !important;
          margin-top: clamp(-10px, -1.2vw, -3px) !important;
        }

        .qw-reactor-svg {
          inset: -6% -16% -10% !important;
          width: 132% !important;
          height: 118% !important;
          opacity: .82 !important;
          filter: drop-shadow(0 0 26px rgba(45,212,191,.28)) drop-shadow(0 0 36px rgba(250,204,21,.12)) !important;
        }

        .qw-reactor-grid {
          display: none !important;
        }

        .qw-reactor-links {
          opacity: .42;
        }

        .qw-coin-wrap {
          transform-style: preserve-3d;
          perspective: 900px;
          animation: qwCoinHoverAlive 5.2s ease-in-out infinite !important;
        }
        .qw-coin-wrap::before,
        .qw-coin-wrap::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }
        .qw-coin-wrap::before {
          inset: 7%;
          background: conic-gradient(from 120deg, transparent, rgba(255,255,255,.55), transparent 22%, rgba(250,204,21,.35), transparent 54%, rgba(103,232,249,.38), transparent 76%);
          mix-blend-mode: screen;
          filter: blur(5px);
          opacity: .54;
          animation: qwCoinHaloSpin 6.2s linear infinite;
        }
        .qw-coin-wrap::after {
          inset: 13%;
          background: linear-gradient(115deg, transparent 18%, rgba(255,255,255,.55) 42%, transparent 61%);
          transform: translateX(-80%) rotate(18deg);
          opacity: .44;
          animation: qwCoinGlint 3.9s ease-in-out infinite;
        }
        .qw-coin {
          position: relative;
          z-index: 2;
          animation: qwCoinFaceLive 5.2s ease-in-out infinite;
          filter: saturate(1.18) contrast(1.06) drop-shadow(0 0 13px rgba(255,240,138,.55));
        }

        .qw-balance {
          margin-bottom: clamp(10px, 1.7vw, 16px) !important;
        }
        .qw-balance-label {
          letter-spacing: .045em;
          background: linear-gradient(90deg, #fff7ad, #facc15, #67e8f9, #fff7ad);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          background-size: 240% 100%;
          animation: qwGoldTextFlow 4.8s linear infinite;
        }
        .qw-balance-value {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          min-width: min(74vw, 318px) !important;
          color: #fff8a6 !important;
          border-color: rgba(250,204,21,.82) !important;
          background:
            linear-gradient(90deg, rgba(250,204,21,.08), rgba(103,232,249,.13), rgba(250,204,21,.08)),
            radial-gradient(circle at 50% 0, rgba(255,247,173,.26), transparent 58%),
            linear-gradient(180deg, rgba(7,17,33,.94), rgba(0,0,0,.72)) !important;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.08) inset,
            0 0 0 2px rgba(250,204,21,.08),
            0 0 28px rgba(250,204,21,.45),
            0 0 52px rgba(103,232,249,.2) !important;
          animation: qwBalancePulse 3.2s ease-in-out infinite;
        }
        .qw-balance-value::before {
          content: '';
          position: absolute;
          inset: -40% -20%;
          z-index: -1;
          background: linear-gradient(110deg, transparent 22%, rgba(255,255,255,.34), transparent 58%);
          transform: translateX(-110%);
          animation: qwBalanceSweep 3.6s ease-in-out infinite;
        }
        .qw-balance-value::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: inherit;
          border: 1px dashed rgba(103,232,249,.22);
          opacity: .72;
          pointer-events: none;
        }

        .qw-actions {
          gap: clamp(8px, 1.35vw, 12px) !important;
          padding: clamp(10px, 1.8vw, 14px) !important;
          overflow: hidden !important;
        }
        .qw-action {
          min-height: clamp(66px, 10vw, 86px) !important;
          isolation: isolate;
          color: rgba(236,254,255,.9);
          border-color: rgba(103,232,249,.34) !important;
          background:
            radial-gradient(circle at 50% -18%, rgba(103,232,249,.22), transparent 52%),
            linear-gradient(145deg, rgba(9,20,43,.95), rgba(2,7,18,.98)) !important;
        }
        .qw-action::before {
          opacity: .78 !important;
          animation: qwButtonShine 3.6s ease-in-out infinite !important;
        }
        .qw-action::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: conic-gradient(from 180deg, rgba(103,232,249,.08), rgba(103,232,249,.56), rgba(192,132,252,.34), rgba(250,204,21,.58), rgba(45,212,191,.52), rgba(103,232,249,.08));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: .56;
          pointer-events: none;
          animation: qwActionBorderSpin 7s linear infinite;
        }
        .qw-action-bg::after {
          content: '';
          position: absolute;
          inset: 10% 14%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(103,232,249,.22), transparent 68%);
          filter: blur(13px);
          opacity: .68;
          animation: qwActionCoreBreath 3.8s ease-in-out infinite;
        }
        .qw-action-icon {
          position: absolute !important;
          z-index: 1;
          top: clamp(6px, 1.1vw, 10px);
          left: 50%;
          transform: translateX(-50%);
          width: clamp(16px, 2.7vw, 23px) !important;
          height: clamp(16px, 2.7vw, 23px) !important;
          opacity: .72;
        }
        .qw-action-meta .qw-action-icon {
          width: clamp(16px, 2.7vw, 23px) !important;
          height: clamp(16px, 2.7vw, 23px) !important;
        }
        .qw-action-mark-wrap {
          position: relative;
          z-index: 2;
          width: 100%;
          height: clamp(36px, 5.8vw, 48px);
          display: grid;
          place-items: center;
          margin-top: clamp(12px, 2vw, 16px);
          overflow: visible;
        }
        .qw-action-mark,
        .qw-meta-mark {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 0 8px rgba(103,232,249,.32));
        }
        .qw-action-word,
        .qw-meta-word {
          font-family: ui-serif, Georgia, 'Times New Roman', serif !important;
          font-weight: 1000 !important;
          letter-spacing: .055em;
          fill: rgba(236,254,255,.11) !important;
          stroke-width: 1px !important;
          paint-order: stroke fill;
          stroke-dasharray: 190;
          stroke-dashoffset: 190;
          animation: qwActionWordDraw 4.4s ease-in-out infinite !important;
        }
        .qw-action-word-main { font-size: 18px; }
        .qw-action-word-sub { font-size: 10px; letter-spacing: .075em; animation-delay: .42s !important; }
        .qw-action-comet,
        .qw-meta-comet {
          stroke-dasharray: 24 136 !important;
          animation: qwActionComet 3.8s ease-in-out infinite !important;
          opacity: .76;
        }
        .qw-action-star {
          opacity: .82;
          filter: drop-shadow(0 0 7px currentColor);
          animation: qwActionStar 2.8s ease-in-out infinite;
        }
        .qw-action-star-b { animation-delay: -1.2s; }
        .qw-action-soon {
          z-index: 3;
          opacity: .78;
        }
        .qw-action.is-disabled {
          opacity: .88 !important;
        }
        .qw-action.is-active {
          cursor: pointer !important;
          opacity: 1 !important;
        }
        .qw-action-exchange.is-active {
          color: #fff7ad !important;
          border-color: rgba(250,204,21,.9) !important;
          background:
            radial-gradient(circle at 50% -10%, rgba(250,204,21,.36), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(103,232,249,.18), transparent 60%),
            linear-gradient(145deg, rgba(58,39,6,.92), rgba(3,8,20,.98)) !important;
          box-shadow: 0 0 0 1px rgba(250,204,21,.24) inset, 0 0 30px rgba(250,204,21,.34), 0 0 52px rgba(103,232,249,.22), 0 18px 30px rgba(0,0,0,.34) !important;
        }
        .qw-action-quest.is-active {
          color: #dffcff !important;
          border-color: rgba(103,232,249,.78) !important;
          background:
            radial-gradient(circle at 50% -10%, rgba(103,232,249,.28), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(192,132,252,.2), transparent 60%),
            linear-gradient(145deg, rgba(12,34,50,.94), rgba(3,8,20,.98)) !important;
          box-shadow: 0 0 0 1px rgba(103,232,249,.2) inset, 0 0 28px rgba(103,232,249,.28), 0 0 46px rgba(192,132,252,.18), 0 18px 30px rgba(0,0,0,.34) !important;
        }
        .qw-action:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01) !important;
        }
        .qw-action.is-locked {
          opacity: .68 !important;
        }
        .qw-action .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        .qw-info-panel {
          width: 100%;
          height: calc(min(88dvh, 860px) - 64px) !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        .qw-info-panel .qw-title-svg {
          flex: 0 0 auto;
          margin-bottom: clamp(8px, 1.5vw, 14px) !important;
        }
        .qw-info-card {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
          position: relative;
          border-color: rgba(103,232,249,.34) !important;
          background:
            radial-gradient(circle at 50% 0%, rgba(103,232,249,.18), transparent 44%),
            radial-gradient(circle at 12% 18%, rgba(250,204,21,.1), transparent 24%),
            linear-gradient(180deg, rgba(8,20,45,.84), rgba(2,6,18,.9)) !important;
        }
        .qw-info-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(103,232,249,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,.04) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: .54;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.8), transparent 92%);
        }
        .qw-info-kicker,
        .qw-info-card h2,
        .qw-info-scroll {
          position: relative;
          z-index: 1;
        }
        .qw-info-scroll {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 3px 8px 3px 1px !important;
          scrollbar-width: thin;
          scrollbar-color: rgba(103,232,249,.52) rgba(15,23,42,.36);
        }
        .qw-info-scroll::-webkit-scrollbar { width: 7px; }
        .qw-info-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,.36); border-radius: 999px; }
        .qw-info-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(103,232,249,.75), rgba(250,204,21,.62)); border-radius: 999px; }
        .qw-info-piece {
          position: relative;
          display: grid;
          grid-template-columns: clamp(30px, 5vw, 42px) 1fr;
          gap: clamp(8px, 1.6vw, 12px);
          align-items: start;
          margin: 0 0 10px;
          padding: clamp(10px, 1.7vw, 14px);
          border-radius: clamp(14px, 2.4vw, 18px);
          background:
            linear-gradient(135deg, rgba(103,232,249,.08), transparent 34%),
            linear-gradient(180deg, rgba(15,23,42,.64), rgba(2,6,18,.42));
          border: 1px solid rgba(148,163,184,.16);
          box-shadow: 0 0 0 1px rgba(255,255,255,.028) inset, 0 12px 24px rgba(0,0,0,.22);
          overflow: hidden;
        }
        .qw-info-piece::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 0 24%, rgba(255,255,255,.055) 40%, transparent 56% 100%);
          transform: translateX(-120%);
          animation: qwInfoPieceSweep 6s ease-in-out infinite;
          pointer-events: none;
        }
        .qw-info-index {
          width: clamp(28px, 4.8vw, 38px);
          height: clamp(28px, 4.8vw, 38px);
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #fff7ad;
          font-size: clamp(10px, 1.7vw, 13px);
          font-weight: 1000;
          background: radial-gradient(circle at 30% 20%, rgba(250,204,21,.34), rgba(15,23,42,.86));
          border: 1px solid rgba(250,204,21,.28);
          box-shadow: 0 0 16px rgba(250,204,21,.12);
        }
        .qw-info-piece p {
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          color: rgba(236,254,255,.93);
          line-height: 1.5;
        }

@media (max-width: 640px) {
  .qw-overlay {
    --qw-mobile-top-offset: 115px;

    align-items: flex-start !important;
    overflow: hidden !important;
    padding:
      max(var(--qw-mobile-top-offset), calc(env(safe-area-inset-top) + var(--qw-mobile-top-offset)))
      8px
      max(14px, env(safe-area-inset-bottom))
      !important;
  }
}
          .qw-shell {
            --qw-shell-w: min(94vw, 620px) !important;
            max-width: 620px !important;
            max-height: min(80dvh, 720px) !important;
          }
          .qw-content {
            max-height: none !important;
            overflow: hidden !important;
            padding-left: clamp(10px, 3vw, 14px) !important;
            padding-right: clamp(10px, 3vw, 14px) !important;
          }
          .qw-stage {
            width: min(78%, 300px) !important;
            min-height: clamp(136px, 36vw, 188px) !important;
          }
          .qw-coin-wrap {
            width: clamp(124px, 35vw, 166px) !important;
            height: clamp(124px, 35vw, 166px) !important;
          }
          .qw-balance-label { font-size: clamp(23px, 7vw, 32px) !important; }
          .qw-balance-value { font-size: clamp(20px, 6vw, 28px) !important; }
          .qw-actions { gap: clamp(5px, 1.6vw, 8px) !important; }
          .qw-action { min-height: clamp(56px, 14vw, 66px) !important; border-radius: clamp(12px, 3.2vw, 16px) !important; }
          .qw-action-mark-wrap { height: clamp(32px, 8vw, 40px); margin-top: 12px; }
          .qw-action-word-main, .qw-meta-word { font-size: 16px !important; letter-spacing: .025em; }
          .qw-action-word-sub { font-size: 8.6px !important; }
          .qw-info-panel { height: calc(min(80dvh, 720px) - 54px) !important; }
          .qw-info-piece { grid-template-columns: 32px 1fr; }
        }

        @media (max-width: 380px) {
          .qw-action { min-height: 52px !important; }
          .qw-action-word-main, .qw-meta-word { font-size: 14px !important; }
          .qw-action-word-sub { font-size: 7.8px !important; }
          .qw-action-soon { display: none !important; }
          .qw-info-piece { grid-template-columns: 1fr; }
          .qw-info-index { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .qw-particle-field,
          .qw-field-flow,
          .qw-field-particle,
          .qw-field-particle::before,
          .qw-coin-wrap::before,
          .qw-coin-wrap::after,
          .qw-coin,
          .qw-balance-label,
          .qw-balance-value,
          .qw-balance-value::before,
          .qw-action::after,
          .qw-action-bg::after,
          .qw-action-word,
          .qw-action-comet,
          .qw-action-star,
          .qw-info-piece::after {
            animation: none !important;
          }
        }

        @keyframes qwFieldFlow { to { stroke-dashoffset: -220; } }
        @keyframes qwFieldParticle {
          0%,100% { transform: translate(-50%, -50%) rotate(0deg) translateX(0) scale(.88); opacity: .36; }
          42% { transform: translate(-50%, -50%) rotate(180deg) translateX(10px) scale(1.18); opacity: .95; }
          68% { transform: translate(-50%, -50%) rotate(270deg) translateX(-8px) scale(.98); opacity: .58; }
        }
        @keyframes qwFieldParticleRing {
          0%,100% { transform: scale(.62); opacity: .08; }
          50% { transform: scale(1.08); opacity: .2; }
        }
        @keyframes qwCoinHoverAlive {
          0%,100% { transform: translateY(0) rotateZ(-.8deg) rotateY(-5deg) scale(1); }
          45% { transform: translateY(-8px) rotateZ(.8deg) rotateY(6deg) scale(1.025); }
          70% { transform: translateY(-3px) rotateZ(-.2deg) rotateY(-2deg) scale(1.01); }
        }
        @keyframes qwCoinHaloSpin { to { transform: rotate(360deg); } }
        @keyframes qwCoinGlint {
          0%, 16% { transform: translateX(-92%) rotate(18deg); opacity: 0; }
          38% { opacity: .5; }
          58%,100% { transform: translateX(92%) rotate(18deg); opacity: 0; }
        }
        @keyframes qwCoinFaceLive {
          0%,100% { filter: saturate(1.16) contrast(1.05) drop-shadow(0 0 12px rgba(255,240,138,.5)); }
          50% { filter: saturate(1.32) contrast(1.1) drop-shadow(0 0 22px rgba(255,240,138,.72)); }
        }
        @keyframes qwGoldTextFlow { to { background-position: 240% 0; } }
        @keyframes qwBalancePulse {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1px) scale(1.018); }
        }
        @keyframes qwBalanceSweep {
          0%, 26% { transform: translateX(-115%); }
          55%,100% { transform: translateX(115%); }
        }
        @keyframes qwActionBorderSpin { to { transform: rotate(360deg); } }
        @keyframes qwActionCoreBreath { 0%,100% { opacity: .36; transform: scale(.9); } 50% { opacity: .9; transform: scale(1.08); } }
        @keyframes qwActionWordDraw {
          0% { stroke-dashoffset: 190; opacity: .18; }
          30%, 72% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -190; opacity: .28; }
        }
        @keyframes qwActionComet {
          0% { stroke-dashoffset: 152; opacity: .1; }
          48% { opacity: .85; }
          100% { stroke-dashoffset: -152; opacity: .1; }
        }
        @keyframes qwActionStar { 0%,100% { opacity: .2; transform: scale(.75); } 50% { opacity: 1; transform: scale(1.35); } }
        @keyframes qwInfoPieceSweep { 0%, 64% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

        /* Quantum Wallet v6: taller home shell, bigger premium button typography, shop/gift module icons. */
        .qw-shell.qw-layer-home {
          height: min(78dvh, 760px) !important;
          min-height: min(78dvh, 760px) !important;
        }

        .qw-shell.qw-layer-home .qw-content,
        .qw-shell.qw-layer-home .qw-home {
          height: 100% !important;
        }

        .qw-shell.qw-layer-home .qw-home {
          justify-content: flex-start !important;
        }

        .qw-shell.qw-layer-home .qw-actions {
          margin-top: clamp(10px, 1.8vw, 16px) !important;
        }

        .qw-action {
          min-height: clamp(76px, 11.2vw, 98px) !important;
        }

        .qw-action-icon {
          top: clamp(7px, 1vw, 10px) !important;
          width: clamp(18px, 2.6vw, 24px) !important;
          height: clamp(18px, 2.6vw, 24px) !important;
          opacity: .78 !important;
        }

        .qw-action-mark-wrap {
          width: 112% !important;
          height: clamp(50px, 7vw, 62px) !important;
          margin-top: clamp(14px, 2vw, 18px) !important;
          overflow: hidden !important;
        }

        .qw-action-mark,
        .qw-meta-mark {
          width: 112% !important;
          height: 112% !important;
          overflow: hidden !important;
        }

        .qw-action-word,
        .qw-meta-word {
          stroke-width: 1.25px !important;
          letter-spacing: .02em !important;
        }

        .qw-action-word-main {
          font-size: 30px !important;
        }

        .qw-action-word-sub {
          font-size: 13px !important;
          letter-spacing: .045em !important;
        }

        .qw-meta-word {
          font-size: 25px !important;
          stroke-width: 1.15px !important;
        }

        .qw-action-comet,
        .qw-meta-comet {
          stroke-width: 2.4px !important;
        }

        .qw-action-zigzag .qw-action-icon,
        .qw-action-meta .qw-action-icon {
          color: #fde68a !important;
          filter: drop-shadow(0 0 10px rgba(250,204,21,.58)) drop-shadow(0 0 18px rgba(103,232,249,.22)) !important;
        }

        .qw-action-zigzag .qw-action-bg::after {
          background: radial-gradient(circle, rgba(250,204,21,.22), transparent 68%) !important;
        }

        .qw-action-meta .qw-action-bg::after {
          background: radial-gradient(circle, rgba(192,132,252,.24), transparent 68%) !important;
        }

        @media (max-width: 640px) {
          .qw-shell.qw-layer-home {
            height: min(720px, calc(100dvh - var(--qw-mobile-top-offset, 56px) - 20px)) !important;
            min-height: min(720px, calc(100dvh - var(--qw-mobile-top-offset, 56px) - 20px)) !important;
          }

          .qw-action {
            min-height: clamp(66px, 17vw, 78px) !important;
          }

          .qw-action-icon,
          .qw-action-meta .qw-action-icon {
            width: clamp(17px, 4vw, 22px) !important;
            height: clamp(17px, 4vw, 22px) !important;
          }

          .qw-action-mark-wrap {
            width: 116% !important;
            height: clamp(44px, 11vw, 54px) !important;
            margin-top: clamp(12px, 3vw, 16px) !important;
          }

          .qw-action-mark,
          .qw-meta-mark {
            width: 116% !important;
            height: 116% !important;
          }

          .qw-action-word-main,
          .qw-meta-word {
            font-size: 28px !important;
            letter-spacing: .01em !important;
          }

          .qw-action-word-sub {
            font-size: 11.2px !important;
          }

          .qw-action-soon {
            font-size: clamp(5px, 1.35vw, 7px) !important;
            right: 4px !important;
            bottom: 3px !important;
          }
        }

        @media (max-width: 380px) {
          .qw-action {
            min-height: clamp(60px, 16vw, 70px) !important;
          }

          .qw-action-mark-wrap {
            height: clamp(38px, 10vw, 48px) !important;
          }

          .qw-action-word-main,
          .qw-meta-word {
            font-size: 25px !important;
          }

          .qw-action-word-sub {
            font-size: 10px !important;
          }
        }

      `}</style>
    </div>,
    document.body,
  )
}
