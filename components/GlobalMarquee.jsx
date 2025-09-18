'use client'
import React from 'react'
import { useI18n } from './i18n'

export default function GlobalMarquee() {
  const { t } = useI18n()
  const text = t('marquee')

  const Item = () => (
    <>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
      <span className="ql7-marquee-item">• Quantum L7 AI © • {text}</span>
    </>
  )

  return (
    <>
      <div className="ql7-marquee-wrap" role="contentinfo" aria-label={text}>
        <div className="ql7-marquee-track" aria-hidden="true">
          <Item />
          <Item />
        </div>
      </div>

      <style jsx>{`
        .ql7-marquee-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 44px;
          background: rgba(0,0,0,0.72);
          backdrop-filter: saturate(120%) blur(6px);
          border-top: 1px solid rgba(255,255,255,0.08);
          z-index: 60;
          overflow: hidden;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%);
        }

        .ql7-marquee-track {
          display: inline-flex;
          align-items: center;
          height: 44px;
          width: max-content;
          will-change: transform;
          /* было 22s — сделал медленнее */
          animation: ql7-scroll 30s linear infinite;
          white-space: nowrap;
        }

        .ql7-marquee-item {
          display: inline-block;
          font-size: 14px;
          line-height: 44px;
          letter-spacing: 0.3px;
          padding: 0 32px;
          color: rgba(255,255,255,0.95);
          text-shadow:
            0 0 0px rgba(56,189,248,0),
            0 0 0px rgba(56,189,248,0);
          /* было 2.6s — мерцание стало ~в 3–4 раза чаще */
          animation: ql7-pulse 0.8s ease-in-out infinite;
        }

        @keyframes ql7-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* усиленное мерцание: ярче и шире свечения */
        @keyframes ql7-pulse {
          0%, 100% {
            color: rgba(255,255,255,0.90);
            text-shadow:
              0 0 0px rgba(56,189,248,0),
              0 0 0px rgba(56,189,248,0);
            filter: drop-shadow(0 0 0px rgba(56,189,248,0));
          }
          50% {
            color: rgba(255,255,255,1);
            text-shadow:
              0 0 10px rgba(56,189,248,0.55),
              0 0 24px rgba(56,189,248,0.35);
            filter: drop-shadow(0 0 10px rgba(56,189,248,0.45));
          }
        }

        @media (max-width: 640px) {
          .ql7-marquee-item { padding: 0 18px; font-size: 13px; }
          /* мобилкам тоже медленнее (было 18s) */
          .ql7-marquee-track { animation-duration: 24s; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ql7-marquee-track, .ql7-marquee-item {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
