import { describe, expect, test } from 'vitest';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('native video cold offscreen contract', () => {
  test('forum mobile and thread profiles keep offscreen native video cold by default', () => {
    expect(routeProfiles['forum-feed-mobile'].allowWarmNative).toBe(false);
    expect(routeProfiles['forum-feed-mobile'].offscreenPolicy).toContain('destroy');
    expect(routeProfiles['forum-thread'].allowWarmNative).toBe(false);
    expect(routeProfiles['forum-thread'].offscreenPolicy).toContain('destroy');
  });
});
