'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Forum from './Forum'
import { useI18n } from '../../components/i18n'   // тот же хук, что на главной

export const dynamic = 'force-static'          // страница статическая

export default function ForumPage() {
  const { t } = useI18n()

  // БЕГУЩАЯ СТРОКА: тот же приём, что на главной
  const marqueeRef = useRef(null)
  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
    }
  }, [])

  return (
    <div className="iso-forum-page">
      <div className="iso-forum-shell">
        {/* ВЕРХНИЙ БРЕНД-БЛОК: ширина = ширине контейнера форума */}
        <div className="forum-brand">
          <img
            className="forum-brand-img"
            src="/branding/forum_logo.png"   // положи файл в public/branding/
            alt="QL7 Forum — Global Network"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* САМ ФОРУМ (НЕ ТРОГАЕМ) */}
        <Forum />
      </div>

      {/* НИЖНЯЯ МАРКИЗА — СОВПАДАЕТ С ГЛАВНОЙ (ключ тянется ТОЛЬКО t('marquee')) */}
      <div className="iso-forum-shell">
        <section className="marquee-wrap" aria-hidden="true">
          <div className="marquee" ref={marqueeRef}>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
            <span>{t('marquee')}</span>
          </div>
        </section>
      </div>

      {/* ИКОНКИ ПОСЛЕ МАРКИЗЫ (БЕЗ БЛОКА) — ИДЕНТИЧНО ГЛАВНОЙ */}
      <div className="icons-row">
        {/* Размер каждой иконки можно менять через CSS-переменную --size */}
        <Link
          href="/privacy"
          className="icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <img
            className="click-icon"
            src="/click/policy.png"
            alt="Privacy"
            draggable="false"
          />
        </Link>

        <Link
          href="/contact"
          className="icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <img
            className="click-icon"
            src="/click/support.png"
            alt="Support"
            draggable="false"
          />
        </Link>
      </div>

      {/* Локальные стили страницы. Маркизу НЕ стилизуем здесь, чтобы она выглядела
          ровно как на главной (использует глобальные стили). */}
      <style jsx>{`
        /* Вся страница — колонка, форум растягивается до низа */
        .iso-forum-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Обёртка форума и маркизы: одинаковые боковые поля, как просили */
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

        /* Бренд-блок сверху, строго в ширину контейнера */
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

        /* На всякий случай убираем «липкие» нижние поля внутри форума */
        :global(.forum_root) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        .iso-forum-shell > :global(*) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        /* ===== Icons after marquee (no panel) — 1в1 как на главной ===== */
        .icons-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-evenly; /* симметричное расстояние */
          gap: 24px;
          flex-wrap: wrap; /* адаптация к узким экранам */
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

          /* активная анимация по умолчанию */
          animation:
            floatY 3s ease-in-out infinite,
            glow 2.4s ease-in-out infinite alternate;
        }

        /* наведение/фокус: подпрыгивание + усиленное свечение */
        .icon-link:hover .click-icon,
        .icon-link:focus-visible .click-icon {
          animation:
            floatY 3s ease-in-out infinite,
            glow-strong 1.6s ease-in-out infinite alternate,
            bounce 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ——— Ключевые кадры ——— */
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

        /* Доступность: уважение prefer-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .click-icon { animation: none; }
          .icon-link:hover .click-icon,
          .icon-link:focus-visible .click-icon { animation: none; }
        }
      `}</style>
    </div>
  )
}
