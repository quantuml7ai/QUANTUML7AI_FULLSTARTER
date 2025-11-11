'use client'

import { useRef, useEffect } from 'react'
import { useI18n } from '../../components/i18n'
import Link from 'next/link'
import Image from 'next/image' // ← добавлено

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
      {/* ===== ИКОНКИ ПОСЛЕ МАРКИЗЫ (глобальные стили ql7-*, как на главной/subscribe) ===== */}
      <div className="ql7-icons-row">
        <Link
          href="/privacy"
          className="ql7-icon-link"
          aria-label="Privacy / Политика"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>

        <Link
          href="/contact"
          className="ql7-icon-link"
          aria-label="Support / Поддержка"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>
      </div>
    </>
  )
}
