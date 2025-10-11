// app/providers.jsx
'use client';

import { useEffect, useState } from 'react';

// Все web3-импорты грузим ТОЛЬКО в браузере, чтобы на сервере не дергать IndexedDB.
export default function Providers({ children }) {
  const [wagmi, setWagmi] = useState(null); // { WagmiProvider, config }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      // Динамические импорты — только на клиенте
      const [{ defaultWagmiConfig }, { createWeb3Modal }, { WagmiProvider }, chains] =
        await Promise.all([
          import('@web3modal/wagmi'),
          import('@web3modal/wagmi/react'),
          import('wagmi'),
          import('wagmi/chains'),
        ]);

      const { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } = chains;
      const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche];

      const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
      // Метаданные кошельков (иконку мы уже добавляли в /public/branding/ql7-logo-512.png)
      const metadata = {
        name: 'Quantum L7 AI',
        description: 'Signals · research · multi-chain',
        url: window.location.origin,
        icons: ['/branding/ql7-logo-512.png'],
      };

      // Конфиг wagmi с корректными коннекторами под Web3Modal
      const config = defaultWagmiConfig({
        chains: chainsArr,
        projectId,
        metadata,
      });

      // Инициализация модалки уже в браузере
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        chains: chainsArr,
        themeMode: 'dark',
        enableAnalytics: true,
      });

      if (!cancelled) setWagmi({ WagmiProvider, config });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!wagmi?.WagmiProvider) return <>{children}</>;

  const { WagmiProvider, config } = wagmi;
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
