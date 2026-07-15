import { describe, expect, test } from 'vitest';
import { createBudgetEngine } from '../../../src/shared/runtime/budgets/budgetEngine.js';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('mobile iframe singleton contract', () => {
  test('forum mobile blocks a second iframe promotion', () => {
    const engine = createBudgetEngine({ routeProfiles });
    const decision = engine.evaluatePromotion({
      profileId: 'forum-feed-mobile',
      entry: {
        runtimeId: 'iframe:2',
        runtimeType: 'iframe-video',
        owner: 'content',
        route: '/forum',
      },
      entries: [
        {
          runtimeId: 'iframe:1',
          runtimeType: 'iframe-video',
          state: 'active',
        },
      ],
    });

    expect(routeProfiles['forum-feed-mobile'].maxIframePlayers).toBe(1);
    expect(decision.allowed).toBe(false);
    expect(decision.decision.reason).toBe('type-limit-reached');
  });
});
