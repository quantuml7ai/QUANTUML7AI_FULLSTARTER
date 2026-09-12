import { isMediaRuntimeType } from '../identity/runtimeTypes.js';
import {
  RUNTIME_MODES,
  getTelemetryLabel,
  getTelemetryLevel,
  normalizeRuntimeMode,
} from '../mode/runtimeMode.js';

function countWhere(entries, predicate) {
  return entries.reduce((sum, entry) => sum + (predicate(entry) ? 1 : 0), 0);
}

export function buildRuntimePassport({
  route,
  deviceClass = 'coarse',
  budgetProfile = 'unknown',
  registryEntries = [],
  providerCounts = {},
  authCounts = {},
  runtimeMode = 'production-adaptive',
  runtimeModeSummary = null,
  adaptiveState = {},
}) {
  const activeEntries = registryEntries.filter((entry) => entry?.state !== 'destroyed');
  const activeOwners = [...new Set(activeEntries.map((entry) => String(entry?.owner || 'unknown')))];
  const timers = countWhere(activeEntries, (entry) => entry.runtimeType === 'timers');
  const observers = countWhere(
    activeEntries,
    (entry) => ['observers', 'mutationobserver', 'resizeobserver', 'intersectionobserver'].includes(
      String(entry.runtimeType || '').toLowerCase(),
    ),
  );

  const activeMediaEntries = activeEntries.filter((entry) => isMediaRuntimeType(entry.runtimeType));
  const startupEntries = activeEntries.filter((entry) => entry.runtimeType === 'startup-media');
  const qcastEntries = activeEntries.filter((entry) => entry.runtimeType === 'qcast');
  const normalizedMode = normalizeRuntimeMode(runtimeModeSummary?.runtimeMode || runtimeMode);
  const externalWidgetPresence = countWhere(activeEntries, (entry) => entry.runtimeType === 'external-widgets');
  const adaptiveMetrics = adaptiveState.metrics || {};
  const degradeActionsTaken = Array.isArray(adaptiveState.degradeActionsTaken)
    ? adaptiveState.degradeActionsTaken
    : Array.isArray(adaptiveState.actions)
      ? adaptiveState.actions.map((action) => action?.type).filter(Boolean)
      : [];
  const currentBudgetPressureScore = Number(adaptiveState.budgetPressureScore ?? activeEntries.length);
  const memoryPressureScore = Number(adaptiveState.memoryPressureScore || 0);
  const mainThreadPressureScore = Number(adaptiveState.mainThreadPressureScore || 0);
  const currentEffectDegradationTier = Number(
    adaptiveState.adaptiveTier ?? adaptiveState.currentEffectDegradationTier ?? 0,
  );
  const blockedPromotions = Number(adaptiveState.blockedPromotions || adaptiveMetrics.blockedPromotions || 0);
  const survivalModeActive = Boolean(
    adaptiveState.survivalModeActive
    || currentEffectDegradationTier >= 4
    || degradeActionsTaken.includes('survival-profile-enforced')
    || degradeActionsTaken.includes('main-thread-survival-mode'),
  );
  const telemetryLevel = runtimeModeSummary?.telemetryLevel || getTelemetryLevel(normalizedMode);

  return {
    capturedAt: Date.now(),
    route: String(route || ''),
    deviceClass: deviceClass === 'fine' ? 'fine' : 'coarse',
    routeBudgetProfile: String(budgetProfile || 'unknown'),
    runtimeMode: normalizedMode,
    telemetryLevel,
    telemetryLabel: runtimeModeSummary?.telemetryLabel || getTelemetryLabel(telemetryLevel),
    activeMediaOwners: activeOwners,
    countActiveIframe: countWhere(activeEntries, (entry) => entry.runtimeType === 'iframe-video'),
    countActiveNativeVideo: countWhere(activeEntries, (entry) => entry.runtimeType === 'html5-video'),
    countActiveAdMedia: countWhere(activeEntries, (entry) => entry.runtimeType === 'ad-media'),
    qcastState: {
      count: qcastEntries.length,
      owners: [...new Set(qcastEntries.map((entry) => entry.owner))],
    },
    walletAuthRuntimeState: {
      authRuntimeCount: countWhere(activeEntries, (entry) => entry.runtimeType === 'auth-runtime'),
      walletRuntimeCount: countWhere(activeEntries, (entry) => entry.runtimeType === 'wallet-runtime'),
      authListenerCounts: { ...authCounts },
    },
    providerCounts: { ...providerCounts },
    externalWidgetPresence,
    observersCount: observers,
    timersCount: timers,
    sameSrcPressureScore: countWhere(activeEntries, (entry) => !!entry.sameSrcGroup),
    currentBudgetPressureScore,
    budgetPressureScore: currentBudgetPressureScore,
    mainThreadPressureScore,
    memoryPressureScore,
    teardownCleanlinessScore: countWhere(activeEntries, (entry) => entry.teardownExpected && entry.teardownStatus === 'completed'),
    startupHeavinessScore: startupEntries.length + Number(providerCounts.heavyProviders || 0),
    layoutTurbulenceScore: countWhere(activeEntries, (entry) => entry.runtimeType === 'decorative-media'),
    authFanoutScore: Object.values(authCounts).reduce((sum, value) => sum + Number(value || 0), 0),
    activeAdaptiveProfile: adaptiveState.activeAdaptiveProfile || 'unknown',
    currentEffectDegradationTier,
    adaptiveTier: currentEffectDegradationTier,
    priorityArbitrationActionsCount: Number(adaptiveMetrics.priorityArbitrationActionsCount || 0),
    decorativeSuppressionsCount: Number(adaptiveMetrics.decorativeSuppressionsCount || 0),
    offscreenAggressiveDemotionsCount: Number(adaptiveMetrics.offscreenAggressiveDemotionsCount || 0),
    lowMemoryFallbackActivations: Number(adaptiveMetrics.lowMemoryFallbackActivations || 0),
    mainThreadSurvivalModeActivations: Number(adaptiveMetrics.mainThreadSurvivalModeActivations || 0),
    backgroundThrottleActivations: Number(adaptiveMetrics.backgroundThrottleActivations || 0),
    adaptiveRouteDowngradeCount: Number(adaptiveMetrics.adaptiveRouteDowngradeCount || 0),
    degradeActionsTaken,
    degradeActionsTakenCount: degradeActionsTaken.length,
    blockedPromotions,
    blockedPromotionsCount: blockedPromotions,
    survivalModeActive,
    forensicModeActive: normalizedMode === RUNTIME_MODES.EMERGENCY_FORENSICS,
    activeRuntimeCount: activeEntries.length,
    activeMediaRuntimeCount: activeMediaEntries.length,
  };
}
