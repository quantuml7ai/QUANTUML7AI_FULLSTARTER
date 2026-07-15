'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { runAuthorizedClientAction } from '../lib/authActionGateClient'

const QuantumWalletRuntime = dynamic(() => import('./QuantumWallet'), {
  ssr: false,
})

function isBrowser() {
  return typeof window !== 'undefined'
}

export default function QuantumWalletHost() {
  const [runtime, setRuntime] = useState(null)

  const closeRuntime = useCallback(() => {
    setRuntime(null)
  }, [])

  const openRuntime = useCallback((event) => {
    const detail = event?.detail || {}
    const vipActive = typeof detail.vipActive === 'boolean' ? detail.vipActive : !!detail.vip
    const eventType = String(event?.type || 'quantum-wallet:open')

    void runAuthorizedClientAction({
      actionKey: 'quantum-wallet-host-open',
      source: `${eventType}:${String(detail.source || 'wallet-trigger')}`,
      action: (accountId) => {
        setRuntime({
          key: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
          userKey: accountId,
          vipActive,
        })
      },
    })
  }, [])

  useEffect(() => {
    if (!isBrowser()) return undefined

    window.addEventListener('quantum-wallet:open', openRuntime)
    window.addEventListener('qcoin:open', openRuntime)
    window.addEventListener('quantum-wallet:close', closeRuntime)

    return () => {
      window.removeEventListener('quantum-wallet:open', openRuntime)
      window.removeEventListener('qcoin:open', openRuntime)
      window.removeEventListener('quantum-wallet:close', closeRuntime)
    }
  }, [openRuntime, closeRuntime])

  if (!runtime) return null

  return (
    <QuantumWalletRuntime
      key={runtime.key}
      userKey={runtime.userKey}
      vipActive={runtime.vipActive}
      onClose={closeRuntime}
    />
  )
}
