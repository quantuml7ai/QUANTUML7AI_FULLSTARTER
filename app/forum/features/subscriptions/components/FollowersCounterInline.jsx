'use client'

import React from 'react'
import HydrateText from '../../../shared/components/HydrateText'

function defaultFormatCount(n) {
  const x = Number(n || 0)
  if (!Number.isFinite(x)) return '0'
  const abs = Math.abs(x)
  if (abs < 1000) return String(Math.trunc(x))
  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ]
  for (const u of units) {
    if (abs >= u.v) {
      const val = x / u.v
      const str = Math.abs(val) >= 100 ? val.toFixed(0) : Math.abs(val) >= 10 ? val.toFixed(1) : val.toFixed(2)
      return `${str.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}${u.s}`
    }
  }
  return String(Math.trunc(x))
}

export default function FollowersCounterInline({ t, viewerId, count, loading, formatCountFn }) {
  const noAuth = !String(viewerId || '').trim()
  const v = noAuth ? 0 : Number(count || 0)
  const format = typeof formatCountFn === 'function' ? formatCountFn : defaultFormatCount

  return (
    <button
      type="button"
      className={`subsCounter ${noAuth ? 'noAuth' : 'authed'}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      title={t?.('forum_followers')}
      aria-label={t?.('forum_followers')}
      aria-disabled={noAuth}
    >
      <span className="subsRing" aria-hidden />
      <span className="subsStar" aria-hidden>
        ★
      </span>
      <span className="subsValue" suppressHydrationWarning>
        {loading ? '…' : <HydrateText value={format(v)} />}
      </span>
    </button>
  )
}
