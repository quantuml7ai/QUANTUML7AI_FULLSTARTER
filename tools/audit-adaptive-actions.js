#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const { writeJsonReport } = require('./runtime-governance');

const PRESSURE_LADDER = Object.freeze({
  nominal: 0,
  elevated: 40,
  constrained: 70,
  survival: 90,
});

function resolveRouteProfile(route) {
  if (route === '/exchange') return 'exchange-heavy';
  if (route === '/about') return 'about-decorative';
  return 'forum-feed-mobile';
}

function resolvePressureTier(score = 0) {
  const normalized = Number(score || 0);
  if (normalized >= PRESSURE_LADDER.survival) return 'survival';
  if (normalized >= PRESSURE_LADDER.constrained) return 'constrained';
  if (normalized >= PRESSURE_LADDER.elevated) return 'elevated';
  return 'nominal';
}

function createAdaptiveSnapshot(input = {}) {
  const routeProfile = input.routeProfile || resolveRouteProfile(input.route);
  const budgetPressureScore = Number(input.budgetPressureScore || 0);
  const memoryPressureScore = Number(input.memoryPressureScore || 0);
  const mainThreadPressureScore = Number(input.mainThreadPressureScore || 0);
  const lowMemory = !!input.hints?.lowMemory || memoryPressureScore >= 70;
  const mainThreadPressure = mainThreadPressureScore >= 70;
  const backgrounded = !!input.backgrounded;
  const effectTier = backgrounded || budgetPressureScore >= 90 || memoryPressureScore >= 90 || mainThreadPressureScore >= 90
    ? 4
    : budgetPressureScore >= 70 || lowMemory || mainThreadPressure
      ? 2
      : budgetPressureScore >= 40
        ? 1
        : 0;
  const actions = [];
  if (effectTier >= 1) actions.push({ type: 'degrade-effects' });
  if (effectTier >= 2) actions.push({ type: 'suppress-decorative-runtime' });
  if (lowMemory) actions.push({ type: 'aggressive-offscreen-demotion' });
  if (mainThreadPressure) actions.push({ type: 'main-thread-survival-mode' });
  if (backgrounded) actions.push({ type: 'background-throttle' });
  if (budgetPressureScore >= 80) actions.push({ type: 'adaptive-route-downgrade' });
  if (resolvePressureTier(Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore)) === 'survival') {
    actions.push({ type: 'survival-profile-enforced' });
  }

  return {
    route: input.route,
    routeProfile,
    activeAdaptiveProfile: `${routeProfile}:${input.hints?.coarse ? 'mid' : 'high'}`,
    currentEffectDegradationTier: effectTier,
    adaptiveTier: effectTier,
    budgetPressureScore,
    memoryPressureScore,
    mainThreadPressureScore,
    pressureTier: resolvePressureTier(Math.max(budgetPressureScore, memoryPressureScore, mainThreadPressureScore)),
    survivalModeActive: effectTier >= 4,
    degradeActionsTaken: actions.map((action) => action.type),
    metrics: {
      priorityArbitrationActionsCount: actions.length,
      decorativeSuppressionsCount: actions.filter((action) => action.type === 'suppress-decorative-runtime').length,
      offscreenAggressiveDemotionsCount: actions.filter((action) => action.type === 'aggressive-offscreen-demotion').length,
      lowMemoryFallbackActivations: lowMemory ? 1 : 0,
      mainThreadSurvivalModeActivations: actions.filter((action) => action.type === 'main-thread-survival-mode').length,
      backgroundThrottleActivations: actions.filter((action) => action.type === 'background-throttle').length,
      adaptiveRouteDowngradeCount: actions.filter((action) => action.type === 'adaptive-route-downgrade').length,
    },
  };
}

function main() {
  const root = process.cwd();

  const cases = [
    {
      id: 'nominal-forum',
      input: { route: '/forum', hints: { coarse: true }, budgetPressureScore: 20, memoryPressureScore: 10, mainThreadPressureScore: 15 },
    },
    {
      id: 'memory-pressure-forum',
      input: { route: '/forum', hints: { coarse: true, lowMemory: true }, budgetPressureScore: 72, memoryPressureScore: 85, mainThreadPressureScore: 45 },
    },
    {
      id: 'main-thread-pressure-forum',
      input: { route: '/forum', hints: { coarse: true, weakCpu: true }, budgetPressureScore: 68, memoryPressureScore: 35, mainThreadPressureScore: 91 },
    },
    {
      id: 'background-exchange',
      input: { route: '/exchange', hints: { fine: true, slowNetwork: true }, budgetPressureScore: 84, memoryPressureScore: 50, mainThreadPressureScore: 74, backgrounded: true },
    },
  ].map((entry) => ({
    id: entry.id,
    snapshot: createAdaptiveSnapshot(entry.input),
  }));

  writeJsonReport(root, 'adaptive-actions.report.json', {
    generatedAt: new Date().toISOString(),
    summary: {
      cases: cases.length,
      survivalCases: cases.filter((entry) => entry.snapshot.survivalModeActive).length,
      pressureTiers: [...new Set(cases.map((entry) => entry.snapshot.pressureTier))],
    },
    cases,
  });

  writeJsonReport(root, 'pressure-ladder.report.json', {
    generatedAt: new Date().toISOString(),
    ladder: PRESSURE_LADDER,
    actionsByTier: cases.map((entry) => ({
      id: entry.id,
      pressureTier: entry.snapshot.pressureTier,
      effectTier: entry.snapshot.currentEffectDegradationTier,
      actions: entry.snapshot.degradeActionsTaken,
    })),
  });

  console.log('[audit:adaptive-actions] wrote adaptive-actions.report.json and pressure-ladder.report.json');
}

main();
