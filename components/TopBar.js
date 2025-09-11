'use client';

import { useI18n } from './i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopBar() {
  const { t } = useI18n();

  return (
    <header className="topbar">
      <div className="brand">{t('brand')}</div>
      <nav>
        <a href="/subscribe">{t('nav_subscribe')}</a>
        <a href="/exchange">{t('nav_exchange')}</a>
        <a href="/about">{t('nav_about')}</a>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
