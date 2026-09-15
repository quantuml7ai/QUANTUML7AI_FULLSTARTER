'use client'

export function isTelegramMiniAppRuntime() {
  if (typeof window === 'undefined') return false
  try {
    if (window?.Telegram?.WebApp) return true
    if (/Telegram/i.test(String(window.navigator?.userAgent || ''))) return true
  } catch {}
  return false
}
