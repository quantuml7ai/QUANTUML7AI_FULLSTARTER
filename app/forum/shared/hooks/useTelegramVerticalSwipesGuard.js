'use client'

import React from 'react'

function getTelegramWebApp() {
  try {
    return window?.Telegram?.WebApp || null
  } catch {
    return null
  }
}

function callTelegramMethod(webApp, methodName) {
  try {
    webApp?.[methodName]?.()
  } catch {}
}

export default function useTelegramVerticalSwipesGuard(active = true) {
  React.useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined

    const applyGuard = () => {
      const webApp = getTelegramWebApp()
      if (!webApp) return
      callTelegramMethod(webApp, 'ready')
      callTelegramMethod(webApp, 'expand')
      callTelegramMethod(webApp, 'disableVerticalSwipes')
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
      callTelegramMethod(getTelegramWebApp(), 'enableVerticalSwipes')
    }
  }, [active])
}
