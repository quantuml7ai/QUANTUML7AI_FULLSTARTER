'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DEFAULT_LANG, SUPPORTED_LANGS, normalizeLang, useI18n } from '../i18n'

// QL7_TRUST_IDENTITY_HYDRATED_ROOT_LOCALE_AUTHORITY_R13
// QL7_DOCUMENT_ROOT_LOCALE_SINGLE_WRITER_R14
const TRUST_ROUTE_RE = /^\/(en|ru|uk|es|tr|ar|zh)\/trust-and-identity\/?$/

function toSafeLang(lang) {
  const normalized = normalizeLang(lang)
  return normalized && SUPPORTED_LANGS.includes(normalized) ? normalized : DEFAULT_LANG
}

function toTrustRootLocale(lang) {
  const safeLang = toSafeLang(lang)
  return { lang: safeLang, dir: safeLang === 'ar' ? 'rtl' : 'ltr' }
}

function toAppRootLocale(lang) {
  const safeLang = toSafeLang(lang)
  // Product geometry is intentionally LTR outside the canonical Trust Arabic route.
  return { lang: safeLang, dir: 'ltr' }
}

export function resolveDocumentRootLocale(pathname = '', uiLang = DEFAULT_LANG) {
  const match = String(pathname || '').match(TRUST_ROUTE_RE)
  if (match) return toTrustRootLocale(match[1])
  return toAppRootLocale(uiLang)
}

export default function RootLocaleRuntime() {
  const pathname = usePathname()
  const { lang: uiLang } = useI18n()

  useEffect(() => {
    const root = document.documentElement
    if (!root) return
    const next = resolveDocumentRootLocale(pathname, uiLang)
    root.setAttribute('lang', next.lang)
    root.setAttribute('dir', next.dir)
  }, [pathname, uiLang])

  return null
}
