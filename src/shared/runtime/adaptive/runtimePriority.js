const PRIORITY_SCORES = Object.freeze({
  content: 100,
  navigation: 95,
  auth: 90,
  wallet: 85,
  session: 80,
  analytics: 60,
  widget: 55,
  decorative: 20,
});

export function classifyRuntimePriority(entry = {}) {
  const ownerType = String(entry.ownerType || entry.runtimeType || '').toLowerCase();
  if (ownerType.includes('content') || ownerType.includes('video') || ownerType.includes('iframe')) return 'content';
  if (ownerType.includes('auth')) return 'auth';
  if (ownerType.includes('wallet')) return 'wallet';
  if (ownerType.includes('route') || ownerType.includes('nav')) return 'navigation';
  if (ownerType.includes('decorative') || ownerType.includes('startup')) return 'decorative';
  if (ownerType.includes('widget') || ownerType.includes('polling')) return 'widget';
  return 'session';
}

export function getPriorityScore(entry) {
  const bucket = classifyRuntimePriority(entry);
  return PRIORITY_SCORES[bucket] || 50;
}

export function prioritizeRuntimeEntries(entries = []) {
  return [...entries].sort((left, right) => {
    const scoreDelta = getPriorityScore(right) - getPriorityScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return Number(right?.lastActivityAt || 0) - Number(left?.lastActivityAt || 0);
  });
}
