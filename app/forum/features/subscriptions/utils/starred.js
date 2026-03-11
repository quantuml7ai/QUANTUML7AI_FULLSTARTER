export function prioritizeStarredItems(items, getAuthorId, starredAuthors) {
  if (!Array.isArray(items) || typeof getAuthorId !== 'function') return items || []
  if (!starredAuthors || !starredAuthors.size) return items

  const starred = []
  const regular = []
  for (const item of items) {
    const id = String(getAuthorId(item) || '').trim()
    if (id && starredAuthors.has(id)) starred.push(item)
    else regular.push(item)
  }
  return starred.concat(regular)
}
