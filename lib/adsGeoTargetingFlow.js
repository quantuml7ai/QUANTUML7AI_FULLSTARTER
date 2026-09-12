export function normalizeAdsGeoCountries(value) {
  const seen = new Set()
  const result = []
  for (const item of Array.isArray(value) ? value : []) {
    const code = String(item || '').trim().toUpperCase()
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

export function normalizeAdsGeoRegions(value) {
  const source = value && typeof value === 'object' ? value : {}
  const result = {}
  for (const [rawCountry, rawRegions] of Object.entries(source)) {
    const country = String(rawCountry || '').trim().toUpperCase()
    if (!country) continue
    const seen = new Set()
    const regions = []
    for (const rawRegion of Array.isArray(rawRegions) ? rawRegions : []) {
      const region = String(rawRegion || '').trim().toUpperCase()
      if (!region || seen.has(region)) continue
      seen.add(region)
      regions.push(region)
    }
    if (regions.length) result[country] = regions
  }
  return result
}

export function countAdsGeoRegions(value) {
  const normalized = normalizeAdsGeoRegions(value)
  return Object.values(normalized).reduce((sum, list) => sum + list.length, 0)
}

export function isAdsCampaignBasicsReady({ hasActivePkg, name, clickUrl }) {
  return Boolean(
    hasActivePkg &&
      String(name || '').trim() &&
      String(clickUrl || '').trim(),
  )
}

export function getAdsGeoConfirmationState({ countries, remaining }) {
  const normalized = normalizeAdsGeoCountries(countries)
  const selectedCount = normalized.length
  const parsedRemaining = Number(remaining)
  const hasFiniteLimit = Number.isFinite(parsedRemaining)
  const available = hasFiniteLimit ? Math.max(0, Math.floor(parsedRemaining)) : Infinity
  const limitExceeded = available !== Infinity && selectedCount > available

  return {
    selectedCount,
    available,
    missing: selectedCount === 0,
    limitExceeded,
    canConfirm: selectedCount > 0 && !limitExceeded,
  }
}
