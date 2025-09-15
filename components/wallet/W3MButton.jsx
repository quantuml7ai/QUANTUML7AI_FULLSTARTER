'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function W3MButton({ label = 'Connect Wallet', note = 'Connect wallet' }) {
  const { open } = useWeb3Modal()
  const hasW3M = !!process.env.NEXT_PUBLIC_WC_PROJECT_ID

  return (
    <button
      className="btn"
      onClick={() => {
        if (!hasW3M) { alert(note); return }
        open()
      }}
      aria-label={label}
    >
      🔗 {label}
    </button>
  )
}
