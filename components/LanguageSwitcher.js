// components/LanguageSwitcher.js
'use client'

import { useI18n } from './i18n'

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const isEN = lang === 'en'
  const next = isEN ? 'ru' : 'en'
  const title = isEN ? 'Переключить на русский' : 'Switch to English'

  return (
    <button
      type="button"
      className="planet-lang"
      aria-label={title}
      title={title}
      data-lang={lang}
      onClick={() => setLang(next)}
    >
      <span className="planet-core">{isEN ? 'EN' : 'RU'}</span>
    </button>
  )
}
