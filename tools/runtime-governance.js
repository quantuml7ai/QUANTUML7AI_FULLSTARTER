const fs = require('node:fs');
const path = require('node:path');

function normalizeRelPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8').replace(/^\uFEFF/, '');
}

function fileExists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function countMatches(text, rx) {
  const flags = rx.flags.includes('g') ? rx.flags : `${rx.flags}g`;
  const matcher = new RegExp(rx.source, flags);
  return (String(text || '').match(matcher) || []).length;
}

function scanFileSignals(root, relPath, definitions = []) {
  const text = readText(root, relPath);
  const counts = definitions.reduce((acc, definition) => {
    acc[definition.key] = countMatches(text, definition.rx);
    return acc;
  }, {});
  return {
    file: normalizeRelPath(relPath),
    text,
    counts,
  };
}

function scanFiles(root, relPaths = [], definitions = []) {
  return relPaths
    .filter((relPath) => fileExists(root, relPath))
    .map((relPath) => scanFileSignals(root, relPath, definitions));
}

function writeJsonReport(root, relPath, payload) {
  const file = path.join(root, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return file;
}

function loadGovernance(root = process.cwd()) {
  const file = path.join(root, 'config', 'runtime-governance.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listRequiredScripts(governance) {
  return Array.isArray(governance?.scriptExpectations) ? governance.scriptExpectations.slice() : [];
}

function listRequiredTools(governance) {
  return Array.isArray(governance?.auditToolExpectations) ? governance.auditToolExpectations.slice() : [];
}

function listRequiredArtifacts(governance) {
  return Array.isArray(governance?.artifactExpectations) ? governance.artifactExpectations.slice() : [];
}

function listBaselineArtifacts(governance) {
  return Array.isArray(governance?.baselineArtifacts) ? governance.baselineArtifacts.slice() : [];
}

function listScenarioIds(governance) {
  return Array.isArray(governance?.scenarioMatrix)
    ? governance.scenarioMatrix.map((scenario) => String(scenario.id || '')).filter(Boolean)
    : [];
}

function listScenarioGroupIds(governance) {
  return governance?.scenarioGroups ? Object.keys(governance.scenarioGroups) : [];
}

function resolveRouteProfile(governance, routeKey, deviceClass = 'coarse') {
  const normalizedRoute = String(routeKey || '').trim();
  const entry = Array.isArray(governance?.routeAssignments)
    ? governance.routeAssignments.find((row) => String(row?.route || '') === normalizedRoute)
    : null;

  if (!entry) return null;
  if (entry.type === 'device-class') {
    return entry?.profiles?.[deviceClass === 'fine' ? 'fine' : 'coarse'] || null;
  }
  return entry.profile || null;
}

function matchesSensitiveRuntimePath(relPath, governance) {
  const normalized = normalizeRelPath(relPath);
  const patterns = Array.isArray(governance?.runtimeCriticalPaths) ? governance.runtimeCriticalPaths : [];
  return patterns.some((pattern) => {
    const normalizedPattern = normalizeRelPath(pattern);
    if (normalizedPattern.endsWith('/**')) {
      return normalized.startsWith(normalizedPattern.slice(0, -3));
    }
    return normalized === normalizedPattern;
  });
}

function getScenarioGroup(governance, groupId) {
  const ids = Array.isArray(governance?.scenarioGroups?.[groupId])
    ? governance.scenarioGroups[groupId]
    : [];
  const wanted = new Set(ids.map((id) => String(id || '')));
  return Array.isArray(governance?.scenarioMatrix)
    ? governance.scenarioMatrix.filter((scenario) => wanted.has(String(scenario?.id || '')))
    : [];
}

function readPackageScripts(root) {
  const pkg = JSON.parse(readText(root, 'package.json'));
  return pkg?.scripts || {};
}

function captureContourCoverage(root = process.cwd()) {
  const governancePresent = fileExists(root, 'config/runtime-governance.json');
  const governance = governancePresent ? loadGovernance(root) : {};
  const scripts = readPackageScripts(root);
  const requiredScripts = listRequiredScripts(governance);
  const requiredTools = listRequiredTools(governance);
  const requiredArtifacts = listRequiredArtifacts(governance);
  const baselineArtifacts = listBaselineArtifacts(governance);
  const requiredContracts = Array.isArray(governance?.contractExpectations) ? governance.contractExpectations : [];
  const requiredUnits = Array.isArray(governance?.unitExpectations) ? governance.unitExpectations : [];
  const requiredComponents = Array.isArray(governance?.componentExpectations) ? governance.componentExpectations : [];
  const requiredIntegrations = Array.isArray(governance?.integrationExpectations) ? governance.integrationExpectations : [];
  const requiredSmoke = Array.isArray(governance?.smokeExpectations) ? governance.smokeExpectations : [];

  const testCodexSource = fileExists(root, 'tools/test-codex.mjs')
    ? readText(root, 'tools/test-codex.mjs')
    : '';

  return {
    governanceConfigPresent: governancePresent,
    modeContract: {
      runtimeModes: Array.isArray(governance?.modeContract?.runtimeModes) ? governance.modeContract.runtimeModes.length : 0,
      diagnosticsModes: Array.isArray(governance?.modeContract?.diagnosticsModes) ? governance.modeContract.diagnosticsModes.length : 0,
      forensicModes: Array.isArray(governance?.modeContract?.forensicModes) ? governance.modeContract.forensicModes.length : 0,
      telemetryLevels: Array.isArray(governance?.modeContract?.telemetryLevels) ? governance.modeContract.telemetryLevels.length : 0,
      serverEnvKeys: Array.isArray(governance?.modeContract?.serverEnvKeys) ? governance.modeContract.serverEnvKeys.length : 0,
      publicEnvKeys: Array.isArray(governance?.modeContract?.publicEnvKeys) ? governance.modeContract.publicEnvKeys.length : 0,
    },
    routeProfiles: {
      count: Object.keys(governance?.routeCapabilityProfiles || {}).length,
      ids: Object.keys(governance?.routeCapabilityProfiles || {}),
    },
    routeAssignments: {
      count: Array.isArray(governance?.routeAssignments) ? governance.routeAssignments.length : 0,
    },
    passportFields: {
      count: Array.isArray(governance?.passportFields) ? governance.passportFields.length : 0,
    },
    regressionMetrics: {
      count: Array.isArray(governance?.regressionMetrics) ? governance.regressionMetrics.length : 0,
    },
    scenarioMatrix: {
      count: listScenarioIds(governance).length,
      groups: listScenarioGroupIds(governance).length,
    },
    requiredScripts: {
      total: requiredScripts.length,
      present: requiredScripts.filter((name) => !!scripts[name]).length,
      missing: requiredScripts.filter((name) => !scripts[name]),
    },
    requiredTools: {
      total: requiredTools.length,
      present: requiredTools.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredTools.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredArtifacts: {
      total: requiredArtifacts.length,
      present: requiredArtifacts.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredArtifacts.filter((relPath) => !fileExists(root, relPath)),
    },
    baselineArtifacts: {
      total: baselineArtifacts.length,
      present: baselineArtifacts.filter((relPath) => fileExists(root, relPath)).length,
      missing: baselineArtifacts.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredContracts: {
      total: requiredContracts.length,
      present: requiredContracts.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredContracts.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredUnits: {
      total: requiredUnits.length,
      present: requiredUnits.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredUnits.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredComponents: {
      total: requiredComponents.length,
      present: requiredComponents.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredComponents.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredIntegrations: {
      total: requiredIntegrations.length,
      present: requiredIntegrations.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredIntegrations.filter((relPath) => !fileExists(root, relPath)),
    },
    requiredSmoke: {
      total: requiredSmoke.length,
      present: requiredSmoke.filter((relPath) => fileExists(root, relPath)).length,
      missing: requiredSmoke.filter((relPath) => !fileExists(root, relPath)),
    },
    stageGates: {
      count: Array.isArray(governance?.stageGates) ? governance.stageGates.length : 0,
    },
    pipeline: {
      usesFastAudits: testCodexSource.includes("'verify:audits:fast'"),
      hasRuntimeCriticalGate: testCodexSource.includes('shouldRunRuntimeCriticalGate'),
      hasDeepGate: testCodexSource.includes('shouldRunDeepDiagnosticGate'),
    },
  };
}

module.exports = {
  captureContourCoverage,
  countMatches,
  fileExists,
  getScenarioGroup,
  listRequiredArtifacts,
  listBaselineArtifacts,
  listRequiredScripts,
  listRequiredTools,
  listScenarioGroupIds,
  listScenarioIds,
  loadGovernance,
  matchesSensitiveRuntimePath,
  normalizeRelPath,
  readPackageScripts,
  readText,
  resolveRouteProfile,
  scanFileSignals,
  scanFiles,
  writeJsonReport,
};
