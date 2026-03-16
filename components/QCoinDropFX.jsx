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

const DEFAULT_INTERVAL_MS = 120_000
const DEFAULT_MIN_SIZE = 25
const DEFAULT_MAX_SIZE = 50

/* ===== УМНЫЕ МНОЖИТЕЛИ (ТОЛЬКО В ПЛЮС, ДО x100) ===== */
const ENV_BASE_MULT = (() => {
  const raw = (typeof process !== 'undefined' && process?.env)
    ? (process.env.NEXT_PUBLIC_QCOIN_DROP_BASE_MULT || process.env.NEXT_PUBLIC_QCOIN_BASE_MULT || '1')
    : '1'
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1
})()

const ENV_MAX_MULT = (() => {
  const raw = (typeof process !== 'undefined' && process?.env)
    ? (process.env.NEXT_PUBLIC_QCOIN_DROP_MAX_MULT || process.env.NEXT_PUBLIC_QCOIN_MAX_MULT || '100')
    : '100'
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 100
})()

function getEffectiveMultRange () {
  let base = Number.isFinite(ENV_BASE_MULT) ? ENV_BASE_MULT : 1
  let max = Number.isFinite(ENV_MAX_MULT) ? ENV_MAX_MULT : 100

  base = Math.max(1, Math.floor(base))
  max = Math.max(1, Math.floor(max))

  // критический фикс: при max=1 всегда будет x1
  if (max < 2) max = 100
  if (max <= base) max = Math.max(100, base + 1)

  return { base, max }
}

const clampInt = (v, a, b) => Math.max(a, Math.min(b, (v | 0)))

// ✅ крипто-рандом + fallback
function rng () {
  if (!isBrowser()) return Math.random()
  const c = window.crypto || window.msCrypto
  if (c && c.getRandomValues) {
    const u = new Uint32Array(1)
    c.getRandomValues(u)
    return (u[0] >>> 0) / 4294967296
  }
  return Math.random()
}
const rand = (a = 0, b = 1) => a + rng() * (b - a)
const randInt = (a, b) => (a + ((rng() * (b - a + 1)) | 0))

/**
 * ✅ АНТИ-ПОВТОРЫ (в т.ч. после перезагрузки)
 */
const MULT_HIST_KEY = 'qdrop_mult_hist_v1'
const MULT_HIST_MAX = 9
const MULT_HIST_TTL_MS = 1000 * 60 * 60 * 24

function readMultHist () {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(MULT_HIST_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const now = Date.now()
    const arr = Array.isArray(parsed) ? parsed : []
    return arr
      .filter((x) => x && Number.isFinite(x.m) && Number.isFinite(x.t) && (now - x.t) <= MULT_HIST_TTL_MS)
      .slice(-MULT_HIST_MAX)
  } catch {
    return []
  }
}

function writeMultHist (m) {
  if (!isBrowser()) return
  try {
    const now = Date.now()
    const prev = readMultHist()
    const next = [...prev, { m: Math.floor(m), t: now }].slice(-MULT_HIST_MAX)
    window.localStorage.setItem(MULT_HIST_KEY, JSON.stringify(next))
  } catch {}
}

/**
 * ✅ РАНДОМ:
 * - x1 ультра-редкий
 * - чаще до x50
 * - реже 51..80
 * - очень редко 81..99
 * - 0.2% x100
 */
function pickSmartMultiplier (base = 1, max = 100) {
  const lo = Math.max(1, Math.floor(base))
  const hi = Math.max(lo, Math.floor(max))
  if (lo === hi) return lo

  const hist = readMultHist().map((x) => x.m)
  const inHist = (v) => hist.includes(v)

  const pickOnce = () => {
    if (lo === 1 && rng() < 0.006) return 1

    const lowMain = Math.max(lo, 2)
    const hi50 = Math.min(hi, 50)
    const hi80 = Math.min(hi, 80)
    const hi99 = Math.min(hi, 99)

    if (hi <= 50) {
      if (lowMain > hi) return clampInt(lo, lo, hi)
      const u = (rng() + rng()) / 2
      const span = Math.max(1, hi - lowMain)
      return clampInt(lowMain + Math.floor(u * (span + 1)), lowMain, hi)
    }

    const u = rng()

    if (u < 0.90 && lowMain <= hi50) {
      const v = (rng() + rng()) / 2
      const span = Math.max(1, hi50 - lowMain)
      return clampInt(lowMain + Math.floor(v * (span + 1)), lowMain, hi50)
    }

    if (u < 0.98 && hi >= 51) {
      const a = Math.max(lo, 51)
      const b = Math.max(a, hi80)
      const v = (rng() + rng() + rng()) / 3
      const span = Math.max(1, b - a)
      return clampInt(a + Math.floor(v * (span + 1)), a, b)
    }

    if (u < 0.998 && hi >= 81) {
      const a = Math.max(lo, 81)
      const b = Math.max(a, hi99)
      const v = (rng() + rng() + rng()) / 3
      const span = Math.max(1, b - a)
      return clampInt(a + Math.floor(v * (span + 1)), a, b)
    }

    if (hi >= 100) return 100

    const a = Math.max(lo, hi - 3)
    return randInt(a, hi)
  }

  let chosen = null
  for (let i = 0; i < 16; i++) {
    const v = pickOnce()
    if (!inHist(v)) {
      chosen = v
      break
    }
    const bump = (rng() < 0.5 ? -1 : 1) * (1 + ((rng() * 3) | 0))
    const vb = clampInt(v + bump, lo, hi)
    if (!inHist(vb)) {
      chosen = vb
      break
    }
  }
  if (chosen == null) chosen = pickOnce()

  writeMultHist(chosen)
  return chosen
}

function getTierByMult (m) {
  const mm = Number(m) || 1
  if (mm >= 100) return 'JACKPOT'
  if (mm >= 50) return 'MYTHIC'
  if (mm >= 25) return 'LEGENDARY'
  if (mm >= 12) return 'EPIC'
  if (mm >= 6) return 'RARE'
  if (mm >= 3) return 'UNCOMMON'
  return 'COMMON'
}

function buildFxPack (tier) {
  const confN =
    tier === 'JACKPOT' ? 110 :
    tier === 'MYTHIC' ? 90 :
    tier === 'LEGENDARY' ? 70 :
    tier === 'EPIC' ? 52 :
    tier === 'RARE' ? 36 :
    tier === 'UNCOMMON' ? 26 : 18

  const coinN =
    tier === 'JACKPOT' ? 46 :
    tier === 'MYTHIC' ? 38 :
    tier === 'LEGENDARY' ? 30 :
    tier === 'EPIC' ? 22 :
    tier === 'RARE' ? 14 :
    tier === 'UNCOMMON' ? 10 : 8

  const sparkN =
    tier === 'JACKPOT' ? 34 :
    tier === 'MYTHIC' ? 28 :
    tier === 'LEGENDARY' ? 22 :
    tier === 'EPIC' ? 16 :
    tier === 'RARE' ? 12 :
    tier === 'UNCOMMON' ? 10 : 8

  const confetti = Array.from({ length: confN }).map((_, i) => {
    const x = rand(0, 100)
    const drift = rand(-22, 22)
    const rot = rand(0, 360)
    const delay = rand(0, 0.12)
    const dur = rand(0.9, tier === 'JACKPOT' ? 1.55 : 1.25)
    const size = rand(6, 11)
    const wiggle = rand(120, 320)
    const shape = rng() < 0.55 ? 'strip' : 'dot'
    return { i, x, drift, rot, delay, dur, size, wiggle, shape }
  })

  const coins = Array.from({ length: coinN }).map((_, i) => {
    const a = rand(0, Math.PI * 2)
    const sp = rand(
      tier === 'COMMON' ? 160 : 220,
      tier === 'JACKPOT' ? 560 : 420,
    )
    const vx = Math.cos(a) * sp
    const vy = Math.sin(a) * sp - rand(160, 320)
    const rot = rand(0, 360)
    const delay = rand(0, 0.08)
    const dur = rand(0.75, tier === 'JACKPOT' ? 1.25 : 1.05)
    const scale = rand(0.45, tier === 'JACKPOT' ? 1.1 : 0.95)
    return { i, vx, vy, rot, delay, dur, scale }
  })

  const sparks = Array.from({ length: sparkN }).map((_, i) => {
    const a = rand(0, Math.PI * 2)
    const d = rand(26, tier === 'JACKPOT' ? 160 : 120)
    const dx = Math.cos(a) * d
    const dy = Math.sin(a) * d
    const delay = rand(0, 0.08)
    const dur = rand(0.45, tier === 'JACKPOT' ? 0.95 : 0.75)
    const s = rand(6, 14)
    return { i, dx, dy, delay, dur, s }
  })

  return { confetti, coins, sparks }
}

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function QCoinDropFX ({
  intervalMs = DEFAULT_INTERVAL_MS,
  minSize = DEFAULT_MIN_SIZE,
  maxSize = DEFAULT_MAX_SIZE,
}) {
  const [uid, setUid] = useState(() => readUnifiedAccountId())
  const [, setTick] = useState(0)
  const [toast, setToast] = useState(null) // { reward, error, mult }
  const [fx, setFx] = useState(null) // { id, tier, mult, pack }

  const [typed, setTyped] = useState({ title: '', reward: '', mult: '' })

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

  useEffect(() => {
    if (!isBrowser()) return
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
      motionReducedRef.current = !!(mq && mq.matches)
    } catch {
      motionReducedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isBrowser()) return

    const onAuth = () => {
      const acc = readUnifiedAccountId()
      if (acc) {
        setUid(acc)
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        spawnAtRef.current = now + intervalMs
      }
    }

    window.addEventListener('auth:ok', onAuth)
    window.addEventListener('auth:success', onAuth)

    const initial = readUnifiedAccountId()
    if (initial) {
      setUid(initial)
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      spawnAtRef.current = now + intervalMs
    }

    return () => {
      window.removeEventListener('auth:ok', onAuth)
      window.removeEventListener('auth:success', onAuth)
    }
  }, [intervalMs])

  useEffect(() => {
    if (!isBrowser()) return
    initWorld()
    const onResize = () => initWorld()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [initWorld])

  useEffect(() => {
    if (!isBrowser()) return
    if (motionReducedRef.current) return

    lastTimeRef.current = 0
    let stopped = false

    const loop = (ts) => {
      if (stopped) return

      const { w, h } = worldRef.current
      if (!w || !h) initWorld()

      if (!lastTimeRef.current) lastTimeRef.current = ts

      const dtMs = ts - lastTimeRef.current
      lastTimeRef.current = ts
      const dt = Math.min(0.05, Math.max(0.012, dtMs / 1000))

      const now = ts
      const impulseLeft = Math.max(0, impulseUntilRef.current - now)
      const impulsePhase = Math.min(1, impulseLeft / IMPULSE_DURATION_MS)
      const targetStrength = impulsePhase
      const currentStrength = impulseStrengthRef.current
      impulseStrengthRef.current =
        currentStrength + (targetStrength - currentStrength) * 0.18
      const impulseK = impulseStrengthRef.current

      let coin = coinRef.current

      if (uid && !coin) {
        const nextAt = spawnAtRef.current || 0
        if (!nextAt || ts >= nextAt) {
          const depth = 0.4 + rng() * 0.6
          const size = minSize + depth * (maxSize - minSize)
          const baseVy = 60 + 50 * depth

          const { base, max } = getEffectiveMultRange()
          const mult = pickSmartMultiplier(base, max)

          coin = {
            id: ts,
            depth,
            size,
            x: rng() * w,
            y: -size,
            vx: (rng() * 2 - 1) * (10 + 20 * depth),
            vy: baseVy,
            baseVy,
            swayPhase: rng() * Math.PI * 2,
            swaySpeed: 0.4 + rng() * 1.2,
            swayAmp: 8 + 18 * depth,
            angle: rng() * 360,
            spinDir: rng() < 0.5 ? -1 : 1,
            spinSpeed: 30 + rng() * 50,
            opacity: 0.98,
            exploding: false,
            mult,
          }

          coinRef.current = coin
          spawnAtRef.current = ts + intervalMs
        }
      }

      if (coin) {
        const f = coin
        const depthFactor = 0.5 + f.depth * 0.7

        f.vy += GRAVITY * depthFactor * dt
        f.vx += (rng() * 2 - 1) * WIND_NOISE * dt * depthFactor

        f.vx *= FRICTION_VX
        f.vy *= FRICTION_VY

        const relax = impulseK > 0.01 ? IMPULSE_DAMPING : 0.9
        f.vy = f.vy * relax + f.baseVy * (1 - relax)

        f.x += f.vx * dt
        f.y += f.vy * dt

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
      if (!stopped) animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      stopped = true
      const rafId = animFrameRef.current
      animFrameRef.current = null
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [uid, intervalMs, minSize, maxSize, initWorld])

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

      const rnd = 0.85 + rng() * 0.4

      coin.vx += nx * CLICK_IMPULSE_BASE * k * rnd
      coin.vy += ny * CLICK_IMPULSE_BASE * k * rnd
      coin.spinSpeed *= 1.05 + rng() * 0.08

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS
      impulseStrengthRef.current = Math.min(1, impulseStrengthRef.current + 0.6)

      setTick((x) => (x + 1) & 1023)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

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

      const contentDir = dy > 0 ? -1 : 1
      const magBase = Math.min(SCROLL_IMPULSE_BASE, Math.abs(dy) * 2.2)

      const depthFactor = 0.5 + coin.depth * 0.8

      coin.vy += contentDir * magBase * 0.35 * depthFactor
      coin.vx += (rng() * 2 - 1) * magBase * 0.16 * depthFactor

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      impulseUntilRef.current = now + IMPULSE_DURATION_MS
      impulseStrengthRef.current = Math.min(1, impulseStrengthRef.current + 0.4)

      setTick((x) => (x + 1) & 1023)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const formatMult = (m) => {
    const mm = Math.max(1, Math.floor(Number(m) || 1))
    return `x${mm}`
  }

  const tierTitle = (m) => {
    const t = getTierByMult(m)
    if (t === 'JACKPOT') return 'JACKPOT!'
    if (t === 'MYTHIC') return 'MYTHIC!'
    if (t === 'LEGENDARY') return 'LEGENDARY!'
    if (t === 'EPIC') return 'EPIC!'
    if (t === 'RARE') return 'RARE!'
    if (t === 'UNCOMMON') return 'NICE!'
    return ''
  }

  useEffect(() => {
    if (!toast) {
      setTyped({ title: '', reward: '', mult: '' })
      return
    }

    const fullTitle = tierTitle(toast.mult)
    const fullReward = `🎉+${toast.reward.toLocaleString('en-US', {
      maximumFractionDigits: 8,
      minimumFractionDigits: 0,
    })} QCoin 🎁`
    const fullMult = formatMult(toast.mult)

    setTyped({
      title: fullTitle ? fullTitle.slice(0, 1) : '',
      reward: fullReward.slice(0, 1),
      mult: fullMult.slice(0, 1),
    })

    if (motionReducedRef.current) {
      setTyped({ title: fullTitle, reward: fullReward, mult: fullMult })
      return
    }

    let cancelled = false
    let tId = null

    const seq = [
      { key: 'title', text: fullTitle, speed: 26 },
      { key: 'reward', text: fullReward, speed: 14 },
      { key: 'mult', text: fullMult, speed: 22 },
    ]

    let si = 0
    let pos = 0
    let cur = { title: '', reward: '', mult: '' }

    const step = () => {
      if (cancelled) return
      const s = seq[si]
      if (!s) return

      if (!s.text) {
        si += 1
        pos = 0
        tId = setTimeout(step, 40)
        return
      }

      pos = Math.min(s.text.length, pos + 1)
      cur = { ...cur, [s.key]: s.text.slice(0, pos) }
      setTyped(cur)

      if (pos >= s.text.length) {
        si += 1
        pos = 0
        tId = setTimeout(step, 90)
        return
      }

      tId = setTimeout(step, s.speed)
    }

    tId = setTimeout(step, 40)

    return () => {
      cancelled = true
      if (tId) clearTimeout(tId)
    }
  }, [toast])

  /**
   * ✅ БОЕВОЙ ФИКС НАГРАДЫ И МНОЖИТЕЛЯ:
   * - UI множитель: всегда монетный, если сервер вернул 1
   * - UI награда: если сервер вернул "базу" (multiplierApplied=1), а монета >1 — умножаем для отображения
   */
  const handleCollect = async (e) => {
    const coin = coinRef.current
    if (!coin || !uid) return

    coin.exploding = true
    setTick((x) => (x + 1) & 1023)

    const coinMult = Number.isFinite(coin.mult) ? Math.max(1, Math.floor(coin.mult)) : 1

    let rewardFromServer = 0
    let multApplied = 1
    let isError = false
    let baseRewardMaybe = null

    try {
      const res = await fetch('/api/qcoin/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: uid, multiplier: coinMult }),
      })
      const data = await res.json().catch(() => null)

      // награда от сервера (как есть)
      rewardFromServer = Number(data?.rewardQcoin ?? data?.reward ?? 0) || 0

      // если сервер иногда отдаёт "базу" отдельным полем — поддержим сразу
      baseRewardMaybe = Number(
        data?.rewardBase ??
        data?.rewardUnmultiplied ??
        data?.rewardBeforeMultiplier ??
        data?.baseReward ??
        NaN
      )
      if (!Number.isFinite(baseRewardMaybe)) baseRewardMaybe = null

      multApplied = Number(data?.multiplierApplied ?? 1)
      if (!Number.isFinite(multApplied)) multApplied = 1
      multApplied = Math.max(1, Math.floor(multApplied))

      const balance = Number(data?.balance ?? 0) || null
      if (Number.isFinite(balance)) {
        try {
          window.dispatchEvent(new CustomEvent('qcoin:update', { detail: { balance } }))
        } catch {}
      }
    } catch {
      isError = true
    }

    // UI множитель: если сервер не применил — показываем монетный
    const uiMult = (multApplied === 1 && coinMult > 1) ? coinMult : multApplied

    // UI награда:
    // 1) если сервер дал baseReward отдельным полем — умножаем
    // 2) иначе: если server multApplied=1, но монета >1 — считаем что rewardFromServer = база, умножаем
    // 3) иначе — доверяем серверу (скорее всего уже умножено)
    let uiReward = rewardFromServer

    if (baseRewardMaybe != null && uiMult > 1) {
      uiReward = baseRewardMaybe * uiMult
    } else if (multApplied === 1 && coinMult > 1 && rewardFromServer > 0) {
      uiReward = rewardFromServer * coinMult
    }

    if (!Number.isFinite(uiReward) || uiReward < 0) uiReward = 0

    setToast({
      reward: uiReward,
      error: isError,
      mult: uiMult,
    })

    if (!motionReducedRef.current) {
      const tier = getTierByMult(uiMult)
      const pack = buildFxPack(tier)
      const id = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      setFx({ id, tier, mult: uiMult, pack })

      setTimeout(() => {
        setFx((prev) => (prev && prev.id === id ? null : prev))
      }, tier === 'JACKPOT' ? 1900 : 1500)
    }

    setTimeout(() => {
      coinRef.current = null
      setTick((x) => (x + 1) & 1023)
    }, 600)

    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const coin = coinRef.current
  if (!uid) return null

  const toastTitle = toast ? (typed.title || tierTitle(toast.mult)) : ''
  const toastReward = toast
    ? (typed.reward || `🎉+${toast.reward.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 0 })} QCoin 🎁`)
    : ''
  const toastMult = toast ? (typed.mult || formatMult(toast.mult)) : ''

  return (
    <>
      {fx && (
        <div className={cn('qdrop-fx', `tier-${fx.tier}`)} aria-hidden="true">
          <div className="qdrop-fx-flash" />
          <div className="qdrop-fx-shockwave" />
          <div className="qdrop-fx-coreglow" />

          <div className="qdrop-fx-sparks">
            {fx.pack.sparks.map((p) => (
              <span
                key={`s${p.i}`}
                className="qdrop-fx-spark"
                style={{
                  '--dx': `${p.dx.toFixed(1)}px`,
                  '--dy': `${p.dy.toFixed(1)}px`,
                  '--d': `${p.dur.toFixed(2)}s`,
                  '--dl': `${p.delay.toFixed(2)}s`,
                  '--sz': `${p.s.toFixed(1)}px`,
                }}
              />
            ))}
          </div>

          <div className="qdrop-fx-coins">
            {fx.pack.coins.map((c) => (
              <span
                key={`c${c.i}`}
                className="qdrop-fx-coin"
                style={{
                  '--vx': `${c.vx.toFixed(1)}px`,
                  '--vy': `${c.vy.toFixed(1)}px`,
                  '--rot': `${c.rot.toFixed(1)}deg`,
                  '--d': `${c.dur.toFixed(2)}s`,
                  '--dl': `${c.delay.toFixed(2)}s`,
                  '--sc': `${c.scale.toFixed(2)}`,
                }}
              />
            ))}
          </div>

          <div className="qdrop-fx-confetti">
            {fx.pack.confetti.map((c) => (
              <span
                key={`f${c.i}`}
                className={cn('qdrop-fx-conf', c.shape === 'dot' ? 'is-dot' : 'is-strip')}
                style={{
                  '--x': `${c.x.toFixed(2)}vw`,
                  '--dr': `${c.drift.toFixed(1)}vw`,
                  '--rot': `${c.rot.toFixed(1)}deg`,
                  '--d': `${c.dur.toFixed(2)}s`,
                  '--dl': `${c.delay.toFixed(2)}s`,
                  '--sz': `${c.size.toFixed(1)}px`,
                  '--wg': `${c.wiggle.toFixed(1)}deg`,
                }}
              />
            ))}
          </div>

          <div className="qdrop-fx-badge">
            <span className="qdrop-fx-badge-inner">
              {tierTitle(fx.mult)} {formatMult(fx.mult)}
            </span>
          </div>
        </div>
      )}

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
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className={cn('qdrop-particle', `p-${i}`)} />
                ))}
              </span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="qdrop-toast">
          <div className={cn('qdrop-toast-inner', `tier-${getTierByMult(toast.mult)}`)}>
            <div className="qdrop-toast-title">{toastTitle}</div>

            <div className="qdrop-toast-body">
              <span className="qcoinLabel">{toastReward}</span>
              <div className="qdrop-mult">{toastMult}</div>

              {toast.error && (
                <div className="qdrop-toast-error">
                  {tr('qcoin_drop_toast_error', '(зачисление будет проверено на сервере)')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Стили — как у тебя (оставлены без изменений) */
        .qdrop-root { position: fixed; inset: 0; z-index: 9997; overflow: hidden; }
        .qdrop-wrap { position: absolute; will-change: transform; pointer-events: none; }

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
          box-shadow: 0 0 0 1px rgba(255, 215, 130, 0), 0 0 26px rgba(255, 211, 90, 0);
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.85));
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .qdrop-coin-btn:hover .qdrop-coin-img { transform: scale(1.05); }
        .qdrop-coin-btn:active .qdrop-coin-img { transform: scale(0.97); }

        .qdrop-burst { position: absolute; inset: 0; pointer-events: none; }

        .qdrop-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, #fff, #ffe680, #ffb347);
          opacity: 0;
          transform: translate3d(0, 0, 0) scale(0.4);
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.35));
        }

        .qdrop-coin-btn.is-exploding .qdrop-coin-img { animation: qdrop-coin-pop 0.55s ease-out forwards; }
        .qdrop-coin-btn.is-exploding .qdrop-particle { animation: qdrop-particle 0.78s ease-out forwards; }

        .qdrop-particle.p-0 { --dx: 36px;  --dy: -6px; }
        .qdrop-particle.p-1 { --dx: 22px;  --dy: -30px; }
        .qdrop-particle.p-2 { --dx: -10px; --dy: -36px; }
        .qdrop-particle.p-3 { --dx: -34px; --dy: -16px; }
        .qdrop-particle.p-4 { --dx: -38px; --dy: 12px; }
        .qdrop-particle.p-5 { --dx: -22px; --dy: 30px; }
        .qdrop-particle.p-6 { --dx: 8px;   --dy: 36px; }
        .qdrop-particle.p-7 { --dx: 34px;  --dy: 22px; }
        .qdrop-particle.p-8 { --dx: 26px;  --dy: 2px; }
        .qdrop-particle.p-9 { --dx: 2px;   --dy: -26px; }
        .qdrop-particle.p-10 { --dx: 18px;  --dy: 34px; }
        .qdrop-particle.p-11 { --dx: -18px; --dy: 34px; }
        .qdrop-particle.p-12 { --dx: 40px;  --dy: -22px; }
        .qdrop-particle.p-13 { --dx: -40px; --dy: -22px; }
        .qdrop-particle.p-14 { --dx: 0px;   --dy: 42px; }
        .qdrop-particle.p-15 { --dx: 0px;   --dy: -42px; }

        @keyframes qdrop-coin-pop {
          0% { transform: scale(1); opacity: 1; }
          35% { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 10px 22px rgba(255,210,120,0.25)); }
          100% { transform: scale(0.55); opacity: 0; }
        }

        @keyframes qdrop-particle {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.4); }
          12% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(var(--dx), var(--dy), 0) scale(1.35); }
        }

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
          background: radial-gradient(circle at 0 0, rgba(14, 12, 12, 0.27), transparent 50%), rgba(10, 14, 24, 0.62);
          box-shadow: 0 14px 38px rgba(0, 0, 0, 0.21);
          color: #eaf4ff;
          pointer-events: auto;
          text-align: center;
          animation: qdrop-toast-flow 3.85s ease-out forwards;
        }

        .qdrop-toast-title {
          font-weight: 950;
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
          min-height: 1.2em;
          filter: drop-shadow(0 10px 18px rgba(0,0,0,0.35));
        }

        .qdrop-toast-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          justify-content: center;
          min-height: 3.6em;
        }

        .qdrop-mult {
          font-size: 0.95rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          opacity: 0.92;
          text-transform: uppercase;
          min-height: 1.1em;
        }

        .qdrop-toast-error { font-size: 0.8rem; opacity: 0.75; }

        .qcoinLabel {
          font-size: 1.6em;
          font-weight: 900;
          letter-spacing: 0.4px;
          background: linear-gradient(135deg,#7a5c00 0%,#ffd700 18%,#fff4b3 32%,#ffd700 46%,#ffea80 60%,#b38400 74%,#ffd700 88%,#7a5c00 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
          text-shadow: 0 0 0.3rem rgba(255, 215, 0, 0.35), 0 0 0.1rem rgba(255, 255, 180, 0.35);
          white-space: nowrap;
          min-height: 1.2em;
        }

        @keyframes qcoinShine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes qcoinGlow {
          0% { text-shadow: 0 0 0.3rem rgba(255, 215, 0, 0.35), 0 0 0.1rem rgba(255, 255, 180, 0.35); }
          50% { text-shadow: 0 0 0.9rem rgba(255, 215, 0, 0.55), 0 0 0.25rem rgba(255, 255, 190, 0.55); }
          100% { text-shadow: 0 0 0.3rem rgba(255, 215, 0, 0.35), 0 0 0.1rem rgba(255, 255, 180, 0.35); }
        }

        @keyframes qdrop-toast-flow {
          0% { opacity: 0; transform: translateY(10px) scale(0.985); }
          10% { opacity: 1; transform: translateY(0px) scale(1); }
          78% { opacity: 1; transform: translateY(0px) scale(1); }
          100% { opacity: 0; transform: translateY(-14px) scale(1.02); }
        }

        /* FX стили — оставлены как у тебя в исходнике; сокращать не стал */
        .qdrop-fx { position: fixed; inset: 0; z-index: 9996; pointer-events: none; overflow: hidden; }
        .qdrop-fx-flash { position: absolute; inset: -20%; background: radial-gradient(circle at 50% 50%, rgba(255, 220, 120, 0.22), rgba(0,0,0,0) 62%); opacity: 0; animation: qfxFlash 0.55s ease-out forwards; }
        .qdrop-fx-shockwave { position: absolute; left: 50%; top: 50%; width: 20px; height: 20px; border-radius: 999px; transform: translate(-50%, -50%) scale(1); opacity: 0; border: 2px solid rgba(255, 220, 140, 0.45); box-shadow: 0 0 40px rgba(255, 210, 120, 0.18); animation: qfxWave 0.85s ease-out forwards; }
        .qdrop-fx-coreglow { position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; border-radius: 999px; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(255, 240, 190, 0.55), rgba(255, 210, 120, 0.0) 70%); filter: blur(0.2px); opacity: 0; animation: qfxCore 0.9s ease-out forwards; }
        @keyframes qfxFlash { 0% { opacity: 0; transform: scale(0.98); } 18% { opacity: 1; } 100% { opacity: 0; transform: scale(1.04); } }
        @keyframes qfxWave { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -50%) scale(18); } }
        @keyframes qfxCore { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -50%) scale(4.2); } }
        .qdrop-fx-badge { position: absolute; left: 50%; top: calc(50% + 92px); transform: translateX(-50%); opacity: 0; animation: qfxBadge 1.05s ease-out forwards; filter: drop-shadow(0 16px 30px rgba(0,0,0,0.35)); }
        .qdrop-fx-badge-inner { display: inline-block; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(255, 220, 140, 0.42); background: radial-gradient(circle at 20% 0%, rgba(255,255,255,0.18), transparent 45%), rgba(10, 14, 24, 0.72); color: rgba(255, 245, 225, 0.98); font-weight: 950; letter-spacing: 0.08em; text-transform: uppercase; backdrop-filter: blur(8px); }
        @keyframes qfxBadge { 0% { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); } 22% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(1.02); } }
        .qdrop-fx-sparks { position: absolute; left: 50%; top: 50%; width: 1px; height: 1px; }
        .qdrop-fx-spark { position: absolute; left: 0; top: 0; width: var(--sz); height: var(--sz); border-radius: 999px; background: radial-gradient(circle at 30% 30%, #fff, rgba(255, 232, 160, 0.92), rgba(255, 170, 80, 0.1)); transform: translate(-50%, -50%) translate3d(0,0,0) scale(0.6); opacity: 0; animation: qfxSpark var(--d) ease-out var(--dl) forwards; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.22)); }
        @keyframes qfxSpark { 0% { opacity: 0; transform: translate(-50%, -50%) translate3d(0,0,0) scale(0.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -50%) translate3d(var(--dx), var(--dy), 0) scale(1.15); } }
        .qdrop-fx-coins { position: absolute; left: 50%; top: 50%; width: 1px; height: 1px; }
        .qdrop-fx-coin { position: absolute; left: 0; top: 0; width: 24px; height: 24px; border-radius: 999px; background-image: url('/qcoin-32.png'); background-size: cover; background-repeat: no-repeat; transform: translate(-50%, -50%) translate3d(0,0,0) rotate(0deg) scale(var(--sc)); opacity: 0; animation: qfxCoin var(--d) cubic-bezier(0.18, 0.72, 0.24, 1) var(--dl) forwards; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.32)); }
        @keyframes qfxCoin {
          0% { opacity: 0; transform: translate(-50%, -50%) translate3d(0,0,0) rotate(0deg) scale(var(--sc)); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) translate3d(var(--vx), var(--vy), 0) rotate(var(--rot)) scale(calc(var(--sc) * 0.92)); }
        }
        .qdrop-fx-confetti { position: absolute; inset: 0; }
        .qdrop-fx-conf { position: absolute; left: var(--x); top: -12vh; width: calc(var(--sz) * 0.48); height: calc(var(--sz) * 1.35); border-radius: 4px; background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255, 230, 150, 0.85), rgba(255, 170, 80, 0.55)); opacity: 0; transform: translate3d(0, 0, 0) rotate(var(--rot)); animation: qfxConf var(--d) ease-out var(--dl) forwards; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.22)); }
        .qdrop-fx-conf.is-dot { width: calc(var(--sz) * 0.9); height: calc(var(--sz) * 0.9); border-radius: 999px; background: radial-gradient(circle at 30% 30%, #fff, rgba(255, 230, 150, 0.92), rgba(255, 170, 80, 0.1)); }
        @keyframes qfxConf {
          0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(var(--rot)); }
          12% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(calc(var(--dr)), 120vh, 0) rotate(calc(var(--rot) + var(--wg))); }
        }

        @media (prefers-reduced-motion: reduce) {
          .qdrop-coin-img, .qdrop-particle, .qcoinLabel, .qdrop-toast-inner, .qdrop-fx, .qdrop-fx * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}
