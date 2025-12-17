'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useI18n } from './i18n'

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

// Единая выборка корректного EVM-провайдера (EIP-1193 / EIP-6963)
function pickEthereum() {
  try {
    if (typeof window === 'undefined') return null
    const eth = window.ethereum
    if (!eth) return null
    if (Array.isArray(eth.providers) && eth.providers.length) {
      const mm = eth.providers.find(p => p && p.isMetaMask)
      const brave = eth.providers.find(p => p && p.isBraveWallet)
      const okx = eth.providers.find(p => p && p.isOkxWallet)
      return (mm || brave || okx || eth)
    }
    return eth
  } catch { return null }
}

// ---------- helpers ----------
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

    // 1) Внутри Telegram Mini App
    if (isTG && tg) {
      // 1a) Если это ссылка на бота / чат t.me → используем openTelegramLink
      if (tgLink && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(url)
        return
      }

      // 1b) Любой внешний http(s) → обычный openLink
      if (typeof tg.openLink === 'function') {
        tg.openLink(url)
        return
      }
    }

    // 2) iOS (особенно PWA/иконка на домашнем экране) → лучше прямой переход
    if (isIOS || isStandalone) {
      window.location.href = url
      return
    }

    // 3) Обычный браузер
    const w = window.open(url, '_blank', 'noopener,noreferrer')

    // если попап заблокировали — фоллбек
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
    const c1 = readCookie('asherId') // fallback — ставится /api/tma/auto
    return (a1 || a2 || a3 || c1) ? String(a1 || a2 || a3 || c1) : null
  } catch {
    return null
  }
}

// Строгое определение настоящего Mini App
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

// ================= component =================
export default function AuthNavClient() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const [authMethod, setAuthMethod] = useState(null)
  const [mounted, setMounted] = useState(false)
  const announcedRef = useRef(false)
  const prevConnectedRef = useRef(isConnected)

  // --- режим "мы внутри TMA" + статус автологина через /api/tma/auto
  const [isTMA, setIsTMA] = useState(false)
  const [tmaAuthed, setTmaAuthed] = useState(false)

  // TG link status
  const [tgLinked, setTgLinked] = useState(false)
  const checkingRef = useRef(false)

  // ===== BRIDGE refs (чтобы главная могла дергать без красноты/зависимостей) =====
  const tgLinkedRef = useRef(false)
  const linkFnRef = useRef(null)
  const refreshFnRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    setIsTMA(detectTMAHard())

    const acc = readAccountId()
    setTmaAuthed(!!acc)

    // если перезаход: синхронизируем глобалку и кидаем событие
    try {
      if (acc && !window.__AUTH_ACCOUNT__) {
        window.__AUTH_ACCOUNT__ = acc
        window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId: acc, provider: 'tma' } }))
      }
    } catch {}

    try {
      const m1 = localStorage.getItem('w3m-auth-provider')
      const m2 = localStorage.getItem('W3M_CONNECTED_CONNECTOR')
      setAuthMethod(m1 || m2 || null)
    } catch {}
  }, [mounted])

  // слушаем событие, которое кидает /api/tma/auto (auth:ok)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onAuthOk = (ev) => {
      try {
        const acc = (ev && ev.detail && ev.detail.accountId) || readAccountId()
        if (acc) setTmaAuthed(true)
      } catch {}
    }
    window.addEventListener('auth:ok', onAuthOk)
    return () => window.removeEventListener('auth:ok', onAuthOk)
  }, [])

  // глобальный вызов web3modal (как было)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { try { open() } catch {} }
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [open])

  // после успешной wallet-авторизации
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isConnected || !address) { announcedRef.current = false; return }
    if (announcedRef.current) return
    try {
      window.__AUTH_ACCOUNT__ = address
      window.dispatchEvent(new CustomEvent('auth:ok', {
        detail: { accountId: address, provider: authMethod || 'wallet' }
      }))
      announcedRef.current = true
    } catch {}
  }, [isConnected, address, authMethod])

  // разлогин кошелька → reload
  useEffect(() => {
    if (prevConnectedRef.current === true && isConnected === false) {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      if (typeof window !== 'undefined') window.location.reload()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  // эвенты провайдера
  useEffect(() => {
    if (typeof window === 'undefined') return
    const eth = pickEthereum()
    if (!eth || typeof eth.on !== 'function') return
    const onAccountsChanged = (accs = []) => {
      if (!accs || accs.length === 0) {
        try {
          window.dispatchEvent(new Event('aiquota:flush'))
          window.dispatchEvent(new CustomEvent('auth:logout'))
        } catch {}
        window.location.reload()
      }
    }
    const onDisconnect = () => {
      try {
        window.dispatchEvent(new Event('aiquota:flush'))
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch {}
      window.location.reload()
    }
    eth.on('accountsChanged', onAccountsChanged)
    eth.on('disconnect', onDisconnect)
    return () => {
      try { eth.removeListener && eth.removeListener('accountsChanged', onAccountsChanged) } catch {}
      try { eth.removeListener && eth.removeListener('disconnect', onDisconnect) } catch {}
    }
  }, [])

  // ===== Проверка статуса привязки TG (как было) =====
  const refreshTgLinkStatus = useCallback(async () => {
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
  }, [address])

  useEffect(() => { refreshTgLinkStatus() }, [mounted, isConnected, address, refreshTgLinkStatus])

  // ===== Состояние для цвета/лейбла =====
  const isAuthedWallet = !!(isConnected && address)

  const authLabel = useMemo(() => {
    if (isAuthedWallet) return shortAddr(address)
    if (authMethod) {
      const map = { google: t('auth_google') || 'Google', email: t('auth_email') || 'Email' }
      return map[authMethod] || t('auth_connected') || 'Connected'
    }
    const v = t('auth_signin')
    return v && v !== 'auth_signin' ? v : 'Sign in'
  }, [isAuthedWallet, address, authMethod, t])

  // ===== Связка Telegram (как было) =====
  async function onLinkTelegram() {
    try {
      const accountId = readAccountId() || address || null

      // если не авторизован — просим открыть auth-модалку
      if (!accountId) {
        window.dispatchEvent(new Event('open-auth'))
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

      // лёгкий поллинг статуса
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

  // ===== BRIDGE: публикуем состояние + функции в window =====
  // 1) синхронизируем ref + шлём событие для главной
  useEffect(() => {
    tgLinkedRef.current = !!tgLinked
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tg:link-status', { detail: { linked: !!tgLinked } }))
      }
    } catch {}
  }, [tgLinked])

  // 2) держим актуальные функции в ref
  useEffect(() => {
    linkFnRef.current = onLinkTelegram
    refreshFnRef.current = refreshTgLinkStatus
  })

  // 3) публикуем глобальные хелперы один раз
  useEffect(() => {
    if (typeof window === 'undefined') return

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

  // ===== Мини-апп: прячем auth-UI ТОЛЬКО когда есть авторизация
  if (isTMA && tmaAuthed) return null

  // ===== Веб-режим
  return (
    <>
      <button
        type="button"
        onClick={() => open()}
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
