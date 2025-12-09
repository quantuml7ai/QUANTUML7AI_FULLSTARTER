// app/game/page.js
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '../../components/i18n'

export default function GamePage() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  // бесшовная маркиза как на главной
  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  const paragraphs = [
    t('game_p1'),
    t('game_p2'),
    t('game_p3'),
    t('game_p4'),
    t('game_p5'),
    t('game_p6'),
    t('game_p7'),
    t('game_p8'),
    t('game_p9'),
    t('game_p10'),
    t('game_p11'),
    t('game_p12'),
    t('game_p13'),
    t('game_p14'),
    t('game_p15'),
  ].filter(Boolean)

  const platforms = [
    { key: 'web', src: '/game/web.png' },
    { key: 'ios', src: '/game/ios.png' },
    { key: 'windows', src: '/game/windows.png' },
    { key: 'apk', src: '/game/apk.png' },
  ]

  const heroAlt = t('game_hero_alt') || 'QGame hero'

  return (
    <>
      {/* ВНЕШНЯЯ ОБЁРТКА С НАСТРАИВАЕМЫМИ ОТСТУПАМИ */}
      <main className="game-page-root">
        <section className="panel game-panel">
          {/* РЕСПОНСИВНОЕ ПОЛЕ ИЗ SVG-ГЛИФОВ ПОД ТЕКСТОМ */}
          <ResponsiveGlyphField />

          <div className="game-panel-inner">
            <h1 className="game-title neon-title">
              <span className="neon-title-core">
                {t('game_title')}
              </span>
              <span
                className="neon-title-glow"
                aria-hidden="true"
              >
                {t('game_title')}
              </span>
            </h1>

            {/* hero-картинка */}
<div className="game-hero-wrap">
  <div
    className="game-hero-bg"
    role="img"
    aria-label={heroAlt}
  />
  <div
    className="game-hero-glow"
    aria-hidden="true"
  />
</div>

            {/* описание */}
            <div className="game-description">
              {Array.isArray(paragraphs)
                ? paragraphs.map((p, i) => (
                    <div
                      key={i}
                      className="game-paragraph-wrap"
                    >
                      <div className="game-paragraph-bg" />
                      <p className="game-paragraph">
                        {p}
                      </p>
                    </div>
                  ))
                : paragraphs && (
                    <div className="game-paragraph-wrap">
                      <div className="game-paragraph-bg" />
                      <p className="game-paragraph">
                        {paragraphs}
                      </p>
                    </div>
                  )}
            </div>

            {/* ПЛАТФОРМЫ */}
            <div
              className="game-platforms"
              aria-label={
                t('game_platforms_aria') || 'Platforms'
              }
            >
              {platforms.map(({ key, src }) => (
                <div
                  className="game-platform"
                  key={key}
                >
                  <div className="game-platform-orbit">
                    <div className="game-platform-orbit-ring" />
                    <Image
                      src={src}
                      alt={t('game_pl') || 'platform'}
                      width={140}
                      height={140}
                      className="game-platform-icon"
                      draggable={false}
                    />
                  </div>
                  <div className="game-platform-label">
                    {/* подпись можно добавить позже из i18n */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ЛОКАЛЬНЫЕ СТИЛИ ПАНЕЛИ + ОБЩИЕ ОТСТУПЫ */}
          <style jsx>{`
            /* ---------------------------
               ГЛОБАЛЬНЫЕ НАСТРОЙКИ ОТСТУПОВ
               --------------------------- */

            .game-page-root {
              /* здесь можно настраивать отступы страницы */
              --game-panel-margin-x-mobile: 16px;
              --game-panel-margin-y-mobile: 18px;
              --game-panel-margin-x-desktop: 40px;
              --game-panel-margin-y-desktop: 40px;

  /* full-width, без влияния глобальной .container */
  width: 100%;
  margin: 0 auto;

  padding: var(--game-panel-margin-y-mobile)
    var(--game-panel-margin-x-mobile);
}
            @media (min-width: 900px) {
              .game-page-root {
                padding: var(--game-panel-margin-y-desktop)
                  var(--game-panel-margin-x-desktop);
              }
            }

            .game-panel {
              position: relative;
              overflow: hidden;
              padding: 30px 18px 34px;
              border-radius: 26px;
              background:
                radial-gradient(
                  circle at top left,
                  rgba(80, 227, 255, 0.3),
                  transparent 60%
                ),
                radial-gradient(
                  circle at bottom right,
                  rgba(129, 140, 248, 0.35),
                  transparent 65%
                ),
                radial-gradient(
                  circle at 0% 100%,
                  rgba(16, 185, 129, 0.28),
                  transparent 60%
                ),
                radial-gradient(
                  circle at 100% 0%,
                  rgba(244, 114, 182, 0.28),
                  transparent 65%
                ),
                radial-gradient(
                  circle at center,
                  #020617,
                  #020617
                );
              box-shadow:
                0 0 0 1px rgba(148, 255, 255, 0.18),
                0 32px 90px rgba(0, 0, 0, 0.96);
              backdrop-filter: blur(22px);
              --glyph-size-min: 130px;
              --glyph-size-max: 260px;
              --glyph-opacity: 0.95;

              /* центрируем панель, чтобы не липла к краю */
              width: 100%;
              max-width: 1200px;
              margin: 0 auto;
            }

            @media (min-width: 900px) {
              .game-panel {
                padding: 34px 26px 42px;
                --glyph-size-min: 160px;
                --glyph-size-max: 320px;
              }
            }

            .game-panel-inner {
              position: relative;
              z-index: 2;
              color: #e5f3ff;
              text-shadow: 0 0 8px rgba(15, 23, 42, 0.9);
            }

            .neon-title {
              position: relative;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin: 0 0 20px;
            }

            .neon-title-core {
              position: relative;
              z-index: 2;
              font-size: clamp(
                1.8rem,
                2.3vw + 1.3rem,
                2.7rem
              );
              letter-spacing: 0.18em;
              text-transform: uppercase;
              background: linear-gradient(
                90deg,
                #e0f2fe,
                #a5b4fc,
                #22d3ee,
                #f97316,
                #facc15
              );
              background-size: 220% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: titleGradient 22s
                linear infinite;
              text-shadow:
                0 0 16px rgba(15, 23, 42, 0.9),
                0 0 24px rgba(37, 99, 235, 0.75),
                0 0 42px rgba(59, 130, 246, 0.75);
            }

            .neon-title-glow {
              position: absolute;
              inset: 0;
              filter: blur(18px);
              opacity: 0.65;
              color: #60a5fa;
              mix-blend-mode: screen;
              pointer-events: none;
            }

            @keyframes titleGradient {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }

.game-hero-wrap {
  position: relative;
  width: 100%;
  /* блок сам по себе резиновый, высота от ширины */
  aspect-ratio: 16 / 9;

  border-radius: 20px;
  overflow: hidden;
  margin: 0 auto 20px;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.95),
    0 0 40px rgba(37, 99, 235, 0.5),
    0 0 70px rgba(34, 197, 94, 0.35);
}

/* вот это наш "блок под изображение" */
.game-hero-bg {
  position: absolute;
  inset: 0;
  background-image: url('/game/1.png');
  background-size: cover;      /* тянет/ужимает, как надо */
  background-position: center; /* по центру */
  background-repeat: no-repeat;
}

/* glow можно оставить как есть */
.game-hero-glow {
  position: absolute;
  inset: auto 0 -40%;
  height: 55%;
  background:
    radial-gradient(
      ellipse at center,
      rgba(56, 189, 248, 0.35),
      transparent 70%
    ),
    radial-gradient(
      ellipse at center,
      rgba(244, 114, 182, 0.3),
      transparent 80%
    );
  opacity: 0.9;
  mix-blend-mode: screen;
}


            .game-description {
              text-align: left;
              margin-bottom: 26px;
              display: flex;
              flex-direction: column;
              gap: 30px;
            }

            .game-paragraph-wrap {
              position: relative;
              border-radius: 16px;
              overflow: hidden;
              padding: 1px;
              /* чуть ослабили, чтобы лучше видеть SVG под низом */
              background: linear-gradient(
                120deg,
                rgba(56, 189, 248, 0.65),
                rgba(129, 140, 248, 0.55),
                rgba(16, 185, 129, 0.6),
                rgba(244, 114, 182, 0.65)
              );
              background-size: 200% 200%;
              animation: borderFlow 18s
                ease-in-out infinite alternate;
            }

            .game-paragraph-bg {
              position: absolute;
              inset: 0;
              margin: 1px;
              border-radius: 15px;
              background:
                linear-gradient(
                  135deg,
                  rgba(15, 23, 42, 0.36),
                  rgba(15, 23, 42, 0.47)
                ),
                radial-gradient(
                  circle at top left,
                  rgba(37, 99, 235, 0.22),
                  transparent 60%
                ),
                radial-gradient(
                  circle at bottom right,
                  rgba(16, 185, 129, 0.24),
                  transparent 60%
                );
              opacity: 0.88;
              backdrop-filter: blur(14px);
              box-shadow:
                0 8px 22px rgba(0, 0, 0, 0.66),
                0 0 18px rgba(15, 23, 42, 0.71);
            }

            .game-paragraph {
              position: relative;
              z-index: 1;
              padding: 12px 14px 12px;
              white-space: pre-wrap;
              color: #e5f3ff;
              font-size: 0.93rem;
              line-height: 1.6;
              text-shadow:
                0 0 8px rgba(15, 23, 42, 0.95),
                0 0 24px rgba(15, 23, 42, 0.9);
            }

            @keyframes borderFlow {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }

            .game-platforms {
              display: grid;
              grid-template-columns: repeat(
                2,
                minmax(0, 1fr)
              );
              gap: 22px 18px;
              justify-items: center;
            }

            @media (min-width: 720px) {
              .game-platforms {
                grid-template-columns: repeat(
                  4,
                  minmax(0, 1fr)
                );
              }
            }

            .game-platform {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 9px;
              text-align: center;
            }

            .game-platform-orbit {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .game-platform-orbit-ring {
              position: absolute;
              width: 135%;
              height: 135%;
              border-radius: 999px;
              border: 1px solid rgba(148, 163, 239, 0.8);
              box-shadow:
                0 0 28px rgba(59, 130, 246, 0.6),
                0 0 52px rgba(56, 189, 248, 0.6);
              opacity: 0.8;
              transform: rotate(-8deg);
              filter: blur(0.1px);
            }

            .game-platform-icon {
              width: 130px;
              height: auto;
              display: block;
              object-fit: contain;
              background: transparent;
              filter:
                drop-shadow(
                  0 0 12px rgba(59, 130, 246, 0.8)
                )
                drop-shadow(
                  0 0 28px rgba(129, 230, 217, 0.65)
                );
              transition:
                transform 0.25s ease-out,
                filter 0.25s ease-out;
            }

            .game-platform:hover
              .game-platform-icon {
              transform: translateY(-7px) scale(1.05);
              filter:
                drop-shadow(
                  0 0 16px rgba(56, 189, 248, 0.95)
                )
                drop-shadow(
                  0 0 38px rgba(244, 114, 182, 0.9)
                );
            }

            .game-platform-label {
              font-size: 0.8rem;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              opacity: 0.9;
              color: #cbd5f5;
            }

            @media (max-width: 600px) {
              .game-panel {
                padding: 22px 14px 26px;
                /* на мобиле глифы в ~2 раза меньше */
                --glyph-size-min: 65px;
                --glyph-size-max: 130px;
              }
              .game-paragraph {
                font-size: 0.9rem;
                line-height: 1.55;
              }
              .game-platform-icon {
                width: 110px;
              }
            }

            @media (min-width: 1200px) {
              .game-panel {
                --glyph-size-min: 180px;
                --glyph-size-max: 340px;
              }
              .game-paragraph {
                font-size: 0.98rem;
              }
            }
          `}</style>
        </section>
      </main>

      {/* МАРКИЗА (классы как на главной, стили — из globals.css) */}
      <section
        className="marquee-wrap no-gutters"
        aria-hidden="true"
      >
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>

      {/* НИЖНИЕ ИКОНКИ */}
      <div className="ql7-icons-row">
        <Link
          href="/privacy"
          className="ql7-icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
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

        <Link
          href="/contact"
          className="ql7-icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
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

/* ================================
   РЕСПОНСИВНОЕ ПОЛЕ С SVG-ГЛИФАМИ
   ================================ */

function ResponsiveGlyphField() {

  // PNG-глифы из /public/game/glif1.png ... glif10.png
  // у каждого свой слой и базовый размер
  const glyphs = [
    { id: 'glif1', src: '/game/glif1.png', layer: 'front', width: 150, height: 150 },
    { id: 'glif2', src: '/game/glif2.png', layer: 'mid',   width: 500, height: 500 },
    { id: 'glif3', src: '/game/glif3.png', layer: 'mid',   width: 240, height: 240 },
    { id: 'glif4', src: '/game/glif4.png', layer: 'front', width: 280, height: 260 },
    { id: 'glif5', src: '/game/glif5.png', layer: 'mid',   width: 300, height: 300 },

    { id: 'glif6', src: '/game/glif6.png', layer: 'back',  width: 410, height: 410 },
    { id: 'glif7', src: '/game/glif7.png', layer: 'back',  width: 450, height: 450 },
    { id: 'glif8', src: '/game/glif8.png', layer: 'mid',   width: 500, height: 500 },
    { id: 'glif9', src: '/game/glif9.png', layer: 'back',  width: 200, height: 200 },
    { id: 'glif10', src: '/game/glif10.png', layer: 'front', width: 100, height: 100 },
  ]


  return (
    <>
      <div
        className="glyph-field"
        aria-hidden="true"
      >
        <div className="glyph-grid">
          {glyphs.map((glyph, index) => (
            <div
              key={glyph.id}
              className={`glyph-item glyph-layer-${glyph.layer}`}
              style={{
                '--glyph-index': index,
                '--glyph-width': `${glyph.width}px`,
                '--glyph-height': `${glyph.height}px`,
              }}
            >
              <Image
                src={glyph.src}
                alt=""
                width={glyph.width}
                height={glyph.height}
                className={`glyph-img glyph-img-${glyph.id}`}
                draggable={false}
              />
            </div>
          ))}

        </div>
      </div>

      <style jsx>{`
        .glyph-field {
          position: absolute;
          left: 0;
          right: 0;
          /* начинаем поле примерно под hero-картинкой */
          top: clamp(260px, 32vh, 380px);
          /* позволяем уходить чуть ниже панели, чтобы поле выглядело глубоким */
          bottom: -160px;
          z-index: 0;
          pointer-events: none;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .glyph-grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(
              clamp(
                var(--glyph-size-min),
                30vw,
                var(--glyph-size-max)
              ),
              1fr
            )
          );
          grid-auto-rows: minmax(
            clamp(130px, 30vw, 280px),
            auto
          );
          gap: clamp(10px, 2.2vw, 26px);
          padding: clamp(10px, 2.3vw, 26px);
          opacity: var(--glyph-opacity);
          mix-blend-mode: screen;
          grid-auto-flow: dense;
        }

        .glyph-item {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(
              0 0 14px rgba(56, 189, 248, 0.55)
            )
            drop-shadow(
              0 0 26px rgba(129, 230, 217, 0.4)
            );
          transform-origin: center center;
          /* большой хаотичный полёт по блоку */
          animation: glyphPathA 34s ease-in-out
            infinite alternate;
          animation-delay: calc(
            var(--glyph-index) * -1.4s
          );
        }

        /* разбиваем на разные траектории,
           чтобы они реально меняли путь */
        .glyph-item:nth-child(3n) {
          animation-name: glyphPathB;
          animation-duration: 38s;
        }

        .glyph-item:nth-child(4n) {
          animation-name: glyphPathC;
          animation-duration: 30s;
        }

        .glyph-item:nth-child(5n) {
          animation-name: glyphPathD;
          animation-duration: 42s;
        }

        .glyph-item:nth-child(7n) {
          animation-name: glyphPathE;
          animation-duration: 36s;
        }

        /* чуть ломаем сетку по высоте */
        .glyph-item:nth-child(5n) {
          grid-row: span 2;
        }

        .glyph-item svg,
        .glyph-item img {
          width: var(--glyph-width, 100%);
          height: auto;
          max-width: var(--glyph-width, var(--glyph-size-max));
          max-height: var(--glyph-height, 520px);
        }

        .glyph-img {
          display: block;
          width: var(--glyph-width, 100%);
          height: auto;
          max-height: var(--glyph-height, 520px);
          object-fit: contain;
        }

        .glyph-layer-front {
          opacity: 1;
        }

        .glyph-layer-mid {
          opacity: 0.78;
        }

        .glyph-layer-back {
          opacity: 0.52;
        }

        /* КРУПНЫЕ ТРАЕКТОРИИ.
           Используем vw/vh, чтобы элементы реально
           улетали от одного края блока к другому. */

        @keyframes glyphPathA {
          0% {
            transform: translate3d(
                -4vw,
                -6vh,
                0
              )
              scale(0.85)
              rotate(-4deg);
          }
          20% {
            transform: translate3d(
                14vw,
                -18vh,
                0
              )
              scale(1)
              rotate(3deg);
          }
          40% {
            transform: translate3d(
                26vw,
                4vh,
                0
              )
              scale(1.05)
              rotate(-2deg);
          }
          60% {
            transform: translate3d(
                10vw,
                20vh,
                0
              )
              scale(0.96)
              rotate(2deg);
          }
          80% {
            transform: translate3d(
                -16vw,
                12vh,
                0
              )
              scale(1.02)
              rotate(-3deg);
          }
          100% {
            transform: translate3d(
                -22vw,
                -10vh,
                0
              )
              scale(0.9)
              rotate(0deg);
          }
        }

        @keyframes glyphPathB {
          0% {
            transform: translate3d(
                8vw,
                -12vh,
                0
              )
              scale(0.9)
              rotate(2deg);
          }
          25% {
            transform: translate3d(
                -10vw,
                -6vh,
                0
              )
              scale(1.02)
              rotate(-3deg);
          }
          50% {
            transform: translate3d(
                -20vw,
                18vh,
                0
              )
              scale(1.05)
              rotate(4deg);
          }
          75% {
            transform: translate3d(
                16vw,
                10vh,
                0
              )
              scale(0.95)
              rotate(-2deg);
          }
          100% {
            transform: translate3d(
                22vw,
                -8vh,
                0
              )
              scale(1)
              rotate(0deg);
          }
        }

        @keyframes glyphPathC {
          0% {
            transform: translate3d(
                -18vw,
                10vh,
                0
              )
              scale(0.92)
              rotate(-2deg);
          }
          30% {
            transform: translate3d(
                -4vw,
                -16vh,
                0
              )
              scale(1.03)
              rotate(4deg);
          }
          55% {
            transform: translate3d(
                20vw,
                -4vh,
                0
              )
              scale(1.06)
              rotate(-3deg);
          }
          80% {
            transform: translate3d(
                6vw,
                18vh,
                0
              )
              scale(0.96)
              rotate(3deg);
          }
          100% {
            transform: translate3d(
                -12vw,
                6vh,
                0
              )
              scale(1)
              rotate(0deg);
          }
        }

        @keyframes glyphPathD {
          0% {
            transform: translate3d(
                16vw,
                12vh,
                0
              )
              scale(0.9)
              rotate(0deg);
          }
          20% {
            transform: translate3d(
                -14vw,
                16vh,
                0
              )
              scale(1.02)
              rotate(-4deg);
          }
          45% {
            transform: translate3d(
                -22vw,
                -8vh,
                0
              )
              scale(1.06)
              rotate(4deg);
          }
          75% {
            transform: translate3d(
                12vw,
                -18vh,
                0
              )
              scale(0.95)
              rotate(-3deg);
          }
          100% {
            transform: translate3d(
                6vw,
                4vh,
                0
              )
              scale(1)
              rotate(1deg);
          }
        }

        @keyframes glyphPathE {
          0% {
            transform: translate3d(
                0,
                -18vh,
                0
              )
              scale(0.9)
              rotate(-3deg);
          }
          25% {
            transform: translate3d(
                20vw,
                -6vh,
                0
              )
              scale(1.03)
              rotate(3deg);
          }
          50% {
            transform: translate3d(
                4vw,
                16vh,
                0
              )
              scale(1.05)
              rotate(-2deg);
          }
          75% {
            transform: translate3d(
                -20vw,
                2vh,
                0
              )
              scale(0.96)
              rotate(4deg);
          }
          100% {
            transform: translate3d(
                -6vw,
                -12vh,
                0
              )
              scale(1)
              rotate(0deg);
          }
        }

        @media (max-width: 720px) {
          .glyph-grid {
            grid-template-columns: repeat(
              auto-fit,
              minmax(
                clamp(500px, 24vw, var(--glyph-size-max)),
                1fr
              )
            );
            grid-auto-rows: minmax(
              clamp(70px, 26vw, 140px),
              auto
            );
            gap: 8px;
            padding: 8px 6px 14px;
          }

          .glyph-item svg,
          .glyph-item img {
            max-height: min(var(--glyph-height, 500px), 500x);
          }


          .glyph-layer-back {
            opacity: 0.34;
          }

          /* на мобиле не удлиняем ряды слишком сильно */
          .glyph-item:nth-child(5n) {
            grid-row: span 1;
          }

          /* делаем полёт поэнергичнее на маленьком экране */
          .glyph-item {
            animation-duration: 26s;
          }
          .glyph-item:nth-child(3n) {
            animation-duration: 28s;
          }
          .glyph-item:nth-child(4n) {
            animation-duration: 24s;
          }
        }

        @media (min-width: 900px) {
          .glyph-item:nth-child(3n + 1) {
            margin-top: -14px;
          }
          .glyph-item:nth-child(3n + 2) {
            margin-top: 6px;
          }
          .glyph-item:nth-child(4n) {
            margin-bottom: 18px;
          }
        }

        @media (min-width: 1200px) {
          .glyph-grid {
            grid-template-columns: repeat(
              auto-fit,
              minmax(500px, 1fr)
            );
            grid-auto-rows: minmax(210px, auto);
          }

          .glyph-item svg,
          .glyph-item img {
            max-height: min(var(--glyph-height, 500px), 500px);
          }


          .glyph-layer-back {
            opacity: 0.58;
          }
        }
      `}</style>
    </>
  )
}

 