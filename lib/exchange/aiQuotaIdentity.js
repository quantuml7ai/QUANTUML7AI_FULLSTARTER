import canonicalUserId from '../identity/canonical-user-id.cjs'

export const AI_QUOTA_LIMIT_SEC = 10 * 60

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function clampQuotaUsed(value, limitSec = AI_QUOTA_LIMIT_SEC) {
  const limit = Math.max(1, Math.floor(finiteNumber(limitSec, AI_QUOTA_LIMIT_SEC)))
  return Math.min(limit, Math.max(0, Math.floor(finiteNumber(value, 0))))
}

export function normalizeQuotaIp(value) {
  return String(value || '')
    .trim()
    .replace(/[^0-9a-fA-F:.\-]/g, '')
    .slice(0, 96)
}

export function normalizeQuotaAccount(value) {
  const account = canonicalUserId.normalizePrincipalSyntax(value)
  return account || null
}

export function quotaAccountReadCandidates(value, linkedIds = []) {
  const ids = new Set()
  for (const raw of [value, ...(Array.isArray(linkedIds) ? linkedIds : [])]) {
    const exact = String(raw || '').trim()
    if (!exact) continue
    ids.add(exact)
    const canonical = normalizeQuotaAccount(exact)
    if (canonical) ids.add(canonical)
    const wallet = canonicalUserId.normalizeWalletId(exact)
    if (wallet) {
      ids.add(wallet)
      ids.add(wallet.toLowerCase())
      ids.add(`wallet:${wallet.toLowerCase()}`)
    }
    const telegram = canonicalUserId.normalizeTelegramId(exact)
    if (telegram) {
      ids.add(telegram)
      for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
        ids.add(`${prefix}${telegram}`)
      }
    }
  }
  return Array.from(ids)
}

export function firstForwardedIp(value) {
  return normalizeQuotaIp(String(value || '').split(',')[0])
}

export function selectQuotaClientIp(headers) {
  const get = (name) => {
    try {
      return headers?.get?.(name) || headers?.[name] || headers?.[name.toLowerCase()] || ''
    } catch {
      return ''
    }
  }

  return (
    firstForwardedIp(get('cf-connecting-ip')) ||
    firstForwardedIp(get('x-vercel-forwarded-for')) ||
    firstForwardedIp(get('x-real-ip')) ||
    firstForwardedIp(get('x-forwarded-for')) ||
    '127.0.0.1'
  )
}

export function resolveEffectiveQuotaUsage({
  ipUsedSec = 0,
  accountUsedSec = 0,
  limitSec = AI_QUOTA_LIMIT_SEC,
} = {}) {
  const limit = Math.max(1, Math.floor(finiteNumber(limitSec, AI_QUOTA_LIMIT_SEC)))
  return Math.max(
    clampQuotaUsed(ipUsedSec, limit),
    clampQuotaUsed(accountUsedSec, limit),
  )
}

export function needsQuotaIdentitySync({
  ipUsedSec = 0,
  accountUsedSec = 0,
  hasAccount = false,
  limitSec = AI_QUOTA_LIMIT_SEC,
} = {}) {
  if (!hasAccount) return false
  const limit = Math.max(1, Math.floor(finiteNumber(limitSec, AI_QUOTA_LIMIT_SEC)))
  const ipUsed = clampQuotaUsed(ipUsedSec, limit)
  const accountUsed = clampQuotaUsed(accountUsedSec, limit)
  const effectiveUsed = Math.max(ipUsed, accountUsed)
  return ipUsed !== effectiveUsed || accountUsed !== effectiveUsed
}

export function planQuotaIncrement({
  ipUsedSec = 0,
  accountUsedSec = 0,
  deltaSec = 0,
  limitSec = AI_QUOTA_LIMIT_SEC,
} = {}) {
  const limit = Math.max(1, Math.floor(finiteNumber(limitSec, AI_QUOTA_LIMIT_SEC)))
  const currentUsedSec = resolveEffectiveQuotaUsage({
    ipUsedSec,
    accountUsedSec,
    limitSec: limit,
  })
  const requestedDeltaSec = Math.max(0, Math.floor(finiteNumber(deltaSec, 0)))
  const addedSec = Math.min(requestedDeltaSec, Math.max(0, limit - currentUsedSec))
  const nextUsedSec = Math.min(limit, currentUsedSec + addedSec)

  return {
    limitSec: limit,
    currentUsedSec,
    requestedDeltaSec,
    addedSec,
    nextUsedSec,
    remainingSec: Math.max(0, limit - nextUsedSec),
    capped: nextUsedSec >= limit,
  }
}
