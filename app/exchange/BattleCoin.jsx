// app/exchange/BattleCoin.jsx
'use client'

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import Image from 'next/image' 
import { useI18n } from '../../components/i18n'
import { QuantumWalletLaunchButton } from '../../components/QuantumWalletLaunchIcon'
import BattleChat from './battle-chat/BattleChat'

// ----------------- i18n helper -----------------
function tf(t, key, fallback) {
  const v = t(key)
  // если перевода нет и вернулся сам ключ – используем fallback
  if (!v || v === key) return fallback
  return v
}


// ----------------- auth helpers (как в AuthNavClient) -----------------
function readCookie(name) {
  try {
    const m = document.cookie.match(
      new RegExp(
        '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
      )
    )
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

function readAccountId() {
  try {
    if (typeof window === 'undefined') return null
    if (window.__AUTH_ACCOUNT__) return String(window.__AUTH_ACCOUNT__)
    const a1 = localStorage.getItem('asherId')
    const a2 = localStorage.getItem('ql7_uid')
    const a3 =
      localStorage.getItem('ql7_account') ||
      localStorage.getItem('account') ||
      localStorage.getItem('wallet')
    const c1 = readCookie('asherId')
    return (a1 || a2 || a3 || c1) ? String(a1 || a2 || a3 || c1) : null
  } catch {
    return null
  }
}

function waitForAuth(timeoutMs = 15000) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') return resolve(null)
      const existing = readAccountId()
      if (existing) return resolve(existing)

      let done = false
      const timer = setTimeout(() => {
        if (done) return
        done = true
        cleanup()
        resolve(readAccountId())
      }, timeoutMs)

      const onAuthOk = (ev) => {
        if (done) return
        done = true
        cleanup()
        try {
          const acc =
            (ev && ev.detail && ev.detail.accountId) || readAccountId() || null
          resolve(acc)
        } catch {
          resolve(readAccountId())
        }
      }

      const onLogout = () => {
        if (done) return
        done = true
        cleanup()
        resolve(null)
      }

      const cleanup = () => {
        try {
          clearTimeout(timer)
        } catch {}
        try {
          window.removeEventListener('auth:ok', onAuthOk)
        } catch {}
        try {
          window.removeEventListener('auth:logout', onLogout)
        } catch {}
      }

      window.addEventListener('auth:ok', onAuthOk)
      window.addEventListener('auth:logout', onLogout)

      try {
        window.dispatchEvent(new Event('open-auth'))
      } catch {}
    } catch {
      resolve(readAccountId())
    }
  })
}

async function ensureAuthorized() {
  const acc0 = readAccountId()
  if (acc0) return acc0
  const acc = await waitForAuth(20000)
  if (acc) {
    try {
      window.__AUTH_ACCOUNT__ = acc
    } catch {}
  }
  return acc
}

function showToast(message, kind = 'info') {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { kind, message } })
      )
    }
  } catch {}
}


// --- VIP helpers (как на Subscribe/Academy) ---
async function fetchVipStatusForAccount(accountId) {
  if (!accountId) return false
  try {
    const res = await fetch('/api/subscription/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    const j = await res.json().catch(() => null)
    if (!j || !j.ok) return false
    return !!j.isVip
  } catch {
    return false
  }
}

async function createVipInvoice(accountId) {
  const res = await fetch('/api/pay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // если у тебя в Subscribe/Academy есть ещё поле (plan/kind/sku),
    // просто добавь его сюда один в один
    body: JSON.stringify({ accountId }),
  })
  const j = await res.json().catch(() => null)
  if (!j || !j.ok || !j.url) {
    throw new Error(j?.error || 'vip_invoice_failed')
  }
  return j.url
}

function openPaymentWindow(url) {
  try {
    if (!url) return
    // можно через window.open, но на проде вы чаще юзаете прямой redirect
    window.location.href = url
  } catch {
    // запасной вариант
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {}
  }
}

// ----------------- utils -----------------
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100]

function formatNumber(x, decimals = 2) {
  const n = Number(x)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}


const BATTLE_COIN_METAL_THEMES = [
  {
    name: 'aurum',
    rimStart: '#fff5b5',
    rimMid: '#e0a21b',
    rimEnd: '#6f3a00',
    faceStart: '#ffe889',
    faceMid: '#bd7400',
    faceEnd: '#4c2400',
    accent: '#fffbd0',
    glow: 'rgba(255, 190, 42, 0.34)',
    plaque: '#3f2105',
    text: '#fffef0',
    textStroke: '#3d2100',
  },
  {
    name: 'platinum',
    rimStart: '#ffffff',
    rimMid: '#aeb9c8',
    rimEnd: '#4b5668',
    faceStart: '#f7fbff',
    faceMid: '#8c99aa',
    faceEnd: '#303a48',
    accent: '#dff8ff',
    glow: 'rgba(178, 224, 255, 0.30)',
    plaque: '#202936',
    text: '#ffffff',
    textStroke: '#202833',
  },
  {
    name: 'copper',
    rimStart: '#ffd0aa',
    rimMid: '#c66a30',
    rimEnd: '#5b1f0f',
    faceStart: '#ffbb81',
    faceMid: '#a74a20',
    faceEnd: '#48170c',
    accent: '#ffe1c1',
    glow: 'rgba(255, 120, 55, 0.32)',
    plaque: '#3a170d',
    text: '#fff6ec',
    textStroke: '#44180d',
  },
  {
    name: 'bronze',
    rimStart: '#ffe2a2',
    rimMid: '#a96b28',
    rimEnd: '#4c2a11',
    faceStart: '#efbd67',
    faceMid: '#85501f',
    faceEnd: '#35200e',
    accent: '#fff0b9',
    glow: 'rgba(225, 145, 60, 0.30)',
    plaque: '#33200f',
    text: '#fff8e4',
    textStroke: '#36200d',
  },
  {
    name: 'rose',
    rimStart: '#ffe5e9',
    rimMid: '#d68a99',
    rimEnd: '#6d3242',
    faceStart: '#ffd2da',
    faceMid: '#ad6073',
    faceEnd: '#4b2030',
    accent: '#fff1f4',
    glow: 'rgba(255, 130, 165, 0.30)',
    plaque: '#40202b',
    text: '#fff8fa',
    textStroke: '#482230',
  },
  {
    name: 'cobalt',
    rimStart: '#d7edff',
    rimMid: '#3f8ee9',
    rimEnd: '#112b65',
    faceStart: '#90c8ff',
    faceMid: '#2360ba',
    faceEnd: '#0c1f4b',
    accent: '#d9f7ff',
    glow: 'rgba(55, 142, 255, 0.34)',
    plaque: '#0d2249',
    text: '#f5fbff',
    textStroke: '#10254f',
  },
  {
    name: 'ice',
    rimStart: '#e7ffff',
    rimMid: '#63d8ed',
    rimEnd: '#155269',
    faceStart: '#c7fbff',
    faceMid: '#3aa8bd',
    faceEnd: '#103d51',
    accent: '#efffff',
    glow: 'rgba(74, 226, 255, 0.32)',
    plaque: '#103946',
    text: '#f7ffff',
    textStroke: '#0e3a48',
  },
  {
    name: 'emerald',
    rimStart: '#e6ffd8',
    rimMid: '#45c46a',
    rimEnd: '#125128',
    faceStart: '#c2f7a9',
    faceMid: '#27944d',
    faceEnd: '#103b20',
    accent: '#eeffdc',
    glow: 'rgba(58, 230, 122, 0.30)',
    plaque: '#103920',
    text: '#f5ffef',
    textStroke: '#123d22',
  },
  {
    name: 'amethyst',
    rimStart: '#f2e2ff',
    rimMid: '#9e67df',
    rimEnd: '#3e1b69',
    faceStart: '#d7b2ff',
    faceMid: '#7440b7',
    faceEnd: '#2b124d',
    accent: '#f7e8ff',
    glow: 'rgba(174, 95, 255, 0.32)',
    plaque: '#2b1648',
    text: '#fff8ff',
    textStroke: '#321653',
  },
  {
    name: 'crimson',
    rimStart: '#ffe3df',
    rimMid: '#e65353',
    rimEnd: '#6a151b',
    faceStart: '#ffb1a5',
    faceMid: '#b6323b',
    faceEnd: '#4d1017',
    accent: '#fff0e8',
    glow: 'rgba(255, 72, 82, 0.32)',
    plaque: '#421419',
    text: '#fff8f5',
    textStroke: '#481117',
  },
  {
    name: 'obsidian',
    rimStart: '#a8b8d1',
    rimMid: '#36455a',
    rimEnd: '#080c13',
    faceStart: '#5b6d84',
    faceMid: '#1e2835',
    faceEnd: '#05070b',
    accent: '#d8e7ff',
    glow: 'rgba(111, 148, 205, 0.26)',
    plaque: '#090d14',
    text: '#f2f7ff',
    textStroke: '#070a10',
  },
  {
    name: 'pearl',
    rimStart: '#ffffff',
    rimMid: '#d9cfe5',
    rimEnd: '#7b6f8b',
    faceStart: '#fffaff',
    faceMid: '#bfb4ce',
    faceEnd: '#655b73',
    accent: '#ffffff',
    glow: 'rgba(237, 216, 255, 0.28)',
    plaque: '#51495c',
    text: '#ffffff',
    textStroke: '#4e4659',
  },
  {
    name: 'titanium',
    rimStart: '#eef5f7',
    rimMid: '#78959b',
    rimEnd: '#2e4146',
    faceStart: '#d6e7e9',
    faceMid: '#607c82',
    faceEnd: '#27383d',
    accent: '#edffff',
    glow: 'rgba(143, 210, 219, 0.26)',
    plaque: '#26393d',
    text: '#f8ffff',
    textStroke: '#273a3f',
  },
  {
    name: 'amber',
    rimStart: '#fff0b8',
    rimMid: '#ef9f16',
    rimEnd: '#743900',
    faceStart: '#ffd76d',
    faceMid: '#c47500',
    faceEnd: '#542700',
    accent: '#fff7c9',
    glow: 'rgba(255, 157, 24, 0.32)',
    plaque: '#472400',
    text: '#fffbed',
    textStroke: '#4e2600',
  },
  {
    name: 'teal',
    rimStart: '#d9fff8',
    rimMid: '#34c6ad',
    rimEnd: '#0d554b',
    faceStart: '#a8f4e6',
    faceMid: '#228f7e',
    faceEnd: '#0b3d37',
    accent: '#e9fff9',
    glow: 'rgba(45, 225, 193, 0.30)',
    plaque: '#0d3934',
    text: '#f3fffc',
    textStroke: '#0b3d37',
  },
  {
    name: 'solar',
    rimStart: '#fff7ce',
    rimMid: '#f4d443',
    rimEnd: '#7c6500',
    faceStart: '#fff59c',
    faceMid: '#cbb224',
    faceEnd: '#5c4c00',
    accent: '#ffffff',
    glow: 'rgba(255, 231, 74, 0.34)',
    plaque: '#4d4205',
    text: '#fffef2',
    textStroke: '#4c4000',
  },
  {
    name: 'electrum',
    rimStart: '#fffbdc',
    rimMid: '#c9b763',
    rimEnd: '#62552a',
    faceStart: '#f7efb9',
    faceMid: '#a99a4c',
    faceEnd: '#453b1d',
    accent: '#fffde8',
    glow: 'rgba(238, 224, 137, 0.28)',
    plaque: '#3d351b',
    text: '#fffef3',
    textStroke: '#3f371d',
  },
  {
    name: 'champagne',
    rimStart: '#fff8e8',
    rimMid: '#d8ba8a',
    rimEnd: '#73573a',
    faceStart: '#f9e7c5',
    faceMid: '#b58d5c',
    faceEnd: '#513a25',
    accent: '#fffaf0',
    glow: 'rgba(238, 199, 145, 0.28)',
    plaque: '#44311f',
    text: '#fffdf8',
    textStroke: '#473322',
  },
  {
    name: 'sterling',
    rimStart: '#ffffff',
    rimMid: '#c9d0d8',
    rimEnd: '#69727e',
    faceStart: '#f2f6fa',
    faceMid: '#a2abb6',
    faceEnd: '#444c57',
    accent: '#ffffff',
    glow: 'rgba(215, 227, 239, 0.26)',
    plaque: '#333b45',
    text: '#ffffff',
    textStroke: '#343b44',
  },
  {
    name: 'chrome',
    rimStart: '#ffffff',
    rimMid: '#8da1b5',
    rimEnd: '#23303d',
    faceStart: '#f6fbff',
    faceMid: '#657789',
    faceEnd: '#18222d',
    accent: '#eaf8ff',
    glow: 'rgba(169, 215, 246, 0.28)',
    plaque: '#18232e',
    text: '#ffffff',
    textStroke: '#18222b',
  },
  {
    name: 'gunmetal',
    rimStart: '#c6d0d5',
    rimMid: '#52636c',
    rimEnd: '#182126',
    faceStart: '#99a9b0',
    faceMid: '#3d4c54',
    faceEnd: '#11181d',
    accent: '#d7e6ed',
    glow: 'rgba(119, 155, 173, 0.24)',
    plaque: '#121b20',
    text: '#f4fbff',
    textStroke: '#11191e',
  },
  {
    name: 'nickel',
    rimStart: '#f2f0dc',
    rimMid: '#a6a58e',
    rimEnd: '#4e4d42',
    faceStart: '#dedbc1',
    faceMid: '#85836d',
    faceEnd: '#35342c',
    accent: '#fffde6',
    glow: 'rgba(202, 200, 171, 0.24)',
    plaque: '#333229',
    text: '#fffef1',
    textStroke: '#35342b',
  },
  {
    name: 'sapphire',
    rimStart: '#dce9ff',
    rimMid: '#3868df',
    rimEnd: '#111f67',
    faceStart: '#9db8ff',
    faceMid: '#244cb2',
    faceEnd: '#0a1746',
    accent: '#e7f0ff',
    glow: 'rgba(68, 107, 255, 0.32)',
    plaque: '#0c1745',
    text: '#f7f9ff',
    textStroke: '#101b50',
  },
  {
    name: 'azure',
    rimStart: '#dff7ff',
    rimMid: '#2a9fe8',
    rimEnd: '#0d426d',
    faceStart: '#9edfff',
    faceMid: '#1f78bd',
    faceEnd: '#0b3155',
    accent: '#e8fbff',
    glow: 'rgba(48, 169, 255, 0.32)',
    plaque: '#0b3152',
    text: '#f7fdff',
    textStroke: '#0b3459',
  },
  {
    name: 'aquamarine',
    rimStart: '#e4fff9',
    rimMid: '#49d7c4',
    rimEnd: '#11645e',
    faceStart: '#b7f5ec',
    faceMid: '#2ba99a',
    faceEnd: '#0d4945',
    accent: '#effffb',
    glow: 'rgba(70, 224, 199, 0.30)',
    plaque: '#0e423f',
    text: '#f6fffd',
    textStroke: '#0e4742',
  },
  {
    name: 'jade',
    rimStart: '#e5ffe9',
    rimMid: '#3fb37a',
    rimEnd: '#14523b',
    faceStart: '#b9edc9',
    faceMid: '#2d8c60',
    faceEnd: '#103a2b',
    accent: '#eefff2',
    glow: 'rgba(57, 201, 130, 0.28)',
    plaque: '#10392c',
    text: '#f7fff9',
    textStroke: '#103d2e',
  },
  {
    name: 'malachite',
    rimStart: '#dcffe0',
    rimMid: '#24a84f',
    rimEnd: '#0a4b24',
    faceStart: '#9decb0',
    faceMid: '#197b3b',
    faceEnd: '#073319',
    accent: '#edfff0',
    glow: 'rgba(42, 213, 92, 0.28)',
    plaque: '#08321a',
    text: '#f5fff7',
    textStroke: '#0a361c',
  },
  {
    name: 'mint',
    rimStart: '#effff9',
    rimMid: '#65d7a3',
    rimEnd: '#21614b',
    faceStart: '#c9f5e0',
    faceMid: '#4aac80',
    faceEnd: '#174535',
    accent: '#ffffff',
    glow: 'rgba(103, 224, 171, 0.26)',
    plaque: '#163f32',
    text: '#fbfffd',
    textStroke: '#174536',
  },
  {
    name: 'violet',
    rimStart: '#f1e8ff',
    rimMid: '#7c5bd6',
    rimEnd: '#2d1c61',
    faceStart: '#c9b4ff',
    faceMid: '#5f3caf',
    faceEnd: '#211341',
    accent: '#f7efff',
    glow: 'rgba(137, 94, 231, 0.30)',
    plaque: '#241542',
    text: '#fff9ff',
    textStroke: '#27164a',
  },
  {
    name: 'orchid',
    rimStart: '#ffe8ff',
    rimMid: '#c75bd0',
    rimEnd: '#612566',
    faceStart: '#f1b7f3',
    faceMid: '#9f3da9',
    faceEnd: '#461849',
    accent: '#fff0ff',
    glow: 'rgba(221, 91, 230, 0.30)',
    plaque: '#3d173f',
    text: '#fff8ff',
    textStroke: '#421845',
  },
  {
    name: 'magenta',
    rimStart: '#ffe4f8',
    rimMid: '#db3d9f',
    rimEnd: '#72194e',
    faceStart: '#ffaddc',
    faceMid: '#ad267a',
    faceEnd: '#511034',
    accent: '#fff0fa',
    glow: 'rgba(239, 59, 170, 0.30)',
    plaque: '#45102f',
    text: '#fff8fc',
    textStroke: '#4a1032',
  },
  {
    name: 'ruby',
    rimStart: '#ffe5e7',
    rimMid: '#d73c55',
    rimEnd: '#6e1328',
    faceStart: '#ff9aaa',
    faceMid: '#a9213d',
    faceEnd: '#4a0d1c',
    accent: '#fff1f3',
    glow: 'rgba(235, 55, 83, 0.30)',
    plaque: '#400d1b',
    text: '#fff9fa',
    textStroke: '#44101d',
  },
  {
    name: 'garnet',
    rimStart: '#fbdde2',
    rimMid: '#923747',
    rimEnd: '#40121b',
    faceStart: '#d57a89',
    faceMid: '#672331',
    faceEnd: '#2d0c12',
    accent: '#ffe9ed',
    glow: 'rgba(168, 57, 78, 0.26)',
    plaque: '#2c0d14',
    text: '#fff7f8',
    textStroke: '#301017',
  },
  {
    name: 'coral',
    rimStart: '#fff0e6',
    rimMid: '#e77d62',
    rimEnd: '#7c3025',
    faceStart: '#ffc1ad',
    faceMid: '#ba5945',
    faceEnd: '#592117',
    accent: '#fff6ef',
    glow: 'rgba(244, 118, 90, 0.28)',
    plaque: '#4b1d16',
    text: '#fffaf6',
    textStroke: '#502018',
  },
  {
    name: 'topaz',
    rimStart: '#fff7dc',
    rimMid: '#e3b533',
    rimEnd: '#76510a',
    faceStart: '#ffe78c',
    faceMid: '#b88a16',
    faceEnd: '#513702',
    accent: '#fffce8',
    glow: 'rgba(243, 193, 51, 0.30)',
    plaque: '#473303',
    text: '#fffdf2',
    textStroke: '#4a3504',
  },
  {
    name: 'honey',
    rimStart: '#fff2c7',
    rimMid: '#d9941c',
    rimEnd: '#6e3d04',
    faceStart: '#ffd675',
    faceMid: '#ad6d0d',
    faceEnd: '#4a2901',
    accent: '#fff8dc',
    glow: 'rgba(232, 153, 24, 0.28)',
    plaque: '#402500',
    text: '#fffbed',
    textStroke: '#452700',
  },
  {
    name: 'carbon',
    rimStart: '#b8c0c7',
    rimMid: '#394148',
    rimEnd: '#080b0d',
    faceStart: '#6d777f',
    faceMid: '#20262b',
    faceEnd: '#050708',
    accent: '#dde5eb',
    glow: 'rgba(104, 121, 135, 0.22)',
    plaque: '#070a0c',
    text: '#f4f7f9',
    textStroke: '#07090b',
  },
  {
    name: 'midnight',
    rimStart: '#9aa7cc',
    rimMid: '#263866',
    rimEnd: '#080d24',
    faceStart: '#566d9f',
    faceMid: '#17274f',
    faceEnd: '#05091b',
    accent: '#dce5ff',
    glow: 'rgba(72, 98, 175, 0.26)',
    plaque: '#070c21',
    text: '#f5f7ff',
    textStroke: '#080d24',
  },
  {
    name: 'lunar',
    rimStart: '#ffffff',
    rimMid: '#c3c9da',
    rimEnd: '#585f75',
    faceStart: '#f5f6ff',
    faceMid: '#9ba3bb',
    faceEnd: '#3e4559',
    accent: '#ffffff',
    glow: 'rgba(215, 220, 242, 0.26)',
    plaque: '#363d50',
    text: '#ffffff',
    textStroke: '#393f52',
  },
  {
    name: 'iridium',
    rimStart: '#f6ffff',
    rimMid: '#75b6b9',
    rimEnd: '#2f4d51',
    faceStart: '#d9ffff',
    faceMid: '#598f94',
    faceEnd: '#233b3f',
    accent: '#f0ffff',
    glow: 'rgba(126, 209, 214, 0.28)',
    plaque: '#21383b',
    text: '#f8ffff',
    textStroke: '#233b3e',
  },
]

const BATTLE_COIN_QUOTE_SUFFIXES = [
  'FDUSD',
  'USDT',
  'USDC',
  'BUSD',
  'TUSD',
  'USDP',
  'DAI',
  'BTC',
  'ETH',
  'EUR',
  'USD',
  'TRY',
  'BRL',
]

function normalizeBattleCoinSymbol(symbol) {
  const normalized = String(symbol || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return normalized || 'COIN'
}

function hashBattleCoinSymbol(symbol) {
  const value = normalizeBattleCoinSymbol(symbol)
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function splitBattleCoinSymbol(symbol) {
  const normalized = normalizeBattleCoinSymbol(symbol)
  const quote = BATTLE_COIN_QUOTE_SUFFIXES.find(
    (suffix) => normalized.length > suffix.length && normalized.endsWith(suffix)
  )
  if (!quote) {
    return {
      normalized,
      base: normalized.slice(0, 8),
      quote: 'COIN',
    }
  }
  return {
    normalized,
    base: normalized.slice(0, -quote.length).slice(0, 8),
    quote,
  }
}

const PremiumCoinGlyph = React.memo(function PremiumCoinGlyph({
  symbol,
  size = 'market',
}) {
  const reactId = useId()
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '')
  const { normalized, base, quote } = splitBattleCoinSymbol(symbol)
  const hash = hashBattleCoinSymbol(normalized)
  const variant = hash % BATTLE_COIN_METAL_THEMES.length
  const theme = BATTLE_COIN_METAL_THEMES[variant]
  const motif = (hash >>> 7) % 8
  const dash = ['2 4', '7 3', '1 3', '10 4', '5 2', '1 2', '8 2', '3 3'][motif]
  const baseFontSize =
    base.length <= 3 ? 13.5 : base.length <= 5 ? 10.5 : base.length <= 7 ? 8 : 6.5
  const rimGradientId = `ql7-pc-rim-${safeId}`
  const faceGradientId = `ql7-pc-face-${safeId}`

  return (
    <span
      className={`ql7-premium-coin ql7-premium-coin--${size} ql7-premium-coin--${theme.name}`}
      style={{
        '--ql7-pc-glow': theme.glow,
      }}
      data-ql7-static-coin="true"
      data-theme={theme.name}
      role="img"
      aria-label={`${normalized} premium coin`}
      title={normalized}
    >
      <svg
        viewBox="0 0 64 64"
        width="64"
        height="64"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={rimGradientId} x1="8" y1="7" x2="56" y2="58">
            <stop offset="0" stopColor={theme.rimStart} />
            <stop offset="0.3" stopColor={theme.rimMid} />
            <stop offset="0.72" stopColor={theme.rimEnd} />
            <stop offset="1" stopColor={theme.rimMid} />
          </linearGradient>
          <radialGradient id={faceGradientId} cx="29%" cy="22%" r="82%">
            <stop offset="0" stopColor={theme.faceStart} />
            <stop offset="0.48" stopColor={theme.faceMid} />
            <stop offset="1" stopColor={theme.faceEnd} />
          </radialGradient>
        </defs>

        <circle cx="32" cy="32" r="30.5" fill={theme.rimEnd} opacity="0.82" />
        <circle
          cx="32"
          cy="32"
          r="28.9"
          fill={`url(#${rimGradientId})`}
          stroke={theme.accent}
          strokeWidth="0.72"
        />
        <circle
          cx="32"
          cy="32"
          r="27.1"
          fill="none"
          stroke={theme.rimStart}
          strokeWidth="0.55"
          opacity="0.82"
        />
        <circle
          cx="32"
          cy="32"
          r="25.5"
          fill="none"
          stroke={theme.accent}
          strokeWidth="0.72"
          strokeDasharray={dash}
          opacity="0.66"
        />
        <circle
          cx="32"
          cy="32"
          r="23.8"
          fill="none"
          stroke={theme.rimEnd}
          strokeWidth="0.62"
          strokeDasharray="1 4.5"
          opacity="0.8"
        />
        <circle
          cx="32"
          cy="32"
          r="21.9"
          fill={`url(#${faceGradientId})`}
          stroke={theme.rimStart}
          strokeWidth="0.78"
        />

        {motif === 0 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.55" opacity="0.44">
            <ellipse cx="32" cy="32" rx="17.4" ry="8.1" transform="rotate(-18 32 32)" />
            <ellipse cx="32" cy="32" rx="8.1" ry="17.4" transform="rotate(18 32 32)" />
            <circle cx="32" cy="32" r="2.1" />
          </g>
        ) : null}

        {motif === 1 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.55" opacity="0.48">
            <path d="M32 13.8 47.8 23 47.8 41 32 50.2 16.2 41 16.2 23Z" />
            <path d="M32 13.8V50.2M16.2 23 47.8 41M47.8 23 16.2 41" />
          </g>
        ) : null}

        {motif === 2 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.68" opacity="0.48">
            <path d="M32 13.5V19M32 45V50.5M13.5 32H19M45 32H50.5" />
            <path d="m18.9 18.9 3.8 3.8m18.6 18.6 3.8 3.8m0-26.2-3.8 3.8M22.7 41.3l-3.8 3.8" />
            <circle cx="32" cy="32" r="15.8" strokeDasharray="1.2 3.2" />
          </g>
        ) : null}

        {motif === 3 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.55" opacity="0.48">
            <path d="M22 18.5h20l10 13.5-10 13.5H22L12 32Z" />
            <path d="M22 18.5 32 32 22 45.5M42 18.5 32 32 42 45.5M12 32h40" />
          </g>
        ) : null}

        {motif === 4 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.62" opacity="0.48">
            <path d="m18 39 5-17 9 8 9-8 5 17" />
            <path d="M19.5 41.5h25M23 22l9-7 9 7" />
          </g>
        ) : null}

        {motif === 5 ? (
          <g fill={theme.accent} stroke={theme.accent} strokeWidth="0.45" opacity="0.46">
            <path d="M17 24h7l4 4h8l4-4h7M17 40h7l4-4h8l4 4h7" fill="none" />
            <circle cx="17" cy="24" r="1.1" />
            <circle cx="47" cy="24" r="1.1" />
            <circle cx="17" cy="40" r="1.1" />
            <circle cx="47" cy="40" r="1.1" />
          </g>
        ) : null}

        {motif === 6 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.62" opacity="0.46">
            <path d="M15.5 28c5-8 10-8 15 0s10 8 18 0" />
            <path d="M15.5 36c5-8 10-8 15 0s10 8 18 0" />
            <path d="M19 20.5h26M19 43.5h26" strokeDasharray="2 3" />
          </g>
        ) : null}

        {motif === 7 ? (
          <g fill="none" stroke={theme.accent} strokeWidth="0.58" opacity="0.48">
            <path d="m32 13.5 4.2 10.1 10.8-4.2-4.2 10.8L53 34.4l-10.2 4.2L47 49.4l-10.8-4.2L32 55.5l-4.2-10.3L17 49.4l4.2-10.8L11 34.4l10.2-4.2L17 19.4l10.8 4.2Z" />
            <circle cx="32" cy="34.4" r="12.5" strokeDasharray="3 2" />
          </g>
        ) : null}

        <rect
          x="12.9"
          y="21.8"
          width="38.2"
          height="24.5"
          rx="7.9"
          fill={theme.plaque}
          stroke={theme.accent}
          strokeWidth="0.78"
          opacity="0.91"
        />
        <rect
          x="14.5"
          y="23.4"
          width="35"
          height="21.3"
          rx="6.5"
          fill="none"
          stroke={theme.rimStart}
          strokeWidth="0.38"
          opacity="0.55"
        />

        <path
          className="ql7-premium-coin__shine"
          d="M17.8 19.4C23.8 12.6 34.5 10.7 44.1 15.2"
          fill="none"
          stroke={theme.accent}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.76"
        />
        <path
          d="M20.5 48.2c7.2 4.8 16.8 4.6 23.4-.4"
          fill="none"
          stroke={theme.rimStart}
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.52"
        />

        <g className="ql7-premium-coin__spark" fill={theme.accent} opacity="0.84">
          <path d="M49.3 10.9 50.7 14l3.1 1.4-3.1 1.4-1.4 3.1-1.4-3.1-3.1-1.4 3.1-1.4Z" />
          <circle cx="14.4" cy="48.7" r="1.1" />
        </g>

        <text
          x="32"
          y="31.7"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme.text}
          stroke={theme.textStroke}
          strokeWidth="2.1"
          paintOrder="stroke"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize={baseFontSize}
          fontWeight="900"
          letterSpacing={base.length <= 4 ? '0.4' : '0'}
        >
          {base}
        </text>
        <text
          x="32"
          y="40.8"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme.text}
          stroke={theme.textStroke}
          strokeWidth="1.3"
          paintOrder="stroke"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="5.6"
          fontWeight="800"
          letterSpacing="1.05"
        >
          {quote}
        </text>
      </svg>
    </span>
  )
})


// ===================== COMPONENT =====================
export default function BattleCoin() {
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)
  const [lightLoading, setLightLoading] = useState(false)
  const [error, setError] = useState(null)

  const [auth, setAuth] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [balance, setBalance] = useState(null)

  const [symbols, setSymbols] = useState([])
  const [orders, setOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)

  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [stakeInput, setStakeInput] = useState('')
  const [selectedLeverage, setSelectedLeverage] = useState(1)
  const [openingSide, setOpeningSide] = useState('')

  const [filterTab, setFilterTab] = useState('all')

  const [nowTs, setNowTs] = useState(Date.now())
  const settleRequestedRef = useRef(false)

  const hasActiveOrder = !!(activeOrder && activeOrder.status === 'OPEN')

  const handleOpenQuantumWallet = useCallback(() => {
    try {
      const accountId = readAccountId()
      window.dispatchEvent(
        new CustomEvent('quantum-wallet:open', {
          detail: {
            accountId,
            userKey: accountId,
            vipActive: isVip,
          },
        })
      )
    } catch {}
  }, [isVip])

  // --- timer tick ---
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

const fetchState = useCallback(
  async (scope = 'full') => {
    try {
      const qs = scope === 'light' ? '?scope=light' : ''
      const accountId =
        typeof window !== 'undefined' ? readAccountId() : null

      const headers = {}
      if (accountId) {
        headers['x-forum-user-id'] = accountId
        headers['x-auth-account-id'] = accountId
      }

      const res = await fetch(`/api/battlecoin/state${qs}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })
      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        throw new Error(j?.error || 'BattleCoin state error')
      }
      setAuth(!!j.auth)
      if (scope === 'full') setAuth(!!j.auth)
      // VIP: обновляем ТОЛЬКО на full, чтобы light-поллинг не моргал
      if (scope === 'full') setIsVip(!!j.isVip)

      // баланс обновляем и на full, и на light
      if (typeof j.balance !== 'undefined') {
        setBalance(
          typeof j.balance === 'number' ? j.balance : j.balance || 0
        )
      }

      // историю берём только на full, чтобы light-пуллинг её не затирал
      if (scope === 'full') {
        if (Array.isArray(j.orders)) {
          setOrders(j.orders)
        } else {
          setOrders([])
        }
      }

      setSymbols(Array.isArray(j.symbols) ? j.symbols : [])
      setActiveOrder(j.order || null)

      // 🔧 ВАЖНО: теперь автосмена символа только для full-апдейта
      if (scope === 'full' && !hasActiveOrder) {
        if (j.order && j.order.symbol) {
          setSelectedSymbol(j.order.symbol)
        } else if (Array.isArray(j.symbols) && j.symbols.length) {
          setSelectedSymbol(j.symbols[0].symbol || 'BTCUSDT')
        }
      }

      setError(null)
    } catch (e) {
      console.error('BattleCoin state error', e)
      setError(String(e?.message || e) || 'BattleCoin error')
    } finally {
      if (scope === 'full') setLoading(false)
      if (scope === 'light') setLightLoading(false)
    }
  },
  [hasActiveOrder]
)

  useEffect(() => {
    fetchState('full')
  }, [fetchState])
 // ✅ ВАЖНО: после авторизации сразу подгружаем FULL (история, баланс, ордера)
 useEffect(() => {
   const onAuthOk = () => {
     // auth появился → нужен полный state, иначе история не загрузится никогда
     fetchState('full')
   }
   const onLogout = () => {
     setAuth(false)
     setIsVip(false)
     setBalance(null)
     setOrders([])        // можно оставить историю пустой для гостя
     setActiveOrder(null)
   }

   try {
     window.addEventListener('auth:ok', onAuthOk)
     window.addEventListener('auth:logout', onLogout)
   } catch {}

   return () => {
     try { window.removeEventListener('auth:ok', onAuthOk) } catch {}
     try { window.removeEventListener('auth:logout', onLogout) } catch {}
   }
 }, [fetchState])
  // --- lightweight polling for prices/PnL ---
  useEffect(() => {
    const id = setInterval(() => {
      setLightLoading(true)
      fetchState('light')
    }, 2500)
    return () => clearInterval(id)
  }, [fetchState])

  // --- timers & auto-settle ---
  const timeLeftSec = useMemo(() => {
    if (!activeOrder || activeOrder.status !== 'OPEN') return 0
    const left = (activeOrder.expiresAt || 0) - nowTs
    return Math.max(0, Math.floor(left / 1000))
  }, [activeOrder, nowTs])

  useEffect(() => {
    if (!activeOrder || activeOrder.status !== 'OPEN') {
      settleRequestedRef.current = false
      return
    }
    if (timeLeftSec <= 0 && !settleRequestedRef.current) {
      settleRequestedRef.current = true
      handleSettle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSec, activeOrder])

  const stakeNumber = useMemo(() => {
    const n = parseFloat((stakeInput || '').replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }, [stakeInput])

  const effectiveBalance = typeof balance === 'number' ? balance : 0
  const maxLeverage = isVip ? 100 : 5

  const leverageValid =
    Number.isFinite(selectedLeverage) &&
    selectedLeverage > 0 &&
    selectedLeverage <= maxLeverage

  const canEditControls = auth && !hasActiveOrder
  const canChangeSymbol = !hasActiveOrder

  const stakeValid =
    stakeNumber > 0 && stakeNumber <= (effectiveBalance || 0 + 1e-9)

  const orderOpening = !!openingSide
  const longShortDisabled =
    !auth || !stakeValid || !leverageValid || hasActiveOrder || orderOpening

const filteredOrders = useMemo(() => {
  if (!Array.isArray(orders)) return []

  let base = orders

  // если есть активный ордер OPEN и его нет в списке — добавим
  if (activeOrder && activeOrder.status === 'OPEN') {
    const exists = base.some((o) => o.orderId === activeOrder.orderId)
    if (!exists) {
      base = [activeOrder, ...base]
    }
  }

  if (filterTab === 'active') {
    return base.filter((o) => o.status === 'OPEN')
  }
  if (filterTab === 'closed') {
    return base.filter((o) => o.status === 'SETTLED')
  }
  return base
}, [orders, filterTab, activeOrder])

  const timerPulsing = timeLeftSec > 0 && timeLeftSec <= 10
  const handleVipClick = async () => {
    try {
      const acc = await ensureAuthorized()
      if (!acc) {
        showToast(tf(t, 'battlecoin_auth_required', 'Auth required'))
        return
      }

      const url = await createVipInvoice(acc)
      openPaymentWindow(url)

      // После успешной оплаты через несколько секунд
      // шлём глобальный vip:refresh — его ловит эффект выше
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event('vip:refresh'))
        } catch {}
      }, 5000)
    } catch (e) {
      console.error('BattleCoin VIP pay error', e)
      const msg =
        e?.message === 'vip_invoice_failed'
          ? tf(t, 'vip_invoice_failed', 'Cannot create VIP invoice')
          : tf(t, 'vip_invoice_generic', 'VIP payment failed')
      showToast(msg, 'error')
    }
  }

  const handleStakeMax = () => {
    if (!canEditControls) return
    const v = effectiveBalance
    if (!Number.isFinite(v) || v <= 0) return
    const rounded = Math.floor(v * 100) / 100
    setStakeInput(String(rounded))
  }

  const handleLeverageClick = (lev) => {
    if (!canEditControls) return
    if (!isVip && lev > 5) {
      showToast(tf(t, 'battlecoin_vip_only_leverage', 'VIP only'))
      return
    }
    setSelectedLeverage(lev)
  }

  const handleSymbolClick = (symbol) => {
    if (!canChangeSymbol) return
    setSelectedSymbol(symbol)
  }

  const handleAuthClick = async () => {
    const acc = await ensureAuthorized()
    if (!acc) {
      showToast(tf(t, 'battlecoin_auth_required', 'Auth required'))
      return
    }
    await fetchState('full')
  }

  const handleOpenSide = async (side) => {
    if (!auth) {
      await handleAuthClick()
      return
    }
    if (longShortDisabled) return

    try {
      setOpeningSide(side)
      const accountId = readAccountId()
      const body = {
        op: 'open',
        side,
        symbol: selectedSymbol,
        stake: stakeNumber,
        leverage: selectedLeverage,
        accountId,
      }
      const res = await fetch('/api/battlecoin/order', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-vip': isVip ? '1' : '0',
        },
        body: JSON.stringify(body),
      })

      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        const err = j?.error || 'battlecoin_err_open_failed'
        showToast(tf(t, err, 'Order open failed'), 'error')
        return
      }
      setBalance(
        typeof j.balance === 'number' ? j.balance : j.balance || 0
      )
      setActiveOrder(j.order || null)
      showToast(tf(t, 'battlecoin_toast_open_ok', 'Order opened'), 'success')
    } catch (e) {
      console.error('BattleCoin open error', e)
      showToast(tf(t, 'battlecoin_err_open_failed', 'Order open failed'), 'error')
    } finally {
      setOpeningSide('')
    }
  }

  async function handleSettle() {
    try {
      const accountId = readAccountId()
      const body = {
        op: 'settle',
        accountId,
      }
      const res = await fetch('/api/battlecoin/order', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-vip': isVip ? '1' : '0',
        },
        body: JSON.stringify(body),
      })

      const j = await res.json().catch(() => null)
      if (!j || !j.ok) {
        const err = j?.error || 'battlecoin_err_settle_failed'
        showToast(tf(t, err, 'Order settle failed'), 'error')
        settleRequestedRef.current = false
        return
      }

      setBalance(
        typeof j.balance === 'number' ? j.balance : j.balance || 0
      )
      setActiveOrder(j.order || null)
      fetchState('full')

      const pnl = Number(j.order?.pnl || 0)
      if (pnl > 0) {
        showToast(tf(t, 'battlecoin_toast_win', 'You win'), 'success')
      } else if (pnl < 0) {
        if (Math.abs(pnl + j.order.stake) < 1e-6) {
          showToast(tf(t, 'battlecoin_toast_loss', 'You lose'), 'error')
        } else {
          showToast(tf(t, 'battlecoin_toast_loss', 'You lose'), 'error')
        }
      } else {
        showToast(tf(t, 'battlecoin_toast_break_even', 'Break-even'), 'info')
      }
    } catch (e) {
      console.error('BattleCoin settle error', e)
      showToast(tf(t, 'battlecoin_err_settle_failed', 'Order settle failed'), 'error')
      settleRequestedRef.current = false
    }
  }

  // ================== RENDER ==================
  const title = tf(t, 'battlecoin_title', 'BattleCoin')
  const subtitle =
    tf(
      t,
      'battlecoin_subtitle',
      'Bet real QCOIN with up to x100 leverage in 10-minute battles.'
    )

  const notAuthedText = tf(
    t,
    'battlecoin_auth_required',
    'Sign in to trade BattleCoin'
  )

  const balanceLabel = tf(t, 'battlecoin_balance_label', 'Available balance')

  return (
    <section id="ql7-exchange-battlecoin" className="panel battlecoin-panel">
      {/* ---------------- Header ---------------- */}
      <header className="battlecoin-header">
        <div className="battlecoin-header-left">
          <div className="battlecoin-logo-wrap">
            <div className="battlecoin-logo-orbit">
<Image
  src="/coins/battlecoin/logo.png"
  alt="BattleCoin"
  className="battlecoin-logo"
  width={160}
  height={160}
  priority
/>

              <div className="battlecoin-logo-glow" />
            </div>
          </div>

          <div className="battlecoin-titles">
            <div className="battlecoin-title-row">
              <h2 className="battlecoin-title">{title}</h2>
              <span className="battlecoin-tag"> • Quantum Futures • </span>
            </div>
            <p className="battlecoin-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="battlecoin-header-right">         
          <div className="battlecoin-balance-block">
           
            <div className="battlecoin-balance-main">
              <div className="battlecoin-balance-label">{balanceLabel}</div>
              <div className="battlecoin-balance-value">
                <span className="battlecoin-balance-number">
                  {formatNumber(effectiveBalance, 4)}
                </span>
                <span className="battlecoin-balance-asset">QCOIN</span>
              </div>
            </div>
            <QuantumWalletLaunchButton
              onClick={handleOpenQuantumWallet}
              title={tf(t, 'quantum_wallet_open_aria', 'Open Quantum Wallet')}
            />

          </div>
          <div className="battlecoin-header-divider" />
            <div className="battlecoin-vip-block"> 
  {isVip ? (
    <div className="battlecoin-vip-pill">
      <span className="vip-spark" />
      {/* золотой перелив, как ты просил */}
      <span className="qcoinLabel">VIP</span>
      <span className="vip-val">x100</span>
    </div>
  ) : (
<button
  type="button"
  className="battlecoin-vip-cta"
  onClick={handleVipClick}
>
  {tf(t, 'battlecoin_vip_cta', 'Unlock VIP x100')}
</button>

  )}
</div> 
        </div>
      </header>

      {/* ---------------- Main layout ---------------- */}
      <div className="battlecoin-layout">
        {/* Left: controls + active order */}
        <div className="battlecoin-left">
          {/* Control panel */}
          <div className="battlecoin-card battlecoin-control-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(t, 'battlecoin_leverage_label', 'Position setup')}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_control_subtitle',
         'Stake • Leverage • Direction'
       )}
     </span>
              </div>
              <div className="card-status-dot">
                <span className={`live-dot ${lightLoading ? 'is-pinging' : ''}`} />
     <span className="live-dot-label">
       {tf(t, 'battlecoin_live_market_label', 'Live market')}
     </span>
              </div>
            </div>

            {!auth ? (
              <div className="battlecoin-auth-warning">
                <div className="auth-text">{notAuthedText}</div>
                <button
                  type="button"
                  className="battlecoin-auth-btn"
                  onClick={handleAuthClick}
                >
                  {tf(t, 'auth_signin', 'Sign in')}
                </button>
              </div>
            ) : null}

            {/* leverage */}
            <div className="control-section">
              <div className="control-section-header">
                <span className="control-label">
                  {tf(t, 'battlecoin_leverage_label', 'Leverage')}
                </span>
   <span className="control-extra">
     {isVip
       ? tf(t, 'battlecoin_leverage_extra_vip', 'Up to x100')
       : tf(
           t,
           'battlecoin_leverage_extra_basic',
           'Up to x5 • VIP for more'
         )}
   </span>
              </div>
              <div className="battlecoin-leverage-grid">
                {LEVERAGE_OPTIONS.map((lev) => {
                  const vipOnly = lev > 5
                  const disabled =
                    !canEditControls || (!isVip && vipOnly)
                  const active = selectedLeverage === lev
                  return (
                    <button
                      key={lev}
                      type="button"
                      className={[
                        'lever-btn',
                        active ? 'is-active' : '',
                        disabled ? 'is-disabled' : '',
                        vipOnly ? 'is-vip-only' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleLeverageClick(lev)}
                    >
                      <span className="lever-val">x{lev}</span>
                      {vipOnly && <span className="lever-vip-tag">VIP</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* stake */}
            <div className="control-section two-cols">
              <div className="control-field">
                <div className="control-section-header">
                  <span className="control-label">
                    {tf(t, 'battlecoin_stake_label', 'Stake')}
                  </span>
                  <span className="control-extra">QCOIN</span>
                </div>
                <div className="stake-input-row">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={stakeInput}
                    disabled={!canEditControls}
                    onChange={(e) => setStakeInput(e.target.value)}
                    className="stake-input"
                    placeholder="0.0000"
                  />
                  <button
                    type="button"
                    className="stake-max-btn"
                    onClick={handleStakeMax}
                    disabled={!canEditControls}
                  >
                    {tf(t, 'battlecoin_stake_max', 'MAX')}
                  </button>
                </div>
                <div className="balance-line">
                  <span className="balance-caption">
                    {balanceLabel}:
                  </span>
                  <span className="balance-num">
                    {formatNumber(effectiveBalance, 4)} QCOIN
                  </span>
                </div>
              </div>

              {/* symbol select */}
              <div className="control-field">
                <div className="control-section-header">
                  <span className="control-label">
                    {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                  </span>
   <span className="control-extra">
     {tf(t, 'battlecoin_symbol_extra', 'Perpetual vs USDT')}
   </span>
                </div>
                <div className="symbol-select-row">
                  <div className="symbol-coin-preview">
                    <PremiumCoinGlyph symbol={selectedSymbol} size="market" />
                  </div>
                  <select
                    value={selectedSymbol}
                    disabled={!canChangeSymbol}
                    onChange={(e) => handleSymbolClick(e.target.value)}
                    className="symbol-select"
                  >
                    {symbols.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* long / short buttons */}
            <div className="control-section">
              <div className="control-section-header">


              </div>
              <div className="longshort-row">
                <button
                  type="button"
                  className={['ls-btn ls-long', openingSide === 'LONG' ? 'is-opening' : ''].filter(Boolean).join(' ')}
                  disabled={longShortDisabled}
                  aria-busy={openingSide === 'LONG'}
                  onClick={() => handleOpenSide('LONG')}
                >
                  <span className="ls-label">
                    {auth
                      ? tf(t, 'battlecoin_side_long', 'Long')
                      : notAuthedText}
                  </span>
     <span className="ls-sub">
       {tf(t, 'battlecoin_long_buy', 'Buy')}{' '}
       {selectedSymbol}
       {' • '}
       {tf(t, 'battlecoin_long_bullish', 'Bullish')}
     </span>
                  {openingSide === 'LONG' ? <span className="ls-spinner" aria-hidden="true" /> : null}
                  <span className="ls-glow" />
                </button>
                <button
                  type="button"
                  className={['ls-btn ls-short', openingSide === 'SHORT' ? 'is-opening' : ''].filter(Boolean).join(' ')}
                  disabled={longShortDisabled}
                  aria-busy={openingSide === 'SHORT'}
                  onClick={() => handleOpenSide('SHORT')}
                >
                  <span className="ls-label">
                    {auth
                      ? tf(t, 'battlecoin_side_short', 'Short')
                      : notAuthedText}
                  </span>
     <span className="ls-sub">
       {tf(t, 'battlecoin_short_sell', 'Sell')}{' '}
       {selectedSymbol}
       {' • '}
       {tf(t, 'battlecoin_short_bearish', 'Bearish')}
     </span>
                  {openingSide === 'SHORT' ? <span className="ls-spinner" aria-hidden="true" /> : null}
                  <span className="ls-glow" />
                </button>
              </div>
            </div>
          </div>

          {/* Active order */}
          <div className="battlecoin-card battlecoin-active-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_order_active_title',
                    'Active BattleCoin order'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_active_subtitle',
         '10-minute fixed duration • auto-settle'
       )}
     </span>
              </div>
            </div>

            {!activeOrder || activeOrder.status !== 'OPEN' ? (
              <div className="empty-active">
                <div className="empty-pill">
                  {tf(
                    t,
                    'battlecoin_no_active_order',
                    'No active BattleCoin orders'
                  )}
                </div>
     <p className="empty-text">
       {tf(
         t,
         'battlecoin_empty_active_hint',
         'Configure stake and leverage, choose direction and fire your first battle.'
       )}
     </p>
              </div>
            ) : (
              <div className="active-grid">
                <div className="active-info">
                  <div className="info-row first">
         <span className="info-label">
           {tf(t, 'battlecoin_order_id_label', 'Order #')}
         </span>
          
                    <span className="info-value">
                      {activeOrder.orderId}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                    </span>
<div className="info-symbol">
  <PremiumCoinGlyph symbol={activeOrder.symbol} size="active" />
  <span>{activeOrder.symbol}</span>
</div>

                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_orders_col_side', 'Side')}
                    </span>
                    <span
                      className={[
                        'info-side',
                        activeOrder.side === 'LONG'
                          ? 'is-long'
                          : 'is-short',
                      ].join(' ')}
                    >
                      {activeOrder.side}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_leverage',
                        'Leverage'
                      )}
                    </span>
                    <span className="info-value">x{activeOrder.leverage}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_stake',
                        'Stake'
                      )}
                    </span>
                    <span className="info-value">
                      {formatNumber(activeOrder.stake, 4)} QCOIN
                    </span>
                  </div>
                </div>

                <div className="active-prices">
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_entry',
                        'Entry price'
                      )}
                    </span>
                    <span className="info-value">
                      {formatNumber(activeOrder.entryPrice, 6)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_col_price', 'Mark price')}
                    </span>
                    <span className="info-value">
                      {formatNumber(
                        activeOrder.markPrice ?? activeOrder.entryPrice,
                        6
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(
                        t,
                        'battlecoin_orders_col_change',
                        'Change'
                      )}
                    </span>
                    <span
                      className={[
                        'info-value',
                        (activeOrder.changePct || 0) >= 0
                          ? 'is-pos'
                          : 'is-neg',
                        'value-glow',
                      ].join(' ')}
                    >
                      {formatNumber(activeOrder.changePct || 0, 2)}%
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      {tf(t, 'battlecoin_orders_col_pnl', 'PnL')}
                    </span>
                    <span
                      className={[
                        'info-value',
                        (activeOrder.pnl || 0) >= 0 ? 'is-pos' : 'is-neg',
                        'value-glow',
                      ].join(' ')}
                    >
                      {formatNumber(activeOrder.pnl || 0, 4)} QCOIN
                    </span>
                  </div>
                </div>

                <div className="active-timer">
                  <div className="timer-label">
                    {tf(t, 'battlecoin_timer_label', 'Time left')}
                  </div>
                  <div
                    className={[
                      'timer-value',
                      timerPulsing ? 'is-pulsing' : '',
                    ].join(' ')}
                  >
                    {formatTimer(timeLeftSec)}
                  </div>

                </div>
              </div>
            )}
          </div>

          <BattleChat />
        </div>

        {/* Right: market + history */}
        <div className="battlecoin-right">
          {/* Market list */}
          <div className="battlecoin-card market-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_market_list_title',
                    'Battle market'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_market_subtitle',
         'Realtime prices • click to target symbol'
       )}
     </span>
              </div>
            </div>
            <div className="market-table">
              <div className="market-head">
                <div className="mh-col idx">
                  {tf(t, 'battlecoin_col_index', '#')}
                </div>
                <div className="mh-col symbol">
                  {tf(t, 'battlecoin_col_symbol', 'Symbol')}
                </div>
                <div className="mh-col price">
                  {tf(t, 'battlecoin_col_price', 'Price')}
                </div>
                <div className="mh-col change">
                  {tf(
                    t,
                    'battlecoin_col_change24h',
                    '24h %'
                  )}
                </div>
              </div>
              <div className="market-body">
                {symbols.map((s, i) => {
                  const ch = Number(s.change24h || 0)
                  const isSelected = selectedSymbol === s.symbol
                  return (
                    <button
                      key={s.symbol}
                      type="button"
                      className={[
                        'market-row',
                        isSelected ? 'is-selected' : '',
                      ].join(' ')}
                      onClick={() => handleSymbolClick(s.symbol)}
                      disabled={!canChangeSymbol}
                    >
                      <div className="mb-col idx">{i + 1}</div>
                      <div className="mb-col symbol">
<PremiumCoinGlyph symbol={s.symbol} size="market" />

                        <span className="symbol-text">{s.symbol}</span>
                      </div>
                      <div className="mb-col price">
                        {formatNumber(s.price, 6)}
                      </div>
                      <div
                        className={[
                          'mb-col change',
                          ch > 0 ? 'is-pos' : '',
                          ch < 0 ? 'is-neg' : '',
                          'value-glow',
                        ].join(' ')}
                      >
                        {formatNumber(ch, 2)}%
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="battlecoin-card history-card">
            <div className="card-header history-header">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  {tf(
                    t,
                    'battlecoin_orders_title',
                    'Battle history'
                  )}
                </h3>
     <span className="card-subtitle">
       {tf(
         t,
         'battlecoin_orders_subtitle',
         'Last 100 BattleCoin orders for this account'
       )}
     </span>
              </div>
              <div className="history-tabs">
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'all' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('all')}
                >
                  {tf(t, 'battlecoin_filter_all', 'All')}
                </button>
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'active' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('active')}
                >
                  {tf(t, 'battlecoin_filter_active', 'Active')}
                </button>
                <button
                  type="button"
                  className={[
                    'history-tab',
                    filterTab === 'closed' ? 'is-active' : '',
                  ].join(' ')}
                  onClick={() => setFilterTab('closed')}
                >
                  {tf(t, 'battlecoin_filter_closed', 'Closed')}
                </button>
              </div>
            </div>

            {!filteredOrders.length ? (
              <div className="no-history">
                {tf(
                  t,
                  'battlecoin_no_orders',
                  'No BattleCoin orders yet. Your first battle will appear here.'
                )}
              </div>
            ) : (
              <div className="history-table">
                <div className="history-head">
                  <div className="hh-col idx">
                    {tf(t, 'battlecoin_orders_col_index', '#')}
                  </div>
                  <div className="hh-col symbol">
                    {tf(
                      t,
                      'battlecoin_orders_col_symbol',
                      'Symbol'
                    )}
                  </div>
                  <div className="hh-col side">
                    {tf(
                      t,
                      'battlecoin_orders_col_side',
                      'Side'
                    )}
                  </div>
                  <div className="hh-col lev">
                    {tf(
                      t,
                      'battlecoin_orders_col_leverage',
                      'Lev'
                    )}
                  </div>
                  <div className="hh-col stake">
                    {tf(
                      t,
                      'battlecoin_orders_col_stake',
                      'Stake'
                    )}
                  </div>
                  <div className="hh-col entry">
                    {tf(
                      t,
                      'battlecoin_orders_col_entry',
                      'Entry'
                    )}
                  </div>
                  <div className="hh-col change">
                    {tf(
                      t,
                      'battlecoin_orders_col_change',
                      'Change'
                    )}
                  </div>
                  <div className="hh-col pnl">
                    {tf(t, 'battlecoin_orders_col_pnl', 'PnL')}
                  </div>
                  <div className="hh-col status">
                    {tf(
                      t,
                      'battlecoin_orders_col_status',
                      'Status'
                    )}
                  </div>
                </div>
                <div className="history-body">
                  {filteredOrders.map((o, idx) => {
                    const ch = Number(o.changePct || 0)
                    const pnl = Number(o.pnl || 0)
                    const isActive = o.status === 'OPEN'
                    return (
                      <div
                        key={`${o.orderId}-${idx}`}
                        className={[
                          'history-row',
                          isActive ? 'is-active' : '',
                        ].join(' ')}
                      >
                        <div className="hb-col idx">
                          {o.orderId || idx + 1}
                        </div>
                        <div className="hb-col symbol">
                          {o.symbol}
                        </div>
                        <div
                          className={[
                            'hb-col side',
                            o.side === 'LONG'
                              ? 'is-long'
                              : 'is-short',
                          ].join(' ')}
                        >
                          {o.side}
                        </div>
                        <div className="hb-col lev">x{o.leverage}</div>
                        <div className="hb-col stake">
                          {formatNumber(o.stake, 4)}
                        </div>
                        <div className="hb-col entry">
                          {formatNumber(o.entryPrice, 6)}
                        </div>
                        <div
                          className={[
                            'hb-col change',
                            ch > 0 ? 'is-pos' : '',
                            ch < 0 ? 'is-neg' : '',
                          ].join(' ')}
                        >
                          {formatNumber(ch, 2)}%
                        </div>
                        <div
                          className={[
                            'hb-col pnl',
                            pnl > 0 ? 'is-pos' : '',
                            pnl < 0 ? 'is-neg' : '',
                          ].join(' ')}
                        >
                          {formatNumber(pnl, 4)}
                        </div>
                        <div className="hb-col status">{o.status}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="battlecoin-loading-overlay">
          <div className="battlecoin-spinner" />
        </div>
      )}
      {error && !loading && (
        <div className="battlecoin-error">
          {String(error || '')}
        </div>
      )}


      <style jsx global>{`
        .ql7-premium-coin {
          --ql7-pc-size: 42px;
          position: relative;
          display: inline-grid;
          place-items: center;
          width: var(--ql7-pc-size);
          height: var(--ql7-pc-size);
          min-width: var(--ql7-pc-size);
          min-height: var(--ql7-pc-size);
          flex: 0 0 var(--ql7-pc-size);
          border-radius: 999px;
          isolation: isolate;
          contain: layout paint style;
          pointer-events: none;
          background: transparent;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.07),
            0 0 7px var(--ql7-pc-glow);
        }

        .ql7-premium-coin--market {
          --ql7-pc-size: 42px;
        }

        .ql7-premium-coin--active {
          --ql7-pc-size: 24px;
        }

        .ql7-premium-coin svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
          shape-rendering: geometricPrecision;
        }

        .ql7-premium-coin__shine,
        .ql7-premium-coin__spark {
          opacity: 1;
        }
      `}</style>

      {/* ============ scoped styles ============ */}
      <style jsx>{`
        .battlecoin-panel {
          position: relative;
          margin-top: 32px;
          padding: 18px 20px 22px;
          border-radius: 20px;
          background: radial-gradient(
              circle at top left,
              rgba(0, 255, 195, 0.11),
              transparent 55%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(255, 120, 0, 0.12),
              transparent 60%
            ),
            rgba(5, 10, 35, 0.9);
          backdrop-filter: blur(22px);
          box-shadow: 0 0 0 1px rgba(134, 151, 255, 0.12),
            0 26px 60px rgba(0, 0, 0, 0.75);
          overflow: hidden;
        }

        .battlecoin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
        }

        .battlecoin-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .battlecoin-logo-wrap {
          position: relative;
          width: 150px;
          height: 150px;
          flex-shrink: 0;
        }

        .battlecoin-logo-orbit {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 10%,
            rgba(255, 255, 255, 0.3),
            transparent 55%
          );
          box-shadow: 0 0 0 1px rgba(124, 172, 255, 0),
            0 0 40px rgba(0, 255, 255, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .battlecoin-logo {
          width: 160px;
          height: 160px;
          object-fit: contain;
          z-index: 2;
        }

        .battlecoin-logo-glow {
          position: absolute;
          inset: -30%;
          background: conic-gradient(
            from 0deg,
            rgba(0, 255, 255, 0.1),
            transparent,
            rgba(255, 187, 0, 0.18),
            transparent,
            rgba(0, 255, 255, 0.09)
          );
          mix-blend-mode: screen;
          animation: bc-orbit 10s linear infinite;
        }

        .battlecoin-titles {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .battlecoin-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .battlecoin-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #f8fbff;
          text-shadow: 0 0 26px rgba(0, 255, 255, 0.35);
        }

        .battlecoin-tag {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(200, 215, 255, 0.9);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(116, 151, 255, 0.4);
          background: radial-gradient(
            circle at top left,
            rgba(114, 197, 255, 0.25),
            rgba(15, 23, 66, 0.9)
          );
        }

        .battlecoin-subtitle {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(220, 231, 255, 0.85);
          max-width: 520px;
        }

        .battlecoin-header-right {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 0;
        }

        .battlecoin-balance-block {
          min-width: 245px;
          padding: 8px 9px 8px 12px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: linear-gradient(
              135deg,
              rgba(40, 205, 255, 0.12),
              rgba(17, 24, 80, 0.95)
            ),
            rgba(6, 10, 32, 0.95);
          box-shadow: 0 0 0 1px rgba(138, 201, 255, 0.35),
            0 10px 28px rgba(0, 0, 0, 0.7);
        }

        .battlecoin-balance-main {
          min-width: 0;
        }

        .battlecoin-balance-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(189, 209, 255, 0.8);
          margin-bottom: 4px;
        }

        .battlecoin-balance-value {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .battlecoin-balance-number {
          font-size: 18px;
          font-weight: 700;
          color: #eaffff;
        }

        .battlecoin-balance-asset {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(252, 206, 4, 0.9);
        }

        .battlecoin-header-divider {
          height: 40px;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(133, 164, 255, 0.8),
            transparent
          );
          opacity: 0.65;
        }

        .battlecoin-vip-block {
          display: flex;
          align-items: center;
        }

        .battlecoin-vip-pill {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px 6px 10px;
          border-radius: 999px;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(255, 230, 143, 0.5),
              transparent 55%
            ),
            linear-gradient(
              135deg,
              rgba(23, 15, 3, 1),
              rgba(89, 69, 37, 1),
              rgba(255, 215, 114, 0.95)
            );
          box-shadow: 0 0 0 1px rgba(255, 244, 181, 0.9),
            0 0 26px rgba(255, 214, 102, 0.8);
        }

        .vip-spark {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 20%,
            #fffbe8,
            #ffb91a 55%,
            transparent 70%
          );
          box-shadow: 0 0 18px rgba(255, 222, 135, 0.95);
          animation: vip-pulse 1.4s ease-in-out infinite;
        }

        .vip-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #201200;
        }

        .vip-val {
          font-size: 11px;
          font-weight: 700;
          color: #2b1800;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(255, 248, 215, 0.9);
        }

        .battlecoin-vip-cta {
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid rgba(131, 180, 255, 0.8);
          color: #dfe7ff;
          background: linear-gradient(
            135deg,
            rgba(20, 30, 80, 0.9),
            rgba(54, 87, 179, 0.9)
          );
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.7);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.12s ease-out,
            box-shadow 0.12s ease-out, border-color 0.12s ease-out;
        }

        .battlecoin-vip-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.08),
            transparent 50%,
            rgba(128, 187, 255, 0.4)
          );
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity 0.2s ease-out, transform 0.4s ease-out;
        }

        .battlecoin-vip-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.8);
          border-color: rgba(168, 211, 255, 1);
        }

        .battlecoin-vip-cta:hover::before {
          opacity: 1;
          transform: translateX(0%);
        }

        /* ----------- main layout grid ----------- */
        .battlecoin-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
          grid-template-areas:
            "controls market"
            "active history"
            "chat history";
          gap: 18px;
          align-items: start;
        }

        .battlecoin-left,
        .battlecoin-right {
          display: contents;
        }

        .battlecoin-control-card {
          grid-area: controls;
        }

        .battlecoin-active-card {
          grid-area: active;
        }

        .battle-chat-card {
          grid-area: chat;
        }

        .market-card {
          grid-area: market;
        }

        .history-card {
          grid-area: history;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .battlecoin-card {
          position: relative;
          border-radius: 18px;
          padding: 14px 14px 12px;
          background: radial-gradient(
              circle at top left,
              rgba(80, 111, 255, 0.16),
              transparent 55%
            ),
            rgba(8, 13, 41, 0.98);
          box-shadow: 0 0 0 1px rgba(111, 140, 255, 0.38),
            0 16px 40px rgba(0, 0, 0, 0.78);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .card-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #dde6ff;
        }

        .card-subtitle {
          font-size: 11px;
          color: rgba(180, 199, 255, 0.88);
        }

        .card-status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(173, 196, 255, 0.9);
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: radial-gradient(circle, #24ff95, #0ba65d);
          box-shadow: 0 0 16px rgba(46, 255, 163, 0.9);
        }

        .live-dot.is-pinging {
          animation: live-ping 1.2s ease-out infinite;
        }

        .battlecoin-auth-warning {
          margin-bottom: 12px;
          padding: 10px 11px;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            rgba(255, 214, 80, 0.1),
            rgba(68, 54, 0, 0.95)
          );
          border: 1px solid rgba(255, 241, 156, 0.9);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .auth-text {
          font-size: 12px;
          color: #fff5d6;
        }

        .battlecoin-auth-btn {
          flex-shrink: 0;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: radial-gradient(
            circle at 30% 0%,
            #ffffff,
            #ffe68a
          );
          color: #221400;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.85);
          transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
        }

        .battlecoin-auth-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.95);
        }

        .control-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(68, 89, 167, 0.85);
        }

        .control-section.two-cols {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: 10px;
        }

        .control-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }

        .control-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(190, 207, 255, 0.96);
        }

        .control-extra {
          font-size: 11px;
          color: rgba(149, 173, 255, 0.9);
        }

        .battlecoin-leverage-grid {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 4px;
        }

        .lever-btn {
          position: relative;
          border-radius: 10px;
          padding: 6px 4px;
          font-size: 11px;
          border: 1px solid rgba(81, 109, 190, 0.7);
          background: radial-gradient(
            circle at top,
            rgba(75, 118, 255, 0.3),
            rgba(12, 19, 58, 1)
          );
          color: #caddff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: border-color 0.1s ease-out,
            box-shadow 0.1s ease-out, transform 0.1s ease-out,
            background 0.1s ease-out;
        }

        .lever-val {
          font-weight: 600;
        }

        .lever-vip-tag {
          font-size: 9px;
          padding: 0 4px;
          border-radius: 999px;
          background: rgba(255, 215, 120, 0.15);
          color: rgba(255, 230, 170, 0.98);
        }

        .lever-btn.is-active {
          border-color: rgba(122, 255, 214, 0.95);
          box-shadow: 0 0 0 1px rgba(100, 255, 219, 0.8),
            0 0 24px rgba(25, 255, 200, 0.65);
          transform: translateY(-1px);
          background: radial-gradient(
            circle at top,
            rgba(40, 255, 200, 0.36),
            rgba(12, 19, 58, 1)
          );
        }

        .lever-btn.is-disabled {
          opacity: 0.45;
          cursor: default;
        }

        .control-field {
          min-width: 0;
        }

        .stake-input-row {
          display: flex;
          align-items: stretch;
          gap: 6px;
        }

        .stake-input {
          flex: 1;
          border-radius: 10px;
          padding: 7px 9px;
          border: 1px solid rgba(57, 79, 157, 0.9);
          background: rgba(0, 0, 0, 0.45);
          color: #e7eeff;
          font-size: 13px;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(4, 7, 22, 0.4);
        }

        .stake-input:focus {
          border-color: rgba(145, 227, 255, 0.95);
          box-shadow: 0 0 0 1px rgba(53, 193, 255, 0.9);
        }

        .stake-max-btn {
          border-radius: 10px;
          padding: 6px 10px;
          border: 1px solid rgba(106, 149, 255, 0.9);
          background: radial-gradient(
            circle at 0 0,
            rgba(147, 201, 255, 0.3),
            rgba(26, 43, 104, 0.95)
          );
          color: #edf3ff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.85);
          transition: transform 0.1s ease-out,
            box-shadow 0.1s ease-out, border-color 0.1s ease-out;
        }

        .stake-max-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(164, 206, 255, 1);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.9);
        }

        .stake-max-btn:disabled {
          opacity: 0.45;
          cursor: default;
          box-shadow: none;
        }

        .balance-line {
          margin-top: 4px;
          font-size: 11px;
          color: rgba(171, 192, 255, 0.92);
        }

        .balance-caption {
          opacity: 0.85;
        }

        .balance-num {
          margin-left: 4px;
          font-weight: 500;
        }

        .symbol-select-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .symbol-coin-preview {
          display: inline-grid;
          place-items: center;
          width: 42px;
          height: 42px;
          min-width: 42px;
          min-height: 42px;
          flex: 0 0 42px;
          align-self: center;
          background: transparent;
        }

        .symbol-select {
          flex: 1;
          border-radius: 10px;
          padding: 6px 8px;
          border: 1px solid rgba(62, 90, 173, 0.9);
          background: rgba(1, 6, 24, 0.95);
          color: #dbe5ff;
          font-size: 12px;
        }

        .longshort-row {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ls-btn {
          position: relative;
          border-radius: 13px;
          padding: 10px 10px 11px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          overflow: hidden;
          isolation: isolate;
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.85),
            inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          transform-origin: center;
          transition: transform 0.12s ease-out, box-shadow 0.12s ease-out,
            opacity 0.12s ease-out, filter 0.12s ease-out;
        }

        .ls-btn::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 36%),
            radial-gradient(circle at 85% 18%, rgba(255, 255, 255, 0.22), transparent 24%);
          opacity: 0.6;
          pointer-events: none;
          z-index: 0;
        }

        .ls-btn:disabled {
          opacity: 0.45;
          cursor: default;
          box-shadow: none;
        }

        .ls-btn.is-opening {
          opacity: 0.92;
          cursor: wait;
          filter: saturate(1.18) brightness(1.07);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.22),
            0 18px 52px rgba(0, 0, 0, 0.92),
            0 0 26px rgba(103, 232, 249, 0.2);
        }

        .ls-label {
          position: relative;
          z-index: 2;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #050b14;
        }

        .ls-sub {
          position: relative;
          z-index: 2;
          font-size: 11px;
          color: rgba(6, 12, 20, 0.75);
        }

        .ls-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          z-index: 3;
          width: 18px;
          height: 18px;
          margin-top: -9px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.32);
          border-top-color: rgba(255, 255, 255, 0.96);
          border-right-color: rgba(103, 232, 249, 0.86);
          box-shadow:
            0 0 12px rgba(255, 255, 255, 0.38),
            0 0 18px rgba(103, 232, 249, 0.26);
          animation: battlecoin-order-spin 0.82s linear infinite;
        }

        .ls-glow {
          position: absolute;
          inset: -40%;
          opacity: 0.55;
          mix-blend-mode: screen;
          pointer-events: none;
          animation: ls-flow 6s linear infinite;
        }

        .ls-long {
          background: radial-gradient(
              circle at 0 0,
              rgba(255, 255, 255, 0.7),
              transparent 55%
            ),
            linear-gradient(135deg, #00ffb0, #00c574, #027d4b);
        }

        .ls-long .ls-glow {
          background: conic-gradient(
            from 0deg,
            rgba(0, 255, 195, 0.6),
            transparent 35%,
            rgba(255, 255, 255, 0.4),
            transparent 70%,
            rgba(0, 255, 195, 0.6)
          );
        }

        .ls-short {
          background: radial-gradient(
              circle at 0 0,
              rgba(255, 255, 255, 0.7),
              transparent 55%
            ),
            linear-gradient(135deg, #ff4b6a, #c41a45, #7d0225);
        }

        .ls-short .ls-glow {
          background: conic-gradient(
            from 0deg,
            rgba(255, 77, 122, 0.7),
            transparent 35%,
            rgba(255, 255, 255, 0.4),
            transparent 70%,
            rgba(255, 77, 122, 0.7)
          );
        }

        .ls-btn:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.95);
        }

        .ls-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.995);
        }

        /* ---------- active order ---------- */
        .active-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr) 0.9fr;
          gap: 12px;
          margin-top: 8px;
        }

        .active-info,
        .active-prices {
          border-radius: 12px;
          padding: 9px 10px;
          background: radial-gradient(
            circle at top,
            rgba(103, 139, 255, 0.25),
            rgba(10, 16, 53, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(88, 112, 194, 0.9);
        }

        .active-prices {
          background: radial-gradient(
            circle at top,
            rgba(0, 240, 180, 0.25),
            rgba(6, 22, 40, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(83, 190, 178, 0.9);
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: rgba(192, 208, 255, 0.9);
        }

        .info-row + .info-row {
          margin-top: 5px;
        }

        .info-label {
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 10px;
          opacity: 0.75;
        }

        .info-value {
          font-weight: 600;
          color: #eff4ff;
        }

        .info-symbol {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .info-symbol :global(.ql7-premium-coin) {
          flex: 0 0 auto;
        }

        .info-side {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .info-side.is-long {
          background: rgba(0, 255, 175, 0.12);
          color: #5affc0;
          border: 1px solid rgba(60, 252, 184, 0.9);
        }

        .info-side.is-short {
          background: rgba(255, 87, 119, 0.14);
          color: #ff85ae;
          border: 1px solid rgba(255, 111, 145, 0.95);
        }

        .value-glow.is-pos {
          color: #6fffcd;
          text-shadow: 0 0 16px rgba(72, 255, 207, 0.9);
        }

        .value-glow.is-neg {
          color: #ff7d9d;
          text-shadow: 0 0 16px rgba(255, 119, 164, 0.9);
        }

        .active-timer {
          border-radius: 12px;
          padding: 9px 10px;
          background: radial-gradient(
            circle at top,
            rgba(255, 199, 92, 0.23),
            rgba(26, 18, 0, 1)
          );
          box-shadow: inset 0 0 0 1px rgba(255, 214, 126, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .timer-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255, 239, 198, 0.9);
        }

        .timer-value {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #fffbdd;
        }

        .timer-value.is-pulsing {
          animation: timer-pulse 0.8s ease-in-out infinite;
        }

        .timer-settle-btn {
          margin-top: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          border: none;
          background: rgba(26, 20, 8, 0.92);
          color: rgba(255, 229, 176, 0.98);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .empty-active {
          padding: 10px;
          border-radius: 12px;
          background: rgba(2, 8, 28, 0.9);
          border: 1px dashed rgba(79, 117, 189, 0.8);
        }

        .empty-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(104, 143, 219, 0.9);
          font-size: 11px;
          color: rgba(200, 217, 255, 0.98);
        }

        .empty-text {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(156, 180, 242, 0.9);
        }

        /* ---------- market ---------- */
        .market-card {
          max-height: 360px;
          min-height: 360px;
        }

        .market-table {
          margin-top: 4px;
        }

        .market-head {
          display: grid;
          grid-template-columns: 32px minmax(0, 1.5fr) 1fr 1fr;
          padding: 5px 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(167, 189, 255, 0.9);
          border-radius: 10px;
          background: rgba(0, 0, 0, 1);
        }

        .market-body {
          margin-top: 4px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .market-row {
          width: 100%;
          border: none;
          background: transparent;
          padding: 4px 6px;
          margin-bottom: 1px;
          border-radius: 9px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1.5fr) 1fr 1fr;
          align-items: center;
          font-size: 11px;
          color: rgba(207, 220, 255, 0.96);
          cursor: pointer;
          transition: background 0.08s ease-out,
            transform 0.08s ease-out, box-shadow 0.08s ease-out;
        }

        .market-row:hover:not(:disabled) {
          background: rgba(36, 54, 109, 0.85);
          transform: translateY(-0.5px);
        }

        .market-row.is-selected {
          background: rgba(68, 104, 205, 0.95);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.85);
        }

        .market-row:disabled {
          cursor: default;
          opacity: 0.5;
        }

        .mb-col.idx,
        .mh-col.idx {
          text-align: left;
        }

        .mb-col.price,
        .mh-col.price,
        .mb-col.change,
        .mh-col.change {
          text-align: right;
        }

        .mb-col.symbol {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mb-col.symbol :global(.ql7-premium-coin) {
          flex: 0 0 auto;
        }

        .symbol-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mb-col.change.is-pos,
        .hb-col.change.is-pos {
          color: #62ffb9;
        }

        .mb-col.change.is-neg,
        .hb-col.change.is-neg {
          color: #ff869f;
        }

        /* ---------- history ---------- */
        .history-card {
          min-height: 370px;
          max-height: none;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .history-header {
          align-items: flex-end;
        }

        .history-tabs {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.95);
          box-shadow: inset 0 0 0 1px rgba(6, 29, 32, 0.9);
          gap: 3px;
        }

        .history-tab {
          border: none;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(186, 205, 255, 0.85);
          background: transparent;
          cursor: pointer;
          transition: background 0.1s ease-out,
            color 0.1s ease-out, transform 0.1s ease-out;
        }

        .history-tab.is-active {
          background: linear-gradient(
            135deg,
            rgba(117, 170, 255, 1),
            rgba(78, 123, 255, 1)
          );
          color: #050a1c;
          transform: translateY(-0.5px);
        }

        .no-history {
          margin-top: 10px;
          font-size: 11px;
          color: rgba(168, 191, 255, 0.9);
        }

        .history-table {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          margin-top: 6px;
          min-height: 0;
          min-width: 720px;
        }

        .history-head {
          display: grid;
          grid-template-columns:
            32px minmax(0, 1.3fr) 0.9fr 0.7fr 0.9fr 1fr 0.9fr 0.9fr 0.9fr;
          padding: 5px 6px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.95);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(171, 193, 255, 0.9);
        }

        .history-body {
          flex: 1 1 auto;
          margin-top: 3px;
          min-height: 0;
          max-height: none;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 2px;
        }

        .history-row {
          display: grid;
          grid-template-columns:
            32px minmax(0, 1.3fr) 0.9fr 0.7fr 0.9fr 1fr 0.9fr 0.9fr 0.9fr;
          padding: 4px 6px;
          font-size: 11px;
          color: rgba(205, 218, 255, 0.96);
          border-radius: 9px;
          margin-bottom: 1px;
          background: transparent;
          transition: background 0.08s ease-out,
            box-shadow 0.08s ease-out, transform 0.08s ease-out;
        }

        .history-row.is-active {
          background: rgba(52, 92, 195, 0.9);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.9);
        }

        .history-row:hover {
          background: rgba(37, 59, 132, 0.9);
          transform: translateY(-0.5px);
        }

        .hb-col.side.is-long {
          color: #77ffd0;
        }

        .hb-col.side.is-short {
          color: #ff8bac;
        }

        .hb-col.idx,
        .hh-col.idx {
          text-align: left;
        }

        .hb-col.price,
        .hb-col.change,
        .hb-col.pnl,
        .hh-col.price,
        .hh-col.change,
        .hh-col.pnl {
          text-align: right;
        }

        /* ---------- scrollbars ---------- */
        .market-body::-webkit-scrollbar,
        .history-body::-webkit-scrollbar {
          width: 5px;
        }
        .market-body::-webkit-scrollbar-track,
        .history-body::-webkit-scrollbar-track {
          background: rgba(6, 10, 36, 0.9);
        }
        .market-body::-webkit-scrollbar-thumb,
        .history-body::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(126, 164, 255, 0.9),
            rgba(46, 89, 194, 0.9)
          );
          border-radius: 999px;
        }

        /* ---------- loading & error ---------- */
        .battlecoin-loading-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at top,
              rgba(10, 22, 61, 0.96),
              rgba(4, 6, 20, 0.96)
            );
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .battlecoin-spinner {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 3px solid rgba(70, 110, 205, 0.25);
          border-top-color: rgba(109, 189, 255, 0.95);
          animation: spin 0.7s linear infinite;
        }

        .battlecoin-error {
          margin-top: 10px;
          font-size: 11px;
          color: #ffc6d3;
        }
  /* --- MOBILE: history table = единый горизонтальный скролл --- */

  /* Горизонтальный скролл одной лентой: шапка + строки вместе */
  .battlecoin-card.history-card {
    overflow-x: auto;
  }

  /* Общая ширина таблицы истории */
  .history-table {
    min-width: 720px; /* при желании можно поменять число */
  }

  /* Вертикальный скролл только у списка, без второй горизонтальной полосы */
  .history-body {
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Агрессивный перенос текста, чтобы подписи/значения держались в своих колонках */
  .history-head .hh-col,
  .history-body .hb-col {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: normal;
  }

        /* ---------- animations ---------- */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bc-orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes vip-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.16);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes live-ping {
          0% {
            box-shadow: 0 0 0 0 rgba(71, 255, 181, 0.85);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(71, 255, 181, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(71, 255, 181, 0);
          }
        }

        @keyframes battlecoin-order-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ls-flow {
          0% {
            transform: translate(-5%, -5%) rotate(0deg);
          }
          100% {
            transform: translate(5%, 5%) rotate(360deg);
          }
        }

        @keyframes timer-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.09);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes battlecoin-wallet-pulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.64;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        /* Золотая надпись с переливом и свечением для VIP */
        .qcoinLabel{
          font-size:1.6em;
          font-weight:900;
          letter-spacing:.4px;
          background:
            linear-gradient(135deg,
              #7a5c00 0%,
              #ffd700 18%,
              #fff4b3 32%,
              #ffd700 46%,
              #ffea80 60%,
              #b38400 74%,
              #ffd700 88%,
              #7a5c00 100%);
          background-size:200% 100%;
          -webkit-background-clip:text;
          background-clip:text;
          color:transparent;
          animation:qcoinShine 6s linear infinite,
                   qcoinGlow 2.8s ease-in-out infinite;
          text-shadow:
            0 0 .3rem rgba(255,215,0,.35),
            0 0 .1rem rgba(255,255,180,.35);
        }

        @keyframes qcoinShine{
          0%  { background-position:0% 50%; }
          100%{ background-position:200% 50%; }
        }

        @keyframes qcoinGlow{
          0%{
            text-shadow:
              0 0 .3rem rgba(255,215,0,.35),
              0 0 .1rem rgba(255,255,180,.35);
          }
          50%{
            text-shadow:
              0 0 .9rem rgba(255,215,0,.55),
              0 0 .25rem rgba(255,255,190,.55);
          }
          100%{
            text-shadow:
              0 0 .3rem rgba(255,215,0,.35),
              0 0 .1rem rgba(255,255,180,.35);
          }
        }

        /* ---------- MetaMarket-aligned BattleCoin surface ---------- */
        .battlecoin-panel {
          --bc-cyan: rgba(103, 232, 249, 0.92);
          --bc-gold: rgba(250, 204, 21, 0.9);
          --bc-violet: rgba(168, 85, 247, 0.72);
          --bc-ink: rgba(2, 8, 20, 0.94);
          --bc-ink-soft: rgba(9, 16, 30, 0.78);
          --bc-line: rgba(125, 211, 252, 0.34);
          --bc-line-gold: rgba(250, 204, 21, 0.28);
          isolation: isolate;
          padding: clamp(14px, 2vw, 22px);
          border: 1px solid var(--bc-line);
          border-radius: 26px;
          background:
            linear-gradient(90deg, rgba(103, 232, 249, 0.18), transparent 16%, transparent 84%, rgba(250, 204, 21, 0.16)),
            radial-gradient(circle at 12% 0%, rgba(103, 232, 249, 0.18), transparent 32%),
            radial-gradient(circle at 90% 10%, rgba(250, 204, 21, 0.14), transparent 34%),
            linear-gradient(145deg, rgba(4, 13, 27, 0.92), rgba(2, 8, 20, 0.98));
          box-shadow:
            0 32px 90px rgba(0, 0, 0, 0.64),
            0 0 44px rgba(34, 211, 238, 0.12),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .battlecoin-panel::before,
        .battlecoin-panel::after {
          content: '';
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .battlecoin-panel::before {
          inset: 0;
          background-image:
            linear-gradient(rgba(103, 232, 249, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103, 232, 249, 0.035) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(circle at center, black, transparent 88%);
        }

        .battlecoin-panel::after {
          inset: 0;
          background: linear-gradient(180deg, transparent, rgba(103, 232, 249, 0.08), transparent);
          opacity: 0.5;
        }

        .battlecoin-panel > * {
          position: relative;
          z-index: 1;
        }

        .battlecoin-panel > .battlecoin-loading-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          min-height: 100%;
          border-radius: inherit;
          background:
            radial-gradient(circle at 50% 38%, rgba(38, 122, 185, 0.2), transparent 34%),
            linear-gradient(135deg, rgba(6, 18, 55, 0.97), rgba(3, 7, 25, 0.97));
          box-shadow:
            inset 0 0 0 1px rgba(103, 232, 249, 0.18),
            inset 0 0 70px rgba(0, 0, 0, 0.38);
          pointer-events: auto;
        }

        .battlecoin-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, auto);
          align-items: center;
          gap: clamp(14px, 2.4vw, 28px);
          margin-bottom: 22px;
        }

        .battlecoin-header-left {
          display: grid;
          grid-template-columns: clamp(96px, 13vw, 148px) minmax(0, 1fr);
          align-items: center;
          gap: clamp(12px, 1.8vw, 18px);
        }

        .battlecoin-logo-wrap {
          width: clamp(96px, 13vw, 148px);
          height: clamp(96px, 13vw, 148px);
        }

        .battlecoin-logo-orbit {
          background:
            radial-gradient(circle at 38% 22%, rgba(250, 204, 21, 0.13), transparent 42%),
            radial-gradient(circle at 64% 62%, rgba(103, 232, 249, 0.12), transparent 44%),
            rgba(2, 8, 20, 0.36);
        }

        .battlecoin-title {
          margin: 0;
          font-size: clamp(19px, 2.5vw, 25px);
          font-weight: 950;
          line-height: 1.08;
          color: rgba(246, 253, 255, 0.98);
          text-shadow:
            0 0 18px rgba(103, 232, 249, 0.24),
            0 0 26px rgba(250, 204, 21, 0.12);
        }

        .battlecoin-title-row {
          gap: 8px;
        }

        .battlecoin-tag {
          display: inline-flex;
          max-width: 100%;
          min-height: 24px;
          align-items: center;
          white-space: nowrap;
          border-color: rgba(125, 211, 252, 0.42);
          background:
            linear-gradient(120deg, rgba(34, 211, 238, 0.16), rgba(250, 204, 21, 0.12), rgba(168, 85, 247, 0.13)),
            rgba(2, 8, 20, 0.58);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        .battlecoin-subtitle {
          margin: 0;
          max-width: 58ch;
          color: rgba(218, 241, 246, 0.9);
        }

        .battlecoin-header-right {
          min-width: 0;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 12px;
        }

        .battlecoin-balance-block {
          flex: 1 1 310px;
          min-width: min(310px, 100%);
          max-width: 430px;
          border: 1px solid rgba(125, 211, 252, 0.36);
          background:
            linear-gradient(120deg, rgba(34, 211, 238, 0.14), rgba(250, 204, 21, 0.08), rgba(168, 85, 247, 0.1)),
            rgba(2, 8, 20, 0.7);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            0 18px 38px rgba(0, 0, 0, 0.48);
        }

        .battlecoin-balance-number {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(240, 253, 255, 0.98);
        }

        .battlecoin-balance-asset {
          color: var(--bc-gold);
        }

        .battlecoin-header-divider {
          background: linear-gradient(to bottom, transparent, rgba(103, 232, 249, 0.54), rgba(250, 204, 21, 0.36), transparent);
        }

        .battlecoin-vip-block {
          min-width: 116px;
          justify-content: flex-end;
        }

        .battlecoin-vip-pill,
        .battlecoin-vip-cta {
          min-height: 42px;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .battlecoin-vip-cta {
          border-color: rgba(250, 204, 21, 0.64);
          background:
            linear-gradient(120deg, rgba(15, 23, 42, 0.82), rgba(34, 211, 238, 0.16), rgba(250, 204, 21, 0.18));
          color: rgba(248, 252, 255, 0.96);
          box-shadow:
            0 16px 34px rgba(0, 0, 0, 0.52),
            0 0 22px rgba(250, 204, 21, 0.16);
        }

        .battlecoin-card {
          border: 1px solid var(--bc-line);
          border-radius: 22px;
          background:
            linear-gradient(90deg, rgba(103, 232, 249, 0.12), transparent 24%, transparent 76%, rgba(250, 204, 21, 0.1)),
            radial-gradient(circle at 0 0, rgba(103, 232, 249, 0.14), transparent 44%),
            rgba(2, 8, 20, 0.7);
          box-shadow:
            0 22px 54px rgba(0, 0, 0, 0.52),
            inset 0 0 0 1px rgba(255, 255, 255, 0.035);
        }

        .card-title {
          color: rgba(236, 254, 255, 0.94);
        }

        .card-subtitle,
        .control-extra,
        .balance-line {
          color: rgba(202, 231, 238, 0.82);
        }

        .control-section {
          border-top-color: rgba(103, 232, 249, 0.26);
        }

        .battlecoin-leverage-grid {
          grid-template-columns: repeat(auto-fit, minmax(62px, 1fr));
          gap: 6px;
        }

        .lever-btn,
        .stake-max-btn,
        .symbol-select,
        .stake-input,
        .history-tab {
          border-color: rgba(125, 211, 252, 0.34);
          background:
            linear-gradient(120deg, rgba(15, 23, 42, 0.76), rgba(34, 211, 238, 0.1), rgba(168, 85, 247, 0.1));
        }

        .lever-btn {
          min-height: 40px;
          justify-content: center;
        }

        .lever-btn.is-active {
          border-color: rgba(103, 232, 249, 0.92);
          background:
            linear-gradient(120deg, rgba(34, 211, 238, 0.24), rgba(250, 204, 21, 0.18), rgba(168, 85, 247, 0.14));
          box-shadow:
            0 0 0 1px rgba(103, 232, 249, 0.45),
            0 0 24px rgba(34, 211, 238, 0.32);
        }

        .lever-vip-tag,
        .vip-val {
          background: rgba(255, 248, 215, 0.92);
          color: rgba(36, 22, 0, 0.95);
        }

        .battlecoin-auth-warning {
          border-color: rgba(250, 204, 21, 0.62);
          background:
            linear-gradient(120deg, rgba(250, 204, 21, 0.15), rgba(2, 8, 20, 0.66)),
            rgba(58, 42, 0, 0.32);
        }

        .longshort-row {
          gap: 12px;
        }

        .ls-btn {
          min-height: 58px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
        }

        .ls-label,
        .ls-sub {
          position: relative;
          z-index: 1;
        }

        .ls-label {
          color: rgba(2, 8, 20, 0.92);
        }

        .market-head,
        .history-head,
        .history-tabs {
          background: rgba(1, 5, 14, 0.76);
        }

        .market-row.is-selected,
        .history-tab.is-active,
        .history-row.is-active {
          background:
            linear-gradient(120deg, rgba(34, 211, 238, 0.22), rgba(250, 204, 21, 0.15), rgba(168, 85, 247, 0.16)),
            rgba(15, 23, 42, 0.88);
          color: rgba(245, 253, 255, 0.98);
        }

        .history-table {
          min-width: 720px;
        }

        .history-head .hh-col,
        .history-body .hb-col,
        .market-head .mh-col,
        .market-body .mb-col {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          word-break: normal;
        }

        .market-row.is-selected :global(.ql7-premium-coin) {
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.18),
            0 0 17px var(--ql7-pc-glow);
        }

        /* ---------- responsive ---------- */
        @media (max-width: 1100px) {
          .battlecoin-layout {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas:
              "controls"
              "active"
              "market"
              "history"
              "chat";
          }

          .battlecoin-header {
            grid-template-columns: minmax(0, 1fr);
            align-items: flex-start;
          }

          .battlecoin-header-right {
            align-self: stretch;
            justify-content: flex-start;
          }

          .battlecoin-header-divider {
            display: none;
          }

          .battlecoin-right .battlecoin-card {
            max-height: none;
          }

          .market-card,
          .history-card {
            max-height: none;
          }
          /* Premium compact exchange surface. Keep this inside the 1100px branch:
             it is the tablet/narrow layout that used to break badges into letters. */
  .battlecoin-panel {
    margin-top: 18px;
    padding: 14px 12px 16px;
    border-radius: 18px;
  }

          .battlecoin-header-left {
            grid-template-columns: 110px minmax(0, 1fr);
            align-items: flex-start;
          }

  .battlecoin-logo-wrap {
    width: 110px;
    height: 110px;
  }

  .battlecoin-title {
    font-size: 18px;
  }

  .battlecoin-subtitle {
    font-size: 12px;
  }

  .active-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .battlecoin-card {
    padding: 11px 10px 10px;
  }

  .battlecoin-leverage-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .control-section.two-cols {
    grid-template-columns: minmax(0, 1fr);
  }

  .timer-value {
    font-size: 24px;
  }

  .ls-btn {
    padding: 9px 9px 10px;
  }

  /* --- MOBILE: history table = единый горизонтальный скролл --- */

  /* Горизонтальный скролл одной лентой: шапка + строки вместе */
  .battlecoin-card.history-card {
    overflow-x: auto;
  }

  /* Общая ширина таблицы истории */
  .history-table {
    min-width: 720px; /* при желании можно поменять число */
  }

  /* Вертикальный скролл только у списка, без второй горизонтальной полосы */
  .history-body {
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Агрессивный перенос текста, чтобы подписи/значения держались в своих колонках */
  .history-head .hh-col,
  .history-body .hb-col {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: normal;
  }
}

        @media (max-width: 520px) {
          .battlecoin-header-left {
            grid-template-columns: 74px minmax(0, 1fr);
            gap: 10px;
          }

          .battlecoin-logo-wrap {
            width: 74px;
            height: 74px;
          }

          .battlecoin-logo {
            width: 92px;
            height: 92px;
          }

          .battlecoin-title-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .battlecoin-tag {
            max-width: 100%;
            font-size: 9px;
            letter-spacing: 0.12em;
          }

          .battlecoin-header-right {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .battlecoin-balance-block {
            width: 100%;
            min-width: 0;
          }

          .battlecoin-vip-block {
            width: 100%;
            justify-content: flex-start;
          }

          .battlecoin-vip-pill {
            width: 100%;
          }

          .battlecoin-vip-cta {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .longshort-row {
            grid-template-columns: minmax(0, 1fr);
          }

          .timer-value {
            font-size: 26px;
          }

          .battlecoin-card.history-card {
            max-height: 320px;
          }
        }

        /* Final responsive hardening for the MetaMarket BattleCoin surface.
           Keeps the wallet launch component intact while preventing header badges,
           the balance capsule, VIP control, and native symbol dropdown from
           collapsing into broken columns on narrow viewports. */
        .battlecoin-header {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
        }

        .battlecoin-header-right {
          display: flex;
          min-width: 0;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
        }

        .battlecoin-balance-block {
          flex: 0 1 350px;
          min-width: min(270px, 100%);
          max-width: 370px;
          padding: 7px 8px 7px 12px;
        }

        .battlecoin-balance-main {
          min-width: 0;
        }

        .battlecoin-balance-value {
          display: flex;
          min-width: 0;
          align-items: baseline;
          gap: 6px;
          white-space: nowrap;
        }

        .battlecoin-balance-number {
          flex: 0 1 auto;
          min-width: 0;
          overflow: visible;
          color: rgba(240, 253, 255, 0.98);
          font-size: clamp(10px, 1.18vw, 18px);
          line-height: 1.05;
          text-overflow: clip;
          white-space: nowrap;
        }

        .battlecoin-balance-asset {
          flex: 0 0 auto;
          font-size: clamp(11px, 0.95vw, 15px);
        }

        .battlecoin-vip-block {
          min-width: max-content;
        }

        .battlecoin-vip-pill,
        .battlecoin-vip-cta {
          width: max-content;
          min-width: 120px;
          max-width: 100%;
          padding-inline: 14px;
        }

        .symbol-select {
          min-width: 0;
          color-scheme: dark;
          appearance: auto;
          border: 1px solid rgba(103, 232, 249, 0.46);
          background:
            linear-gradient(120deg, rgba(2, 8, 20, 0.96), rgba(16, 31, 45, 0.96)),
            rgba(2, 8, 20, 0.98);
          color: rgba(235, 253, 255, 0.98);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 10px 24px rgba(0, 0, 0, 0.28);
        }

        .symbol-select:focus {
          border-color: rgba(250, 204, 21, 0.72);
          outline: none;
          box-shadow:
            0 0 0 1px rgba(250, 204, 21, 0.28),
            0 0 24px rgba(34, 211, 238, 0.18);
        }

        .symbol-select option {
          background: #06111f;
          color: #e8fbff;
        }

        .control-section.two-cols {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
          gap: 12px;
        }

        .stake-input-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          min-width: 0;
        }

        .stake-input {
          min-width: 0;
        }

        .stake-max-btn {
          min-width: 52px;
          white-space: nowrap;
        }

        .symbol-select-row {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 8px;
          min-width: 0;
          align-items: center;
        }

        @media (max-width: 1320px) {
          .battlecoin-header {
            grid-template-columns: minmax(0, 1fr);
            align-items: start;
          }

          .battlecoin-header-right {
            justify-content: flex-start;
          }
        }

        @media (max-width: 680px) {
          .battlecoin-header-left {
            grid-template-columns: 82px minmax(0, 1fr);
            align-items: center;
          }

          .battlecoin-logo-wrap {
            width: 82px;
            height: 82px;
          }

          .battlecoin-logo {
            width: 104px;
            height: 104px;
          }

          .battlecoin-title-row {
            align-items: center;
            flex-direction: row;
            gap: 7px;
          }

          .battlecoin-tag {
            overflow: hidden;
            max-width: 100%;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .battlecoin-header-right {
            display: grid;
            width: 100%;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
          }

          .battlecoin-balance-block {
            width: 100%;
            min-width: 0;
            max-width: none;
          }

          .battlecoin-balance-number {
            font-size: clamp(10px, 2.9vw, 16px);
          }

          .battlecoin-balance-asset {
            font-size: clamp(10px, 2.45vw, 13px);
          }

          .battlecoin-vip-block {
            width: auto;
            justify-content: flex-start;
          }

          .battlecoin-vip-pill,
          .battlecoin-vip-cta {
            width: max-content;
            min-width: 116px;
          }
        }

        @media (max-width: 440px) {
          .battlecoin-header-left {
            grid-template-columns: 62px minmax(0, 1fr);
          }

          .battlecoin-logo-wrap {
            width: 62px;
            height: 62px;
          }

          .battlecoin-logo {
            width: 82px;
            height: 82px;
          }

          .battlecoin-header-right {
            grid-template-columns: minmax(0, 1fr);
          }

          .battlecoin-vip-pill,
          .battlecoin-vip-cta {
            width: fit-content;
            min-width: 128px;
          }

          .symbol-select-row {
            grid-template-columns: 42px minmax(0, 1fr);
            align-items: center;
          }

          .symbol-select {
            width: 100%;
            min-width: 0;
          }
        }

        /* Final history-scroll contract: the history card header stays fixed.
           Only the table viewport scrolls; its vertical scrollbar remains on
           the visible right edge while rows can scroll horizontally. */
        .battlecoin-card.history-card {
          --battle-history-desktop-height: 790px;
          --battle-history-stacked-height: 360px;
          display: flex;
          flex-direction: column;
          align-self: stretch;
          height: var(--battle-history-desktop-height);
          min-height: 0;
          max-height: var(--battle-history-desktop-height);
          overflow-x: hidden;
          overflow-y: hidden;
        }

        .history-card .history-header {
          flex: 0 0 auto;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(96, 236, 255, 0.18);
        }

        .history-card .no-history {
          flex: 0 0 auto;
        }

        .history-card .history-table {
          flex: 1 1 auto;
          min-height: 0;
          min-width: 0;
          overflow: auto;
          scrollbar-gutter: stable both-edges;
          overscroll-behavior: contain;
        }

        .history-card .history-head,
        .history-card .history-row {
          min-width: 720px;
        }

        .history-card .history-head {
          position: sticky;
          top: 0;
          z-index: 3;
          border-bottom: 1px solid rgba(96, 236, 255, 0.2);
        }

        .history-card .history-head .hh-col,
        .history-card .history-row .hb-col {
          min-width: 0;
          padding-inline: 6px;
          border-right: 1px solid rgba(96, 236, 255, 0.12);
        }

        .history-card .history-head .hh-col:last-child,
        .history-card .history-row .hb-col:last-child {
          border-right: 0;
        }

        .history-card .history-row {
          border-bottom: 1px solid rgba(96, 236, 255, 0.12);
          border-radius: 0;
        }

        .history-card .history-body {
          display: block;
          max-height: none;
          overflow: visible;
          padding-right: 0;
        }

        @media (max-width: 1100px) {
          .battlecoin-card.history-card {
            height: auto;
            max-height: var(--battle-history-stacked-height);
          }

          .history-card .history-table {
            max-height: 275px;
          }

          .history-card .history-body {
            max-height: none;
          }
        }

        @media (max-width: 520px) {
          .battlecoin-card.history-card {
            max-height: 340px;
          }

          .history-card .history-table {
            max-height: 255px;
          }

          .history-card .history-body {
            max-height: none;
          }
        }
      `}</style>
    </section>
  )
}
