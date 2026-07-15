'use client'

import React from 'react'

export default function VideoFeedNavIcon({ active = false }) {
  if (active) {
    return (
      <svg
        className="vfNavIcon vfNavIcon--refresh"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 58, height: 58 }}
      >
        <style>{`
          .vfNavIcon .vfFrame{opacity:.9}
          .vfNavIcon--refresh .vfRefreshSpin{
            transform-box: fill-box;
            transform-origin: center;
            animation: vfRefreshSpin 1.35s linear infinite;
          }
          .vfNavIcon--refresh .vfRefreshPulse{
            transform-box: fill-box;
            transform-origin: center;
            animation: vfRefreshPulse 1.7s ease-in-out infinite;
          }
          .vfNavIcon--refresh .vfRefreshSpark{
            animation: vfRefreshSpark 1.7s ease-in-out infinite;
          }
          @keyframes vfRefreshSpin { to { transform: rotate(360deg); } }
          @keyframes vfRefreshPulse {
            0%,100% { opacity:.78; transform: scale(1); }
            50% { opacity:1; transform: scale(1.04); }
          }
          @keyframes vfRefreshSpark {
            0%,100% { opacity:.22; }
            45% { opacity:.9; }
          }
          @media (prefers-reduced-motion: reduce) {
            .vfNavIcon--refresh .vfRefreshSpin,
            .vfNavIcon--refresh .vfRefreshPulse,
            .vfNavIcon--refresh .vfRefreshSpark { animation: none !important; }
          }
        `}</style>
        <rect className="vfFrame" x="0.8" y="0.5" width="22.4" height="22.4" rx="6.0" />
        <g className="vfRefreshPulse">
          <circle cx="12" cy="12" r="6.2" opacity="0.10" />
        </g>
        <g className="vfRefreshSpin">
          <path d="M16.9 8.4a5.6 5.6 0 10.8 5.6" opacity="0.95" />
          <path d="M17.4 5.8v4.3h-4.3" opacity="0.95" />
        </g>
        <circle className="vfRefreshSpark" cx="18.2" cy="6.4" r="0.7" opacity="0.8" />
      </svg>
    )
  }
  return (
    <svg
      className="vfNavIcon vfNavIcon--play"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 58, height: 58 }}
    >
      <style>{`
        .vfNavIcon .vfFrame{opacity:.9}
        .vfNavIcon--play .vfTriWrap,
        .vfNavIcon--play .vfWordWrap,
        .vfNavIcon--play .vfDust{ transform-box: fill-box; transform-origin: center; }
        .vfNavIcon--play .vfTriWrap{ animation: vfTriPhase 2.8s ease-in-out infinite; }
        .vfNavIcon--play .vfTriFill{
          animation: vfTriShake 2.8s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .vfNavIcon--play .vfTriStroke{ animation: vfTriStrokePulse 2.8s ease-in-out infinite; }
        .vfNavIcon--play .vfWordWrap{ animation: vfWordPhase 2.8s ease-in-out infinite; }
        .vfNavIcon--play .vfDust circle{
          animation: vfDustBurst 2.8s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .vfNavIcon--play .vfDust circle:nth-child(2){ animation-delay: .03s; }
        .vfNavIcon--play .vfDust circle:nth-child(3){ animation-delay: .06s; }
        .vfNavIcon--play .vfDust circle:nth-child(4){ animation-delay: .09s; }
        @keyframes vfTriPhase {
          0%,38% { opacity:1; transform: translateY(0) scale(1); }
          10% { transform: translateY(-0.5px) scale(1.02); }
          16% { transform: translateY(0.4px) translateX(-0.15px) scale(.99); }
          22% { transform: translateY(-0.35px) translateX(0.15px) scale(1.01); }
          40% { opacity:0; transform: scale(.72) rotate(-12deg); }
          100% { opacity:0; transform: scale(.72) rotate(-12deg); }
        }
        @keyframes vfTriShake {
          0%,6%,34%,100% { transform: translate(0,0); }
          8% { transform: translate(-0.18px,-0.32px) rotate(-0.8deg); }
          12% { transform: translate(0.16px,0.14px) rotate(0.8deg); }
          18% { transform: translate(-0.14px,0.22px) rotate(-0.7deg); }
          24% { transform: translate(0.2px,-0.22px) rotate(0.9deg); }
        }
        @keyframes vfTriStrokePulse {
          0%,38% { opacity:.95; }
          18% { opacity:1; }
          40%,100% { opacity:0; }
        }
        @keyframes vfWordPhase {
          0%,36% { opacity:0; transform: scale(.84) translateY(1px); }
          46%,78% { opacity:1; transform: scale(1) translateY(0); }
          88%,100% { opacity:0; transform: scale(1.06) translateY(-.4px); }
        }
        @keyframes vfDustBurst {
          0%,34% { opacity:0; transform: translate(0,0) scale(.4); }
          42% { opacity:.9; transform: translate(0,0) scale(1); }
          54% { opacity:.65; }
          70%,100% { opacity:0; transform: translate(var(--dx), var(--dy)) scale(.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vfNavIcon--play .vfTriWrap,
          .vfNavIcon--play .vfTriFill,
          .vfNavIcon--play .vfTriStroke,
          .vfNavIcon--play .vfWordWrap,
          .vfNavIcon--play .vfDust circle { animation: none !important; }
          .vfNavIcon--play .vfTriWrap { opacity:1; }
          .vfNavIcon--play .vfWordWrap { opacity:0; }
        }
      `}</style>
      <rect className="vfFrame" x="0.8" y="0.5" width="22.4" height="22.4" rx="6.0" />
      <g className="vfDust" opacity="0.9">
        <circle cx="12" cy="12" r="0.7" fill="rgba(255,255,255,.95)" style={{ '--dx': '-4px', '--dy': '-3px' }} />
        <circle cx="12" cy="12" r="0.55" fill="rgba(255,80,80,.95)" style={{ '--dx': '4px', '--dy': '-2px' }} />
        <circle cx="12" cy="12" r="0.5" fill="rgba(255,255,255,.8)" style={{ '--dx': '-3px', '--dy': '3px' }} />
        <circle cx="12" cy="12" r="0.45" fill="rgba(243,28,28,.95)" style={{ '--dx': '3px', '--dy': '2px' }} />
      </g>
      <g className="vfTriWrap">
        <path
          className="vfTriStroke"
          d="M10.7 10.2L15.2 12.0L10.7 13.8Z"
          fill="none"
          stroke="rgba(255,255,255,.95)"
          strokeWidth="0.9"
          transform="translate(12 12) scale(2) translate(-12 -12)"
        />
        <path
          className="vfTriFill"
          d="M10.7 10.2L15.2 12.0L10.7 13.8Z"
          fill="#f31c1c"
          opacity="0.9"
          stroke="none"
          transform="translate(12 12) scale(1.78) translate(-12 -12)"
        />
      </g>
      <g className="vfWordWrap" aria-hidden="true">
        <text
          x="12"
          y="13.4"
          textAnchor="middle"
          fill="rgba(255,255,255,.96)"
          fontSize="4.25"
          fontWeight="800"
          letterSpacing=".8"
        >
          PLAY
        </text>
      </g>
    </svg>
  )
}
