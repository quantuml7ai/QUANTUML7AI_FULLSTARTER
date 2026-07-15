import { createBudgetViolationReporter } from './budgetViolations.js';
import { createPromotionJournal } from './promotionJournal.js';
import { pickWinningOwner } from './ownerArbitration.js';

function countActiveByType(entries = []) {
  return entries.reduce((acc, entry) => {
    if (entry?.state === 'destroyed') return acc;
    const runtimeType = String(entry?.runtimeType || '');
    acc[runtimeType] = (acc[runtimeType] || 0) + 1;
    return acc;
  }, {});
}

export function createBudgetEngine({ routeProfiles }) {
  const violations = createBudgetViolationReporter();
  const journal = createPromotionJournal();

  function evaluatePromotion({ profileId, entry, entries = [] }) {
    const profile = routeProfiles?.[profileId] || null;
    if (!profile) {
      const decision = journal.push({
        runtimeId: entry?.runtimeId,
        route: entry?.route,
        profileId,
        decision: 'blocked',
        reason: 'unknown-profile',
      });
      return { allowed: false, decision, profile };
    }

    const activeByType = countActiveByType(entries);
    const isIframe = String(entry?.runtimeType || '') === 'iframe-video';
    const isNative = String(entry?.runtimeType || '') === 'html5-video';
    const isAd = String(entry?.runtimeType || '') === 'ad-media';
    const currentCount = Number(activeByType[entry?.runtimeType] || 0);
    let limit = Number(profile?.budget?.hardCap || 0);

    if (isIframe) limit = Number(profile.maxIframeCount || 0);
    if (isNative) limit = Number(profile.maxNativeContentVideoCount || 0);
    if (isAd) limit = Number(profile.allowedAdMediaConcurrency || 0);

    if (limit >= 0 && currentCount >= limit) {
      const violation = violations.report({
        runtimeId: entry?.runtimeId,
        route: entry?.route,
        profileId,
        owner: entry?.owner,
        violation: 'promotion-blocked',
        exceeded: entry?.runtimeType,
        expectedAction: 'stay-demoted',
        actualAction: 'promotion-requested',
      });
      const decision = journal.push({
        runtimeId: entry?.runtimeId,
        route: entry?.route,
        profileId,
        decision: 'blocked',
        reason: 'type-limit-reached',
        meta: { violation },
      });
      return { allowed: false, decision, profile, violation };
    }

    const decision = journal.push({
      runtimeId: entry?.runtimeId,
      route: entry?.route,
      profileId,
      decision: 'allowed',
      reason: 'within-budget',
    });
    return { allowed: true, decision, profile };
  }

  function evaluateOwnerConflict({ profileId, candidates = [] }) {
    const profile = routeProfiles?.[profileId] || null;
    const priority = profile?.budget?.ownerArbitrationPriority || [];
    return pickWinningOwner(priority, candidates);
  }

  function snapshotBudgetPressure({ profileId, entries = [] }) {
    const profile = routeProfiles?.[profileId] || null;
    const activeEntries = entries.filter((entry) => entry?.state !== 'destroyed');
    const hardCap = Number(profile?.budget?.hardCap || 0);
    const softCap = Number(profile?.budget?.softCap || 0);
    return {
      profileId,
      activeCount: activeEntries.length,
      softCap,
      hardCap,
      pressureScore: hardCap > 0 ? Math.round((activeEntries.length / hardCap) * 100) : 0,
    };
  }

  return {
    evaluateOwnerConflict,
    evaluatePromotion,
    journal,
    snapshotBudgetPressure,
    violations,
  };
}
