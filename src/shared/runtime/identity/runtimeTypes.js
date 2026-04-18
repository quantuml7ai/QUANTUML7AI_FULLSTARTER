import governance from '../../../../config/runtime-governance.json';

export const MEDIA_RUNTIME_STATES = Object.freeze([
  ...(governance.runtimeIdentity.lifecycleStates?.media || []),
]);

export const NON_MEDIA_RUNTIME_STATES = Object.freeze([
  ...(governance.runtimeIdentity.lifecycleStates?.nonMedia || []),
]);

export const RUNTIME_TYPES = Object.freeze(
  governance.runtimeIdentity.heavyObjectClasses.map((runtimeType) => String(runtimeType || '')),
);

export const MEDIA_RUNTIME_TYPES = Object.freeze([
  'html5-video',
  'iframe-video',
  'ad-media',
  'qcast',
  'startup-media',
  'decorative-media',
]);

export const NON_MEDIA_RUNTIME_TYPES = Object.freeze(
  RUNTIME_TYPES.filter((runtimeType) => !MEDIA_RUNTIME_TYPES.includes(runtimeType)),
);

export function isKnownRuntimeType(runtimeType) {
  return RUNTIME_TYPES.includes(String(runtimeType || ''));
}

export function isMediaRuntimeType(runtimeType) {
  return MEDIA_RUNTIME_TYPES.includes(String(runtimeType || ''));
}
