// app/subscribe/page.js
'use client';

import { useI18n } from '../../components/i18n';

export default function Subscribe() {
  const { t } = useI18n();
  return (
    <main className="hero-panel">
      <h1>{t('subscribe_title')}</h1>
      <p>{t('subscribe_sub')}</p>
      <a className="btn" href={t('bot_link')} target="_blank" rel="noreferrer">
        {t('subscribe_cta')}
      </a>
    </main>
  );
}
