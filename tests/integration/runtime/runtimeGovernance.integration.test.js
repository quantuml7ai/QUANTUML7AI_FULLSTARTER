import { describe, expect, test, vi } from 'vitest';
import { createRuntimeRegistry } from '../../../src/shared/runtime/identity/runtimeRegistry.js';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';
import { readRouteCapabilities } from '../../../src/shared/runtime/budgets/routeCapabilities.js';
import { buildRuntimePassport } from '../../../src/shared/runtime/passports/runtimePassport.js';
import { verifyStoredWalletSession } from '../../../lib/walletSessionClient.js';

describe('runtime governance integration', () => {
  test('single-owner arbitration keeps content ahead of ad and qcast', () => {
    const engine = createBudgetEngine({ routeProfiles });
    const winner = engine.evaluateOwnerConflict({
      profileId: 'forum-feed-mobile',
      candidates: [
        { runtimeId: 'qcast:1', ownerType: 'qcast', lastActivityAt: 3 },
        { runtimeId: 'ad:1', ownerType: 'ad', lastActivityAt: 4 },
        { runtimeId: 'content:1', ownerType: 'content', lastActivityAt: 2 },
      ],
    });

    expect(winner.runtimeId).toBe('content:1');
  });

  test('forum mobile budget blocks a second iframe and passport exposes the pressure', () => {
    const registry = createRuntimeRegistry([
      {
        runtimeType: 'iframe-video',
        owner: 'feed-owner',
        route: '/forum',
        budgetProfile: 'forum-feed-mobile',
        state: 'active',
      },
      {
        runtimeType: 'html5-video',
        owner: 'feed-owner',
        route: '/forum',
        budgetProfile: 'forum-feed-mobile',
        state: 'active',
        sameSrcGroup: 'same-src:1',
      },
    ]);
    const engine = createBudgetEngine({ routeProfiles });
    const blocked = engine.evaluatePromotion({
      profileId: 'forum-feed-mobile',
      entry: {
        runtimeId: 'iframe:2',
        runtimeType: 'iframe-video',
        owner: 'feed-owner',
        route: '/forum',
      },
      entries: registry.listActive(),
    });
    const passport = buildRuntimePassport({
      route: '/forum',
      budgetProfile: 'forum-feed-mobile',
      registryEntries: registry.list(),
      providerCounts: { heavyProviders: 1 },
      authCounts: { authOkListeners: 2 },
    });

    expect(blocked.allowed).toBe(false);
    expect(passport.countActiveIframe).toBe(1);
    expect(passport.sameSrcPressureScore).toBe(1);
    expect(passport.currentBudgetPressureScore).toBe(2);
  });

  test('route leave cleanup destroys heavy runtime and keeps teardown cleanliness visible', () => {
    const registry = createRuntimeRegistry([
      {
        runtimeType: 'polling-loops',
        owner: 'exchange-widget',
        route: '/exchange',
        budgetProfile: 'exchange-heavy',
        state: 'active',
        teardownExpected: true,
      },
    ]);
    const entry = registry.list()[0];
    registry.destroy(entry.runtimeId, 'route-leave');

    const passport = buildRuntimePassport({
      route: '/exchange',
      budgetProfile: 'exchange-heavy',
      registryEntries: registry.list(),
      providerCounts: {},
      authCounts: {},
    });

    expect(passport.activeRuntimeCount).toBe(0);
    expect(readRouteCapabilities('/exchange').profile.routeLeavePolicy).toBe('strict-route-cleanup');
  });

  test('auth fanout and wallet intent invariants stay explicit in passports and profiles', () => {
    const passport = buildRuntimePassport({
      route: '/ads/home',
      budgetProfile: 'ads-preview',
      registryEntries: [
        { runtimeType: 'auth-runtime', owner: 'auth-bridge', state: 'active' },
      ],
      providerCounts: { heavyProviders: 0 },
      authCounts: {
        authOkListeners: 2,
        authSuccessListeners: 1,
        authLogoutListeners: 1,
      },
    });
    const adsPreview = readRouteCapabilities('/ads/home').profile;
    const about = readRouteCapabilities('/about').profile;

    expect(passport.authFanoutScore).toBe(4);
    expect(adsPreview.allowWalletRuntimeBeforeIntent).toBe(false);
    expect(about.maxNativeContentPlayers).toBe(0);
  });

  test('wallet watchdog verification does not masquerade as a new auth transition', async () => {
    const walletAddress = `0x${'1'.repeat(40)}`;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('ql7_wallet_address', walletAddress);
    localStorage.setItem('ql7_wallet_address_lc', walletAddress.toLowerCase());
    localStorage.setItem('ql7_wallet_account_id', walletAddress);
    localStorage.setItem('ql7_wallet_session_token', 'watchdog-token');
    localStorage.setItem('ql7_wallet_session_expires_at', String(Date.now() + 60_000));
    localStorage.setItem('ql7_wallet_session_provider', 'wallet');

    const authOk = vi.fn();
    const verified = vi.fn();
    const qcoinReady = vi.fn();
    window.addEventListener('auth:ok', authOk);
    window.addEventListener('wallet-session:verified', verified);
    window.addEventListener('qcoin:auth-ready', qcoinReady);

    const fetchMock = vi.fn(async (url, init = {}) => {
      expect(url).toBe('/api/wallet-session');
      expect(JSON.parse(String(init.body || '{}'))).toMatchObject({
        action: 'verify',
        token: 'watchdog-token',
        walletAddress,
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          walletAddress,
          accountId: walletAddress,
          expiresAt: Date.now() + 120_000,
          provider: 'wallet',
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const result = await verifyStoredWalletSession({ emitAuthTransition: false });
      expect(result?.authorized).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(authOk).not.toHaveBeenCalled();
      expect(verified).toHaveBeenCalledTimes(1);
      expect(qcoinReady).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('auth:ok', authOk);
      window.removeEventListener('wallet-session:verified', verified);
      window.removeEventListener('qcoin:auth-ready', qcoinReady);
      localStorage.clear();
      sessionStorage.clear();
    }
  });

  test('default verification still publishes auth:ok for existing non-watchdog callers', async () => {
    const walletAddress = `0x${'2'.repeat(40)}`;
    localStorage.clear();
    localStorage.setItem('ql7_wallet_address', walletAddress);
    localStorage.setItem('ql7_wallet_account_id', walletAddress);
    localStorage.setItem('ql7_wallet_session_token', 'foreground-token');

    const authOk = vi.fn();
    window.addEventListener('auth:ok', authOk);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, walletAddress, accountId: walletAddress, provider: 'wallet' }),
    })));

    try {
      const result = await verifyStoredWalletSession();
      expect(result?.authorized).toBe(true);
      expect(authOk).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('auth:ok', authOk);
      localStorage.clear();
    }
  });

  test('silent auth-transition mode keeps authoritative fail-closed logout intact', async () => {
    const walletAddress = `0x${'3'.repeat(40)}`;
    localStorage.clear();
    localStorage.setItem('ql7_wallet_address', walletAddress);
    localStorage.setItem('ql7_wallet_account_id', walletAddress);
    localStorage.setItem('ql7_wallet_session_token', 'stale-token');

    const authOk = vi.fn();
    const logout = vi.fn();
    window.addEventListener('auth:ok', authOk);
    window.addEventListener('auth:logout', logout);
    window.__QL7_AUTH_LOGOUT_RELOAD_SCHEDULED__ = true;

    const fetchMock = vi.fn(async (url) => {
      if (url === '/api/wallet-session') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ ok: false, error: 'stale_session' }),
        };
      }
      if (url === '/api/qcoin/heartbeat') {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const result = await verifyStoredWalletSession({ emitAuthTransition: false });
      expect(result).toMatchObject({ ok: false, authorized: false, transient: false, error: 'stale_session' });
      expect(authOk).not.toHaveBeenCalled();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('ql7_wallet_session_token')).toBeNull();
      expect(localStorage.getItem('ql7_wallet_account_id')).toBeNull();
    } finally {
      window.removeEventListener('auth:ok', authOk);
      window.removeEventListener('auth:logout', logout);
      delete window.__QL7_AUTH_LOGOUT_RELOAD_SCHEDULED__;
      delete window.__QL7_AUTH_LOGGED_OUT__;
      localStorage.clear();
      sessionStorage.clear();
    }
  });

});
