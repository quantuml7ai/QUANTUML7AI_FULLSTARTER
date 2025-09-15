// app/providers.jsx
'use client'

import { useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, bsc, avalanche, base } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

const chains = [mainnet, polygon, arbitrum, optimism, bsc, avalanche, base]
const transports = chains.reduce((acc, c) => ({ ...acc, [c.id]: http() }), {})

const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true
})

export default function Providers({ children }) {
  useEffect(() => {
    if (!projectId) return
    let mounted = true
    ;(async () => {
      try {
        const { createWeb3Modal } = await import('@web3modal/wagmi/react')
        if (!mounted) return
        // Инициализируем 1 раз
        if (!window.__W3M_INITIALIZED__) {
          window.__W3M_INITIALIZED__ = 'loading'
          createWeb3Modal({ wagmiConfig, projectId, chains, themeMode: 'dark' })
          window.__W3M_INITIALIZED__ = true
          window.dispatchEvent(new Event('w3m-ready'))
        }
      } catch (e) {
        console.error('Web3Modal init error:', e)
        window.__W3M_INITIALIZED__ = false
      }
    })()
    return () => { mounted = false }
  }, [])

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
