'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '../components/i18n'

export default function Home() {
  const { t } = useI18n()

  // бесшовная бегущая строка
  const marqueeRef = useRef(null)
  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
    }
  }, [])

  // страховка: если в словаре нет массива блоков
  const raw = t('home_blocks')
  const blocks = Array.isArray(raw) ? raw : []

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="panel">
        <h1>{t('hero_title')}</h1>
        <p className="prewrap">{t('hero_subtitle')}</p>

        <div className="row">
          <a
            className="btn"
            href={t('links').bot}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('hero_cta')}
          </a>
          <Link className="btn ghost" href="/about">
            {t('hero_learn_more')}
          </Link>
        </div>

        {/* ВСТАВКА PNG-ЛЕНТЫ С КАРТОЧКОЙ TELEGRAM */}
        <img
          className="tg-tape"
          src="/branding/telegram_card_tape_fixed.png"
          alt="Telegram card sample"
          loading="lazy"
        />
      </section>

      {/* ===== Контентные блоки ===== */}
      {blocks.map((b, idx) => (
        <section className="panel" key={idx}>
          <h2>{b.title}</h2>
          {Array.isArray(b.paras) &&
            b.paras.map((p, i) => (
              <p className="prewrap" key={i}>
                {p}
              </p>
            ))}
          {Array.isArray(b.bullets) && b.bullets.length > 0 ? (
            <ul className="bullets">
              {b.bullets.map((x, i) => (
                <li key={i}>• {x}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {/* ===== Маркиза ===== */}
      <section className="marquee-wrap" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>
    </>
  )
}
