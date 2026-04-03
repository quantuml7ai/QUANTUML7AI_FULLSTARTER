import { isBrowser } from '../../../shared/utils/browser'

export const PROFILE_ALIAS_PREFIX = 'profile:alias:'
const TG_PREFIXES = ['tguid:', 'tg:']

function stripPrefix(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const p of TG_PREFIXES) {
    if (lower.startsWith(p)) return s.slice(p.length)
  }
  return s
}

function aliasCandidates(raw) {
  const out = new Set()
  const s = String(raw || '').trim()
  const cleaned = stripPrefix(s)
  if (s) out.add(s)
  if (cleaned) out.add(cleaned)
  if (/^\d+$/.test(cleaned)) {
    out.add(`tguid:${cleaned}`)
    out.add(`tg:${cleaned}`)
  }
  return Array.from(out)
}

export function resolveProfileAccountId(userId) {
  const raw = String(userId || '').trim()
  if (!raw || !isBrowser()) return raw
  try {
    for (const key of aliasCandidates(raw)) {
      const alias = localStorage.getItem(PROFILE_ALIAS_PREFIX + key)
      if (alias) return String(alias).trim()
    }
    return stripPrefix(raw)
  } catch {
    return stripPrefix(raw)
  }
}

export function safeReadProfile(userId) {
  if (!isBrowser() || !userId) return {}
  const uid = resolveProfileAccountId(userId)
  try {
    return JSON.parse(localStorage.getItem('profile:' + uid) || '{}')
  } catch {
    return {}
  }
}

export function writeProfileAlias(rawId, accountId) {
  if (!rawId || !accountId || !isBrowser()) return
  const from = String(rawId).trim()
  const to = String(accountId).trim()
  if (!from || !to || from === to) return
  try {
    aliasCandidates(from).forEach((key) => {
      try { localStorage.setItem(PROFILE_ALIAS_PREFIX + key, to) } catch {}
    })
  } catch {}
}

export function mergeProfileCache(accountId, patch) {
  if (!accountId || !isBrowser()) return null
  const key = 'profile:' + accountId
  let cur = {}
  try {
    cur = JSON.parse(localStorage.getItem(key) || '{}') || {}
  } catch {
    cur = {}
  }
  const next = { ...cur, ...(patch || {}) }
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {}
  return next
}

function fallbackShortId(id) {
  const raw = String(id || '')
  if (!raw) return ''
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`
}

export function resolveNickForDisplay(userId, fallbackNick, shortId = fallbackShortId) {
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {}
  return prof.nickname || fallbackNick || (uid ? shortId(uid) : '')
}

export function resolveIconForDisplay(userId, pIcon) {
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {}
  return prof.vipIcon || prof.vipEmoji || prof.icon || pIcon || '👤'
}
