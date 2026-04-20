function numberOrZero(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

const REGRESSION_POLARITY = Object.freeze({
  countActiveIframe: 'lower-better',
  countActiveNativeVideo: 'lower-better',
  countActiveAdMedia: 'lower-better',
  observersCount: 'lower-better',
  timersCount: 'lower-better',
  sameSrcPressureScore: 'lower-better',
  currentBudgetPressureScore: 'lower-better',
  budgetPressureScore: 'lower-better',
  teardownCleanlinessScore: 'higher-better',
  startupHeavinessScore: 'lower-better',
  layoutTurbulenceScore: 'lower-better',
  authFanoutScore: 'lower-better',
  currentEffectDegradationTier: 'lower-better',
  adaptiveTier: 'lower-better',
  priorityArbitrationActionsCount: 'lower-better',
  decorativeSuppressionsCount: 'contextual',
  offscreenAggressiveDemotionsCount: 'contextual',
  lowMemoryFallbackActivations: 'contextual',
  mainThreadSurvivalModeActivations: 'lower-better',
  backgroundThrottleActivations: 'contextual',
  adaptiveRouteDowngradeCount: 'lower-better',
  mainThreadPressureScore: 'lower-better',
  memoryPressureScore: 'lower-better',
  degradeActionsTakenCount: 'lower-better',
  blockedPromotionsCount: 'lower-better',
});

function classifyMetricChange(key, delta) {
  const polarity = REGRESSION_POLARITY[key] || 'contextual';
  if (delta === 0) return 'unchanged';
  if (polarity === 'higher-better') return delta > 0 ? 'improved' : 'regressed';
  if (polarity === 'lower-better') return delta < 0 ? 'improved' : 'regressed';
  return 'ambiguous';
}

export function classifyRuntimeDiffReport(diff = {}) {
  const keys = Object.keys(REGRESSION_POLARITY);
  const stats = {
    improved: 0,
    regressed: 0,
    unchanged: 0,
    ambiguous: 0,
  };

  for (const key of keys) {
    const metric = diff[key];
    if (!metric) continue;
    const classification = classifyMetricChange(key, numberOrZero(metric.delta));
    stats[classification] += 1;
  }

  let overall = 'unchanged';
  if (stats.regressed > 0 && stats.improved === 0) overall = 'regressed';
  else if (stats.improved > 0 && stats.regressed === 0) overall = 'improved';
  else if (stats.regressed > 0 && stats.improved > 0) overall = stats.regressed > stats.improved ? 'needs-forensic' : 'ambiguous';
  else if (stats.ambiguous > 0) overall = 'ambiguous';

  return {
    overall,
    stats,
  };
}

export function createRuntimeDiffReport(before = {}, after = {}) {
  const numericKeys = [
    'countActiveIframe',
    'countActiveNativeVideo',
    'countActiveAdMedia',
    'observersCount',
    'timersCount',
    'sameSrcPressureScore',
    'currentBudgetPressureScore',
    'budgetPressureScore',
    'teardownCleanlinessScore',
    'startupHeavinessScore',
    'layoutTurbulenceScore',
    'authFanoutScore',
    'currentEffectDegradationTier',
    'adaptiveTier',
    'priorityArbitrationActionsCount',
    'decorativeSuppressionsCount',
    'offscreenAggressiveDemotionsCount',
    'lowMemoryFallbackActivations',
    'mainThreadSurvivalModeActivations',
    'backgroundThrottleActivations',
    'adaptiveRouteDowngradeCount',
    'mainThreadPressureScore',
    'memoryPressureScore',
    'degradeActionsTakenCount',
    'blockedPromotionsCount',
  ];

  const diff = numericKeys.reduce((acc, key) => {
    acc[key] = {
      before: numberOrZero(before[key]),
      after: numberOrZero(after[key]),
      delta: numberOrZero(after[key]) - numberOrZero(before[key]),
    };
    return acc;
  }, {
    route: {
      before: String(before.route || ''),
      after: String(after.route || ''),
    },
    profile: {
      before: String(before.routeBudgetProfile || ''),
      after: String(after.routeBudgetProfile || ''),
    },
    adaptiveProfile: {
      before: String(before.activeAdaptiveProfile || ''),
      after: String(after.activeAdaptiveProfile || ''),
    },
  });

  diff.classification = classifyRuntimeDiffReport(diff);
  return diff;
}
