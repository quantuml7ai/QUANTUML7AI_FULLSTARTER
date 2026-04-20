import { describe, expect, test } from 'vitest';
import { createRuntimeRegistry } from '../../../src/shared/runtime/identity/runtimeRegistry.js';
import { normalizeRuntimeState } from '../../../src/shared/runtime/identity/runtimeStates.js';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { getRouteConstitutionDefaults, routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';
import { resolveRouteProfile } from '../../../src/shared/runtime/budgets/routeProfileResolver.js';
import { buildRuntimePassport } from '../../../src/shared/runtime/passports/runtimePassport.js';
import { formatRuntimePassportText, serializeRuntimePassport } from '../../../src/shared/runtime/passports/runtimePassportSerializer.js';
import { classifyRuntimeDiffReport, createRuntimeDiffReport } from '../../../src/shared/runtime/diff/diffEngine.js';
import { resolveRuntimeModeSummary } from '../../../src/shared/runtime/mode/runtimeModeResolver.js';

describe('runtime governance unit core', () => {
  test('runtime registry registers, updates, destroys and summarizes entries', () => {
    const registry = createRuntimeRegistry();
    const entry = registry.register({
      runtimeType: 'iframe-video',
      owner: 'feed-owner',
      route: '/forum',
      budgetProfile: 'forum-feed-mobile',
      state: 'active',
      sameSrcGroup: 'same-src:1',
      teardownExpected: true,
    });

    registry.update(entry.runtimeId, { state: 'cooling' });
    registry.destroy(entry.runtimeId, 'route-leave');

    expect(registry.get(entry.runtimeId)?.state).toBe('destroyed');
    expect(registry.summary()).toMatchObject({
      total: 1,
      alive: 0,
      byType: { 'iframe-video': 1 },
    });
  });

  test('runtime states normalize for media and non-media types', () => {
    expect(normalizeRuntimeState('iframe-video', 'invalid-state')).toBe('shell');
    expect(normalizeRuntimeState('wallet-runtime', 'invalid-state')).toBe('registered');
  });

  test('route profile resolver maps forum and exchange routes', () => {
    expect(resolveRouteProfile('/forum', 'coarse')).toBe('forum-feed-mobile');
    expect(resolveRouteProfile('/forum', 'fine')).toBe('forum-feed-desktop');
    expect(resolveRouteProfile('/exchange')).toBe('exchange-heavy');
    expect(getRouteConstitutionDefaults().mainThreadProtectionLevel).toBeTruthy();
    expect(routeProfiles['forum-feed-mobile'].adaptiveTierCeiling).toBeGreaterThanOrEqual(1);
  });

  test('runtime mode resolver separates prod-lite, stage and bounded forensic behavior', () => {
    const production = resolveRuntimeModeSummary({
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        APP_RUNTIME_MODE: 'production-adaptive',
        APP_DIAGNOSTICS_MODE: 'deep',
        APP_FORENSIC_MODE: 'off',
      },
    });
    const stage = resolveRuntimeModeSummary({
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        APP_RUNTIME_MODE: 'stage-pre-release',
        APP_DIAGNOSTICS_MODE: 'lite',
      },
    });
    const forensic = resolveRuntimeModeSummary({
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        APP_RUNTIME_MODE: 'production-adaptive',
        APP_FORENSIC_MODE: 'bounded',
      },
      overrides: {
        forensicRequested: true,
        forensicAuthorized: true,
      },
    });

    expect(production.runtimeMode).toBe('production-adaptive');
    expect(production.diagnosticsMode).toBe('off');
    expect(production.prodLiteSafe).toBe(true);
    expect(stage.runtimeMode).toBe('stage-pre-release');
    expect(stage.telemetryLevel).toBe('T2');
    expect(forensic.runtimeMode).toBe('emergency-forensics');
    expect(forensic.forensicModeActive).toBe(true);
  });

  test('budget engine blocks over-budget iframe promotions and records a violation', () => {
    const engine = createBudgetEngine({ routeProfiles });
    const blocked = engine.evaluatePromotion({
      profileId: 'forum-feed-mobile',
      entry: {
        runtimeId: 'iframe:blocked',
        runtimeType: 'iframe-video',
        owner: 'content',
        route: '/forum',
      },
      entries: [
        {
          runtimeId: 'iframe:active',
          runtimeType: 'iframe-video',
          state: 'active',
        },
      ],
    });

    expect(blocked.allowed).toBe(false);
    expect(engine.violations.summarize().total).toBe(1);
  });

  test('runtime passport serializer exposes pressure and owner diagnostics', () => {
    const passport = buildRuntimePassport({
      route: '/forum',
      budgetProfile: 'forum-feed-mobile',
      registryEntries: [
        {
          runtimeType: 'iframe-video',
          owner: 'feed-owner',
          state: 'active',
          sameSrcGroup: 'same-src:1',
          teardownExpected: true,
          teardownStatus: 'completed',
        },
        {
          runtimeType: 'auth-runtime',
          owner: 'auth-bridge',
          state: 'active',
        },
      ],
      providerCounts: { heavyProviders: 1 },
      authCounts: { authOkListeners: 2, authSuccessListeners: 1 },
    });

    expect(passport.routeBudgetProfile).toBe('forum-feed-mobile');
    expect(passport.currentBudgetPressureScore).toBe(2);
    expect(passport.telemetryLevel).toBe('T0');
    expect(passport.blockedPromotionsCount).toBe(0);
    expect(formatRuntimePassportText(passport)).toContain('route: /forum');
    expect(JSON.parse(serializeRuntimePassport(passport)).route).toBe('/forum');
  });

  test('runtime diff report compares numeric contour metrics', () => {
    const diff = createRuntimeDiffReport(
      { route: '/forum', routeBudgetProfile: 'forum-feed-mobile', countActiveIframe: 2, timersCount: 4 },
      { route: '/forum', routeBudgetProfile: 'forum-feed-mobile', countActiveIframe: 1, timersCount: 2 },
    );

    expect(diff.countActiveIframe.delta).toBe(-1);
    expect(diff.timersCount.delta).toBe(-2);
    expect(classifyRuntimeDiffReport(diff).overall).toBe('improved');
  });
});
