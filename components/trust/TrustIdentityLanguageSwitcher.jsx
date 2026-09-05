'use client'

import Link from 'next/link'
import {
  TRUST_IDENTITY_LANGS,
  TRUST_IDENTITY_NATIVE_LANGUAGE_NAMES,
  getTrustIdentityPath,
} from '../../lib/seo/trustIdentityRoutes.js'
import styles from './TrustIdentityArticle.module.css'

export default function TrustIdentityLanguageSwitcher({ lang, label, variant = 'default' }) {
  const syncLanguage = (nextLang) => {
    try { window.localStorage.setItem('ql7_lang', nextLang) } catch {}
  }

  const currentName = TRUST_IDENTITY_NATIVE_LANGUAGE_NAMES[lang] || TRUST_IDENTITY_NATIVE_LANGUAGE_NAMES.en
  const isHeroFinalR8 = variant === 'hero-final-r8'
  const wrapClassName = isHeroFinalR8
    ? `${styles.languageSelectorWrap} ${styles.heroFinalLanguageWrapR8}`
    : styles.languageSelectorWrap

  return (
    <nav
      className={wrapClassName}
      aria-label={label || 'Language'}
      data-ql7-trust-language-selector="1"
      data-ql7-trust-language-overlay="1"
      data-ql7-trust-language-variant={isHeroFinalR8 ? 'hero-final-r8' : 'default'}
    >
      <span className={styles.languageSelectorLabel}>{label || 'Language'}</span>
      <details className={styles.languageSelector}>
        <summary className={styles.languageSelectorTrigger}>
          <span className={styles.languageSelectorGlyph} aria-hidden="true"><i /><i /></span>
          <span className={styles.languageSelectorCurrent}>{currentName}</span>
          <span className={styles.languageSelectorCode}>{String(lang || 'en').toUpperCase()}</span>
          <span className={styles.languageSelectorChevron} aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.languageMenu} role="list">
          {TRUST_IDENTITY_LANGS.map((itemLang) => (
            <Link
              key={itemLang}
              className={styles.languageMenuItem}
              data-current={itemLang === lang ? '1' : '0'}
              href={getTrustIdentityPath(itemLang)}
              hrefLang={itemLang}
              lang={itemLang}
              aria-current={itemLang === lang ? 'page' : undefined}
              onClick={() => syncLanguage(itemLang)}
              role="listitem"
            >
              <span className={styles.languageMenuName}>{TRUST_IDENTITY_NATIVE_LANGUAGE_NAMES[itemLang]}</span>
              <span className={styles.languageMenuCode}>{itemLang.toUpperCase()}</span>
              <span className={styles.languageMenuCheck} aria-hidden="true">{itemLang === lang ? '✓' : '→'}</span>
            </Link>
          ))}
        </div>
      </details>
    </nav>
  )
}
