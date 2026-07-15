import { describe, expect, test } from 'vitest';
import { fileText, readGovernance } from '../../support/runtimeGovernance.js';

describe('qcast shared mute owner contract', () => {
  test('qcast mixed profile and player surface stay on shared mute ownership', () => {
    const governance = readGovernance();
    const profile = governance.routeCapabilityProfiles['qcast-mixed'];
    const qcastPlayer = fileText('app/forum/features/media/components/QCastPlayer.jsx');

    expect(profile.budget.ownerArbitrationPriority).toEqual(expect.arrayContaining(['content', 'qcast']));
    expect(profile.budget.blockReasons).toContain('qcast-content-overlap');
    expect(governance.artifactExpectations).toContain('qcast-ownership.report.json');
    expect(qcastPlayer).toContain("mutedEventName = 'forum:media-mute'");
  });
});
