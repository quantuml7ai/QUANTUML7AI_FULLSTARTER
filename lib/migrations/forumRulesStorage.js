// Migration-only owner for the retired Forum rules browser-storage key.
export const FORUM_RULES_STORAGE_KEY = 'ql7_forum_rules_accepted'
const RETIRED_FORUM_RULES_STORAGE_KEYS = Object.freeze(['ql7_forum_rules_accepted_v1'])

export function readAndMigrateForumRulesAcceptance(storage) {
  if (!storage) return ''
  const current = String(storage.getItem(FORUM_RULES_STORAGE_KEY) || '')
  if (current) return current

  for (const retiredKey of RETIRED_FORUM_RULES_STORAGE_KEYS) {
    const value = String(storage.getItem(retiredKey) || '')
    if (!value) continue
    storage.setItem(FORUM_RULES_STORAGE_KEY, value)
    storage.removeItem(retiredKey)
    return value
  }
  return ''
}

export function writeForumRulesAcceptance(storage, value = '1') {
  if (!storage) return
  storage.setItem(FORUM_RULES_STORAGE_KEY, String(value || '1'))
  for (const retiredKey of RETIRED_FORUM_RULES_STORAGE_KEYS) storage.removeItem(retiredKey)
}
