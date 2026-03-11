'use client'

import React from 'react'
import useQCoinLive from '../hooks/useQCoinLive'
import { cls } from '../../../shared/utils/classnames'

export default function QCoinInline({ t, userKey, vipActive, anchorRef }) {
  const q = useQCoinLive(userKey, !!vipActive)
  const clsVal = q.paused ? 'qcoinValue paused' : 'qcoinValue live'

  const TOTAL_DIGITS = 11
  const raw = Number(q.balanceDisplay ?? q.balance ?? 0)

  let formattedBalance
  if (!Number.isFinite(raw) || raw <= 0) {
    formattedBalance = '0.' + '0'.repeat(TOTAL_DIGITS - 1)
  } else {
    const abs = Math.abs(raw)
    const intDigits = Math.max(1, Math.floor(Math.log10(abs)) + 1)
    const decimals = Math.max(0, TOTAL_DIGITS - intDigits)
    formattedBalance = raw.toFixed(decimals)
  }

  return (
    <div className="qcoinRow qcoinCol" translate="no">
      <div className="qcoinTop">
        <span className="qcoinLabel">Q COIN</span>
        <span
          className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
          role="button"
          tabIndex={0}
          aria-label={t('forum_qcoin_x2_label')}
          title={vipActive ? t('forum_qcoin_x2_active') : t('forum_qcoin_x2_get')}
          onClick={() => {
            try {
              window.dispatchEvent(new Event('vip:open'))
            } catch {}
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              try {
                window.dispatchEvent(new Event('vip:open'))
              } catch {}
            }
          }}
          suppressHydrationWarning
        >
          ×2
        </span>
      </div>

      <span
        ref={anchorRef}
        className={clsVal}
        onClick={() => {
          try {
            window.dispatchEvent(new Event('qcoin:open'))
          } catch {}
          try {
            q.open?.()
          } catch {}
        }}
        style={{ cursor: 'pointer' }}
        title={t('forum_qcoin_open_hint')}
        suppressHydrationWarning
      >
        {formattedBalance}
      </span>
    </div>
  )
}
