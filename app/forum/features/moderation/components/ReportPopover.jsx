'use client'

import React, { useEffect, useMemo, useState } from 'react'

export default function ReportPopover({
  open,
  anchorRect,
  onClose,
  onSelect,
  t,
  busy,
  popoverRef,
  dir,
}) {
  const [size, setSize] = useState({ width: 220, height: 160 })
  const isReady = !!(open && anchorRect && typeof window !== 'undefined')
  const dirAttr = dir === 'rtl' ? 'rtl' : 'ltr'
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

  useEffect(() => {
    if (!isReady) return
    const el = popoverRef?.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect?.width || !rect?.height) return
    setSize((prev) => {
      if (Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5) return prev
      return { width: rect.width, height: rect.height }
    })
  }, [isReady, anchorRect, popoverRef])

  const style = useMemo(() => {
    if (!isReady) return {}
    const GAP = 8
    const SAFE = 12
    const winW = window.innerWidth || 0
    const winH = window.innerHeight || 0
    const popW = clamp(size.width || 220, 200, Math.max(200, winW - SAFE * 2))
    const popH = Math.max(140, size.height || 160)
    const baseLeft = dirAttr === 'rtl' ? anchorRect.right - popW : anchorRect.left
    const left = clamp(baseLeft, SAFE, Math.max(SAFE, winW - popW - SAFE))
    const placeBelow = anchorRect.bottom + GAP + popH <= winH - SAFE
    const baseTop = placeBelow ? anchorRect.bottom + GAP : anchorRect.top - popH - GAP
    const top = clamp(baseTop, SAFE, Math.max(SAFE, winH - popH - SAFE))
    return { top, left, width: popW }
  }, [isReady, anchorRect, size, dirAttr])

  if (!isReady) return null

  return (
    <div
      ref={popoverRef}
      className="reportPopover neon glass"
      data-dir={dirAttr}
      role="menu"
      aria-label={t?.('forum_report_title')}
      style={style}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="reportTitle">{t?.('forum_report_title')}</div>
      <div className="reportDivider" />
      <button
        type="button"
        className="reportItem"
        role="menuitem"
        disabled={busy}
        onClick={() => {
          onClose?.()
          onSelect?.('porn')
        }}
      >
        <span aria-hidden="true">🔞</span>
        <span>{t?.('forum_report_reason_porn')}</span>
      </button>
      <button
        type="button"
        className="reportItem"
        role="menuitem"
        disabled={busy}
        onClick={() => {
          onClose?.()
          onSelect?.('violence')
        }}
      >
        <span aria-hidden="true">⚔️</span>
        <span>{t?.('forum_report_reason_violence')}</span>
      </button>
      <button
        type="button"
        className="reportItem"
        role="menuitem"
        disabled={busy}
        onClick={() => {
          onClose?.()
          onSelect?.('boring')
        }}
      >
        <span aria-hidden="true">🙈</span>
        <span>{t?.('forum_report_reason_boring')}</span>
      </button>
    </div>
  )
}
