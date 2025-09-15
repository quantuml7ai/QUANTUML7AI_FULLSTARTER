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
  ssr: true
})

export default function Providers({ children }) {
  useEffect(() => {
    if (!projectId) return
    // Динамический импорт снижает нагрузку на первоначальную сборку
    ;(async () => {
      const { createWeb3Modal } = await import('@web3modal/wagmi/react')
      createWeb3Modal({
        wagmiConfig,
        projectId,
        chains,
        themeMode: 'dark'
      })
    })()
  }, [])

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
