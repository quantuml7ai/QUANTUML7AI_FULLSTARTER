import { SITE_ORIGIN, toAbsoluteSiteUrl } from './siteOrigin.js'

export const TRUST_IDENTITY_LANGS = Object.freeze(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])
export const TRUST_IDENTITY_DEFAULT_LANG = 'en'
export const TRUST_IDENTITY_CONTENT_VERSION = '2026-08-14-v3'
export const TRUST_IDENTITY_LAST_REVIEWED = '2026-08-14'

export const TRUST_IDENTITY_PATHS_BY_LANG = Object.freeze(
  Object.fromEntries(TRUST_IDENTITY_LANGS.map((lang) => [lang, `/${lang}/trust-and-identity`])),
)

export const TRUST_IDENTITY_X_DEFAULT_PATH = TRUST_IDENTITY_PATHS_BY_LANG[TRUST_IDENTITY_DEFAULT_LANG]

export const TRUST_IDENTITY_NATIVE_LANGUAGE_NAMES = Object.freeze({
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  es: 'Español',
  tr: 'Türkçe',
  ar: 'العربية',
  zh: '中文',
})

const OPEN_GRAPH_LOCALES = Object.freeze({
  en: 'en_US',
  ru: 'ru_RU',
  uk: 'uk_UA',
  es: 'es_ES',
  tr: 'tr_TR',
  ar: 'ar_AR',
  zh: 'zh_CN',
})

export function normalizeTrustIdentityLang(raw = '') {
  let lang = String(raw || '').trim().toLowerCase().split(/[-_]/)[0]
  if (lang === 'ua') lang = 'uk'
  return TRUST_IDENTITY_LANGS.includes(lang) ? lang : null
}

export function getTrustIdentityPath(raw = TRUST_IDENTITY_DEFAULT_LANG) {
  const lang = normalizeTrustIdentityLang(raw) || TRUST_IDENTITY_DEFAULT_LANG
  return TRUST_IDENTITY_PATHS_BY_LANG[lang]
}

export function getTrustIdentityAbsoluteUrl(raw = TRUST_IDENTITY_DEFAULT_LANG) {
  return toAbsoluteSiteUrl(getTrustIdentityPath(raw))
}

export function buildTrustIdentityAlternates({ absolute = false } = {}) {
  const map = Object.fromEntries(
    TRUST_IDENTITY_LANGS.map((lang) => [
      lang,
      absolute ? getTrustIdentityAbsoluteUrl(lang) : TRUST_IDENTITY_PATHS_BY_LANG[lang],
    ]),
  )
  map['x-default'] = absolute
    ? getTrustIdentityAbsoluteUrl(TRUST_IDENTITY_DEFAULT_LANG)
    : TRUST_IDENTITY_X_DEFAULT_PATH
  return Object.freeze(map)
}

export function toTrustIdentityOpenGraphLocale(raw = TRUST_IDENTITY_DEFAULT_LANG) {
  const lang = normalizeTrustIdentityLang(raw) || TRUST_IDENTITY_DEFAULT_LANG
  return OPEN_GRAPH_LOCALES[lang]
}

export function isTrustIdentityPath(pathname = '') {
  const path = String(pathname || '').trim()
  return Object.values(TRUST_IDENTITY_PATHS_BY_LANG).includes(path)
}

export const TRUST_IDENTITY_ORIGIN = SITE_ORIGIN
