export function serializeRuntimeModeSummary(summary) {
  return JSON.stringify(summary, null, 2);
}

export function formatRuntimeModeSummary(summary) {
  return [
    `runtimeMode: ${summary.runtimeMode}`,
    `diagnosticsMode: ${summary.diagnosticsMode}`,
    `telemetryLevel: ${summary.telemetryLevel} (${summary.telemetryLabel})`,
    `adaptiveCore: ${summary.adaptiveCoreMode} / enabled=${summary.adaptiveCoreEnabled ? 'yes' : 'no'}`,
    `prodLiteSafe: ${summary.prodLiteSafe ? 'yes' : 'no'}`,
    `forensicModeActive: ${summary.forensicModeActive ? 'yes' : 'no'}`,
    `deploymentEnvironment: ${summary.deploymentEnvironment}`,
    `resolutionPath: ${(summary.resolutionPath || []).join(' -> ') || 'none'}`,
  ].join('\n');
}
