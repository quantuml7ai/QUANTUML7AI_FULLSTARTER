// app/subscribe/subscribe.client.jsx
'use client'

import { useI18n } from '../../components/i18n'
import Link from 'next/link'
import Image from 'next/image'            // ← добавлено
import { SiteSocialLinksRow } from '../../components/TopBar'
import QuantumWalletLaunchIcon from '../../components/QuantumWalletLaunchIcon'
import { useRef, useEffect, useState } from 'react'
import HomeBetweenBlocksAd from '../ads'
import { openPaymentMethodPopover } from '../../lib/paymentMethodClient'

/* ===== helpers: auth / VIP status / payment (как в Exchange) ===== */
async function ensureAuthorized() {
  if (typeof window === 'undefined') return null
  const getAcc = () => window.__AUTH_ACCOUNT__ || localStorage.getItem('wallet') || null

  let acc = getAcc()
  if (acc) return acc

  try { window.dispatchEvent(new CustomEvent('open-auth')) } catch {}

  try {
    const sels = ['[data-auth-open]', '.nav-auth-btn', '#nav-auth-btn', '[data-testid="auth-open"]']
    for (const s of sels) {
      const btn = document.querySelector(s)
      if (btn && typeof btn.click === 'function') { btn.click(); break }
    }
  } catch {}

  acc = await new Promise((resolve) => {
    const done = (e)=> {
      const id = e?.detail?.accountId || getAcc()
      if (id) resolve(id)
    }
    window.addEventListener('auth:ok', done, { once:true })
    window.addEventListener('auth:success', done, { once:true })
    setTimeout(()=> resolve(getAcc()), 120000)
  })

  return acc || null
}

async function fetchVipStatus(accountId) {
  try {
    const r = await fetch('/api/subscription/status', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accountId })
    })
    const j = await r.json().catch(()=> ({}))
    return { isVip: !!j?.isVip, untilISO: j?.untilISO || null }
  } catch { return { isVip:false, untilISO:null } }
}

async function createInvoice(accountId) {
  const r = await fetch('/api/pay/create', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ accountId })
  })
  const j = await r.json().catch(()=> ({}))
  if (!r.ok) throw new Error(j?.error || 'Create failed')
  if (j?.url) return j.url
  throw new Error('No payment URL returned')
}
function openPaymentWindow(url) {
  if (!url) return

  try {
    // Для отладки можешь оставить этот лог — увидишь, что Safari реально получает URL
    console.log('[PAY] redirect to', url)

    // Самый надёжный способ для всех браузеров, особенно Safari:
    window.location.href = url
  } catch (e) {
    try { window.location.assign(url) } catch {}
  }
}



/* ===== Badge кнопка: только визуальные эффекты X2 (VIP — золото, не VIP — мигает красным) ===== */
function TierBadge({ label, isVip, onClick, ariaLabel }) {
  const isClickable = !isVip && typeof onClick === 'function'

  return (
    <button
      type="button"
      className={`badge badge-cta ${isVip ? 'vip' : 'needVip'}`}
      onClick={isClickable ? onClick : undefined}
      aria-label={ariaLabel || label}
      aria-disabled={isVip ? 'true' : 'false'}
      disabled={isVip}
      title={label}
    >
      {label}
      <style jsx>{`
        /* VIP — золотой перелив как у X2 */
        .badge-cta.vip{
          background:
            linear-gradient(135deg,
              #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
              #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
          background-size:200% 100%;
          color:#1a1000;
          border:1px solid rgba(255,215,0,.45);
          box-shadow:0 0 18px rgba(255,215,0,.25);
          animation:qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
          cursor:default;
        }
        .badge-cta.vip:hover{ transform:none }

        /* Не VIP — заметно мигает красным */
        .badge-cta.needVip{
          background:rgba(255,70,70,.18);
          color:#fff;
          border:1px solid rgba(255,120,120,.6);
          box-shadow:0 0 12px rgba(255,70,70,.35);
          animation:blinkPause .9s steps(1) infinite;
          cursor:pointer;
        }

        @keyframes qcoinShine{
          0%{ background-position:0% 0% }
          100%{ background-position:200% 0% }
        }
        @keyframes qcoinGlow{
          0%,100%{
            filter:brightness(1);
            box-shadow:
              0 0 10px rgba(255,210,90,.30),
              inset 0 0 0 1px rgba(255,255,255,.22),
              0 1px 0 0 rgba(0,0,0,.35);
          }
          50%{
            filter:brightness(1.15);
            box-shadow:
              0 0 18px rgba(255,210,90,.70),
              inset 0 0 0 1px rgba(255,255,255,.35),
              0 1px 0 0 rgba(0,0,0,.35);
          }
        }
        @keyframes blinkPause{
          0%,50%{ opacity:1 }
          51%,100%{ opacity:.45 }
        }

      `}</style>
    </button>
  )
}

/* ===== Маркиза ===== */
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
    <section className="marquee-wrap no-gutters" aria-hidden="true" data-ql7-visual-scope="panel">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>


    </section>
  )
}

export default function SubscribePage() {
  const { t } = useI18n()
  const benefits = t('sub_benefits') || []
  const payments = t('sub_payments') || []
  const faq = t('sub_faq') || []
  const feedbackUrl = String(t('links')?.feedback || '').trim()

  const [isVip, setIsVip] = useState(false)
  const [vipUntil, setVipUntil] = useState(null)
  const vipBadgeLabel = isVip
    ? (t('sub_vip_badge_active') || 'VIP+ активно')
    : (t('sub_vip_badge_idle') || 'Активировать VIP+')

  const vipBadgeAriaLabel = isVip
    ? (t('sub_vip_badge_active_aria') || 'VIP+ активно')
    : (t('sub_vip_badge_idle_aria') || 'Активировать VIP+')
  const refreshVip = async () => {
    try {
      const accountId =
        (typeof window !== 'undefined' && window.__AUTH_ACCOUNT__) ||
        (typeof window !== 'undefined' && localStorage.getItem('wallet'))
      if (!accountId) { setIsVip(false); setVipUntil(null); return }
      const st = await fetchVipStatus(accountId)
      setIsVip(!!st.isVip)
      setVipUntil(st.untilISO || null)
    } catch {}
  }

  useEffect(() => {
    refreshVip()
    const onFocus = () => refreshVip()
    const onVis = () => { if (document.visibilityState === 'visible') refreshVip() }
    const onAuth = () => refreshVip()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('auth:ok', onAuth)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('auth:ok', onAuth)
    }
  }, [])

  const handleVipClick = async () => {
    try {
      const accountId = await ensureAuthorized()
      if (!accountId) return
      const paymentMethod = await openPaymentMethodPopover({ accountId, purpose: 'vip' })
      if (!paymentMethod) return
      if (paymentMethod.method === 'qcoin') {
        await refreshVip()
        try { window.dispatchEvent(new Event('vip:refresh')) } catch {}
        return
      }
      const url = await createInvoice(accountId)
      openPaymentWindow(url)
      setTimeout(() => { refreshVip() }, 5000)
    } catch (e) {
      console.error(e)
      alert('Payment error: ' + (e?.message || e))
    }
  }

  return (
    <>
      <main data-ql7-visual-scope="route">
        {/* Intro */}
        <section className="panel" data-ql7-visual-scope="panel">

          {/* Адаптивная картинка под заголовком — заменено на next/image */}
          <div className="block-media">
            <Image
              src="/branding/sub-hero.jpg"
              alt=""
              className="quantum-shot"
              width={1600}
              height={900}
              priority={false}
            />
          </div>

          <p>{t('sub_intro')}</p>

          <div
            className="row subscribeIntroActions"
            style={{ marginTop: 12 }}
          >
            <QuantumWalletLaunchIcon t={t} />

            <a
              href={feedbackUrl}
              className="btn subscribeIntroContact"
              aria-label={t('nav_contact')}
            >
              ✉️ {t('nav_contact')}
            </a>
          </div>
        </section>

        {/* Plans */}
        <section className="panel panel-narrow" data-ql7-visual-scope="panel">
          <h2>{t('sub_plans_title')}</h2>

          {/* VIP */}
          <div style={{ marginTop: 18 }}>
            <TierBadge
              label={vipBadgeLabel}
              ariaLabel={vipBadgeAriaLabel}
              isVip={isVip}
              onClick={handleVipClick}
            />
            <h3 style={{ marginTop: 8 }}>{t('sub_vip_title')}</h3>
            <p><b>{t('sub_vip_price')}</b></p>
            <p dangerouslySetInnerHTML={{ __html: t('sub_vip_desc') }} />
            {isVip && (
              <p className="muted" style={{ marginTop: 6 }}>
                {t('active_until') || 'Активен до'}:&nbsp;
                {(() => { try {
                  if (!vipUntil) return '—'
                  const d = new Date(vipUntil)
                  return d.toLocaleDateString(undefined, { year:'numeric', month:'2-digit', day:'2-digit' })
                } catch { return '—' } })()}
              </p>
            )}
          </div>
        </section>
       {/* Реклама между 2-м (Plans) и 3-м (Why choose us) блоком */}
       <HomeBetweenBlocksAd
         slotKey="subscribe_between_2_3"
         slotKind="subscribe_between"
       />
        {/* Why choose us */}
        <section className="panel panel-narrow" data-ql7-visual-scope="panel">
          <h2>{t('sub_benefits_title')}</h2>
          <ul className="bullets">
            {benefits.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </section>

        {/* Start in minutes */}
        <section className="panel panel-narrow" data-ql7-visual-scope="panel">
          <h2>{t('sub_payments_title')}</h2>

          <div className="block-media">
            <Image
              src="/branding/sub-start.jpg"
              alt=""
              className="quantum-shot"
              width={1600}
              height={900}
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
        <section className="panel panel-narrow" data-ql7-visual-scope="panel">
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

        {/* Локальные стили (как были) */}
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
          .subscribeIntroActions {
            width: 100%;
            justify-content: center;
            align-items: center;
          }

          .subscribeIntroContact {
            padding: 8px 8.667px;
            border-radius: 8px;
            font-size: 80.6667%;
            box-shadow: 0 5.333px 12px rgb(250, 221, 3);
          }

          .subscribeIntroContact:hover {
            box-shadow: 0 5.333px 12px rgb(250, 221, 3);
          }
            
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
<div className="wrap">
      {/* Хвост страницы: бегущая строка */}
      <PageMarqueeTail />
</div>
      {/* ===== ИКОНКИ ПОСЛЕ МАРКИЗЫ — заменено на next/image ===== */}
      <div className="ql7-icons-row ql7-footer-social-layout" data-ql7-visual-scope="panel">
        <Link
          href="/privacy"
          className="ql7-icon-link ql7-footer-policy-link"
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

        <SiteSocialLinksRow className="ql7-social-links-row--footer" />

        <Link
          href="/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support"
          className="ql7-icon-link ql7-footer-support-link"
          data-ql7-support-entry="1"
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
