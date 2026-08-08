import { resolveRuntimeModeSummary } from './runtimeModeResolver.js';

export function resolveRuntimeModeServer({
  env = process.env,
  overrides = {},
} = {}) {
  return resolveRuntimeModeSummary({
    env,
    overrides,
    buildTarget: 'server',
  });
}
