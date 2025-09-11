// components/LanguageSwitcher.js
'use client';

import { useI18n } from './i18n';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang">
      <button
        aria-label="Russian"
        className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
        onClick={() => setLang('ru')}
        type="button"
      >
        {t('lang_ru')}
      </button>
      <button
        aria-label="English"
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        type="button"
      >
        {t('lang_en')}
      </button>
    </div>
  );
}
