// app/subscribe/page.js
'use client'

import { useI18n } from '../../components/i18n'
import Link from 'next/link'
import { useWeb3Modal } from '@web3modal/wagmi/react' // <— добавили

export default function SubscribePage() {
  const { t } = useI18n()
  const benefits = t('sub_benefits') || []
  const payments = t('sub_payments') || []
  const faq = t('sub_faq') || []

  // Инициализация модалки EVM (MetaMask/Trust/и т.д.)
  const { open } = useWeb3Modal()
  const hasW3M = !!process.env.NEXT_PUBLIC_WC_PROJECT_ID

  return (
    <main>
      {/* Intro */}
      <section className="panel">
        <h1>{t('sub_title')}</h1>
        <p>{t('sub_intro')}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            id="wallet-connect"
            className="btn"
            onClick={() => {
              if (!hasW3M) {
                // Если не настроен Project ID — подсказка
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
