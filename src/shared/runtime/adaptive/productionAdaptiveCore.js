import { resolveDeviceProfile } from './deviceProfileResolver.js';
import { resolveEffectDegradationTier } from './effectDegradation.js';
import { prioritizeRuntimeEntries } from './runtimePriority.js';

export const PRESSURE_LADDER = Object.freeze({
  nominal: 0,
  elevated: 40,
  constrained: 70,
  survival: 90,
});

function countActions(actions = [], type) {
  return actions.filter((action) => action.type === type).length;
}

function resolvePressureTier(score = 0) {
  const normalized = Number(score || 0);
  if (normalized >= PRESSURE_LADDER.survival) return 'survival';
  if (normalized >= PRESSURE_LADDER.constrained) return 'constrained';
  if (normalized >= PRESSURE_LADDER.elevated) return 'elevated';
  return 'nominal';
}

export function createProductionAdaptiveCore({ routeProfileResolver } = {}) {
  function resolveAdaptiveContext({
    route = '',
    routeProfile = '',
    entries = [],
    hints = {},
    budgetPressureScore = 0,
    memoryPressureScore = 0,
    mainThreadPressureScore = 0,
    backgrounded = false,
  } = {}) {
    const deviceProfile = resolveDeviceProfile(hints);
    const resolvedProfile = String(routeProfile || routeProfileResolver?.(route, deviceProfile.coarse ? 'coarse' : 'fine') || 'unknown');
    const mainThreadPressure = Number(mainThreadPressureScore || 0) >= 70;
    const lowMemory = deviceProfile.lowMemory || Number(memoryPressureScore || 0) >= 70;
    return {
      route,
      routeProfile: resolvedProfile,
      deviceProfile,
      budgetPressureScore: Number(budgetPressureScore || 0),
      memoryPressureScore: Number(memoryPressureScore || 0),
      mainThreadPressureScore: Number(mainThreadPressureScore || 0),
      lowMemory,
      mainThreadPressure,
      pressureTier: resolvePressureTier(Math.max(
        Number(budgetPressureScore || 0),
        Number(memoryPressureScore || 0),
        Number(mainThreadPressureScore || 0),
      )),
      backgrounded: !!backgrounded,
      entries: prioritizeRuntimeEntries(entries),
    };
  }

  function planAdaptiveActions(context = {}) {
    const effectTier = resolveEffectDegradationTier({
      budgetPressureScore: context.budgetPressureScore,
      lowMemory: context.lowMemory,
      slowNetwork: context.deviceProfile?.slowNetwork,
      weakCpu: context.deviceProfile?.weakCpu,
      mainThreadPressure: context.mainThreadPressure,
      backgrounded: context.backgrounded,
      decorativeRoute: /decorative/.test(String(context.routeProfile || '')),
    });

    const actions = [];
    if (effectTier >= 1) actions.push({ type: 'degrade-effects', tier: effectTier });
    if (effectTier >= 2) actions.push({ type: 'suppress-decorative-runtime' });
    if (context.lowMemory) actions.push({ type: 'aggressive-offscreen-demotion' });
    if (context.mainThreadPressure) actions.push({ type: 'main-thread-survival-mode' });
    if (context.backgrounded) actions.push({ type: 'background-throttle' });
    if (context.budgetPressureScore >= 80) actions.push({ type: 'adaptive-route-downgrade' });
    if (context.pressureTier === 'survival') actions.push({ type: 'survival-profile-enforced' });

    return {
      activeAdaptiveProfile: `${context.routeProfile}:${context.deviceProfile?.performanceClass || 'unknown'}`,
      currentEffectDegradationTier: effectTier,
      adaptiveTier: effectTier,
      budgetPressureScore: context.budgetPressureScore,
      memoryPressureScore: context.memoryPressureScore,
      mainThreadPressureScore: context.mainThreadPressureScore,
      pressureTier: context.pressureTier,
      survivalModeActive: effectTier >= 4 || context.pressureTier === 'survival',
      degradeActionsTaken: actions.map((action) => action.type),
      actions,
      metrics: {
        priorityArbitrationActionsCount: actions.length,
        decorativeSuppressionsCount: countActions(actions, 'suppress-decorative-runtime'),
        offscreenAggressiveDemotionsCount: countActions(actions, 'aggressive-offscreen-demotion'),
        lowMemoryFallbackActivations: context.lowMemory ? 1 : 0,
        mainThreadSurvivalModeActivations: countActions(actions, 'main-thread-survival-mode'),
        backgroundThrottleActivations: countActions(actions, 'background-throttle'),
        adaptiveRouteDowngradeCount: countActions(actions, 'adaptive-route-downgrade'),
        survivalProfileActivations: countActions(actions, 'survival-profile-enforced'),
      },
    };
  }

  function createAdaptiveSnapshot(input = {}) {
    const context = resolveAdaptiveContext(input);
    return {
      ...context,
      ...planAdaptiveActions(context),
    };
  }

  return {
    createAdaptiveSnapshot,
    planAdaptiveActions,
    resolveAdaptiveContext,
  };
}
