// app/forum/page.js
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Forum from './Forum'
import { useI18n } from '../../components/i18n'   // тот же хук, что на главной

export const dynamic = 'force-static'          // страница статическая

const LS_KEY = 'ql7_forum_rules_accepted_v1'

export default function ForumPage() {
  const { t } = useI18n()

  // Бегущая строка
  const marqueeRef = useRef(null)
  useEffect(() => {
    if (marqueeRef.current && !marqueeRef.current.dataset.duped) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
      marqueeRef.current.dataset.duped = '1'
    }
  }, [])

  // ===== POPUP: состояние =====
  const [showRules, setShowRules] = useState(false)
  const [canAccept, setCanAccept] = useState(false)
  const bodyRef = useRef(null)

  // показываем поповёр только если ещё не принят
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const ok = window.localStorage.getItem(LS_KEY)
      if (!ok) setShowRules(true)
    } catch {
      setShowRules(true)
    }
  }, [])

  // блокируем скролл страницы под поповёром
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!showRules) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showRules])

  // при открытии поповёра всегда требуем доскролла до низа
  useEffect(() => {
    if (showRules) {
      setCanAccept(false)
    }
  }, [showRules])

  // обработчик скролла внутри текста правил
  const handleScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    if (atBottom) setCanAccept(true)
  }, [])

  // нажали "Принять"
  const handleAccept = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY, '1')
      }
    } catch {}
    setShowRules(false)
  }

  return (
    <div className="iso-forum-page">
      <div className="iso-forum-shell">
        {/* Верхний бренд-блок */}
        <div className="forum-brand">
          <Image
            className="forum-brand-img"
            src="/branding/forum_logo.png"
            alt="QL7 Forum — Global Network"
            loading="lazy"
            decoding="async"
            width={1600}
            height={400}
          />
        </div>

        {/* САМ ФОРУМ (НЕ ТРОГАЕМ) — только мягкая обёртка для блокировки кликов */}
        <div className={`forum-host ${showRules ? 'forum-blocked' : ''}`}>
          <Forum />
        </div>
      </div>

      {/* Нижняя маркиза */}
      <div className="iso-forum-shell">
        <section className="marquee-wrap no-gutters" aria-hidden="true">
          <div className="marquee" ref={marqueeRef}>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
          </div>
        </section>
      </div>

      {/* Иконки после маркизы */}
      <div className="icons-row">
        <Link 
          href="/privacy"
          className="icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <Image
            className="click-icon"
            src="/click/policy.png"
            alt="Privacy"
            draggable={false}
            width={130}
            height={130}
          />
        </Link>

        <Link
          href="/contact"
          className="icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <Image
            className="click-icon"
            src="/click/support.png"
            alt="Support"
            draggable={false}
            width={130}
            height={130}
          />
        </Link>
      </div>

      {/* ===== POPUP: Forum Rules ===== */}
      {showRules && (
        <div className="forum-rules-overlay">
          <div className="forum-rules-modal">
            {/* Мигающий адаптивный бейдж ВНИМАНИЕ */}
            <div className="fr-attn-bar">
              <span className="fr-attn-ico">⚠️</span>
              <span className="fr-attn-label">
                {t('forum_rules_attention') || 'ВНИМАНИЕ'}
              </span>
              <span className="fr-attn-ico">⚠️</span>
            </div>

            {/* Краткий текст по центру */}
            <div className="fr-lead">
              {t('forum_rules_lead') ||
                'Нарушение правил форума приведёт к пожизненной блокировке и аннулированию баланса.'}
            </div>

            {/* Скроллируемое тело правил */}
            <div
              className="fr-body"
              ref={bodyRef}
              onScroll={handleScroll}
            >
              {(() => {
          const raw = t('forum_rules_body')

          // Новый формат: объект с title / section_* — как в i18n для policy/about
          if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const nodes = []

            if (raw.title) {
              nodes.push(
                <div key="title" className="fr-main-title">
                  {raw.title}
                </div>
              )
            }

            Object.keys(raw).forEach((key) => {
              if (key === 'title') return
              const val = raw[key]
              if (!val) return

              if (key.endsWith('_title')) {
                nodes.push(
                  <div key={key} className="fr-section-title">
                    {val}
                  </div>
                )
              } else {
                nodes.push(
                  <div key={key} className="fr-section-line">
                    {val}
                  </div>
                )
              }
            })

            return (
              <div className="fr-body-structured">
                {nodes}
              </div>
            )
          }

          // Старый формат: одиночная строка (HTML)
          if (typeof raw === 'string') {
            return (
              <div
                className="fr-body-text"
                dangerouslySetInnerHTML={{ __html: raw }}
              />
            )
          }

          // Старый формат: массив строк / HTML
          if (Array.isArray(raw)) {
            return (
              <ol className="fr-list">
                {raw.map((line, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
              </ol>
            )
          }

          // Фолбэк, если что-то пошло не так
          return (
            <p className="fr-body-text">
              forum_rules_body
            </p>
          )
              })()}
            </div>

            {/* Низ поповёра */}
            <div className="fr-footer">
              {!canAccept && (
                <div className="fr-note">
                  {t('forum_rules_scroll_hint') ||
                    'Прокрутите текст до конца, чтобы активировать кнопку.'}
                </div>
              )}

              {canAccept && (
                <button
                  type="button"
                  className="btn fr-accept-btn"
                  onClick={handleAccept}
                >
                  {t('forum_rules_accept') || 'Принять'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Стили страницы + поповёр */}
      <style jsx>{`
        /* Вся страница — колонка */
        .iso-forum-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Обёртка форума и маркизы */
        .iso-forum-shell {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          margin: 0;
          padding: 0;
          border: 0;
          overflow: clip;
        }
        @media (min-width: 768px) {
          .iso-forum-shell {
            padding-left: clamp(48px, 6vw, 160px);
            padding-right: clamp(48px, 6vw, 160px);
          }
        }
        @media (min-width: 1440px) {
          .iso-forum-shell {
            padding-left: clamp(192px, 16vw, 384px);
            padding-right: clamp(192px, 16vw, 384px);
          }
        }

        /* Бренд-блок сверху */
        .forum-brand {
          margin: 8px 0 10px 0;
        }
        .forum-brand-img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 12px;
          filter: drop-shadow(0 6px 20px rgba(80,120,255,.18));
        }

        /* Обёртка форума — сюда вешаем блокировку кликов */
        .forum-host {
          position: relative;
        }
        .forum-blocked {
          pointer-events: none; /* блокируем любые клики по форуму */
        }

        /* На всякий случай убираем лишние отступы внутри форума */
        :global(.forum_root) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        .iso-forum-shell > :global(*) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        /* Иконки после маркизы — как на главной */
        .icons-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          gap: 24px;
          flex-wrap: wrap;
          padding: 16px 0 8px;
        }

        .icon-link {
          display: inline-block;
          line-height: 0;
          cursor: pointer;
          outline: none;
        }

        .click-icon {
          width: var(--size, 120px);
          height: auto;
          display: block;
          user-select: none;
          pointer-events: none; /* клик ловит ссылка */
          background: transparent;
          animation: 
            floatY 3s ease-in-out infinite,
            glow 2.4s ease-in-out infinite alternate;
        }
 
        .icon-link:hover .click-icon,
        .icon-link:focus-visible .click-icon {
          animation:
            floatY 3s ease-in-out infinite,
            glow-strong 1.6s ease-in-out infinite alternate,
            bounce 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
 
        @keyframes floatY {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-8px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        @keyframes glow {
          0%   { filter: drop-shadow(0 2px 6px rgba(0, 200, 255, 0.18)); }
          100% { filter: drop-shadow(0 10px 22px rgba(0, 200, 255, 0.45)); }
        }

        @keyframes glow-strong {
          0%   { filter: drop-shadow(0 4px 10px rgba(0, 200, 255, 0.28)); }
          100% { filter: drop-shadow(0 14px 32px rgba(0, 220, 255, 0.7)); }
        }

        @keyframes bounce {
          0%   { transform: translateY(0) scale(1); }
          35%  { transform: translateY(-16px) scale(1.06); }
          60%  { transform: translateY(0) scale(0.98); }
          85%  { transform: translateY(-8px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
 
        @media (prefers-reduced-motion: reduce) {
          .click-icon { animation: none; }
          .icon-link:hover .click-icon,
          .icon-link:focus-visible .click-icon { animation: none; }
        }

        /* ===== POPUP STYLES ===== */

        .forum-rules-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 260px;      /* большой отступ — не перекрывает топ-бар */
          background: transparent;
          pointer-events: none;    /* не блокируем клики вне модалки (топ-бар живой) */
        }

        .forum-rules-modal {
          width: 100%;
          max-width: 1100px;
          margin: 0 10px;
          background: rgba(6, 8, 14, 0.97);
          border-radius: 18px;
          border: 1px solid rgba(255, 120, 120, 0.4);
          box-shadow:
            0 18px 40px rgba(0,0,0,.65),
            0 0 34px rgba(255,70,70,.26);
          padding: 16px 18px 14px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: center;
          pointer-events: auto;    /* модалка кликабельна */
        }

        /* Мигающий адаптивный бейдж ВНИМАНИЕ */
        .fr-attn-bar {
          --fr-badge-pad-y: clamp(10px, 2vw, 20px);
          --fr-badge-pad-x: clamp(30px, 6vw, 90px);
          --fr-badge-icon-size: clamp(20px, 3vw, 32px);
          --fr-badge-font-size: clamp(16px, 2.4vw, 26px);

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2vw, 22px);
          padding: var(--fr-badge-pad-y) var(--fr-badge-pad-x);
          margin: 0 auto 10px;
          max-width: 100%;
          border-radius: 999px;

          background: linear-gradient(180deg, rgba(80,0,0,.98), rgba(24,0,0,.96));
          box-shadow:
            0 0 18px rgba(255,70,70,.6),
            inset 0 0 0 1px rgba(255,255,255,.14);

          animation: frBadgePulse 0.9s steps(1) infinite;
        }

        .fr-attn-ico {
          font-size: var(--fr-badge-icon-size);
        }

        .fr-attn-label {
          font-weight: 900;
          letter-spacing: 0.18em;
          font-size: var(--fr-badge-font-size);
          text-transform: uppercase;
          color: #ffecec;
          text-shadow: 0 0 10px rgba(255,90,90,.9);
        }

        @keyframes frBadgePulse {
          0%, 50% {
            transform: scale(1);
            opacity: 1;
            box-shadow:
              0 0 22px rgba(255,70,70,.9),
              inset 0 0 0 1px rgba(255,255,255,.20);
          }
          51%, 100% {
            transform: scale(.96);
            opacity: .7;
            box-shadow:
              0 0 10px rgba(255,70,70,.35),
              inset 0 0 0 1px rgba(255,255,255,.10);
          }
        }

        .fr-lead {
          font-size: clamp(13px, 1.4vw, 18px);
          font-weight: 600;
          color: #ffd7d7;
          margin: 2px 0 8px;
        }

        .fr-body {
          margin-top: 2px;
          max-height: 210px;
          width: 100%;
          padding: 10px 12px;
          background: rgba(2,4,10,.98);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.08);
          box-shadow: inset 0 0 14px rgba(0,0,0,.85);
          overflow-y: auto;
          text-align: left;
        }
        .fr-body-text,
        .fr-list {
          font-size: 14px;
          line-height: 1.6;
          color: #f2f4ff;
          margin: 0;
          padding-left: 18px;
          white-space: pre-line;
        }
        .fr-list li { margin: 3px 0; }

        /* Структурированный вывод forum_rules_body (юридический документ) */
        .fr-body-structured {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fr-main-title {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin: 0 0 4px;
          color: #ffecec;
        }
        .fr-section-title {
          margin: 8px 0 2px;
          font-size: 14px;
          font-weight: 700;
          color: #ffb8b8;
        }
        .fr-section-line {
          font-size: 13px;
          line-height: 1.6;
          color: #f2f4ff;
          margin: 0;
        }
        .fr-footer {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .fr-note {
          font-size: 12px;
          color: #ffd0d0;
          opacity: .82;
        }
        /* Кнопка "Принять" в поповере = глобальный .btn + наша ширина */
        .btn.fr-accept-btn {
          min-width: 220px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:10px 16px;
          border-radius:12px;
          background:#039cfb38;
          color:#f9fbfc;
          font-weight:800;
          text-decoration:none;
          border:none;
          box-shadow:0 8px 18px rgb(250, 221, 3);
        }

        @media (max-width: 640px) {
          .forum-rules-overlay {
            padding-top: 260px;
          }
          .forum-rules-modal {
            padding: 12px 10px 10px;
            border-radius: 14px;
          }
          .fr-body {
            max-height: 400px;
            padding: 8px 8px;
          }
          .fr-body-text,
          .fr-list {
            font-size: 12.5px;
          }
          .fr-accept-btn {
            width: 50%;
          }
        }
      `}</style>
    </div>
  )
}
