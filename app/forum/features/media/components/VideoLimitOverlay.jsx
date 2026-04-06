'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { FORUM_VIDEO_MAX_SECONDS } from '../../../shared/constants/media'

export default function VideoLimitOverlay({
  open,
  copy,
  maxSec = FORUM_VIDEO_MAX_SECONDS,
  durationSec,
  onClose,
}) {
  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null
  const seconds = Number(durationSec || 0)
  const hasDuration = Number.isFinite(seconds) && seconds > 0

  return createPortal(
    <div
      className="confirmOverlayRoot dmConfirmOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="videoLimitPop" role="dialog" aria-modal="true" aria-live="polite">
        <div className="videoLimitTitle">{String(copy?.title || '')}</div>
        <div className="videoLimitBody">{String(copy?.body || '')}</div>
        <div className="videoLimitMeta">
          {hasDuration ? `${seconds.toFixed(1)}s` : String(copy?.badDuration || '')}
          {' · '}
          {`${maxSec}s`}
        </div>
        <div className="videoLimitTipsTitle">{String(copy?.tipsTitle || '')}</div>
        <ul className="videoLimitTips">
          {(Array.isArray(copy?.tips) ? copy.tips : []).map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
        <div className="videoLimitActions">
          <button type="button" className="dmConfirmBtn primary" onClick={onClose}>
            {String(copy?.ok || '')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
