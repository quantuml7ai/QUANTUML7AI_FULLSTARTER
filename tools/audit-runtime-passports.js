#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const path = require('node:path');
const {
  loadGovernance,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const SIGNALS = [
  { key: 'video', rx: /<video\b/gi },
  { key: 'iframe', rx: /<iframe\b/gi },
  { key: 'audio', rx: /<audio\b/gi },
  { key: 'timers', rx: /\bsetInterval\s*\(|\bsetTimeout\s*\(/g },
  { key: 'observers', rx: /\bIntersectionObserver\b|\bMutationObserver\b|\bResizeObserver\b/g },
  { key: 'cleanup', rx: /\bclearInterval\b|\bclearTimeout\b|\bremoveEventListener\b|\bdisconnect\b|\bdestroy\b/g },
  { key: 'auth', rx: /\bauth:ok\b|\bauth:success\b|\bauth:logout\b|\bopen-auth\b|\bMagic\b/g },
  { key: 'providers', rx: /\bcreateWeb3Modal\b|\bWagmiProvider\b|\bAnalytics\b|\bSpeedInsights\b/g },
  { key: 'layoutReads', rx: /\bgetBoundingClientRect\b|\boffsetHeight\b|\boffsetWidth\b|\bscrollHeight\b|\bclientHeight\b/g },
  { key: 'console', rx: /\bconsole\.(warn|error|log)\b/g },
  { key: 'preload', rx: /\bpreload\b|fonts\.reown\.com/g },
  { key: 'sameSrc', rx: /sameSrcGroup|__restoreLoadCount|__restoreLoadBlockedUntil/g },
  { key: 'blockedPromotion', rx: /blocked|budget|load_kick_skip_budget/g },
];

function resolveRuntimeModeSummary(env = {}) {
  const runtimeMode = String(env.APP_RUNTIME_MODE || env.NEXT_PUBLIC_RUNTIME_MODE || '').trim() || 'production-adaptive';
  const diagnosticsMode = runtimeMode === 'production-adaptive'
    ? (String(env.APP_DIAGNOSTICS_MODE || '').trim() === 'lite' ? 'lite' : 'off')
    : String(env.APP_DIAGNOSTICS_MODE || env.NEXT_PUBLIC_DIAGNOSTICS_MODE || 'deep').trim();
  const telemetryLevel = runtimeMode === 'production-adaptive'
    ? (String(env.APP_TELEMETRY_LEVEL || '').trim() === 'T1' ? 'T1' : 'T0')
    : String(env.APP_TELEMETRY_LEVEL || 'T2').trim();
  return {
    runtimeMode,
    telemetryLevel,
    telemetryLabel: {
      T0: 'minimal-prod-counters',
      T1: 'smart-prod-diagnostics',
      T2: 'stage-deep-runtime',
      T3: 'dev-research',
    }[telemetryLevel] || 'minimal-prod-counters',
    forensicModeActive: runtimeMode === 'emergency-forensics',
    diagnosticsMode,
  };
}

function resolveRouteProfile(route, deviceClass = 'coarse') {
  const assignment = route === '/forum'
    ? { coarse: 'forum-feed-mobile', fine: 'forum-feed-desktop' }
    : null;
  if (assignment) return assignment[deviceClass === 'fine' ? 'fine' : 'coarse'];
  if (route === '/exchange') return 'exchange-heavy';
  if (route === '/about') return 'about-decorative';
  if (route === '/ads/home') return 'ads-preview';
  if (route === '/subscribe') return 'auth-light';
  return 'landing-decorative';
}

function createAdaptiveSnapshot({ route, budgetPressureScore = 20, memoryPressureScore = 10, mainThreadPressureScore = 10, backgrounded = false }) {
  const currentEffectDegradationTier = backgrounded || Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore) >= 90
    ? 4
    : Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore) >= 70
      ? 2
      : Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore) >= 40
        ? 1
        : 0;
  const actions = [];
  if (currentEffectDegradationTier >= 1) actions.push('degrade-effects');
  if (currentEffectDegradationTier >= 2) actions.push('suppress-decorative-runtime');
  if (memoryPressureScore >= 70) actions.push('aggressive-offscreen-demotion');
  if (mainThreadPressureScore >= 70) actions.push('main-thread-survival-mode');
  if (backgrounded) actions.push('background-throttle');
  if (budgetPressureScore >= 80) actions.push('adaptive-route-downgrade');
  if (Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore) >= 90) actions.push('survival-profile-enforced');
  return {
    activeAdaptiveProfile: `${resolveRouteProfile(route)}:mid`,
    currentEffectDegradationTier,
    adaptiveTier: currentEffectDegradationTier,
    budgetPressureScore,
    memoryPressureScore,
    mainThreadPressureScore,
    survivalModeActive: currentEffectDegradationTier >= 4,
    degradeActionsTaken: actions,
    metrics: {
      priorityArbitrationActionsCount: actions.length,
      decorativeSuppressionsCount: actions.includes('suppress-decorative-runtime') ? 1 : 0,
      offscreenAggressiveDemotionsCount: actions.includes('aggressive-offscreen-demotion') ? 1 : 0,
      lowMemoryFallbackActivations: actions.includes('aggressive-offscreen-demotion') ? 1 : 0,
      mainThreadSurvivalModeActivations: actions.includes('main-thread-survival-mode') ? 1 : 0,
      backgroundThrottleActivations: actions.includes('background-throttle') ? 1 : 0,
      adaptiveRouteDowngradeCount: actions.includes('adaptive-route-downgrade') ? 1 : 0,
    },
  };
}

function buildRoutePassport(root, governance, assignment, runtimeModeSummary, adaptiveSnapshot) {
  const rows = scanFiles(root, assignment.files || [], SIGNALS);
  const totals = rows.reduce((acc, row) => {
    Object.keys(row.counts).forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row.counts[key] || 0);
    });
    return acc;
  }, {});
  const budgetProfile = assignment.profile || assignment.profiles || null;
  const profileId = typeof budgetProfile === 'string'
    ? budgetProfile
    : budgetProfile?.coarse || budgetProfile?.fine || 'unknown';
  const profile = governance.routeCapabilityProfiles[profileId] || null;
  const activeOwners = rows
    .filter((row) => (row.counts.video || 0) + (row.counts.iframe || 0) + (row.counts.audio || 0) > 0)
    .map((row) => path.posix.basename(row.file));
  return {
    route: assignment.route,
    runtimeMode: runtimeModeSummary.runtimeMode,
    telemetryLevel: runtimeModeSummary.telemetryLevel,
    telemetryLabel: runtimeModeSummary.telemetryLabel,
    routeBudgetProfile: budgetProfile,
    activeMediaOwners: activeOwners,
    countActiveIframe: totals.iframe || 0,
    countActiveNativeVideo: totals.video || 0,
    countActiveAdMedia: assignment.route === '/ads/home' ? totals.video || 0 : 0,
    qcastState: {
      count: rows.filter((row) => /QCastPlayer/.test(row.file)).length,
      activeOwners: activeOwners.filter((owner) => owner.includes('QCast')),
    },
    walletAuthRuntimeState: {
      authSignals: totals.auth || 0,
      providerSignals: totals.providers || 0,
    },
    providerCounts: {
      heavyProviders: totals.providers || 0,
    },
    externalWidgetPresence: /exchange|academy|ads/.test(String(assignment.route || '')) ? totals.iframe || 0 : 0,
    observersCount: totals.observers || 0,
    timersCount: totals.timers || 0,
    sameSrcPressureScore: totals.sameSrc || 0,
    currentBudgetPressureScore: Number(adaptiveSnapshot.budgetPressureScore || 0),
    budgetPressureScore: Number(adaptiveSnapshot.budgetPressureScore || 0),
    mainThreadPressureScore: Math.min(100, Number((totals.layoutReads || 0) * 5)),
    memoryPressureScore: Math.min(100, Number(((totals.video || 0) + (totals.iframe || 0)) * 10)),
    teardownCleanlinessScore: totals.cleanup || 0,
    startupHeavinessScore: (totals.providers || 0) + (totals.preload || 0),
    layoutTurbulenceScore: totals.layoutReads || 0,
    authFanoutScore: totals.auth || 0,
    activeAdaptiveProfile: adaptiveSnapshot.activeAdaptiveProfile,
    currentEffectDegradationTier: adaptiveSnapshot.currentEffectDegradationTier,
    adaptiveTier: adaptiveSnapshot.adaptiveTier,
    priorityArbitrationActionsCount: adaptiveSnapshot.metrics?.priorityArbitrationActionsCount || 0,
    decorativeSuppressionsCount: adaptiveSnapshot.metrics?.decorativeSuppressionsCount || 0,
    offscreenAggressiveDemotionsCount: adaptiveSnapshot.metrics?.offscreenAggressiveDemotionsCount || 0,
    lowMemoryFallbackActivations: adaptiveSnapshot.metrics?.lowMemoryFallbackActivations || 0,
    mainThreadSurvivalModeActivations: adaptiveSnapshot.metrics?.mainThreadSurvivalModeActivations || 0,
    backgroundThrottleActivations: adaptiveSnapshot.metrics?.backgroundThrottleActivations || 0,
    adaptiveRouteDowngradeCount: adaptiveSnapshot.metrics?.adaptiveRouteDowngradeCount || 0,
    degradeActionsTaken: adaptiveSnapshot.degradeActionsTaken || [],
    degradeActionsTakenCount: (adaptiveSnapshot.degradeActionsTaken || []).length,
    blockedPromotions: totals.blockedPromotion || 0,
    blockedPromotionsCount: totals.blockedPromotion || 0,
    survivalModeActive: !!adaptiveSnapshot.survivalModeActive,
    forensicModeActive: runtimeModeSummary.forensicModeActive,
    unexplainedActiveRuntime: profile && profile.budget && (totals.iframe || 0) > Number(profile.maxIframeCount || 0),
    files: rows.map((row) => ({
      file: row.file,
      counts: row.counts,
    })),
  };
}

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const runtimeModeSummary = resolveRuntimeModeSummary({
      APP_RUNTIME_MODE: process.env.APP_RUNTIME_MODE || 'production-adaptive',
      APP_DIAGNOSTICS_MODE: process.env.APP_DIAGNOSTICS_MODE || 'off',
      APP_TELEMETRY_LEVEL: process.env.APP_TELEMETRY_LEVEL || 'T0',
      NEXT_PUBLIC_RUNTIME_MODE: process.env.NEXT_PUBLIC_RUNTIME_MODE || 'production-adaptive',
      NEXT_PUBLIC_DIAGNOSTICS_MODE: process.env.NEXT_PUBLIC_DIAGNOSTICS_MODE || 'off',
  });
  const routeSnapshots = governance.routeAssignments.map((assignment) => {
    const adaptiveSnapshot = createAdaptiveSnapshot({
      route: assignment.route,
      budgetPressureScore: 20,
      memoryPressureScore: 10,
      mainThreadPressureScore: 10,
    });
    return buildRoutePassport(root, governance, assignment, runtimeModeSummary, adaptiveSnapshot);
  });
  const payload = {
    generatedAt: new Date().toISOString(),
    passportFields: governance.passportFields,
    runtimeModeSummary,
    routeSnapshots,
  };

  writeJsonReport(root, 'runtime-passport.snapshot.json', payload);
  writeJsonReport(root, 'runtime-passports.report.json', payload);
  console.log('[audit:runtime-passports] wrote runtime-passport snapshot reports');
}

main();
