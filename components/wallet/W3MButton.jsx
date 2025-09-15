// components/wallet/W3MButton.jsx
'use client'

import { useEffect, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'

function ReadyButton({ label, note }) {
  const { open } = useWeb3Modal()
  const hasW3M = !!process.env.NEXT_PUBLIC_WC_PROJECT_ID

  return (
    <button
      className="btn"
      onClick={() => {
        if (!hasW3M) { alert(note || 'Connect your wallet'); return }
        open()
      }}
      aria-label={label}
    >
      🔗 {label || 'Connect Wallet'}
    </button>
  )
}

export default function W3MButton(props) {
  const [ready, setReady] = useState(
    typeof window !== 'undefined' && window.__W3M_INITIALIZED__ === true
  )

  useEffect(() => {
    const onReady = () => setReady(true)
    window.addEventListener('w3m-ready', onReady)
    return () => window.removeEventListener('w3m-ready', onReady)
  }, [])

  if (!ready) {
    return (
      <button className="btn" disabled aria-disabled="true">
        🔗 {props.label || 'Connect Wallet'}
      </button>
    )
  }
  return <ReadyButton {...props} />
}
