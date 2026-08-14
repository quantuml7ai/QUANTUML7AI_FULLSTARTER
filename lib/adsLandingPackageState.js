const INACTIVE_PACKAGE_STATUSES = new Set([
  'expired',
  'inactive',
  'cancelled',
  'canceled',
  'revoked',
])

function cleanText(value) {
  return String(value ?? '').trim()
}

function timestamp(value) {
  if (!value) return Number.NaN
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function finiteNonNegative(value, fallback = 0) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, parsed)
}

export function getAdsLandingPackageSnapshot(packageInfo, nowMs = Date.now()) {
  if (!packageInfo || typeof packageInfo !== 'object') {
    return {
      exists: false,
      active: false,
      expired: false,
      type: '',
      status: '',
      startsAt: '',
      expiresAt: '',
      daysLeft: null,
      maxCampaigns: 0,
      usedCampaigns: 0,
    }
  }

  const status = cleanText(packageInfo.status).toLowerCase()
  const type = cleanText(
    packageInfo.pkgType || packageInfo.type || packageInfo.planId,
  ).toLowerCase()
  const startsAt = cleanText(packageInfo.startsAt || packageInfo.createdAt)
  const expiresAt = cleanText(packageInfo.expiresAt)
  const expiresAtMs = timestamp(expiresAt)
  const expiredByTime = Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs
  const expiredByStatus = INACTIVE_PACKAGE_STATUSES.has(status)
  const active = !expiredByStatus && !expiredByTime

  let daysLeft = Number(packageInfo.daysLeft)
  if (!Number.isFinite(daysLeft)) {
    daysLeft = Number.isFinite(expiresAtMs)
      ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / 86_400_000))
      : null
  } else {
    daysLeft = Math.max(0, Math.floor(daysLeft))
  }

  return {
    exists: true,
    active,
    expired: !active,
    type,
    status,
    startsAt,
    expiresAt,
    daysLeft,
    maxCampaigns: finiteNonNegative(packageInfo.maxCampaigns),
    usedCampaigns: finiteNonNegative(packageInfo.usedCampaigns),
  }
}

export function canOpenAdsLandingCabinet({
  testMode = false,
  packageInfo = null,
  nowMs = Date.now(),
} = {}) {
  if (testMode) return true
  return getAdsLandingPackageSnapshot(packageInfo, nowMs).exists
}
