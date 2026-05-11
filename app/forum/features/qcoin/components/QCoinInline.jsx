'use client'

import React from 'react'
import useQCoinLive from '../hooks/useQCoinLive'
import { cls } from '../../../shared/utils/classnames'
import { formatQCoinBalance } from '../utils/formatQCoinBalance'

export default function QCoinInline({ t, userKey, vipActive, anchorRef }) {
  const q = useQCoinLive(userKey, !!vipActive)
  const clsVal = q.paused ? 'qcoinValue paused' : 'qcoinValue live'
  const formattedBalance = formatQCoinBalance(q.balanceDisplay ?? q.balance ?? 0)
  const walletTitle = t?.('quantum_wallet_open_aria') || t?.('forum_qcoin_open_hint') || 'Open Quantum Wallet'

  const openQuantumWallet = () => {
    try {
      window.dispatchEvent(new CustomEvent('quantum-wallet:open', {
        detail: { userKey, vipActive: !!vipActive },
      }))
    } catch {}
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
        onClick={openQuantumWallet}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openQuantumWallet()
          }
        }}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        title={walletTitle}
        aria-label={walletTitle}
        suppressHydrationWarning
      >
        {formattedBalance}
      </span>
    </div>
  )
}
