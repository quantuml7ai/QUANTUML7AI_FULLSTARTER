'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  buildCanonicalPostUrl,
  buildShareTitle,
  copyToClipboard,
  getShareTargets,
  safeOpen,
  tryNativeShare,
} from '../../lib/forumShareManager'

export default function SharePopover({ open, post, onClose, t, toast }) {
  const [mounted, setMounted] = React.useState(false)
  const [copyFallback, setCopyFallback] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const lastFocusRef = React.useRef(null)
  const firstBtnRef = React.useRef(null)
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return
    if (typeof document === 'undefined') return
    lastFocusRef.current = document.activeElement
    setCopyFallback(false)
    setCopied(false)
    const id = window.setTimeout(() => {
      try {
        firstBtnRef.current?.focus?.()
      } catch {}
    }, 0)
    return () => window.clearTimeout(id)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  React.useEffect(() => {
    if (open) return
    const prev = lastFocusRef.current
    lastFocusRef.current = null
    if (prev && typeof prev.focus === 'function') {
      try {
        prev.focus()
      } catch {}
    }
  }, [open])

  if (!open || !mounted) return null

  const canonicalUrl = buildCanonicalPostUrl(post?.id)
  const shareTitle = buildShareTitle(post, {
    generic: (t?.('forum_share_post_generic') || 'Forum post').trim(),
  })
  const shareText = shareTitle
  const sharePayload = `${shareTitle} ${canonicalUrl}`.trim()
  const targets = getShareTargets({
    url: canonicalUrl,
    text: shareText,
    labels: {
      tg: t?.('forum_share_tg') || 'Telegram',
      ig: t?.('forum_share_ig') || 'Instagram',
      wa: t?.('forum_share_wa') || 'WhatsApp',
      viber: t?.('forum_share_viber') || 'Viber',
      fb: t?.('forum_share_fb') || 'Facebook',
      x: t?.('forum_share_x') || 'X',
    },
  })

  const copy = async () => {
    const res = await copyToClipboard(sharePayload)
    if (res?.ok) {
      setCopied(true)
      toast?.ok?.(t?.('forum_copied') || 'Copied!')
      return
    }
    setCopyFallback(true)
    toast?.warn?.(t?.('forum_copy_fallback') || 'Select the link and copy it manually')
    try {
      inputRef.current?.focus?.()
      inputRef.current?.select?.()
    } catch {}
  }

  const onTarget = async (target) => {
    const key = String(target?.key || '')

    if (key === 'ig') {
      const ok = await tryNativeShare({
        title: shareTitle,
        text: shareText || shareTitle,
        url: canonicalUrl,
      })
      if (ok) return
      toast?.info?.(
        t?.('forum_share_ig_hint') || 'Instagram: use system share or copy the link',
      )
      return
    }

    if (target?.url) {
      safeOpen(target.url)
      return
    }
  }

  return createPortal(
    <div
      className="shareOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={t?.('forum_share') || 'Share'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="sharePopover neon glass"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="shareHead">
          <div className="shareTitle">{t?.('forum_share') || 'Share'}</div>
          <button
            type="button"
            className="shareClose"
            aria-label={t?.('invite_close') || 'Close'}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="shareGrid" role="list">
          {targets.map((x, idx) => (
            <button
              key={x.key}
              type="button"
              role="listitem"
              className="shareTarget"
              ref={idx === 0 ? firstBtnRef : null}
              onClick={() => onTarget(x)}
            >
              <span className="shareIcon">
                <Image src={x.icon} alt="" width={32} height={32} />
              </span>
              <span className="shareLabel">{x.label}</span>
            </button>
          ))}
        </div>

        <div className="shareCopyBlock">
          <div className="shareCopyRow">
            <input
              ref={inputRef}
              className="shareUrlInput"
              value={sharePayload}
              readOnly
              aria-label={t?.('forum_share_link') || 'Post link'}
              onFocus={(e) => {
                if (copyFallback) {
                  try {
                    e.target.select()
                  } catch {}
                }
              }}
            />
            <button
              type="button"
              className={`btn btnGhost btnXs shareCopyBtn ${copied ? 'copied' : ''}`}
              onClick={copy}
            >
              {copied
                ? (t?.('forum_copied') || 'Copied!')
                : (t?.('forum_copy_link') || 'Copy link')}
            </button>
          </div>
          {copyFallback && (
            <div className="shareHint">
              {t?.('forum_copy_manual') ||
                'Select the link and copy (Ctrl+C / long press).'}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
