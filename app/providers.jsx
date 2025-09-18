// app/providers.jsx
'use client'

import { useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  avalanche,
  base
} from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

// !! ВАЖНО: пропиши ПУБЛИЧНЫЙ https URL твоего сайта.
// На локалке можно оставить http://localhost:3000,
// но на проде ОБЯЗАТЕЛЬНО https://www.quantuml7ai.com/
const dappUrl =
  typeof window !== 'undefined'
    ? window?.location?.origin
    : 'https://www.quantuml7ai.com'

// Минимальная «паспортка» dapp для WalletConnect (must-have на мобильных)
const metadata = {
  name: 'Quantum L7 AI',
  description: 'AI-driven crypto insights, signals & execution.',
  url: dappUrl, // должен быть https в продакшене
  icons: ['https://www.quantuml7ai.com/branding/ql7-logo-512.png']
}

const chains = [mainnet, polygon, arbitrum, optimism, bsc, avalanche, base]
const transports = chains.reduce((acc, c) => ({ ...acc, [c.id]: http() }), {})

const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true
})

export default function Providers({ children }) {
  useEffect(() => {
    // только на клиенте и один раз
    if (typeof window === 'undefined') return
    if (!projectId) {
      console.error('NEXT_PUBLIC_WC_PROJECT_ID is missing')
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
          // ключевое — прокинуть metadata (иначе мобилки часто «пустые»)
          metadata,
          // по желанию: подсветить популярные мобильные кошельки
          mobileWallets: [
            { id: 'metamask', name: 'MetaMask' },
            { id: 'trust', name: 'Trust Wallet' },
            { id: 'okx', name: 'OKX' },
            { id: 'binance', name: 'Binance Web3' },
            { id: 'phantom', name: 'Phantom' }
          ]
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
