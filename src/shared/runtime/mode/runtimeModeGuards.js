import { DIAGNOSTICS_MODES, RUNTIME_MODES } from './runtimeModeTypes.js';
import { resolveRuntimeModeSummary } from './runtimeModeResolver.js';

function ensureSummary(input = {}) {
  if (input?.runtimeMode && input?.telemetryLevel) return input;
  return resolveRuntimeModeSummary(input);
}

export function allowDeepDiagnostics(input = {}) {
  const summary = ensureSummary(input);
  if (summary.runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS) {
    return summary.forensicModeActive && summary.diagnosticsMode !== DIAGNOSTICS_MODES.OFF;
  }
  return summary.deepAwareness && summary.diagnosticsMode !== DIAGNOSTICS_MODES.OFF;
}

export function allowForensicCapture(input = {}) {
  const summary = ensureSummary(input);
  return summary.runtimeMode === RUNTIME_MODES.EMERGENCY_FORENSICS && summary.forensicModeActive;
}

export function isProdLiteDisciplineActive(input = {}) {
  const summary = ensureSummary(input);
  return summary.productionAdaptive && summary.prodLiteSafe;
}

export function createModeBoundarySummary(input = {}) {
  const summary = ensureSummary(input);
  return {
    runtimeMode: summary.runtimeMode,
    diagnosticsMode: summary.diagnosticsMode,
    telemetryLevel: summary.telemetryLevel,
    telemetryLabel: summary.telemetryLabel,
    deepDiagnostics: allowDeepDiagnostics(summary),
    productionAdaptive: summary.productionAdaptive,
    prodLiteSafe: summary.prodLiteSafe,
    forensicCapture: allowForensicCapture(summary),
    adaptiveCoreMode: summary.adaptiveCoreMode,
    adaptiveCoreEnabled: summary.adaptiveCoreEnabled,
    safeFallbackActivated: summary.safeFallbackActivated,
    resolutionPath: summary.resolutionPath,
    deploymentEnvironment: summary.deploymentEnvironment,
  };
}
