'use client'

import React from 'react'
import Image from 'next/image'
import { safeReadProfile } from '../utils/profileCache'
import {
  normalizeIconId,
  resolveIconUrl,
  defaultAvatarUrl,
} from '../utils/avatar'

export default function AvatarEmoji({ userId, pIcon, className }) {
  const fallbackUrl = React.useMemo(() => defaultAvatarUrl(userId), [userId])
  const [src, setSrc] = React.useState(fallbackUrl)

  // Re-resolve avatar URL on every render so profile cache updates from SSE
  // are reflected immediately for other users as soon as ForumRoot re-renders.
  let resolvedUrl = resolveIconUrl(normalizeIconId(pIcon), userId)
  try {
    const prof = safeReadProfile(userId)
    const iconId = normalizeIconId(prof?.icon || pIcon)
    resolvedUrl = resolveIconUrl(iconId, userId)
  } catch {}

  const targetUrl = resolvedUrl || fallbackUrl

  React.useEffect(() => {
    setSrc(fallbackUrl)
  }, [fallbackUrl])

  React.useEffect(() => {
    if (!targetUrl || targetUrl === fallbackUrl) {
      setSrc(fallbackUrl)
      return
    }
    if (typeof window === 'undefined') {
      setSrc(targetUrl)
      return
    }

    let cancelled = false
    let retryTimer = null

    const tryLoad = () => {
      if (cancelled) return
      const probe = new window.Image()
      probe.onload = () => {
        if (cancelled) return
        setSrc(targetUrl)
      }
      probe.onerror = () => {
        if (cancelled) return
        setSrc(fallbackUrl)
        retryTimer = window.setTimeout(tryLoad, 4000)
      }
      probe.src = targetUrl
    }

    tryLoad()
    return () => {
      cancelled = true
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
  }, [targetUrl, fallbackUrl])

  return (
    <span className={className || 'avaWrap'}>
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        unoptimized
        onError={() => {
          if (src !== fallbackUrl) setSrc(fallbackUrl)
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'inherit',
          display: 'block',
        }}
      />
    </span>
  )
}
