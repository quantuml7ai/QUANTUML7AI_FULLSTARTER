// app/providers.jsx
'use client'

import { useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, bsc, avalanche, base } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

const chains = [mainnet, polygon, arbitrum, optimism, bsc, avalanche, base]
const transports = chains.reduce((acc, c) => ({ ...acc, [c.id]: http() }), {})

const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true, // ok для next/app, но web3modal инициализируем только на клиенте
})

export default function Providers({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!projectId) {
      console.warn('NEXT_PUBLIC_WC_PROJECT_ID is missing — Web3Modal will not initialize')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { createWeb3Modal } = await import('@web3modal/wagmi/react')
        if (cancelled) return
        createWeb3Modal({
          wagmiConfig,
          projectId,
          chains,
          themeMode: 'dark',
        })
      } catch (e) {
        console.error('Failed to init Web3Modal:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
