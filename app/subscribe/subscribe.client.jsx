// app/subscribe/subscribe.client.jsx
'use client'

import { useI18n } from '../../components/i18n'
import Link from 'next/link'
import { useWeb3Modal } from '@web3modal/wagmi/react'

const TG_URL = process.env.NEXT_PUBLIC_TG_BOT_URL || 'https://t.me/l7ai_bot'

function TierBadge({ label }) {
  return (
    <a
      href={TG_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="badge badge-cta"
      aria-label={`Open Telegram bot for ${label} plan`}
    >
      {label}
    </a>
  )
}

export default function SubscribePage() {
  const { t } = useI18n()
  const benefits = t('sub_benefits') || []
  const payments = t('sub_payments') || []   // в вашей локали это «Старт за минуты»
  const faq = t('sub_faq') || []

  const { open } = useWeb3Modal()
  const hasW3M = !!process.env.NEXT_PUBLIC_WC_PROJECT_ID

  return (
    <main>
      {/* Intro */}
      <section className="panel">
        <h1>{t('sub_title')}</h1>

        {/* Адаптивное изображение под заголовком «Подписка» */}
        <div className="block-media">
          <img
            src="/branding/sub-hero.jpg"
            alt=""
            className="block-img"
            loading="lazy"
            decoding="async"
          />
        </div>

        <p>{t('sub_intro')}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            id="wallet-connect"
            className="btn"
            onClick={() => {
              if (!hasW3M) {
                alert(t('sub_wallet_cta_note'))
                return
              }
              open()
            }}
            aria-label={t('sub_wallet_cta')}
          >
            🔗 {t('sub_wallet_cta')}
          </button>
          <Link href="/contact" className="btn ghost" aria-label={t('nav_contact')}>
            ✉️ {t('nav_contact')}
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section className="panel panel-narrow">
        <h2>{t('sub_plans_title')}</h2>

        {/* FREE */}
        <div style={{ marginTop: 8 }}>
          <TierBadge label="FREE" />
          <h3 style={{ marginTop: 8 }}>{t('sub_free_title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('sub_free_desc') }} />
        </div>

        {/* PRO */}
        <div style={{ marginTop: 18 }}>
          <TierBadge label="PRO" />
          <h3 style={{ marginTop: 8 }}>{t('sub_pro_title')}</h3>
          <p><b>{t('sub_pro_price')}</b></p>
          <p dangerouslySetInnerHTML={{ __html: t('sub_pro_desc') }} />
        </div>

        {/* VIP */}
        <div style={{ marginTop: 18 }}>
          <TierBadge label="VIP" />
          <h3 style={{ marginTop: 8 }}>{t('sub_vip_title')}</h3>
          <p><b>{t('sub_vip_price')}</b></p>
          <p dangerouslySetInnerHTML={{ __html: t('sub_vip_desc') }} />
        </div>
      </section>

      {/* Why choose us */}
      <section className="panel panel-narrow">
        <h2>{t('sub_benefits_title')}</h2>
        <ul className="bullets">
          {benefits.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </section>

      {/* Start in minutes (у вас это раздел с шагами) */}
      <section className="panel panel-narrow">
        <h2>{t('sub_payments_title')}</h2>

        {/* Адаптивное изображение под заголовком «Старт за минуты» */}
        <div className="block-media">
          <img
            src="/branding/sub-start.jpg"
            alt=""
            className="block-img"
            loading="lazy"
            decoding="async"
          />
        </div>

        <ul className="bullets" style={{ marginTop: 8 }}>
          {payments.map((line, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 8 }}>{t('sub_legal_note')}</p>
      </section>

      {/* FAQ */}
      <section className="panel panel-narrow">
        <h2>{t('sub_faq_title')}</h2>
        <ul className="bullets">
          {faq.map((qa, i) => (
            <li key={i}>
              <b>{qa.q}</b><br/>
              <span dangerouslySetInnerHTML={{ __html: qa.a }} />
            </li>
          ))}
        </ul>
      </section>

      {/* Local styles (бейджи + адаптив медиа) */}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 12px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: .3px;
          border: 1px solid rgba(80, 170, 255, .45);
          background: rgba(20, 110, 255, .16);
          color: #8ecbff;
          user-select: none;
        }
        .badge-cta {
          cursor: pointer;
          text-decoration: none;
          position: relative;
          transition: transform .12s ease, box-shadow .2s ease, background .2s ease;
          box-shadow: 0 0 0 rgba(0, 173, 255, 0);
        }
        .badge-cta:hover {
          transform: translateY(-1px);
          background: rgba(20, 110, 255, .24);
          box-shadow: 0 0 22px rgba(0, 173, 255, .45);
        }
        .badge-cta:active {
          transform: translateY(0);
          box-shadow: 0 0 12px rgba(0, 173, 255, .35);
        }
        @media (prefers-color-scheme: light) {
          .badge {
            color: #0a5bd8;
            border-color: rgba(0, 136, 255, .35);
            background: rgba(0, 136, 255, .10);
          }
        }

        /* Адаптивные иллюстрации внутри панелей */
        .block-media {
          width: 100%;
          margin: 12px 0 6px 0;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.02);
        }
        .block-img {
          display: block;
          width: 100%;
          height: auto;
        }
      `}</style>
    </main>
  )
}
