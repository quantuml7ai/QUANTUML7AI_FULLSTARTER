'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '../components/i18n';  // правильный путь, один уровень вверх

const TG_BOT = process.env.NEXT_PUBLIC_TG_BOT || '@YourBot';

export default function Home() {
  const { t } = useI18n();
  const marqueeRef = useRef(null);

  useEffect(() => {
    if (marqueeRef.current) {
      const el = marqueeRef.current;
      el.innerHTML += el.innerHTML; // дублируем текст для плавного скролла
    }
  }, []);

  return (
    <main>
      {/* Hero блок */}
      <section className="panel">
        <h1>{t('hero_title')}</h1>
        <p>{t('hero_subtitle')}</p>
        <div className="row">
          <a className="btn" href={TG_BOT} target="_blank" rel="noopener noreferrer">
            {t('hero_cta')}
          </a>
          <a className="btn ghost" href="/about">
            {t('hero_learn_more')}
          </a>
        </div>
      </section>

      {/* Бегущая строка */}
      <section className="marquee-wrap" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>
    </main>
  );
}
