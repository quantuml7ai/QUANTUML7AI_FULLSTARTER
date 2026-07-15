'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'

const APPEAR_DELAY_MS = 800
const AUTO_HIDE_MS = 2000
const MIN_Y = 260
const TOP_HIDE_Y = 40

// Порог подтверждения движения вверх.
// Кнопка появляется не от микродёргания, а только когда пользователь реально скроллит вверх.
const DIR_SWITCH_PX = 500

function ScrollTopPulse() {
  const [visible, setVisible] = useState(false)

  const visibleRef = useRef(false)
  const lastYRef = useRef(0)
  const dirAccumRef = useRef(0)
  const appearTimerRef = useRef(null)
  const hideTimerRef = useRef(null)

  const clearAppearTimer = useCallback(() => {
    if (appearTimerRef.current) {
      clearTimeout(appearTimerRef.current)
      appearTimerRef.current = null
    }
  }, [])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const hideNow = useCallback(() => {
    clearAppearTimer()
    clearHideTimer()
    dirAccumRef.current = 0

    if (visibleRef.current) {
      visibleRef.current = false
      setVisible(false)
    }
  }, [clearAppearTimer, clearHideTimer])

  const showNow = useCallback(() => {
    if (!visibleRef.current) {
      visibleRef.current = true
      setVisible(true)
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()

    hideTimerRef.current = setTimeout(() => {
      hideNow()
    }, AUTO_HIDE_MS)
  }, [clearHideTimer, hideNow])

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastYRef.current = window.scrollY || 0
    dirAccumRef.current = 0
 
    const onScroll = () => {
      const y = window.scrollY || 0

      // У самого верха кнопка не нужна.
      if (y <= TOP_HIDE_Y) {
        hideNow()
        lastYRef.current = y
        return
      }
 
      const lastY = lastYRef.current
      const deltaY = y - lastY
      lastYRef.current = y

      const absDelta = Math.abs(deltaY)
      if (absDelta < 0.5) return

      const sign = Math.sign(deltaY)

      // Если направление изменилось — сбрасываем накопление,
      // чтобы одно случайное событие не включало кнопку.
      if (dirAccumRef.current !== 0 && Math.sign(dirAccumRef.current) !== sign) {
        dirAccumRef.current = 0
      }

      // Режем вклад одного события, чтобы один большой тик не решал всё сразу.
      const maxStep = Math.max(6, Math.round(DIR_SWITCH_PX / 3))
      const step = Math.min(absDelta, maxStep) * sign

      dirAccumRef.current += step

      // Ограничиваем накопление, чтобы оно не росло бесконечно.
      const cap = DIR_SWITCH_PX * 2
      if (dirAccumRef.current > cap) dirAccumRef.current = cap
      if (dirAccumRef.current < -cap) dirAccumRef.current = -cap

      const confirmedUp = dirAccumRef.current <= -DIR_SWITCH_PX
      const confirmedDown = dirAccumRef.current >= DIR_SWITCH_PX

      // Движение вниз: кнопку не показываем.
      // Если она уже была видна после прошлого движения вверх — прячем.
      if (confirmedDown) {
        hideNow()
        return
      }

      // Движение вверх: показываем кнопку после той же задержки, что была раньше.
      if (confirmedUp && y > MIN_Y) {
        if (!visibleRef.current && !appearTimerRef.current) {
          appearTimerRef.current = setTimeout(() => {
            showNow()
            appearTimerRef.current = null
            scheduleHide()
          }, APPEAR_DELAY_MS)
        }

        if (visibleRef.current) {
          scheduleHide()
        }
      } 
    } 

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearAppearTimer()
      clearHideTimer()
    }
  }, [clearAppearTimer, clearHideTimer, hideNow, scheduleHide, showNow])

  const scrollToTop = useCallback(() => {
    clearAppearTimer()
    clearHideTimer()

    visibleRef.current = false
    setVisible(false)

    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    } catch {
      window.scrollTo(0, 0)
    }
  }, [clearAppearTimer, clearHideTimer])

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        scrollToTop()
      }
    },
    [scrollToTop],
  )

  if (!visible) return null

  return (
    <>
      <div
        className="ql7-scroll-top is-up"
        role="button"
        tabIndex={0}
        aria-label="Scroll to top"
        onClick={scrollToTop}
        onKeyDown={onKeyDown}
      >
        <span className="hitpad" aria-hidden="true" />

        <span className="shell" aria-hidden="true">
          <svg className="ring" viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="ql7Gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff2b3" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#ffd36a" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#ffb84d" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#fff0a8" stopOpacity="0.88" />
              </linearGradient>

              <linearGradient id="ql7Cyan" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#7cf9ff" stopOpacity="0.55" />
                <stop offset="45%" stopColor="#37d7ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#aefbff" stopOpacity="0.5" />
              </linearGradient>

              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M50 6
                 C58 6, 64 9, 70 12
                 C78 16, 86 14, 92 22
                 C97 29, 95 37, 96 45
                 C97 54, 100 61, 94 70
                 C88 79, 82 78, 74 86
                 C66 92, 59 96, 50 94
                 C41 96, 34 92, 26 86
                 C18 78, 12 79, 6 70
                 C0 61, 3 54, 4 45
                 C5 37, 3 29, 8 22
                 C14 14, 22 16, 30 12
                 C36 9, 42 6, 50 6 Z"
              fill="none"
              stroke="url(#ql7Cyan)"
              strokeWidth="1.4"
              strokeLinejoin="round"
              filter="url(#softGlow)"
              opacity="0.9"
            />

            <circle cx="78" cy="20" r="1.2" fill="url(#ql7Gold)" opacity="0.75" />
            <circle cx="90" cy="52" r="1.1" fill="url(#ql7Gold)" opacity="0.55" />
            <circle cx="18" cy="26" r="1.1" fill="url(#ql7Gold)" opacity="0.6" />
            <circle cx="10" cy="58" r="1.0" fill="url(#ql7Gold)" opacity="0.5" />
            <circle cx="32" cy="90" r="1.1" fill="url(#ql7Gold)" opacity="0.55" />
          </svg>
        </span>

        <span className="content" aria-hidden="true">
          <svg className="arrow" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="arrowGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff6c9" stopOpacity="1" />
                <stop offset="35%" stopColor="#ffd36a" stopOpacity="0.98" />
                <stop offset="70%" stopColor="#ffb84d" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#fff1a8" stopOpacity="0.94" />
              </linearGradient>

              <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M50 12
                 C49 12, 48 13, 47 14
                 L24 37
                 C22 39, 22 42, 24 44
                 C26 46, 29 46, 31 44
                 L43 32
                 L43 82
                 C43 85, 45 87, 48 87
                 L52 87
                 C55 87, 57 85, 57 82
                 L57 32
                 L69 44
                 C71 46, 74 46, 76 44
                 C78 42, 78 39, 76 37
                 L53 14
                 C52 13, 51 12, 50 12 Z"
              fill="url(#arrowGold)"
              filter="url(#arrowGlow)"
              opacity="0.98"
            />

            <path
              d="M50 22
                 L35 37
                 L47 25
                 L47 80
                 C47 81, 48 82, 49 82
                 L51 82
                 C52 82, 53 81, 53 80
                 L53 25
                 L65 37 Z"
              fill="#ffffff"
              opacity="0.22"
            />

            <path
              d="M43 32 L43 82"
              stroke="#ffffff"
              strokeOpacity="0.20"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M57 32 L57 82"
              stroke="#000000"
              strokeOpacity="0.18"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>

          <span className="upLabel">Up</span>
        </span>
      </div>

      <style jsx>{`
        .ql7-scroll-top {
          box-sizing: border-box !important;
          position: fixed !important;
          z-index: 70 !important;

          right: var(--stp-right, 18px) !important;
          bottom: var(--stp-bottom, 86px) !important;

          width: var(--stp-size, 56px) !important;
          height: var(--stp-size, 56px) !important;

          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;

          margin: 0 !important;
          padding: 0 !important;

          border: none !important;
          outline: none !important;
          box-shadow: none !important;

          cursor: pointer !important;

          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;

          opacity: 1;
          transform: translateZ(0) scale(1);
          animation: ql7-fade-in 180ms ease-out;
        }

        .ql7-scroll-top .hitpad {
          position: absolute;
          inset: -10px;
          border-radius: 999px;
          background: transparent;
        }

        .ql7-scroll-top::before {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 18px;
          background:
            radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.10), rgba(255,255,255,0) 58%),
            radial-gradient(140% 120% at 70% 80%, rgba(35,220,255,0.08), rgba(35,220,255,0) 60%),
            linear-gradient(180deg, rgba(6,12,18,0.55), rgba(4,8,12,0.35));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.55);
        }

        .ql7-scroll-top .shell {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .ql7-scroll-top .ring {
          width: 100%;
          height: 100%;
          display: block;
        }

        .ql7-scroll-top .content {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: center;
          justify-items: center;
          pointer-events: none;

          padding: 8px 8px 6px;
          gap: 2px;
          transform: translateZ(0);
        }

        .ql7-scroll-top .arrow {
          width: 100%;
          height: 100%;
          display: block;
          transform-origin: 50% 50%;
          max-height: 40px;
          transform: rotate(0deg);
        }

        .ql7-scroll-top .upLabel {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.08em;
          font-weight: 800;
          text-transform: uppercase;
          line-height: 1;
          color: rgba(255, 232, 170, 0.92);
          text-shadow:
            0 0 10px rgba(255, 210, 120, 0.20),
            0 1px 0 rgba(0,0,0,0.45);
          transform: translateY(-1px);
          user-select: none;
        }

        .ql7-scroll-top:hover {
          transform: translateZ(0) scale(1.03);
        }

        .ql7-scroll-top:active {
          transform: translateZ(0) scale(0.98);
        }

        @keyframes ql7-fade-in {
          0% {
            opacity: 0;
            transform: translateZ(0) scale(0.92);
          }

          100% {
            opacity: 1;
            transform: translateZ(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .ql7-scroll-top {
            right: var(--stp-right-mobile, 14px) !important;
            bottom: var(--stp-bottom-mobile, 80px) !important;

            width: var(--stp-size-mobile, 60px) !important;
            height: var(--stp-size-mobile, 60px) !important;
          }

          .ql7-scroll-top .arrow {
            max-height: 44px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ql7-scroll-top {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}

export default memo(ScrollTopPulse)