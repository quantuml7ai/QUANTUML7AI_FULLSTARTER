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
  const phaseKey = String(mediaPhase || '').toLowerCase()
  const isReady = phaseKey === 'ready' || pct >= 100
  const loadingLabel = t?.('loading') || 'Loading'
  const readyLabel = formatMediaPhase?.('Ready') || t?.('forum_media_ready') || 'Ready'

  return (
    <div
      className="composerMediaBar"
      role="status"
      aria-live="polite"
      data-phase={phaseKey}
      data-ready={isReady ? '1' : undefined}
    >
      <div className="cmbLeft">
        {isReady ? (
          <div className="cmbReadyIcon" role="img" aria-label={readyLabel}>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <circle className="cmbReadyRing" cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.3" />
              <path className="cmbReadyPath" d="M9.4 16.2l4.4 4.3 8.8-9.2" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="cmbSpinner" role="img" aria-label={loadingLabel}>
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="cmbDot"
                style={{ '--i': i }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
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
