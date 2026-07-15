import { describe, expect, test } from 'vitest';
import { readGovernance } from '../../support/runtimeGovernance.js';
import { resolveRouteProfile } from '../../../src/shared/runtime/budgets/routeProfileResolver.js';

describe('forum player budget profiles contract', () => {
  test('route profiles resolve to the expected forum and route-heavy budgets', () => {
    const governance = readGovernance();
    const profileIds = Object.keys(governance.routeCapabilityProfiles);

    expect(profileIds).toEqual(
      expect.arrayContaining([
        'forum-feed-mobile',
        'forum-feed-desktop',
        'forum-thread',
        'exchange-heavy',
        'about-decorative',
      ]),
    );
    expect(resolveRouteProfile('/forum', 'coarse')).toBe('forum-feed-mobile');
    expect(resolveRouteProfile('/forum', 'fine')).toBe('forum-feed-desktop');
    expect(resolveRouteProfile('/exchange')).toBe('exchange-heavy');
    expect(resolveRouteProfile('/about')).toBe('about-decorative');
  });
});
