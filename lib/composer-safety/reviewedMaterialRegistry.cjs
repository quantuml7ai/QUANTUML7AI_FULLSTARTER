'use strict'

// Literal requires keep the complete reviewed corpus reachable in Next.js server bundles.
const DOCUMENTS = Object.freeze({
  ar: require('./reviewedMaterial/ar.json'),
  az: require('./reviewedMaterial/az.json'),
  bg: require('./reviewedMaterial/bg.json'),
  cs: require('./reviewedMaterial/cs.json'),
  da: require('./reviewedMaterial/da.json'),
  de: require('./reviewedMaterial/de.json'),
  el: require('./reviewedMaterial/el.json'),
  en: require('./reviewedMaterial/en.json'),
  es: require('./reviewedMaterial/es.json'),
  fi: require('./reviewedMaterial/fi.json'),
  fr: require('./reviewedMaterial/fr.json'),
  he: require('./reviewedMaterial/he.json'),
  hr: require('./reviewedMaterial/hr.json'),
  hu: require('./reviewedMaterial/hu.json'),
  it: require('./reviewedMaterial/it.json'),
  ja: require('./reviewedMaterial/ja.json'),
  ka: require('./reviewedMaterial/ka.json'),
  kk: require('./reviewedMaterial/kk.json'),
  ko: require('./reviewedMaterial/ko.json'),
  nl: require('./reviewedMaterial/nl.json'),
  no: require('./reviewedMaterial/no.json'),
  pl: require('./reviewedMaterial/pl.json'),
  pt: require('./reviewedMaterial/pt.json'),
  ro: require('./reviewedMaterial/ro.json'),
  ru: require('./reviewedMaterial/ru.json'),
  sk: require('./reviewedMaterial/sk.json'),
  sl: require('./reviewedMaterial/sl.json'),
  sr: require('./reviewedMaterial/sr.json'),
  sv: require('./reviewedMaterial/sv.json'),
  tr: require('./reviewedMaterial/tr.json'),
  uk: require('./reviewedMaterial/uk.json'),
  zh: require('./reviewedMaterial/zh.json'),
})

const LOCALES = Object.freeze(Object.keys(DOCUMENTS))

function normalizeLocale(locale = 'en') {
  const value = String(locale || 'en').toLowerCase().split(/[-_]/u)[0]
  return Object.hasOwn(DOCUMENTS, value) ? value : 'en'
}

function getComposerReviewedMaterialDocument(locale = 'en') {
  return DOCUMENTS[normalizeLocale(locale)]
}

function getComposerReviewedMaterialRows(locale = 'en') {
  const rows = getComposerReviewedMaterialDocument(locale)?.rows
  return Array.isArray(rows) ? rows : []
}

function auditComposerReviewedMaterialRegistry() {
  const perLocale = Object.fromEntries(LOCALES.map((locale) => {
    const document = getComposerReviewedMaterialDocument(locale)
    const rowCount = getComposerReviewedMaterialRows(locale).length
    const expectedFloor = document?.nativeMaterialTarget === true ? 792 : 536
    return [locale, Object.freeze({ rowCount, expectedFloor, nativeMaterialTarget: document?.nativeMaterialTarget === true })]
  }))
  const failures = LOCALES.filter((locale) => {
    const document = getComposerReviewedMaterialDocument(locale)
    const row = perLocale[locale]
    return document?.locale !== locale || document?.schema !== 'ql7.composer.safety-reviewed-material' || row.rowCount < row.expectedFloor
  })
  const rowCount = Object.values(perLocale).reduce((sum, row) => sum + row.rowCount, 0)
  return Object.freeze({
    ok: LOCALES.length === 32 && rowCount >= 19200 && failures.length === 0,
    localeCount: LOCALES.length,
    rowCount,
    perLocale: Object.freeze(perLocale),
    failures: Object.freeze(failures),
  })
}

module.exports = {
  LOCALES,
  normalizeLocale,
  getComposerReviewedMaterialDocument,
  getComposerReviewedMaterialRows,
  auditComposerReviewedMaterialRegistry,
}
