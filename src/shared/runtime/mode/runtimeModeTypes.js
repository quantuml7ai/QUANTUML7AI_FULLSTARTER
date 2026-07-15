export const RUNTIME_MODES = Object.freeze({
  DEVELOPMENT_RESEARCH: 'development-research',
  QA_CALIBRATION: 'qa-calibration',
  STAGE_PRE_RELEASE: 'stage-pre-release',
  PRODUCTION_ADAPTIVE: 'production-adaptive',
  EMERGENCY_FORENSICS: 'emergency-forensics',
});

export const DIAGNOSTICS_MODES = Object.freeze({
  OFF: 'off',
  LITE: 'lite',
  DEEP: 'deep',
});

export const FORENSIC_MODES = Object.freeze({
  OFF: 'off',
  BOUNDED: 'bounded',
});

export const TELEMETRY_LEVELS = Object.freeze({
  T0: 'T0',
  T1: 'T1',
  T2: 'T2',
  T3: 'T3',
});

export const TELEMETRY_LABELS = Object.freeze({
  [TELEMETRY_LEVELS.T0]: 'minimal-prod-counters',
  [TELEMETRY_LEVELS.T1]: 'smart-prod-diagnostics',
  [TELEMETRY_LEVELS.T2]: 'stage-deep-runtime',
  [TELEMETRY_LEVELS.T3]: 'dev-research',
});

export const ADAPTIVE_CORE_MODES = Object.freeze({
  OFF: 'off',
  SHADOW: 'shadow',
  ENFORCED: 'enforced',
});

export const RUNTIME_MODE_DEFAULTS = Object.freeze({
  [RUNTIME_MODES.DEVELOPMENT_RESEARCH]: Object.freeze({
    diagnosticsMode: DIAGNOSTICS_MODES.DEEP,
    telemetryLevel: TELEMETRY_LEVELS.T3,
    adaptiveCoreMode: ADAPTIVE_CORE_MODES.SHADOW,
    deepAwareness: true,
    productionAdaptive: false,
  }),
  [RUNTIME_MODES.QA_CALIBRATION]: Object.freeze({
    diagnosticsMode: DIAGNOSTICS_MODES.DEEP,
    telemetryLevel: TELEMETRY_LEVELS.T2,
    adaptiveCoreMode: ADAPTIVE_CORE_MODES.SHADOW,
    deepAwareness: true,
    productionAdaptive: false,
  }),
  [RUNTIME_MODES.STAGE_PRE_RELEASE]: Object.freeze({
    diagnosticsMode: DIAGNOSTICS_MODES.LITE,
    telemetryLevel: TELEMETRY_LEVELS.T2,
    adaptiveCoreMode: ADAPTIVE_CORE_MODES.ENFORCED,
    deepAwareness: true,
    productionAdaptive: false,
  }),
  [RUNTIME_MODES.PRODUCTION_ADAPTIVE]: Object.freeze({
    diagnosticsMode: DIAGNOSTICS_MODES.OFF,
    telemetryLevel: TELEMETRY_LEVELS.T0,
    adaptiveCoreMode: ADAPTIVE_CORE_MODES.ENFORCED,
    deepAwareness: false,
    productionAdaptive: true,
  }),
  [RUNTIME_MODES.EMERGENCY_FORENSICS]: Object.freeze({
    diagnosticsMode: DIAGNOSTICS_MODES.LITE,
    telemetryLevel: TELEMETRY_LEVELS.T1,
    adaptiveCoreMode: ADAPTIVE_CORE_MODES.ENFORCED,
    deepAwareness: true,
    productionAdaptive: false,
  }),
});

export const MODE_SERVER_ENV_KEYS = Object.freeze([
  'NODE_ENV',
  'VERCEL_ENV',
  'APP_RUNTIME_MODE',
  'APP_DIAGNOSTICS_MODE',
  'APP_FORENSIC_MODE',
  'APP_TELEMETRY_LEVEL',
  'APP_ADAPTIVE_CORE_MODE',
  'APP_RUNTIME_PROFILE',
]);

export const MODE_PUBLIC_ENV_KEYS = Object.freeze([
  'NEXT_PUBLIC_RUNTIME_MODE',
  'NEXT_PUBLIC_DIAGNOSTICS_MODE',
  'NEXT_PUBLIC_ADAPTIVE_CORE',
  'NEXT_PUBLIC_FORENSIC_ALLOWED',
  'NEXT_PUBLIC_ROUTE_BUDGET_DEBUG',
  'NEXT_PUBLIC_CONSOLE_NOISE_CLASSIFIER',
]);
