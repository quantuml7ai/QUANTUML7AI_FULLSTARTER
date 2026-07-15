'use client'

import React from 'react'
import { safeReadProfile } from '../utils/profileCache'
import {
  normalizeIconId,
  resolveIconUrl,
  defaultAvatarUrl,
} from '../utils/avatar'

export default function AvatarEmoji({ userId, pIcon, className }) {
  const fallbackUrl = React.useMemo(() => defaultAvatarUrl(userId), [userId])

  // Re-resolve avatar URL on every render so profile cache updates from SSE
  // are reflected immediately for other users as soon as ForumRoot re-renders.
  let resolvedUrl = resolveIconUrl(normalizeIconId(pIcon), userId)
  try {
    const prof = safeReadProfile(userId)
    const iconId = normalizeIconId(prof?.icon || pIcon)
    resolvedUrl = resolveIconUrl(iconId, userId)
  } catch {}

  const targetUrl = resolvedUrl || fallbackUrl

  const [src, setSrc] = React.useState(targetUrl)

  React.useEffect(() => {
    setSrc(targetUrl)
  }, [targetUrl])

  return (
    <span className={className || 'avaWrap'}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
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
