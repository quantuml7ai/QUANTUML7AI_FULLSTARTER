'use client';

import { useEffect, useMemo } from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  bsc,
  base,
  arbitrum,
  optimism
} from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { cookieStorage, createStorage } from 'wagmi';

/* ---------------- GCX: глобальные CSS-фиксы для модалки ---------------- */
function GCX() {
  return (
    <style
      id="gcx"
      dangerouslySetInnerHTML={{
        __html: `
#w3m-modal, .w3m-modal{position:fixed!important;inset:0!important;z-index:999999!important}
#w3m-modal .w3m-container,.w3m-modal .w3m-container{max-height:100dvh!important}
html,body{overflow:visible!important}
`}}
    />
  );
}

/* ---------------------- Web3 / wagmi провайдер ------------------------ */
export default function Providers({ children }) {
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'YOUR_WC_PROJECT_ID';

  const chains = [mainnet, polygon, bsc, base, arbitrum, optimism];

  // ВАЖНО: cookieStorage — чтобы wagmi не тянул IndexedDB на сервере
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains,
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [bsc.id]: http(),
          [base.id]: http(),
          [arbitrum.id]: http(),
          [optimism.id]: http()
        },
        connectors: [
          injected({ shimDisconnect: true }),
          walletConnect({
            projectId,
            metadata: {
              name: 'Quantum L7 AI',
              description: 'Quantum L7 AI — research, signals, and guarded execution.',
              url: 'https://www.quantuml7ai.com',
              icons: ['https://www.quantuml7ai.com/branding/ql7-logo-512.png']
            },
            showQrModal: true
          })
        ],
        storage: createStorage({ storage: cookieStorage })
      }),
    [projectId]
  );

  // ИНИЦИАЛИЗАЦИЯ MODAL — ТОЛЬКО В БРАУЗЕРЕ (динамический импорт)
  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return;

    (async () => {
      const { createWeb3Modal } = await import('@web3modal/wagmi/react');
      createWeb3Modal({
        wagmiConfig,
        projectId,
        chains,
        themeMode: 'dark',
        themeVariables: { '--w3m-z-index': '999999' },
        mobileWallets: [
          { id: 'metamask', name: 'MetaMask' },
          { id: 'trust', name: 'Trust Wallet' },
          { id: 'okx', name: 'OKX' },
          { id: 'binance', name: 'Binance Web3' },
          { id: 'phantom', name: 'Phantom' }
        ]
      });
    })();
  }, [projectId, wagmiConfig, chains]);

  return (
    <WagmiConfig config={wagmiConfig}>
      <GCX />
      {children}
    </WagmiConfig>
  );
}
