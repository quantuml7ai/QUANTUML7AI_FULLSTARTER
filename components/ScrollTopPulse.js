// components/ScrollTopPulse.js
'use client'

import { useEffect, useRef, useState } from 'react'

const APPEAR_DELAY_MS = 800
const AUTO_HIDE_MS    = 2000
const MIN_Y           = 260
const TOP_HIDE_Y      = 40

export default function ScrollTopPulse() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('up') // 'up' | 'down'

  const visibleRef   = useRef(false)
  const modeRef      = useRef('up')
  const lastYRef     = useRef(0)
  const appearTimerRef = useRef(null)
  const hideTimerRef   = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastYRef.current = window.scrollY || 0

    const clearAppear = () => {
      if (appearTimerRef.current) {
        clearTimeout(appearTimerRef.current)
        appearTimerRef.current = null
      }
    }

    const clearHide = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }

    const showNow = () => {
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
    }

    const hideNow = () => {
      clearAppear()
      clearHide()
      if (visibleRef.current) {
        visibleRef.current = false
        setVisible(false)
      }
    }

    const scheduleHide = () => {
      clearHide()
      hideTimerRef.current = setTimeout(() => {
        hideNow()
      }, AUTO_HIDE_MS)
    }

    const onScroll = () => {
      const y = window.scrollY || 0
      const lastY = lastYRef.current
      lastYRef.current = y

      const goingUp   = y < lastY
      const goingDown = y > lastY

      const doc = document.documentElement || document.body
      const docHeight = doc.scrollHeight || 0
      const viewportHeight = window.innerHeight || 0
      const maxY = Math.max(0, docHeight - viewportHeight)
      const distanceToBottom = maxY - y

      // если мы почти в самом верху или почти внизу — кнопку прячем
      if (y <= TOP_HIDE_Y || distanceToBottom <= TOP_HIDE_Y) {
        hideNow()
        return
      }

      // Движение ВВЕРХ → режим "стрелка вверх / скролл наверх"
      if (goingUp && y > MIN_Y) {
        if (modeRef.current !== 'up') {
          modeRef.current = 'up'
          setMode('up')
        }

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
        return
      }

      // Движение ВНИЗ → режим "стрелка вниз / скролл вниз"
      if (goingDown && y > MIN_Y) {
        if (modeRef.current !== 'down') {
          modeRef.current = 'down'
          setMode('down')
        }

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
        return
      }

      // если стоим на месте (нет движения) — просто ничего не делаем
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearAppear()
      clearHide()
    }
  }, [])

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }

    if (appearTimerRef.current) {
      clearTimeout(appearTimerRef.current)
      appearTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    visibleRef.current = false
    setVisible(false)
  }

  const scrollToBottom = () => {
    try {
      const doc = document.documentElement || document.body
      const maxY = Math.max(
        0,
        (doc.scrollHeight || 0) - (window.innerHeight || 0),
      )
      window.scrollTo({ top: maxY, behavior: 'smooth' })
    } catch {
      const doc = document.documentElement || document.body
      const maxY = Math.max(
        0,
        (doc.scrollHeight || 0) - (window.innerHeight || 0),
      )
      window.scrollTo(0, maxY)
    }

    if (appearTimerRef.current) {
      clearTimeout(appearTimerRef.current)
      appearTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    visibleRef.current = false
    setVisible(false)
  }

  const handleClick = () => {
    if (mode === 'down') {
      scrollToBottom()
    } else {
      scrollToTop()
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  if (!visible) return null

  return (
    <>
      <div
        className="ql7-scroll-top"
        role="button"
        tabIndex={0}
        aria-label={mode === 'down' ? 'Scroll to bottom' : 'Scroll to top'}
        onClick={handleClick}
        onKeyDown={onKeyDown}
      >
        <span className={mode === 'down' ? 'arrow arrow-down' : 'arrow'}>
          ⭱
        </span>
      </div>

      <style jsx>{`
        .ql7-scroll-top {
          /* Абсолютно изолированный шарик, без шансов растянуть */

          box-sizing: border-box !important;
          position: fixed !important;
          z-index: 70 !important;

          right: var(--stp-right, 18px) !important;
          bottom: var(--stp-bottom, 86px) !important;

          width: var(--stp-size, 50px) !important;
          height: var(--stp-size, 50px) !important;
          min-width: var(--stp-size, 50px) !important;
          max-width: var(--stp-size, 50px) !important;
          min-height: var(--stp-size, 50px) !important;
          max-height: var(--stp-size, 50px) !important;
          flex: 0 0 var(--stp-size, 50px) !important;

          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;

          margin: 0 !important;
          padding: 0 !important;
          border-radius: 999px !important;
          border: 1px solid rgba(0, 229, 255, 0.55) !important;
          overflow: hidden !important;

          background:
            radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.14), rgba(255,255,255,0) 60%),
            radial-gradient(100% 100% at 70% 70%, rgba(0,200,255,.22), rgba(0,200,255,0) 60%),
            linear-gradient(180deg, rgba(0,20,40,.98), rgba(0,8,18,.98)) !important;

          box-shadow:
            0 0 0 1px rgba(0,229,255,.28) inset,
            0 8px 22px rgba(0,0,0,.9),
            0 0 22px rgba(0,229,255,.38) !important;

          color: #e6f8ff !important;
          font-size: calc(var(--stp-size, 46px) * 0.5) !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          text-decoration: none !important;

          cursor: pointer !important;
          outline: none !important;

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);

          transition:
            transform .16s ease-out,
            box-shadow .22s ease-out,
            background .22s ease-out,
            opacity .18s ease-out !important;

          animation:
            ql7-stp-pop .18s cubic-bezier(.22,1,.36,1),
            ql7-stp-pulse 1.8s ease-in-out infinite;
        }

        .ql7-scroll-top .arrow {
          display: block;
          transform: translateY(-1px);
          text-shadow:
            0 0 8px rgba(0,229,255,.9),
            0 0 18px rgba(0,229,255,.65);
        }

        /* вниз — та же стрелка, но повернута */
        .ql7-scroll-top .arrow.arrow-down {
          transform: rotate(180deg) translateY(1px);
        }

        .ql7-scroll-top:hover {
          transform: translateY(-2px) scale(1.06);
          box-shadow:
            0 0 0 1px rgba(56,189,248,.65) inset,
            0 14px 30px rgba(0,0,0,1),
            0 0 34px rgba(56,189,248,.9);
        }

        .ql7-scroll-top:active {
          transform: translateY(1px) scale(.94);
          box-shadow:
            0 4px 14px rgba(0,0,0,.9),
            0 0 18px rgba(0,229,255,.4);
        }

        @keyframes ql7-stp-pop {
          0%   { transform: scale(.4); opacity: 0; }
          100% { transform: scale(1);  opacity: 1; }
        }

        @keyframes ql7-stp-pulse {
          0% {
            box-shadow:
              0 0 0 1px rgba(0,229,255,.32) inset,
              0 8px 22px rgba(0,0,0,.9),
              0 0 16px rgba(0,229,255,.42);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(148,233,255,.65) inset,
              0 10px 26px rgba(0,0,0,1),
              0 0 30px rgba(56,189,248,.95);
          }
          100% {
            box-shadow:
              0 0 0 1px rgba(0,229,255,.32) inset,
              0 8px 22px rgba(0,0,0,.9),
              0 0 16px rgba(0,229,255,.42);
          }
        }

        @media (max-width: 640px) {
          .ql7-scroll-top {
            right: var(--stp-right-mobile, 14px) !important;
            bottom: var(--stp-bottom-mobile, 80px) !important;
            width: var(--stp-size-mobile, 50px) !important;
            height: var(--stp-size-mobile, 50px) !important;
            min-width: var(--stp-size-mobile, 50px) !important;
            max-width: var(--stp-size-mobile, 50px) !important;
            min-height: var(--stp-size-mobile, 50px) !important;
            max-height: var(--stp-size-mobile, 50px) !important;
            flex: 0 0 var(--stp-size-mobile, 50px) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ql7-scroll-top {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
