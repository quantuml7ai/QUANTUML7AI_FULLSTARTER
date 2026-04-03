'use client';

import { useEffect, useState } from 'react';

const WC_SINGLETON_KEY = '__ql7_wc_singleton_state__';

function getWalletSingletonState() {
  if (typeof window === 'undefined') {
    return { bootPromise: null, ctx: null, modalCreated: false };
  }
  if (!window[WC_SINGLETON_KEY]) {
    window[WC_SINGLETON_KEY] = { bootPromise: null, ctx: null, modalCreated: false };
  }
  return window[WC_SINGLETON_KEY];
}

export default function Providers({ children }) {
  const [ctx, setCtx] = useState(() => {
    try {
      return getWalletSingletonState().ctx || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const singleton = getWalletSingletonState();

    if (singleton?.ctx?.WagmiProvider) {
      setCtx(singleton.ctx);
      return () => {
        cancelled = true;
      };
    }

    if (!singleton.bootPromise) {
      singleton.bootPromise = (async () => {
        const [{ createWeb3Modal, defaultWagmiConfig }, { WagmiProvider }, chains] =
          await Promise.all([
            import('@web3modal/wagmi/react'),
            import('wagmi'),
            import('wagmi/chains'),
          ]);

        const { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } = chains;
        const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche];
        const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
        if (!projectId) console.warn('[providers] NEXT_PUBLIC_WC_PROJECT_ID is empty');

        const metadata = {
          name: 'Quantum L7 AI',
          description: 'Signals · research · multi-chain',
          url: window.location.origin,
          icons: ['/branding/ql7-logo-512.png'],
        };

        const config = defaultWagmiConfig({
          projectId,
          chains: chainsArr,
          metadata,
        });

        if (!singleton.modalCreated) {
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
          singleton.modalCreated = true;
        }

        const builtCtx = { WagmiProvider, config };
        singleton.ctx = builtCtx;
        return builtCtx;
      })().catch((err) => {
        singleton.bootPromise = null;
        singleton.ctx = null;
        singleton.modalCreated = false;
        throw err;
      });
    }

    singleton.bootPromise
      .then((builtCtx) => {
        if (!cancelled) setCtx(builtCtx || null);
      })
      .catch((err) => {
        console.error('[providers] init error', err);
        if (!cancelled) setCtx(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ctx?.WagmiProvider) return null;

  const { WagmiProvider, config } = ctx;
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
