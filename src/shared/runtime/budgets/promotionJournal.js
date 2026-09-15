export function createPromotionJournal() {
  const entries = [];
  return {
    push(entry) {
      const normalized = {
        ts: Date.now(),
        runtimeId: String(entry?.runtimeId || ''),
        route: String(entry?.route || ''),
        profileId: String(entry?.profileId || ''),
        decision: String(entry?.decision || 'unknown'),
        reason: String(entry?.reason || ''),
        meta: entry?.meta && typeof entry.meta === 'object' ? { ...entry.meta } : {},
      };
      entries.push(normalized);
      while (entries.length > 400) entries.shift();
      return normalized;
    },
    list() {
      return entries.slice();
    },
    clear() {
      entries.length = 0;
    },
  };
}
