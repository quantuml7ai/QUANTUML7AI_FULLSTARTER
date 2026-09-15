export const QL7_SUPPORT_ID = 'ql7-support'
export const QL7_SUPPORT_AVATAR_URL = '/ql7/ql7support.png'
export const QL7_SUPPORT_SYSTEM_ROLE = 'support'

export const QL7_SUPPORT_ACTOR = Object.freeze({
  id: QL7_SUPPORT_ID,
  isSystem: true,
  systemRole: QL7_SUPPORT_SYSTEM_ROLE,
  verified: true,
  immutable: true,
  followable: false,
  blockable: false,
  reportable: false,
  searchableAsUser: false,
  hasUserProfile: false,
  hasWallet: false,
  hasPosts: false,
  hasTopics: false,
  avatar: QL7_SUPPORT_AVATAR_URL,
})

export function normalizeQl7SupportId(value) {
  return String(value || '').trim().toLowerCase()
}

export function isQl7SupportId(value) {
  return normalizeQl7SupportId(value) === QL7_SUPPORT_ID
}

export function assertNotQl7SupportSender(value) {
  if (!isQl7SupportId(value)) return
  const error = new Error('ql7_support_sender_forbidden')
  error.status = 403
  throw error
}

export function assertQl7SupportDedupeKey(value) {
  const key = String(value || '').trim()
  if (key) return key
  const error = new Error('ql7_support_dedupe_required')
  error.status = 400
  throw error
}

export function normalizeQl7SupportText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function resolveQl7SupportDisplayName(t) {
  try {
    const value = t?.('ql7_support_display_name')
    if (value) return String(value)
  } catch {}
  return 'QL7 Support'
}

export function resolveQl7SupportAvatarUrl() {
  return QL7_SUPPORT_AVATAR_URL
}
