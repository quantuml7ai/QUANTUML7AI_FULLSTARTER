'use client';

import { useEffect } from 'react';

let providersCtxPromise = null;
let providersCtxCache = null;
let walletWatchUnsubscribe = null;
let walletReconnectPromise = null;
let walletReconnectAt = 0;
const WALLET_RECONNECT_COOLDOWN_MS = 1200;
let walletAuthSnapshot = {
  address: '',
  isConnected: false,
  status: 'disconnected',
};

function markStartup(label, extra = {}) {
  try {
    window?.markForumStartup?.(label, extra);
  } catch {}
}

function readWalletProviderHint() {
  try {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('w3m-auth-provider') ||
      localStorage.getItem('W3M_CONNECTED_CONNECTOR') ||
      null
    );
  } catch {
    return null;
  }
}

function emitWalletState(detail) {
  try {
    window.dispatchEvent(
      new CustomEvent('ql7:wallet-state', {
        detail: detail && typeof detail === 'object' ? detail : {},
      }),
    );
  } catch {}
}

function isWalletAccountConnected(account) {
  const status = String(account?.status || '');
  return !!(
    account?.isConnected &&
    account?.address &&
    status === 'connected'
  );
}

function readWalletAccount(ctx) {
  try {
    if (!ctx?.config || typeof ctx?.getAccount !== 'function') return null;
    return ctx.getAccount(ctx.config) || null;
  } catch {
    return null;
  }
}

function clearWalletProviderHints() {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('w3m-auth-provider');
    localStorage.removeItem('W3M_CONNECTED_CONNECTOR');
  } catch {}
}

function syncWalletAuthState(nextAccount, prevAccount, source = 'watch_account') {
  if (typeof window === 'undefined') return;

  const nextConnected = isWalletAccountConnected(nextAccount);
  const prevConnected = isWalletAccountConnected(prevAccount);
  const nextAddress = nextConnected ? String(nextAccount.address) : '';
  const prevAddress = prevConnected ? String(prevAccount.address) : '';
  const nextStatus = String(nextAccount?.status || (nextConnected ? 'connected' : 'disconnected'));
  const provider = String(readWalletProviderHint() || 'wallet');

  emitWalletState({
    address: nextAddress || null,
    isConnected: nextConnected,
    provider,
    status: nextStatus,
  });

  if (nextConnected) {
    try {
      window.__AUTH_ACCOUNT__ = nextAddress;
    } catch {}

    const shouldAnnounce =
      !prevConnected ||
      nextAddress !== prevAddress ||
      walletAuthSnapshot.address !== nextAddress ||
      walletAuthSnapshot.status !== 'connected';

    walletAuthSnapshot = {
      address: nextAddress,
      isConnected: true,
      status: 'connected',
    };

    if (shouldAnnounce) {
      markStartup('auth_ok_dispatch', { provider, source });
      try {
        window.dispatchEvent(
          new CustomEvent('auth:ok', {
            detail: { accountId: nextAddress, provider },
          }),
        );
      } catch {}
    }
    return;
  }

  const shouldLogout = prevConnected || walletAuthSnapshot.isConnected;
  walletAuthSnapshot = {
    address: '',
    isConnected: false,
    status: nextStatus,
  };

  if (shouldLogout) {
    markStartup('auth_logout_dispatch', { provider, source });
    try {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch {}
  }
}

async function reconnectWalletSession(ctx, source = 'manual_reconnect') {
  if (!ctx?.config || typeof ctx?.reconnect !== 'function') {
    return readWalletAccount(ctx);
  }

  const now = Date.now();
  if (!walletReconnectPromise && now - walletReconnectAt < WALLET_RECONNECT_COOLDOWN_MS) {
    return readWalletAccount(ctx);
  }

  if (!walletReconnectPromise) {
    walletReconnectAt = now;
    markStartup('providers_reconnect_start', { source });
    walletReconnectPromise = (async () => {
      try {
        await ctx.reconnect(ctx.config);
      } catch (err) {
        markStartup('providers_reconnect_error', {
          source,
          message: String(err?.message || err || ''),
        });
      }
      return readWalletAccount(ctx);
    })().finally(() => {
      walletReconnectPromise = null;
    });
  }

  const nextAccount = await walletReconnectPromise;
  if (isWalletAccountConnected(nextAccount)) {
    syncWalletAuthState(nextAccount, nextAccount, 'reconnect');
    markStartup('providers_reconnect_connected', { source });
  }
  return nextAccount;
}

async function forceWalletDisconnect(ctx, source = 'manual_force_disconnect') {
  const prevAccount = readWalletAccount(ctx);
  let disconnectSource = 'none';
  let disconnectError = '';

  if (ctx?.config && typeof ctx?.disconnect === 'function') {
    try {
      await ctx.disconnect(ctx.config);
      disconnectSource = 'wagmi_actions';
    } catch (err) {
      disconnectError = String(err?.message || err || '');
    }
  }

  if (disconnectSource === 'none' && typeof ctx?.appKit?.disconnect === 'function') {
    try {
      await ctx.appKit.disconnect();
      disconnectSource = 'appkit';
    } catch (err) {
      if (!disconnectError) {
        disconnectError = String(err?.message || err || '');
      }
    }
  }

  const nextAccount = readWalletAccount(ctx);
  const stillConnected = isWalletAccountConnected(nextAccount);
  if (stillConnected) {
    markStartup('providers_force_disconnect_failed', {
      source,
      disconnectSource,
      message: disconnectError,
    });
    return false;
  }

  clearWalletProviderHints();
  syncWalletAuthState(nextAccount, prevAccount, 'force_disconnect');
  markStartup('providers_force_disconnect_ok', {
    source,
    disconnectSource,
  });
  return true;
}

function installWalletAccountWatcher(ctx) {
  if (!ctx?.config || typeof ctx.watchAccount !== 'function') return;
  if (walletWatchUnsubscribe) return;

  try {
    const initialAccount = readWalletAccount(ctx);
    syncWalletAuthState(initialAccount, initialAccount, 'runtime_snapshot');
  } catch {}

  try {
    walletWatchUnsubscribe = ctx.watchAccount(ctx.config, {
      onChange(account, prevAccount) {
        syncWalletAuthState(account, prevAccount, 'watch_account');
      },
    });
  } catch (err) {
    markStartup('providers_watch_account_error', {
      message: String(err?.message || err || ''),
    });
  }
}

async function ensureProvidersCtx(reason = 'manual') {
  if (providersCtxCache?.config && providersCtxCache?.appKit) {
    return providersCtxCache;
  }

  if (!providersCtxPromise) {
    providersCtxPromise = (async () => {
      markStartup('providers_ctx_import_start', { reason });

      const [
        { createWeb3Modal, defaultWagmiConfig },
        chains,
        { getAccount, watchAccount, reconnect, disconnect },
      ] = await Promise.all([
        import('@web3modal/wagmi/react'),
        import('wagmi/chains'),
        import('wagmi/actions'),
      ]);

      const { mainnet, polygon, arbitrum, base, bsc, optimism, avalanche } = chains;
      const chainsArr = [mainnet, polygon, arbitrum, base, bsc, optimism, avalanche];

      const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
      if (!projectId) console.warn('NEXT_PUBLIC_WC_PROJECT_ID is empty');

      const metadata = {
        name: 'Quantum L7 AI',
        description: 'Signals · research · multi-chain',
        url:
          typeof window !== 'undefined' && window.location
            ? window.location.origin
            : 'http://localhost',
        icons: ['/branding/ql7-logo-512.png'],
      };

      const config = defaultWagmiConfig({
        projectId,
        chains: chainsArr,
        metadata,
      });

      let appKit = window.__ql7Web3ModalAppKit;
      if (!appKit) {
        appKit = createWeb3Modal({
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
        window.__ql7Web3ModalAppKit = appKit;
        window.__ql7Web3ModalInit = true;
      }

      providersCtxCache = {
        appKit,
        config,
        getAccount,
        watchAccount,
        reconnect,
        disconnect,
      };

      installWalletAccountWatcher(providersCtxCache);

      markStartup('providers_ctx_ready', {
        walletProjectIdPresent: !!projectId,
        chainCount: chainsArr.length,
        reason,
      });

      try {
        window.dispatchEvent(
          new CustomEvent('ql7:wallet-runtime-ready', {
            detail: {
              chainCount: chainsArr.length,
              reason,
            },
          }),
        );
      } catch {}

      return providersCtxCache;
    })().catch((err) => {
      providersCtxPromise = null;
      throw err;
    });
  }

  return providersCtxPromise;
}

async function openWalletModal(source = 'manual', options = {}) {
  const ctx = await ensureProvidersCtx(source);
  markStartup('providers_open_auth', { source });

  const preferredView = String(options?.view || '').trim().toLowerCase();
  let nextView = 'Connect';

  let account = readWalletAccount(ctx);
  let accountConnected = isWalletAccountConnected(account);
  const accountAddress = String(account?.address || '').trim().toLowerCase();
  const snapshotAddress = String(walletAuthSnapshot.address || '').trim().toLowerCase();
  const snapshotConnected =
    !!walletAuthSnapshot.isConnected &&
    !!snapshotAddress &&
    String(walletAuthSnapshot.status || '') === 'connected';
  const accountMatchesSnapshot = snapshotConnected
    ? accountAddress && accountAddress === snapshotAddress
    : true;
  const canOpenAccountView = !!(accountConnected && accountMatchesSnapshot);

  if (preferredView === 'account') {
    nextView = canOpenAccountView ? 'Account' : 'Connect';
  } else if (preferredView === 'connect') {
    nextView = 'Connect';
  } else if (canOpenAccountView) {
    nextView = 'Account';
  } else {
    nextView = 'Connect';
  }

  if (preferredView === 'account' && nextView !== 'Account') {
    markStartup('providers_account_view_downgrade_to_connect', {
      source,
      accountConnected: !!accountConnected,
      snapshotConnected: !!snapshotConnected,
      accountMatchesSnapshot: !!accountMatchesSnapshot,
    });
  }

  try {
    await ctx?.appKit?.open?.({ view: nextView });
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (nextView === 'Account' && /No account provided/i.test(msg)) {
      markStartup('providers_account_view_no_account_fallback', { source });
      await ctx?.appKit?.open?.({ view: 'Connect' });
    } else {
      throw err;
    }
  }

  if (!accountConnected) {
    void reconnectWalletSession(ctx, `${source}:post_open_reconnect`).then((nextAccount) => {
      if (isWalletAccountConnected(nextAccount)) return;
      if (walletAuthSnapshot.isConnected) {
        void forceWalletDisconnect(ctx, `${source}:post_open_stale_reset`);
      }
    });
  }
}

export default function Providers({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    window.__QL7_LOAD_WALLET_RUNTIME__ = (reason = 'external_request') =>
      ensureProvidersCtx(String(reason || 'external_request'));
    window.__QL7_OPEN_AUTH__ = async (options = {}) => {
      const source =
        typeof options === 'string'
          ? options
          : String(options?.source || 'external_request');
      const view =
        typeof options === 'object' && options
          ? String(options?.view || '').trim()
          : '';
      await openWalletModal(source, { view });
    };
    window.__QL7_FORCE_DISCONNECT__ = async (reason = 'external_request') => {
      const source = String(reason || 'external_request');
      const ctx = await ensureProvidersCtx(`force_disconnect:${source}`);
      return forceWalletDisconnect(ctx, source);
    };
    window.__QL7_WALLET_RUNTIME_STATE__ = () => ({
      address: walletAuthSnapshot.address || null,
      isConnected: !!walletAuthSnapshot.isConnected,
      provider: readWalletProviderHint() || null,
      ready: !!providersCtxCache?.appKit,
      status: String(walletAuthSnapshot.status || 'disconnected'),
    });

    const onOpenAuth = (event) => {
      const source = String(event?.detail?.source || 'window_event');
      const view = String(event?.detail?.view || '').trim();
      markStartup('open_auth_requested', { source });
      const result = openWalletModal(source, { view });
      if (result && typeof result.catch === 'function') {
        result.catch((err) => {
          markStartup('providers_open_auth_error', {
            message: String(err?.message || err || ''),
            source,
          });
        });
      }
    };

    window.addEventListener('open-auth', onOpenAuth);

    return () => {
      window.removeEventListener('open-auth', onOpenAuth);
      try {
        delete window.__QL7_LOAD_WALLET_RUNTIME__;
      } catch {}
      try {
        delete window.__QL7_OPEN_AUTH__;
      } catch {}
      try {
        delete window.__QL7_FORCE_DISCONNECT__;
      } catch {}
      try {
        delete window.__QL7_WALLET_RUNTIME_STATE__;
      } catch {}
    };
  }, []);
  return children;
}
