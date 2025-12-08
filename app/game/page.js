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
  // хаотичный порядок: девайсы вперемешку с монетами и декором
  // QCoin убран из списка
  const glyphs = [
    // первый "слой"
    { id: 'pad-main', kind: 'gamepadHero', layer: 'front' },
    { id: 'smartphone-ui', kind: 'smartphone', layer: 'mid' },
    { id: 'btc', kind: 'btc', layer: 'mid' },
    { id: 'rig-multi', kind: 'rigMulti', layer: 'front' },
    { id: 'eth', kind: 'eth', layer: 'mid' },

    // второй "слой"
    { id: 'laptop-defi', kind: 'laptop', layer: 'mid' },
    { id: 'ltc', kind: 'ltc', layer: 'mid' },
    { id: 'defi-terminal', kind: 'defiTerminal', layer: 'front' },
    { id: 'network-sphere', kind: 'networkSphere', layer: 'back' },

    // третий "слой"
    { id: 'console-dual', kind: 'console', layer: 'mid' },
    { id: 'ar-headset', kind: 'arGlasses', layer: 'back' },
    { id: 'handheld', kind: 'handheld', layer: 'back' },
    { id: 'chains', kind: 'chains', layer: 'back' },

    // декор
    { id: 'buttons-a', kind: 'buttons', layer: 'back' },
    { id: 'triangles-a', kind: 'triangles', layer: 'back' },
    { id: 'squares-a', kind: 'squares', layer: 'back' },
    { id: 'dots-a', kind: 'dots', layer: 'back' },
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
              }}
            >
              <GlyphSvg kind={glyph.kind} />
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

        .glyph-item svg {
          width: 100%;
          height: 100%;
          max-width: var(--glyph-size-max);
          max-height: 320px;
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
                clamp(60px, 24vw, var(--glyph-size-max)),
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

          .glyph-item svg {
            max-height: 150px;
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
              minmax(200px, 1fr)
            );
            grid-auto-rows: minmax(210px, auto);
          }

          .glyph-item svg {
            max-height: 380px;
          }

          .glyph-layer-back {
            opacity: 0.58;
          }
        }
      `}</style>
    </>
  )
}

/* =======================
   ОДИН SVG-ГЛИФ
   ======================= */

function GlyphSvg({ kind }) {
  switch (kind) {
    /* ---------- ГЕЙМПАД ---------- */
    case 'gamepadHero':
      return (
        <svg
          viewBox="-120 -80 240 160"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="gp-body"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#1e293b"
              />
              <stop
                offset="40%"
                stopColor="#0f172a"
              />
              <stop
                offset="100%"
                stopColor="#020617"
              />
            </linearGradient>
            <linearGradient
              id="gp-outline"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
              />
              <stop
                offset="40%"
                stopColor="#22c55e"
              />
              <stop
                offset="80%"
                stopColor="#f97316"
              />
              <stop
                offset="100%"
                stopColor="#a855f7"
              />
            </linearGradient>
          </defs>
          <path
            d="
              M -110 10
              C -96 -54, -46 -76, 0 -65
              C 46 -76, 96 -54, 110 10
              C 120 52, 100 80, 64 90
              C 36 98, 14 80, 0 60
              C -14 80, -36 98, -64 90
              C -100 80, -120 52, -110 10
            "
            fill="url(#gp-body)"
            stroke="url(#gp-outline)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* крестовина */}
          <g transform="translate(-40,6)">
            <rect
              x="-16"
              y="-4"
              width="32"
              height="8"
              rx="4"
              fill="#e0f2fe"
            />
            <rect
              x="-4"
              y="-16"
              width="8"
              height="32"
              rx="4"
              fill="#e0f2fe"
            />
          </g>
          {/* ABXY */}
          <g transform="translate(42,0)">
            <circle
              cx="-10"
              cy="-10"
              r="6"
              fill="#fb7185"
            />
            <circle
              cx="10"
              cy="-10"
              r="6"
              fill="#4ade80"
            />
            <circle
              cx="-10"
              cy="10"
              r="6"
              fill="#facc15"
            />
            <circle
              cx="10"
              cy="10"
              r="6"
              fill="#38bdf8"
            />
          </g>
          {/* стики */}
          <circle
            cx="-28"
            cy="32"
            r="11"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2"
          />
          <circle
            cx="28"
            cy="32"
            r="11"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2"
          />
          {/* неоновые хвосты */}
          <polyline
            points="-90,-10 -70,-30 -40,-18 -10,-34 20,-20 50,-32 80,-6"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )

    /* ---------- СМАРТФОН ---------- */
    case 'smartphone':
      return (
        <svg
          viewBox="-70 -120 140 240"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="sp-body"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#0f172a"
              />
              <stop
                offset="100%"
                stopColor="#020617"
              />
            </linearGradient>
            <linearGradient
              id="sp-outline"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
              />
              <stop
                offset="40%"
                stopColor="#22c55e"
              />
              <stop
                offset="100%"
                stopColor="#a855f7"
              />
            </linearGradient>
          </defs>
          <rect
            x="-52"
            y="-112"
            width="104"
            height="224"
            rx="26"
            ry="26"
            fill="url(#sp-body)"
            stroke="url(#sp-outline)"
            strokeWidth="3"
          />
          <rect
            x="-40"
            y="-96"
            width="80"
            height="176"
            rx="14"
            ry="14"
            fill="#020617"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* верхние индикаторы */}
          <circle
            cx="-18"
            cy="-78"
            r="5"
            fill="#22c55e"
          />
          <circle
            cx="0"
            cy="-78"
            r="5"
            fill="#f97316"
          />
          <circle
            cx="18"
            cy="-78"
            r="5"
            fill="#38bdf8"
          />

          {/* полосы прогресса */}
          <rect
            x="-30"
            y="-56"
            width="60"
            height="10"
            rx="5"
            fill="#0f172a"
          />
          <rect
            x="-28"
            y="-54"
            width="40"
            height="6"
            rx="3"
            fill="#22c55e"
          />

          <rect
            x="-30"
            y="-34"
            width="60"
            height="10"
            rx="5"
            fill="#0f172a"
          />
          <rect
            x="-28"
            y="-32"
            width="24"
            height="6"
            rx="3"
            fill="#f97316"
          />

          {/* карта / арена */}
          <rect
            x="-30"
            y="-10"
            width="60"
            height="60"
            rx="10"
            ry="10"
            fill="#020617"
            stroke="#1e293b"
            strokeWidth="1.4"
          />
          <polyline
            points="-24,10 -10,-4 2,4 16,-8 24,2"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
          <polyline
            points="-24,26 -8,14 10,20 24,14"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <circle
            cx="-6"
            cy="30"
            r="3"
            fill="#facc15"
          />
          <circle
            cx="16"
            cy="20"
            r="3"
            fill="#fb7185"
          />

          {/* нижняя кнопка */}
          <circle
            cx="0"
            cy="92"
            r="7"
            fill="#020617"
            stroke="#38bdf8"
            strokeWidth="1.6"
          />
        </svg>
      )

    /* ---------- ЛАПТОП / DeFi ---------- */
    case 'laptop':
      return (
        <svg
          viewBox="-140 -100 280 190"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="lt-screen"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#020617"
              />
              <stop
                offset="100%"
                stopColor="#020617"
              />
            </linearGradient>
            <linearGradient
              id="lt-outline"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#a855f7"
              />
              <stop
                offset="40%"
                stopColor="#38bdf8"
              />
              <stop
                offset="100%"
                stopColor="#22c55e"
              />
            </linearGradient>
          </defs>

          <rect
            x="-120"
            y="-80"
            width="240"
            height="120"
            rx="18"
            ry="18"
            fill="#020617"
            stroke="url(#lt-outline)"
            strokeWidth="3"
          />
          <rect
            x="-108"
            y="-68"
            width="216"
            height="96"
            rx="12"
            ry="12"
            fill="url(#lt-screen)"
            stroke="#0f172a"
            strokeWidth="1.6"
          />

          {/* DeFi-панели */}
          <rect
            x="-96"
            y="-58"
            width="70"
            height="36"
            rx="8"
            fill="#020617"
          />
          <polyline
            points="-90,-42 -78,-50 -64,-38 -50,-54 -34,-40 -26,-46"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <rect
            x="-14"
            y="-58"
            width="90"
            height="36"
            rx="8"
            fill="#020617"
          />
          <polyline
            points="-8,-50 10,-56 26,-46 40,-52 60,-40 70,-46"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <rect
            x="-96"
            y="-16"
            width="172"
            height="38"
            rx="10"
            fill="#020617"
          />
          <rect
            x="-88"
            y="-10"
            width="46"
            height="10"
            rx="5"
            fill="#22c55e"
          />
          <rect
            x="-36"
            y="-10"
            width="34"
            height="10"
            rx="5"
            fill="#f97316"
          />
          <rect
            x="6"
            y="-10"
            width="56"
            height="10"
            rx="5"
            fill="#38bdf8"
          />

          {/* база */}
          <rect
            x="-140"
            y="40"
            width="280"
            height="22"
            rx="11"
            ry="11"
            fill="#020617"
            stroke="url(#lt-outline)"
            strokeWidth="2"
          />
          <rect
            x="-80"
            y="38"
            width="160"
            height="10"
            rx="5"
            fill="#020617"
          />
        </svg>
      )

    /* ---------- МУЛЬТИ-РИГ ---------- */
    case 'rigMulti':
      return (
        <svg
          viewBox="-170 -110 340 220"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="rig-outline"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#22c55e"
              />
              <stop
                offset="50%"
                stopColor="#38bdf8"
              />
              <stop
                offset="100%"
                stopColor="#a855f7"
              />
            </linearGradient>
          </defs>

          {/* центральный экран */}
          <rect
            x="-70"
            y="-64"
            width="140"
            height="96"
            rx="14"
            ry="14"
            fill="#020617"
            stroke="url(#rig-outline)"
            strokeWidth="2.4"
          />
          {/* боковые мониторы */}
          <rect
            x="-158"
            y="-52"
            width="80"
            height="80"
            rx="12"
            ry="12"
            fill="#020617"
            stroke="#38bdf8"
            strokeWidth="1.6"
          />
          <rect
            x="78"
            y="-52"
            width="80"
            height="80"
            rx="12"
            ry="12"
            fill="#020617"
            stroke="#a855f7"
            strokeWidth="1.6"
          />

          {/* центральные графики */}
          <polyline
            points="-50,-42 -34,-52 -18,-34 2,-52 18,-36 38,-48 52,-32"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="-50"
            y="-20"
            width="100"
            height="14"
            rx="7"
            fill="#020617"
          />
          <rect
            x="-46"
            y="-18"
            width="60"
            height="10"
            rx="5"
            fill="#38bdf8"
          />

          <rect
            x="-70"
            y="12"
            width="140"
            height="30"
            rx="10"
            fill="#020617"
          />
          <rect
            x="-62"
            y="16"
            width="40"
            height="10"
            rx="5"
            fill="#22c55e"
          />
          <rect
            x="-18"
            y="16"
            width="28"
            height="10"
            rx="5"
            fill="#f97316"
          />
          <rect
            x="16"
            y="16"
            width="40"
            height="10"
            rx="5"
            fill="#38bdf8"
          />

          {/* стойка */}
          <rect
            x="-18"
            y="50"
            width="36"
            height="38"
            rx="10"
            ry="10"
            fill="#020617"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <rect
            x="-80"
            y="84"
            width="160"
            height="16"
            rx="8"
            ry="8"
            fill="#020617"
            stroke="url(#rig-outline)"
            strokeWidth="1.8"
          />
        </svg>
      )

    /* ---------- КОНСОЛЬ + ДЖОЙСТИКИ ---------- */
    case 'console':
      return (
        <svg
          viewBox="-170 -80 340 160"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="cs-body"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#020617"
              />
              <stop
                offset="100%"
                stopColor="#020617"
              />
            </linearGradient>
            <linearGradient
              id="cs-outline"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
              />
              <stop
                offset="50%"
                stopColor="#a855f7"
              />
              <stop
                offset="100%"
                stopColor="#f97316"
              />
            </linearGradient>
          </defs>

          <rect
            x="-120"
            y="-30"
            width="240"
            height="60"
            rx="18"
            ry="18"
            fill="url(#cs-body)"
            stroke="url(#cs-outline)"
            strokeWidth="2.6"
          />
          <rect
            x="-96"
            y="-16"
            width="80"
            height="32"
            rx="11"
            ry="11"
            fill="#020617"
          />
          <circle
            cx="34"
            cy="-2"
            r="6"
            fill="#22c55e"
          />
          <circle
            cx="56"
            cy="-2"
            r="6"
            fill="#f97316"
          />
          <circle
            cx="78"
            cy="-2"
            r="6"
            fill="#38bdf8"
          />

          {/* левый пад */}
          <g transform="translate(-150,-6) scale(0.7)">
            <path
              d="
                M -60 8
                C -52 -16, -30 -26, -10 -22
                C 10 -26, 32 -16, 40 8
                C 46 26, 40 40, 26 46
                C 10 54, 4 46, -2 36
                C -10 26, -18 22, -28 22
                C -38 22, -46 26, -54 36
                C -60 46, -70 52, -84 46
                C -98 40, -104 26, -98 8
              "
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.4"
            />
            <rect
              x="-40"
              y="4"
              width="24"
              height="6"
              rx="3"
              fill="#60a5fa"
            />
            <rect
              x="-28"
              y="-8"
              width="6"
              height="24"
              rx="3"
              fill="#60a5fa"
            />
            <circle
              cx="12"
              cy="4"
              r="6"
              fill="#facc15"
            />
          </g>

          {/* правый пад */}
          <g transform="translate(150,-4) scale(0.7)">
            <path
              d="
                M -60 8
                C -52 -16, -30 -26, -10 -22
                C 10 -26, 32 -16, 40 8
                C 46 26, 40 40, 26 46
                C 10 54, 4 46, -2 36
                C -10 26, -18 22, -28 22
                C -38 22, -46 26, -54 36
                C -60 46, -70 52, -84 46
                C -98 40, -104 26, -98 8
              "
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.4"
            />
            <circle
              cx="-18"
              cy="4"
              r="6"
              fill="#fb7185"
            />
            <circle
              cx="0"
              cy="-4"
              r="5"
              fill="#38bdf8"
            />
            <circle
              cx="18"
              cy="4"
              r="5"
              fill="#4ade80"
            />
          </g>

          {/* провода */}
          <path
            d="
              M -130 -10
              C -96 -40, -66 -36, -40 -24
              C -18 -14, -2 -6, 0 0
            "
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="3 6"
            opacity="0.8"
          />
          <path
            d="
              M 130 -8
              C 98 -40, 68 -36, 42 -24
              C 20 -14, 6 -6, 0 -2
            "
            fill="none"
            stroke="#f472b6"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="3 6"
            opacity="0.8"
          />
        </svg>
      )

    /* ---------- AR-ОЧКИ ---------- */
    case 'arGlasses':
      return (
        <svg
          viewBox="-150 -60 300 120"
          role="presentation"
        >
          <path
            d="
              M -130 -14
              C -92 -48, -48 -48, -8 -18
              C 32 12, 76 12, 116 -18
              L 130 -10
              C 96 24, 52 32, 8 4
              C -28 -20, -76 -18, -122 14
              Z
            "
            fill="#020617"
            stroke="#38bdf8"
            strokeWidth="2.6"
          />
          <rect
            x="-106"
            y="-12"
            width="72"
            height="32"
            rx="10"
            ry="10"
            fill="#020617"
          />
          <rect
            x="14"
            y="-12"
            width="72"
            height="32"
            rx="10"
            ry="10"
            fill="#020617"
          />
          <circle
            cx="-62"
            cy="0"
            r="6"
            fill="#38bdf8"
          />
          <circle
            cx="62"
            cy="0"
            r="6"
            fill="#22c55e"
          />
          <circle
            cx="0"
            cy="-6"
            r="5"
            fill="#facc15"
          />
        </svg>
      )

    /* ---------- HANDHELD ---------- */
    case 'handheld':
      return (
        <svg
          viewBox="-150 -60 300 120"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="hh-outline"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
              />
              <stop
                offset="50%"
                stopColor="#a855f7"
              />
              <stop
                offset="100%"
                stopColor="#22c55e"
              />
            </linearGradient>
          </defs>
          <rect
            x="-130"
            y="-32"
            width="260"
            height="64"
            rx="26"
            ry="26"
            fill="#020617"
            stroke="url(#hh-outline)"
            strokeWidth="2.6"
          />

          <rect
            x="-58"
            y="-20"
            width="116"
            height="40"
            rx="10"
            ry="10"
            fill="#020617"
          />
          <polyline
            points="-48,-2 -30,-10 -10,0 10,-8 28,2 44,-4"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
          />

          <circle
            cx="-92"
            cy="-4"
            r="8"
            fill="#020617"
            stroke="#38bdf8"
            strokeWidth="1.7"
          />
          <rect
            x="-114"
            y="12"
            width="20"
            height="6"
            rx="3"
            fill="#38bdf8"
          />

          <circle
            cx="92"
            cy="-6"
            r="6"
            fill="#22c55e"
          />
          <circle
            cx="108"
            cy="4"
            r="5"
            fill="#f97316"
          />
          <circle
            cx="76"
            cy="6"
            r="5"
            fill="#fb7185"
          />
        </svg>
      )

    /* ---------- КРИПТО-АЛТАРЬ ---------- */
    case 'cryptoAltar':
      return (
        <svg
          viewBox="-140 -130 280 260"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="altar-glow"
              cx="50%"
              cy="20%"
              r="70%"
            >
              <stop
                offset="0%"
                stopColor="#facc15"
                stopOpacity="1"
              />
              <stop
                offset="35%"
                stopColor="#f97316"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="#020617"
                stopOpacity="0"
              />
            </radialGradient>
            <linearGradient
              id="altar-body"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#facc15"
              />
              <stop
                offset="30%"
                stopColor="#f97316"
              />
              <stop
                offset="100%"
                stopColor="#92400e"
              />
            </linearGradient>
          </defs>

          {/* свечения */}
          <circle
            cx="0"
            cy="-40"
            r="90"
            fill="url(#altar-glow)"
          />

          {/* основание */}
          <rect
            x="-90"
            y="40"
            width="180"
            height="34"
            rx="12"
            ry="12"
            fill="#020617"
            stroke="#facc15"
            strokeWidth="2"
          />
          <rect
            x="-110"
            y="70"
            width="220"
            height="26"
            rx="13"
            ry="13"
            fill="#020617"
            stroke="#f97316"
            strokeWidth="2.2"
          />

          {/* пирамида */}
          <path
            d="M 0 -90 L -60 40 H 60 Z"
            fill="url(#altar-body)"
            stroke="#facc15"
            strokeWidth="2.4"
          />
          <path
            d="M 0 -60 L -32 26 H 32 Z"
            fill="#020617"
            stroke="#facc15"
            strokeWidth="1.8"
          />

          {/* орбита вокруг */}
          <ellipse
            cx="0"
            cy="-40"
            rx="88"
            ry="30"
            fill="none"
            stroke="#fde68a"
            strokeWidth="1.6"
            strokeDasharray="6 8"
          />
        </svg>
      )

    /* ---------- Q-COIN (SVG оставил, но не используется в списке) ---------- */
    case 'qcoin':
      return (
        <svg
          viewBox="-120 -120 240 240"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="qcoin-gold"
              cx="30%"
              cy="20%"
              r="80%"
            >
              <stop
                offset="0%"
                stopColor="#fef3c7"
              />
              <stop
                offset="30%"
                stopColor="#facc15"
              />
              <stop
                offset="65%"
                stopColor="#f59e0b"
              />
              <stop
                offset="100%"
                stopColor="#92400e"
              />
            </radialGradient>
            <radialGradient
              id="qcoin-inner"
              cx="40%"
              cy="30%"
              r="70%"
            >
              <stop
                offset="0%"
                stopColor="#fefce8"
              />
              <stop
                offset="40%"
                stopColor="#fbbf24"
              />
              <stop
                offset="100%"
                stopColor="#b45309"
              />
            </radialGradient>
          </defs>

          <circle
            cx="0"
            cy="0"
            r="110"
            fill="url(#qcoin-gold)"
          />
          <circle
            cx="0"
            cy="0"
            r="92"
            fill="#451a03"
            opacity="0.24"
          />
          <circle
            cx="0"
            cy="0"
            r="82"
            fill="url(#qcoin-inner)"
          />

          {/* Q-форма */}
          <circle
            cx="-6"
            cy="-4"
            r="40"
            fill="none"
            stroke="#fef9c3"
            strokeWidth="10"
          />
          <path
            d="M 10 18 L 40 52"
            stroke="#fef9c3"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M -4 18 L 42 -24"
            stroke="#fef9c3"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* мелкие засечки по кругу */}
          {Array.from({ length: 32 }).map((_, i) => {
            const angle = (i / 32) * Math.PI * 2
            const r1 = 96
            const r2 = 102
            const x1 = Math.cos(angle) * r1
            const y1 = Math.sin(angle) * r1
            const x2 = Math.cos(angle) * r2
            const y2 = Math.sin(angle) * r2
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#fef9c3"
                strokeWidth={i % 2 === 0 ? 1.6 : 0.9}
                opacity={0.8}
              />
            )
          })}
        </svg>
      )

    /* ---------- BTC ---------- */
    case 'btc':
      return (
        <svg
          viewBox="-110 -110 220 220"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="btc-gold"
              cx="30%"
              cy="20%"
              r="80%"
            >
              <stop
                offset="0%"
                stopColor="#fef3c7"
              />
              <stop
                offset="35%"
                stopColor="#facc15"
              />
              <stop
                offset="100%"
                stopColor="#b45309"
              />
            </radialGradient>
          </defs>
          <circle
            cx="0"
            cy="0"
            r="100"
            fill="url(#btc-gold)"
          />
          <circle
            cx="0"
            cy="0"
            r="82"
            fill="#451a03"
            opacity="0.16"
          />
          {/* контур-микросхемы */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2
            const r1 = 72
            const r2 = 80
            const x1 = Math.cos(angle) * r1
            const y1 = Math.sin(angle) * r1
            const x2 = Math.cos(angle) * r2
            const y2 = Math.sin(angle) * r2
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#fef9c3"
                strokeWidth="1.3"
              />
            )
          })}

          {/* B-логотип */}
          <path
            d="
              M -16 -52
              L 10 -52
              C 26 -52, 38 -42, 38 -28
              C 38 -18, 32 -10, 22 -7
              C 32 -4, 40 4, 40 18
              C 40 34, 28 46, 10 46
              L -16 46 Z
            "
            fill="#fefce8"
          />
          <rect
            x="-30"
            y="-44"
            width="32"
            height="8"
            rx="3"
            fill="#fefce8"
          />
          <rect
            x="-30"
            y="34"
            width="32"
            height="8"
            rx="3"
            fill="#fefce8"
          />
        </svg>
      )

    /* ---------- ETH ---------- */
    case 'eth':
      return (
        <svg
          viewBox="-110 -110 220 220"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="eth-gold"
              cx="20%"
              cy="20%"
              r="80%"
            >
              <stop
                offset="0%"
                stopColor="#fef3c7"
              />
              <stop
                offset="40%"
                stopColor="#facc15"
              />
              <stop
                offset="100%"
                stopColor="#b45309"
              />
            </radialGradient>
          </defs>
          <circle
            cx="0"
            cy="0"
            r="100"
            fill="url(#eth-gold)"
          />
          <circle
            cx="0"
            cy="0"
            r="82"
            fill="#451a03"
            opacity="0.18"
          />
          {/* орбиты */}
          <circle
            cx="0"
            cy="0"
            r="70"
            fill="none"
            stroke="#fef9c3"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />
          {/* ромб ETH */}
          <polygon
            points="0,-64 36,0 0,26 -36,0"
            fill="#fefce8"
          />
          <polygon
            points="0,32 36,4 0,68 -36,4"
            fill="#fef3c7"
          />
        </svg>
      )

    /* ---------- LTC ---------- */
    case 'ltc':
      return (
        <svg
          viewBox="-110 -110 220 220"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="ltc-silver"
              cx="30%"
              cy="20%"
              r="80%"
            >
              <stop
                offset="0%"
                stopColor="#e5e7eb"
              />
              <stop
                offset="40%"
                stopColor="#cbd5f5"
              />
              <stop
                offset="100%"
                stopColor="#4b5563"
              />
            </radialGradient>
          </defs>
          <circle
            cx="0"
            cy="0"
            r="100"
            fill="url(#ltc-silver)"
          />
          <circle
            cx="0"
            cy="0"
            r="82"
            fill="#020617"
            opacity="0.18"
          />

          {/* лёгкие «дорожки» */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2
            const r = 72
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.4"
                fill="#e5e7eb"
                opacity="0.8"
              />
            )
          })}

          {/* L-логотип */}
          <path
            d="
              M -14 -50
              L 10 -50
              L 0 -10
              L 26 -18
              L 20 8
              L -4 16
              L -12 46
              L -36 46
            "
            fill="#f9fafb"
          />
        </svg>
      )

    /* ---------- DeFi-ТЕРМИНАЛ ---------- */
    case 'defiTerminal':
      return (
        <svg
          viewBox="-140 -100 280 200"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="dt-body"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#0f172a"
              />
              <stop
                offset="100%"
                stopColor="#020617"
              />
            </linearGradient>
          </defs>

          <rect
            x="-120"
            y="-70"
            width="240"
            height="120"
            rx="18"
            ry="18"
            fill="url(#dt-body)"
            stroke="#38bdf8"
            strokeWidth="2.4"
          />
          <rect
            x="-108"
            y="-58"
            width="216"
            height="96"
            rx="12"
            ry="12"
            fill="#020617"
          />

          {/* свечи */}
          {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map(
            (x, idx) => {
              const h = 20 + (idx % 4) * 8
              const up = idx % 2 === 0
              return (
                <g key={x}>
                  <line
                    x1={x}
                    x2={x}
                    y1="-40"
                    y2="20"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <rect
                    x={x - 3}
                    y={up ? -10 - h : -10}
                    width="6"
                    height={h}
                    rx="2"
                    fill={up ? '#22c55e' : '#ef4444'}
                  />
                </g>
              )
            }
          )}

          {/* нижняя панель */}
          <rect
            x="-120"
            y="52"
            width="240"
            height="18"
            rx="9"
            ry="9"
            fill="#020617"
            stroke="#38bdf8"
            strokeWidth="2"
          />
        </svg>
      )

    /* ---------- СФЕРА СЕТИ ---------- */
    case 'networkSphere':
      return (
        <svg
          viewBox="-140 -90 280 180"
          role="presentation"
        >
          <defs>
            <radialGradient
              id="ns-core"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                stopColor="#e0f2fe"
              />
              <stop
                offset="40%"
                stopColor="#38bdf8"
              />
              <stop
                offset="100%"
                stopColor="#0f172a"
              />
            </radialGradient>
          </defs>
          <circle
            cx="0"
            cy="0"
            r="70"
            fill="url(#ns-core)"
            opacity="0.8"
          />
          {/* связи */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2
            const r = 60
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.4"
                fill="#e0f2fe"
              />
            )
          })}
          {Array.from({ length: 18 }).map((_, i) => {
            const a1 = (i / 18) * Math.PI * 2
            const a2 =
              (((i * 7) % 18) / 18) *
              Math.PI *
              2
            const r1 = 60
            const r2 = 60
            const x1 = Math.cos(a1) * r1
            const y1 = Math.sin(a1) * r1
            const x2 = Math.cos(a2) * r2
            const y2 = Math.sin(a2) * r2
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#e0f2fe"
                strokeWidth="0.8"
                opacity="0.6"
              />
            )
          })}
        </svg>
      )

    /* ---------- ЦЕПИ ---------- */
    case 'chains':
      return (
        <svg
          viewBox="-160 -80 320 160"
          role="presentation"
        >
          <defs>
            <linearGradient
              id="chain-metal"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#d1d5db"
              />
              <stop
                offset="50%"
                stopColor="#9ca3af"
              />
              <stop
                offset="100%"
                stopColor="#f97316"
              />
            </linearGradient>
          </defs>

          {[-80, -20, 40, 100].map(
            (x, idx) => (
              <g
                key={x}
                transform={`translate(${x},0) rotate(${
                  idx % 2 === 0 ? -20 : 20
                })`}
              >
                <rect
                  x="-30"
                  y="-18"
                  width="60"
                  height="36"
                  rx="18"
                  ry="18"
                  fill="none"
                  stroke="url(#chain-metal)"
                  strokeWidth="5"
                />
                <rect
                  x="-6"
                  y="-18"
                  width="12"
                  height="36"
                  rx="6"
                  ry="6"
                  fill="#020617"
                  opacity="0.9"
                />
              </g>
            )
          )}
        </svg>
      )

    /* ---------- ДЕКОР: КНОПКИ ---------- */
    case 'buttons':
      return (
        <svg
          viewBox="-80 -80 160 160"
          role="presentation"
        >
          <g opacity="0.9">
            <circle
              cx="-30"
              cy="-20"
              r="12"
              fill="#fb7185"
            />
            <circle
              cx="30"
              cy="-18"
              r="10"
              fill="#4ade80"
            />
            <circle
              cx="-10"
              cy="18"
              r="9"
              fill="#38bdf8"
            />
            <circle
              cx="36"
              cy="24"
              r="8"
              fill="#facc15"
            />
          </g>
        </svg>
      )

    /* ---------- ДЕКОР: ТРЕУГОЛЬНИКИ ---------- */
    case 'triangles':
      return (
        <svg
          viewBox="-80 -80 160 160"
          role="presentation"
        >
          <polygon
            points="-40,0 -4,-40 32,0"
            fill="none"
            stroke="#a855f7"
            strokeWidth="4"
          />
          <polygon
            points="-10,18 20,50 -40,50"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
          />
        </svg>
      )

    /* ---------- ДЕКОР: КВАДРАТЫ ---------- */
    case 'squares':
      return (
        <svg
          viewBox="-80 -80 160 160"
          role="presentation"
        >
          <rect
            x="-40"
            y="-40"
            width="32"
            height="32"
            rx="8"
            ry="8"
            fill="none"
            stroke="#f472b6"
            strokeWidth="4"
          />
          <rect
            x="8"
            y="-24"
            width="40"
            height="40"
            rx="10"
            ry="10"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <rect
            x="-18"
            y="16"
            width="36"
            height="36"
            rx="12"
            ry="12"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
          />
        </svg>
      )

    /* ---------- ДЕКОР: ТОЧКИ ---------- */
    case 'dots':
    default:
      return (
        <svg
          viewBox="-80 -80 160 160"
          role="presentation"
        >
          {Array.from({ length: 26 }).map(
            (_, i) => {
              const angle =
                (i / 26) *
                Math.PI *
                2
              const r = 10 + (i % 6) * 9
              const x = Math.cos(angle) * r
              const y = Math.sin(angle) * r
              const colors = [
                '#7dd3fc',
                '#f9a8d4',
                '#facc15',
                '#4ade80',
              ]
              const fill =
                colors[i % colors.length]
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i % 3 === 0 ? 2.8 : 1.9}
                  fill={fill}
                  opacity="0.9"
                />
              )
            }
          )}
        </svg>
      )
  }
}
