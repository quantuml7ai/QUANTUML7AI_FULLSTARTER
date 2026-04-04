'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function QCoinWithdrawPopover({
  anchorRef,
  onClose,
  onOpenQuests,
  t,
  questEnabled = false,
  isAuthed = false,
  requireAuth,
}) {
  const router = useRouter()
  const [pos, setPos] = useState({ top: 0, left: 0, maxW: 520, maxH: 600 })

  const handleExchangeClick = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    try {
      onClose?.()
    } catch {}
    try {
      router.push('/exchange')
    } catch {
      try {
        window.location.assign('/exchange')
      } catch {}
    }
  }

  useEffect(() => {
    const btn = anchorRef?.current
    if (!btn) return

    const popParent = btn.closest('section')
    const parentRect =
      popParent?.getBoundingClientRect?.() || {
        top: 0,
        left: 0,
        width: window.innerWidth,
        bottom: window.innerHeight,
      }
    const r = btn.getBoundingClientRect()
    const gap = 8

    const maxW = Math.min(520, (parentRect.width || window.innerWidth) - 16)
    let left = r.left - parentRect.left
    if (left + maxW > (parentRect.width || window.innerWidth)) {
      left = Math.max(8, (parentRect.width || window.innerWidth) - maxW - 8)
    }

    const viewportH = window.innerHeight || document.documentElement.clientHeight || 800
    const spaceBelow = Math.max(160, Math.min(viewportH, parentRect.bottom || viewportH) - r.bottom - gap)
    const maxH = Math.min(1060, Math.floor(spaceBelow - 8))

    setPos({ top: r.bottom - parentRect.top + gap, left, maxW, maxH })
  }, [anchorRef])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    const onClick = (e) => {
      const el = document.querySelector('.qcoinPop')
      if (el && !el.contains(e.target)) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onClick)
    }
  }, [onClose])

  const questBtnClass = `btn questBtn ${!questEnabled ? 'disabled' : isAuthed ? 'green pulse' : 'red pulse'} ${questEnabled ? 'vibrate blink' : ''}`

  const handleQuestClick = async () => {
    if (!questEnabled) return
    if (!isAuthed) {
      const ok = await (typeof requireAuth === 'function' ? requireAuth() : Promise.resolve(false)).catch(() => null)
      if (!ok) return
    }
    try {
      onClose?.()
    } catch {}
    try {
      onOpenQuests?.()
    } catch {}
  }

  return (
    <div
      className="qcoinPop"
      style={{
        position: 'absolute',
        zIndex: 3200,
        top: pos.top,
        left: pos.left,
        width: pos.maxW,
      }}
    >
      <div className="qcoinCard" style={{ '--qcoin-maxh': `${pos.maxH}px` }}>
        <div className="qcoinCardHdr">
          <div className="flex items-center gap-3">
            <video
              className="qcoinMini"
              src="/qcoind/mini.mp4"
              autoPlay
              muted
              loop
              playsInline
                preload="metadata"
            />
          </div>

          <Image
            src="/click/quest.gif"
            alt=""
            width={72}
            height={72}
            unoptimized
            role="button"
            aria-label={t('quest_open')}
            aria-disabled={!questEnabled}
            tabIndex={questEnabled ? 0 : -1}
            onClick={questEnabled ? handleQuestClick : undefined}
            onKeyDown={(e) => {
              if (!questEnabled) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleQuestClick()
              }
            }}
            draggable={false}
            className={`questIconPure ${questBtnClass}`}
            style={{
              ['--quest-w']: '72px',
              ['--quest-h']: 'auto',
              ['--quest-cursor']: questEnabled ? 'pointer' : 'default',
              ['--quest-y']: '-14px',
              width: 'var(--quest-w)',
              height: 'var(--quest-h)',
            }}
          />

          <button className="btn btnGhost" onClick={onClose}>
            {t('forum_close')}
          </button>
        </div>

        <div>
          <div className="qcoinLabel" style={{ fontSize: '2.00rem' }}>
            Q COIN
          </div>
          <div className="meta">{t('forum_qcoin_desc')}</div>
        </div>

        <div className="qcoinPopBody">
          <div className="meta">{t('forum_qcoin_withdraw_note')}</div>
        </div>

        <div className="qcActions">
          <button type="button" className="btn qcBtn qcExchange" onClick={handleExchangeClick} title={t('forum_qcoin_exchange')}>
            {t('forum_qcoin_exchange')}
          </button>

          <button type="button" className="btn qcBtn qcWithdraw" disabled title={t('forum_qcoin_withdraw')}>
            {t('forum_qcoin_withdraw')}
          </button>
        </div>
      </div>
    </div>
  )
}
