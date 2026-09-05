'use client'

import React from 'react'

export default function MetaMarketTitle({ label = 'Meta Market' }) {
  const rawId = React.useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `mmTitleGradient-${id}`
  const glowId = `mmTitleGlow-${id}`
  const sweepId = `mmTitleSweep-${id}`

  return (
    <svg className="mmTitleSvg" viewBox="0 0 520 96" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dfcff" />
          <stop offset="34%" stopColor="#9f7bff" />
          <stop offset="64%" stopColor="#ffd86b" />
          <stop offset="100%" stopColor="#6af7ff" />
        </linearGradient>
        <linearGradient id={sweepId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 .22 0 0 0 0 .86 0 0 0 0 1 0 0 0 .72 0" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path className="mmTitleOrbit mmTitleOrbitA" d="M56 53C122 14 232 11 329 28c72 12 118 35 135 57" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.1" strokeLinecap="round" />
      <path className="mmTitleOrbit mmTitleOrbitB" d="M67 67c82 18 157 19 226 3 64-15 110-43 144-68" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.1" strokeLinecap="round" />
      <path className="mmTitleCircuit" d="M74 74h70l10-8h78l11 8h132l12-8h58" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text className="mmTitleText mmTitleTextBack" x="260" y="56" textAnchor="middle" filter={`url(#${glowId})`}>
        Meta Market
      </text>
      <text className="mmTitleText mmTitleTextMain" x="260" y="56" textAnchor="middle" fill={`url(#${gradId})`} stroke={`url(#${gradId})`}>
        Meta Market
      </text>
      <path className="mmTitleComet" d="M52 78 C146 42 228 88 336 55 S454 41 486 67" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" />
      <path className="mmTitleSweep" d="M108 31h304" fill="none" stroke={`url(#${sweepId})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
