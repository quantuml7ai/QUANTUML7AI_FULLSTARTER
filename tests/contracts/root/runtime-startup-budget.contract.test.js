import { describe, expect, test } from 'vitest';
import { relExists, readGovernance } from '../../support/runtimeGovernance.js';
import { readRouteCapabilities } from '../../../src/shared/runtime/budgets/routeCapabilities.js';

describe('root runtime startup budget contract', () => {
  test('root and forum startup routes resolve to explicit capability profiles', () => {
    const governance = readGovernance();
    const forum = readRouteCapabilities('/forum', 'coarse');
    const landing = readRouteCapabilities('/');

    expect(governance.routeAssignments.map((row) => row.route)).toEqual(
      expect.arrayContaining(['/', '/forum', '/subscribe', '/ads/home']),
    );
    expect(forum.profileId).toBe('forum-feed-mobile');
    expect(forum.profile.startupSplashAllowed).toBe(true);
    expect(landing.profileId).toBe('landing-decorative');
    expect(relExists('tools/audit-provider-baseline.js')).toBe(true);
  });
});
