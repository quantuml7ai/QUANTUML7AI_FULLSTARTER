'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from './i18n'

const DISMISSED_KEY = 'ql7_android_app_prompt_dismissed'
const ANDROID_APP_OPEN_STAGE_PARAM = 'ql7_app_open_stage'
const ANDROID_APP_OPEN_DONE_PARAM = 'ql7_app_open_done'
const ANDROID_APP_OPEN_TS_PARAM = 'ql7_app_open_ts'
const APK_URL = '/android/Quantum%20L7%20AI%20release%201.0.7.apk'
const APP_TARGETS = [
  {
    packageName: 'com.quantuml7ai.app',
    componentName: 'com.quantuml7ai.app/com.quantuml7ai.app.QuantumLauncherActivity',
  },
  {
    packageName: 'com.quantuml7ai.app.debug',
    componentName: 'com.quantuml7ai.app.debug/com.quantuml7ai.app.QuantumLauncherActivity',
  },
]

function isAndroidBrowser() {
  try {
    const userAgent = String(navigator.userAgent || '')
    const android = /Android/i.test(userAgent)
    const nativeShell = /QuantumL7AIApp\//i.test(userAgent)
    const standalone = ['standalone', 'fullscreen', 'minimal-ui']
      .some((mode) => window.matchMedia?.(`(display-mode: ${mode})`)?.matches)
    const twa = String(document.referrer || '').startsWith('android-app://')
    return android && !nativeShell && !standalone && !twa
  } catch {
    return false
  }
}

function getCleanAndroidAppUrl() {
  const current = new URL(window.location.href)
  current.searchParams.delete(ANDROID_APP_OPEN_STAGE_PARAM)
  current.searchParams.delete(ANDROID_APP_OPEN_DONE_PARAM)
  current.searchParams.delete(ANDROID_APP_OPEN_TS_PARAM)
  return current
}

function readAndroidAppOpenStage() {
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get(ANDROID_APP_OPEN_DONE_PARAM) === '1') return -1
    const raw = url.searchParams.get(ANDROID_APP_OPEN_STAGE_PARAM)
    if (raw == null) return 0
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.min(APP_TARGETS.length - 1, Math.floor(n))
  } catch {
    return 0
  }
}

function cleanAndroidAppOpenUrl() {
  try {
    const url = getCleanAndroidAppUrl()
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {}
}

function buildAndroidAppIntentUrl(target, nextStage) {
  try {
    if (!target?.packageName) return ''
    const cleanTarget = getCleanAndroidAppUrl()
    const fallback = new URL(cleanTarget.toString())
    if (Number.isInteger(nextStage) && nextStage >= 0 && nextStage < APP_TARGETS.length) {
      fallback.searchParams.set(ANDROID_APP_OPEN_STAGE_PARAM, String(nextStage))
    } else {
      fallback.searchParams.set(ANDROID_APP_OPEN_DONE_PARAM, '1')
    }
    fallback.searchParams.set(ANDROID_APP_OPEN_TS_PARAM, String(Date.now()))

    const dataUrl = cleanTarget.toString().replace(/^https?:\/\//i, '')
    const component = target.componentName ? `;component=${target.componentName}` : ''
    return `intent://${dataUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=${target.packageName}${component};S.browser_fallback_url=${encodeURIComponent(fallback.toString())};end`
  } catch {
    return ''
  }
}

function shouldTryOpenInstalledAndroidApp() {
  try {
    if (!isAndroidBrowser()) return false
    return readAndroidAppOpenStage() >= 0
  } catch {
    return false
  }
}

function QuantumAppMark() {
  return (
    <div className="qa-mark" aria-hidden="true">
      <svg className="qa-robot" viewBox="0 0 128 116">
        <defs>
          <linearGradient id="qaRobotFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5ff2ff" />
            <stop offset=".52" stopColor="#137f9f" />
            <stop offset="1" stopColor="#ffd75d" />
          </linearGradient>
          <filter id="qaRobotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="qa-robot-orbit">
          <ellipse cx="64" cy="61" rx="55" ry="32" />
          <circle cx="10" cy="61" r="2.4" />
          <circle cx="112" cy="78" r="2" />
        </g>
        <g className="qa-robot-body" filter="url(#qaRobotGlow)">
          <path d="M40 39h48a13 13 0 0 1 13 13v35a12 12 0 0 1-12 12H39a12 12 0 0 1-12-12V52a13 13 0 0 1 13-13Z" />
          <path d="M42 36c2-13 10-21 22-21s20 8 22 21M45 18 38 7M83 18l7-11" />
          <path d="M26 54H13v28h13M102 54h13v28h-13M48 99v10M80 99v10" />
          <circle cx="50" cy="28" r="3" />
          <circle cx="78" cy="28" r="3" />
        </g>
        <g className="qa-robot-data">
          <path d="M47 58h34M41 69h46M49 80h30" />
        </g>
      </svg>

      <svg className="qa-wordmark" viewBox="0 0 500 106">
        <defs>
          <linearGradient id="qaText" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#72e9ff" />
            <stop offset=".5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ffd95c" />
          </linearGradient>
          <filter id="qaTextGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <text x="250" y="66" textAnchor="middle" className="qa-wordmark-back">Quantum App</text>
        <text x="250" y="66" textAnchor="middle" className="qa-wordmark-main">Quantum App</text>
        <path className="qa-title-orbit qa-title-orbit-a" d="M57 78c86 25 300 25 386 0" />
        <path className="qa-title-orbit qa-title-orbit-b" d="M89 29c90-20 234-20 322 0" />
        <g className="qa-title-stars">
          <circle cx="70" cy="47" r="2" /><circle cx="420" cy="51" r="1.6" />
          <circle cx="116" cy="86" r="1.4" /><circle cx="383" cy="86" r="1.8" />
        </g>
      </svg>
    </div>
  )
}

export default function AndroidAppPrompt() {
  const { t, langReady } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setOpen(false)
  }, [])

  useEffect(() => {
    setMounted(true)
    if (!langReady || !isAndroidBrowser()) return undefined

    let cancelled = false
    let leftPage = false
    let fallbackTimer = 0
    let cleanTimer = 0

    const markLeftPage = () => {
      leftPage = true
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') markLeftPage()
    }

    const showPromptIfStillInBrowser = () => {
      if (cancelled || leftPage) return
      if (document.visibilityState === 'hidden') return
      try {
        if (sessionStorage.getItem(DISMISSED_KEY) === '1') return
      } catch {}
      cleanAndroidAppOpenUrl()
      setOpen(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', markLeftPage)

    if (shouldTryOpenInstalledAndroidApp()) {
      const stage = readAndroidAppOpenStage()
      const target = APP_TARGETS[stage]
      const nextStage = stage + 1 < APP_TARGETS.length ? stage + 1 : -1
      const intentUrl = buildAndroidAppIntentUrl(target, nextStage)
      if (intentUrl) {
        try { window.location.assign(intentUrl) } catch {
          try { window.location.href = intentUrl } catch {}
        }
      }
      fallbackTimer = window.setTimeout(showPromptIfStillInBrowser, nextStage >= 0 ? 2200 : 3200)
    } else {
      cleanTimer = window.setTimeout(cleanAndroidAppOpenUrl, 100)
      fallbackTimer = window.setTimeout(showPromptIfStillInBrowser, 900)
    }

    return () => {
      cancelled = true
      if (fallbackTimer) window.clearTimeout(fallbackTimer)
      if (cleanTimer) window.clearTimeout(cleanTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', markLeftPage)
    }
  }, [langReady])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [close, open])

  if (!mounted || !open) return null

  return createPortal(
    <div className="qa-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close()
    }}>
      <section className="qa-dialog" role="dialog" aria-modal="true" aria-labelledby="qa-title">
        <div className="qa-atmosphere" aria-hidden="true"><i /><i /><i /></div>
        <button className="qa-close" type="button" onClick={close} aria-label={t('android_app_prompt_close')}>
          <span aria-hidden="true">&times;</span>
        </button>

        <QuantumAppMark />
        <div className="qa-pulse-rail" aria-hidden="true"><i /></div>

        <div className="qa-copy">
          <span className="qa-chip">{t('android_app_prompt_chip')}</span>
          <h2 id="qa-title">{t('android_app_prompt_title')}</h2>
          <p>{t('android_app_prompt_body')}</p>
          <div className="qa-benefits">
            <span><b>01</b>{t('android_app_prompt_benefit_fast')}</span>
            <span><b>02</b>{t('android_app_prompt_benefit_native')}</span>
            <span><b>03</b>{t('android_app_prompt_benefit_updates')}</span>
          </div>
        </div>

        <div className="qa-actions">
          <a className="qa-install" href={APK_URL} download onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
            </svg>
            <span>{t('android_app_prompt_continue')}</span>
            <i aria-hidden="true" />
          </a>
          <button type="button" className="qa-web" onClick={close}>
            {t('android_app_prompt_stay_web')}
          </button>
          <small>{t('android_app_prompt_install_note')}</small>
        </div>
      </section>

      <style jsx global>{`
        .qa-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(0, 5, 17, .76);
          backdrop-filter: blur(14px) saturate(1.28);
          animation: qaFade .28s ease-out both;
        }
        .qa-dialog {
          position: relative;
          width: min(620px, calc(100vw - 32px));
          max-height: calc(100dvh - 32px);
          overflow: hidden;
          isolation: isolate;
          box-sizing: border-box;
          padding: clamp(16px, 2.5vw, 25px);
          color: #eafaff;
          border: 1px solid rgba(103, 232, 249, .52);
          border-radius: clamp(22px, 4vw, 34px);
          background:
            radial-gradient(circle at 20% 8%, rgba(52, 210, 255, .18), transparent 31%),
            radial-gradient(circle at 88% 9%, rgba(255, 213, 81, .14), transparent 30%),
            linear-gradient(135deg, rgba(8, 20, 40, .98), rgba(2, 7, 20, .99) 52%, rgba(8, 16, 36, .98));
          box-shadow: 0 28px 90px rgba(0, 0, 0, .82), inset 0 0 0 1px rgba(255,255,255,.04), 0 0 68px rgba(45, 211, 255, .18);
          animation: qaRise .4s cubic-bezier(.2, .86, .24, 1) both;
        }
        .qa-dialog::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -2;
          opacity: .3;
          background-image:
            linear-gradient(rgba(92, 220, 255, .1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 220, 255, .1) 1px, transparent 1px);
          background-size: 31px 31px;
          mask-image: linear-gradient(#000, transparent 83%);
        }
        .qa-atmosphere { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; border-radius: inherit; }
        .qa-atmosphere i { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #8ff2ff; box-shadow: 0 0 9px #6be8ff; animation: qaStar 4.8s ease-in-out infinite; }
        .qa-atmosphere i:nth-child(1) { left: 12%; top: 18%; }
        .qa-atmosphere i:nth-child(2) { right: 15%; top: 31%; animation-delay: -1.6s; background: #ffe37c; }
        .qa-atmosphere i:nth-child(3) { left: 19%; bottom: 18%; animation-delay: -3.1s; }
        .qa-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(101, 227, 255, .5);
          border-radius: 50%;
          color: #eafaff;
          background: #071529;
          box-shadow: inset 0 0 14px rgba(62, 205, 255, .15), 0 0 18px rgba(62,205,255,.12);
          font-size: 27px;
          cursor: pointer;
        }
        .qa-mark { position: relative; width: min(100%, 390px); height: clamp(104px, 18vh, 140px); margin: 0 auto; }
        .qa-wordmark { position: absolute; inset: auto 0 0; display: block; width: 100%; overflow: visible; }
        .qa-wordmark-back {
          fill: transparent;
          stroke: rgba(103,232,249,.35);
          stroke-width: 3;
          font: 900 49px var(--font-forum-title), system-ui, sans-serif;
          letter-spacing: 0;
        }
        .qa-wordmark-main {
          fill: url(#qaText);
          filter: url(#qaTextGlow);
          font: 900 49px var(--font-forum-title), system-ui, sans-serif;
          letter-spacing: 0;
          stroke: rgba(255,255,255,.22);
          stroke-width: .8;
          stroke-dasharray: 440;
          animation: qaWordDraw 5.5s ease-in-out infinite;
        }
        .qa-title-orbit { fill: none; stroke-linecap: round; stroke-width: 1.8; stroke-dasharray: 42 170; animation: qaOrbitFlow 4.8s linear infinite; }
        .qa-title-orbit-a { stroke: #69e9ff; }
        .qa-title-orbit-b { stroke: #ffd85d; animation-direction: reverse; animation-duration: 6s; }
        .qa-title-stars circle { fill: #fff4ba; filter: drop-shadow(0 0 5px #69e9ff); animation: qaStar 2.6s ease-in-out infinite; }
        .qa-robot {
          position: absolute;
          z-index: -1;
          top: 0;
          left: calc(50% - 40px);
          width: 80px;
          height: 72px;
          overflow: visible;
          animation: qaRobotPeek 7s cubic-bezier(.4, 0, .2, 1) infinite;
        }
        .qa-robot-body { fill: url(#qaRobotFill); stroke: #d9fbff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .qa-robot-data { fill: none; stroke: #fff4a3; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 18 12; animation: qaData 1.4s linear infinite; }
        .qa-robot-orbit { fill: none; stroke: rgba(103,232,249,.55); stroke-width: 1.4; stroke-dasharray: 24 18; animation: qaOrbitFlow 3s linear infinite; }
        .qa-pulse-rail { position: relative; height: 1px; margin: 2px 0 12px; background: linear-gradient(90deg, transparent, #65e7ff 22%, #ffd75d 78%, transparent); }
        .qa-pulse-rail i { position: absolute; top: -1px; left: 0; width: 34px; height: 3px; background: white; box-shadow: 0 0 12px #66e8ff; animation: qaRailPulse 2.6s ease-in-out infinite; }
        .qa-copy { text-align: center; }
        .qa-chip {
          display: inline-flex;
          border: 1px solid rgba(255, 215, 93, .52);
          border-radius: 999px;
          padding: 4px 11px;
          color: #ffe58b;
          background: rgba(255, 215, 93, .07);
          font-size: 10px;
          font-weight: 850;
          text-transform: uppercase;
        }
        .qa-copy h2 { margin: 10px 0 6px; color: #f5fcff; font-size: clamp(19px, 4.8vw, 27px); line-height: 1.14; letter-spacing: 0; }
        .qa-copy p { margin: 0 auto; max-width: 500px; color: #bcd4e1; font-size: clamp(11px, 2.5vw, 13px); line-height: 1.48; }
        .qa-benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-top: 13px; }
        .qa-benefits span {
          min-width: 0;
          display: grid;
          place-items: center;
          gap: 2px;
          border: 1px solid rgba(93, 210, 244, .27);
          border-radius: 8px;
          padding: 6px 4px;
          color: #dff9ff;
          background: rgba(6, 24, 43, .74);
          font-size: clamp(8px, 2vw, 10px);
          font-weight: 760;
          line-height: 1.2;
        }
        .qa-benefits b { color: #ffe37a; font-size: 8px; }
        .qa-actions { display: grid; gap: 7px; margin-top: 14px; text-align: center; }
        .qa-web, .qa-install { min-height: 42px; border-radius: 9px; font: 800 12px var(--font-forum-title), system-ui, sans-serif; letter-spacing: 0; cursor: pointer; }
        .qa-install {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #ffe16d;
          color: #06131d;
          background: #76e8ff;
          box-shadow: 0 0 0 1px rgba(102, 232, 255, .34), 0 0 24px rgba(102, 232, 255, .2);
          text-decoration: none;
        }
        .qa-install svg { width: 19px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .qa-install i { position: absolute; inset: -65% auto -65% -25%; width: 16%; transform: rotate(18deg); background: rgba(255,255,255,.78); filter: blur(5px); animation: qaButtonGlint 2.8s ease-in-out infinite; }
        .qa-web { border: 1px solid rgba(108, 201, 230, .34); color: #bcd4df; background: #07162a; }
        .qa-actions small { color: #7594a6; font-size: 9px; line-height: 1.3; }
        @media (max-width: 430px) {
          .qa-overlay { padding: 8px; }
          .qa-dialog { width: min(620px, calc(100vw - 16px)); max-height: calc(100dvh - 16px); padding: 15px 13px 13px; border-radius: 20px; }
          .qa-close { width: 38px; height: 38px; top: 9px; right: 9px; }
          .qa-mark { height: clamp(98px, 17vh, 122px); width: min(87%, 350px); }
          .qa-wordmark-main, .qa-wordmark-back { font-size: 46px; }
          .qa-robot { width: 67px; height: 61px; left: calc(50% - 33px); }
        }
        @media (max-height: 650px) {
          .qa-dialog { padding-block: 10px; }
          .qa-mark { height: 88px; width: min(78%, 315px); }
          .qa-robot { width: 57px; height: 51px; left: calc(50% - 28px); }
          .qa-copy h2 { margin-top: 6px; }
          .qa-benefits { margin-top: 8px; }
          .qa-actions { margin-top: 9px; }
          .qa-actions small { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qa-overlay *, .qa-overlay *::before, .qa-overlay *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; }
        }
        @keyframes qaFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qaRise { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes qaRobotPeek {
          0%, 10%, 88%, 100% { transform: translateY(56px) scale(.72); opacity: 0; }
          20%, 72% { transform: translateY(0) scale(1); opacity: 1; }
          42% { transform: translateY(-4px) rotate(-4deg) scale(1.03); opacity: 1; }
          55% { transform: translateY(-2px) rotate(4deg) scale(1.01); opacity: 1; }
        }
        @keyframes qaWordDraw { 0%,100% { stroke-dashoffset: 430; opacity: .68; } 28%,74% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes qaOrbitFlow { to { stroke-dashoffset: -212; } }
        @keyframes qaData { to { stroke-dashoffset: -60; } }
        @keyframes qaStar { 0%,100% { opacity: .25; transform: scale(.7); } 50% { opacity: 1; transform: scale(1.25); } }
        @keyframes qaRailPulse { 0%,100% { left: 0; opacity: 0; } 50% { left: calc(100% - 34px); opacity: 1; } }
        @keyframes qaButtonGlint { 0%,58% { transform: translateX(0) rotate(18deg); opacity: 0; } 70% { opacity: .9; } 100% { transform: translateX(760px) rotate(18deg); opacity: 0; } }
      `}</style>
    </div>,
    document.body,
  )
}
