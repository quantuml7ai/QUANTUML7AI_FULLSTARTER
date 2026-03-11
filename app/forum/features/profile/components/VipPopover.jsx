'use client'

import React from 'react'

export default function VipPopover({ anchorRef, open, onClose, t, vipActive, onPay }) {
  const el = anchorRef?.current
  if (!open || !el) return null
  const btn = el

  const isRtl =
    typeof document !== 'undefined' &&
    (document.documentElement?.dir === 'rtl' ||
      getComputedStyle(document.documentElement).direction === 'rtl')

  const GAP = 8
  const WANT_W = 280

  const parent = btn.offsetParent || btn.parentElement
  const pRect = parent?.getBoundingClientRect?.() || { left: 0, right: window.innerWidth }
  const r = btn.getBoundingClientRect()

  const maxW = Math.max(220, Math.min(WANT_W, window.innerWidth - GAP * 2))
  const top = Math.round(r.bottom - (parent?.getBoundingClientRect?.()?.top || 0) + GAP)
  let leftAbs = isRtl ? r.left : r.right - maxW
  leftAbs = Math.max(GAP, Math.min(leftAbs, window.innerWidth - maxW - GAP))
  const left = Math.round(leftAbs - pRect.left)

  return (
    <div className="adminPop" style={{ top, left, width: maxW }}>
      {vipActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_vip_active')}</div>
          <div className="text-sm opacity-80">{t('forum_vip_thanks')}</div>
          <button className="btn" onClick={onClose}>
            {t('forum_close')}
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="text-lg font-bold">{t('forum_vip_title')}</div>
          <div className="meta">{t('forum_vip_desc')}</div>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={onClose}>
              {t('forum_cancel')}
            </button>
            <button className="btn" onClick={onPay}>
              {t('forum_vip_pay')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
