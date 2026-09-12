'use client'

import React from 'react'

export default function ForumControlNavIcon({ kind = 'search', active = false, size = 20 }) {
  const common = { width: size, height: size }

  if (kind === 'sort') {
    return (
      <svg className="forumCtlFx forumCtlFx--sort" viewBox="0 0 24 24" fill="none" aria-hidden style={common}>
        <style>{`
          .forumCtlFx--sort .line{
            stroke: currentColor;
            stroke-width: 1.8;
            stroke-linecap: round;
            transform-box: fill-box;
            transform-origin: center;
            animation: forumSortBreathe 2.3s ease-in-out infinite;
          }
          .forumCtlFx--sort .line.l2{ animation-delay: .16s; }
          .forumCtlFx--sort .line.l3{ animation-delay: .3s; }
          .forumCtlFx--sort .beam{
            animation: forumSortBeam 1.9s linear infinite;
            opacity: ${active ? '1' : '.82'};
          }
          @keyframes forumSortBreathe{
            0%,100%{ opacity:.74; transform: translateX(0); }
            50%{ opacity:1; transform: translateX(.28px); }
          }
          @keyframes forumSortBeam{
            0%{ transform: translateX(-11px); opacity:0; }
            15%{ opacity:.9; }
            70%{ opacity:.35; }
            100%{ transform: translateX(11px); opacity:0; }
          }
          @media (prefers-reduced-motion: reduce){
            .forumCtlFx--sort .line,
            .forumCtlFx--sort .beam{ animation:none !important; }
          }
        `}</style>
        <path className="line l1" d="M4 6h16" />
        <path className="line l2" d="M7 12h10" />
        <path className="line l3" d="M10 18h4" />
        <path className="beam" d="M4 6h4" stroke="rgba(130,220,255,.95)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="forumCtlFx forumCtlFx--search" viewBox="0 0 24 24" fill="none" aria-hidden style={common}>
      <style>{`
        .forumCtlFx--search .ring{
          stroke: currentColor;
          stroke-width: 1.8;
          animation: forumSearchPulse 2.3s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .forumCtlFx--search .handle{
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          animation: forumSearchHandle 2.3s ease-in-out infinite;
        }
        .forumCtlFx--search .spark{
          fill: rgba(130,220,255,.92);
          animation: forumSearchSpark 2s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes forumSearchPulse{
          0%,100%{ opacity:.8; transform: scale(1); }
          50%{ opacity:1; transform: scale(1.04); }
        }
        @keyframes forumSearchHandle{
          0%,100%{ transform: translate(0,0); opacity:.86; }
          50%{ transform: translate(.25px,.15px); opacity:1; }
        }
        @keyframes forumSearchSpark{
          0%,100%{ opacity:.18; transform: scale(.75); }
          55%{ opacity:${active ? '.98' : '.82'}; transform: scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce){
          .forumCtlFx--search .ring,
          .forumCtlFx--search .handle,
          .forumCtlFx--search .spark{ animation:none !important; }
        }
      `}</style>
      <circle className="ring" cx="11" cy="11" r="6.7" />
      <path className="handle" d="M16 16l4 4" />
      <circle className="spark" cx="16.6" cy="6.2" r="0.9" />
    </svg>
  )
}

