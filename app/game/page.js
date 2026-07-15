// app/game/page.js
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '../../components/i18n'
import { openAuthFlow } from '../forum/shared/utils/openAuth'
import {
  getStoredWalletSession,
  hydrateLegacyAuth,
  verifyStoredWalletSession,
} from '../../lib/walletSessionClient'
import HomeBetweenBlocksAd from '../ads'


function readCookieValue(name) {
  try {
    if (typeof document === 'undefined') return ''
    const encoded = encodeURIComponent(name)
    const parts = String(document.cookie || '').split(';')
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.startsWith(`${encoded}=`)) {
        return decodeURIComponent(trimmed.slice(encoded.length + 1))
      }
      if (trimmed.startsWith(`${name}=`)) {
        return decodeURIComponent(trimmed.slice(name.length + 1))
      }
    }
  } catch {}
  return ''
}

function storageGet(kind, key) {
  try {
    if (typeof window === 'undefined') return ''
    const store = kind === 'session' ? window.sessionStorage : window.localStorage
    return store?.getItem(key) || ''
  } catch {
    return ''
  }
}

function readMetaStudioAuth() {
  try {
    if (typeof window === 'undefined') return null
    if (
      window.__QL7_AUTH_LOGGED_OUT__ ||
      storageGet('local', 'ql7_auth_logout_lock') ||
      storageGet('session', 'ql7_auth_logout_lock')
    ) {
      return null
    }

    const walletSessionAddress = storageGet('local', 'ql7_wallet_address')
    const walletSessionAccount = storageGet('local', 'ql7_wallet_account_id') || walletSessionAddress
    const walletSessionToken = storageGet('local', 'ql7_wallet_session_token')
    const globalAccount =
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ID__ ||
      window.__QL7_UID__ ||
      window.__FORUM_USER__ ||
      window.wallet ||
      window.account ||
      ''
    const accountId = String(
      globalAccount ||
        storageGet('local', 'asherId') ||
        storageGet('local', 'ql7_uid') ||
        storageGet('local', 'forum_user_id') ||
        storageGet('local', 'ql7_account') ||
        storageGet('local', 'account') ||
        storageGet('local', 'wallet') ||
        walletSessionAccount ||
        readCookieValue('asherId') ||
        ''
    ).trim()
    if (!accountId) return null

    return {
      accountId,
      asherId: storageGet('local', 'asherId') || accountId,
      ql7Uid: storageGet('local', 'ql7_uid') || walletSessionAccount,
      forumUserId: storageGet('local', 'forum_user_id'),
      wallet: storageGet('local', 'wallet') || storageGet('local', 'account') || walletSessionAddress || accountId,
      ql7Account: storageGet('local', 'ql7_account') || walletSessionAccount,
      walletSession: Boolean(walletSessionToken),
      vip: storageGet('local', 'ql7_vip') || storageGet('local', 'ai_quota_vip'),
      lang: storageGet('local', 'ql7_lang'),
    }
  } catch {
    return null
  }
}

async function resolveMetaStudioAuth() {
  const direct = readMetaStudioAuth()
  if (direct?.accountId) return direct

  try {
    const stored = getStoredWalletSession()
    const storedAccount = String(stored?.accountId || stored?.walletAddress || '').trim()
    if (!storedAccount) return readMetaStudioAuth()

    if (stored?.token) {
      const verified = await verifyStoredWalletSession()
      if (verified?.authorized && (verified?.accountId || verified?.walletAddress)) {
        return readMetaStudioAuth() || {
          accountId: String(verified.accountId || verified.walletAddress).trim(),
          asherId: String(verified.accountId || verified.walletAddress).trim(),
          ql7Uid: String(verified.accountId || verified.walletAddress).trim(),
          wallet: String(verified.walletAddress || verified.accountId).trim(),
          ql7Account: String(verified.accountId || verified.walletAddress).trim(),
          walletSession: true,
          vip: storageGet('local', 'ql7_vip') || storageGet('local', 'ai_quota_vip'),
          lang: storageGet('local', 'ql7_lang'),
        }
      }
    } else {
      hydrateLegacyAuth({
        accountId: storedAccount,
        walletAddress: stored.walletAddress || storedAccount,
        provider: stored.provider || 'wallet',
      })
      return readMetaStudioAuth()
    }
  } catch (error) {
    console.warn('[metastudio] auth resolve failed', error)
  }

  return readMetaStudioAuth()
}

async function registerMetaStudioInterest(authData) {
  const accountId = String(authData?.accountId || '').trim()
  if (!accountId) throw new Error('missing_account')

  const response = await fetch('/api/metastudio/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forum-user-id': accountId,
    },
    body: JSON.stringify({
      source: 'game-page',
      ...authData,
      accountId,
    }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP_${response.status}`)
  }
  return data
}

export default function GamePage() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [metaStudioOpen, setMetaStudioOpen] = useState(false)
  const [metaStudioStatus, setMetaStudioStatus] = useState('idle')
  const [metaStudioNotice, setMetaStudioNotice] = useState('')

  // бесшовная маркиза как на главной
  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  useEffect(() => {
    setMounted(true)
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!metaStudioOpen) return undefined
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && metaStudioStatus !== 'registering') {
        setMetaStudioOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [metaStudioOpen, metaStudioStatus])

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
  const metaStudioDescription = String(t('metastudio_description') || '')
  const metaStudioParagraphs = metaStudioDescription
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)

  const openMetaStudio = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setMetaStudioStatus('idle')
    setMetaStudioNotice('')
    setMetaStudioOpen(true)
  }, [])

  const closeMetaStudio = useCallback(() => {
    if (metaStudioStatus === 'registering') return
    setMetaStudioOpen(false)
  }, [metaStudioStatus])

  const completeMetaStudioRegistration = useCallback(async (authData) => {
    setMetaStudioOpen(true)
    setMetaStudioStatus('registering')
    setMetaStudioNotice('')
    try {
      await registerMetaStudioInterest(authData)
      setMetaStudioStatus('success')
      setMetaStudioNotice(t('metastudio_success_body'))
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setMetaStudioOpen(false)
      }, 5000)
    } catch {
      setMetaStudioStatus('error')
      setMetaStudioNotice(t('metastudio_error'))
    }
  }, [t])

  const handleMetaStudioRegister = useCallback(async () => {
    if (metaStudioStatus === 'registering') return
    const currentAuth = await resolveMetaStudioAuth()
    if (currentAuth?.accountId) {
      await completeMetaStudioRegistration(currentAuth)
      return
    }

    setMetaStudioOpen(false)
    const authAfterFlow = await openAuthFlow({
      readAuth: readMetaStudioAuth,
      timeoutMs: 30000,
    })
    const resolvedAfterFlow = authAfterFlow?.accountId ? authAfterFlow : await resolveMetaStudioAuth()
    if (resolvedAfterFlow?.accountId) {
      await completeMetaStudioRegistration(resolvedAfterFlow)
      return
    }
    setMetaStudioOpen(true)
    setMetaStudioStatus('error')
    setMetaStudioNotice(t('metastudio_auth_required'))
  }, [completeMetaStudioRegistration, metaStudioStatus, t])

  const metaStudioPortal = mounted && metaStudioOpen
    ? createPortal(
        <div className="metastudioOverlay" role="presentation">
          <section
            className="metastudioShell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="metastudio-title"
          >
            <button
              type="button"
              className="metastudioClose"
              onClick={closeMetaStudio}
              aria-label={t('metastudio_close_aria')}
              title={t('metastudio_close_aria')}
              disabled={metaStudioStatus === 'registering'}
            >
              &times;
            </button>

            <header className="metastudioHeader">
              <div className="metastudioTitleSvg" id="metastudio-title" aria-label="MetaStudio">
                <svg viewBox="0 0 420 96" role="img" aria-hidden="true">
                  <defs>
                    <linearGradient id="metastudioTitleGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#83f7ff" />
                      <stop offset="34%" stopColor="#c8b7ff" />
                      <stop offset="68%" stopColor="#f8e497" />
                      <stop offset="100%" stopColor="#67ffe1" />
                    </linearGradient>
                    <filter id="metastudioTitleGlow" x="-30%" y="-40%" width="160%" height="180%">
                      <feGaussianBlur stdDeviation="3.2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <text
                    x="210"
                    y="60"
                    textAnchor="middle"
                    className="metastudioTitleText"
                    fill="url(#metastudioTitleGradient)"
                    filter="url(#metastudioTitleGlow)"
                  >
                    MetaStudio
                  </text>
                  <path className="metastudioTitleRail" d="M72 73 C150 88 270 88 348 73" />
                  <path className="metastudioTitleComet" d="M88 76 C165 60 248 60 336 76" />
                </svg>
              </div>
              <span className="metastudioSoonBadge">{t('metastudio_soon')}</span>
            </header>

            <div className="metastudioPulseRail" aria-hidden="true" />

            <div className="metastudioBody">
              {metaStudioStatus === 'success' ? (
                <div className="metastudioSuccess" aria-live="polite">
                  <h3>{t('metastudio_success_title')}</h3>
                  <p>{metaStudioNotice}</p>
                </div>
              ) : (
                <>
                  <div className="metastudioTextFlow">
                    {metaStudioParagraphs.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 16)}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {metaStudioNotice ? (
                    <div className="metastudioNotice" aria-live="polite">
                      {metaStudioNotice}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <footer className="metastudioFooter">
              <button
                type="button"
                className="metastudioRegisterBtn"
                onClick={handleMetaStudioRegister}
                disabled={metaStudioStatus === 'registering' || metaStudioStatus === 'success'}
              >
                <span>{metaStudioStatus === 'registering' ? t('metastudio_registering') : t('metastudio_register')}</span>
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {metaStudioPortal}
      {/* ВНЕШНЯЯ ОБЁРТКА С НАСТРАИВАЕМЫМИ ОТСТУПАМИ */}
      <main className="game-page-root">
        <section className="panel game-panel">
          {/* РЕСПОНСИВНОЕ ПОЛЕ ИЗ SVG-ГЛИФОВ ПОД ТЕКСТОМ */}
          <ResponsiveGlyphField />

          <div className="game-panel-inner">
    {/*        <h1 className="game-title neon-title">
              <span className="neon-title-core">
                {t('game_title')}
              </span>
              <span
                className="neon-title-glow"
                aria-hidden="true"
              >
                {t('game_title')}
              </span>
            </h1>*/}

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
  <button
    type="button"
    className="gameMetaStudioCta"
    onClick={openMetaStudio}
    aria-label={t('metastudio_open_aria')}
    title={t('metastudio_open_aria')}
  >
    <svg className="gameMetaStudioSvg" viewBox="0 0 250 64" aria-hidden="true">
      <text className="gameMetaWord gameMetaWordQuantum" x="125" y="41" textAnchor="middle">Quantum</text>
      <text className="gameMetaWord gameMetaWordMeta" x="125" y="41" textAnchor="middle">Meta</text>
      <text className="gameMetaWord gameMetaWordStudio" x="125" y="41" textAnchor="middle">Studio</text>
      <path className="gameMetaStudioArc gameMetaStudioArcA" d="M32 47 C78 59 172 59 218 47" />
      <path className="gameMetaStudioArc gameMetaStudioArcB" d="M44 17 C92 7 166 7 207 17" />
      <g className="gameMetaStudioBits">
        <circle cx="52" cy="21" r="1.7" />
        <circle cx="76" cy="50" r="1.35" />
        <circle cx="198" cy="20" r="1.45" />
        <circle cx="218" cy="36" r="1.2" />
        <circle cx="166" cy="52" r="1.25" />
      </g>
    </svg>
  </button>
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
                #fffb01ff,
                #fc7c04ff,
                #00fff2ff,
                #f97316,
                #facc15
              );
              background-size: 220% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: titleGradient 10s
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
                rgba(56, 191, 248, 0.36),
                rgba(129, 141, 248, 0.34),
                rgba(16, 185, 129, 0.32),
                rgba(244, 114, 181, 0.32)
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
          <style jsx global>{`
            .gameMetaStudioCta {
              position: absolute;
              left: 50%;
              bottom: clamp(14px, 3.2vw, 34px);
              z-index: 4;
              width: min(212px, calc(100% - 34px));
              height: 46px;
              transform: translateX(-50%);
              border: 1px solid rgba(132, 244, 255, 0.72);
              border-radius: 999px;
              cursor: pointer;
              overflow: hidden;
              isolation: isolate;
              background:
                radial-gradient(circle at 18% 35%, rgba(70, 226, 255, 0.22), transparent 34%),
                rgba(3, 16, 28, 0.90);
              box-shadow:
                0 12px 30px rgba(0, 0, 0, 0.58),
                0 0 20px rgba(68, 230, 255, 0.28),
                inset 0 0 0 1px rgba(255, 255, 255, 0.09);
            }

            .gameMetaStudioCta::before {
              content: "";
              position: absolute;
              inset: 0;
              z-index: -1;
              background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.24) 46%, transparent 62%);
              transform: translateX(-120%);
              animation: gameMetaButtonSweep 5.6s ease-in-out infinite;
            }

            .gameMetaStudioCta::after {
              content: "";
              position: absolute;
              inset: 7px;
              z-index: -1;
              border-radius: inherit;
              background:
                linear-gradient(rgba(125, 246, 255, 0.16) 1px, transparent 1px),
                linear-gradient(90deg, rgba(247, 226, 140, 0.12) 1px, transparent 1px);
              background-size: 14px 14px;
              mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
              opacity: 0.36;
            }

            .gameMetaStudioCta:hover,
            .gameMetaStudioCta:focus-visible {
              border-color: rgba(249, 226, 134, 0.9);
              box-shadow:
                0 18px 42px rgba(0, 0, 0, 0.66),
                0 0 30px rgba(68, 230, 255, 0.48),
                0 0 26px rgba(248, 226, 140, 0.34),
                inset 0 0 0 1px rgba(255, 255, 255, 0.13);
              outline: none;
            }

            .gameMetaStudioSvg {
              width: 100%;
              height: 100%;
              display: block;
            }

            .gameMetaWord {
              font-family: inherit;
              font-size: 30px;
              font-weight: 950;
              letter-spacing: 0.02em;
              stroke: rgba(214, 253, 255, 0.62);
              stroke-width: 0.8;
              filter: drop-shadow(0 0 7px rgba(114, 245, 255, 0.74));
              opacity: 0;
              transform-box: fill-box;
              transform-origin: center;
              animation: gameMetaWordCycle 7.2s ease-in-out infinite;
            }

            .gameMetaWordQuantum {
              fill: #eefbff;
            }

            .gameMetaWordMeta {
              fill: #7ff6ff;
              animation-delay: 2.4s;
            }

            .gameMetaWordStudio {
              fill: #f6dd82;
              animation-delay: 4.8s;
            }

            .gameMetaStudioArc {
              fill: none;
              stroke: rgba(127, 246, 255, 0.58);
              stroke-width: 2;
              stroke-linecap: round;
              stroke-dasharray: 52 150;
              animation: gameMetaArcFlow 3.8s ease-in-out infinite;
            }

            .gameMetaStudioArcB {
              stroke: rgba(249, 226, 140, 0.54);
              animation-delay: -1.4s;
            }

            .gameMetaStudioBits circle {
              fill: #f9e68d;
              filter: drop-shadow(0 0 8px rgba(249, 226, 140, 0.85));
              animation: gameMetaBits 2.8s ease-in-out infinite;
            }

            .gameMetaStudioBits circle:nth-child(2),
            .gameMetaStudioBits circle:nth-child(5) {
              fill: #7df6ff;
              animation-delay: -0.9s;
            }

            .gameMetaStudioBits circle:nth-child(3) {
              fill: #c8b7ff;
              animation-delay: -1.6s;
            }

            .metastudioOverlay {
              position: fixed;
              inset: 0;
              z-index: 2147482450;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
              background:
                radial-gradient(circle at 50% 24%, rgba(56, 189, 248, 0.16), transparent 38%),
                radial-gradient(circle at 72% 64%, rgba(248, 226, 140, 0.13), transparent 34%),
                rgba(2, 5, 14, 0.74);
              backdrop-filter: blur(14px);
            }

            .metastudioShell {
              position: relative;
              width: calc(100vw - 32px) !important;
              max-width: 620px !important;
              height: min(760px, calc(100dvh - 48px)) !important;
              max-height: 90vh !important;
              margin-left: auto !important;
              margin-right: auto !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              display: grid;
              grid-template-rows: auto auto minmax(0, 1fr) auto;
              overflow: hidden;
              border-radius: 26px;
              border: 1px solid rgba(109, 229, 255, 0.48);
              background:
                linear-gradient(115deg, rgba(12, 52, 70, 0.62), rgba(3, 9, 22, 0.94) 42%, rgba(70, 58, 14, 0.48)),
                radial-gradient(circle at 18% 12%, rgba(110, 241, 255, 0.24), transparent 38%),
                radial-gradient(circle at 84% 12%, rgba(249, 226, 140, 0.20), transparent 34%);
              box-shadow:
                0 24px 72px rgba(0, 0, 0, 0.72),
                0 0 46px rgba(64, 226, 255, 0.24),
                inset 0 0 0 1px rgba(255, 255, 255, 0.07);
            }

            .metastudioShell::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                linear-gradient(rgba(116, 245, 255, 0.065) 1px, transparent 1px),
                linear-gradient(90deg, rgba(249, 226, 140, 0.052) 1px, transparent 1px);
              background-size: 31px 31px;
              mask-image: radial-gradient(circle at 50% 18%, #000 0%, transparent 78%);
              opacity: 0.72;
            }

            .metastudioShell::after {
              content: "";
              position: absolute;
              inset: 1px;
              pointer-events: none;
              border-radius: inherit;
              background:
                linear-gradient(90deg, rgba(103, 232, 249, 0.18), transparent 22%, transparent 78%, rgba(250, 204, 21, 0.15)),
                linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 26%);
              mix-blend-mode: screen;
              opacity: 0.76;
            }

            .metastudioClose {
              position: absolute;
              top: 18px;
              right: 18px;
              z-index: 5;
              width: 44px;
              height: 44px;
              border-radius: 999px;
              border: 1px solid rgba(125, 246, 255, 0.54);
              color: #f2fbff;
              background: rgba(3, 15, 29, 0.82);
              box-shadow: 0 0 20px rgba(80, 232, 255, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
              font-size: 28px;
              line-height: 1;
              cursor: pointer;
            }

            .metastudioClose:disabled {
              cursor: default;
              opacity: 0.46;
            }

            .metastudioHeader {
              position: relative;
              z-index: 1;
              display: grid;
              place-items: center;
              padding: 38px 70px 14px;
              gap: 6px;
            }

            .metastudioHeader::before,
            .metastudioHeader::after {
              content: "";
              position: absolute;
              left: 22px;
              right: 22px;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.26), rgba(250, 204, 21, 0.18), transparent);
              pointer-events: none;
            }

            .metastudioHeader::before {
              top: 16px;
            }

            .metastudioHeader::after {
              bottom: 2px;
            }

            .metastudioTitleSvg {
              width: min(390px, 100%);
              height: 92px;
            }

            .metastudioTitleSvg svg {
              width: 100%;
              height: 100%;
              display: block;
            }

            .metastudioTitleText {
              font-size: 48px;
              font-weight: 950;
              letter-spacing: 0.02em;
              paint-order: stroke;
              stroke: rgba(4, 19, 32, 0.74);
              stroke-width: 4px;
            }

            .metastudioTitleRail,
            .metastudioTitleComet {
              fill: none;
              stroke-linecap: round;
              stroke-width: 2.4;
              stroke-dasharray: 74 170;
              animation: metastudioRailFlow 5.4s ease-in-out infinite;
            }

            .metastudioTitleRail {
              stroke: rgba(125, 246, 255, 0.64);
            }

            .metastudioTitleComet {
              stroke: rgba(249, 226, 140, 0.70);
              animation-delay: -2.2s;
            }

            .metastudioSoonBadge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 76px;
              min-height: 28px;
              padding: 4px 14px;
              border-radius: 999px;
              border: 1px solid rgba(255, 92, 124, 0.72);
              color: #ff6e86;
              background: linear-gradient(90deg, rgba(70, 8, 23, 0.86), rgba(25, 6, 20, 0.88));
              box-shadow: 0 0 18px rgba(255, 72, 110, 0.24);
              font-size: 0.78rem;
              font-weight: 950;
              text-transform: uppercase;
            }

            .metastudioPulseRail {
              position: relative;
              z-index: 1;
              height: 1px;
              margin: 0 28px;
              background: linear-gradient(90deg, transparent, rgba(111, 242, 255, 0.64), rgba(249, 226, 140, 0.74), transparent);
              overflow: hidden;
            }

            .metastudioPulseRail::after {
              content: "";
              position: absolute;
              inset: -2px 0;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.88), transparent);
              transform: translateX(-100%);
              animation: metastudioRailSweep 3.8s ease-in-out infinite;
            }

            .metastudioBody {
              position: relative;
              z-index: 1;
              min-height: 0;
              margin: 18px 22px 0;
              padding: 16px;
              overflow: auto;
              overscroll-behavior: contain;
              border-radius: 22px;
              border: 1px solid rgba(105, 222, 255, 0.34);
              background:
                linear-gradient(140deg, rgba(4, 15, 29, 0.92), rgba(11, 17, 36, 0.90)),
                radial-gradient(circle at 12% 10%, rgba(78, 223, 255, 0.14), transparent 42%);
              box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.045);
              scrollbar-width: thin;
              scrollbar-color: rgba(112, 233, 255, 0.82) rgba(6, 18, 32, 0.8);
            }

            .metastudioBody::before,
            .metastudioBody::after {
              content: "";
              position: sticky;
              display: block;
              height: 1px;
              z-index: 2;
              pointer-events: none;
              background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.42), rgba(250, 204, 21, 0.28), transparent);
              box-shadow: 0 0 16px rgba(34, 211, 238, 0.12);
            }

            .metastudioBody::before {
              top: -16px;
              margin: -2px 6px 14px;
            }

            .metastudioBody::after {
              bottom: -16px;
              margin: 14px 6px -2px;
            }

            .metastudioTextFlow {
              display: grid;
              gap: 13px;
            }

            .metastudioTextFlow p,
            .metastudioSuccess p,
            .metastudioNotice {
              margin: 0;
              color: #e9f8ff;
              font-size: 0.95rem;
              line-height: 1.62;
              white-space: pre-wrap;
              text-shadow: 0 1px 8px rgba(0, 0, 0, 0.62);
            }

            .metastudioTextFlow p {
              position: relative;
              padding: 13px 14px 13px 17px;
              border-radius: 16px;
              border: 1px solid rgba(119, 230, 255, 0.18);
              background:
                linear-gradient(90deg, rgba(93, 233, 255, 0.12), transparent 1px),
                linear-gradient(105deg, rgba(13, 32, 52, 0.62), rgba(7, 12, 27, 0.72));
              box-shadow:
                0 8px 22px rgba(0, 0, 0, 0.20),
                inset 0 0 0 1px rgba(255, 255, 255, 0.035);
            }

            .metastudioTextFlow p::before {
              content: "";
              position: absolute;
              top: -1px;
              left: 18px;
              right: 18px;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(249, 226, 140, 0.62), rgba(125, 246, 255, 0.56), transparent);
            }

            .metastudioSuccess {
              min-height: 100%;
              display: grid;
              place-content: center;
              gap: 12px;
              text-align: center;
              padding: 22px;
            }

            .metastudioSuccess::before,
            .metastudioSuccess::after {
              content: "";
              width: min(310px, 72vw);
              height: 1px;
              justify-self: center;
              background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.48), rgba(250, 204, 21, 0.34), transparent);
              box-shadow: 0 0 18px rgba(34, 211, 238, 0.16);
            }

            .metastudioSuccess h3 {
              margin: 0;
              color: #f9e68d;
              font-size: clamp(1.35rem, 3vw, 2rem);
              font-weight: 950;
              text-shadow: 0 0 20px rgba(249, 226, 140, 0.32);
            }

            .metastudioNotice {
              margin-top: 14px;
              padding: 12px 14px;
              border-radius: 16px;
              border: 1px solid rgba(249, 226, 140, 0.38);
              color: #fff0b6;
              background: rgba(72, 52, 10, 0.26);
              text-align: center;
            }

            .metastudioFooter {
              position: relative;
              z-index: 1;
              display: flex;
              justify-content: center;
              padding: 16px 22px 24px;
            }

            .metastudioRegisterBtn {
              min-width: min(280px, 100%);
              min-height: 48px;
              padding: 0 24px;
              border-radius: 999px;
              border: 1px solid rgba(249, 226, 140, 0.78);
              color: #fff7d0;
              cursor: pointer;
              background:
                radial-gradient(circle at 24% 20%, rgba(125, 246, 255, 0.24), transparent 38%),
                linear-gradient(105deg, rgba(14, 92, 89, 0.82), rgba(43, 31, 82, 0.92), rgba(83, 58, 18, 0.84));
              box-shadow:
                0 0 24px rgba(249, 226, 140, 0.28),
                0 12px 32px rgba(0, 0, 0, 0.42),
                inset 0 0 0 1px rgba(255, 255, 255, 0.09);
              font-weight: 950;
              font-size: 0.96rem;
            }

            .metastudioRegisterBtn:disabled {
              cursor: default;
              opacity: 0.62;
            }

            @keyframes gameMetaButtonSweep {
              0%, 42% { transform: translateX(-125%); }
              70%, 100% { transform: translateX(125%); }
            }

            @keyframes gameMetaWordCycle {
              0% { opacity: 0; transform: translateY(14px) scale(0.88); }
              10% { opacity: 1; transform: translateY(0) scale(1); }
              28% { opacity: 1; transform: translateY(0) scale(1); }
              38% { opacity: 0; transform: translateY(-14px) scale(1.08); }
              100% { opacity: 0; transform: translateY(-14px) scale(1.08); }
            }

            @keyframes gameMetaArcFlow {
              0% { stroke-dashoffset: 130; opacity: 0.35; }
              50% { opacity: 1; }
              100% { stroke-dashoffset: -120; opacity: 0.35; }
            }

            @keyframes gameMetaBits {
              0%, 100% { opacity: 0.26; transform: scale(0.74); }
              50% { opacity: 1; transform: scale(1.28); }
            }

            @keyframes metastudioRailFlow {
              0% { stroke-dashoffset: 150; opacity: 0.52; }
              50% { opacity: 1; }
              100% { stroke-dashoffset: -150; opacity: 0.52; }
            }

            @keyframes metastudioRailSweep {
              0%, 32% { transform: translateX(-100%); }
              72%, 100% { transform: translateX(100%); }
            }

            @media (max-width: 760px) {
              .metastudioShell {
                width: min(94vw, 620px) !important;
                max-width: 620px !important;
                height: min(780px, calc(100vh - 32px)) !important;
                height: min(780px, calc(100dvh - 32px)) !important;
              }
            }

            @media (max-width: 640px) {
              .gameMetaStudioCta {
                height: 42px;
                width: min(190px, calc(100% - 28px));
                bottom: 10px;
              }

              .gameMetaWord {
                font-size: 28px;
              }

              .metastudioOverlay {
                --metastudio-mobile-top-offset: 115px;
                align-items: flex-start !important;
                overflow: hidden !important;
                padding:
                  max(var(--metastudio-mobile-top-offset), env(safe-area-inset-top))
                  8px
                  max(12px, env(safe-area-inset-bottom)) !important;
              }

              .metastudioShell {
                width: calc(100vw - 16px) !important;
                max-width: none !important;
                height: min(720px, calc(100vh - var(--metastudio-mobile-top-offset, 56px) - 20px)) !important;
                height: min(720px, calc(100dvh - var(--metastudio-mobile-top-offset, 56px) - 20px)) !important;
                min-height: min(720px, calc(100dvh - var(--metastudio-mobile-top-offset, 56px) - 20px)) !important;
                max-height: min(720px, calc(100dvh - var(--metastudio-mobile-top-offset, 56px) - 20px)) !important;
                border-radius: 22px;
              }

              .metastudioHeader {
                padding: 38px 58px 10px;
              }

              .metastudioTitleText {
                font-size: 42px;
              }

              .metastudioBody {
                margin: 14px 12px 0;
                padding: 12px;
                border-radius: 18px;
              }

              .metastudioFooter {
                padding: 13px 14px 18px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .gameMetaStudioCta::before,
              .gameMetaWord,
              .gameMetaStudioArc,
              .gameMetaStudioBits circle,
              .metastudioTitleRail,
              .metastudioTitleComet,
              .metastudioPulseRail::after {
                animation: none !important;
              }

              .gameMetaWordStudio {
                opacity: 1;
                transform: none;
              }
            }
          `}</style>
        </section>
      </main>
       <HomeBetweenBlocksAd
         slotKey="ads_between_2_3"
         slotKind="ads_between"
       />
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

 
