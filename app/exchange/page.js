// app/exchange/page.js
'use client';

import { useI18n } from '../../components/i18n';

export default function Exchange() {
  const { t } = useI18n();
  return (
    <main className="hero-panel">
      <h1>{t('exchange_title')}</h1>
      <p>{t('exchange_sub')}</p>
      <a className="btn" href="/subscribe">{t('exchange_cta')}</a>
    </main>
  );
}
