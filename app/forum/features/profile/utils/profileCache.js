import { isBrowser } from '../../../shared/utils/browser'
import {
  QL7_SUPPORT_AVATAR_URL,
  isQl7SupportId,
  resolveQl7SupportDisplayName,
} from '../../../../../lib/ql7-support/systemActor'

export const PROFILE_ALIAS_PREFIX = 'profile:alias:'
const ID_PREFIXES = ['telegram:id:', 'telegramid:', 'telegram:', 'tguid:', 'tg:', 'wallet:']

function stripPrefix(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const p of ID_PREFIXES) {
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
    out.add(`telegram:${cleaned}`)
    out.add(`telegramid:${cleaned}`)
    out.add(`telegram:id:${cleaned}`)
  }
  if (/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    out.add(`wallet:${cleaned}`)
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
  if (isQl7SupportId(userId)) {
    return {
      nickname: resolveQl7SupportDisplayName(),
      icon: QL7_SUPPORT_AVATAR_URL,
      avatar: QL7_SUPPORT_AVATAR_URL,
      isSystem: true,
      systemRole: 'support',
      verified: true,
    }
  }
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

const VIP_CACHE_STATE_FIELDS = [
  'vipActive',
  'isVip',
  'vip',
  'vipUntil',
  'vipExpiresAt',
  'vip_until',
  'vip_exp',
]

function protectConfirmedVipCache(cur = {}, patch = {}) {
  const nextPatch = { ...(patch || {}) }
  const carriesVipState = VIP_CACHE_STATE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(nextPatch, field))
  if (!carriesVipState) return nextPatch

  const currentCheckedAt = Number(cur?.vipCheckedAt || 0) || 0
  const incomingCheckedAt = Number(nextPatch?.vipCheckedAt || 0) || 0
  const staleConfirmedWrite = currentCheckedAt > 0 && incomingCheckedAt > 0 && incomingCheckedAt < currentCheckedAt
  const unconfirmedOverwrite = currentCheckedAt > 0 && incomingCheckedAt <= 0
  if (!staleConfirmedWrite && !unconfirmedOverwrite) return nextPatch

  for (const field of VIP_CACHE_STATE_FIELDS) delete nextPatch[field]
  if (staleConfirmedWrite) delete nextPatch.vipCheckedAt
  return nextPatch
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
  const guardedPatch = protectConfirmedVipCache(cur, patch)
  const next = { ...cur, ...guardedPatch }
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
  if (isQl7SupportId(userId)) return resolveQl7SupportDisplayName()
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {}
  return prof.nickname || fallbackNick || (uid ? shortId(uid) : '')
}

export function resolveIconForDisplay(userId, pIcon) {
  if (isQl7SupportId(userId)) return QL7_SUPPORT_AVATAR_URL
  const uid = resolveProfileAccountId(userId)
  const prof = safeReadProfile(uid) || {}
  return prof.icon || prof.avatar || prof.vipIcon || prof.vipEmoji || pIcon || '👤'
}
