function ownerRank(priority, ownerType) {
  const normalizedOwnerType = String(ownerType || '');
  const index = priority.indexOf(normalizedOwnerType);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function compareOwnerPriority(priority, left, right) {
  const leftRank = ownerRank(priority, left?.ownerType);
  const rightRank = ownerRank(priority, right?.ownerType);
  if (leftRank !== rightRank) return leftRank - rightRank;
  const leftActivity = Number(left?.lastActivityAt || 0);
  const rightActivity = Number(right?.lastActivityAt || 0);
  if (leftActivity !== rightActivity) return rightActivity - leftActivity;
  return String(left?.runtimeId || '').localeCompare(String(right?.runtimeId || ''));
}

export function pickWinningOwner(priority, entries = []) {
  return [...entries].sort((left, right) => compareOwnerPriority(priority, left, right))[0] || null;
}
