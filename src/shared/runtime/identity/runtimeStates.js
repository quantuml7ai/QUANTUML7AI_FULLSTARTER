import {
  MEDIA_RUNTIME_STATES,
  NON_MEDIA_RUNTIME_STATES,
  isMediaRuntimeType,
} from './runtimeTypes.js';

export function getAllowedStatesForRuntimeType(runtimeType) {
  return isMediaRuntimeType(runtimeType) ? MEDIA_RUNTIME_STATES : NON_MEDIA_RUNTIME_STATES;
}

export function normalizeRuntimeState(runtimeType, state) {
  const normalizedState = String(state || '').trim();
  const allowedStates = getAllowedStatesForRuntimeType(runtimeType);
  if (allowedStates.includes(normalizedState)) return normalizedState;
  return allowedStates[0] || 'registered';
}

export function isTerminalRuntimeState(runtimeType, state) {
  return normalizeRuntimeState(runtimeType, state) === 'destroyed';
}
