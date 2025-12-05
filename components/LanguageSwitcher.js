// components/LanguageSwitcher.js
'use client'

import { useEffect } from 'react'
import { useI18n } from './i18n'

// порядок переключения по клику
const ORDER = ['ru','en','zh','uk','ar','tr','es']
const TAG = { ru:'RU', en:'EN', zh:'中文', uk:'UA', ar:'AR', tr:'TR', es:'ES' }

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  // держим направление письма в актуальном состоянии (арабский = rtl)
  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  const goNext = () => {
    const i = Math.max(0, ORDER.indexOf(lang))
    const next = ORDER[(i + 1) % ORDER.length]
    setLang(next)
  }

  // поддержка клавиатуры: Enter/Space — вперёд, ←/→ — листать
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goNext() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const i = Math.max(0, ORDER.indexOf(lang))
      const prev = ORDER[(i - 1 + ORDER.length) % ORDER.length]
      setLang(prev)
    }
  }

  const tag = TAG[lang] || 'EN'

  return (
    <button
      type="button"
      className="planet-lang"
      data-lang={lang}
      title={tag}
      aria-label={`Language: ${tag}. Click to switch`}
      aria-live="polite"
      onClick={goNext}
      onKeyDown={onKeyDown}
      translate="no"
    >
      <span className="planet-core">{tag}</span>
    </button>
  )
}
