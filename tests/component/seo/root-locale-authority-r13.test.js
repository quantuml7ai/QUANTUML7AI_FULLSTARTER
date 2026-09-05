import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const nav = vi.hoisted(() => ({ pathname: '/en/trust-and-identity' }))

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
}))

import { I18nProvider, useI18n } from '../../../components/i18n.js'
import RootLocaleRuntime, {
  resolveDocumentRootLocale,
} from '../../../components/seo/RootLocaleRuntime.jsx'

function Probe() {
  const { lang, langReady, setLang } = useI18n()
  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { 'data-testid': 'i18n-probe' },
      `${lang}:${langReady}`,
    ),
    React.createElement(
      'button',
      { type: 'button', 'data-testid': 'set-ar', onClick: () => setLang('ar') },
      'AR',
    ),
    React.createElement(
      'button',
      { type: 'button', 'data-testid': 'set-uk', onClick: () => setLang('uk') },
      'UK',
    ),
  )
}

function Harness() {
  return React.createElement(
    I18nProvider,
    null,
    React.createElement(RootLocaleRuntime, { key: 'root-locale-runtime' }),
    React.createElement(Probe, { key: 'probe' }),
  )
}

describe('R14 final document root locale authority', () => {
  beforeEach(() => {
    nav.pathname = '/en/trust-and-identity'
    window.localStorage.clear()
    document.documentElement.setAttribute('lang', 'en')
    document.documentElement.setAttribute('dir', 'ltr')
  })

  test('resolver preserves product LTR geometry outside Trust while Arabic Trust is RTL', () => {
    expect(resolveDocumentRootLocale('/forum', 'ar')).toEqual({ lang: 'ar', dir: 'ltr' })
    expect(resolveDocumentRootLocale('/forum', 'uk')).toEqual({ lang: 'uk', dir: 'ltr' })
    expect(resolveDocumentRootLocale('/ar/trust-and-identity', 'uk')).toEqual({ lang: 'ar', dir: 'rtl' })
    expect(resolveDocumentRootLocale('/en/trust-and-identity', 'ar')).toEqual({ lang: 'en', dir: 'ltr' })
  })

  test('English Trust URL survives a conflicting stored Ukrainian UI locale', async () => {
    window.localStorage.setItem('ql7_lang', 'uk')
    render(React.createElement(Harness))

    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('uk:true'))
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  test('Arabic Trust URL keeps ar/rtl while the UI language changes underneath it', async () => {
    nav.pathname = '/ar/trust-and-identity'
    window.localStorage.setItem('ql7_lang', 'en')
    render(React.createElement(Harness))

    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('en:true'))
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    fireEvent.click(screen.getByTestId('set-uk'))
    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('uk:true'))
    await waitFor(() => expect(window.localStorage.getItem('ql7_lang')).toBe('uk'))
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })

  test('normal UI language switching updates root lang but keeps the ecosystem LTR', async () => {
    nav.pathname = '/forum'
    window.localStorage.setItem('ql7_lang', 'en')
    render(React.createElement(Harness))

    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('en:true'))
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(document.documentElement.dir).toBe('ltr')

    fireEvent.click(screen.getByTestId('set-ar'))
    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('ar:true'))
    await waitFor(() => expect(document.documentElement.lang).toBe('ar'))
    await waitFor(() => expect(window.localStorage.getItem('ql7_lang')).toBe('ar'))
    expect(document.documentElement.dir).toBe('ltr')

    fireEvent.click(screen.getByTestId('set-uk'))
    await waitFor(() => expect(screen.getByTestId('i18n-probe')).toHaveTextContent('uk:true'))
    await waitFor(() => expect(document.documentElement.lang).toBe('uk'))
    await waitFor(() => expect(window.localStorage.getItem('ql7_lang')).toBe('uk'))
    expect(document.documentElement.dir).toBe('ltr')
  })
})
