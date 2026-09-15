import { describe, expect, test } from 'vitest';
import { readGovernance, readScripts } from '../../support/runtimeGovernance.js';

const SMOKE_CASES = [
  ['forum feed mobile-budget smoke', 'forum-mobile', 'forum-cold-signed-out'],
  ['forum auth entry smoke', 'auth-cascade', 'forum-cold-signed-in'],
  ['forum route return smoke', 'forum-route-return', 'forum-topic-back'],
  ['forum long-scroll memory smoke', 'forum-long-scroll', 'forum-long-scroll-100'],
  ['exchange isolation smoke', 'exchange-route', 'exchange-leave-cleanup'],
  ['root shell budget smoke', 'provider-baseline', 'provider-only-startup-without-forum'],
  ['decorative autoplay degradation smoke', 'decorative-media', 'about-decorative-budget'],
  ['wallet intent smoke', 'forum-wallet-untouched', 'forum-with-external-wallet-intent'],
  ['qcast coexistence smoke', 'qcast-mixed', 'forum-qcast-content-coexistence'],
];

describe('runtime governance smoke contour', () => {
  test('stage 0 smoke packs stay wired to scenario groups and verify scripts', () => {
    const governance = readGovernance();
    const scripts = readScripts();

    for (const [, groupId, scenarioId] of SMOKE_CASES) {
      expect(governance.scenarioGroups[groupId]).toContain(scenarioId);
    }

    expect(scripts['verify:scenario:forum-mobile']).toBeTruthy();
    expect(scripts['verify:scenario:forum-long-scroll']).toBeTruthy();
    expect(scripts['verify:scenario:qcast-mixed']).toBeTruthy();
    expect(governance.artifactExpectations).toEqual(
      expect.arrayContaining([
        'runtime-passport.snapshot.json',
        'route-teardown.report.json',
        'mobile-matrix.report.json',
      ]),
    );
  });
});
