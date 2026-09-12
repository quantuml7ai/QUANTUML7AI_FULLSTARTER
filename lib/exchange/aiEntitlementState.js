export const AI_ENTITLEMENT_STORAGE_KEY = 'ql7:exchange:ai-entitlement:v2'
export const AI_ENTITLEMENT_VERSION = 2
export const AI_ENTITLEMENT_LIMIT_SEC = 10 * 60
export const AI_ENTITLEMENT_FREE_TTL_MS = 60_000

export const AI_ACCESS_MODE = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  FREE: 'FREE',
  FREE_URGENT: 'FREE_URGENT',
  EXHAUSTED: 'EXHAUSTED',
  VIP: 'VIP',
})

function asFiniteNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, Math.floor(asFiniteNumber(value, min))))
}

export function normalizeAccountMarker(value) {
  const marker = String(value || '').trim()
  return marker || null
}

export function normalizeServerDate(value) {
  const raw = String(value || '').replace(/[^0-9]/g, '')
  return /^\d{8}$/.test(raw) ? raw : null
}

export function createUnknownEntitlement(now = Date.now()) {
  return {
    version: AI_ENTITLEMENT_VERSION,
    mode: AI_ACCESS_MODE.UNKNOWN,
    serverDate: null,
    usedSec: 0,
    limitSec: AI_ENTITLEMENT_LIMIT_SEC,
    remainingSec: AI_ENTITLEMENT_LIMIT_SEC,
    exhausted: false,
    isVip: false,
    vipUntil: null,
    daysLeft: 0,
    vipAccountMarker: null,
    checkedAt: 0,
    localUpdatedAt: now,
    authoritative: false,
  }
}

export function sanitizeEntitlementSnapshot(raw, now = Date.now()) {
  const base = createUnknownEntitlement(now)
  if (!raw || typeof raw !== 'object') return base
  if (Number(raw.version) !== AI_ENTITLEMENT_VERSION) return base

  const serverDate = normalizeServerDate(raw.serverDate)
  const limitSec = Math.max(1, clampInt(raw.limitSec, 1, 86_400))
  const usedSec = clampInt(raw.usedSec, 0, limitSec)
  const remainingSec = clampInt(
    raw.remainingSec,
    0,
    limitSec,
  )
  const vipUntil = raw.vipUntil ? String(raw.vipUntil) : null
  const vipUntilMs = vipUntil ? Date.parse(vipUntil) : NaN
  const isVip = Boolean(raw.isVip) && Number.isFinite(vipUntilMs) && vipUntilMs > now
  const exhausted = Boolean(raw.exhausted) || (!isVip && usedSec >= limitSec)

  let mode = AI_ACCESS_MODE.UNKNOWN
  if (isVip) mode = AI_ACCESS_MODE.VIP
  else if (exhausted) mode = AI_ACCESS_MODE.EXHAUSTED
  else if (Boolean(raw.authoritative)) {
    mode = remainingSec <= 59 ? AI_ACCESS_MODE.FREE_URGENT : AI_ACCESS_MODE.FREE
  }

  return {
    ...base,
    mode,
    serverDate,
    usedSec,
    limitSec,
    remainingSec: exhausted ? 0 : Math.min(remainingSec, Math.max(0, limitSec - usedSec)),
    exhausted,
    isVip,
    vipUntil: isVip ? vipUntil : null,
    daysLeft: isVip ? Math.max(0, clampInt(raw.daysLeft, 0, 36_500)) : 0,
    vipAccountMarker: isVip ? normalizeAccountMarker(raw.vipAccountMarker) : null,
    checkedAt: Math.max(0, asFiniteNumber(raw.checkedAt, 0)),
    localUpdatedAt: Math.max(0, asFiniteNumber(raw.localUpdatedAt, now)),
    authoritative: Boolean(raw.authoritative),
  }
}

export function hydrateEntitlementSnapshot({
  stored,
  legacyUsedSec = 0,
  accountMarker = null,
  now = Date.now(),
} = {}) {
  const snapshot = sanitizeEntitlementSnapshot(stored, now)
  const currentAccount = normalizeAccountMarker(accountMarker)

  if (
    (snapshot.mode === AI_ACCESS_MODE.FREE || snapshot.mode === AI_ACCESS_MODE.FREE_URGENT) &&
    (!snapshot.checkedAt || now - snapshot.checkedAt > AI_ENTITLEMENT_FREE_TTL_MS)
  ) {
    snapshot.mode = AI_ACCESS_MODE.UNKNOWN
    snapshot.authoritative = false
  }

  if (
    snapshot.mode === AI_ACCESS_MODE.VIP &&
    snapshot.vipAccountMarker &&
    snapshot.vipAccountMarker !== currentAccount
  ) {
    return {
      ...snapshot,
      mode: snapshot.exhausted ? AI_ACCESS_MODE.EXHAUSTED : AI_ACCESS_MODE.UNKNOWN,
      isVip: false,
      vipUntil: null,
      daysLeft: 0,
      vipAccountMarker: null,
      authoritative: snapshot.exhausted,
    }
  }

  const legacyUsed = clampInt(legacyUsedSec, 0, AI_ENTITLEMENT_LIMIT_SEC)
  if (snapshot.serverDate || snapshot.isVip || snapshot.exhausted) return snapshot
  if (legacyUsed <= 0) return snapshot

  const exhausted = legacyUsed >= AI_ENTITLEMENT_LIMIT_SEC
  return {
    ...snapshot,
    mode: exhausted ? AI_ACCESS_MODE.EXHAUSTED : AI_ACCESS_MODE.UNKNOWN,
    usedSec: legacyUsed,
    remainingSec: Math.max(0, AI_ENTITLEMENT_LIMIT_SEC - legacyUsed),
    exhausted,
    authoritative: exhausted,
  }
}

export function mergeAuthoritativeEntitlement(
  previousRaw,
  payload,
  {
    accountMarker = null,
    localUsedSec = null,
    now = Date.now(),
  } = {},
) {
  const previous = sanitizeEntitlementSnapshot(previousRaw, now)
  if (!payload || payload.ok !== true) return previous

  const currentAccount = normalizeAccountMarker(accountMarker)
  const serverDate = normalizeServerDate(payload.date) || previous.serverDate
  const sameServerDate = Boolean(serverDate && previous.serverDate === serverDate)
  const payloadIsVip = Boolean(payload.isVip || payload.unlimited)

  if (payloadIsVip) {
    const vipUntil = payload.untilISO ? String(payload.untilISO) : null
    const vipUntilMs = vipUntil ? Date.parse(vipUntil) : NaN
    if (!Number.isFinite(vipUntilMs) || vipUntilMs <= now) {
      return {
        ...previous,
        mode: AI_ACCESS_MODE.UNKNOWN,
        isVip: false,
        vipUntil: null,
        daysLeft: 0,
        vipAccountMarker: null,
        checkedAt: now,
        authoritative: false,
      }
    }

    return {
      ...previous,
      mode: AI_ACCESS_MODE.VIP,
      serverDate,
      isVip: true,
      vipUntil,
      daysLeft: Math.max(0, clampInt(payload.daysLeft, 0, 36_500)),
      vipAccountMarker: currentAccount,
      checkedAt: now,
      localUpdatedAt: now,
      authoritative: true,
    }
  }

  const limitSec = Math.max(
    1,
    clampInt(payload.limitSec ?? previous.limitSec ?? AI_ENTITLEMENT_LIMIT_SEC, 1, 86_400),
  )
  const serverUsed = clampInt(payload.usedSec, 0, limitSec)
  const localUsed = sameServerDate && Number.isFinite(Number(localUsedSec))
    ? clampInt(localUsedSec, 0, limitSec)
    : 0
  const monotonicUsed = sameServerDate
    ? Math.max(previous.usedSec, serverUsed, localUsed)
    : serverUsed
  const responseRemaining = Number.isFinite(Number(payload.remainingSec))
    ? clampInt(payload.remainingSec, 0, limitSec)
    : Math.max(0, limitSec - monotonicUsed)
  const exhaustedByResponse = responseRemaining <= 0 || monotonicUsed >= limitSec
  const exhausted = sameServerDate
    ? previous.exhausted || exhaustedByResponse
    : exhaustedByResponse
  const remainingSec = exhausted
    ? 0
    : Math.min(responseRemaining, Math.max(0, limitSec - monotonicUsed))
  const mode = exhausted
    ? AI_ACCESS_MODE.EXHAUSTED
    : remainingSec <= 59
      ? AI_ACCESS_MODE.FREE_URGENT
      : AI_ACCESS_MODE.FREE

  return {
    ...previous,
    mode,
    serverDate,
    usedSec: monotonicUsed,
    limitSec,
    remainingSec,
    exhausted,
    isVip: false,
    vipUntil: null,
    daysLeft: 0,
    vipAccountMarker: null,
    checkedAt: now,
    localUpdatedAt: now,
    authoritative: true,
  }
}

export function getQuotaReconciliationDelta(
  previousRaw,
  payload,
  now = Date.now(),
) {
  const previous = sanitizeEntitlementSnapshot(previousRaw, now)
  if (!payload || payload.ok !== true) return 0
  if (payload.isVip || payload.unlimited) return 0

  const serverDate = normalizeServerDate(payload.date)
  if (!serverDate || !previous.serverDate || previous.serverDate !== serverDate) {
    return 0
  }
  if (!previous.authoritative && !previous.exhausted) return 0

  const limitSec = Math.max(
    1,
    clampInt(payload.limitSec ?? previous.limitSec ?? AI_ENTITLEMENT_LIMIT_SEC, 1, 86_400),
  )
  const localUsed = clampInt(previous.usedSec, 0, limitSec)
  const serverUsed = clampInt(payload.usedSec, 0, limitSec)
  return Math.max(0, localUsed - serverUsed)
}

export function tickEntitlementSnapshot(previousRaw, deltaSec, now = Date.now()) {
  const previous = sanitizeEntitlementSnapshot(previousRaw, now)
  if (
    previous.mode !== AI_ACCESS_MODE.FREE &&
    previous.mode !== AI_ACCESS_MODE.FREE_URGENT
  ) {
    return previous
  }

  const delta = Math.max(0, Math.floor(asFiniteNumber(deltaSec, 0)))
  if (delta <= 0) return previous

  const usedSec = Math.min(previous.limitSec, previous.usedSec + delta)
  const remainingSec = Math.max(0, previous.limitSec - usedSec)
  const exhausted = remainingSec <= 0

  return {
    ...previous,
    mode: exhausted
      ? AI_ACCESS_MODE.EXHAUSTED
      : remainingSec <= 59
        ? AI_ACCESS_MODE.FREE_URGENT
        : AI_ACCESS_MODE.FREE,
    usedSec,
    remainingSec,
    exhausted,
    localUpdatedAt: now,
    authoritative: true,
  }
}

export function canAnalyzeWithEntitlement(mode) {
  return (
    mode === AI_ACCESS_MODE.FREE ||
    mode === AI_ACCESS_MODE.FREE_URGENT ||
    mode === AI_ACCESS_MODE.VIP
  )
}

export function shouldPersistEntitlement(snapshot) {
  return Boolean(
    snapshot &&
    (snapshot.exhausted || snapshot.isVip || snapshot.authoritative),
  )
}

export function toPersistedEntitlement(snapshotRaw, now = Date.now()) {
  const snapshot = sanitizeEntitlementSnapshot(snapshotRaw, now)
  return {
    version: AI_ENTITLEMENT_VERSION,
    serverDate: snapshot.serverDate,
    usedSec: snapshot.usedSec,
    limitSec: snapshot.limitSec,
    remainingSec: snapshot.remainingSec,
    exhausted: snapshot.exhausted,
    isVip: snapshot.isVip,
    vipUntil: snapshot.vipUntil,
    daysLeft: snapshot.daysLeft,
    vipAccountMarker: snapshot.vipAccountMarker,
    checkedAt: snapshot.checkedAt,
    localUpdatedAt: snapshot.localUpdatedAt,
    authoritative: snapshot.authoritative,
  }
}

export function formatQuotaClock(seconds) {
  const safe = Math.max(0, Math.floor(asFiniteNumber(seconds, 0)))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
