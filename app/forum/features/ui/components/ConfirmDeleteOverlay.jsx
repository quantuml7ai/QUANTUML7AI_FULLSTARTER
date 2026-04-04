'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../../../../components/i18n'

export default function ConfirmDeleteOverlay({
  open,
  rect,
  text,
  onCancel,
  onConfirm,
}) {
  const { t } = useI18n()
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  React.useLayoutEffect(() => {
    if (!open || !rect) return
    if (typeof window === 'undefined') return

    const W = 270
    const H = 96
    const pad = 8
    const vw = window.innerWidth || 0
    const vh = window.innerHeight || 0

    const r = rect || {}
    let left = (r.right ?? 0) - W
    left = Math.max(pad, Math.min(left, vw - W - pad))

    let top = (r.bottom ?? 0) + 8
    if (top + H > vh - pad) top = (r.top ?? 0) - H - 8
    top = Math.max(pad, Math.min(top, vh - H - pad))

    setPos({ top, left })
  }, [open, rect])

  React.useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="confirmOverlayRoot"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      <div
        className="confirmPop"
        style={{ top: pos.top, left: pos.left }}
        role="dialog"
        aria-modal="true"
      >
        <div className="confirmPopText">{text}</div>
        <div className="confirmPopBtns">
          <button
            type="button"
            className="confirmPopBtn"
            aria-label={t('forum_cancel')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCancel?.()
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="confirmPopBtn ok"
            aria-label={t('forum_confirm')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onConfirm?.()
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20 6L9 17l-5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
