import {
  ADAPTIVE_CORE_MODES,
  DIAGNOSTICS_MODES,
  FORENSIC_MODES,
  MODE_PUBLIC_ENV_KEYS,
  MODE_SERVER_ENV_KEYS,
  RUNTIME_MODES,
  TELEMETRY_LEVELS,
} from './runtimeModeTypes.js';

function normalizeString(value) {
  return String(value || '').trim().toLowerCase();
}

export function isEnabledFlag(value) {
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalizeString(value));
}

export function normalizeChoice(value, allowedValues, fallback) {
  const normalized = normalizeString(value);
  if (allowedValues.includes(normalized)) return normalized;
  return fallback;
}

export function normalizeRuntimeMode(value, fallback = RUNTIME_MODES.PRODUCTION_ADAPTIVE) {
  return normalizeChoice(value, Object.values(RUNTIME_MODES), fallback);
}

export function normalizeDiagnosticsMode(value, fallback = DIAGNOSTICS_MODES.OFF) {
  return normalizeChoice(value, Object.values(DIAGNOSTICS_MODES), fallback);
}

export function normalizeForensicMode(value, fallback = FORENSIC_MODES.OFF) {
  return normalizeChoice(value, Object.values(FORENSIC_MODES), fallback);
}

export function normalizeTelemetryLevel(value, fallback = TELEMETRY_LEVELS.T0) {
  const normalized = String(value || '').trim().toUpperCase();
  if (Object.values(TELEMETRY_LEVELS).includes(normalized)) return normalized;
  return fallback;
}

export function normalizeAdaptiveCoreMode(value, fallback = ADAPTIVE_CORE_MODES.ENFORCED) {
  const normalized = normalizeString(value);
  if (isEnabledFlag(normalized)) return ADAPTIVE_CORE_MODES.ENFORCED;
  if (['0', 'false', 'off', 'disabled'].includes(normalized)) return ADAPTIVE_CORE_MODES.OFF;
  return normalizeChoice(normalized, Object.values(ADAPTIVE_CORE_MODES), fallback);
}

export function readServerModeEnv(env = {}) {
  return MODE_SERVER_ENV_KEYS.reduce((acc, key) => {
    acc[key] = env[key];
    return acc;
  }, {});
}

export function readPublicModeEnv(env = {}) {
  return MODE_PUBLIC_ENV_KEYS.reduce((acc, key) => {
    acc[key] = env[key];
    return acc;
  }, {});
}

export function normalizeModeOverrideInput(overrides = {}) {
  return {
    explicitMode: normalizeRuntimeMode(overrides.explicitMode || '', ''),
    diagnosticsMode: normalizeDiagnosticsMode(overrides.diagnosticsMode || '', ''),
    forensicMode: normalizeForensicMode(overrides.forensicMode || '', ''),
    telemetryLevel: normalizeTelemetryLevel(overrides.telemetryLevel || '', ''),
    adaptiveCoreMode: normalizeAdaptiveCoreMode(overrides.adaptiveCoreMode || '', ''),
    forensicRequested: !!(overrides.forensicRequested || overrides.forensicOverride || overrides.forensicMode === FORENSIC_MODES.BOUNDED),
    forensicAuthorized: !!(overrides.forensicAuthorized || overrides.allowForensic || overrides.allowlistHit || overrides.signedTokenValid),
    allowNonProductionOverride: !!(overrides.allowNonProductionOverride || overrides.internalUserRole === 'admin' || overrides.internalUserRole === 'staff'),
    developerOverride: !!overrides.developerOverride,
    safeFallbackMode: overrides.safeFallbackMode || '',
  };
}
