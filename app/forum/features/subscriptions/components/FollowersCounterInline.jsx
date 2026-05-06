'use client'

import React from 'react'
import HydrateText from '../../../shared/components/HydrateText'
import { formatCount as defaultFormatCount } from '../../../shared/utils/counts'

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
