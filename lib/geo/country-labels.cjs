// lib/geo/country-labels.cjs
// QL7_GEO111_I18N_LABELS_V1C
// Country labels follow the existing geo targeting source: lib/geo/countries.js -> ISO code -> Intl.DisplayNames -> i18n dictionary fallback.

const LOCALE_BY_LANG = Object.freeze({
  en: 'en',
  ru: 'ru',
  uk: 'uk',
  es: 'es',
  zh: 'zh-Hans',
  ar: 'ar',
  tr: 'tr',
})

function normalizeLang(lang) {
  const value = String(lang || 'en').toLowerCase().slice(0, 2)
  return LOCALE_BY_LANG[value] ? value : 'en'
}

function normalizeCountryCode(countryCode) {
  const value = String(countryCode || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(value)) return ''
  return value
}

function countryI18nKey(countryCode) {
  const code = normalizeCountryCode(countryCode)
  return code ? 'country_' + code.toLowerCase() : 'geo_country_unknown'
}

function intlCountryLabel(countryCode, lang = 'en') {
  const code = normalizeCountryCode(countryCode)
  if (!code) return ''
  const locale = LOCALE_BY_LANG[normalizeLang(lang)] || 'en'
  try {
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    const label = names.of(code)
    if (label && label !== code) return label
  } catch {}
  return ''
}

function resolveCountryLabel(countryCode, lang = 'en', dict = null) {
  const code = normalizeCountryCode(countryCode)
  const unknown = dict?.geo_country_unknown || dict?.forum_geo_detect_unknown || 'Country not detected'
  if (!code) return unknown
  const dictLabel = dict?.[countryI18nKey(code)]
  if (typeof dictLabel === 'string' && dictLabel.trim()) return dictLabel
  const intlLabel = intlCountryLabel(code, lang)
  if (intlLabel) return intlLabel
  return code
}

function buildCountryGeoDisplay(input = {}, lang = 'en', dict = null) {
  const country = resolveCountryLabel(input.country || input.countryCode, lang, dict)
  const region = String(input.region || input.regionCode || '').trim()
  return region ? country + ' / ' + region : country
}

module.exports = {
  LOCALE_BY_LANG,
  normalizeLang,
  normalizeCountryCode,
  countryI18nKey,
  intlCountryLabel,
  resolveCountryLabel,
  buildCountryGeoDisplay,
}
