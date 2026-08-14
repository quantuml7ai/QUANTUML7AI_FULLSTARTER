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
  const account = String(value || '').trim()
  if (!account) return null
  return /^0x[a-f0-9]{40}$/i.test(account) ? account.toLowerCase() : account
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
