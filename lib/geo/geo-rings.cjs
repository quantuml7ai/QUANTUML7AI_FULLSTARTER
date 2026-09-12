// lib/geo/geo-rings.cjs
// QL7_GEO888_PREMIUM_FEEDMAP_STAGE1_V14
// Request-geo based feed selection rings. No browser GPS. No profile geo authority.

const crypto = require('node:crypto')
const { FORUM_ARCHITECTURE } = require('../forum/ql7-forum-architecture.cjs')
const { buildGeoScopes } = require('./request-geo.cjs')

function str(value) {
  return String(value ?? '').trim()
}

function normalizeGeoMode(mode) {
  const raw = str(mode || FORUM_ARCHITECTURE.feed.defaultMode).toLowerCase()
  if (raw === 'world' || raw === 'global' || raw === 'off') return 'world'
  return 'geo'
}

function normalizeFeedSort(sort) {
  const raw = str(sort || FORUM_ARCHITECTURE.feed.defaultSort).toLowerCase()
  return FORUM_ARCHITECTURE.feed.sortValues.includes(raw) ? raw : FORUM_ARCHITECTURE.feed.defaultSort
}

function stableHash(value) {
  return crypto.createHash('sha1').update(String(value || '')).digest('hex').slice(0, 16)
}

function cityScopeKeyVariants(key) {
  const clean = str(key)
  const parts = clean.split(':')
  if (parts.length !== 4 || parts[0] !== 'city') return [clean].filter(Boolean)
  const country = str(parts[1]).toLowerCase()
  const city = str(parts[3]).toLowerCase()
  if (!country || !city) return [clean].filter(Boolean)
  return Array.from(new Set([
    clean,
    `city:${country}:_:${city}`,
  ].filter(Boolean)))
}

function ring(level, key, label = '', extraKeys = []) {
  const cleanKey = str(key)
  if (!cleanKey) return null
  const keys = Array.from(new Set([cleanKey, ...(extraKeys || [])].map(str).filter(Boolean)))
  return { level: str(level), key: cleanKey, keys, label: str(label), priority: 0 }
}

function buildGeoRings(geo = {}) {
  const scopes = geo.scopes && typeof geo.scopes === 'object' ? geo.scopes : buildGeoScopes(geo)
  const rings = []
  if (geo.known && scopes.cityKey && scopes.cityKey !== 'global') rings.push(ring('city', scopes.cityKey, geo.cityLabel || geo.city || '', cityScopeKeyVariants(scopes.cityKey)))
  if (geo.known && scopes.regionKey && scopes.regionKey !== 'global' && scopes.regionKey !== scopes.cityKey) rings.push(ring('region', scopes.regionKey, geo.regionLabel || geo.region || ''))
  if (geo.known && scopes.countryKey && scopes.countryKey !== 'global' && scopes.countryKey !== scopes.regionKey) rings.push(ring('country', scopes.countryKey, geo.countryLabel || geo.countryCode || ''))
  rings.push(ring('global', scopes.globalKey || 'global', 'Global'))
  const used = new Set()
  return rings.filter(Boolean).map((item) => ({ ...item, keys: item.keys.filter((key) => !used.has(key)) })).filter((item) => {
    const keys = item.keys.filter(Boolean)
    if (!keys.length) return false
    keys.forEach((key) => used.add(key))
    return true
  }).map((item, index) => ({ ...item, priority: index }))
}

function ringsHash(rings = []) {
  const payload = (Array.isArray(rings) ? rings : []).map((item) => [item.level, ...(item.keys || [item.key]).filter(Boolean)]).join('|')
  return stableHash(payload || 'global')
}

function buildFeedSelectionPlan({ mode = 'geo', geo = {}, sort = 'random' } = {}) {
  const normalizedMode = normalizeGeoMode(mode)
  const normalizedSort = normalizeFeedSort(sort)
  if (normalizedMode === 'world') {
    const rings = [ring('global', 'global', 'Global')].filter(Boolean).map((item, index) => ({ ...item, priority: index }))
    return {
      mode: 'world',
      sort: normalizedSort,
      rings,
      ringsHash: ringsHash(rings),
      geoSelectionDisabled: true,
    }
  }
  const rings = buildGeoRings(geo)
  return {
    mode: 'geo',
    sort: normalizedSort,
    rings,
    ringsHash: ringsHash(rings),
    geoSelectionDisabled: false,
  }
}

module.exports = {
  buildFeedSelectionPlan,
  buildGeoRings,
  cityScopeKeyVariants,
  normalizeGeoMode,
  normalizeFeedSort,
  ringsHash,
}
