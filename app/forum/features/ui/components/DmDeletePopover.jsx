'use client'

import React from 'react'
import { createPortal } from 'react-dom'

export default function DmDeletePopover({
  open,
  rect,
  text,
  checkboxLabel,
  checked,
  onChecked,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  title,
}) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  const popRef = React.useRef(null)
  const checkedRef = React.useRef(!!checked)

  React.useEffect(() => {
    checkedRef.current = !!checked
  }, [checked, open])

  React.useLayoutEffect(() => {
    if (!open || !rect) return
    if (typeof window === 'undefined') return

    const pad = 8
    const vw = window.innerWidth || 0
    const vh = window.innerHeight || 0
    const popW = popRef.current?.offsetWidth || 320
    const popH = popRef.current?.offsetHeight || 180
    const r = rect || {}

    let left = r.left ?? 0
    if (left + popW > vw - pad) left = (r.right ?? 0) - popW
    left = Math.max(pad, Math.min(left, vw - popW - pad))

    let top = (r.bottom ?? 0) + 8
    if (top + popH > vh - pad) top = (r.top ?? 0) - popH - 8
    top = Math.max(pad, Math.min(top, vh - popH - pad))

    setPos({ top, left })
  }, [open, rect, text, checkboxLabel, title])

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
      className="confirmOverlayRoot dmConfirmOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      <div
        ref={popRef}
        className="dmConfirmPop"
        style={{ top: pos.top, left: pos.left }}
        role="dialog"
        aria-modal="true"
      >
        {title ? <div className="dmConfirmTitle">{title}</div> : null}
        <div className="dmConfirmText">{text}</div>
        {checkboxLabel ? (
          <label className="dmConfirmCheck">
            <input
              type="checkbox"
              checked={!!checked}
              onChange={(e) => {
                const value = !!e.target.checked
                checkedRef.current = value
                onChecked?.(value)
              }}
            />
            <span>{checkboxLabel}</span>
          </label>
        ) : null}
        <div className="dmConfirmActions">
          <button
            type="button"
            className="dmConfirmBtn ghost"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCancel?.()
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="dmConfirmBtn primary"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onConfirm?.(!!checkedRef.current)
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
