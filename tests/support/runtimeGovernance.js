import fs from 'node:fs';
import path from 'node:path';
import { readRepoFile, repoRoot } from './projectSurface.js';

export function readGovernance() {
  return JSON.parse(readRepoFile('config/runtime-governance.json'));
}

export function readScripts() {
  return JSON.parse(readRepoFile('package.json')).scripts || {};
}

export function fileText(relPath) {
  return readRepoFile(relPath);
}

export function relExists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

export function buildSamplePassport(overrides = {}) {
  return {
    route: '/forum',
    routeBudgetProfile: 'forum-feed-mobile',
    runtimeMode: 'production-adaptive',
    telemetryLevel: 'T0',
    telemetryLabel: 'minimal-prod-counters',
    activeMediaOwners: ['feed-owner'],
    countActiveIframe: 1,
    countActiveNativeVideo: 1,
    countActiveAdMedia: 0,
    qcastState: { count: 0, owners: [] },
    walletAuthRuntimeState: {
      authRuntimeCount: 1,
      walletRuntimeCount: 0,
      authListenerCounts: {
        authOkListeners: 1,
        authSuccessListeners: 1,
      },
    },
    providerCounts: {
      heavyProviders: 1,
    },
    observersCount: 2,
    timersCount: 3,
    sameSrcPressureScore: 1,
    currentBudgetPressureScore: 3,
    budgetPressureScore: 3,
    memoryPressureScore: 15,
    mainThreadPressureScore: 10,
    teardownCleanlinessScore: 1,
    startupHeavinessScore: 2,
    layoutTurbulenceScore: 0,
    authFanoutScore: 2,
    activeAdaptiveProfile: 'forum-feed-mobile:mid',
    currentEffectDegradationTier: 1,
    adaptiveTier: 1,
    priorityArbitrationActionsCount: 2,
    decorativeSuppressionsCount: 1,
    offscreenAggressiveDemotionsCount: 0,
    lowMemoryFallbackActivations: 0,
    mainThreadSurvivalModeActivations: 0,
    backgroundThrottleActivations: 0,
    adaptiveRouteDowngradeCount: 0,
    degradeActionsTaken: ['degrade-effects'],
    degradeActionsTakenCount: 1,
    blockedPromotionsCount: 0,
    survivalModeActive: false,
    forensicModeActive: false,
    ...overrides,
  };
}
