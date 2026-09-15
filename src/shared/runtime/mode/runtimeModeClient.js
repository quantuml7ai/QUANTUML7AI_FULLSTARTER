import { resolveRuntimeModeSummary } from './runtimeModeResolver.js';
import { isEnabledFlag } from './runtimeFlags.js';

function readValue(source, key) {
  if (!source) return '';
  if (typeof source.get === 'function') return source.get(key) || '';
  return source[key] || '';
}

export function resolveRuntimeModeClient({
  env = {},
  searchParams = {},
  storage = {},
  cookies = {},
  allowOverride = false,
  internalUserRole = '',
  forensicAuthorized = false,
} = {}) {
  const publicForensicsAllowed = isEnabledFlag(env.NEXT_PUBLIC_FORENSIC_ALLOWED);
  const explicitMode = allowOverride ? readValue(searchParams, 'runtimeMode') || readValue(storage, 'runtimeMode') || readValue(cookies, 'runtimeMode') : '';
  const diagnosticsMode = allowOverride ? readValue(searchParams, 'diagnosticsMode') || readValue(storage, 'diagnosticsMode') : '';
  const forensicValue = allowOverride ? readValue(searchParams, 'forensicMode') || readValue(storage, 'forensicMode') : '';
  const forensicRequested = allowOverride && publicForensicsAllowed
    ? isEnabledFlag(forensicValue) || String(forensicValue || '').trim().toLowerCase() === 'bounded'
    : false;

  return resolveRuntimeModeSummary({
    env,
    overrides: {
      explicitMode,
      diagnosticsMode,
      forensicRequested,
      forensicAuthorized,
      allowNonProductionOverride: internalUserRole === 'admin' || internalUserRole === 'staff',
      internalUserRole,
    },
    buildTarget: 'client',
  });
}
