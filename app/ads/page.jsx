// app/ads/page.jsx
'use client'

import React, { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { useI18n } from '../../components/i18n'
import AdsHome from './home' // наш рекламный кабинет, рендерим внутри этой же страницы

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

  // текущий accountId (кошелёк или uid / telegram id)
  const [accountId, setAccountId] = useState(null)

  useEffect(() => {
    const acc = getAccountIdSafe()
    if (acc) {
      setAccountId(acc)
      console.log('[ADS] AdsPage accountId:', acc)
    } else {
      console.log('[ADS] AdsPage accountId: NONE')
    }
  }, [])


  const selectedPkg = useMemo(
    () => ADS_PACKAGES.find((p) => p.id === selectedId) || ADS_PACKAGES[1],
    [selectedId],
  )

  const openCabinet = () => {
    if (!accountId) {
      console.warn(
        '[ADS] openCabinet without accountId — кабинет откроется, но бэку нечего передавать',
      )
    }
    setView('cabinet')
  }

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

    const acc = accountId || getAccountIdSafe()
    if (acc && acc !== accountId) {
      setAccountId(acc)
    }
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

  // ====== Если активен режим "кабинет" — просто рендерим AdsHome и всё ======
  if (view === 'cabinet') {
    return <AdsHome initialAccountId={accountId} />
  }

  // ====== Иначе — продающая страница с пакетами ======

  return (
    <div className="page-content">
      <main className="page-center ads-landing">
        {/* HERO */}
        <section className="panel ads-hero">
          <div className="ads-hero-main">
            <div className="ads-hero-text">
              <div className="ads-hero-label">
                <span className="badge-cta">
                  {TX(t, 'ads_hero_badge', 'GLOBAL • SITE-WIDE ADS')}
                </span>
              </div>
              <h1 className="ads-hero-title">
                <span className="qcoinLabel">
                  {TX(
                    t,
                    'ads_page_title',
                    'Запусти рекламу по всему сайту QuantumL7',
                  )}
                </span>
              </h1>
              <p className="ads-hero-sub">
                {TX(
                  t,
                  'ads_page_subtitle',
                  'Твоя реклама в неоновой витрине: форум, страницы с трафиком, глобальные слоты по всему сайту.',
                )}
              </p>

              <div className="ads-hero-cta-row">
                <button
                  type="button"
                  className="btn ads-hero-cta"
                  disabled={loadingPay}
                  onClick={handlePrimaryClick}
                >
                  {ADS_TEST_MODE
                    ? TX(
                        t,
                        'ads_cta_test_mode',
                        'Перейти в рекламный кабинет (тестовый режим)',
                      )
                    : loadingPay
                    ? TX(t, 'ads_cta_loading', 'Создаём платёж…')
                    : TX(
                        t,
                        'ads_cta_main',
                        'Купить пакет и запустить рекламу',
                      )}
                </button>

                <button
                  type="button"
                  className="btn ghost ads-hero-cta ghost-btn"
                  onClick={openCabinet}
                >
                  {TX(
                    t,
                    'ads_cta_have_pkg',
                    'У меня уже есть пакет — в кабинет',
                  )}
                </button>
              </div>

              <div className="ads-hero-meta">
                <span>
                  {TX(
                    t,
                    'ads_meta_realtime',
                    'Ротатор слотов работает в реальном времени, слоты размещаются по всему сайту, аналитику смотри прямо в кабинете.',
                  )}
                </span>
              </div>

              {ADS_TEST_MODE && (
                <div className="ads-test-badge">
                  <span>
                    {TX(t, 'ads_test_mode_label', 'TEST MODE')}
                  </span>
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

            <div className="ads-hero-visual">
              {/* Технологичная планета-ротатор */}
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
                  <span>
                    {TX(t, 'ads_orbit_core_label', 'ADS')}
                  </span>
                </div>
                <div className="ads-orbit-tag tag-top">
                  <span>
                    {TX(t, 'ads_orbit_tag_global', 'GLOBAL')}
                  </span>
                </div>
                <div className="ads-orbit-tag tag-right">
                  <span>
                    {TX(t, 'ads_orbit_tag_forum', 'FORUM')}
                  </span>
                </div>
                <div className="ads-orbit-tag tag-bottom">
                  <span>
                    {TX(t, 'ads_orbit_tag_ai_rotator', 'AI-ROTATOR')}
                  </span>
                </div>
              </div>

              <figure className="media-block no-gutters">
                <NextImage
                  src="/ads/hero-preview.png"
                  alt={TX(
                    t,
                    'ads_hero_image_alt',
                    'QuantumL7 Ads — предпросмотр размещения рекламы',
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
            </div>
          </div>
        </section>

        {/* Пакеты */}
        <section className="panel ads-packages">
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
                >
                  {pkg.recommended && (
                    <div className="ads-pack-tag">
                      {TX(t, 'ads_pkg_recommended', 'Рекомендуем')}
                    </div>
                  )}

                  <div className="ads-pack-head">
                    <div className="ads-pack-tier">
                      {TX(
                        t,
                        `ads_pkg_tier_${tierKey}`,
                        pkg.tier,
                      )}
                    </div>
                    {!ADS_TEST_MODE && (
                      <div className="ads-pack-price">
                        <span className="ads-pack-price-main">
                          {pkg.priceUsd}${' '}
                          {/* фактическая сумма берётся на бэке из ENV */}
                        </span>
                        <span className="ads-pack-price-sub">
                          {TX(
                            t,
                            'ads_pkg_price_sub',
                            'оплата один раз, пакет на весь срок',
                          )}
                        </span>
                      </div>
                    )}
                    {ADS_TEST_MODE && (
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
                      <span>
                        {TX(t, 'ads_pkg_days', 'Срок пакета')}
                      </span>
                      <strong>
                        {pkg.days}{' '}
                        {TX(t, 'ads_pkg_days_suffix', 'дн.')}
                      </strong>
                    </div>
                    <div className="ads-pack-feature-row">
                      <span>
                        {TX(
                          t,
                          'ads_pkg_slots',
                          'Интенсивность показов',
                        )}
                      </span>
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
                      {pkg.bullets.map((b) => (
                        <li key={b.key}>
                          {TX(t, b.key, b.fb)}
                        </li>
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
        </section>

        {/* Как это работает */}
        <section className="panel ads-how">
          <h2 className="ads-section-title">
            {TX(
              t,
              'ads_how_title',
              'Как реклама крутится по всему сайту',
            )}
          </h2>

          <div className="ads-how-grid">
            <div className="ads-how-step">
              <div className="ads-how-step-num">1</div>
              <h3>
                {TX(
                  t,
                  'ads_how_step1_title',
                  'Покупаешь пакет или активируешь тест',
                )}
              </h3>
              <p>
                {TX(
                  t,
                  'ads_how_step1_text',
                  'Оформляешь пакет (или заходишь в тестовом режиме) и получаешь доступ к рекламному кабинету.',
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
                  'Ротатор крутит объявления в слотах сайта',
                )}
              </h3>
              <p>
                {TX(
                  t,
                  'ads_how_step3_text',
                  'Реклама идёт в слотах форума и по всему сайту, без дублей и с умной ротацией.',
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
        </section>

        {/* Статусы / ошибки */}
        {(error || info) && (
          <section className="panel ads-status-panel">
            {error && (
              <div className="ads-error">
                <strong>
                  {TX(
                    t,
                    'ads_status_error_label',
                    'Ошибка:',
                  )}{' '}
                </strong>
                {error}
              </div>
            )}
            {info && !error && (
              <div className="ads-info">
                <strong>
                  {TX(t, 'ads_status_ok_label', 'OK:')}{' '}
                </strong>
                {info}
              </div>
            )}
          </section>
        )}
      </main>

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


      `}</style>
    </div>
  )
}
