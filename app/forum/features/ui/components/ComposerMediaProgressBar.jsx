'use client'

import React from 'react'

export default function ComposerMediaProgressBar({
  mediaBarOn,
  mediaPhase,
  mediaPct,
  formatMediaPhase,
  t,
  onCancel,
}) {
  if (!mediaBarOn) return null

  const pct = Math.max(0, Math.min(100, Number(mediaPct || 0)))

  return (
    <div className="composerMediaBar" role="status" aria-live="polite" data-phase={String(mediaPhase || '').toLowerCase()}>
      <div className="cmbLeft">
        <div className="cmbSpinner" role="img" aria-label={t('loading')}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="cmbDot"
              style={{ '--i': i }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <div className="cmbMain">
        <div className="cmbTop">
          <span className="cmbPhase">{formatMediaPhase(mediaPhase)}</span>
          <span className="cmbPct">{Math.round(pct)}%</span>
        </div>
        <div className="cmbTrack" aria-hidden="true">
          <div className="cmbFill" style={{ width: `${pct}%` }} />
          <div className="cmbTicks" />
        </div>
      </div>

      <button
        type="button"
        className="cmbCancel"
        title={t('forum_cancel')}
        aria-label={t('forum_cancel_upload')}
        onClick={onCancel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
