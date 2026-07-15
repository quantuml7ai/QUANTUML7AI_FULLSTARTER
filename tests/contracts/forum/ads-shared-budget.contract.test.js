import { describe, expect, test } from 'vitest';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('ads shared budget contract', () => {
  test('content owner outranks ad owner and forum ad concurrency stays capped', () => {
    const engine = createBudgetEngine({ routeProfiles });
    const winner = engine.evaluateOwnerConflict({
      profileId: 'forum-feed-mobile',
      candidates: [
        { runtimeId: 'ad:1', ownerType: 'ad', lastActivityAt: 1 },
        { runtimeId: 'content:1', ownerType: 'content', lastActivityAt: 1 },
      ],
    });

    expect(winner.runtimeId).toBe('content:1');
    expect(routeProfiles['forum-feed-mobile'].allowedAdPlayers).toBeLessThanOrEqual(1);
    expect(routeProfiles['forum-feed-desktop'].allowedAdPlayers).toBeLessThanOrEqual(1);
  });
});
