'use client'

import * as React from 'react';
import Image from 'next/image'
import { Suspense } from 'react'
import Forum from './Forum'
import NewsFeed from './NewsFeed'
import NewsTicker from './NewsTicker'
import { useI18n } from '@/components/i18n'

/**
 * forum/page.js — порядок блоков:
 *  1) Greeting: banner + forum_description (i18n)
 *  2) Forum — отдельная затемнённая карточка (full width)
 *  3) Live Markets (тикер котировок)
 *  4) Crypto TV (Bloomberg) — адаптивный iframe
 *  5) News — 30 на страницу
 *  6) Bottom Marquee — бесшовная бегущая строка
 */
// ---- mount gate (стабилизирует гидрацию) ----
function Mounted({ children }) {
  const [m, setM] = React.useState(false);
  React.useEffect(() => { setM(true) }, []);
  if (!m) {
    return (
      <div className="page-wrap">
        <section className="glass neon card p-4 md:p-6 mb-6">Loading…</section>
      </div>
    );
  }
  return children;
}

/* -------------------- helpers & global styles -------------------- */
const cls = (...xs) => xs.filter(Boolean).join(' ')

const PageStyles = () => (
  <style jsx global>{`
    .page-wrap { width: 100%; max-width: 1600px; margin: 0 auto; padding: 0 12px; }
    .card     { border-radius: 16px; }
    .glass    { background: rgba(10,14,20,.55); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); }
    .neon     { box-shadow: 0 0 16px rgba(0,255,255,.12), inset 0 0 16px rgba(0,255,255,.05); border-color: rgba(0,255,255,.22); }

    /* ===== Banner: всегда на всю ширину контейнера, без обрезки ===== */
    .banner-wrap { width:100%; }
    .banner-img{
      display:block;
      width:100%;
      height:auto;            /* сохраняем пропорции */
      object-fit:contain;     /* ничего не обрезаем */
      object-position:center; /* центрируем */
      background:transparent;
    }

    /* Forum container breathing */
    .forum-card { padding: 16px; }
    @media (min-width: 768px){ .forum-card { padding: 24px; } }

    /* Bloomberg TV */
    .tv-clip { overflow:hidden; border-radius:16px; }
    .tv-wrap { position: relative; width:100%; aspect-ratio: 16/9; }
    .tv-iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }

    /* ===== Bottom Marquee ===== */
    .bottom-marquee-rail { width:100%; }
    .bottom-marquee { overflow:hidden; }
    .bottom-marquee .track {
      display:flex; gap:64px; white-space:nowrap;
      will-change: transform;
      animation: bm-roll 45s linear infinite;
    }
    @keyframes bm-roll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  `}</style>
)

/* -------------------- generic card -------------------- */
function Card({ title, hint, children, className='' }) {
  return (
    <section className={cls('glass neon card shadow-xl p-4 md:p-6 mb-6', className)}>
      {(title || hint) && (
        <div className="flex items-center gap-3 mb-4">
          {title && <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>}
          {hint && <span className="text-xs text-white/60">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

/* -------------------- Greeting (banner + intro) -------------------- */
function Greeting() {
  const { t } = useI18n()
  return (
    <section className="mb-6 page-wrap">
      {/* Banner */}
      <div className="glass neon card p-0 overflow-hidden mb-4">
        <div className="banner-wrap">
          {/* ширину/высоту указываем для оптимизации; отображение управляется CSS (width:100%; height:auto) */}
          <Image
            src="/branding/forum-banner.png"
            alt={t('forum_banner_alt')}
            priority
            sizes="100vw"
            width={2400}
            height={800}
            className="banner-img"
          />
        </div>
      </div>
      {/* Текст приветствия */}
      <div className="glass neon card p-4 md:p-6">
        <p className="text-white/80 text-sm md:text-base leading-relaxed">
          {t('forum_description')}
        </p>
      </div>
    </section>
  )
}

/* -------------------- Live markets (между Forum и TV) -------------------- */
function LiveMarketsCard() {
  const { t } = useI18n()
  return (
    <div className="page-wrap">
      <Card
        title={t('forum_live_markets_title')}
        hint={t('forum_live_markets_hint')}
      >
        <NewsTicker mode="quotes" />
      </Card>
    </div>
  )
}

/* -------------------- Crypto TV -------------------- */
function CryptoTVCard() {
  return (
    <div className="page-wrap">
      <Card title="Crypto TV" hint="Bloomberg">
        <div className="tv-clip">
          <div className="tv-wrap">
            <iframe
              className="tv-iframe"
              title="Bloomberg Live"
              src="https://www.bloomberg.com/live"
              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
              allowFullScreen
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

/* -------------------- News (30 per page) -------------------- */
function NewsCard() {
  return (
    <div className="page-wrap">
      <Card id="news" title="News" hint="multisource • paged">
        <Suspense fallback={<div className="text-white/60">Loading…</div>}>
          <NewsFeed pageSize={30} />
        </Suspense>
      </Card>
    </div>
  )
}

/* -------------------- Bottom Marquee -------------------- */
function BottomMarquee() {
  const { t } = useI18n()
  const content = (
    <>
      <span>{t('marquee')}</span>
      <span>{t('marquee')}</span>
      <span>{t('marquee')}</span>
      <span>{t('marquee')}</span>
    </>
  )
  return (
    <div className="bottom-marquee-rail">
      <div className="page-wrap">
        <section className="glass neon card px-4 py-2 mb-3 bottom-marquee" aria-hidden="true">
          {/* две одинаковые дорожки подряд — бесшовный цикл */}
          <div className="track">{content}{content}</div>
        </section>
      </div>
    </div>
  )
}

/* -------------------- Page -------------------- */
export default function ForumPage() {
return (
  <Mounted>
    <>
      <PageStyles />

      {/* 1) Greeting */}
      <Greeting />

      {/* 2) Forum */}
      <div className="page-wrap">
        <section className="glass neon card forum-card">
          <Forum />
        </section>
      </div>

      {/* 3) Live markets */}
      <LiveMarketsCard />

      {/* 4) Crypto TV */}
      <CryptoTVCard />

      {/* 5) News */}
      <NewsCard />

      {/* 6) Bottom Marquee */}
      <BottomMarquee />
    </>
  </Mounted>
 )
};
