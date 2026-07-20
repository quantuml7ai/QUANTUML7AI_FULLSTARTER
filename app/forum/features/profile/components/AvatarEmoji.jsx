'use client'

import React from 'react'
import { safeReadProfile } from '../utils/profileCache'
import {
  normalizeIconId,
  resolveIconUrl,
  defaultAvatarUrl,
} from '../utils/avatar'
import {
  QL7_SUPPORT_AVATAR_URL,
  isQl7SupportId,
} from '../../../../../lib/ql7-support/systemActor'

export default function AvatarEmoji({ userId, pIcon, className }) {
  const isSupport = isQl7SupportId(userId)
  const fallbackUrl = React.useMemo(() => (
    isSupport ? QL7_SUPPORT_AVATAR_URL : defaultAvatarUrl(userId)
  ), [isSupport, userId])

  // Re-resolve avatar URL on every render so profile cache updates from SSE
  // are reflected immediately for other users as soon as ForumRoot re-renders.
  let resolvedUrl = isSupport ? QL7_SUPPORT_AVATAR_URL : resolveIconUrl(normalizeIconId(pIcon), userId)
  try {
    if (!isSupport) {
      const prof = safeReadProfile(userId)
      const iconId = normalizeIconId(prof?.icon || pIcon)
      resolvedUrl = resolveIconUrl(iconId, userId)
    }
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
