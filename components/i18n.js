'use client'

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import defaultDict from './i18n-dicts/en.js'
import { I18N_DEFAULT_LANG, I18N_SUPPORTED_LANGS } from './i18n-dicts/manifest.js'

export const SUPPORTED_LANGS = I18N_SUPPORTED_LANGS
export const DEFAULT_LANG = I18N_DEFAULT_LANG

const EMPTY_DICT = Object.freeze({})
const dictCache = new Map([[DEFAULT_LANG, defaultDict]])
const DICT_LOADERS = Object.freeze({
  en: () => import('./i18n-dicts/en.js'),
  ru: () => import('./i18n-dicts/ru.js'),
  zh: () => import('./i18n-dicts/zh.js'),
  uk: () => import('./i18n-dicts/uk.js'),
  ar: () => import('./i18n-dicts/ar.js'),
  tr: () => import('./i18n-dicts/tr.js'),
  es: () => import('./i18n-dicts/es.js'),
})

const I18nContext = createContext({
  t: (key) => key,
  lang: DEFAULT_LANG,
  locale: DEFAULT_LANG,
  currentLang: DEFAULT_LANG,
  setLang: () => {},
  langReady: false,
})

function hasOwn(dict, key) {
  return !!dict && Object.prototype.hasOwnProperty.call(dict, key)
}

function isSupportedLang(lang) {
  return SUPPORTED_LANGS.includes(lang)
}

export function normalizeLang(raw) {
  if (!raw) return null
  const normalized = String(raw).trim().toLowerCase()
  if (!normalized) return null
  const base = normalized.split(/[-_]/)[0]
  if (base === 'ua') return 'uk'
  return base || null
}

export function resolvePreferredLang({
  storedLang = null,
  navigatorLanguages = [],
  navigatorLanguage = '',
} = {}) {
  const stored = normalizeLang(storedLang)
  if (stored && isSupportedLang(stored)) return stored

  const prefs = []
  if (Array.isArray(navigatorLanguages)) prefs.push(...navigatorLanguages)
  if (navigatorLanguage) prefs.push(navigatorLanguage)

  for (const pref of prefs) {
    const normalized = normalizeLang(pref)
    if (normalized && isSupportedLang(normalized)) return normalized
  }

  return null
}

export async function loadLanguageDict(lang) {
  const target = isSupportedLang(lang) ? lang : DEFAULT_LANG
  if (dictCache.has(target)) return dictCache.get(target)

  const loader = DICT_LOADERS[target] || DICT_LOADERS[DEFAULT_LANG]
  const mod = await loader()
  const nextDict = mod?.default && typeof mod.default === 'object' ? mod.default : EMPTY_DICT
  dictCache.set(target, nextDict)
  return nextDict
}

function readStoredLang() {
  try {
    const stored = localStorage.getItem('ql7_lang')
    return isSupportedLang(stored) ? stored : null
  } catch {
    return null
  }
}

function readNavigatorPrefs() {
  if (typeof navigator === 'undefined') {
    return { languages: [], language: '' }
  }

  try {
    return {
      languages: Array.isArray(navigator.languages) ? navigator.languages : [],
      language: navigator.language || '',
    }
  } catch {
    return { languages: [], language: '' }
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG)
  const [langReady, setLangReady] = useState(false)
  const [activeDict, setActiveDict] = useState(defaultDict)

  useEffect(() => {
    const { languages, language } = readNavigatorPrefs()
    const nextLang = resolvePreferredLang({
      storedLang: readStoredLang(),
      navigatorLanguages: languages,
      navigatorLanguage: language,
    }) || DEFAULT_LANG

    setLangState((prev) => (prev === nextLang ? prev : nextLang))
    setLangReady(true)
  }, [])

  useEffect(() => {
    const target = isSupportedLang(lang) ? lang : DEFAULT_LANG
    let cancelled = false

    if (target === DEFAULT_LANG) {
      setActiveDict(defaultDict)
    } else {
      loadLanguageDict(target)
        .then((nextDict) => {
          if (cancelled) return
          setActiveDict(nextDict && Object.keys(nextDict).length ? nextDict : defaultDict)
        })
        .catch(() => {
          if (cancelled) return
          setActiveDict(defaultDict)
        })
    }

    if (langReady) {
      try { localStorage.setItem('ql7_lang', target) } catch {}
    }

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', target)
      document.documentElement.setAttribute('dir', target === 'ar' ? 'rtl' : 'ltr')
    }

    return () => {
      cancelled = true
    }
  }, [lang, langReady])

  const setLang = useCallback((next) => {
    setLangState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next
      const normalized = normalizeLang(raw)
      return normalized && isSupportedLang(normalized) ? normalized : DEFAULT_LANG
    })
  }, [])

  const t = useCallback((key) => {
    if (hasOwn(activeDict, key)) return activeDict[key]
    if (hasOwn(defaultDict, key)) return defaultDict[key]
    return key
  }, [activeDict])

  const value = useMemo(() => ({
    t,
    lang,
    locale: lang,
    currentLang: lang,
    setLang,
    langReady,
  }), [t, lang, setLang, langReady])

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n() {
  return useContext(I18nContext)
}
