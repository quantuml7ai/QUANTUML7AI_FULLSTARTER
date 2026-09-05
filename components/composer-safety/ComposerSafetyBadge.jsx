'use client'

import React from 'react'
import { getComposerBadgePresentation } from '../../lib/composer-safety/badgeLexicon.js'

const MAP = Object.freeze({
  green: Object.freeze({ accent: '#63f2bd', accentRgb: '99,242,189', core: '#b8ffe5', bg: 'rgba(8,54,47,.90)', glyph: '✓' }),
  orange: Object.freeze({ accent: '#ffc45f', accentRgb: '255,196,95', core: '#fff0b8', bg: 'rgba(76,45,8,.92)', glyph: '!' }),
  red: Object.freeze({ accent: '#ff5f83', accentRgb: '255,95,131', core: '#ffd0da', bg: 'rgba(75,12,33,.93)', glyph: '×' }),
})

export default function ComposerSafetyBadge({ preview, locale = 'en' }) {
  const tone = String(preview?.tone || '')
  const spec = MAP[tone]
  if (!spec) return null

  const copy = getComposerBadgePresentation(tone, locale, preview?.classId, preview?.signals)
  const aria = `${copy.title}. ${copy.detail}`
  return (
    <div
      data-ql7-composer-preview="true"
      data-tone={tone}
      data-class-id={String(preview?.classId || '')}
      data-preview-source={String(preview?.source || '')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={aria}
      title={aria}
      className="ql7ComposerSafetyBadge"
      style={{
        '--ql7-badge-accent': spec.accent,
        '--ql7-badge-accent-rgb': spec.accentRgb,
        '--ql7-badge-core': spec.core,
        '--ql7-badge-bg': spec.bg,
      }}
    >
      <span className="ql7ComposerSafetyShine" aria-hidden="true" />
      <span className="ql7ComposerSafetyOrb" aria-hidden="true">
        <span>{spec.glyph}</span>
      </span>
      <span className="ql7ComposerSafetyCopy">
        <strong>{copy.title}</strong>
        <span>{copy.detail}</span>
      </span>
      <span className="ql7ComposerSafetySignal" aria-hidden="true"><i /><i /><i /></span>
      <style jsx>{`
        .ql7ComposerSafetyBadge {
          position: relative;
          isolation: isolate;
          display: flex;
          align-items: flex-start;
          gap: 11px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid rgba(var(--ql7-badge-accent-rgb), .52);
          border-radius: 16px;
          padding: 10px 12px;
          color: var(--ql7-badge-accent);
          background:
            radial-gradient(circle at 12% -35%, rgba(var(--ql7-badge-accent-rgb), .27), transparent 46%),
            linear-gradient(132deg, var(--ql7-badge-bg), rgba(8, 13, 24, .95) 72%);
          box-shadow:
            0 10px 30px rgba(0, 0, 0, .28),
            0 0 22px rgba(var(--ql7-badge-accent-rgb), .10),
            inset 0 1px 0 rgba(255, 255, 255, .10),
            inset 0 0 0 1px rgba(255, 255, 255, .025);
          backdrop-filter: blur(14px) saturate(1.15);
          contain: paint;
          transition: border-color .42s ease, background .42s ease, box-shadow .42s ease, color .42s ease;
          animation: ql7ComposerBadgeArrive .46s cubic-bezier(.2, .8, .2, 1) both;
        }
        .ql7ComposerSafetyBadge::after {
          position: absolute;
          inset: auto 13px 0 13px;
          z-index: -1;
          height: 1px;
          content: '';
          background: linear-gradient(90deg, transparent, rgba(var(--ql7-badge-accent-rgb), .85), transparent);
          opacity: .72;
        }
        .ql7ComposerSafetyShine {
          position: absolute;
          z-index: 0;
          top: -65%;
          bottom: -65%;
          left: -34%;
          width: 23%;
          pointer-events: none;
          opacity: 0;
          transform: translate3d(-180%, 0, 0) rotate(14deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .08), rgba(255, 255, 255, .64), rgba(var(--ql7-badge-accent-rgb), .32), transparent);
          filter: blur(.3px);
          animation: ql7ComposerBadgeShine 6.8s cubic-bezier(.22, .72, .26, 1) 1.35s infinite;
        }
        .ql7ComposerSafetyOrb {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          display: inline-grid;
          place-items: center;
          width: 24px;
          height: 24px;
          margin-top: 1px;
          border: 1px solid rgba(var(--ql7-badge-accent-rgb), .78);
          border-radius: 50%;
          background: radial-gradient(circle at 38% 30%, rgba(255,255,255,.28), rgba(var(--ql7-badge-accent-rgb),.14) 42%, rgba(2,8,16,.82) 78%);
          box-shadow: 0 0 0 3px rgba(var(--ql7-badge-accent-rgb), .07), 0 0 18px rgba(var(--ql7-badge-accent-rgb), .34);
          transition: border-color .42s ease, background .42s ease, box-shadow .42s ease;
        }
        .ql7ComposerSafetyOrb::before {
          position: absolute;
          inset: -4px;
          content: '';
          border: 1px solid rgba(var(--ql7-badge-accent-rgb), .16);
          border-radius: inherit;
        }
        .ql7ComposerSafetyOrb > span {
          color: var(--ql7-badge-core);
          font-size: 13px;
          font-weight: 950;
          line-height: 1;
          text-shadow: 0 0 9px rgba(var(--ql7-badge-accent-rgb), .72);
        }
        .ql7ComposerSafetyCopy {
          position: relative;
          z-index: 1;
          min-width: 0;
          display: grid;
          flex: 1 1 auto;
          gap: 4px;
        }
        .ql7ComposerSafetyCopy strong {
          color: var(--ql7-badge-core);
          font-size: 12px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: .015em;
          text-shadow: 0 0 12px rgba(var(--ql7-badge-accent-rgb), .22);
        }
        .ql7ComposerSafetyCopy > span {
          color: rgba(239, 247, 255, .84);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.38;
        }
        .ql7ComposerSafetySignal {
          position: relative;
          z-index: 1;
          display: flex;
          flex: 0 0 auto;
          gap: 3px;
          align-items: center;
          margin-top: 8px;
        }
        .ql7ComposerSafetySignal i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--ql7-badge-accent);
          box-shadow: 0 0 7px rgba(var(--ql7-badge-accent-rgb), .72);
          opacity: .38;
        }
        .ql7ComposerSafetySignal i:nth-child(2) { opacity: .68; }
        .ql7ComposerSafetySignal i:nth-child(3) { opacity: 1; }
        @keyframes ql7ComposerBadgeArrive {
          from { opacity: 0; transform: translate3d(0, 5px, 0) scale(.992); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes ql7ComposerBadgeShine {
          0%, 67% { opacity: 0; transform: translate3d(-180%, 0, 0) rotate(14deg); }
          70% { opacity: .18; }
          78% { opacity: .78; }
          87% { opacity: 0; transform: translate3d(690%, 0, 0) rotate(14deg); }
          100% { opacity: 0; transform: translate3d(690%, 0, 0) rotate(14deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ql7ComposerSafetyBadge { animation: none; transition-duration: .01ms; }
          .ql7ComposerSafetyShine { display: none; animation: none; }
        }
      `}</style>
    </div>
  )
}
