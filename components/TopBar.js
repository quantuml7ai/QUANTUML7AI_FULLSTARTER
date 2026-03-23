// components/TopBar.js
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from './i18n'
import LanguageSwitcher from './LanguageSwitcher'
import dynamic from 'next/dynamic'
import Image from 'next/image'
 
const AuthNavClient = dynamic(() => import('./AuthNavClient'), { ssr: false })

// математика: точка на окружности по углу
function polarToCartesian (cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * (angleDeg - 90)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export default function TopBar () {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  // слушатель логаута
  if (typeof window !== 'undefined') {
    window.__QL7_TOPBAR_LOGOUT_ONCE__ ||= (() => {
      const onLogout = () => {
        try { window.dispatchEvent(new Event('aiquota:flush')) } catch {}
        try { window.location.reload() } catch {}
      }
      window.addEventListener('auth:logout', onLogout)
      return true
    })()
  }

  const items = [
    { href: '/exchange',  label: t('nav_exchange') },
    { href: '/academy',   label: t('nav_academy') },  
    { href: '/about',     label: t('nav_about') },
    { href: '/subscribe', label: t('nav_subscribe') }, 
    { href: '/forum',     label: t('forum_title') },    
  ] 
 
  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => isActive(item.href))
  )

  // ===== авто-масштаб под самые длинные лейблы (арабский и т.п.) =========
  const maxLabelLen = items.reduce(
    (max, item) => Math.max(max, (item.label || '').length),
    0
  )

  let orbitScale = 1
  if (maxLabelLen > 28) orbitScale = 0.6
  else if (maxLabelLen > 24) orbitScale = 0.68
  else if (maxLabelLen > 20) orbitScale = 0.78
  else if (maxLabelLen > 16) orbitScale = 0.88

  // ===== Геометрия монеты =================================================
  const VIEWBOX = 400
  const CX = VIEWBOX / 2
  const CY = VIEWBOX / 2
  const R  = 150
  const angleStep = 360 / items.length

  // активный сегмент всегда наверху: центр дуги = -90°
  const baseAngle = 0 - angleStep / 2

  // дуги под textPath
  const arcPaths = items.map((_, index) => {
    // чуть уменьшили зазор между дугами, чтобы «дуга к дуге»
    const paddingDeg = 2
    const startDeg = baseAngle + angleStep * index + paddingDeg
    const endDeg   = baseAngle + angleStep * (index + 1) - paddingDeg

    const start = polarToCartesian(CX, CY, R, startDeg)
    const end   = polarToCartesian(CX, CY, R, endDeg)

    const d = [
      `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
      `A ${R} ${R} 0 0 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
    ].join(' ')

    return { id: `ql7-nav-arc-${index}`, d }
  })

  return (
    <header className="topbar">
      {/* логотип слева */}
      <Link href="/" className="brand" aria-label="Quantum L7 AI">
        <Image
          src="/branding/quantum_l7_logo.png"
          alt="Quantum L7 AI"
          className="brand-logo"
          width={160}
          height={40}
          priority
        />
      </Link>

      {/* колонка справа: орбита + под ней auth+lang */}
      <nav aria-label="Main" className="topbar-nav">
        <div className="nav-orbit-shell">
          <div
            className="nav-orbit"
            style={{
              '--orbit-count': items.length,
              '--orbit-active-index': activeIndex,
              '--orbit-scale': orbitScale,
            }}
          >
            {/* фоновые бегущие импульсные кольца */}
            <div className="nav-orbit-rings" aria-hidden="true" />

            {/* SVG-монета с текстом по дуге */}
            <svg
              className="nav-orbit-svg"
              viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
              aria-hidden="false"
              role="group"
            >
              <defs>
                {arcPaths.map((arc) => (
                  <path
                    key={arc.id}
                    id={arc.id}
                    d={arc.d}
                    fill="none"
                  />
                ))}

                {/* тёмное «узкое» кольцо-подложка под текстом */}
                <linearGradient id="ql7-orbit-band-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#020617" stopOpacity="0.9" />
                  <stop offset="40%"  stopColor="#020617" stopOpacity="0.85" />
                  <stop offset="60%"  stopColor="#020617" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.85" />
                </linearGradient>

                {/* мягкий свет вокруг кольца */}
                <radialGradient id="ql7-orbit-halo" cx="50%" cy="50%" r="65%">
                  <stop offset="0%"  stopColor="#9e03f8ff" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#facc15" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>

                {/* золотой градиент для букв */}
                <linearGradient id="ql7-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#ffe600ff" />

                </linearGradient>
              </defs>

              {/* вращаем всё кольцо: активный пункт в зените */}
              <g
                className="nav-orbit-ring-svg"
                style={{
                  transform: `rotate(${-angleStep * activeIndex}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                {/* световое пятно под монетой */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R + 32}
                  fill="url(#ql7-orbit-halo)"
                />

                {/* ТЁМНЫЙ УЗКИЙ РИНГ — подложка под текст, чтобы читалось */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R + 7}
                  fill="none"
                  stroke="url(#ql7-orbit-band-grad)"
                  strokeWidth="60"
                  className="nav-orbit-band"
                />

                {/* сами пункты меню по дуге */}
                {items.map((item, index) => {
                  const active = isActive(item.href)
                  const arcId = arcPaths[index].id
                  const label = (item.label || '').toUpperCase()

                  return (
                    <g
                      key={item.href}
                      className={
                        'nav-orbit-arc' + (active ? ' nav-orbit-arc--active' : '')
                      }
                      onClick={() => router.push(item.href)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(item.href)
                        }
                      }}
                      role="link"
                      aria-label={item.label}
                    >
                      <text className="nav-orbit-arc-text">
                        <textPath
                          href={`#${arcId}`}
                          startOffset="50%"
                          textAnchor="middle"
                        >
                         
                          {label}
                        
                          
                        </textPath>
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* центр орбиты: джойстик; всегда идеально по центру, без съезда на арабском */}
            <div className="nav-orbit-center">
              <Link
                href="/game"
                className="nav-game-btn nav-orbit-center-btn"
                aria-label={t('nav_game') || 'Game'}
              >
                <Image
                  src="/game/game.gif"
                  alt={t('nav_game') || 'Game'}
                  width={110}
                  height={110}
                  className="nav-game-icon"
                  priority={false}
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Auth + язык: всегда прямо под навигацией, по центру относительно орбиты */}
        <div className="nav-orbit-controls">
          <AuthNavClient />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}
