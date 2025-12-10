'use client'

import { useEffect } from 'react'
import { useI18n } from './i18n'

// порядок переключения по клику
const ORDER = ['ru','en','zh','uk','ar','tr','es']
const TAG = { ru:'RU', en:'EN', zh:'中文', uk:'UA', ar:'AR', tr:'TR', es:'ES' }

// пути к PNG флагам в public/leng
// (файлы должны лежать: public/leng/en.png, public/leng/ru.png и т.д.)
const FLAG = {
  ru: '/leng/ru.png',
  en: '/leng/en.png',
  zh: '/leng/zh.png',
  uk: '/leng/uk.png',
  ar: '/leng/ar.png',
  tr: '/leng/tr.png',
  es: '/leng/es.png',
}

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
  const flagSrc = FLAG[lang] || FLAG.en

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
<span className="planet-core">
  <span
    className="planet-core-flag"
    style={{ backgroundImage: `url(${flagSrc})` }}
    aria-hidden="true"
  />
  <span className="planet-core-label" data-text={tag}>
    {tag}
  </span>
</span>
    </button>
  )
}
