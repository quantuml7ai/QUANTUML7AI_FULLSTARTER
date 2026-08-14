import { describe, expect, test } from 'vitest';
import { fileText, readGovernance, relExists } from '../../support/runtimeGovernance.js';

describe('same-src thrash guard contract', () => {
  test('same-source diagnostics are required by stage 0 governance', () => {
    const governance = readGovernance();

    expect(governance.artifactExpectations).toContain('same-src-thrash.report.json');
    expect(relExists('tools/audit-same-src-thrash.js')).toBe(true);
    expect(fileText('tools/audit-same-src-thrash.js')).toMatch(/same-src/i);
    expect(governance.failCriteria.mobileForumMedia).toContain('same-mp4-repeated-window-over-3-without-explicit-retry');
  });
});
