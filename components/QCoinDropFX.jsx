// app/components/QCoinDropFX.jsx
'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const isBrowser = () => typeof window !== 'undefined'

// та же логика, что в InviteFriendProvider — единая точка для uid
function readUnifiedAccountId () {
  if (!isBrowser()) return null
  const w = window
  const ls = window.localStorage

  const fromGlobal = w.__AUTH_ACCOUNT__ || w.__ASHER_ID__
  if (fromGlobal) return String(fromGlobal)

  const fromLs =
    ls.getItem('account') ||
    ls.getItem('wallet') ||
    ls.getItem('asherId') ||
    ls.getItem('ql7_uid')

  if (fromLs) return String(fromLs)
  return null
}

/* ===== базовая физика как в SnowFX ===== */

const GRAVITY = 26
const WIND_NOISE = 10
const FRICTION_VX = 0.994
const FRICTION_VY = 0.996

const IMPULSE_DURATION_MS = 1500
const IMPULSE_DAMPING = 0.95

const SCROLL_IMPULSE_BASE = 100
const CLICK_IMPULSE_BASE = 90

const DEFAULT_INTERVAL_MS = 120_000  // раз в минуту
const DEFAULT_MIN_SIZE = 25
const DEFAULT_MAX_SIZE = 50

// === РАНДОМНЫЕ МНОЖИТЕЛИ ДЛЯ КАЖДОЙ МОНЕТЫ ===
// 0x (ничего), 0.2x (в 5 раз меньше), 0.33x (~в 3 раза меньше),
// 0.5x (в 2 раза меньше), 1x, 2x, 3x, 5x
const COIN_MULTIPLIERS = [0, 0.2, 1 / 3, 0.5, 1, 2, 3, 5]

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function QCoinDropFX ({
  intervalMs = DEFAULT_INTERVAL_MS,
  minSize = DEFAULT_MIN_SIZE,
  maxSize = DEFAULT_MAX_SIZE,
}) {
  const [uid, setUid] = useState(() => readUnifiedAccountId())
  const [, setTick] = useState(0)
  const [toast, setToast] = useState(null) // { reward, error, mult }

  const coinRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastTimeRef = useRef(0)
  const worldRef = useRef({ w: 0, h: 0 })
  const spawnAtRef = useRef(0)

  const impulseUntilRef = useRef(0)
  const impulseStrengthRef = useRef(0)
  const motionReducedRef = useRef(false)

  const initWorld = useCallback(() => {
    if (!isBrowser()) return
    worldRef.current = {
      w: window.innerWidth || 1024,
      h: window.innerHeight || 768,
    }
  }, [])

  /* ===== respect prefers-reduced-motion ===== */
  useEffect(() => {
    if (!isBrowser()) return
    try {
      const mq = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)')
      motionReducedRef.current = !!(mq && mq.matches)
    } catch {
      motionReducedRef.current = false
    }
  }, [])

  /* ===== слушаем авторизацию, как в InviteFriendProvider ===== */
  useEffect(() => {
    if (!isBrowser()) return

    const onAuth = () => {
      const acc = readUnifiedAccountId()
      if (acc) {
        setUid(acc)
        const now = (typeof performance !== 'undefined' && performance.now)
          ? performance.now()
          : Date.now()
        spawnAtRef.current = now + intervalMs
      }
    }

    window.addEventListener('auth:ok', onAuth)
    window.addEventListener('auth:success', onAuth)

    // если уже залогинен при монтировании
    const initial = readUnifiedAccountId()
    if (initial) {
      setUid(initial)
      const now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now()
      spawnAtRef.current = now + intervalMs
    }

    return () => {
      window.removeEventListener('auth:ok', onAuth)
      window.removeEventListener('auth:success', onAuth)
    }
  }, [intervalMs])

  /* ===== resize ===== */
  useEffect(() => {
    if (!isBrowser()) return
    initWorld()
    const onResize = () => initWorld()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [initWorld])

  /* ===== главный анимационный луп монеты ===== */
  useEffect(() => {
    if (!isBrowser()) return
    if (motionReducedRef.current) return

    lastTimeRef.current = 0
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

      // плавное затухание импульсов ветра
      const now = ts
      const impulseLeft = Math.max(0, impulseUntilRef.current - now)
      const impulsePhase = Math.min(1, impulseLeft / IMPULSE_DURATION_MS)
      const targetStrength = impulsePhase
      const currentStrength = impulseStrengthRef.current
      impulseStrengthRef.current =
        currentStrength + (targetStrength - currentStrength) * 0.18
      const impulseK = impulseStrengthRef.current

      let coin = coinRef.current

      // спавним монету раз в intervalMs, только для авторизованных
      if (uid && !coin) {
        const nextAt = spawnAtRef.current || 0
        if (!nextAt || ts >= nextAt) {
          const depth = 0.4 + Math.random() * 0.6
          const size = minSize + depth * (maxSize - minSize)
          const baseVy = 60 + 50 * depth

          // === РАНДОМНЫЙ МНОЖИТЕЛЬ ДЛЯ ЭТОЙ МОНЕТЫ ===
          const mult = COIN_MULTIPLIERS[(Math.random() * COIN_MULTIPLIERS.length) | 0]

          coin = {
            id: ts,
            depth,
            size,
            x: Math.random() * w,
            y: -size,
            vx: (Math.random() * 2 - 1) * (10 + 20 * depth),
            vy: baseVy,
            baseVy,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.4 + Math.random() * 1.2,
            swayAmp: 8 + 18 * depth,
            angle: Math.random() * 360,
            spinDir: Math.random() < 0.5 ? -1 : 1,
            spinSpeed: 30 + Math.random() * 50,
            opacity: 0.98,
            exploding: false,

            // множитель награды этой монеты
            mult,
          }

          coinRef.current = coin
          // следующая монета — ещё через intervalMs
          spawnAtRef.current = ts + intervalMs
        }
      }

      if (coin) {
        const f = coin
        const depthFactor = 0.5 + f.depth * 0.7

        // гравитация + лёгкий боковой шум
        f.vy += GRAVITY * depthFactor * dt
        f.vx += (Math.random() * 2 - 1) * WIND_NOISE * dt * depthFactor

        f.vx *= FRICTION_VX
        f.vy *= FRICTION_VY

        // возврат к базовой скорости падения
        const relax = impulseK > 0.01 ? IMPULSE_DAMPING : 0.9
        f.vy = f.vy * relax + f.baseVy * (1 - relax)

        // позиции
        f.x += f.vx * dt
        f.y += f.vy * dt

        // sway + spin
        f.swayPhase += f.swaySpeed * dt
        f.angle += f.spinDir * f.spinSpeed * dt
        if (f.angle > 360) f.angle -= 360
        if (f.angle < 0) f.angle += 360

        const bottom = h + 80
        const left = -80
        const right = w + 80
        if (f.y > bottom || f.x < left || f.x > right) {
          coinRef.current = null
        }
      }

      setTick((x) => (x + 1) & 1023)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      stopped = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [uid, intervalMs, minSize, maxSize, initWorld])

  /* ===== порывы от клика (как в SnowFX, но для одной монеты) ===== */
  useEffect(() => {
    if (!isBrowser()) return
    if (motionReducedRef.current) return

    const onPointerDown = (e) => {
      const coin = coinRef.current
      if (!coin) return
      const { w, h } = worldRef.current
      if (!w || !h) return

      const cx = e.clientX ?? w / 2
      const cy = e.clientY ?? h / 2

      const dx = coin.x - cx
      const dy = coin.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const radius = Math.min(w, h) * 0.4
      if (dist > radius || dist === 0) return

      const depthFactor = 0.6 + coin.depth * 0.8
      const k = (1 - dist / radius) * depthFactor
      const nx = dx / dist
      const ny = dy / dist

      const rnd = 0.85 + Math.random() * 0.4

      coin.vx += nx * CLICK_IMPULSE_BASE * k * rnd
      coin.vy += ny * CLICK_IMPULSE_BASE * k * rnd
      coin.spinSpeed *= 1.05 + Math.random() * 0.08

      const now =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS
      impulseStrengthRef.current = Math.min(
        1,
        impulseStrengthRef.current + 0.6,
      )

      setTick((x) => (x + 1) & 1023)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  /* ===== порывы от скролла (как в SnowFX) ===== */
  useEffect(() => {
    if (!isBrowser()) return
    if (motionReducedRef.current) return

    let lastScrollY = window.scrollY || 0

    const onScroll = () => {
      const y = window.scrollY || 0
      const dy = y - lastScrollY
      lastScrollY = y
      if (!dy) return

      const coin = coinRef.current
      if (!coin) return

      // контент вверх → снежинки/монета вверх, и наоборот
      const contentDir = dy > 0 ? -1 : 1
      const magBase = Math.min(
        SCROLL_IMPULSE_BASE,
        Math.abs(dy) * 2.2,
      )

      const depthFactor = 0.5 + coin.depth * 0.8

      coin.vy += contentDir * magBase * 0.35 * depthFactor
      coin.vx += (Math.random() * 2 - 1) * magBase * 0.16 * depthFactor

      const now =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS
      impulseStrengthRef.current = Math.min(
        1,
        impulseStrengthRef.current + 0.4,
      )

      setTick((x) => (x + 1) & 1023)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ===== клик по монете — зачисляем QCOIN и тост ===== */
  const handleCollect = async (e) => {
    const coin = coinRef.current
    if (!coin || !uid) return

    coin.exploding = true
    setTick((x) => (x + 1) & 1023)

    let rewardFromServer = 0
    let multApplied = 1
    let isError = false

    // множитель этой монеты (если вдруг отсутствует — считаем 1x)
    const mult = Number.isFinite(coin.mult) ? coin.mult : 1

    try {
      const res = await fetch('/api/qcoin/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: uid, multiplier: mult }),
      })
      const data = await res.json().catch(() => null)

      // ✅ сервер теперь возвращает ФИНАЛЬНУЮ награду rewardQcoin (уже с множителем)
      rewardFromServer = Number(data?.rewardQcoin ?? data?.reward ?? 0) || 0

      // ✅ и множитель, который реально применён (сервер мог принудительно сделать x1)
      multApplied = Number(data?.multiplierApplied ?? 1)
      if (!Number.isFinite(multApplied)) multApplied = 1

      const balance = Number(data?.balance ?? 0) || null
      if (Number.isFinite(balance)) {
        try {
          window.dispatchEvent(
            new CustomEvent('qcoin:update', { detail: { balance } }),
          )
        } catch {}
      }
    } catch {
      isError = true
    }

    // ✅ ВАЖНО: НИКАКОГО reward * mult на клиенте больше нет.
    // Показываем ровно то, что реально начислил сервер.
    setToast({
      reward: rewardFromServer,
      error: isError,
      mult: multApplied,
    })

    // чуть ждём, пока отыграет взрыв монеты
    setTimeout(() => {
      coinRef.current = null
      setTick((x) => (x + 1) & 1023)
    }, 600)

    // убираем тост через ~4 секунды
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const coin = coinRef.current
  if (!uid) return null

  // маленький helper для подписи множителя (чтобы красиво)
  const formatMult = (m) => {
    if (m === 0) return 'x0'
    if (m === 1) return 'x1'
    if (m === 2 || m === 3 || m === 5) return `x${m}`
    if (Math.abs(m - 0.5) < 1e-9) return 'x0.5'
    if (Math.abs(m - (1 / 3)) < 1e-6) return 'x0.33'
    if (Math.abs(m - 0.2) < 1e-9) return 'x0.2'
    // fallback
    return `x${Number(m).toFixed(2)}`
  }

  return (
    <>
      {coin && (
        <div className="qdrop-root" style={{ pointerEvents: 'none' }}>
          <div
            className="qdrop-wrap"
            style={{
              transform: `translate3d(${(coin.x + Math.cos(coin.swayPhase) * coin.swayAmp).toFixed(1)}px, ${coin.y.toFixed(1)}px, 0)`,
            }}
          >
            <button
              type="button"
              className={cn('qdrop-coin-btn', coin.exploding && 'is-exploding')}
              onClick={handleCollect}
            >
              <span className="qdrop-coin-img" />
              <span className="qdrop-burst">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={cn('qdrop-particle', `p-${i}`)} />
                ))}
              </span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="qdrop-toast">
          <div className="qdrop-toast-inner">
            <div className="qdrop-toast-title"></div>
            <div className="qdrop-toast-body">
              <span className="qcoinLabel">
                🎉+{toast.reward.toLocaleString('en-US', {
                  maximumFractionDigits: 8,
                  minimumFractionDigits: 0,
                })}{' '}
                QCOIN 🎁
              </span>

              {/* аккуратная подпись множителя (серверный, реально применённый) */}
              <div className="qdrop-mult">{formatMult(toast.mult)}</div>

              {toast.error && (
                <div className="qdrop-toast-error">
                  {tr(
                    'qcoin_drop_toast_error',
                    '(зачисление будет проверено на сервере)',
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .qdrop-root {
          position: fixed;
          inset: 0;
          z-index: 9997;
          overflow: hidden;
        }
        .qdrop-wrap {
          position: absolute;
          will-change: transform;
          pointer-events: none;
        }

        .qdrop-coin-btn {
          position: relative;
          width: ${DEFAULT_MAX_SIZE}px;
          height: ${DEFAULT_MAX_SIZE}px;
          border-radius: 999px;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }

        .qdrop-coin-img {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          background-image: url('/qcoin-32.png');
          background-size: cover;
          background-repeat: no-repeat;
          box-shadow:
            0 0 0 1px rgba(255, 215, 130, 0),
            0 0 26px rgba(255, 211, 90, 0);
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.85));
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .qdrop-coin-btn:hover .qdrop-coin-img {
          transform: scale(1.05);
        }
        .qdrop-coin-btn:active .qdrop-coin-img {
          transform: scale(0.97);
        }

        .qdrop-burst {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .qdrop-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            #fff,
            #ffe680,
            #ffb347
          );
          opacity: 0;
          transform: translate3d(0, 0, 0) scale(0.4);
        }

        .qdrop-coin-btn.is-exploding .qdrop-coin-img {
          animation: qdrop-coin-pop 0.55s ease-out forwards;
        }
        .qdrop-coin-btn.is-exploding .qdrop-particle {
          animation: qdrop-particle 0.7s ease-out forwards;
        }

        /* разлёт частиц по кругу через кастомные смещения */
        .qdrop-particle.p-0 { --dx: 32px;  --dy: -4px; }
        .qdrop-particle.p-1 { --dx: 18px;  --dy: -26px; }
        .qdrop-particle.p-2 { --dx: -8px;  --dy: -32px; }
        .qdrop-particle.p-3 { --dx: -30px; --dy: -14px; }
        .qdrop-particle.p-4 { --dx: -34px; --dy: 10px; }
        .qdrop-particle.p-5 { --dx: -18px; --dy: 26px; }
        .qdrop-particle.p-6 { --dx: 6px;   --dy: 32px; }
        .qdrop-particle.p-7 { --dx: 30px;  --dy: 20px; }
        .qdrop-particle.p-8 { --dx: 20px;  --dy: 0px; }
        .qdrop-particle.p-9 { --dx: 0px;   --dy: -20px; }

        @keyframes qdrop-coin-pop {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.6); opacity: 0; }
        }

        @keyframes qdrop-particle {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.4); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(var(--dx), var(--dy), 0) scale(1.2); }
        }

        /* ✅ тост — ВСЕГДА ПО ЦЕНТРУ ЭКРАНА */
        .qdrop-toast {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 9998;
          pointer-events: none;
        }

        .qdrop-toast-inner {
          min-width: 260px;
          max-width: min(360px, 92vw);
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 187, 0, 0.31);
          background:
            radial-gradient(circle at 0 0, rgba(14, 12, 12, 0.27), transparent 50%),
            rgba(10, 14, 24, 0.62);
          box-shadow: 0 14px 38px rgba(0, 0, 0, 0.21);
          color: #eaf4ff;
          pointer-events: auto;
          animation: qdrop-toast-in 0.22s ease-out forwards;
          text-align: center;
        }

        .qdrop-toast-title {
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .qdrop-toast-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          justify-content: center;
        }

        .qdrop-mult {
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          opacity: 0.9;
          text-transform: uppercase;
        }

        .qdrop-toast-error {
          font-size: 0.8rem;
          opacity: 0.75;
        }

        /* твоя золотая подпись QCOIN */
        .qcoinLabel {
          font-size: 1.6em;
          font-weight: 900;
          letter-spacing: 0.4px;
          background:
            linear-gradient(
              135deg,
              #7a5c00 0%,
              #ffd700 18%,
              #fff4b3 32%,
              #ffd700 46%,
              #ffea80 60%,
              #b38400 74%,
              #ffd700 88%,
              #7a5c00 100%
            );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
          text-shadow:
            0 0 0.3rem rgba(255, 215, 0, 0.35),
            0 0 0.1rem rgba(255, 255, 180, 0.35);
          white-space: nowrap;
        }

        @keyframes qcoinShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @keyframes qcoinGlow {
          0% {
            text-shadow:
              0 0 0.3rem rgba(255, 215, 0, 0.35),
              0 0 0.1rem rgba(255, 255, 180, 0.35);
          }
          50% {
            text-shadow:
              0 0 0.9rem rgba(255, 215, 0, 0.55),
              0 0 0.25rem rgba(255, 255, 190, 0.55);
          }
          100% {
            text-shadow:
              0 0 0.3rem rgba(255, 215, 0, 0.35),
              0 0 0.1remrgba(255, 255, 180, 0.35);
          }
        }

        @keyframes qdrop-toast-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0px); }
        }

        @media (max-width: 480px) {
          .qdrop-toast-inner {
            min-width: 220px;
            max-width: 92vw;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .qdrop-coin-img,
          .qdrop-particle,
          .qcoinLabel,
          .qdrop-toast-inner {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}
