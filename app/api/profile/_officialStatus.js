// app/api/profile/_officialStatus.js
export const OFFICIAL_STATUS_ENV_KEY = 'QL7_OFFICIAL_STATUS_IDS'

function cleanId(value) {
  return String(value || '').trim()
}

export function parseOfficialStatusIds(value = process.env[OFFICIAL_STATUS_ENV_KEY]) {
  return Array.from(new Set(
    String(value || '')
      .split(/[\s,;]+/u)
      .map(cleanId)
      .filter(Boolean),
  ))
}

export async function isOfficialProfile({
  rawUserId,
  accountId,
  envValue = process.env[OFFICIAL_STATUS_ENV_KEY],
  resolveConfiguredIds,
} = {}) {
  const configuredIds = parseOfficialStatusIds(envValue)
  if (!configuredIds.length) return false

  const raw = cleanId(rawUserId)
  const canonical = cleanId(accountId)
  if (!canonical) return false

  // Exact raw/canonical values stay on the cheap path.
  if (configuredIds.includes(canonical) || (raw && configuredIds.includes(raw))) return true

  // A configured Telegram/raw alias may resolve to the same canonical account.
  if (typeof resolveConfiguredIds !== 'function') return false
  try {
    const resolved = await resolveConfiguredIds(configuredIds)
    const canonicalIds = Array.isArray(resolved?.ids)
      ? resolved.ids.map(cleanId).filter(Boolean)
      : []
    return canonicalIds.includes(canonical)
  } catch {
    // Presentation status is fail-closed if the identity graph is unavailable.
    return false
  }
}
