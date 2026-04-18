import { describe, expect, test } from 'vitest';
import { fileText, readGovernance, readScripts, relExists } from '../../support/runtimeGovernance.js';

describe('runtime governance contracts', () => {
  test('stage 0 governance declares required profiles, scripts, audits and gates', () => {
    const governance = readGovernance();
    const scripts = readScripts();

    expect(governance.stage).toBe('stage0');
    expect(governance.stageGates).toHaveLength(8);
    expect(Object.keys(governance.routeCapabilityProfiles)).toEqual(
      expect.arrayContaining([
        'forum-feed-mobile',
        'forum-feed-desktop',
        'forum-thread',
        'landing-decorative',
        'widget-heavy',
        'editor-preview',
        'auth-light',
        'wallet-ready',
        'exchange-heavy',
        'about-decorative',
        'ads-preview',
        'quest-cards',
        'qcast-mixed',
      ]),
    );
    expect(governance.scenarioMatrix.length).toBeGreaterThanOrEqual(70);
    expect(Object.keys(governance.scenarioGroups).length).toBeGreaterThanOrEqual(15);

    for (const scriptName of governance.scriptExpectations) {
      expect(scripts[scriptName]).toBeTruthy();
    }

    for (const relPath of governance.auditToolExpectations) {
      expect(relExists(relPath)).toBe(true);
    }

    expect(fileText('tools/test-codex.mjs')).toContain("'verify:audits:fast'");
    expect(fileText('tools/test-codex.mjs')).toContain('shouldRunRuntimeCriticalGate');
    expect(fileText('tools/test-codex.mjs')).toContain('shouldRunDeepDiagnosticGate');
    expect(relExists('src/shared/runtime/mode/runtimeModeResolver.js')).toBe(true);
    expect(relExists('src/shared/runtime/mode/runtimeModeServer.js')).toBe(true);
    expect(relExists('src/shared/runtime/mode/runtimeModeClient.js')).toBe(true);
  });
});
