// components/ScrollTopPulse.js
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const APPEAR_DELAY_MS = 800
const AUTO_HIDE_MS    = 2000
const MIN_Y           = 260
const TOP_HIDE_Y      = 40

// === НАСТРОЙКА ПЕРЕКЛЮЧЕНИЯ НАПРАВЛЕНИЯ СТРЕЛКИ ===
// Сколько пикселей "уверенного" движения нужно, чтобы стрелка сменила режим.
// ВАЖНО: чтобы один щелчок колеса (который может дать большой скачок scrollY)
// НЕ переключал мгновенно, мы специально "режем" вклад одного события,
// поэтому переключение требует несколько подряд событий в одну сторону.
// Настраивай это значение под себя (пример: 120–240).
const DIR_SWITCH_PX   = 580

// === НАСТРОЙКА СКОРОСТИ СКРОЛЛА (ПОСТОЯННАЯ СКОРОСТЬ!) ===
// px/сек: меньше = медленнее, больше = быстрее
// Рекомендация для "премиально медленно": 350–650
const SCROLL_PX_PER_SEC = 1000

export default function ScrollTopPulse() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('up') // 'up' | 'down'

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
    // 🔥 КЛЮЧЕВАЯ ФИШКА:
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

      // === ФИКС ДЁРГАНЬЯ СТРЕЛКИ ===
      // 1) Мы накапливаем движение только при стабильном направлении.
      // 2) Мы ограничиваем вклад одного события (wheel tick может быть большим),
      //    чтобы один "щёлчок" колеса не переключал режим мгновенно.
      // 3) Переключаем режим только когда накопили DIR_SWITCH_PX.
      const absDelta = Math.abs(deltaY)
      if (absDelta >= 0.5) {
        const sign = Math.sign(deltaY)

        // если направление изменилось — сбрасываем накопление
        if (dirAccumRef.current !== 0 && Math.sign(dirAccumRef.current) !== sign) {
          dirAccumRef.current = 0
        }

        // режем вклад одного события, чтобы один тик не переворачивал стрелку
        const maxStep = Math.max(6, Math.round(DIR_SWITCH_PX / 3))
        const step = Math.min(absDelta, maxStep) * sign

        dirAccumRef.current += step

        // кап, чтобы не разгонялось бесконечно
        const cap = DIR_SWITCH_PX * 2
        if (dirAccumRef.current > cap) dirAccumRef.current = cap
        if (dirAccumRef.current < -cap) dirAccumRef.current = -cap
      }

      const confirmedUp   = dirAccumRef.current <= -DIR_SWITCH_PX
      const confirmedDown = dirAccumRef.current >=  DIR_SWITCH_PX

      // Движение ВВЕРХ → режим "стрелка вверх / скролл наверх"
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

        if (visibleRef.current) {
          scheduleHide()
        }
        return
      }

      // Движение ВНИЗ → режим "стрелка вниз / скролл вниз"
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

      // на размонтировании — стопаем анимацию и снимаем слушатели
      cancelScroll()
    }
  }, [cancelScroll])

  // === ПОСТОЯННАЯ СКОРОСТЬ + ДОКРУТКА ДО РЕАЛЬНОГО КОНЦА ===
  // targetYOrGetter: число или функция, возвращающая targetY
  const smoothScrollTo = (targetYOrGetter) => {
    if (typeof window === 'undefined') return

    // если уже было запущено — отменяем
    cancelScroll()

    const getTargetY =
      typeof targetYOrGetter === 'function'
        ? targetYOrGetter
        : () => targetYOrGetter

    // сохраним цель для "телепорта" по повторному нажатию
    teleportTargetGetterRef.current = getTargetY

    const speed = Math.max(1, SCROLL_PX_PER_SEC) // px/сек

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

      // dt clamp — чтобы не было скачков скорости после лагов
      const rawDt = (time - lastTime) / 1000
      const dt = Math.min(Math.max(rawDt, 0.001), 0.033)
      lastTime = time

      const currentY = window.scrollY || 0
      const targetY = getTargetY()

      const diff = targetY - currentY
      const dist = Math.abs(diff)

      // финиш
      if (dist <= 0.5) {
        window.scrollTo(0, targetY)
        scrollingRef.current = false
        detachCancelListeners()
        teleportTargetGetterRef.current = null
        rafRef.current = 0
        return
      }

      // шаг строго по скорости
      let move = speed * dt
      if (move < 0.5) move = 0.5

      const applied = Math.min(dist, move)
      const nextY = currentY + Math.sign(diff) * applied

      window.scrollTo(0, nextY)

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }

  // === ТЕЛЕПОРТ: если уже скроллим и жмём кнопку ещё раз — прыгаем в текущую цель ===
  const teleportNowIfScrolling = () => {
    if (!scrollingRef.current) return false

    const getTarget = teleportTargetGetterRef.current
    if (!getTarget) return false

    // мгновенно остановить RAF и снять слушатели
    scrollingRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    detachCancelListeners()

    // телепорт к актуальной цели
    window.scrollTo(0, getTarget())

    teleportTargetGetterRef.current = null
    return true
  }

  const scrollToTop = () => {
    // второй клик во время движения = телепорт
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
    // второй клик во время движения = телепорт
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
      smoothScrollTo(() => {
        const doc = document.documentElement || document.body
        return Math.max(
          0,
          (doc.scrollHeight || 0) - (window.innerHeight || 0),
        )
      })
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
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    aria-hidden="true"
  >
    {/* Стрелка в стиле ⮙: острый треугольник + ножка */}
    <path
      d="M12 3 L5 12 H10 V21 H14 V12 H19 Z"
      fill="currentColor"
    />
  </svg>
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
