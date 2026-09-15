import { describe, expect, test } from 'vitest';
import { fileText, readGovernance } from '../../support/runtimeGovernance.js';

describe('forum media budget owner contract', () => {
  test('forum profiles keep single-owner budget-first priorities', () => {
    const governance = readGovernance();
    const profiles = governance.routeCapabilityProfiles;

    for (const profileId of ['forum-feed-mobile', 'forum-feed-desktop', 'forum-thread']) {
      const profile = profiles[profileId];
      expect(profile.budget.hardCap).toBeGreaterThanOrEqual(profile.budget.softCap);
      expect(profile.budget.ownerArbitrationPriority[0]).toBe('content');
      expect(profile.budget.promotionRules).toEqual(expect.arrayContaining(['shell-first-only']));
    }

    expect(governance.budgetGovernance.promotionRules).toEqual(expect.arrayContaining(['one-owner', 'budget-first']));
    expect(fileText('tools/audit-player-ownership.js')).toMatch(/owner/i);
  });
});
