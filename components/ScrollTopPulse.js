// components/ScrollTopPulse.js
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const APPEAR_DELAY_MS = 800
const AUTO_HIDE_MS = 2000
const MIN_Y = 260
const TOP_HIDE_Y = 40

// === НАСТРОЙКА ПЕРЕКЛЮЧЕНИЯ НАПРАВЛЕНИЯ СТРЕЛКИ ===
const DIR_SWITCH_PX = 500

// === НАСТРОЙКА СКОРОСТИ СКРОЛЛА (ПОСТОЯННАЯ СКОРОСТЬ!) ===
const SCROLL_PX_PER_SEC = 200

export default function ScrollTopPulse() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('up') // 'up' | 'down'

  const visibleRef = useRef(false)
  const modeRef = useRef('up')
  const lastYRef = useRef(0)
  const dirAccumRef = useRef(0)
  const appearTimerRef = useRef(null)
  const hideTimerRef = useRef(null)

  // === управление анимацией скролла (отмена) ===
  const rafRef = useRef(0)
  const scrollingRef = useRef(false)
  const cancelListenersAttachedRef = useRef(false)

  // хранит текущую цель (для телепорта по повторному клику)
  const teleportTargetGetterRef = useRef(null)

  // режим прокрутки: 'native' | 'raf'
  const scrollEngineRef = useRef('raf')

  const getMaxY = () => {
    const doc = document.documentElement || document.body
    const docHeight = doc.scrollHeight || 0
    const viewportHeight = window.innerHeight || 0
    return Math.max(0, docHeight - viewportHeight)
  }

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

  const isIOS = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    const iOS = /iP(ad|hone|od)/.test(ua)
    // iPadOS 13+ маскируется под Mac, но с touch
    const iPadOS = /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1
    return iOS || iPadOS
  }

  // Жёстко остановить нативный smooth-scroll (iOS особенно)
  const hardStopNativeSmooth = useCallback(() => {
    try {
      const y = window.scrollY || 0
      window.scrollTo({ top: y, behavior: 'auto' })
    } catch {
      // ignore
    }
  }, [])

  // === cancelScroll: стабильный по ссылке ===
  const cancelScroll = useCallback(
    (e) => {
      // если пользователь нажал на саму кнопку — НЕ отменяем здесь,
      // чтобы onClick смог сделать телепорт.
      if (e?.target?.closest?.('.ql7-scroll-top')) return

      if (!scrollingRef.current) return
      scrollingRef.current = false

      // стоп RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }

      // стоп native smooth (важно для iOS)
      hardStopNativeSmooth()

      teleportTargetGetterRef.current = null

      // снять слушатели отмены
      if (cancelListenersAttachedRef.current) {
        cancelListenersAttachedRef.current = false
        window.removeEventListener('wheel', cancelScroll, true)
        window.removeEventListener('touchstart', cancelScroll, true)
        window.removeEventListener('touchmove', cancelScroll, true)
        window.removeEventListener('pointerdown', cancelScroll, true)
        window.removeEventListener('mousedown', cancelScroll, true)
        window.removeEventListener('keydown', cancelScroll, true)
      }
    },
    [hardStopNativeSmooth],
  )

  const attachCancelListeners = useCallback(() => {
    if (cancelListenersAttachedRef.current) return
    cancelListenersAttachedRef.current = true

    // ВАЖНО: ставим именно capture=true (3-й аргумент true),
    // чтобы removeEventListener снял 1-в-1 тем же способом.
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

      const maxY = getMaxY()
      const distanceToBottom = maxY - y

      // если мы почти в самом верху или почти внизу — кнопку прячем
      if (y <= TOP_HIDE_Y || distanceToBottom <= TOP_HIDE_Y) {
        hideNow()
        return
      }

      // === ФИКС ДЁРГАНЬЯ СТРЕЛКИ ===
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

      const confirmedUp = dirAccumRef.current <= -DIR_SWITCH_PX
      const confirmedDown = dirAccumRef.current >= DIR_SWITCH_PX

      if (confirmedUp && y > MIN_Y) {
        if (modeRef.current !== 'up') {
          modeRef.current = 'up'
          setMode('up')
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

      if (confirmedDown && y > MIN_Y) {
        if (modeRef.current !== 'down') {
          modeRef.current = 'down'
          setMode('down')
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
      cancelScroll()
    }
  }, [cancelScroll])

  // ======= ДВИЖОК 1: Native smooth (лучше всего на iOS) =======
  const nativeSmoothScrollTo = (targetYOrGetter) => {
    if (typeof window === 'undefined') return

    cancelScroll()

    const getTargetY =
      typeof targetYOrGetter === 'function'
        ? targetYOrGetter
        : () => targetYOrGetter

    teleportTargetGetterRef.current = getTargetY
    scrollEngineRef.current = 'native'

    const maxY = getMaxY()
    const target = clamp(getTargetY(), 0, maxY)

    scrollingRef.current = true
    attachCancelListeners()

    try {
      window.scrollTo({ top: target, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, target)
    }

    // мониторинг завершения (и “живого” низа если растёт страница)
    const start = performance.now()
    const MAX_RUN_MS = 12000

    const tick = () => {
      if (!scrollingRef.current) return

      const y = window.scrollY || 0
      const newMaxY = getMaxY()
      const desired = clamp(getTargetY(), 0, newMaxY)
      const dist = Math.abs(desired - y)

      // если цель сместилась (страница выросла) — мягко перекидываем native target
      // (без дерготни: редкие корректировки)
      if (dist > 2) {
        // Если мы идём вниз к "живому" низу и он уехал — обновим таргет
        // Чтобы не спамить scrollTo, обновляем не чаще 1 раза в кадр,
        // но в реале это будет редко.
        try {
          window.scrollTo({ top: desired, behavior: 'smooth' })
        } catch {
          window.scrollTo(0, desired)
        }
      }

      if (dist <= 1) {
        scrollingRef.current = false
        hardStopNativeSmooth()
        teleportTargetGetterRef.current = null

        // снять слушатели
        if (cancelListenersAttachedRef.current) {
          cancelListenersAttachedRef.current = false
          window.removeEventListener('wheel', cancelScroll, true)
          window.removeEventListener('touchstart', cancelScroll, true)
          window.removeEventListener('touchmove', cancelScroll, true)
          window.removeEventListener('pointerdown', cancelScroll, true)
          window.removeEventListener('mousedown', cancelScroll, true)
          window.removeEventListener('keydown', cancelScroll, true)
        }

        rafRef.current = 0
        return
      }

      if (performance.now() - start > MAX_RUN_MS) {
        // фейлсейф: добиваем точно
        scrollingRef.current = false
        hardStopNativeSmooth()
        window.scrollTo(0, desired)
        teleportTargetGetterRef.current = null

        if (cancelListenersAttachedRef.current) {
          cancelListenersAttachedRef.current = false
          window.removeEventListener('wheel', cancelScroll, true)
          window.removeEventListener('touchstart', cancelScroll, true)
          window.removeEventListener('touchmove', cancelScroll, true)
          window.removeEventListener('pointerdown', cancelScroll, true)
          window.removeEventListener('mousedown', cancelScroll, true)
          window.removeEventListener('keydown', cancelScroll, true)
        }

        rafRef.current = 0
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  // ======= ДВИЖОК 2: RAF constant-speed (для не-iOS) =======
  const rafSmoothScrollTo = (targetYOrGetter) => {
    if (typeof window === 'undefined') return

    cancelScroll()

    const getTargetY =
      typeof targetYOrGetter === 'function'
        ? targetYOrGetter
        : () => targetYOrGetter

    teleportTargetGetterRef.current = getTargetY
    scrollEngineRef.current = 'raf'

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

      // dt clamp (важно)
      const rawDt = (time - lastTime) / 1000
      const dt = Math.min(Math.max(rawDt, 0.001), 0.028) // чуть жестче, чтобы не было рывков после лагов
      lastTime = time

      const currentY = window.scrollY || 0

      const maxY = getMaxY()
      const targetY = clamp(getTargetY(), 0, maxY)

      const diff = targetY - currentY
      const dist = Math.abs(diff)

      // финиш
      if (dist <= 1) {
        window.scrollTo(0, targetY)
        scrollingRef.current = false
        teleportTargetGetterRef.current = null

        if (cancelListenersAttachedRef.current) {
          cancelListenersAttachedRef.current = false
          window.removeEventListener('wheel', cancelScroll, true)
          window.removeEventListener('touchstart', cancelScroll, true)
          window.removeEventListener('touchmove', cancelScroll, true)
          window.removeEventListener('pointerdown', cancelScroll, true)
          window.removeEventListener('mousedown', cancelScroll, true)
          window.removeEventListener('keydown', cancelScroll, true)
        }

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

  // ======= ЕДИНАЯ ТОЧКА ВХОДА =======
  const smoothScrollTo = (targetYOrGetter) => {
    // iOS = native smooth (самое плавное и без "ряби")
    if (isIOS()) {
      nativeSmoothScrollTo(targetYOrGetter)
      return
    }
    // остальные = RAF constant-speed
    rafSmoothScrollTo(targetYOrGetter)
  }

  // === ТЕЛЕПОРТ: если уже скроллим и жмём кнопку ещё раз — прыгаем в текущую цель ===
  const teleportNowIfScrolling = () => {
    if (!scrollingRef.current) return false

    const getTarget = teleportTargetGetterRef.current
    if (!getTarget) return false

    // мгновенно остановить
    scrollingRef.current = false

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    // стоп native smooth, если он был
    hardStopNativeSmooth()

    // снять слушатели
    if (cancelListenersAttachedRef.current) {
      cancelListenersAttachedRef.current = false
      window.removeEventListener('wheel', cancelScroll, true)
      window.removeEventListener('touchstart', cancelScroll, true)
      window.removeEventListener('touchmove', cancelScroll, true)
      window.removeEventListener('pointerdown', cancelScroll, true)
      window.removeEventListener('mousedown', cancelScroll, true)
      window.removeEventListener('keydown', cancelScroll, true)
    }

    // телепорт к актуальной цели
    const maxY = getMaxY()
    const y = clamp(getTarget(), 0, maxY)
    window.scrollTo(0, y)

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
      // "живой" низ: докрутит даже если страница растёт по пути
      smoothScrollTo(() => getMaxY())
    } catch {
      window.scrollTo(0, getMaxY())
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
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M12 3 L5 12 H10 V21 H14 V12 H19 Z" fill="currentColor" />
          </svg>
        </span>
      </div>

      <style jsx>{`
        .ql7-scroll-top {
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
            radial-gradient(120% 120% at 30% 30%, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 60%),
            radial-gradient(100% 100% at 70% 70%, rgba(0, 200, 255, 0.22), rgba(0, 200, 255, 0) 60%),
            linear-gradient(180deg, rgba(0, 20, 40, 0.98), rgba(0, 8, 18, 0.98)) !important;

          box-shadow:
            0 0 0 1px rgba(0, 229, 255, 0.28) inset,
            0 8px 22px rgba(0, 0, 0, 0.9),
            0 0 22px rgba(0, 229, 255, 0.38) !important;

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
            transform 0.16s ease-out,
            box-shadow 0.22s ease-out,
            background 0.22s ease-out,
            opacity 0.18s ease-out !important;

          animation:
            ql7-stp-pop 0.18s cubic-bezier(0.22, 1, 0.36, 1),
            ql7-stp-pulse 1.8s ease-in-out infinite;
        }

        .ql7-scroll-top .arrow {
          display: block;
          transform: translateY(-1px);
          text-shadow:
            0 0 8px rgba(0, 229, 255, 0.9),
            0 0 18px rgba(0, 229, 255, 0.65);
        }

        .ql7-scroll-top .arrow.arrow-down {
          transform: rotate(180deg) translateY(1px);
        }

        .ql7-scroll-top:hover {
          transform: translateY(-2px) scale(1.06);
          box-shadow:
            0 0 0 1px rgba(56, 189, 248, 0.65) inset,
            0 14px 30px rgba(0, 0, 0, 1),
            0 0 34px rgba(56, 189, 248, 0.9);
        }

        .ql7-scroll-top:active {
          transform: translateY(1px) scale(0.94);
          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.9),
            0 0 18px rgba(0, 229, 255, 0.4);
        }

        @keyframes ql7-stp-pop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes ql7-stp-pulse {
          0% {
            box-shadow:
              0 0 0 1px rgba(0, 229, 255, 0.32) inset,
              0 8px 22px rgba(0, 0, 0, 0.9),
              0 0 16px rgba(0, 229, 255, 0.42);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(148, 233, 255, 0.65) inset,
              0 10px 26px rgba(0, 0, 0, 1),
              0 0 30px rgba(56, 189, 248, 0.95);
          }
          100% {
            box-shadow:
              0 0 0 1px rgba(0, 229, 255, 0.32) inset,
              0 8px 22px rgba(0, 0, 0, 0.9),
              0 0 16px rgba(0, 229, 255, 0.42);
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
