'use client'

import React from 'react'

export default function ForumActionNavIcon({ kind = 'plus', active = false, size = 22 }) {
  const common = {
    width: size,
    height: size,
  }
  if (kind === 'inbox') {
    return (
      <svg className="forumNavFx forumNavFx--inbox" viewBox="0 0 24 24" aria-hidden style={common}>
        <style>{`
          .forumNavFx * { vector-effect: non-scaling-stroke; }
          .forumNavFx--inbox .l1,
          .forumNavFx--inbox .l2{
            animation: forumNavStroke 2.4s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          .forumNavFx--inbox .l2{ animation-delay:.12s; }
          .forumNavFx--inbox .glow{
            opacity:${active ? '0.95' : '0.65'};
            animation: forumNavGlow 2s ease-in-out infinite;
          }
          @keyframes forumNavStroke {
            0%,100% { stroke-dasharray: 36 80; stroke-dashoffset: 0; transform: translateY(0); }
            35% { stroke-dasharray: 72 80; stroke-dashoffset: -8; transform: translateY(-0.25px); }
            60% { stroke-dashoffset: -14; transform: translateY(0.2px); }
          }
          @keyframes forumNavGlow {
            0%,100% { opacity:.4; }
            50% { opacity:1; filter: drop-shadow(0 0 4px rgba(120,220,255,.45)); }
          }
          @media (prefers-reduced-motion: reduce) {
            .forumNavFx--inbox .l1, .forumNavFx--inbox .l2, .forumNavFx--inbox .glow { animation:none !important; }
          }
        `}</style>
        <path className="glow" d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="rgba(140,220,255,.55)" strokeWidth="2.2" fill="none" opacity="0.45" />
        <path className="l1" d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path className="l2" d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'home') {
    return (
      <svg className="forumNavFx forumNavFx--home" viewBox="0 0 24 24" fill="none" aria-hidden style={common}>
        <style>{`
          .forumNavFx--home .roof, .forumNavFx--home .base {
            animation: forumHomePulse 2.8s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          .forumNavFx--home .base { animation-delay: .16s; }
          .forumNavFx--home .spark {
            animation: forumHomeSpark 2.8s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          @keyframes forumHomePulse {
            0%,100% { stroke-dasharray: 24 64; stroke-dashoffset: 0; }
            45% { stroke-dasharray: 64 64; stroke-dashoffset: -6; }
          }
          @keyframes forumHomeSpark {
            0%,100% { opacity:.15; transform: scale(.85); }
            55% { opacity:.9; transform: scale(1.06); }
          }
          @media (prefers-reduced-motion: reduce) {
            .forumNavFx--home .roof, .forumNavFx--home .base, .forumNavFx--home .spark { animation:none !important; }
          }
        `}</style>
        <circle className="spark" cx="12" cy="8.1" r="1.1" fill="rgba(255,255,255,.7)" opacity="0.25" />
        <path className="roof" d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path className="base" d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'back') {
    return (
      <svg className="forumNavFx forumNavFx--back" viewBox="0 0 24 24" fill="none" aria-hidden style={common}>
        <style>{`
          .forumNavFx--back .arrow {
            transform-box: fill-box;
            transform-origin: center;
            animation: forumBackSwipe 2.2s cubic-bezier(.2,.9,.22,1) infinite;
          }
          .forumNavFx--back .trail {
            animation: forumBackTrail 2.2s ease-in-out infinite;
          }
          @keyframes forumBackSwipe {
            0%,100% { transform: translateX(0); }
            22% { transform: translateX(-1.2px); }
            30% { transform: translateX(-2.1px); }
            48% { transform: translateX(0.7px); }
            60% { transform: translateX(0); }
          }
          @keyframes forumBackTrail {
            0%,100% { opacity:.16; }
            30% { opacity:.85; }
          }
          @media (prefers-reduced-motion: reduce) {
            .forumNavFx--back .arrow, .forumNavFx--back .trail { animation:none !important; }
          }
        `}</style>
        <path className="trail" d="M17.2 12H9.2" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
        <path className="arrow" d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className="forumNavFx forumNavFx--plus" viewBox="0 0 24 24" aria-hidden style={common}>
      <style>{`
        .forumNavFx--plus .plusCore {
          transform-box: fill-box;
          transform-origin: center;
          animation: forumPlusBounce 2.6s ease-in-out infinite;
        }
        .forumNavFx--plus .plusGlow {
          transform-box: fill-box;
          transform-origin: center;
          animation: forumPlusGlow 2.6s ease-in-out infinite;
        }
        @keyframes forumPlusBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          10% { transform: translateY(-0.65px) rotate(1.5deg); }
          18% { transform: translateY(0.35px) rotate(-1.1deg); }
          30% { transform: translateY(-1px) rotate(0.6deg); }
          44% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes forumPlusGlow {
          0%,100% { opacity:.18; transform: scale(.85); }
          28% { opacity:.85; transform: scale(1.08); }
          45% { opacity:.2; transform: scale(.9); }
        }
        @media (prefers-reduced-motion: reduce) {
          .forumNavFx--plus .plusCore, .forumNavFx--plus .plusGlow { animation:none !important; }
        }
      `}</style>
      <circle className="plusGlow" cx="12" cy="12" r="6.6" fill="rgba(255,255,255,.14)" opacity="0.2" />
      <path className="plusCore" d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
