import { isKnownRuntimeType } from './runtimeTypes.js';
import { normalizeRuntimeState } from './runtimeStates.js';

function nextRuntimeId(prefix, sequence) {
  return `${prefix}:${sequence}`;
}

function withTimestamp(value, fallback = Date.now()) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeEntry(input, sequence) {
  const runtimeType = String(input?.runtimeType || '').trim();
  if (!isKnownRuntimeType(runtimeType)) {
    throw new Error(`Unknown runtime type: ${runtimeType || 'empty'}`);
  }

  const createdAt = withTimestamp(input?.createdAt);
  const state = normalizeRuntimeState(runtimeType, input?.state);
  return {
    runtimeId: String(input?.runtimeId || nextRuntimeId(runtimeType, sequence)),
    runtimeType,
    owner: String(input?.owner || 'unknown'),
    route: String(input?.route || 'unknown'),
    budgetProfile: String(input?.budgetProfile || 'unknown'),
    state,
    createdAt,
    lastActivityAt: withTimestamp(input?.lastActivityAt, createdAt),
    promotedBy: input?.promotedBy ? String(input.promotedBy) : '',
    demotionScheduled: !!input?.demotionScheduled,
    destroyReason: input?.destroyReason ? String(input.destroyReason) : '',
    sourceKey: input?.sourceKey ? String(input.sourceKey) : '',
    sameSrcGroup: input?.sameSrcGroup ? String(input.sameSrcGroup) : '',
    visibilityState: input?.visibilityState ? String(input.visibilityState) : 'visible',
    cooldownUntil: withTimestamp(input?.cooldownUntil, 0),
    teardownExpected: !!input?.teardownExpected,
    teardownStatus: input?.teardownStatus ? String(input.teardownStatus) : 'unknown',
    importanceClass: input?.importanceClass ? String(input.importanceClass) : 'secondary-runtime',
    priorityTier: Number.isFinite(Number(input?.priorityTier)) ? Number(input.priorityTier) : 3,
    adaptiveDegradeEligible: input?.adaptiveDegradeEligible !== false,
    prodLiteSafe: input?.prodLiteSafe !== false,
    diagnosticOnly: !!input?.diagnosticOnly,
    forensicEligible: !!input?.forensicEligible,
    teardownOwner: input?.teardownOwner ? String(input.teardownOwner) : String(input?.owner || 'unknown'),
    routeLocality: input?.routeLocality ? String(input.routeLocality) : 'route-local',
    backgroundPolicy: input?.backgroundPolicy ? String(input.backgroundPolicy) : 'pause-non-critical',
    memoryPressurePolicy: input?.memoryPressurePolicy ? String(input.memoryPressurePolicy) : 'demote-before-content',
    mainThreadPressurePolicy: input?.mainThreadPressurePolicy ? String(input.mainThreadPressurePolicy) : 'suppress-secondary-updates',
    samplingEligibility: input?.samplingEligibility ? String(input.samplingEligibility) : 'bounded',
    meta: input?.meta && typeof input.meta === 'object' ? { ...input.meta } : {},
  };
}

export function createRuntimeRegistry(initialEntries = []) {
  let sequence = 0;
  const store = new Map();

  const api = {
    register(entry) {
      sequence += 1;
      const normalized = normalizeEntry(entry, sequence);
      store.set(normalized.runtimeId, normalized);
      return normalized;
    },
    update(runtimeId, patch = {}) {
      const current = store.get(String(runtimeId || ''));
      if (!current) return null;
      const updated = normalizeEntry(
        {
          ...current,
          ...patch,
          runtimeId: current.runtimeId,
          createdAt: current.createdAt,
        },
        sequence || 1,
      );
      store.set(updated.runtimeId, updated);
      return updated;
    },
    destroy(runtimeId, destroyReason = 'destroyed') {
      return api.update(runtimeId, {
        state: 'destroyed',
        destroyReason,
        demotionScheduled: false,
        lastActivityAt: Date.now(),
        teardownStatus: 'completed',
      });
    },
    list() {
      return Array.from(store.values()).sort((a, b) => {
        return a.createdAt - b.createdAt || a.runtimeId.localeCompare(b.runtimeId);
      });
    },
    listActive() {
      return api.list().filter((entry) => entry.state !== 'destroyed');
    },
    get(runtimeId) {
      return store.get(String(runtimeId || '')) || null;
    },
    clear() {
      store.clear();
      sequence = 0;
    },
    summary() {
      return api.list().reduce((acc, entry) => {
        acc.total += 1;
        acc.byType[entry.runtimeType] = (acc.byType[entry.runtimeType] || 0) + 1;
        acc.byState[entry.state] = (acc.byState[entry.state] || 0) + 1;
        if (entry.state !== 'destroyed') acc.alive += 1;
        return acc;
      }, {
        total: 0,
        alive: 0,
        byType: {},
        byState: {},
      });
    },
  };

  initialEntries.forEach((entry) => {
    api.register(entry);
  });

  return api;
}
