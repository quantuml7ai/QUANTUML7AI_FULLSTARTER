'use client'

import { useRef, useEffect } from 'react'
import { useI18n } from '../../components/i18n'

/* ===== локальный хвост-маркиза (как на главной) ===== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)
  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    // дублируем, чтобы лента шла бесшовно
    el.innerHTML += el.innerHTML
  }, [])
  return (
    <section className="marquee-wrap" aria-hidden="true">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>
      <style jsx>{`
        .marquee-wrap {
          width: 100%;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 40px;
        }
        .marquee {
          display: flex;
          gap: 40px;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
        .marquee span {
          opacity: .7;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
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
              <a className="btn" href={links.feedback} target="_blank" rel="noreferrer">Team</a>
            </div>
            <div className="contact-card">
              <h3>Email</h3>
              <p>{lines[2]}</p>
              <a className="btn ghost" href={`mailto:${links.email}`}>Email</a>
            </div>
          </div>
        </section>
      </div>

      {/* хвост страницы: бегущая строка во всю ширину */}
      <PageMarqueeTail />
    </>
  )
}
