import { describe, expect, test } from 'vitest';
import { createRuntimeRegistry } from '../../../src/shared/runtime/identity/runtimeRegistry.js';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';
import { readRouteCapabilities } from '../../../src/shared/runtime/budgets/routeCapabilities.js';
import { buildRuntimePassport } from '../../../src/shared/runtime/passports/runtimePassport.js';

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
});
