'use client'

import React, { useEffect, useState } from 'react'
import api from '../../../services/forumApi'

export default function AdminPopover({ anchorRef, open, onClose, t, isActive, onActivated, onDeactivated }) {
  const [pass, setPass] = useState('')

  useEffect(() => {
    if (open) setPass('')
  }, [open])

  if (!open || !anchorRef?.current) return null

  const btn = anchorRef.current

  const isRtl =
    typeof document !== 'undefined' &&
    (document.documentElement?.dir === 'rtl' ||
      getComputedStyle(document.documentElement).direction === 'rtl')

  const GAP = 8
  const WANT_W = 260

  const parent = btn.offsetParent || btn.parentElement
  const pRect = parent?.getBoundingClientRect?.() || { left: 0, right: window.innerWidth }
  const r = btn.getBoundingClientRect()

  const maxW = Math.max(200, Math.min(WANT_W, window.innerWidth - GAP * 2))
  const top = Math.round(r.bottom - (parent?.getBoundingClientRect?.()?.top || 0) + GAP)
  let leftAbs = isRtl ? r.left : r.right - maxW
  leftAbs = Math.max(GAP, Math.min(leftAbs, window.innerWidth - maxW - GAP))
  const left = Math.round(leftAbs - pRect.left)

  const activate = async () => {
    const password = pass.trim()
    if (!password) return
    try {
      let rjson
      if (typeof api?.adminVerify === 'function') {
        rjson = await api.adminVerify(password)
      } else {
        const res = await fetch('/api/forum/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'cache-control': 'no-store' },
          body: JSON.stringify({ password }),
          cache: 'no-store',
        })
        rjson = await res.json().catch(() => null)
      }
      if (rjson?.ok) {
        try {
          localStorage.setItem('ql7_admin', '1')
        } catch {}
        onActivated?.()
        onClose?.()
        try {
          location.reload()
        } catch {}
      }
    } catch {}
  }

  const exit = async () => {
    try {
      await fetch('/api/forum/admin/verify', { method: 'DELETE', cache: 'no-store' })
    } catch {}
    try {
      localStorage.removeItem('ql7_admin')
    } catch {}
    onDeactivated?.()
    onClose?.()
  }

  return (
    <div className="adminPop" style={{ top, left, width: maxW }}>
      {isActive ? (
        <div className="grid gap-2">
          <div className="meta">{t('forum_admin_active')}</div>
          <button className="btn" onClick={exit}>
            {t('forum_admin_exit')}
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <label className="block">
            <div className="meta mb-1">{t('forum_admin_pass')}</div>
            <input
              className="input"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={onClose}>
              {t('forum_cancel')}
            </button>
            <button className="btn" onClick={activate}>
              {t('forum_activate')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
