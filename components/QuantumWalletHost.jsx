'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const QuantumWalletRuntime = dynamic(() => import('./QuantumWallet'), {
  ssr: false,
})

function isBrowser() {
  return typeof window !== 'undefined'
}

function readUnifiedAccountId() {
  if (!isBrowser()) return ''
  try {
    const w = window
    const ls = window.localStorage
    const fromGlobal = w.__AUTH_ACCOUNT__ || w.__ASHER_ID__ || w.__QL7_UID__
    if (fromGlobal) return String(fromGlobal)

    const fromLs =
      ls.getItem('account') ||
      ls.getItem('wallet') ||
      ls.getItem('asherId') ||
      ls.getItem('ql7_uid') ||
      ls.getItem('forum_user_id')

    return fromLs ? String(fromLs) : ''
  } catch {
    return ''
  }
}

export default function QuantumWalletHost() {
  const [runtime, setRuntime] = useState(null)

  const closeRuntime = useCallback(() => {
    setRuntime(null)
  }, [])

  const openRuntime = useCallback((event) => {
    const detail = event?.detail || {}
    const userKey = detail.userKey || detail.accountId || detail.uid || readUnifiedAccountId()
    const vipActive = typeof detail.vipActive === 'boolean' ? detail.vipActive : !!detail.vip

    setRuntime({
      key: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
      userKey,
      vipActive,
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
