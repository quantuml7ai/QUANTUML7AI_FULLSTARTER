'use client'

import React from 'react'

const TELEGRAM_MINI_APP_ATTR = 'data-telegram-mini-app'
const TELEGRAM_SWIPES_MIN_VERSION = '7.7'

function getTelegramWebApp() {
  try {
    return window?.Telegram?.WebApp || null
  } catch {
    return null
  }
}

function hasTelegramLaunchData(webApp) {
  try {
    const initData = typeof webApp?.initData === 'string' ? webApp.initData : ''
    if (initData.includes('hash=')) return true
  } catch {}

  try {
    const launch = `${window.location?.search || ''} ${window.location?.hash || ''}`.toLowerCase()
    return launch.includes('tgwebappdata=')
  } catch {
    return false
  }
}

function isTelegramMiniAppRuntime(webApp = getTelegramWebApp()) {
  if (!webApp) return false
  return hasTelegramLaunchData(webApp)
}

function callTelegramMethod(webApp, methodName) {
  try {
    webApp?.[methodName]?.()
  } catch {}
}

function isVersionAtLeast(version, minimum) {
  const current = String(version || '').split('.').map((part) => Number.parseInt(part, 10) || 0)
  const required = String(minimum || '').split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(current.length, required.length)
  for (let i = 0; i < length; i += 1) {
    const a = current[i] || 0
    const b = required[i] || 0
    if (a > b) return true
    if (a < b) return false
  }
  return true
}

function canToggleVerticalSwipes(webApp) {
  if (typeof webApp?.disableVerticalSwipes !== 'function') return false
  try {
    if (typeof webApp.isVersionAtLeast === 'function') {
      return !!webApp.isVersionAtLeast(TELEGRAM_SWIPES_MIN_VERSION)
    }
  } catch {}
  return isVersionAtLeast(webApp?.version, TELEGRAM_SWIPES_MIN_VERSION)
}

function setTelegramMiniAppMarker(enabled) {
  try {
    const root = document?.documentElement
    if (!root) return
    if (enabled) root.setAttribute(TELEGRAM_MINI_APP_ATTR, '1')
    else root.removeAttribute(TELEGRAM_MINI_APP_ATTR)
  } catch {}
}

export default function useTelegramVerticalSwipesGuard(active = true) {
  React.useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined
    const initialWebApp = getTelegramWebApp()
    if (!isTelegramMiniAppRuntime(initialWebApp)) {
      setTelegramMiniAppMarker(false)
      return undefined
    }

    let swipesDisabled = false
    const applyGuard = () => {
      const webApp = getTelegramWebApp()
      if (!isTelegramMiniAppRuntime(webApp)) return
      setTelegramMiniAppMarker(true)
      callTelegramMethod(webApp, 'ready')
      callTelegramMethod(webApp, 'expand')
      if (canToggleVerticalSwipes(webApp)) {
        callTelegramMethod(webApp, 'disableVerticalSwipes')
        swipesDisabled = true
      }
    }

    const onVisibilityChange = () => {
      try {
        if (document?.visibilityState === 'visible') applyGuard()
      } catch {}
    }

    applyGuard()
    try { document.addEventListener('visibilitychange', onVisibilityChange) } catch {}
    try { window.addEventListener('focus', applyGuard) } catch {}

    return () => {
      try { document.removeEventListener('visibilitychange', onVisibilityChange) } catch {}
      try { window.removeEventListener('focus', applyGuard) } catch {}
      const webApp = getTelegramWebApp()
      if (swipesDisabled && isTelegramMiniAppRuntime(webApp) && canToggleVerticalSwipes(webApp)) {
        callTelegramMethod(webApp, 'enableVerticalSwipes')
      }
      setTelegramMiniAppMarker(false)
    }
  }, [active])
}
