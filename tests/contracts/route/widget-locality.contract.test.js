import { describe, expect, test } from 'vitest';
import { relExists } from '../../support/runtimeGovernance.js';
import { readRouteCapabilities } from '../../../src/shared/runtime/budgets/routeCapabilities.js';

describe('route widget locality contract', () => {
  test('exchange route keeps widgets route-local and teardown-aware', () => {
    const exchange = readRouteCapabilities('/exchange');

    expect(exchange.profileId).toBe('exchange-heavy');
    expect(exchange.profile.allowRouteWidgets).toBe(true);
    expect(exchange.profile.allowPolling).toBe(true);
    expect(exchange.profile.routeLeavePolicy).toBe('strict-route-cleanup');
    expect(relExists('tools/audit-route-budgets.js')).toBe(true);
    expect(relExists('tools/audit-route-teardown.js')).toBe(true);
  });
});
