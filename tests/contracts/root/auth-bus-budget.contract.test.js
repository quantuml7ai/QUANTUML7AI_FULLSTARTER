import { describe, expect, test } from 'vitest';
import { fileText, readGovernance, readScripts, relExists } from '../../support/runtimeGovernance.js';

describe('auth bus budget contract', () => {
  test('auth fanout diagnostics and baseline classification are mandatory', () => {
    const governance = readGovernance();
    const scripts = readScripts();

    expect(scripts['verify:auth:fanout']).toBeTruthy();
    expect(relExists('tools/audit-auth-bus.js')).toBe(true);
    expect(relExists('tools/audit-auth-cascade.js')).toBe(true);
    expect(governance.consoleNoiseClasses.B).toContain('magic-401');
    expect(fileText('components/AuthNavClient.jsx')).toEqual(expect.stringContaining('auth:ok'));
  });
});
