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

  // собираем контент с инъекцией картинки после первого блока
  const content = []
  blocks.forEach((b, idx) => {
    content.push(
      <section className="panel" key={`b-${idx}`}>
        <h2>{b.title}</h2>
        {Array.isArray(b.paras) &&
          b.paras.map((p, i) => (
            <p className="prewrap" key={i}>
              {p}
            </p>
          ))}
        {Array.isArray(b.bullets) && b.bullets.length > 0 && (
          <ul className="bullets">
            {b.bullets.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        )}
      </section>
    )

    // после первого блока (idx === 0) вставляем квант-картинку
    if (idx === 0) {
      content.push(
        <figure className="panel" key="qc-shot">
          <img
            className="quantum-shot"
            src="/branding/qc_room.jpg"
            alt="Quantum L7 AI — quantum computing lab. We are the future of the industry."
            loading="lazy"
            decoding="async"
          />
          {/* подпись для скринридеров; визуально скрыта, если есть .sr-only в CSS */}
          <figcaption className="sr-only">
            Quantum L7 AI — We are the future of the industry
          </figcaption>
        </figure>
      )
    }
  })

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

        {/* Лента карточки Telegram */}
        <img
          className="tg-tape"
          src="/branding/telegram_card_tape_fixed.png"
          alt="Telegram card sample"
          loading="lazy"
        />
      </section>

      {/* ===== Контентные блоки (с картинкой после первого) ===== */}
      {content}

      {/* ===== Маркиза ===== */}
      <section className="marquee-wrap" aria-hidden="true">
        <div className="ррррррр" ref={marqueeRef}>

        </div>
      </section>
    </>
  )
}
