// lib/geo/request-geo.cjs
// QL7_GEO111_GEO_IDENTITY_V1
// QL7_GEO_CITY_PUBLIC_SUMMARY_RINGS_V1
// Resolves private viewer geo from trusted server headers only. Client-side geo sources are intentionally ignored.

const { FORUM_ARCHITECTURE } = require('../forum/ql7-forum-architecture.cjs')
const { normalizeCountryCode, countryI18nKey, resolveCountryLabel } = require('./country-labels.cjs')
const { cityI18nKey, normalizeCityKey, resolveCityLabel, cleanCityDisplay } = require('./city-labels.cjs')

const TRUSTED_GEO_HEADERS = Object.freeze({
  country: Object.freeze(['x-vercel-ip-country', 'x-geo-country', 'cf-ipcountry']),
  region: Object.freeze(['x-vercel-ip-country-region', 'x-geo-region', 'cf-region']),
  city: Object.freeze(['x-vercel-ip-city', 'x-geo-city', 'cf-ipcity', 'cf-city']),
})

const HEADER_SOURCE_BY_NAME = Object.freeze({
  'x-vercel-ip-country': 'vercel',
  'x-vercel-ip-country-region': 'vercel',
  'x-vercel-ip-city': 'vercel',
  'x-geo-country': 'ql7_edge_geo',
  'x-geo-region': 'ql7_edge_geo',
  'x-geo-city': 'ql7_edge_geo',
  'cf-ipcountry': 'cloudflare',
  'cf-region': 'cloudflare',
  'cf-ipcity': 'cloudflare',
  'cf-city': 'cloudflare',
})

function str(value) {
  return String(value ?? '').trim()
}

function getHeader(headers, name) {
  const key = String(name || '').toLowerCase()
  if (!headers || !key) return ''
  try {
    if (typeof headers.get === 'function') return str(headers.get(key) || headers.get(name) || '')
  } catch {}
  try {
    if (typeof headers === 'object') return str(headers[key] || headers[name] || headers[String(name || '').toUpperCase()] || '')
  } catch {}
  return ''
}

function firstTrustedHeader(headers, names) {
  for (const name of names || []) {
    const value = getHeader(headers, name)
    if (value) return { name, value, source: HEADER_SOURCE_BY_NAME[name] || 'trusted_header' }
  }
  return { name: '', value: '', source: 'none' }
}

function safeDecodeGeoSegment(value) {
  const raw = str(value)
  if (!raw) return ''
  const plusNormalized = raw.replace(/\+/g, ' ')
  try {
    return decodeURIComponent(plusNormalized).trim()
  } catch {
    return plusNormalized.trim()
  }
}

function cleanRegionCode(value) {
  const decoded = safeDecodeGeoSegment(value)
  if (!decoded) return ''
  return decoded
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[^\p{L}\p{N}._ -]+/gu, '')
    .replace(/\s+/g, ' ')
    .slice(0, 48)
    .trim()
}

function regionKeyPart(value) {
  return cleanRegionCode(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function buildGeoScopes({ country = '', region = '', city = '' } = {}) {
  const countryCode = normalizeCountryCode(country)
  const regionPart = regionKeyPart(region)
  const cityPart = normalizeCityKey(city)
  const countryKey = countryCode ? 'country:' + countryCode.toLowerCase() : 'global'
  const regionKey = countryCode && regionPart ? 'region:' + countryCode.toLowerCase() + ':' + regionPart : countryKey
  const cityKey = countryCode && cityPart
    ? 'city:' + countryCode.toLowerCase() + ':' + (regionPart || '_') + ':' + cityPart
    : regionKey
  return Object.freeze({
    cityKey,
    regionKey,
    countryKey,
    globalKey: 'global',
  })
}

function selectPrecision({ country = '', region = '', city = '' } = {}) {
  if (country && city) return 'city'
  if (country && region) return 'region'
  if (country) return 'country'
  return 'global'
}

function selectGeoKey(scopes, precision) {
  if (precision === 'city') return scopes.cityKey
  if (precision === 'region') return scopes.regionKey
  if (precision === 'country') return scopes.countryKey
  return scopes.globalKey
}

function resolveRequestGeo(requestOrHeaders, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now())
  const headers = requestOrHeaders?.headers || requestOrHeaders || {}
  const countryHeader = firstTrustedHeader(headers, TRUSTED_GEO_HEADERS.country)
  const regionHeader = firstTrustedHeader(headers, TRUSTED_GEO_HEADERS.region)
  const cityHeader = firstTrustedHeader(headers, TRUSTED_GEO_HEADERS.city)

  const country = normalizeCountryCode(countryHeader.value)
  const region = cleanRegionCode(regionHeader.value)
  const city = cleanCityDisplay(cityHeader.value)
  const precision = selectPrecision({ country, region, city })
  const scopes = buildGeoScopes({ country, region, city })
  const geoKey = selectGeoKey(scopes, precision)
  const known = precision !== 'global'
  const source = countryHeader.source !== 'none'
    ? countryHeader.source
    : (regionHeader.source !== 'none' ? regionHeader.source : (cityHeader.source !== 'none' ? cityHeader.source : 'none'))
  const confidence = known
    ? (precision === 'city' ? 0.95 : precision === 'region' ? 0.9 : 0.85)
    : 0

  return Object.freeze({
    known,
    country,
    region,
    city,
    precision,
    geoKey,
    scopes,
    source,
    confidence,
    capturedAt: now.toISOString(),
    labels: Object.freeze({
      countryKey: countryI18nKey(country),
      cityKey: city ? cityI18nKey(city) : 'geo_city_unknown',
    }),
    headersUsed: Object.freeze({
      country: countryHeader.name,
      region: regionHeader.name,
      city: cityHeader.name,
    }),
  })
}

function isUnknownGeoWriteAllowed() {
  return FORUM_ARCHITECTURE.geo.unknownGeoWrites === true
}

function buildPrivateGeoCurrent(geo = {}, previous = null) {
  const nowIso = str(geo.capturedAt) || new Date().toISOString()
  const prevFirstSeenAt = previous?._geoCurrent?.firstSeenAt || previous?.firstSeenAt || ''
  return {
    known: !!geo.known,
    country: str(geo.country),
    region: str(geo.region),
    city: str(geo.city),
    precision: str(geo.precision || 'global'),
    geoKey: str(geo.geoKey || 'global'),
    scopes: geo.scopes && typeof geo.scopes === 'object' ? { ...geo.scopes } : buildGeoScopes(geo),
    source: str(geo.source || 'none'),
    confidence: Number.isFinite(Number(geo.confidence)) ? Number(geo.confidence) : 0,
    capturedAt: nowIso,
    firstSeenAt: prevFirstSeenAt || nowIso,
    lastSeenAt: nowIso,
  }
}

function buildViewerGeoDisplay(geo = {}, lang = 'en', dict = null) {
  const countryLabel = resolveCountryLabel(geo.country, lang, dict)
  const cityLabel = geo.city ? resolveCityLabel(geo.city, lang, dict) : ''
  if (cityLabel && geo.country) return cityLabel
  return countryLabel
}

function publicSessionGeoSummary(geo = {}, lang = 'en', dict = null) {
  const countryCode = normalizeCountryCode(geo.country)
  const region = str(geo.region)
  const city = str(geo.city)
  const countryLabel = countryCode ? resolveCountryLabel(countryCode, lang, dict) : ''
  const cityLabel = city ? resolveCityLabel(city, lang, dict) : ''
  const primaryLabel = cityLabel || city || region || countryLabel || countryCode || ''
  return {
    known: !!geo.known,
    precision: str(geo.precision || 'global'),
    countryCode,
    countryLabel,
    region,
    city,
    cityLabel,
    primaryLabel,
    geoKey: str(geo.geoKey || ''),
    headersUsed: geo.headersUsed && typeof geo.headersUsed === 'object' ? { ...geo.headersUsed } : undefined,
  }
}

module.exports = {
  TRUSTED_GEO_HEADERS,
  buildGeoScopes,
  buildPrivateGeoCurrent,
  buildViewerGeoDisplay,
  cleanRegionCode,
  firstTrustedHeader,
  getHeader,
  isUnknownGeoWriteAllowed,
  publicSessionGeoSummary,
  regionKeyPart,
  resolveRequestGeo,
  safeDecodeGeoSegment,
  selectPrecision,
}
