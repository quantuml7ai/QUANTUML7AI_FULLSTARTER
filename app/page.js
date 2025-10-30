'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '../components/i18n'

/** Авто-медиа: ищет существующий файл по базовому пути и списку расширений.
 * Если нашёл MP4/WebM — рендерит <video>, иначе <img>.
 * Пример: base="/branding/qc_room" → проверит qc_room.(mp4|webm|gif|webp|png|jpg|jpeg)
 */
function AutoMedia({
  base,
  exts = ['mp4', 'webm', 'gif', 'webp', 'png', 'jpg', 'jpeg'],
  className,
  alt = '',
  imgProps = {},
  videoProps = {},
}) {
  const [src, setSrc] = useState(null)
  const [kind, setKind] = useState('img') // 'img' | 'video'

  useEffect(() => {
    let dead = false

    async function tryHead(url) {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 3000)
        const r = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
        clearTimeout(t)
        if (r.ok) return true
      } catch {}
      return false
    }

    async function tryByte(url) {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 3000)
        const r = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          cache: 'no-store',
          signal: controller.signal,
        })
        clearTimeout(t)
        // 206 Partial Content (или 200 маленький файл) — ок
        if (r.ok) return true
      } catch {}
      return false
    }

    async function pick() {
      for (const ext of exts) {
        const url = `${base}.${ext}`
        // сначала HEAD (если сервер даёт), иначе «укус» первого байта
        const ok = (await tryHead(url)) || (await tryByte(url))
        if (ok) {
          if (dead) return
          setSrc(url)
          setKind(ext === 'mp4' || ext === 'webm' ? 'video' : 'img')
          return
        }
      }
      // ничего не нашли — оставляем null
    }

    pick()
    return () => {
      dead = true
    }
  }, [base, exts.join(',')])

  if (!src) return null

  if (kind === 'video') {
    return (
      <video
        className={className}
        src={src}
        playsInline
        muted
        autoPlay
        loop
        controls={false}
        {...videoProps}
      />
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...imgProps}
    />
  )
}

/** Адаптивный встраиваемый iframe (резиновая ширина, 16:9) */
function ResponsiveEmbed({ src, title = '' }) {
  if (!src) return null
  return (
    <div className="embed-wrap">
      <iframe
        src={src}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <style jsx>{`
        .embed-wrap {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
          border-radius: 12px;
          overflow: hidden;
        }
        .embed-wrap :global(iframe) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
      `}</style>
    </div>
  )
}

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

  // собираем контент; Bloomberg TV ставим ПЕРЕД qc_room
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

    // СРАЗУ после ПЕРВОГО блока — сначала Bloomberg TV, затем qc_room
    if (idx === 0) {
      // Bloomberg TV блок
      content.push(
        <section className="panel" key="live-bloomberg">
          <h2>Live: Bloomberg US</h2>
          <ResponsiveEmbed
            src={'https://www.bloomberg.com/live/us'}
            title="Bloomberg US — Live"
          />
        </section>
      )

      // qc_room изображение — ТОЛЬКО qc_room.jpg
      content.push(
        <figure className="panel" key="qc-shot">
          <AutoMedia
            base="/branding/qc_room"
            exts={['jpg']}                     // ← читаем только qc_room.jpg
            className="quantum-shot"
            alt="Quantum L7 AI — quantum computing lab. We are the future of the industry."
            imgProps={{}}
            videoProps={{}}
          />
          <figcaption className="sr-only">
            Quantum L7 AI — We are the future of the industry
          </figcaption>
        </figure>
      )
    }
  })

  return (
    <div className="center-wrap">
      {/* ===== HERO ===== */}
      <section className="panel">
        <h1>{t('hero_title')}</h1>
        
        {/* Лента карточки Telegram — авто-медиа */}
        <AutoMedia
          base="/branding/telegram_card_tape_fixed"
          className="tg-tape"
          alt="Telegram card sample"
        />
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
          <Link className="qcoinLabel" href="/forum">
            {t('QCoin')}
          </Link>
        </div>

      </section>

      {/* ===== Контентные блоки ===== */}
      {content}

      {/* ===== Маркиза ===== */}
      <section className="marquee-wrap" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>

      {/* ===== ИКОНКИ ПОСЛЕ МАРКИЗЫ (БЕЗ БЛОКА) ===== */}
      <div className="icons-row">
        {/* Размер каждой иконки можно менять через CSS-переменную --size */}
        <Link
          href="/privacy"
          className="icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <img
            className="click-icon"
            src="/click/policy.png"
            alt="Privacy"
            draggable="false"
          />
        </Link>

        <Link
          href="/contact"
          className="icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <img
            className="click-icon"
            src="/click/support.png"
            alt="Support"
            draggable="false"
          />
        </Link>
      </div>

      <style jsx>{`
        .center-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .panel {
          width: 100%;
          max-width: 960px;
          text-align: center;
        }
        .row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tg-tape {
          margin-top: 16px;
          max-width: 100%;
          height: auto;
        }
        .prewrap {
          white-space: pre-wrap;
        }
        .bullets {
          text-align: left;
          display: inline-block;
          margin: 0 auto;
        }

        /* ===== Live block ===== */
        .live-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        .live-col h3 {
          margin: 0 0 8px 0;
          font-weight: 600;
        }
        @media (min-width: 720px) {
          .live-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* ===== Icons after marquee (no panel) ===== */
        .icons-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-evenly; /* симметричное расстояние */
          gap: 24px;
          flex-wrap: wrap; /* адаптация к узким экранам */
          padding: 16px 0 8px;
        }

        .icon-link {
          display: inline-block;
          line-height: 0;
          cursor: pointer;
          outline: none;
        }

        .click-icon {
          width: var(--size, 120px);
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none; /* клик ловит ссылка */
          background: transparent;

          /* ===== активная анимация по умолчанию ===== */
          animation:
            floatY 3s ease-in-out infinite,
            glow 2.4s ease-in-out infinite alternate;
        }

        /* наведение/фокус: подпрыгивание + усиленное свечение */
        .icon-link:hover .click-icon,
        .icon-link:focus-visible .click-icon {
          animation:
            floatY 3s ease-in-out infinite,
            glow-strong 1.6s ease-in-out infinite alternate,
            bounce 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ——— Ключевые кадры ——— */
        @keyframes floatY {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-8px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        @keyframes glow {
          0%   { filter: drop-shadow(0 2px 6px rgba(0, 200, 255, 0.18)); }
          100% { filter: drop-shadow(0 10px 22px rgba(0, 200, 255, 0.45)); }
        }

        @keyframes glow-strong {
          0%   { filter: drop-shadow(0 4px 10px rgba(0, 200, 255, 0.28)); }
          100% { filter: drop-shadow(0 14px 32px rgba(0, 220, 255, 0.7)); }
        }

        @keyframes bounce {
          0%   { transform: translateY(0) scale(1); }
          35%  { transform: translateY(-16px) scale(1.06); }
          60%  { transform: translateY(0) scale(0.98); }
          85%  { transform: translateY(-8px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }

        /* Доступность: уважение prefer-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .click-icon { animation: none; }
          .icon-link:hover .click-icon,
          .icon-link:focus-visible .click-icon { animation: none; }
        }
      `}</style>
    </div>
  )
}
