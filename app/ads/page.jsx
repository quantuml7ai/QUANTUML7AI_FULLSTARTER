// app/ads/page.jsx
'use client'

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import NextImage from 'next/image'
import { useI18n } from '../../components/i18n'
import AdsHome from './home' // наш рекламный кабинет, рендерим внутри этой же страницы
import Image from 'next/image'
import {
  canOpenAdsLandingCabinet,
  getAdsLandingPackageSnapshot,
} from '../../lib/adsLandingPackageState'
/* ===== ENV / режим теста ===== */
/* eslint-disable no-undef */
const ADS_TEST_MODE =
  String(process.env.NEXT_PUBLIC_ADS_TEST_MODE || '').trim() === '1'
/* eslint-enable no-undef */

// безопасное чтение чисел из ENV
function envNum(raw, fallback) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

// над AdsPage, рядом с envNum / helpers
function openAdsPaymentWindow(url) {
  if (!url) return
  try {
    // Лог для отладки — видно, что Safari действительно получает URL
    console.log('[ADS] redirect to', url)
    // Самый надёжный способ для Safari / iOS:
    window.location.href = url
  } catch (e) {
    try {
      window.location.assign(url)
    } catch {}
  }
}
/* ===== Маркиза как на About: бесшовно, full-bleed ===== */
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
/* ===== Иконки "Политика" + "Суппорт" как на About ===== */
function FooterIcons() {
  useEffect(() => {
    const root = document.getElementById('ads-footer-icons')
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
        { duration: 3000, iterations: Infinity, easing: 'ease-in-out' },
      )

      // мягкое свечение
      const glowAnim = img.animate(
        [
          { filter: 'drop-shadow(0 2px 6px rgba(0,200,255,0.18))' },
          { filter: 'drop-shadow(0 10px 22px rgba(0,200,255,0.45))' },
        ],
        {
          duration: 2400,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out',
        },
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
          { duration: 800, easing: 'cubic-bezier(0.22,1,0.36,1)' },
        )
      }
      img.addEventListener('mouseenter', onEnter)

      anims.push({ floatAnim, glowAnim, onEnter, img })
    })

    return () => {
      anims.forEach(({ floatAnim, glowAnim, onEnter, img }) => {
        try {
          floatAnim.cancel()
          glowAnim.cancel()
          img.removeEventListener('mouseenter', onEnter)
        } catch {}
      })
    }
  }, [])

  return (
    <div
      id="ads-footer-icons"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '16px 0 8px',
      }}
    >
      <a
        href="/privacy"
        aria-label="Privacy / Политика"
        style={{ lineHeight: 0, cursor: 'pointer', '--size': '130px' }}
      >
        <NextImage
          src="/click/policy.png"
          alt="Privacy"
          draggable={false}
          data-anim="1"
          width={130}
          height={130}
          style={{
            width: 'var(--size, 120px)',
            height: 'auto',
            display: 'block',
            background: 'transparent',
            userSelect: 'none',
          }}
        />
      </a>


      <a
        href="/contact"
        aria-label="Support / Поддержка"
        style={{ lineHeight: 0, cursor: 'pointer', '--size': '130px' }}
      >
        <NextImage
          src="/click/support.png"
          alt="Support"
          draggable={false}
          data-anim="1"
          width={130}
          height={130}
          style={{
            width: 'var(--size, 120px)',
            height: 'auto',
            display: 'block',
            background: 'transparent',
            userSelect: 'none',
          }}
        />
      </a>

    </div>
  )
}

/* ===== Чтение accountId из глобалов / localStorage ===== */

function getAccountIdSafe() {
  if (typeof window === 'undefined') return null
  try {
    return (
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ACCOUNT__ ||
      window.__WALLET__ ||
      localStorage.getItem('wallet') ||
      localStorage.getItem('account') ||
      localStorage.getItem('ql7_uid') ||
      null
    )
  } catch {
    return null
  }
}

/* ===== i18n helper ===== */

const TX = (t, key, fb) => {
  try {
    const v = t?.(key)
    if (!v || v === key) return fb
    return v
  } catch {
    return fb
  }
}

function formatLandingDateTime(value) {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/* ===== Пакеты — бизнес-параметры из ENV =====
   НАЗВАНИЯ переменных согласованы с back:
   - NEXT_PUBLIC_ADS_STARTER_PRICE_USD
   - NEXT_PUBLIC_ADS_STARTER_DAYS
   - NEXT_PUBLIC_ADS_STARTER_MAX_CAMPAIGNS
   и аналогично для PRO / ELITE.
   По умолчанию: в одной кампании один креатив, без лимитов по креативам в пакете.
*/

const ADS_PACKAGES = [
  {
    id: 'ads_starter',
    tier: 'STARTER',
    recommended: false,
    priceUsd: envNum(process.env.NEXT_PUBLIC_ADS_STARTER_PRICE_USD, 300),
    days: envNum(process.env.NEXT_PUBLIC_ADS_STARTER_DAYS, 7),
    maxCampaigns: envNum(process.env.NEXT_PUBLIC_ADS_STARTER_MAX_CAMPAIGNS, 1),
    bullets: [
      {
        key: 'ads_pkg_starter_bullet_1',
        fb: '⚡ Быстрый старт рекламы по форуму и страницам с трафиком',
      },
      {
        key: 'ads_pkg_starter_bullet_2',
        fb: '🎯 Базовый приоритет показа и аккуратный объём трафика',
      },
      {
        key: 'ads_pkg_starter_bullet_3',
        fb: '📈 Простая аналитика показов и кликов в кабинете',
      },
    ],
  },
  {
    id: 'ads_pro',
    tier: 'PRO',
    recommended: true,
    priceUsd: envNum(process.env.NEXT_PUBLIC_ADS_PRO_PRICE_USD, 1500),
    days: envNum(process.env.NEXT_PUBLIC_ADS_PRO_DAYS, 30),
    maxCampaigns: envNum(process.env.NEXT_PUBLIC_ADS_PRO_MAX_CAMPAIGNS, 5),
    bullets: [
      {
        key: 'ads_pkg_pro_bullet_1',
        fb: '🚀 Повышенный приоритет показа и заметно больше трафика',
      },
      {
        key: 'ads_pkg_pro_bullet_2',
        fb: '⚙️ Управление несколькими кампаниями в одном кабинете',
      },
      {
        key: 'ads_pkg_pro_bullet_3',
        fb: '📊 Расширенная аналитика, в том числе по географии',
      },
      {
        key: 'ads_pkg_pro_bullet_4',
        fb: '💸 Более выгодная цена дня размещения, чем у STARTER',
      },
    ],
  },
  {
    id: 'ads_elite',
    tier: 'ELITE',
    recommended: false,
    priceUsd: envNum(process.env.NEXT_PUBLIC_ADS_ELITE_PRICE_USD, 9000),
    days: envNum(process.env.NEXT_PUBLIC_ADS_ELITE_DAYS, 365),
    maxCampaigns: envNum(process.env.NEXT_PUBLIC_ADS_ELITE_MAX_CAMPAIGNS, 20),
    bullets: [
      {
        key: 'ads_pkg_elite_bullet_1',
        fb: '👑 Максимальный приоритет показа по форуму и всему сайту',
      },
      {
        key: 'ads_pkg_elite_bullet_2',
        fb: '🚀 Стабильно высокий объём показов на всём сроке пакета',
      },
      {
        key: 'ads_pkg_elite_bullet_3',
        fb: '🧠 Подробная аналитика и комфортное масштабирование кампаний',
      },
      {
        key: 'ads_pkg_elite_bullet_4',
        fb: '💠 Минимальная стоимость одного дня размещения за счёт длительного пакета',
      },
    ],
  },
]

/* ===== Основной компонент: один route, два режима ===== */

export default function AdsPage() {
  const { t } = useI18n()

  // view: 'landing' | 'cabinet'
  const [view, setView] = useState('landing')

  const [selectedId, setSelectedId] = useState('ads_pro')
  const [loadingPay, setLoadingPay] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [accountId, setAccountId] = useState(null)
  const [landingPackage, setLandingPackage] = useState(null)
  const [packageCheckState, setPackageCheckState] = useState('idle')
  const [packageCheckError, setPackageCheckError] = useState(false)
  const packageRequestRef = useRef(0)

  useEffect(() => {
    const syncAccount = () => setAccountId(getAccountIdSafe())
    syncAccount()

    const events = ['auth:ok', 'auth:success', 'auth:logout', 'tg:link-status']
    events.forEach((eventName) => window.addEventListener(eventName, syncAccount))
    window.addEventListener('storage', syncAccount)

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, syncAccount))
      window.removeEventListener('storage', syncAccount)
    }
  }, [])

  const refreshLandingPackage = useCallback(async () => {
    const requestId = ++packageRequestRef.current

    if (ADS_TEST_MODE) {
      setLandingPackage(null)
      setPackageCheckError(false)
      setPackageCheckState('ready')
      return
    }

    if (!accountId) {
      setLandingPackage(null)
      setPackageCheckError(false)
      setPackageCheckState('ready')
      return
    }

    setPackageCheckState('loading')
    setPackageCheckError(false)

    try {
      const params = new URLSearchParams({
        action: 'plans',
        accountId: String(accountId),
      })
      const response = await fetch(`/api/ads?${params.toString()}`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`)
      }
      if (requestId !== packageRequestRef.current) return
      setLandingPackage(payload.currentPackage || null)
      setPackageCheckState('ready')
    } catch (requestError) {
      if (requestId !== packageRequestRef.current) return
      console.error('[ADS] landing package status error', requestError)
      setLandingPackage(null)
      setPackageCheckError(true)
      setPackageCheckState('error')
    }
  }, [accountId])

  useEffect(() => {
    refreshLandingPackage()
  }, [refreshLandingPackage])

  useEffect(() => {
    const refreshOnFocus = () => refreshLandingPackage()
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshLandingPackage()
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisible)
    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [refreshLandingPackage])

  const selectedPkg = useMemo(
    () => ADS_PACKAGES.find((p) => p.id === selectedId) || ADS_PACKAGES[1],
    [selectedId],
  )

  const packageSnapshot = useMemo(
    () => getAdsLandingPackageSnapshot(landingPackage),
    [landingPackage],
  )
  const cabinetUnlocked = canOpenAdsLandingCabinet({
    testMode: ADS_TEST_MODE,
    packageInfo: landingPackage,
  })
  const packageTierLabel = packageSnapshot.type
    ? TX(
        t,
        `ads_pkg_type_${packageSnapshot.type}`,
        packageSnapshot.type.toUpperCase(),
      )
    : '—'
  const selectedTierKey = selectedPkg.tier.toLowerCase()
  const selectedTierLabel = TX(
    t,
    `ads_pkg_tier_${selectedTierKey}`,
    selectedPkg.tier,
  )

  const openCabinet = useCallback(() => {
    if (!cabinetUnlocked) {
      setInfo(null)
      setError(
        TX(
          t,
          'ads_landing_cabinet_locked',
          'Личный кабинет станет доступен после покупки пакета.',
        ),
      )
      return
    }
    setError(null)
    setView('cabinet')
  }, [cabinetUnlocked, t])

  const handlePrimaryClick = async () => {
    setError(null)
    setInfo(null)

    // Тестовый режим — просто заходим в кабинет без оплаты
    if (ADS_TEST_MODE) {
      setInfo(
        TX(
          t,
          'ads_test_mode_cta_note',
          'Тестовый режим: оплаты отключены, кабинет доступен без платежа.',
        ),
      )
      openCabinet()
      return
    }

    const acc = getAccountIdSafe()
    if (!acc) {
      setError(
        TX(
          t,
          'ads_error_no_account',
          'Сначала авторизуйся / зайди в аккаунт, чтобы оформить пакет.',
        ),
      )
      return
    }

    try {
      setLoadingPay(true)

      // Новый единый платежный маршрут:
      // /api/pay/create c purpose:'ads' и adsPackage: 'STARTER' | 'PRO' | 'ELITE'
      const payload = {
        accountId: acc,
        purpose: 'ads',
        adsPackage: selectedPkg.tier,
      }

      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.ok || !data.url) {
        console.error('[ADS] /api/pay/create error', res.status, data)
        throw new Error(
          data?.message ||
            data?.error ||
            `ADS invoice create failed (${res.status})`,
        )
      }

      const url = data.url

      setInfo(
        TX(
          t,
          'ads_pay_redirect',
          'Перенаправляем на страницу оплаты. После успешного платежа рекламный кабинет станет активен.',
        ),
      )

      if (typeof window !== 'undefined') {
        // Открываем платёж ТУТ ЖЕ (как на странице подписок, для iPhone/Safari)
        openAdsPaymentWindow(url)
      }
    } catch (e) {
      console.error('[ADS] pay error', e)
      setError(
        TX(
          t,
          'ads_error_pay_generic',
          'Не удалось создать платёж. Попробуй ещё раз чуть позже.',
        ) + ` (${e.message || e})`,
      )
    } finally {
      setLoadingPay(false)
    }
  }

  // ====== Если активен режим "кабинет" — кабинет + хвост, как на About ======
  if (view === 'cabinet') {
    return (
      <>
        <AdsHome onExitCabinet={() => setView('landing')} />
        <PageMarqueeTail />
        <FooterIcons />
      </>
    )
  }

  // ====== Иначе — продающая страница с пакетами ======

  return (
    <div className="page-content">
      <main className="page-center ads-landing">
        <section className="panel ads-landing-suite">
          <div className="ads-landing-access-bar">
            <div
              className={
                'ads-landing-package-card' +
                (packageSnapshot.active
                  ? ' is-active'
                  : packageSnapshot.expired
                  ? ' is-expired'
                  : ' is-empty')
              }
              aria-live="polite"
            >
              <div className="ads-landing-package-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="presentation">
                  <defs>
                    <linearGradient id="adsLandingPackageGlow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#62e8ff" />
                      <stop offset="0.55" stopColor="#8aa8ff" />
                      <stop offset="1" stopColor="#ffe45c" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M14 20.5 32 10l18 10.5v22L32 54 14 42.5z"
                    fill="none"
                    stroke="url(#adsLandingPackageGlow)"
                    strokeWidth="3"
                  />
                  <path
                    d="m20 24 12 7 12-7M32 31v15"
                    fill="none"
                    stroke="url(#adsLandingPackageGlow)"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                  <circle cx="47" cy="17" r="4" fill="#ffe45c" />
                </svg>
              </div>

              <div className="ads-landing-package-copy">
                <span className="ads-landing-package-eyebrow">
                  {TX(
                    t,
                    'ads_landing_package_status_title',
                    'Ваш рекламный пакет',
                  )}
                </span>

                {ADS_TEST_MODE ? (
                  <div className="ads-landing-package-headline">
                    <strong>{TX(t, 'ads_test_mode_label', 'TEST MODE')}</strong>
                    <span className="ads-package-state is-active">
                      {TX(t, 'ads_landing_package_active', 'Пакет активен')}
                    </span>
                  </div>
                ) : packageCheckState === 'loading' ? (
                  <div className="ads-landing-package-headline is-loading">
                    <span className="ads-package-loader" aria-hidden="true" />
                    <strong>
                      {TX(
                        t,
                        'ads_landing_package_checking',
                        'Проверяем состояние пакета…',
                      )}
                    </strong>
                  </div>
                ) : packageCheckError ? (
                  <div className="ads-landing-package-headline is-error">
                    <strong>
                      {TX(
                        t,
                        'ads_landing_package_load_error',
                        'Не удалось проверить состояние пакета. Обнови страницу.',
                      )}
                    </strong>
                  </div>
                ) : packageSnapshot.exists ? (
                  <>
                    <div className="ads-landing-package-headline">
                      <strong>{packageTierLabel}</strong>
                      <span
                        className={
                          'ads-package-state ' +
                          (packageSnapshot.active ? 'is-active' : 'is-expired')
                        }
                      >
                        {packageSnapshot.active
                          ? TX(
                              t,
                              'ads_landing_package_active',
                              'Пакет активен',
                            )
                          : TX(
                              t,
                              'ads_landing_package_expired',
                              'Срок пакета истёк',
                            )}
                      </span>
                    </div>
                    <div className="ads-landing-package-metrics">
                      <div>
                        <span>
                          {TX(
                            t,
                            'ads_landing_package_started_at',
                            'Активирован',
                          )}
                        </span>
                        <strong>{formatLandingDateTime(packageSnapshot.startsAt)}</strong>
                      </div>
                      <div>
                        <span>
                          {TX(
                            t,
                            'ads_landing_package_expires_at',
                            'Действует до',
                          )}
                        </span>
                        <strong>{formatLandingDateTime(packageSnapshot.expiresAt)}</strong>
                      </div>
                      <div>
                        <span>
                          {TX(
                            t,
                            'ads_landing_package_days_left',
                            'Осталось дней',
                          )}
                        </span>
                        <strong>
                          {packageSnapshot.daysLeft == null
                            ? '—'
                            : packageSnapshot.daysLeft}
                        </strong>
                      </div>
                      <div>
                        <span>
                          {TX(
                            t,
                            'ads_landing_package_campaigns',
                            'Кампаний',
                          )}
                        </span>
                        <strong>
                          {packageSnapshot.usedCampaigns}/
                          {packageSnapshot.maxCampaigns || '—'}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="ads-landing-package-headline is-empty">
                    <strong>
                      {TX(
                        t,
                        'ads_landing_package_none',
                        'Купленного пакета пока нет',
                      )}
                    </strong>
                    <span className="ads-package-lock" aria-hidden="true">⌁</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="ads-personal-cabinet-btn"
              onClick={openCabinet}
              disabled={!cabinetUnlocked}
              aria-disabled={!cabinetUnlocked}
              title={
                cabinetUnlocked
                  ? TX(t, 'ads_cta_have_pkg', 'Личный кабинет')
                  : TX(
                      t,
                      'ads_landing_cabinet_locked',
                      'Личный кабинет станет доступен после покупки пакета.',
                    )
              }
            >
              <span className="ads-personal-cabinet-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" role="presentation">
                  <rect x="8" y="8" width="13" height="13" rx="3" />
                  <rect x="27" y="8" width="13" height="13" rx="3" />
                  <rect x="8" y="27" width="13" height="13" rx="3" />
                  <path d="M29 34h9M33.5 29.5v9" />
                </svg>
              </span>
              <span>{TX(t, 'ads_cta_have_pkg', 'Личный кабинет')}</span>
              {!cabinetUnlocked && (
                <span className="ads-personal-cabinet-lock" aria-hidden="true">●</span>
              )}
            </button>
          </div>

          <div className="ads-suite-divider" />

          <div className="ads-landing-section ads-hero">
            <div className="ads-hero-composition">
              <div className="ads-hero-image-column">
                <figure className="media-block ads-hero-preview-card no-gutters">
                  <NextImage
                    src="/ads/hero-preview.png"
                    alt={TX(
                      t,
                      'ads_hero_image_alt',
                      'Quantum L7 AI Ads — предпросмотр размещения рекламы',
                    )}
                    width={1280}
                    height={720}
                    className="quantum-shot"
                    priority
                  />
                  <figcaption>
                    {TX(
                      t,
                      'ads_hero_figure_caption',
                      'Ротация рекламных карточек по форуму и страницам с трафиком.',
                    )}
                  </figcaption>
                </figure>

                <div className="ads-hero-title-plaque">
                  <h1 className="ads-hero-title">
                    <span className="qcoinLabel">
                      {TX(
                        t,
                        'ads_page_title',
                        'Запусти рекламу по экосистеме Quantum L7 AI',
                      )}
                    </span>
                  </h1>
                </div>
              </div>

              <div className="ads-hero-story-column">
                <div className="ads-hero-orbit">
                  <div className="ads-orbit-bg-glow" />
                  <div className="ads-orbit-mesh" />
                  <div className="ads-orbit-ring ring-1" />
                  <div className="ads-orbit-ring ring-2" />
                  <div className="ads-orbit-node node-1" />
                  <div className="ads-orbit-node node-2" />
                  <div className="ads-orbit-node node-3" />
                  <div className="ads-orbit-node node-4" />
                  <div className="ads-orbit-core">
                    <span>{TX(t, 'ads_orbit_core_label', 'ADS')}</span>
                  </div>
                  <div className="ads-orbit-tag tag-top">
                    <span>{TX(t, 'ads_orbit_tag_global', 'GLOBAL')}</span>
                  </div>
                  <div className="ads-orbit-tag tag-right">
                    <span>{TX(t, 'ads_orbit_tag_forum', 'FORUM')}</span>
                  </div>
                  <div className="ads-orbit-tag tag-bottom">
                    <span>{TX(t, 'ads_orbit_tag_ai_rotator', 'AI-ROTATOR')}</span>
                  </div>
                </div>

                <div className="ads-hero-copy-plaque">
                  <p className="ads-hero-sub">
                    {TX(
                      t,
                      'ads_page_subtitle',
                      'Твоя реклама в неоновой витрине: форум, страницы с трафиком, глобальные слоты по всей экосистеме QL7 Global.',
                    )}
                  </p>

                  <div className="ads-hero-meta">
                    <span>
                      {TX(
                        t,
                        'ads_meta_realtime',
                        'Ротатор слотов работает в реальном времени, слоты размещаются по всей экосистеме, аналитику смотри прямо в кабинете.',
                      )}
                    </span>
                  </div>

                  {ADS_TEST_MODE && (
                    <div className="ads-test-badge">
                      <span>{TX(t, 'ads_test_mode_label', 'TEST MODE')}</span>
                      <p>
                        {TX(
                          t,
                          'ads_test_mode_note',
                          'Оплаты отключены. Можно спокойно тестировать кабинеты, кампании и размещения.',
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ads-suite-divider" />

          <div className="ads-landing-section ads-packages">
            <div className="ads-section-heading-row">
              <div>
                <h2 className="ads-section-title">
                  {TX(t, 'ads_packages_title', 'Выбери пакет под задачу')}
                </h2>
                <p className="ads-section-text">
                  {TX(
                    t,
                    'ads_packages_subtitle',
                    'Все пакеты работают через один кабинет и один ротатор. Можно докупать слоты и масштабировать трафик. Чем длиннее срок пакета, тем ниже стоимость одного дня размещения рекламы.',
                  )}
                </p>
              </div>
            </div>

            <div className="ads-pack-grid">
              {ADS_PACKAGES.map((pkg) => {
                const isSelected = pkg.id === selectedId
                const tierKey = pkg.tier.toLowerCase()

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={
                      'ads-pack-card' +
                      (pkg.recommended ? ' recommended' : '') +
                      (isSelected ? ' selected' : '')
                    }
                    onClick={() => setSelectedId(pkg.id)}
                    aria-pressed={isSelected}
                  >
                    {pkg.recommended && (
                      <div className="ads-pack-tag">
                        {TX(t, 'ads_pkg_recommended', 'Рекомендуем')}
                      </div>
                    )}

                    <div className="ads-pack-head">
                      <div className="ads-pack-tier">
                        {TX(t, `ads_pkg_tier_${tierKey}`, pkg.tier)}
                      </div>
                      {!ADS_TEST_MODE ? (
                        <div className="ads-pack-price">
                          <span className="ads-pack-price-main">{pkg.priceUsd}$</span>
                          <span className="ads-pack-price-sub">
                            {TX(
                              t,
                              'ads_pkg_price_sub',
                              'оплата один раз, пакет на весь срок',
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="ads-pack-price test">
                          <span className="ads-pack-price-main">0$</span>
                          <span className="ads-pack-price-sub">
                            {TX(
                              t,
                              'ads_pkg_test_mode',
                              'в тестовом режиме оплаты нет',
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ads-pack-body">
                      <div className="ads-pack-feature-row">
                        <span>{TX(t, 'ads_pkg_days', 'Срок пакета')}</span>
                        <strong>
                          {pkg.days} {TX(t, 'ads_pkg_days_suffix', 'дн.')}
                        </strong>
                      </div>
                      <div className="ads-pack-feature-row">
                        <span>{TX(t, 'ads_pkg_slots', 'Интенсивность показов')}</span>
                        <strong>
                          {TX(
                            t,
                            `ads_pkg_slots_value_${tierKey}`,
                            tierKey === 'starter'
                              ? 'Умеренный, равномерный объём показов'
                              : tierKey === 'pro'
                              ? 'Повышенный приоритет и более частые показы'
                              : 'Максимальный приоритет и широкий охват по сайту',
                          )}
                        </strong>
                      </div>
                      <div className="ads-pack-feature-row">
                        <span>
                          {TX(
                            t,
                            'ads_pkg_max_campaigns',
                            'Кампаний в рамках пакета',
                          )}
                        </span>
                        <strong>{pkg.maxCampaigns}</strong>
                      </div>

                      <ul className="ads-pack-bullets">
                        {pkg.bullets.map((bullet) => (
                          <li key={bullet.key}>{TX(t, bullet.key, bullet.fb)}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="ads-pack-footer">
                      <span className="ads-pack-hint">
                        {isSelected
                          ? TX(
                              t,
                              'ads_pkg_selected',
                              'Этот пакет выбран для оплаты и запуска.',
                            )
                          : TX(
                              t,
                              'ads_pkg_click_to_select',
                              'Нажми, чтобы выбрать этот пакет.',
                            )}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="ads-purchase-dock">
              <div className="ads-purchase-selection">
                <span className="ads-purchase-selection-label">
                  {TX(
                    t,
                    'ads_landing_selected_package',
                    'Выбранный пакет',
                  )}
                </span>
                <strong>{selectedTierLabel}</strong>
                <span className="ads-purchase-selection-meta">
                  {selectedPkg.days} {TX(t, 'ads_pkg_days_suffix', 'дн.')}
                  {!ADS_TEST_MODE && ` · ${selectedPkg.priceUsd}$`}
                  {' · '}
                  {selectedPkg.maxCampaigns}{' '}
                  {TX(t, 'ads_landing_package_campaigns', 'Кампаний')}
                </span>
              </div>

              <button
                type="button"
                className="ads-buy-selected-btn"
                disabled={loadingPay}
                onClick={handlePrimaryClick}
              >
                <span className="ads-buy-selected-shine" aria-hidden="true" />
                <span className="ads-buy-selected-icon" aria-hidden="true">◆</span>
                <span>
                  {ADS_TEST_MODE
                    ? TX(
                        t,
                        'ads_cta_test_mode',
                        'Перейти в рекламный кабинет (тестовый режим)',
                      )
                    : loadingPay
                    ? TX(t, 'ads_cta_loading', 'Создаём платёж…')
                    : TX(t, 'ads_cta_main', 'Купить рекламу')}
                </span>
              </button>
            </div>

            {(error || info) && (
              <div className="ads-inline-status" role="status">
                {error ? (
                  <div className="ads-error">
                    <strong>{TX(t, 'ads_status_error_label', 'Ошибка:')} </strong>
                    {error}
                  </div>
                ) : (
                  <div className="ads-info">
                    <strong>{TX(t, 'ads_status_ok_label', 'OK:')} </strong>
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ads-suite-divider" />

          <div className="ads-landing-section ads-how">
            <h2 className="ads-section-title">
              {TX(
                t,
                'ads_how_title',
                'Как реклама крутится по всей экосистеме',
              )}
            </h2>

            <div className="ads-how-grid">
              <div className="ads-how-step">
                <div className="ads-how-step-num">1</div>
                <h3>
                  {TX(
                    t,
                    'ads_how_step1_title',
                    'Покупаешь пакет и ты в деле',
                  )}
                </h3>
                <p>
                  {TX(
                    t,
                    'ads_how_step1_text',
                    'Оформляешь пакет и получаешь доступ к рекламному кабинету.',
                  )}
                </p>
              </div>
              <div className="ads-how-step">
                <div className="ads-how-step-num">2</div>
                <h3>
                  {TX(
                    t,
                    'ads_how_step2_title',
                    'Создаёшь кампании и задаёшь ссылку',
                  )}
                </h3>
                <p>
                  {TX(
                    t,
                    'ads_how_step2_text',
                    'Добавляешь ссылку и оформляешь объявление — система сама подбирает лучший формат предпросмотра.',
                  )}
                </p>
              </div>
              <div className="ads-how-step">
                <div className="ads-how-step-num">3</div>
                <h3>
                  {TX(
                    t,
                    'ads_how_step3_title',
                    'Ротатор крутит объявления в слотах экосистемы',
                  )}
                </h3>
                <p>
                  {TX(
                    t,
                    'ads_how_step3_text',
                    'Реклама идёт в слотах форума и по всей экосистеме, без дублей и с умной ротацией.',
                  )}
                </p>
              </div>
              <div className="ads-how-step">
                <div className="ads-how-step-num">4</div>
                <h3>
                  {TX(
                    t,
                    'ads_how_step4_title',
                    'Смотришь аналитику и докручиваешь кампанию',
                  )}
                </h3>
                <p>
                  {TX(
                    t,
                    'ads_how_step4_text',
                    'В кабинете видишь показы, клики, CTR и гео — докручиваешь кампании по живым цифрам.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PageMarqueeTail />
      <FooterIcons />
      {/* Стили — усилена технологичная планета и визуальные эффекты */}
      <style jsx>{`
        .ads-landing {
          padding-top: 12px;
          padding-bottom: 80px;
        }

        .ads-hero {
          margin-top: 6px;
        }

        .ads-hero-main {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 18px;
          align-items: center;
        }

        .ads-hero-text {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ads-hero-title {
          margin: 4px 0 4px;
          font-size: clamp(26px, 3.2vw, 36px);
          line-height: 1.1;
        }

        .ads-hero-sub {
          margin: 0;
          font-size: 14px;
          color: #cfe1ffff;
          opacity: 0.92;
        }

        .ads-hero-cta-row {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ads-hero-cta {
          font-size: 14px;
          padding-inline: 18px;
        }

        .ghost-btn {
          box-shadow: none;
        }

        .ads-hero-meta {
          margin-top: 6px;
          font-size: 13px;
          opacity: 0.85;
        }

        .ads-test-badge {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px dashed rgba(252, 211, 77, 0.9);
          background: rgba(30, 64, 175, 0.36);
          box-shadow: 0 0 20px rgba(253, 224, 71, 0.35);
          font-size: 13px;
        }

        .ads-test-badge span {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 3px;
        }

        .ads-test-badge p {
          margin: 0;
        }

        .ads-hero-visual {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ads-hero-orbit {
          position: relative;
          width: 220px;
          height: 220px;
          margin-left: auto;
          margin-right: auto;
          filter: drop-shadow(0 0 24px rgba(56, 191, 248, 0.14));
        }

        .ads-orbit-bg-glow {
          position: absolute;
          inset: -30%;
          background: radial-gradient(
            circle at 50% 30%,
            rgba(59, 131, 246, 0),
            transparent 65%
          );
          opacity: 0.9;
          pointer-events: none;
        }

        .ads-orbit-mesh {
          position: absolute;
          inset: 14px;
          border-radius: 999px;
          background-image: radial-gradient(
              circle at 50% 50%,
              rgba(15, 23, 42, 0.2),
              transparent 60%
            ),
            repeating-linear-gradient(
              0deg,
              rgba(148, 163, 184, 0.3),
              rgba(148, 163, 184, 0.3) 1px,
              transparent 1px,
              transparent 6px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(148, 163, 184, 0.3),
              rgba(148, 163, 184, 0.3) 1px,
              transparent 1px,
              transparent 6px
            );
          mix-blend-mode: screen;
          opacity: 0.5;
          overflow: hidden;
          mask-image: radial-gradient(circle, #fff 60%, transparent 80%);
          animation: adsMeshSpin 26s linear infinite;
        }

        .ads-orbit-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 1px dashed rgba(157, 221, 255, 0.92);
          box-shadow: 0 0 24px rgba(0, 200, 255, 0.45);
          animation: adsOrbitSpin 18s linear infinite;
        }

        .ads-orbit-ring.ring-2 {
          inset: 18px;
          border-style: solid;
          border-color: rgba(255, 196, 0, 0.7);
          opacity: 0.85;
          animation-duration: 30s;
          animation-direction: reverse;
        }

        .ads-orbit-core {
          position: absolute;
          inset: 30px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: radial-gradient(
              circle,
              rgba(255, 255, 255, 0.28),
              transparent 60%
            ),
            conic-gradient(
              from 210deg,
              rgba(56, 189, 248, 1),
              rgba(129, 140, 248, 1),
              rgba(251, 191, 36, 1),
              rgba(56, 189, 248, 1)
            );
          box-shadow: 0 0 40px rgba(56, 191, 248, 1);
          overflow: hidden;
        }

        .ads-orbit-core::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 30% 0%,
            rgba(255, 255, 255, 0.4),
            transparent 55%
          );
          mix-blend-mode: screen;
          opacity: 0.8;
        }

        .ads-orbit-core span {
          position: relative;
          font-weight: 900;
          letter-spacing: 0.18em;
          font-size: 16px;
          text-transform: uppercase;
          text-shadow: 0 0 18px rgba(15, 23, 42, 0.9);
        }

        .ads-orbit-node {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            #e5f4ff,
            rgba(59, 130, 246, 1)
          );
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.9),
            0 0 28px rgba(56, 189, 248, 0.8);
          animation: adsNodePulse 3s ease-in-out infinite alternate;
        }

        .ads-orbit-node.node-1 {
          top: 14%;
          left: 64%;
          animation-delay: 0.1s;
        }

        .ads-orbit-node.node-2 {
          top: 68%;
          left: 76%;
          animation-delay: 0.7s;
        }

        .ads-orbit-node.node-3 {
          top: 72%;
          left: 22%;
          animation-delay: 1.4s;
        }

        .ads-orbit-node.node-4 {
          top: 22%;
          left: 18%;
          animation-delay: 2s;
        }

        .ads-orbit-tag {
          position: absolute;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          border: 1px solid rgba(191, 219, 254, 0.8);
          background: rgba(15, 23, 42, 0.92);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.7),
            0 0 18px rgba(56, 189, 248, 0.75);
          animation: adsOrbitFloat 3s ease-in-out infinite alternate;
          pointer-events: none;
        }

        .tag-top {
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .tag-right {
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
        }

        .tag-bottom {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        @keyframes adsOrbitSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes adsMeshSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }

        @keyframes adsOrbitFloat {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-4px);
          }
        }

        @keyframes adsNodePulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .ads-packages {
          margin-top: 14px;
        }

        .ads-section-title {
          margin: 0 0 6px;
          font-size: clamp(20px, 2.3vw, 24px);
        }

        .ads-section-text {
          margin: 0 0 12px;
          font-size: 14px;
          color: #cfe1ff;
          opacity: 0.92;
        }

        .ads-pack-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .ads-pack-card {
          position: relative;
          text-align: left;
          border-radius: 16px;
          padding: 14px 12px 12px;
          background: radial-gradient(
              circle at 0 0,
              rgba(0, 200, 255, 0.2),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(234, 179, 8, 0.18),
              transparent 55%
            ),
            linear-gradient(180deg, rgba(15, 23, 42, 0.98), #020617);
          border: 1px solid rgba(148, 163, 184, 0.75);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 0.16s ease, box-shadow 0.18s ease,
            border-color 0.18s ease, background 0.18s ease;
        }

        .ads-pack-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.85);
          border-color: rgba(96, 165, 250, 1);
        }

        .ads-pack-card.selected {
          border-color: rgba(252, 211, 77, 0.95);
          box-shadow: 0 0 0 1px rgba(252, 211, 77, 0.9),
            0 18px 40px rgba(0, 0, 0, 0.95),
            0 0 30px rgba(252, 211, 77, 0.55);
        }

        .ads-pack-card.recommended {
          background: radial-gradient(
              circle at 0 0,
              rgba(59, 130, 246, 0.4),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.26),
              transparent 55%
            ),
            linear-gradient(180deg, rgba(15, 23, 42, 1), #020617);
        }

        .ads-pack-tag {
          position: absolute;
          top: -12px;
          right: 14px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(8, 47, 73, 0.98);
          border: 1px solid rgba(251, 191, 36, 0.95);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.85),
            0 0 16px rgba(251, 191, 36, 0.8);
          pointer-events: none;
        }

        .ads-pack-head {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: flex-start;
        }

        .ads-pack-tier {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .ads-pack-price {
          text-align: right;
          font-size: 11px;
        }

        .ads-pack-price-main {
          display: block;
          font-size: 18px;
          font-weight: 800;
        }

        .ads-pack-price-sub {
          opacity: 0.8;
        }

        .ads-pack-price.test .ads-pack-price-main {
          color: #22c55e;
        }

        .ads-pack-body {
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .ads-pack-feature-row {
          display: flex;
          justify-content: space-between;
          gap: 6px;
        }

        .ads-pack-feature-row span {
          opacity: 0.85;
        }

        .ads-pack-feature-row strong {
          font-weight: 700;
        }

        .ads-pack-bullets {
          margin: 6px 0 0;
          padding-left: 18px;
          font-size: 12.5px;
        }

        .ads-pack-bullets li {
          margin-bottom: 3px;
        }

        .ads-pack-footer {
          margin-top: 6px;
          font-size: 11px;
          opacity: 0.85;
        }

        .ads-pack-hint {
          opacity: 0.85;
        }

        .ads-how {
          margin-top: 14px;
        }

        .ads-how-grid {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          font-size: 13px;
        }

        .ads-how-step {
          position: relative;
          padding: 10px 10px 8px 10px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.94);
          border: 1px solid rgba(148, 163, 184, 0.7);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.75);
          overflow: hidden;
        }

        .ads-how-step::before {
          content: '';
          position: absolute;
          inset: -40%;
          background: radial-gradient(
            circle at 0 0,
            rgba(56, 189, 248, 0.16),
            transparent 60%
          );
          opacity: 0.8;
          pointer-events: none;
        }

        .ads-how-step > * {
          position: relative;
          z-index: 1;
        }

        .ads-how-step-num {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
          background: radial-gradient(
              circle,
              rgba(255, 255, 255, 0.3),
              transparent 50%
            ),
            linear-gradient(180deg, rgba(37, 99, 235, 1), #020617);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.8);
          margin-bottom: 4px;
        }

        .ads-how-step h3 {
          margin: 2px 0 4px;
          font-size: 14px;
        }

        .ads-how-step p {
          margin: 0;
          font-size: 13px;
          color: #cfe1ff;
          opacity: 0.9;
        }

        .ads-status-panel {
          margin-top: 14px;
        }

        .ads-error,
        .ads-info {
          font-size: 13px;
        }

        .ads-info {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(21, 128, 61, 0.16);
          border: 1px solid rgba(74, 222, 128, 0.9);
          color: #bbf7d0;
        }

        @media (max-width: 1024px) {
          .ads-hero-main {
            grid-template-columns: minmax(0, 1fr);
          }

          .ads-hero-visual {
            order: -1;
          }
        }

        @media (max-width: 960px) {
          .ads-pack-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ads-how-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          /* MOBILE FULL-BLEED:
             убираем внешние гуттеры layout (.page-content/.page-center)
             и прижимаем все панели к краям экрана */
          .page-content {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .page-center.ads-landing {
            max-width: none !important;
            width: 100vw !important;
            margin-left: calc(50% - 50vw) !important;
            margin-right: calc(50% - 50vw) !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          /* Сами панели — без боковых бордеров/скруглений, чтобы выглядело как full-width */
          .page-center.ads-landing .panel {
            border-left: 0 !important;
            border-right: 0 !important;
            border-radius: 0 !important;
          }
          .ads-pack-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .ads-how-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .ads-hero-meta {
            font-size: 12.5px;
          }

          .ads-hero-orbit {
            width: 190px;
            height: 190px;
          }
        }


        /* ===== V6.9 unified opaque premium landing ===== */
        .ads-landing-suite {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          margin-top: 6px;
          padding: 16px;
          border-radius: 28px;
          border: 1px solid rgba(91, 213, 255, 0.62);
          background:
            radial-gradient(circle at 8% 0%, rgba(44, 164, 224, 0.22), transparent 32%),
            radial-gradient(circle at 96% 8%, rgba(255, 221, 78, 0.2), transparent 31%),
            linear-gradient(136deg, #0b3049 0%, #081827 48%, #29260f 100%);
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.78),
            0 0 0 1px rgba(15, 106, 151, 0.22) inset,
            0 0 42px rgba(58, 205, 255, 0.13);
        }

        .ads-landing-suite::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.72;
          background:
            linear-gradient(90deg, transparent 0 49.8%, rgba(104, 220, 255, 0.09) 50%, transparent 50.2%),
            linear-gradient(0deg, transparent 0 49.8%, rgba(255, 224, 89, 0.06) 50%, transparent 50.2%);
          background-size: 88px 88px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.74), transparent 78%);
        }

        .ads-landing-access-bar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: stretch;
          gap: 12px;
          min-width: 0;
        }

        .ads-landing-package-card {
          min-width: 0;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 20px;
          border: 1px solid rgba(91, 213, 255, 0.48);
          background: linear-gradient(135deg, #071828 0%, #0c2333 58%, #24230f 100%);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .ads-landing-package-card.is-active {
          border-color: rgba(116, 242, 202, 0.62);
        }

        .ads-landing-package-card.is-expired {
          border-color: rgba(255, 139, 115, 0.62);
        }

        .ads-landing-package-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: linear-gradient(145deg, #0a3551, #121b2b 56%, #3d3512);
          box-shadow:
            0 0 22px rgba(74, 219, 255, 0.28),
            inset 0 0 0 1px rgba(126, 225, 255, 0.25);
        }

        .ads-landing-package-icon svg {
          width: 36px;
          height: 36px;
          filter: drop-shadow(0 0 8px rgba(99, 230, 255, 0.55));
          animation: adsLandingPackageFloat 3.4s ease-in-out infinite;
        }

        .ads-landing-package-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ads-landing-package-eyebrow,
        .ads-purchase-selection-label {
          color: #a6c5dd;
          font-size: 9px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .ads-landing-package-headline {
          min-width: 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ads-landing-package-headline strong {
          min-width: 0;
          color: #f7fbff;
          font-size: 17px;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .ads-landing-package-headline.is-empty strong,
        .ads-landing-package-headline.is-loading strong,
        .ads-landing-package-headline.is-error strong {
          font-size: 13px;
          font-weight: 750;
          color: #d8e7f4;
        }

        .ads-landing-package-headline.is-error strong {
          color: #ffd2c9;
        }

        .ads-package-state {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 850;
          line-height: 1.1;
          white-space: normal;
        }

        .ads-package-state.is-active {
          color: #c9ffe9;
          border: 1px solid rgba(74, 222, 128, 0.72);
          background: #0b3b2d;
          box-shadow: 0 0 16px rgba(74, 222, 128, 0.22);
        }

        .ads-package-state.is-expired {
          color: #ffd3c9;
          border: 1px solid rgba(251, 113, 133, 0.72);
          background: #471c28;
        }

        .ads-landing-package-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          min-width: 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(103, 200, 236, 0.2);
          background: #071421;
        }

        .ads-landing-package-metrics > div {
          min-width: 0;
          padding: 7px 9px;
          border-inline-start: 1px solid rgba(91, 213, 255, 0.18);
        }

        .ads-landing-package-metrics > div:first-child {
          border-inline-start: 0;
        }

        .ads-landing-package-metrics span,
        .ads-landing-package-metrics strong {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .ads-landing-package-metrics span {
          color: #8eaec4;
          font-size: 8px;
          line-height: 1.2;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ads-landing-package-metrics strong {
          margin-top: 2px;
          color: #f5fbff;
          font-size: 11px;
          line-height: 1.22;
        }

        .ads-package-loader {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
          border-radius: 999px;
          border: 2px solid rgba(104, 222, 255, 0.2);
          border-top-color: #62e8ff;
          animation: adsLandingSpin 0.8s linear infinite;
        }

        .ads-package-lock {
          color: #ffe45c;
          font-size: 20px;
          line-height: 1;
        }

        .ads-personal-cabinet-btn,
        .ads-buy-selected-btn {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border: 1px solid rgba(91, 220, 255, 0.82);
          color: #f8fcff;
          background: linear-gradient(135deg, #0a4162 0%, #122740 54%, #55480d 100%);
          box-shadow:
            0 15px 32px rgba(0, 0, 0, 0.56),
            0 0 24px rgba(61, 211, 255, 0.19),
            inset 0 1px 0 rgba(255, 255, 255, 0.13);
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }

        .ads-personal-cabinet-btn {
          min-width: 190px;
          max-width: 240px;
          padding: 10px 14px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 13px;
          line-height: 1.15;
        }

        .ads-personal-cabinet-btn::after,
        .ads-buy-selected-btn::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: -80% -30%;
          background: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, 0.34) 50%, transparent 62%);
          transform: translateX(-70%) rotate(8deg);
          animation: adsLandingButtonSweep 3.8s ease-in-out infinite;
        }

        .ads-personal-cabinet-btn:not(:disabled):hover,
        .ads-buy-selected-btn:not(:disabled):hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
          box-shadow:
            0 19px 40px rgba(0, 0, 0, 0.66),
            0 0 30px rgba(66, 220, 255, 0.28),
            0 0 22px rgba(255, 224, 82, 0.2);
        }

        .ads-personal-cabinet-btn:disabled,
        .ads-buy-selected-btn:disabled {
          cursor: not-allowed;
          filter: saturate(0.42) brightness(0.72);
          opacity: 0.68;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
        }

        .ads-personal-cabinet-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 11px;
          color: #7cecff;
          background: #071827;
          box-shadow: 0 0 14px rgba(87, 223, 255, 0.3);
        }

        .ads-personal-cabinet-icon svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ads-personal-cabinet-lock {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          color: transparent;
          background: #ffc954;
          box-shadow: 0 0 10px rgba(255, 201, 84, 0.82);
        }

        .ads-suite-divider {
          height: 1px;
          margin: 14px 2px;
          background: linear-gradient(90deg, transparent, rgba(91, 213, 255, 0.54), rgba(255, 219, 76, 0.58), transparent);
          box-shadow: 0 0 14px rgba(91, 213, 255, 0.17);
        }

        .ads-landing-section {
          min-width: 0;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(91, 213, 255, 0.24);
          background: linear-gradient(145deg, #081d2e 0%, #071522 58%, #211f0d 100%);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .ads-hero,
        .ads-packages,
        .ads-how {
          margin-top: 0;
        }

        .ads-hero-title-plaque {
          width: min(100%, 610px);
          padding: 10px 14px 11px;
          border-radius: 16px;
          border: 1px solid rgba(255, 220, 63, 0.48);
          background: linear-gradient(115deg, #0b2639, #111b29 58%, #41390d);
          box-shadow:
            0 12px 28px rgba(0, 0, 0, 0.48),
            0 0 22px rgba(255, 217, 55, 0.13);
        }

        .ads-hero-title {
          margin: 0;
          font-size: clamp(23px, 2.7vw, 32px);
          line-height: 1.08;
          overflow-wrap: anywhere;
        }

        .ads-hero-title .qcoinLabel {
          display: block;
          max-width: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .ads-hero-sub,
        .ads-hero-meta,
        .ads-section-text,
        .ads-how-step p,
        .ads-pack-card,
        .ads-pack-feature-row,
        .ads-pack-bullets,
        .ads-pack-hint {
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .ads-section-heading-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .ads-pack-grid {
          align-items: stretch;
        }

        .ads-pack-card {
          min-width: 0;
          height: 100%;
          border-color: rgba(99, 187, 224, 0.48);
          background:
            radial-gradient(circle at 0 0, rgba(0, 190, 255, 0.14), transparent 48%),
            linear-gradient(155deg, #0a2236 0%, #081421 58%, #26220d 100%);
        }

        .ads-pack-card.recommended {
          background:
            radial-gradient(circle at 0 0, rgba(47, 143, 255, 0.28), transparent 52%),
            linear-gradient(155deg, #102b4e 0%, #0a1728 58%, #30290c 100%);
        }

        .ads-pack-head,
        .ads-pack-feature-row {
          min-width: 0;
        }

        .ads-pack-tier,
        .ads-pack-price,
        .ads-pack-body,
        .ads-pack-feature-row > *,
        .ads-pack-footer {
          min-width: 0;
        }

        .ads-pack-feature-row {
          display: grid;
          grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
          align-items: start;
          gap: 8px;
        }

        .ads-pack-feature-row strong {
          text-align: end;
          overflow-wrap: anywhere;
        }

        .ads-purchase-dock {
          position: relative;
          overflow: hidden;
          margin-top: 14px;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 219, 72, 0.5);
          background: linear-gradient(115deg, #08263b 0%, #0a1a2a 52%, #37300c 100%);
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .ads-purchase-selection {
          min-width: 0;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          gap: 9px;
        }

        .ads-purchase-selection strong {
          color: #fff5a5;
          font-size: 17px;
          letter-spacing: 0.12em;
        }

        .ads-purchase-selection-meta {
          min-width: 0;
          color: #c5d9e8;
          font-size: 12px;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .ads-buy-selected-btn {
          min-width: 190px;
          min-height: 48px;
          padding: 10px 18px;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 13px;
          line-height: 1.15;
        }

        .ads-buy-selected-shine {
          position: absolute;
          inset: 0;
          z-index: -2;
          background: radial-gradient(circle at 18% 18%, rgba(83, 226, 255, 0.28), transparent 36%);
        }

        .ads-buy-selected-icon {
          color: #ffe45c;
          text-shadow: 0 0 12px rgba(255, 228, 92, 0.85);
          animation: adsLandingDiamondPulse 1.8s ease-in-out infinite;
        }

        .ads-inline-status {
          margin-top: 10px;
        }

        .ads-inline-status .ads-error,
        .ads-inline-status .ads-info {
          padding: 10px 12px;
          border-radius: 12px;
          overflow-wrap: anywhere;
        }

        .ads-how-step {
          min-width: 0;
          background: linear-gradient(145deg, #0a2032, #071421 64%, #29240d);
          border-color: rgba(92, 199, 239, 0.42);
        }

        @keyframes adsLandingSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes adsLandingPackageFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }

        @keyframes adsLandingButtonSweep {
          0%, 55% { transform: translateX(-72%) rotate(8deg); opacity: 0; }
          66% { opacity: 1; }
          86%, 100% { transform: translateX(72%) rotate(8deg); opacity: 0; }
        }

        @keyframes adsLandingDiamondPulse {
          0%, 100% { transform: scale(0.84) rotate(0deg); opacity: 0.72; }
          50% { transform: scale(1.12) rotate(45deg); opacity: 1; }
        }

        @media (max-width: 980px) {
          .ads-landing-access-bar {
            grid-template-columns: minmax(0, 1fr);
          }

          .ads-personal-cabinet-btn {
            width: 100%;
            max-width: none;
          }

          .ads-landing-package-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ads-landing-package-metrics > div:nth-child(3),
          .ads-landing-package-metrics > div:nth-child(4) {
            border-top: 1px solid rgba(255, 220, 74, 0.22);
          }

          .ads-landing-package-metrics > div:nth-child(3) {
            border-inline-start: 0;
          }
        }

        @media (max-width: 720px) {
          .ads-landing-suite {
            padding: 8px;
            border-radius: 0;
          }

          .ads-landing-package-card {
            grid-template-columns: 38px minmax(0, 1fr);
            padding: 10px;
            gap: 9px;
            border-radius: 16px;
          }

          .ads-landing-package-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
          }

          .ads-landing-package-icon svg {
            width: 29px;
            height: 29px;
          }

          .ads-landing-package-headline strong {
            font-size: 14px;
          }

          .ads-landing-package-metrics strong {
            font-size: 10px;
          }

          .ads-personal-cabinet-btn {
            min-height: 42px;
            padding-block: 7px;
          }

          .ads-suite-divider {
            margin: 9px 0;
          }

          .ads-landing-section {
            padding: 12px;
            border-radius: 16px;
          }

          .ads-hero-title-plaque {
            padding: 8px 10px;
          }

          .ads-hero-title {
            font-size: clamp(21px, 7.2vw, 28px);
          }

          .ads-purchase-dock {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
            padding: 10px;
          }

          .ads-purchase-selection {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .ads-purchase-selection-meta {
            grid-column: 1 / -1;
          }

          .ads-buy-selected-btn {
            width: 100%;
            min-width: 0;
            min-height: 44px;
          }

          .ads-pack-feature-row {
            grid-template-columns: minmax(0, 1fr);
            gap: 2px;
          }

          .ads-pack-feature-row strong {
            text-align: start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ads-landing-package-icon svg,
          .ads-package-loader,
          .ads-personal-cabinet-btn::after,
          .ads-buy-selected-btn::after,
          .ads-buy-selected-icon {
            animation: none !important;
          }
        }



        /* ===== V6.11 final landing hero composition ===== */
        .ads-hero-label,
        .badge-cta {
          display: none !important;
        }

        .ads-hero-composition {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(280px, .82fr);
          gap: 18px;
          align-items: start;
        }

        .ads-hero-image-column,
        .ads-hero-story-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ads-hero-preview-card {
          margin: 0;
          padding: 10px;
          border-radius: 18px;
          border: 1px solid rgba(89, 211, 255, .34);
          background: linear-gradient(145deg, #061829, #07131f 62%, #26220d);
          box-shadow: 0 16px 38px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.035);
        }

        .ads-hero-preview-card .quantum-shot {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: cover;
          border-radius: 13px;
        }

        .ads-hero-preview-card figcaption {
          margin-top: 8px;
          padding: 0 4px;
          color: #c7d9e8;
          font-size: 12px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .ads-hero-title-plaque {
          width: 100%;
          max-width: none;
          padding: 8px 11px 9px;
          border-radius: 14px;
        }

        .ads-hero-title {
          font-size: clamp(12px, 1.35vw, 16px) !important;
          line-height: 1.16;
          letter-spacing: .015em;
        }

        .ads-hero-story-column {
          align-items: stretch;
          padding-top: 4px;
        }

        .ads-hero-story-column .ads-hero-orbit {
          width: 205px;
          height: 205px;
          margin: 0 auto;
        }

        .ads-hero-copy-plaque {
          display: grid;
          gap: 9px;
          padding: 13px 14px;
          border-radius: 16px;
          border: 1px solid rgba(92, 204, 244, .32);
          background:
            radial-gradient(circle at 100% 100%, rgba(255, 216, 67, .1), transparent 45%),
            linear-gradient(145deg, #071a2b, #07131f 66%, #211e0c);
          box-shadow: 0 14px 32px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.03);
        }

        .ads-hero-copy-plaque .ads-hero-sub,
        .ads-hero-copy-plaque .ads-hero-meta {
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.48;
          overflow-wrap: anywhere;
        }

        .ads-hero-copy-plaque .ads-hero-meta {
          padding-top: 9px;
          border-top: 1px solid rgba(255, 218, 67, .2);
          color: #c7d9e8;
        }

        @media (max-width: 980px) {
          .ads-hero-composition {
            grid-template-columns: minmax(0, 1fr);
          }
          .ads-hero-story-column {
            display: grid;
            grid-template-columns: minmax(150px, .42fr) minmax(0, .58fr);
            align-items: center;
          }
        }

        @media (max-width: 720px) {
          .ads-hero-composition {
            gap: 10px;
          }
          .ads-hero-image-column,
          .ads-hero-story-column {
            gap: 9px;
          }
          .ads-hero-story-column {
            display: flex;
          }
          .ads-hero-preview-card {
            padding: 7px;
            border-radius: 14px;
          }
          .ads-hero-preview-card .quantum-shot {
            max-height: 220px;
            border-radius: 10px;
          }
          .ads-hero-title-plaque {
            padding: 6px 8px 7px;
            border-radius: 12px;
          }
          .ads-hero-title {
            font-size: clamp(11px, 3.5vw, 14px) !important;
          }
          .ads-hero-story-column .ads-hero-orbit {
            width: 160px;
            height: 160px;
          }
          .ads-hero-copy-plaque {
            padding: 10px;
            border-radius: 13px;
          }
          .ads-hero-copy-plaque .ads-hero-sub,
          .ads-hero-copy-plaque .ads-hero-meta {
            font-size: 12px;
            line-height: 1.42;
          }
        }
      `}</style>
    </div>
  )
}
