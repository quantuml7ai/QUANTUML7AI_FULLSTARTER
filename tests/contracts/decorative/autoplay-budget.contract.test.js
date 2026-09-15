import { describe, expect, test } from 'vitest';
import { routeProfiles } from '../../../src/shared/runtime/budgets/routeProfiles.js';

describe('decorative autoplay budget contract', () => {
  test('decorative profiles degrade autoplay on mobile and avoid content-grade runtime', () => {
    expect(routeProfiles['about-decorative'].decorativeMediaPermission).toBe('degraded-mobile');
    expect(routeProfiles['quest-cards'].decorativeMediaPermission).toBe('degraded-mobile');
    expect(routeProfiles['about-decorative'].maxNativeContentPlayers).toBe(0);
    expect(routeProfiles['ads-preview'].allowWalletRuntimeBeforeIntent).toBe(false);
  });
});
