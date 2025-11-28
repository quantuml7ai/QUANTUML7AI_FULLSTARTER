'use client'

import { useEffect, useRef } from 'react'

const DESKTOP_COUNT = 160
const MOBILE_COUNT  = 70

const DESKTOP_MAX_SIZE = 22
const MOBILE_MAX_SIZE  = 16
const MIN_SIZE         = 6

const GRAVITY          = 22      // базовая «гравитация» (px/s²)
const WIND_NOISE       = 8       // боковой шум
const MAX_FPS          = 48      // ограничиваем FPS
const BASE_SCROLL_IMP  = 0.16    // базовый коэффициент порыва от скролла
const BASE_CLICK_IMP   = 380     // базовый импульс от клика
const GUST_DECAY       = 1.8     // затухание порывов (чем больше — тем быстрее)

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

export default function SnowFX({
  zIndex        = 9996,
  fallSpeed     = 1,   // множитель скорости падения
  stormIntensity= 1,   // множитель силы метели / порывов
}) {
  const canvasRef = useRef(null)
  const frameRef  = useRef(0)

  const flakesRef = useRef([])
  const imgRef    = useRef(null)

  const gustRef   = useRef({ vx: 0, vy: 0 })
  const scrollYRef= useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ░░ загрузка текстуры снежинки ░░
    const img = new Image()
    img.src = '/snow/fx.png'
    imgRef.current = img

    let width  = canvas.clientWidth  || window.innerWidth
    let height = canvas.clientHeight || window.innerHeight

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const resize = () => {
      width  = canvas.clientWidth  || window.innerWidth
      height = canvas.clientHeight || window.innerHeight

      canvas.width  = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const mobile = isMobile()
    const count  = mobile ? MOBILE_COUNT : DESKTOP_COUNT
    const maxSize= mobile ? MOBILE_MAX_SIZE : DESKTOP_MAX_SIZE

    // ░░ инициализация снежинок ░░
    const flakes = []
    for (let i = 0; i < count; i += 1) {
      const depth   = 0.4 + Math.random() * 0.6 // 0.4–1.0
      const size    = MIN_SIZE + Math.random() * (maxSize - MIN_SIZE)
      const speedK  = 0.4 + depth * 0.9

      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() * 2 - 1) * 10 * speedK,
        vy: (20 + Math.random() * 20) * speedK,
        size,
        depth,
        // вращение
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() * 0.6 - 0.3) * (0.5 + depth),
        // дальние — темнее
        baseAlpha: 0.35 + depth * 0.55,
      })
    }
    flakesRef.current = flakes

    // ░░ анимация ░░
    let lastT = performance.now()
    const loop = (t) => {
      frameRef.current = requestAnimationFrame(loop)

      const dtMs = t - lastT
      if (dtMs < 1000 / MAX_FPS) return
      lastT = t
      const dt = Math.min(dtMs, 50) / 1000

      ctx.clearRect(0, 0, width, height)

      const imgLocal = imgRef.current
      if (!imgLocal || !imgLocal.complete) {
        return
      }

      // затухание порывов (ветра) → мягкий возврат к естественному падению
      const gust = gustRef.current
      const decay = Math.exp(-GUST_DECAY * dt)
      gust.vx *= decay
      gust.vy *= decay

      const gMul   = fallSpeed || 1
      const sMul   = stormIntensity || 1

      for (let i = 0; i < flakes.length; i += 1) {
        const f = flakes[i]

        // гравитация
        f.vy += GRAVITY * gMul * f.depth * dt

        // базовый шум ветра
        f.vx += (Math.random() * 2 - 1) * WIND_NOISE * sMul * f.depth * dt

        // воздействие глобального порыва
        f.vx += gust.vx * f.depth * dt
        f.vy += gust.vy * f.depth * dt

        // обновление позиции
        f.x += f.vx * dt
        f.y += f.vy * dt

        // вращение
        f.angle += f.spin * dt

        // выход за границы → зацикливаем
        if (f.x < -40) f.x = width + 20
        else if (f.x > width + 40) f.x = -20

        if (f.y > height + 40) {
          f.y  = -30
          f.x  = Math.random() * width
          f.vy = (20 + Math.random() * 30) * (0.4 + f.depth * 0.9)
          f.vx = (Math.random() * 2 - 1) * 10 * (0.4 + f.depth * 0.9)
        }

        // альфа по глубине + лёгкая зависимость от размера (мелкие дальше/тусклее)
        const sizeFactor = (f.size - MIN_SIZE) / (maxSize - MIN_SIZE + 0.0001)
        const farFade    = 0.7 + (1 - sizeFactor) * 0.3
        const alpha      = f.baseAlpha * farFade

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(f.x, f.y)
        ctx.rotate(f.angle)
        const s = f.size
        ctx.drawImage(imgLocal, -s / 2, -s / 2, s, s)
        ctx.restore()
      }
    }

    frameRef.current = requestAnimationFrame(loop)

    // ░░ resize ░░
    const onResize = () => {
      resize()
    }

    window.addEventListener('resize', onResize)

    // ░░ scroll → порыв в сторону движения страницы ░░
    scrollYRef.current = window.scrollY || 0

    const onScroll = () => {
      const y = window.scrollY || 0
      const dy = y - scrollYRef.current
      scrollYRef.current = y

      if (!dy) return

      // если страница идёт вниз → снежинки тоже чуть вниз ускоряем
      // страница идёт вверх → снежинки чуть вверх поддувает
      const dir = dy > 0 ? 1 : -1
      const mag = Math.min(1.5, Math.abs(dy) * 0.02)

      const g = gustRef.current
      g.vy += BASE_SCROLL_IMP * sMul * dir * mag * 120 // чуть усиливаем вертикальный импульс
      // горизонтальный лёгкий шум
      g.vx += (Math.random() * 2 - 1) * BASE_SCROLL_IMP * sMul * mag * 20
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    // ░░ click / tap → локальный «взрыв» ░░
    const onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top

      const radius = Math.min(width, height) * 0.25
      const radius2 = radius * radius

      const powerBase = BASE_CLICK_IMP * (stormIntensity || 1)

      const flakes = flakesRef.current
      for (let i = 0; i < flakes.length; i += 1) {
        const f = flakes[i]
        const dx = f.x - px
        const dy = f.y - py
        const dist2 = dx * dx + dy * dy
        if (dist2 > radius2) continue

        const dist = Math.sqrt(dist2) || 1
        const force = (1 - dist / radius) * powerBase

        const nx = dx / dist
        const ny = dy / dist

        f.vx += nx * force
        f.vy += ny * force * 0.7
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [fallSpeed, stormIntensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  )
}
