import { buildRuntimePassport } from '../passports/runtimePassport.js';

export function inspectRuntimeState({
  route,
  deviceClass = 'coarse',
  registry,
  routeProfileResolver,
  providerCounts = {},
  authCounts = {},
}) {
  const entries = typeof registry?.list === 'function' ? registry.list() : [];
  const budgetProfile = typeof routeProfileResolver === 'function'
    ? routeProfileResolver(route, deviceClass)
    : 'unknown';

  return buildRuntimePassport({
    route,
    deviceClass,
    budgetProfile,
    registryEntries: entries,
    providerCounts,
    authCounts,
  });
}
