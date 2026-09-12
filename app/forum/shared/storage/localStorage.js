import { isBrowser } from '../utils/browser'

export function safeLocalStorageGet(key, fallback = null) {
  if (!isBrowser()) return fallback
  try {
    const value = window.localStorage.getItem(String(key))
    return value == null ? fallback : value
  } catch {
    return fallback
  }
}

export function safeLocalStorageSet(key, value) {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(String(key), String(value))
    return true
  } catch {
    return false
  }
}

export function safeLocalStorageRemove(key) {
  if (!isBrowser()) return false
  try {
    window.localStorage.removeItem(String(key))
    return true
  } catch {
    return false
  }
}

export function safeLocalStorageGetJson(key, fallback = null) {
  const raw = safeLocalStorageGet(key, null)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeLocalStorageSetJson(key, value) {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(String(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
