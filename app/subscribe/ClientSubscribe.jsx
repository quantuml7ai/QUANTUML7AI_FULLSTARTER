// app/subscribe/ClientSubscribe.jsx
'use client'

import NextDynamic from 'next/dynamic'
import { useI18n } from '../../components/i18n'
import Link from 'next/link'

// Кнопка Web3Modal — только на клиенте (без SSR)
const W3MButton = NextDynamic(() => import('../../components/wallet/W3MButton.jsx'), { ssr: false })

export default function ClientSubscribe() {
  const { t } = useI18n()
  const benefits = t('sub_benefits') || []
  const payments = t('sub_payments') || []
  const faq = t('sub_faq') || []

  return (
    <main>
      {/* Intro */}
      <section className="panel">
        <h1>{t('sub_title')}</h1>
        <p>{t('sub_intro')}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <W3MButton label={t('sub_wallet_cta')} note={t('sub_wallet_cta_note')} />
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
          <div className="badge">FREE</div>
          <h3 style={{ marginTop: 8 }}>{t('sub_free_title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('sub_free_desc') }} />
        </div>

        {/* PRO */}
        <div style={{ marginTop: 18 }}>
          <div className="badge">PRO</div>
          <h3 style={{ marginTop: 8 }}>{t('sub_pro_title')}</h3>
          <p><b>{t('sub_pro_price')}</b></p>
          <p dangerouslySetInnerHTML={{ __html: t('sub_pro_desc') }} />
        </div>

        {/* VIP */}
        <div style={{ marginTop: 18 }}>
          <div className="badge">VIP</div>
          <h3 style={{ marginTop: 8 }}>{t('sub_vip_title')}</h3>
          <p><b>{t('sub_vip_price')}</b></p>
          <p dangerouslySetInnerHTML={{ __html: t('sub_vip_desc') }} />
        </div>
      </section>

      {/* What you get */}
      <section className="panel panel-narrow">
        <h2>{t('sub_benefits_title')}</h2>
        <ul className="bullets">
          {benefits.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </section>

      {/* Payments */}
      <section className="panel panel-narrow">
        <h2>{t('sub_payments_title')}</h2>
        <ul className="bullets">
          {payments.map((line, i) => <li key={i} dangerouslySetInnerHTML={{ __html: line }} />)}
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
    </main>
  )
}
