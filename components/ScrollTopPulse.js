// components/ScrollTopPulse.js
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const APPEAR_DELAY_MS = 800
const AUTO_HIDE_MS    = 4000 // было 2000 → сделали в 2 раза дольше
const MIN_Y           = 260
const TOP_HIDE_Y      = 40

// === НАСТРОЙКА ПЕРЕКЛЮЧЕНИЯ НАПРАВЛЕНИЯ СТРЕЛКИ ===
const DIR_SWITCH_PX   = 500

// === НАСТРОЙКА СКОРОСТИ СКРОЛЛА (ПОСТОЯННАЯ СКОРОСТЬ!) ===
const SCROLL_PX_PER_SEC = 200

export default function ScrollTopPulse() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('up') // 'up' | 'down'

  // для красивого «прокрута по кругу» при смене режима
  const [spinDir, setSpinDir] = useState(null) // 'cw' | 'ccw' | null

  const visibleRef   = useRef(false)
  const modeRef      = useRef('up')
  const lastYRef     = useRef(0)
  const dirAccumRef  = useRef(0)
  const appearTimerRef = useRef(null)
  const hideTimerRef   = useRef(null)

  // === управление анимацией скролла (отмена) ===
  const rafRef = useRef(0)
  const scrollingRef = useRef(false)
  const cancelListenersAttachedRef = useRef(false)

  // хранит текущую цель (для телепорта по повторному клику)
  const teleportTargetGetterRef = useRef(null)

  // таймер очистки класса вращения
  const spinTimerRef = useRef(null)
  const triggerSpin = useCallback((dir) => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
    setSpinDir(dir)
    spinTimerRef.current = setTimeout(() => {
      setSpinDir(null)
      spinTimerRef.current = null
    }, 360)
  }, [])

  const detachCancelListeners = useCallback(() => {
    if (!cancelListenersAttachedRef.current) return
    cancelListenersAttachedRef.current = false

    window.removeEventListener('wheel', cancelScroll, { capture: true })
    window.removeEventListener('touchstart', cancelScroll, { capture: true })
    window.removeEventListener('touchmove', cancelScroll, { capture: true })
    window.removeEventListener('pointerdown', cancelScroll, { capture: true })
    window.removeEventListener('mousedown', cancelScroll, { capture: true })
    window.removeEventListener('keydown', cancelScroll, { capture: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ВАЖНО: cancelScroll должен быть стабильным по ссылке, иначе removeEventListener не снимет старые хендлеры
  const cancelScroll = useCallback((e) => {
    // если пользователь нажал на саму кнопку — НЕ отменяем здесь,
    // чтобы onClick смог сделать телепорт.
    if (e?.target?.closest?.('.ql7-scroll-top')) return

    if (!scrollingRef.current) return
    scrollingRef.current = false

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    teleportTargetGetterRef.current = null
    detachCancelListeners()
  }, [detachCancelListeners])

  const attachCancelListeners = useCallback(() => {
    if (cancelListenersAttachedRef.current) return
    cancelListenersAttachedRef.current = true

    // capture: true — чтобы ловить событие раньше (и изнутри любых элементов)
    window.addEventListener('wheel', cancelScroll, { passive: true, capture: true })
    window.addEventListener('touchstart', cancelScroll, { passive: true, capture: true })
    window.addEventListener('touchmove', cancelScroll, { passive: true, capture: true })
    window.addEventListener('pointerdown', cancelScroll, { passive: true, capture: true })
    window.addEventListener('mousedown', cancelScroll, { passive: true, capture: true })
    window.addEventListener('keydown', cancelScroll, { capture: true })
  }, [cancelScroll])

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastYRef.current = window.scrollY || 0
    dirAccumRef.current = 0

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
      dirAccumRef.current = 0
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
      const deltaY = y - lastY
      lastYRef.current = y

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

      // === логика DIR_SWITCH_PX (не ломаем) ===
      const absDelta = Math.abs(deltaY)
      if (absDelta >= 0.5) {
        const sign = Math.sign(deltaY)

        if (dirAccumRef.current !== 0 && Math.sign(dirAccumRef.current) !== sign) {
          dirAccumRef.current = 0
        }

        const maxStep = Math.max(6, Math.round(DIR_SWITCH_PX / 3))
        const step = Math.min(absDelta, maxStep) * sign

        dirAccumRef.current += step

        const cap = DIR_SWITCH_PX * 2
        if (dirAccumRef.current > cap) dirAccumRef.current = cap
        if (dirAccumRef.current < -cap) dirAccumRef.current = -cap
      }

      const confirmedUp   = dirAccumRef.current <= -DIR_SWITCH_PX
      const confirmedDown = dirAccumRef.current >=  DIR_SWITCH_PX

      // Движение ВВЕРХ → режим "up"
      if (confirmedUp && y > MIN_Y) {
        if (modeRef.current !== 'up') {
          modeRef.current = 'up'
          setMode('up')
          triggerSpin('ccw') // против часовой при возврате вверх
          dirAccumRef.current = 0
        }

        if (!visibleRef.current && !appearTimerRef.current) {
          appearTimerRef.current = setTimeout(() => {
            showNow()
            appearTimerRef.current = null
            scheduleHide()
          }, APPEAR_DELAY_MS)
        }

        if (visibleRef.current) scheduleHide()
        return
      }

      // Движение ВНИЗ → режим "down"
      if (confirmedDown && y > MIN_Y) {
        if (modeRef.current !== 'down') {
          modeRef.current = 'down'
          setMode('down')
          triggerSpin('cw') // по часовой при уходе вниз
          dirAccumRef.current = 0
        }

        if (!visibleRef.current && !appearTimerRef.current) {
          appearTimerRef.current = setTimeout(() => {
            showNow()
            appearTimerRef.current = null
            scheduleHide()
          }, APPEAR_DELAY_MS)
        }

        if (visibleRef.current) scheduleHide()
        return
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearAppear()
      clearHide()
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current)
        spinTimerRef.current = null
      }
      cancelScroll()
    }
  }, [cancelScroll, triggerSpin])

  // === ПОСТОЯННАЯ СКОРОСТЬ + ДОКРУТКА ДО РЕАЛЬНОГО КОНЦА ===
  const smoothScrollTo = (targetYOrGetter) => {
    if (typeof window === 'undefined') return
    cancelScroll()

    const getTargetY =
      typeof targetYOrGetter === 'function'
        ? targetYOrGetter
        : () => targetYOrGetter

    teleportTargetGetterRef.current = getTargetY

    const speed = Math.max(1, SCROLL_PX_PER_SEC)

    scrollingRef.current = true
    attachCancelListeners()

    let lastTime = null

    const step = (time) => {
      if (!scrollingRef.current) return

      if (lastTime === null) {
        lastTime = time
        rafRef.current = requestAnimationFrame(step)
        return
      }

      const rawDt = (time - lastTime) / 1000
      const dt = Math.min(Math.max(rawDt, 0.001), 0.033)
      lastTime = time

      const currentY = window.scrollY || 0
      const targetY = getTargetY()

      const diff = targetY - currentY
      const dist = Math.abs(diff)

      if (dist <= 0.5) {
        window.scrollTo(0, targetY)
        scrollingRef.current = false
        detachCancelListeners()
        teleportTargetGetterRef.current = null
        rafRef.current = 0
        return
      }

      let move = speed * dt
      if (move < 0.5) move = 0.5

      const applied = Math.min(dist, move)
      const nextY = currentY + Math.sign(diff) * applied

      window.scrollTo(0, nextY)
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }

  const teleportNowIfScrolling = () => {
    if (!scrollingRef.current) return false

    const getTarget = teleportTargetGetterRef.current
    if (!getTarget) return false

    scrollingRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    detachCancelListeners()

    window.scrollTo(0, getTarget())
    teleportTargetGetterRef.current = null
    return true
  }

  const scrollToTop = () => {
    if (teleportNowIfScrolling()) {
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
      return
    }

    try {
      smoothScrollTo(0)
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
    if (teleportNowIfScrolling()) {
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
      return
    }

    try {
      smoothScrollTo(() => {
        const doc = document.documentElement || document.body
        return Math.max(0, (doc.scrollHeight || 0) - (window.innerHeight || 0))
      })
    } catch {
      const doc = document.documentElement || document.body
      const maxY = Math.max(0, (doc.scrollHeight || 0) - (window.innerHeight || 0))
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
    if (mode === 'down') scrollToBottom()
    else scrollToTop()
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
        className={[
          'ql7-scroll-top',
          spinDir === 'cw' ? 'spin-cw' : '',
          spinDir === 'ccw' ? 'spin-ccw' : '',
          mode === 'down' ? 'is-down' : 'is-up',
        ].join(' ')}
        role="button"
        tabIndex={0}
        aria-label={mode === 'down' ? 'Scroll to bottom' : 'Scroll to top'}
        onClick={handleClick}
        onKeyDown={onKeyDown}
      >
        {/* расширитель зоны клика (попадание рядом) */}
        <span className="hitpad" aria-hidden="true" />

        {/* оболочка/рамка */}
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
                <stop offset="45%" stopColor="#37d7ff" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#aefbff" stopOpacity="0.45" />
              </linearGradient>

              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* премиальный «волнистый» контур (тонкий, без синей окантовки) */}
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
              strokeWidth="1.35"
              strokeLinejoin="round"
              filter="url(#softGlow)"
              opacity="0.9"
            />

            {/* микро-«частицы» — лёгкие, статичные */}
            <circle cx="78" cy="20" r="1.2" fill="url(#ql7Gold)" opacity="0.75" />
            <circle cx="90" cy="52" r="1.1" fill="url(#ql7Gold)" opacity="0.55" />
            <circle cx="18" cy="26" r="1.1" fill="url(#ql7Gold)" opacity="0.6" />
            <circle cx="10" cy="58" r="1.0" fill="url(#ql7Gold)" opacity="0.5" />
            <circle cx="32" cy="90" r="1.1" fill="url(#ql7Gold)" opacity="0.55" />
          </svg>
        </span>

        {/* стрелка — занимает максимум, реально вверх/вниз */}
        <span className="arrow-wrap" aria-hidden="true">
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

            {/* корпус стрелы */}
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

            {/* внутренний “энерго-луч” */}
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

            {/* тонкие акцентные ребра */}
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
        </span>

        {/* МЕТКА: ниже стрелки, не перекрывается */}
        <span className="auto-tag" aria-hidden="true">авто</span>
      </div>

      <style jsx>{`
        .ql7-scroll-top {
          box-sizing: border-box !important;
          position: fixed !important;
          z-index: 70 !important;

          right: var(--stp-right, 18px) !important;
          bottom: var(--stp-bottom, 86px) !important;

          /* было ~74px → делаем ~в 1.5 раза меньше */
          width: var(--stp-size, 52px) !important;
          height: var(--stp-size, 52px) !important;

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

        /* расширение клика — можно попасть рядом */
        .ql7-scroll-top .hitpad {
          position: absolute;
          inset: -10px;
          border-radius: 999px;
          background: transparent;
        }

        /* стекло внутри волны */
        .ql7-scroll-top::before {
          content: '';
          position: absolute;
          inset: 9px;
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

        /* вращение оболочки по кругу при смене режима */
        .ql7-scroll-top.spin-cw .shell {
          animation: ql7-spin-cw 300ms cubic-bezier(.2, .9, .2, 1);
        }
        .ql7-scroll-top.spin-ccw .shell {
          animation: ql7-spin-ccw 300ms cubic-bezier(.2, .9, .2, 1);
        }

        .ql7-scroll-top .arrow-wrap {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;

          /* ВАЖНО: снизу больше отступ, чтобы не перекрывать "авто" */
          padding: 8px 8px 18px 8px;
          transform: translateZ(0);
        }

        .ql7-scroll-top .arrow {
          width: 100%;
          height: 100%;
          display: block;
          transform-origin: 50% 50%;
          transition: transform 260ms cubic-bezier(.2,.9,.2,1);
        }

        .ql7-scroll-top.is-up .arrow { transform: rotate(0deg); }
        .ql7-scroll-top.is-down .arrow { transform: rotate(180deg); }

        /* Метка "авто" — ниже, отдельно */
        .ql7-scroll-top .auto-tag {
          position: absolute;
          left: 50%;
          bottom: 7px;
          transform: translateX(-50%);
          pointer-events: none;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;

          color: rgba(255, 240, 190, 0.92);
          text-shadow:
            0 1px 0 rgba(0,0,0,0.55),
            0 0 10px rgba(255, 200, 90, 0.20);

          /* чтобы метка не “съедалась” визуально стрелкой/свечением */
          z-index: 2;
        }

        .ql7-scroll-top:hover { transform: translateZ(0) scale(1.03); }
        .ql7-scroll-top:active { transform: translateZ(0) scale(0.98); }

        @keyframes ql7-fade-in {
          0% { opacity: 0; transform: translateZ(0) scale(0.92); }
          100% { opacity: 1; transform: translateZ(0) scale(1); }
        }

        @keyframes ql7-spin-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ql7-spin-ccw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @media (max-width: 640px) {
          .ql7-scroll-top {
            right: var(--stp-right-mobile, 14px) !important;
            bottom: var(--stp-bottom-mobile, 80px) !important;

            width: var(--stp-size-mobile, 56px) !important;
            height: var(--stp-size-mobile, 56px) !important;
          }

          .ql7-scroll-top::before {
            inset: 10px;
            border-radius: 19px;
          }

          .ql7-scroll-top .auto-tag {
            bottom: 8px;
            font-size: 10px;
          }

          .ql7-scroll-top .arrow-wrap {
            padding: 9px 9px 20px 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ql7-scroll-top,
          .ql7-scroll-top .shell,
          .ql7-scroll-top .arrow {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}
