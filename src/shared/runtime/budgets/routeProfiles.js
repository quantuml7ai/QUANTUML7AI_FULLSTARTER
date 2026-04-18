import governance from '../../../../config/runtime-governance.json';

const ROUTE_CONSTITUTION_DEFAULTS = Object.freeze({
  adaptiveTierCeiling: 4,
  maxAnimationTier: 2,
  maxObserverDensity: 12,
  maxTimerDensity: 12,
  mainThreadProtectionLevel: 'balanced',
  memoryProtectionLevel: 'balanced',
  backgroundSurvivalPolicy: 'priority-only',
  preloadAllowance: 'budgeted',
  prefetchAllowance: 'budgeted',
  coldFallbackRequirement: 'required-under-pressure',
  routeIsolationSeverity: 'strict',
  forensicSamplingAllowance: 'bounded',
  ...(governance.routeConstitutionDefaults || {}),
});

function normalizeRouteProfile(profile = {}) {
  return Object.freeze({
    ...ROUTE_CONSTITUTION_DEFAULTS,
    ...profile,
    budget: {
      ...(profile?.budget || {}),
    },
  });
}

export const routeProfiles = Object.freeze(
  Object.fromEntries(
    Object.entries(governance.routeCapabilityProfiles || {}).map(([profileId, profile]) => [
      profileId,
      normalizeRouteProfile(profile),
    ]),
  ),
);

export function getRouteProfile(profileId) {
  return routeProfiles[String(profileId || '')] || null;
}

export function listRouteProfileIds() {
  return Object.keys(routeProfiles);
}

export function getRouteConstitutionDefaults() {
  return ROUTE_CONSTITUTION_DEFAULTS;
}
