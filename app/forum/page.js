'use client'

import { useEffect, useRef } from 'react'
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
      `}</style>
    </div>
  )
}
