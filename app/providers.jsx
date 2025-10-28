'use client';

import { useEffect, useState } from 'react';

export default function Providers({ children }) {
  const [ctx, setCtx] = useState(null); // { WagmiProvider, config }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    (async () => {
      try {
        // Все из одного пакета /react
        const [{ createWeb3Modal, defaultWagmiConfig }, { WagmiProvider }, chains] =
          await Promise.all([
            import('@web3modal/wagmi/react'),
            import('wagmi'),
            import('wagmi/chains')
          ]);

        const { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } = chains;
        const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche];

        const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
        if (!projectId) console.warn('⚠️ NEXT_PUBLIC_WC_PROJECT_ID is empty');

        const metadata = {
          name: 'Quantum L7 AI',
          description: 'Signals · research · multi-chain',
          url: window.location.origin,
          icons: ['/branding/ql7-logo-512.png']
        };

        const config = defaultWagmiConfig({
          projectId,
          chains: chainsArr,
          metadata
        });

        // Инициализация Web3Modal с Explorer
        createWeb3Modal({
          wagmiConfig: config,
          projectId,
          chains: chainsArr,
          themeMode: 'dark',
          enableAnalytics: true,
          enableExplorer: true, // 👈 обязательно для списка 600+ кошельков
          explorerRecommendedWalletIds: 'NONE', // показывает все кошельки
          featuredWalletIds: [
            'metaMask',
            'phantom',
            'trust',
            'okx',
            'coinbaseWallet',
            'brave'
          ]
        });

        if (!cancelled) setCtx({ WagmiProvider, config });
      } catch (err) {
        console.error('[providers] init error', err);
        if (!cancelled) setCtx(null);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (!ctx?.WagmiProvider) return <>{children}</>;

  const { WagmiProvider, config } = ctx;
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
