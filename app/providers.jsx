'use client'

import dynamic from 'next/dynamic'

const WalletRuntimeBridge = dynamic(() => import('../components/WalletRuntimeBridge'), {
  ssr: false,
})

export default function Providers({ children }) {
  return (
    <>
      {children}
      <WalletRuntimeBridge />
    </>
  )
}
