import { describe, expect, test } from 'vitest';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('wallet intent only contract', () => {
  test('wallet-capable profiles forbid wallet runtime before user intent', () => {
    for (const profileId of ['forum-feed-mobile', 'auth-light', 'wallet-ready', 'ads-preview']) {
      expect(routeProfiles[profileId].allowWalletRuntimeBeforeIntent).toBe(false);
    }
  });
});
