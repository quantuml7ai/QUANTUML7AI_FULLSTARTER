import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import ar from '../../../components/i18n-dicts/ar.js'
import en from '../../../components/i18n-dicts/en.js'
import es from '../../../components/i18n-dicts/es.js'
import ru from '../../../components/i18n-dicts/ru.js'
import tr from '../../../components/i18n-dicts/tr.js'
import uk from '../../../components/i18n-dicts/uk.js'
import zh from '../../../components/i18n-dicts/zh.js'
import {
  I18N_DEFAULT_LANG,
  I18N_DICT_META,
  I18N_SUPPORTED_LANGS,
} from '../../../components/i18n-dicts/manifest.js'
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  loadLanguageDict,
  normalizeLang,
  resolvePreferredLang,
} from '../../../components/i18n.js'

const DICTS = { ar, en, es, ru, tr, uk, zh }

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

describe('split i18n dictionaries', () => {
  it('preserves key counts and hashes for every language', () => {
    expect(DEFAULT_LANG).toBe(I18N_DEFAULT_LANG)
    expect(SUPPORTED_LANGS).toEqual(I18N_SUPPORTED_LANGS)

    for (const lang of I18N_SUPPORTED_LANGS) {
      const dict = DICTS[lang]
      expect(dict).toBeTruthy()
      expect(Object.keys(dict)).toHaveLength(I18N_DICT_META[lang].keyCount)
      expect(hashDict(dict)).toBe(I18N_DICT_META[lang].hash)
    }
  })

  it('keeps language normalization and device-language resolution', () => {
    expect(normalizeLang('ru-RU')).toBe('ru')
    expect(normalizeLang('ua_UA')).toBe('uk')
    expect(normalizeLang(' EN ')).toBe('en')

    expect(resolvePreferredLang({
      storedLang: 'tr',
      navigatorLanguages: ['ru-RU'],
      navigatorLanguage: 'en-US',
    })).toBe('tr')

    expect(resolvePreferredLang({
      storedLang: 'xx',
      navigatorLanguages: ['ua-UA'],
      navigatorLanguage: 'en-US',
    })).toBe('uk')

    expect(resolvePreferredLang({
      storedLang: null,
      navigatorLanguages: ['xx-YY'],
      navigatorLanguage: 'es-MX',
    })).toBe('es')

    expect(resolvePreferredLang({
      storedLang: null,
      navigatorLanguages: ['xx-YY'],
      navigatorLanguage: 'yy-ZZ',
    })).toBeNull()
  })

  it('loads only the requested split dictionary module', async () => {
    await expect(loadLanguageDict('ru')).resolves.toEqual(ru)
    await expect(loadLanguageDict('es')).resolves.toEqual(es)
    await expect(loadLanguageDict('xx')).resolves.toEqual(en)
  })
})
