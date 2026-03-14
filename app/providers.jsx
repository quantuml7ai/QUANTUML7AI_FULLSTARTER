'use client';

import { useEffect, useState } from 'react';

let providersCtxPromise = null;
let providersCtxCache = null;

export default function Providers({ children }) {
  const [ctx, setCtx] = useState(null); // { WagmiProvider, config }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (providersCtxCache) {
      setCtx(providersCtxCache);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!providersCtxPromise) {
          providersCtxPromise = (async () => {
            const [{ createWeb3Modal, defaultWagmiConfig }, { WagmiProvider }, chains] =
              await Promise.all([
                import('@web3modal/wagmi/react'),
                import('wagmi'),
                import('wagmi/chains'),
              ]);

            const { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } = chains;
            const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche];

            const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
            if (!projectId) console.warn('вљ пёЏ NEXT_PUBLIC_WC_PROJECT_ID is empty');

            const metadata = {
              name: 'Quantum L7 AI',
              description: 'Signals В· research В· multi-chain',
              url: window.location.origin,
              icons: ['/branding/ql7-logo-512.png'],
            };

            const config = defaultWagmiConfig({
              projectId,
              chains: chainsArr,
              metadata,
            });

            if (!window.__ql7Web3ModalInit) {
              createWeb3Modal({
                wagmiConfig: config,
                projectId,
                chains: chainsArr,
                themeMode: 'dark',
                enableAnalytics: true,
                enableExplorer: true,
                explorerRecommendedWalletIds: 'NONE',
                featuredWalletIds: [
                  'metaMask',
                  'phantom',
                  'trust',
                  'okx',
                  'coinbaseWallet',
                  'brave',
                ],
              });
              window.__ql7Web3ModalInit = true;
            }

            providersCtxCache = { WagmiProvider, config };
            return providersCtxCache;
          })();
        }

        const nextCtx = await providersCtxPromise;
        if (!cancelled) setCtx(nextCtx);
      } catch (err) {
        console.error('[providers] init error', err);
        if (!cancelled) setCtx(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ctx?.WagmiProvider) return null;

  const { WagmiProvider, config } = ctx;
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
