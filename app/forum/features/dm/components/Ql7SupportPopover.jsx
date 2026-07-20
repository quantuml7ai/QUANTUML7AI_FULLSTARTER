'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  QL7_SUPPORT_AVATAR_URL,
  resolveQl7SupportDisplayName,
} from '../../../../../lib/ql7-support/systemActor'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export default function Ql7SupportPopover({
  anchor,
  open,
  onClose,
  t,
}) {
  const panelRef = React.useRef(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  React.useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const update = () => {
      const rect = anchor?.getBoundingClientRect?.()
      const width = Math.min(360, Math.max(280, window.innerWidth - 24))
      const height = 280
      const left = rect
        ? clamp(rect.left, 12, Math.max(12, window.innerWidth - width - 12))
        : clamp((window.innerWidth - width) / 2, 12, Math.max(12, window.innerWidth - width - 12))
      const preferredTop = rect ? rect.bottom + 10 : (window.innerHeight - height) / 2
      const top = clamp(preferredTop, 12, Math.max(12, window.innerHeight - height - 12))
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchor, open])

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    const onPointer = (event) => {
      const panel = panelRef.current
      if (!panel) return
      if (panel.contains(event.target)) return
      if (anchor?.contains?.(event.target)) return
      onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [anchor, onClose, open])

  if (!open || typeof document === 'undefined') return null

  const title = t?.('ql7_support_popover_title') || resolveQl7SupportDisplayName(t)
  const name = t?.('ql7_support_display_name') || resolveQl7SupportDisplayName(t)

  return createPortal(
    <div
      ref={panelRef}
      className="ql7SupportPopover"
      role="dialog"
      aria-modal="false"
      aria-label={title}
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
      }}
    >
      <div className="ql7SupportPopoverHead">
        <span className="ql7SupportAvatarShell">
          <Image
            src={QL7_SUPPORT_AVATAR_URL}
            alt={t?.('ql7_support_avatar_alt') || name}
            width={56}
            height={56}
            unoptimized
            className="ql7SupportAvatar"
          />
        </span>
        <span className="ql7SupportTitleBlock">
          <b>{name}</b>
          <span>{t?.('ql7_support_verified') || 'Verified support'}</span>
        </span>
        <button
          type="button"
          className="ql7SupportClose"
          onClick={onClose}
          aria-label={t?.('forum_close') || 'Close'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="ql7SupportRail" aria-hidden="true" />
      <p>{t?.('ql7_support_popover_body') || 'This is the official Quantum L7 AI support account for service notifications and text support requests.'}</p>
      <ul>
        <li>{t?.('ql7_support_popover_can_help') || 'You can receive account, QCoin, VIP, Ads, moderation, and security notices here.'}</li>
        <li>{t?.('ql7_support_popover_text_only') || 'Replies to this thread are sent as text-only support requests.'}</li>
        <li>{t?.('ql7_support_popover_security') || 'Support will never ask for seed phrases, private keys, or wallet secrets.'}</li>
      </ul>
    </div>,
    document.body,
  )
}
