// app/providers.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// Если у вас есть глобальные провайдеры (i18n, theme и т.п.) — оставляем их здесь.
// Кошельки подгружаем только в браузере, чтобы на сервере не трогать indexedDB.

export default function Providers({ children }) {
  // держим загруженные модули wagmi / web3modal в состоянии
  const [wagmi, setWagmi] = useState(null); // { WagmiProvider, config }
  const [W3M, setW3M] = useState(null);     // { createWeb3Modal }

  // читаем .env только как константы (это ок и на сервере)
  const WALLET_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
  // сети/чейны можно оставить, если задаёте их вручную строками/ID;
  // но любые импорты из 'viem' / '@web3modal/*' – только динамически ниже.

  useEffect(() => {
    // Защита: выполняем только в браузере
    if (typeof window === 'undefined') return;

    let cancelled = false;

    (async () => {
      // ВАЖНО: все web3 импорты — ТОЛЬКО здесь
      const [{ WagmiProvider, createConfig }, { http }, chainsMod, w3mReact] = await Promise.all([
        import('wagmi'),
        import('wagmi'),
        import('viem/chains'),
        import('@web3modal/wagmi/react')
      ]);

      const { mainnet, polygon, arbitrum, bsc, base, optimism, avalanche } = chainsMod;

      // базовый transport без IndexedDB (http)
      const config = createConfig({
        chains: [mainnet, polygon, arbitrum, bsc, base, optimism, avalanche],
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [arbitrum.id]: http(),
          [bsc.id]: http(),
          [base.id]: http(),
          [optimism.id]: http(),
          [avalanche.id]: http()
        },
        ssr: false, // ключ: не пытаться гидрировать persist-хранилища на сервере
      });

      // создаём модалку уже в браузере
      const { createWeb3Modal } = w3mReact;
      if (WALLET_PROJECT_ID) {
        createWeb3Modal({
          wagmiConfig: config,
          projectId: WALLET_PROJECT_ID,
          enableAnalytics: true,
          themeMode: 'dark',
        });
      }

      if (!cancelled) {
        setWagmi({ WagmiProvider, config });
        setW3M({ createWeb3Modal });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [WALLET_PROJECT_ID]);

  // Пока web3 ещё не подгрузился — просто отдаём детей (сайт работает без модалки)
  if (!wagmi?.WagmiProvider) {
    return <>{children}</>;
  }

  const { WagmiProvider, config } = wagmi;

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}
