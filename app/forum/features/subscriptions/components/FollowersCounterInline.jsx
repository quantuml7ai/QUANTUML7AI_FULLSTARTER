'use client'

import React from 'react'
import HydrateText from '../../../shared/components/HydrateText'
import { formatCount as defaultFormatCount } from '../../../shared/utils/counts'

export function QuantumFamilyBadgeTitleSvg({ className = 'quantumFamilyBadgeTitleSvg' }) {
  const rawId = React.useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `quantumFamilyBadgeTitleGrad-${id}`
  const glowId = `quantumFamilyBadgeTitleGlow-${id}`

  return (
    <svg className={className} viewBox="0 0 360 54" role="img" aria-label="Quantum Family">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dfcff" />
          <stop offset="45%" stopColor="#9f7bff" />
          <stop offset="70%" stopColor="#ffd86b" />
          <stop offset="100%" stopColor="#6af7ff" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-70%" width="140%" height="240%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.35 0 0 0 0 0.86 0 0 0 0 1 0 0 0 .86 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="50%"
        y="48%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={`url(#${gradId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="0.75"
        paintOrder="stroke fill"
        filter={`url(#${glowId})`}
      >
        Quantum Family
      </text>
      <path
        className="quantumFamilyBadgeTitleSweep"
        d="M24 43 C92 34 140 47 204 38 S300 31 336 42"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function QuantumFamilyCounterPill({
  followersCount = 0,
  followingCount = 0,
  loading = false,
  formatCountFn,
  className = '',
}) {
  const format = typeof formatCountFn === 'function' ? formatCountFn : defaultFormatCount
  const followers = Number(followersCount || 0)
  const following = Number(followingCount || 0)

  return (
    <span className={`quantumFamilyCounterPill ${className}`.trim()}>
      <span className="subsRing" aria-hidden />
      <span className="subsValue subsValue--followers" suppressHydrationWarning>
        {loading ? '...' : <HydrateText value={format(followers)} />}
      </span>
      <span className="subsStar" aria-hidden>
        {'\u2605'}
      </span>
      <span className="subsValue subsValue--following" suppressHydrationWarning>
        {loading ? '...' : <HydrateText value={format(following)} />}
      </span>
    </span>
  )
}

export default function FollowersCounterInline({
  t,
  viewerId,
  count,
  followingCount = 0,
  loading,
  formatCountFn,
  onOpen,
}) {
  const noAuth = !String(viewerId || '').trim()
  const followers = noAuth ? 0 : Number(count || 0)
  const following = noAuth ? 0 : Number(followingCount || 0)
  const openLabel = t?.('forum_subscriptions_open_followers') || t?.('forum_followers')

  return (
    <span className={`subsCounterShell ${noAuth ? 'noAuth' : 'authed'}`}>
      <QuantumFamilyBadgeTitleSvg />
      <button
        type="button"
        className={`subsCounter ${noAuth ? 'noAuth' : 'authed'}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!noAuth) onOpen?.(e)
        }}
        title={openLabel}
        aria-label={openLabel}
        aria-disabled={noAuth}
      >
        <QuantumFamilyCounterPill
          followersCount={followers}
          followingCount={following}
          loading={loading}
          formatCountFn={formatCountFn}
        />
      </button>
    </span>
  )
}
