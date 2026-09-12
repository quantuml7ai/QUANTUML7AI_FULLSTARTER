import { describe, expect, test } from 'vitest';
import { fileText, readGovernance, relExists } from '../../support/runtimeGovernance.js';

describe('runtime mode contract', () => {
  test('stage 0 defines a unified mode resolver and env contract boundaries', () => {
    const governance = readGovernance();

    expect(governance.modeContract.runtimeModes).toEqual([
      'development-research',
      'qa-calibration',
      'stage-pre-release',
      'production-adaptive',
      'emergency-forensics',
    ]);
    expect(governance.modeContract.serverEnvKeys).toEqual(
      expect.arrayContaining([
        'APP_RUNTIME_MODE',
        'APP_DIAGNOSTICS_MODE',
        'APP_FORENSIC_MODE',
        'APP_TELEMETRY_LEVEL',
        'APP_ADAPTIVE_CORE_MODE',
      ]),
    );
    expect(governance.modeContract.publicEnvKeys).toEqual(
      expect.arrayContaining([
        'NEXT_PUBLIC_RUNTIME_MODE',
        'NEXT_PUBLIC_DIAGNOSTICS_MODE',
        'NEXT_PUBLIC_ADAPTIVE_CORE',
        'NEXT_PUBLIC_FORENSIC_ALLOWED',
      ]),
    );

    expect(relExists('src/shared/runtime/mode/runtimeModeResolver.js')).toBe(true);
    expect(relExists('src/shared/runtime/mode/runtimeModeServer.js')).toBe(true);
    expect(relExists('src/shared/runtime/mode/runtimeModeClient.js')).toBe(true);
    expect(fileText('src/shared/runtime/mode/runtimeModeResolver.js')).toContain('safe-production-fallback');
    expect(fileText('.env.local.example')).toContain('APP_RUNTIME_MODE=');
  });
});
