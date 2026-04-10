export function normalizeStarredAuthorId(authorId, resolveProfileAccountIdFn) {
  return String(resolveProfileAccountIdFn?.(authorId) || authorId || '').trim()
}

export function resolveStarredEntityAuthorId(entity, resolveProfileAccountIdFn) {
  return normalizeStarredAuthorId(entity?.userId || entity?.accountId, resolveProfileAccountIdFn)
}

export function getStarredEntityRank(entity, starredAuthors, resolveProfileAccountIdFn) {
  if (!starredAuthors || !starredAuthors.size) return 0
  const authorId = resolveStarredEntityAuthorId(entity, resolveProfileAccountIdFn)
  return authorId && starredAuthors.has(authorId) ? 1 : 0
}

export function prioritizeStarredItems(items, getAuthorId, starredAuthors, resolveProfileAccountIdFn) {
  if (!Array.isArray(items) || typeof getAuthorId !== 'function') return items || []
  if (!starredAuthors || !starredAuthors.size) return items

  const starred = []
  const regular = []
  for (const item of items) {
    const id = normalizeStarredAuthorId(getAuthorId(item), resolveProfileAccountIdFn)
    if (id && starredAuthors.has(id)) starred.push(item)
    else regular.push(item)
  }
  return starred.concat(regular)
}
