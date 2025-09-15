// app/providers.jsx
'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, bsc, avalanche, base } from 'wagmi/chains'

// WalletConnect
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

// EVM сети
const chains = [mainnet, polygon, arbitrum, optimism, bsc, avalanche, base]
const transports = chains.reduce((acc, c) => ({ ...acc, [c.id]: http() }), {})

// Единый wagmi-конфиг
const wagmiConfig = createConfig({
  chains,
  transports,
  ssr: true
})

// Инициализируем Web3Modal ОДИН РАЗ на клиенте до рендера кнопки
if (typeof window !== 'undefined' && projectId) {
  if (!window.__W3M_INITIALIZED__) {
    window.__W3M_INITIALIZED__ = 'loading'
    import('@web3modal/wagmi/react')
      .then(({ createWeb3Modal }) => {
        try {
          createWeb3Modal({
            wagmiConfig,
            projectId,
            chains,
            themeMode: 'dark'
          })
          window.__W3M_INITIALIZED__ = true
          window.dispatchEvent(new Event('w3m-ready'))
        } catch (e) {
          console.error('Web3Modal init error:', e)
          window.__W3M_INITIALIZED__ = false
        }
      })
      .catch(e => {
        console.error('Web3Modal import error:', e)
        window.__W3M_INITIALIZED__ = false
      })
  }
}

export default function Providers({ children }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
