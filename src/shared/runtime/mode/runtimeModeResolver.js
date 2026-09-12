import {
  ADAPTIVE_CORE_MODES,
  DIAGNOSTICS_MODES,
  FORENSIC_MODES,
  RUNTIME_MODE_DEFAULTS,
  RUNTIME_MODES,
  TELEMETRY_LABELS,
  TELEMETRY_LEVELS,
} from './runtimeModeTypes.js';
import {
  isEnabledFlag,
  normalizeAdaptiveCoreMode,
  normalizeDiagnosticsMode,
  normalizeForensicMode,
  normalizeModeOverrideInput,
  normalizeRuntimeMode,
  normalizeTelemetryLevel,
  readPublicModeEnv,
  readServerModeEnv,
} from './runtimeFlags.js';

function pickRuntimeModeSource({ env = {}, deploymentEnvironment = '' }) {
  const explicit = normalizeRuntimeMode(env.APP_RUNTIME_MODE || env.RUNTIME_MODE || '', '');
  if (explicit) return explicit;
  if (deploymentEnvironment === 'production') return RUNTIME_MODES.PRODUCTION_ADAPTIVE;
  if (deploymentEnvironment === 'preview') return RUNTIME_MODES.STAGE_PRE_RELEASE;
  if (String(env.NODE_ENV || '').trim().toLowerCase() === 'test') return RUNTIME_MODES.QA_CALIBRATION;
  return RUNTIME_MODES.DEVELOPMENT_RESEARCH;
}

export function detectDeploymentEnvironment(env = {}) {
  const vercelEnv = String(env.VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'development') return 'development';

  const nodeEnv = String(env.NODE_ENV || '').trim().toLowerCase();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'test') return 'qa';
  return 'development';
}

function clampDiagnosticsMode(runtimeMode, requestedMode, forensicAuthorized = false) {
  if (runtimeMode === RUNTIME_MODES.PRODUCTION_ADAPTIVE) {
    return requestedMode === DIAGNOSTICS_MODES.LITE ? DIAGNOSTICS_MODES.LITE : DIAGNOSTICS_MODES.OFF;
  }
  if (runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS) {
    if (requestedMode === DIAGNOSTICS_MODES.DEEP && forensicAuthorized) return DIAGNOSTICS_MODES.DEEP;
    if (requestedMode === DIAGNOSTICS_MODES.OFF) return DIAGNOSTICS_MODES.OFF;
    return DIAGNOSTICS_MODES.LITE;
  }
  return requestedMode;
}

function clampTelemetryLevel(runtimeMode, requestedLevel) {
  if (runtimeMode === RUNTIME_MODES.PRODUCTION_ADAPTIVE) {
    return requestedLevel === TELEMETRY_LEVELS.T1 ? TELEMETRY_LEVELS.T1 : TELEMETRY_LEVELS.T0;
  }
  if (runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS) {
    return TELEMETRY_LEVELS.T1;
  }
  if (runtimeMode === RUNTIME_MODES.STAGE_PRE_RELEASE) {
    return [TELEMETRY_LEVELS.T0, TELEMETRY_LEVELS.T1, TELEMETRY_LEVELS.T2].includes(requestedLevel)
      ? requestedLevel
      : TELEMETRY_LEVELS.T2;
  }
  return requestedLevel;
}

function clampAdaptiveCoreMode(runtimeMode, requestedMode) {
  if (runtimeMode === RUNTIME_MODES.PRODUCTION_ADAPTIVE && requestedMode === ADAPTIVE_CORE_MODES.OFF) {
    return ADAPTIVE_CORE_MODES.ENFORCED;
  }
  if (runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS && requestedMode === ADAPTIVE_CORE_MODES.OFF) {
    return ADAPTIVE_CORE_MODES.ENFORCED;
  }
  return requestedMode;
}

export function getTelemetryLevel(mode) {
  const normalized = normalizeRuntimeMode(mode);
  return RUNTIME_MODE_DEFAULTS[normalized]?.telemetryLevel || TELEMETRY_LEVELS.T0;
}

export function getTelemetryLabel(levelOrMode) {
  const normalizedLevel = normalizeTelemetryLevel(levelOrMode || '', '');
  if (normalizedLevel) return TELEMETRY_LABELS[normalizedLevel] || TELEMETRY_LABELS.T0;
  return TELEMETRY_LABELS[getTelemetryLevel(levelOrMode)] || TELEMETRY_LABELS.T0;
}

export function isDeepAwarenessMode(mode) {
  return normalizeRuntimeMode(mode) !== RUNTIME_MODES.PRODUCTION_ADAPTIVE;
}

export function isProductionAdaptiveMode(mode) {
  return normalizeRuntimeMode(mode) === RUNTIME_MODES.PRODUCTION_ADAPTIVE;
}

export function resolveRuntimeModeSummary({
  env = {},
  overrides = {},
  buildTarget = 'server',
  deploymentEnvironment = '',
} = {}) {
  const resolvedDeployment = deploymentEnvironment || detectDeploymentEnvironment(env);
  const serverEnv = readServerModeEnv(env);
  const publicEnv = readPublicModeEnv(env);
  const normalizedOverrides = normalizeModeOverrideInput(overrides);
  const resolutionPath = [];
  let safeFallbackActivated = false;

  const defaultMode = pickRuntimeModeSource({ env, deploymentEnvironment: resolvedDeployment });
  const envRequestedMode = normalizeRuntimeMode(serverEnv.APP_RUNTIME_MODE || publicEnv.NEXT_PUBLIC_RUNTIME_MODE || '', '');
  const requestedMode = normalizedOverrides.explicitMode || envRequestedMode || '';

  let runtimeMode = defaultMode;

  if (
    normalizedOverrides.forensicRequested
    && normalizeForensicMode(serverEnv.APP_FORENSIC_MODE || normalizedOverrides.forensicMode, FORENSIC_MODES.OFF) === FORENSIC_MODES.BOUNDED
    && normalizedOverrides.forensicAuthorized
  ) {
    runtimeMode = RUNTIME_MODES.EMERGENCY_FORENSICS;
    resolutionPath.push('bounded-forensic-override');
  } else if (
    requestedMode
    && requestedMode !== RUNTIME_MODES.PRODUCTION_ADAPTIVE
    && resolvedDeployment === 'production'
    && !normalizedOverrides.allowNonProductionOverride
  ) {
    runtimeMode = RUNTIME_MODES.PRODUCTION_ADAPTIVE;
    safeFallbackActivated = true;
    resolutionPath.push('safe-production-fallback');
  } else if (requestedMode) {
    runtimeMode = requestedMode;
    if (requestedMode === RUNTIME_MODES.STAGE_PRE_RELEASE) resolutionPath.push('explicit-stage-override');
    else if (requestedMode === RUNTIME_MODES.QA_CALIBRATION) resolutionPath.push('explicit-qa-override');
    else if (requestedMode === RUNTIME_MODES.DEVELOPMENT_RESEARCH) resolutionPath.push('development-fallback');
    else resolutionPath.push('explicit-runtime-mode');
  } else if (resolvedDeployment === 'production') {
    runtimeMode = RUNTIME_MODES.PRODUCTION_ADAPTIVE;
    resolutionPath.push('production-deployment-detection');
  } else {
    runtimeMode = RUNTIME_MODES.DEVELOPMENT_RESEARCH;
    resolutionPath.push('development-fallback');
  }

  const defaults = RUNTIME_MODE_DEFAULTS[runtimeMode] || RUNTIME_MODE_DEFAULTS[RUNTIME_MODES.PRODUCTION_ADAPTIVE];
  const diagnosticsMode = clampDiagnosticsMode(
    runtimeMode,
    normalizeDiagnosticsMode(serverEnv.APP_DIAGNOSTICS_MODE || publicEnv.NEXT_PUBLIC_DIAGNOSTICS_MODE || normalizedOverrides.diagnosticsMode, defaults.diagnosticsMode),
    normalizedOverrides.forensicAuthorized,
  );
  const telemetryLevel = clampTelemetryLevel(
    runtimeMode,
    normalizeTelemetryLevel(serverEnv.APP_TELEMETRY_LEVEL || normalizedOverrides.telemetryLevel, defaults.telemetryLevel),
  );
  const adaptiveCoreMode = clampAdaptiveCoreMode(
    runtimeMode,
    normalizeAdaptiveCoreMode(
      serverEnv.APP_ADAPTIVE_CORE_MODE || publicEnv.NEXT_PUBLIC_ADAPTIVE_CORE || normalizedOverrides.adaptiveCoreMode,
      defaults.adaptiveCoreMode,
    ),
  );
  const forensicMode = normalizeForensicMode(
    normalizedOverrides.forensicRequested
      ? FORENSIC_MODES.BOUNDED
      : serverEnv.APP_FORENSIC_MODE || normalizedOverrides.forensicMode,
    runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS ? FORENSIC_MODES.BOUNDED : FORENSIC_MODES.OFF,
  );

  const deepAwareness = diagnosticsMode !== DIAGNOSTICS_MODES.OFF && isDeepAwarenessMode(runtimeMode);
  const productionAdaptive = runtimeMode === RUNTIME_MODES.PRODUCTION_ADAPTIVE;
  const forensicModeActive = runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS && forensicMode === FORENSIC_MODES.BOUNDED;
  const adaptiveCoreEnabled = adaptiveCoreMode !== ADAPTIVE_CORE_MODES.OFF;
  const routeBudgetDebug = isEnabledFlag(publicEnv.NEXT_PUBLIC_ROUTE_BUDGET_DEBUG);
  const consoleNoiseClassifier = isEnabledFlag(publicEnv.NEXT_PUBLIC_CONSOLE_NOISE_CLASSIFIER);

  return {
    runtimeMode,
    diagnosticsMode,
    forensicMode,
    telemetryLevel,
    telemetryLabel: TELEMETRY_LABELS[telemetryLevel] || TELEMETRY_LABELS.T0,
    adaptiveCoreMode,
    adaptiveCoreEnabled,
    deepAwareness,
    productionAdaptive,
    forensicModeActive,
    prodLiteSafe: productionAdaptive && diagnosticsMode !== DIAGNOSTICS_MODES.DEEP,
    buildTarget,
    deploymentEnvironment: resolvedDeployment,
    safeFallbackActivated,
    resolutionPath,
    sources: {
      serverEnv,
      publicEnv,
      overrides: normalizedOverrides,
    },
    publicContract: {
      runtimeMode: productionAdaptive ? RUNTIME_MODES.PRODUCTION_ADAPTIVE : runtimeMode,
      diagnosticsMode: productionAdaptive ? diagnosticsMode : diagnosticsMode,
      telemetryLevel,
      adaptiveCoreEnabled,
      forensicAllowed: isEnabledFlag(publicEnv.NEXT_PUBLIC_FORENSIC_ALLOWED) || normalizedOverrides.forensicAuthorized,
      routeBudgetDebug,
      consoleNoiseClassifier,
    },
  };
}

export function resolveRuntimeMode(options = {}) {
  return resolveRuntimeModeSummary(options).runtimeMode;
}
