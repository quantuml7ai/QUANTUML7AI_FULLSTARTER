'use client'

import Link from 'next/link'
import { useI18n } from './i18n'
import LanguageSwitcher from './LanguageSwitcher'

export default function TopBar(){
  const { t } = useI18n()
  const links = t('links')

  return (
    <header className="topbar">
      {/* ЛОГО: PNG с прозрачным фоном */}
      <Link href="/" className="brand" aria-label="Quantum L7 AI">
        <img
          src="/branding/quantum_l7_logo.png"
          alt="Quantum L7 AI"
          className="brand-logo"
          loading="eager"
          decoding="sync"
        />
      </Link>

      <nav>
        <Link href="/">{t('nav_home')}</Link>
        <Link href="/about">{t('nav_about')}</Link>
        <Link href="/exchange">{t('nav_exchange')}</Link>
        <Link href="/contact">{t('nav_contact')}</Link>
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
