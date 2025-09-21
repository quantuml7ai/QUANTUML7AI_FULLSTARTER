'use client'

import { useRef, useEffect } from 'react'
import { useI18n } from '../../components/i18n'

/* ===== Маркиза как на главной: бесшовно, full-bleed, без «пропаданий» ===== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    // Идемпотентность: не дублируем контент повторно (в dev эффект может сработать 2 раза)
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

      <style jsx>{`
        .marquee-wrap{
          width: 100%;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,.1);
          margin-top: 40px;

          /* full-bleed: компенсируем глобальные отступы краёв */
          margin-left: calc(-1 * var(--gutter, 24px));
          margin-right: calc(-1 * var(--gutter, 24px));
          padding-left: 0;
          padding-right: 0;
        }
        .marquee{
          display: inline-flex;
          gap: 40px;
          white-space: nowrap;
          will-change: transform;
          animation: marquee 20s linear infinite;
        }
        .marquee > *{ flex: 0 0 auto; }   /* без переносов */
        .marquee span{ opacity: .7; }

        /* Бесшовность: во второй половине содержимое идентично → смещаем на 50% */
        @keyframes marquee{
          from{ transform: translateX(0); }
          to  { transform: translateX(-50%); }
        }

        /* Доступность: уважение reduce-motion */
        @media (prefers-reduced-motion: reduce){
          .marquee{ animation: none; }
        }
      `}</style>
    </section>
  )
}

export default function Contact(){
  const { t } = useI18n()
  const links = t('links')
  const lines = t('contact_lines')

  return (
    <>
      <div className="page-center">
        <section className="panel">
          <h1>{t('contact_title')}</h1>
          <p>{t('contact_sub')}</p>

          <div className="contact-grid">
            <div className="contact-card">
              <h3>Telegram Channel</h3>
              <p>{lines[0]}</p>
              <a className="btn" href={links.channel} target="_blank" rel="noreferrer">{t('nav_channel')}</a>
            </div>
            <div className="contact-card">
              <h3>Feedback / Support</h3>
              <p>{lines[1]}</p>
              <a className="btn" href={links.feedback} target="_blank" rel="noreferrer">{t('nav_support')}</a>
            </div>
            <div className="contact-card">
              <h3>Email</h3>
              <p>{lines[2]}</p>
              <a className="btn ghost" href={`mailto:${links.email}`}>Email</a>
            </div>
          </div>
        </section>
      </div>

      {/* Хвост страницы: бегущая строка во всю ширину */}
      <PageMarqueeTail />
    </>
  )
}
