// app/about/page.js

/* eslint-disable @next/next/no-img-element */
'use client'

import { useI18n } from '../../components/i18n'
import { useRef, useEffect } from 'react'
import HomeBetweenBlocksAd from '../ads'

/* ===== Маркиза как на главной: бесшовно, full-bleed, без «пропаданий» ===== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  return (
    // no-gutters — отключаем глобальные гаттеры; full-bleed через отрицательные маргины
    <section className="marquee-wrap no-gutters" aria-hidden="true">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>
 
    </section>
  )
}

export default function AboutPage() {
  const { t } = useI18n()

  const title    = t('about_title')
  const parasAll = t('about_paragraphs') || []
  const raw      = t('about_sections')   || []
  const bullets  = t('about_bullets')    || []
  const links    = t('links')            || {}

  // Собираем секции из словаря (оставлено как в текущем файле)
  const sections = raw.length
    ? raw.map((s) => ({
        title: s?.title || '',
        paras: Array.isArray(s?.paras)
          ? s.paras
          : (Array.isArray(s?.parasIdx)
              ? s.parasIdx.map((i) => parasAll[i]).filter(Boolean)
              : []),
      }))
    : [{ title: '', paras: parasAll }]
  // Варианты путей к короткому 16:9-видео под заголовком страницы
  const videoSources = [
    '/branding/about-loop.mp4',
    '/about-loop.mp4',
    '/video_2025-09-18_01-19-40.mp4',
  ] 
  // ---- Распознавание заголовков на разных языках
  const hasAny = (s, needles) => {
    const x = (s || '').toLowerCase()
    return needles.some(n => x.includes(n))
  }

  const isAnalytics = (s) =>
    hasAny(s, [
      // RU/UA
      'аналитическ', 'аналітичн',
      // EN/ES/TR
      'analytics', 'analítico', 'analitik',
      // AR / ZH
      'تحلي', '分析'
    ])

  const isFeed = (s) =>
    hasAny(s, [
      // RU/UA
      'лента новостей', 'исследован', 'стрічка новин', 'досліджен',
      // EN/ES/TR
      'news feed', 'research feed', 'research & news', 'investigación', 'noticias', 'haber', 'araştırma',
      // AR / ZH
      'أخبار', 'بحث', '研究', '新闻'
    ])

  const isArchitecture = (s) =>
    hasAny(s, [
      // RU/UA
      'архитектур', 'архітектур',
      // EN/ES/TR
      'architecture', 'arquitectura', 'mimari',
      // AR / ZH
      'هيكل', 'بنية', 'هيكلية', '架构', '架構'
    ])

  const imageForTitle = (s) => {
    if (isAnalytics(s)) {
      return {
        src: '/branding/about-analytics.jpg',
        alt: 'Analytics engine — quantum signals and multi-chain context'
      }
    }
    if (isFeed(s)) {
      return {
        src: '/branding/about-feed.jpg',
        alt: 'News & Research feed — multilingual sources with explainable metrics'
      }
    }
    if (isArchitecture(s)) {
      return {
        src: '/branding/about-architecture.jpg',
        alt: 'Architecture — services, agents, TypeScript/Python APIs and live updates'
      }
    }
    return null
  }

  // === АНИМАЦИИ ДЛЯ ИКОНОК (без styled-jsx, через Web Animations API) ===
  useEffect(() => {
    const root = document.getElementById('about-icons')
    if (!root) return

    const imgs = root.querySelectorAll('img[data-anim="1"]')
    const anims = []

    imgs.forEach((img) => {
      // постоянное плавание
      const floatAnim = img.animate(
        [
          { transform: 'translateY(0) rotate(0deg)' },
          { transform: 'translateY(-8px) rotate(-2deg)' },
          { transform: 'translateY(0) rotate(0deg)' },
        ],
        { duration: 3000, iterations: Infinity, easing: 'ease-in-out' }
      )

      // мягкое свечение
      const glowAnim = img.animate(
        [
          { filter: 'drop-shadow(0 2px 6px rgba(0,200,255,0.18))' },
          { filter: 'drop-shadow(0 10px 22px rgba(0,200,255,0.45))' },
        ],
        { duration: 2400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
      )

      // подпрыгивание при наведении
      const onEnter = () => {
        img.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(-16px) scale(1.06)' },
            { transform: 'translateY(0) scale(0.98)' },
            { transform: 'translateY(-8px) scale(1.03)' },
            { transform: 'translateY(0) scale(1)' },
          ],
          { duration: 800, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        )
      }
      img.addEventListener('mouseenter', onEnter)

      anims.push({ floatAnim, glowAnim, onEnter, img })
    })

    return () => {
      anims.forEach(({ floatAnim, glowAnim, onEnter, img }) => {
        try { floatAnim.cancel(); glowAnim.cancel(); img.removeEventListener('mouseenter', onEnter) } catch {}
      })
    }
  }, [])

  return (
    <>
      <main className="container">
        <section className="panel">
          <h1>{title}</h1>

          {/* Адаптивное видео 16:9 сразу под заголовком (как в рабочей версии) */}
          <div className="about-hero" aria-hidden="true">
            <video
              className="about-hero-video"
              playsInline
              autoPlay
              muted
              loop
              preload="metadata"
              poster="/branding/about-poster.jpg"
              onError={(e) => console.warn('[about] video error', e)}
            >
              {videoSources.map((src) => (
                <source key={src} src={src} type="video/mp4" />
              ))}
            </video>
          </div>

          {/* Контент секций */}
          <div className="about-sections">
            {sections.map((s, idx) => {
              const img = imageForTitle(s.title)
              return (
                <div className="about-block" key={idx}>
                  {s.title ? <h3 className="about-block-title">{s.title}</h3> : null}

                  {img && (
                    <figure className="about-img">
                      <img src={img.src} alt={img.alt} loading="lazy" />
                    </figure>
                  )}

                  {Array.isArray(s.paras) && s.paras.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )
            })}
          </div>

          {Array.isArray(bullets) && bullets.length > 0 && (
            <div className="about-block">
              <ul>
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {links?.bot && (
            <div style={{ marginTop: '1rem' }}>
              <a href={links.bot} target="_blank" rel="noreferrer" className="btn btn-primary">
                {t('tg_button')}
              </a>
            </div>
          )}
        </section>

        {/* Локальные стили страницы (оставлены без изменений) */}
        <style jsx>{`
          .about-hero {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 16px;
            overflow: hidden;
            margin: .75rem 0 1rem;
          }
          .about-hero-video {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            background: #000;
          }
          .about-sections { width: 100%; }
          .about-block + .about-block { margin-top: 1.25rem; }
          .about-block-title { margin-bottom: .5rem; }

          /* Адаптивные изображения 16:9 */
          .about-img {
            width: 100%;
            aspect-ratio: 16 / 9;
            margin: .5rem 0 1rem;
            border-radius: 16px;
            overflow: hidden;
          }
          .about-img img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            background: #000;
          }
        `}</style>
      </main>
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Хвост страницы: бегущая строка во всю ширину */}
      <PageMarqueeTail />

      {/* ===== ИКОНКИ ПОСЛЕ МАРКИЗЫ (БЕЗ БЛОКА) — как на главной ===== */}
      <div
        id="about-icons"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '16px 0 8px'
        }}
      >
        <a
          href="/privacy"
          aria-label="Privacy / Политика"
          style={{ lineHeight: 0, cursor: 'pointer', '--size': '130px' }}
        >
          <img
            src="/click/policy.png"
            alt="Privacy"
            draggable="false"
            data-anim="1"
            style={{ width: 'var(--size, 120px)', height: 'auto', display: 'block', background: 'transparent', userSelect: 'none' }}
          />
        </a>

        <a
          href="/contact"
          aria-label="Support / Поддержка"
          style={{ lineHeight: 0, cursor: 'pointer', '--size': '130px' }}
        >
          <img
            src="/click/support.png"
            alt="Support"
            draggable="false"
            data-anim="1"
            style={{ width: 'var(--size, 120px)', height: 'auto', display: 'block', background: 'transparent', userSelect: 'none' }}
          />
        </a>
      </div>
    </>
  )
}
