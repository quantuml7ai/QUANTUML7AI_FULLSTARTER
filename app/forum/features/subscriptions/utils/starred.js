function normalizeRuntimeIdentity(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''

  const lower = value.toLowerCase()
  if (/^wallet:0x[a-f0-9]{40}$/i.test(value)) return value.slice('wallet:'.length).toLowerCase()
  if (/^0x[a-f0-9]{40}$/i.test(value)) return lower

  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
    if (lower.startsWith(prefix)) return value.slice(prefix.length).trim()
  }

  return value
}

export function normalizeStarredAuthorId(authorId, resolveProfileAccountIdFn) {
  return normalizeRuntimeIdentity(resolveProfileAccountIdFn?.(authorId) || authorId)
}

export function resolveStarredEntityAuthorId(entity, resolveProfileAccountIdFn) {
  return normalizeStarredAuthorId(entity?.userId || entity?.accountId, resolveProfileAccountIdFn)
}

export function getStarredEntityRank(entity, starredAuthors, resolveProfileAccountIdFn) {
  void entity
  void starredAuthors
  void resolveProfileAccountIdFn
  return 0
}

export function prioritizeStarredItems(items, getAuthorId, starredAuthors, resolveProfileAccountIdFn) {
  void getAuthorId
  void starredAuthors
  void resolveProfileAccountIdFn
  return Array.isArray(items) ? items : []
}
