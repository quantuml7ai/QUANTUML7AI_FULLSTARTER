// app/about/page.js
'use client';

import { useI18n } from '../../components/i18n';

export default function About() {
  const { t } = useI18n();
  return (
    <main className="hero-panel">
      <h1>{t('about_title')}</h1>
      <p>{t('about_sub')}</p>
      <a className="btn" href={t('bot_link')} target="_blank" rel="noreferrer">
        Telegram
      </a>
    </main>
  );
}
