'use client'

const TELEGRAM_VERTICAL_SWIPES_MIN_VERSION = '7.7'
const DEFAULT_RESTORE_DELAY_MS = 720

let activeLocks = new Set()
let restoreTimer = 0

function getTelegramWebApp() {
  if (typeof window === 'undefined') return null
  try { return window?.Telegram?.WebApp || null } catch { return null }
}

function canUseOfficialSwipeApi(tg) {
  if (!tg) return false
  if (typeof tg.disableVerticalSwipes !== 'function') return false
  if (typeof tg.enableVerticalSwipes !== 'function') return false
  try {
    if (typeof tg.isVersionAtLeast === 'function') {
      return !!tg.isVersionAtLeast(TELEGRAM_VERTICAL_SWIPES_MIN_VERSION)
    }
  } catch {}
  return true
}

function postSwipeBehaviorFallback(tg, allowVerticalSwipe) {
  try {
    if (tg && typeof tg.postEvent === 'function') {
      tg.postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: !!allowVerticalSwipe })
      return true
    }
  } catch {}
  return false
}

function setTelegramVerticalSwipesAllowed(allowVerticalSwipe) {
  const tg = getTelegramWebApp()
  if (!tg) return false

  try {
    if (canUseOfficialSwipeApi(tg)) {
      if (allowVerticalSwipe) tg.enableVerticalSwipes()
      else tg.disableVerticalSwipes()
      return true
    }
  } catch {}

  return postSwipeBehaviorFallback(tg, allowVerticalSwipe)
}

export function isTelegramMiniAppRuntime() {
  if (typeof window === 'undefined') return false
  try {
    if (window?.Telegram?.WebApp) return true
    if (/Telegram/i.test(String(window.navigator?.userAgent || ''))) return true
  } catch {}
  return false
}

export function acquireTelegramVerticalSwipeLock(lockKey, options = {}) {
  if (!isTelegramMiniAppRuntime()) return () => {}

  const key = lockKey || Symbol('ql7TelegramSwipeLock')
  const restoreDelayMs = Number.isFinite(Number(options.restoreDelayMs))
    ? Math.max(0, Number(options.restoreDelayMs))
    : DEFAULT_RESTORE_DELAY_MS

  try { if (restoreTimer) clearTimeout(restoreTimer) } catch {}
  restoreTimer = 0
  activeLocks.add(key)
  setTelegramVerticalSwipesAllowed(false)

  return () => {
    activeLocks.delete(key)
    if (activeLocks.size > 0) return

    try { if (restoreTimer) clearTimeout(restoreTimer) } catch {}
    restoreTimer = window.setTimeout(() => {
      restoreTimer = 0
      if (activeLocks.size > 0) return
      setTelegramVerticalSwipesAllowed(true)
    }, restoreDelayMs)
  }
}

export function releaseAllTelegramVerticalSwipeLocks() {
  activeLocks.clear()
  try { if (restoreTimer) clearTimeout(restoreTimer) } catch {}
  restoreTimer = 0
  setTelegramVerticalSwipesAllowed(true)
}