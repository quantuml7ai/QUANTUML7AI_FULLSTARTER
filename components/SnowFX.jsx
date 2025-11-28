'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * ❄️ SnowFX — «живая» метель для Quantum L7 AI
 *
 * Ключевые фишки:
 * - Многослойная глубина: ближние — крупнее и ярче, дальние — мельче и тусклее
 * - Каждая снежинка имеет свой спин, свой sway (качание), свои скорости
 * - Порывы от скролла:
 *     • контент идёт вниз → снежинки вниз
 *     • контент идёт вверх → снежинки вверх
 * - Порывы от клика: локальный «взрыв ветра» вокруг курсора/тача
 * - Плавный возврат к гравитации, без резких обрывов
 */

/* ===== БАЗОВАЯ ФИЗИКА ===== */

// базовая «гравитация» (скорость падения) — чем больше, тем быстрее вниз
const GRAVITY = 26

// лёгкий боковой шум, чтобы не летели по одной прямой
const WIND_NOISE = 10

// общее трение, сглаживает скорости (чуть < 1)
const FRICTION_VX = 0.994
const FRICTION_VY = 0.996

/* ===== ПОРЫВЫ ВЕТРА (скролл/клик) ===== */

// сколько живёт один импульс «ветра» (мс)
const IMPULSE_DURATION_MS = 1500

// насколько быстро возвращаемся к базовой скорости падения (0.85–0.97)
const IMPULSE_DAMPING = 0.95

// сила порыва ОТ СКРОЛЛА (вертикаль)
const SCROLL_IMPULSE_BASE = 100   // чем больше — тем сильнее сдувает

// сила порыва ОТ КЛИКА (локальный взрыв)
const CLICK_IMPULSE_BASE  = 90  // уменьши, если хочешь ещё мягче

/* ===== КОЛ-ВО И РАЗМЕРЫ СНЕЖИНОК ===== */

const DEFAULT_COUNT   = 100
const DEFAULT_MINSIZE = 1
const DEFAULT_MAXSIZE = 20

export default function SnowFX({
  zIndex  = 9996,
  count   = DEFAULT_COUNT,
  minSize = DEFAULT_MINSIZE,
  maxSize = DEFAULT_MAXSIZE,
}) {
  // просто «тик», чтобы форсировать перерисовку React
  const [, setTick] = useState(0)

  const flakesRef       = useRef([])
  const animFrameRef    = useRef(null)
  const lastTimeRef     = useRef(0)
  const worldRef        = useRef({ w: 0, h: 0 })
  const lastScrollYRef  = useRef(0)

  // до какого времени импульс ещё считается живым
  const impulseUntilRef  = useRef(0)
  // для более плавного затухания импульса (0..1)
  const impulseStrengthRef = useRef(0)

  const initWorld = () => {
    if (typeof window === 'undefined') return
    worldRef.current = {
      w: window.innerWidth || 1024,
      h: window.innerHeight || 768,
    }
  }

  const respawnFlake = (flake, fromTop = true) => {
    const { w, h } = worldRef.current
    const depth = 0.25 + Math.random() * 0.75
    const size  = minSize + depth * (maxSize - minSize)

    flake.depth = depth
    flake.size  = size

    flake.x = Math.random() * w
    flake.y = fromTop ? (-Math.random() * h * 0.25) : (Math.random() * h)

    const baseVy = 14 + 30 * depth
    flake.baseVy = baseVy
    flake.vx     = (Math.random() * 2 - 1) * (6 + 12 * depth)
    flake.vy     = baseVy

    flake.spinDir   = Math.random() < 0.5 ? -1 : 1
    flake.spinSpeed = 14 + Math.random() * 40
    flake.angle     = Math.random() * 360

    flake.swayPhase = Math.random() * Math.PI * 2
    flake.swaySpeed = 0.4 + Math.random() * 1.2
    flake.swayAmp   = 4 + 12 * depth

    // ближние/крупные — ярче, дальние — тусклее
    flake.opacity = 0.28 + 0.6 * depth
  }

  /* ===== ИНИЦИАЛИЗАЦИЯ СНЕЖИНОК ===== */

  useEffect(() => {
    if (typeof window === 'undefined') return

    initWorld()
    const { w, h } = worldRef.current

    const arr = []
    for (let i = 0; i < count; i += 1) {
      const depth = 0.25 + Math.random() * 0.75
      const size  = minSize + depth * (maxSize - minSize)
      const x     = Math.random() * w
      const y     = Math.random() * h

      const baseVy = 14 + 30 * depth

      arr.push({
        id: i,
        depth,
        size,
        x,
        y,
        vx: (Math.random() * 2 - 1) * (6 + 12 * depth),
        vy: baseVy,
        baseVy,
        spinDir: Math.random() < 0.5 ? -1 : 1,
        spinSpeed: 14 + Math.random() * 40,
        angle: Math.random() * 360,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.4 + Math.random() * 1.2,
        swayAmp: 4 + 12 * depth,
        opacity: 0.28 + 0.6 * depth,
      })
    }

    flakesRef.current = arr
    setTick((x) => x + 1)

    const onResize = () => {
      initWorld()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, minSize, maxSize])

  /* ===== ГЛАВНЫЙ АНИМАЦИОННЫЙ ЛУП ===== */

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!flakesRef.current.length) return

    lastScrollYRef.current = window.scrollY || 0
    lastTimeRef.current    = 0

    let stopped = false

    const loop = (ts) => {
      if (stopped) return

      const { w, h } = worldRef.current
      if (!w || !h) initWorld()

      if (!lastTimeRef.current) {
        lastTimeRef.current = ts
      }

      const dtMs = ts - lastTimeRef.current
      lastTimeRef.current = ts
      const dt = Math.min(0.05, Math.max(0.012, dtMs / 1000))

      const flakes = flakesRef.current
      if (!flakes.length) {
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      const bottom = h + 40
      const left   = -40
      const right  = w + 40

      // плавное затухание импульса (0..1)
      const now = ts
      const impulseLeft = Math.max(0, impulseUntilRef.current - now)
      const impulsePhase = Math.min(1, impulseLeft / IMPULSE_DURATION_MS)
      const targetStrength = impulsePhase
      const currentStrength = impulseStrengthRef.current
      // сглаженный переход к нужной силе
      impulseStrengthRef.current =
        currentStrength + (targetStrength - currentStrength) * 0.18

      const impulseK = impulseStrengthRef.current

      for (let i = 0; i < flakes.length; i += 1) {
        const f = flakes[i]
        const depthFactor = 0.4 + f.depth * 0.6

        // базовая гравитация
        f.vy += GRAVITY * depthFactor * dt

        // лёгкий боковой шум
        f.vx += (Math.random() * 2 - 1) * WIND_NOISE * dt * depthFactor

        // подавляем «бешенство» скоростей
        f.vx *= FRICTION_VX
        f.vy *= FRICTION_VY

        // плавный возврат к базовой скорости падения
        // чем меньше impulseK, тем сильнее возвращаем к baseVy
        const relax = impulseK > 0.01 ? IMPULSE_DAMPING : 0.9
        f.vy = f.vy * relax + f.baseVy * (1 - relax)

        // обновляем позицию
        f.x += f.vx * dt
        f.y += f.vy * dt

        // лёгкое покачивание
        f.swayPhase += f.swaySpeed * dt

        // вращение вокруг своей оси
        f.angle += f.spinDir * f.spinSpeed * dt
        if (f.angle > 360) f.angle -= 360
        if (f.angle < 0)   f.angle += 360

        // ушли за границы — спавним сверху
        if (f.y > bottom || f.x < left || f.x > right) {
          respawnFlake(f, true)
        }
      }

      setTick((x) => x + 1)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      stopped = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  /* ===== КЛИК: ЛОКАЛЬНЫЙ ВЗРЫВ ВЕТРА ВОКРУГ ТАЧА/КУРСОРА ===== */

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onPointerDown = (e) => {
      const flakes = flakesRef.current
      if (!flakes.length) return
      const { w, h } = worldRef.current
      if (!w || !h) return

      const cx = e.clientX ?? w / 2
      const cy = e.clientY ?? h / 2

      const radius    = Math.min(w, h) * 0.34
      const basePower = CLICK_IMPULSE_BASE

      for (let i = 0; i < flakes.length; i += 1) {
        const f = flakes[i]
        const dx = f.x - cx
        const dy = f.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > radius || dist === 0) continue

        const depthFactor = 0.5 + f.depth * 0.7
        const k  = (1 - dist / radius) * depthFactor
        const nx = dx / dist
        const ny = dy / dist

        const rnd = 0.85 + Math.random() * 0.4

        // разлёт от точки клика — как веником по снегу
        f.vx += nx * basePower * k * rnd
        f.vy += ny * basePower * k * rnd

        // чуть ускоряем вращение
        f.spinSpeed *= 1.04 + Math.random() * 0.08
      }

      const now =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS

      // сразу даём пику импульса
      impulseStrengthRef.current = Math.min(
        1,
        impulseStrengthRef.current + 0.6,
      )

      setTick((x) => x + 1)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  /* ===== СКРОЛЛ: ПОРЫВЫ В НАПРАВЛЕНИИ ДВИЖЕНИЯ ПАНЕЛЕЙ ===== */

  useEffect(() => {
    if (typeof window === 'undefined') return

    lastScrollYRef.current = window.scrollY || 0

    const onScroll = () => {
      const y    = window.scrollY || 0
      const last = lastScrollYRef.current
      lastScrollYRef.current = y

      const dy = y - last
      if (!dy) return

      const flakes = flakesRef.current
      if (!flakes.length) return

      /**
       * ВАЖНО:
       *  - dy > 0 → скроллим вниз (ползунок вниз), контент визуально едет ВВЕРХ
       *  - dy < 0 → скроллим вверх, контент визуально едет ВНИЗ
       *
       * Ты просил: «в которую сторону двигается страница/панель — туда же дуть снежинки».
       * Значит:
       *  - контент вверх  → снежинки вверх
       *  - контент вниз  → снежинки вниз
       *
       * Контент-движение = -sign(dy)
       */
      const contentDir = dy > 0 ? -1 : 1 // +1 = визуально вниз, -1 = визуально вверх

      // мягкий коэффициент силы порыва
      const magBase = Math.min(
        SCROLL_IMPULSE_BASE,
        Math.abs(dy) * 2.2,
      )

      for (let i = 0; i < flakes.length; i += 1) {
        const f = flakes[i]
        const depthFactor = 0.4 + f.depth * 0.8

        // вертикальный «пинок» в сторону движения панелей
        f.vy += contentDir * magBase * 0.35 * depthFactor

        // небольшой боковой снос
        f.vx += (Math.random() * 2 - 1) * magBase * 0.16 * depthFactor
      }

      const now =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS

      // добавляем силу импульса поверх существующей
      impulseStrengthRef.current = Math.min(
        1,
        impulseStrengthRef.current + 0.4,
      )

      setTick((x) => x + 1)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const flakes = flakesRef.current
  if (!flakes.length) return null

  return (
    <div
      className="ql7-snowfx-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {flakes.map((f) => {
        const swayX = Math.cos(f.swayPhase) * f.swayAmp
        return (
          <div
            key={f.id}
            className="ql7-snowflake-wrap"
            style={{
              transform: `translate3d(${(f.x + swayX).toFixed(
                1,
              )}px, ${f.y.toFixed(1)}px, 0)`,
            }}
          >
            <div
              className="ql7-snowflake"
              style={{
                width: `${f.size}px`,
                height: `${f.size}px`,
                opacity: f.opacity,
                transform: `rotate(${f.angle.toFixed(1)}deg)`,
              }}
            />
          </div>
        )
      })}

      <style jsx>{`
        .ql7-snowfx-root {
          pointer-events: none;
        }

        .ql7-snowflake-wrap {
          position: absolute;
          will-change: transform;
        }

        .ql7-snowflake {
          background-image: url('/snow/fx.png');
          background-size: cover;
          background-repeat: no-repeat;
          transform-origin: center center;
          will-change: transform, opacity;
        }

        @media (max-width: 640px) {
          .ql7-snowflake {
            filter: blur(0.4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ql7-snowflake-wrap {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
