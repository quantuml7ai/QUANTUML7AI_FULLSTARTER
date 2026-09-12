const crypto = require('node:crypto')

const BATTLE_CHAT_ANONYMOUS_AVATAR_URL = '/anonymous/anonymous.png'
const BATTLE_CHAT_AUTHOR_KEY_PREFIX = 'battlechat-author:'

function str(value) {
  return String(value ?? '').trim()
}

function normalizeNickname(value) {
  return str(value).replace(/\s+/g, ' ').slice(0, 32)
}

function normalizeAvatar(value) {
  const raw = str(value)
  if (!raw) return ''
  if (
    raw.startsWith('/anonymous/') ||
    raw.startsWith('/uploads/') ||
    raw.startsWith('/avatars/') ||
    raw.startsWith('/vip/') ||
    /^https?:\/\//i.test(raw)
  ) {
    return raw.slice(0, 4096)
  }
  return ''
}

function toMs(value) {
  if (value == null || value === '') return 0
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function profileVipUntil(profile = {}) {
  const candidates = [
    profile?.vipUntil,
    profile?.vipUntilMs,
    profile?.vipExpiresAt,
    profile?.vip_until,
    profile?.vip_exp,
    profile?.subscription?.vipUntil,
    profile?.subscription?.vipUntilMs,
    profile?.quota?.vipUntil,
    profile?.quota?.vipUntilMs,
  ]
  for (const candidate of candidates) {
    const ms = toMs(candidate)
    if (ms > 0) return ms
  }
  return 0
}

function profileVipActive(profile = {}) {
  const vipUntil = profileVipUntil(profile)
  const plan = str(profile?.plan || profile?.subscription?.plan || profile?.quota?.plan).toLowerCase()
  return Boolean(
    profile?.vipActive === true ||
    profile?.isVip === true ||
    profile?.vip === true ||
    profile?.quota?.vip === true ||
    plan === 'vip' ||
    (vipUntil && vipUntil > Date.now()),
  )
}

function isTechnicalBattleChatNickname(value) {
  const raw = str(value).replace(/\s+/g, ' ')
  if (!raw) return true
  const lower = raw.toLowerCase()
  if (/^0x[a-f0-9]{40}$/i.test(raw)) return true
  if (/^wallet:/i.test(raw)) return true
  if (/^(telegram|telegramid|telegram:id|tguid|tg|tma):/i.test(raw)) return true
  if (/^\d{6,}$/.test(raw)) return true
  if (lower === 'anonymous' || lower === 'unknown' || lower === 'guest') return true
  return false
}

function publicAuthorKey(accountId) {
  const id = str(accountId)
  if (!id) return ''
  return BATTLE_CHAT_AUTHOR_KEY_PREFIX + crypto.createHash('sha256').update(id.toLowerCase()).digest('hex').slice(0, 16)
}

function publicIdentityFromProfile(accountId, profile = {}) {
  const id = str(accountId)
  const rawNickname = profile?.nickname || profile?.nick
  const nickname = normalizeNickname(rawNickname)
  const avatar = normalizeAvatar(profile?.icon || profile?.avatar)
  const vipUntil = profileVipUntil(profile)
  const vipActive = profileVipActive(profile)
  if (!nickname || isTechnicalBattleChatNickname(rawNickname)) {
    return {
      kind: 'anonymous',
      key: publicAuthorKey(id),
      accountId: id,
      nickname: '',
      avatar: BATTLE_CHAT_ANONYMOUS_AVATAR_URL,
      vipActive,
      vipUntil,
    }
  }

  return {
    kind: 'profile',
    key: publicAuthorKey(id),
    accountId: id,
    nickname,
    avatar: avatar || BATTLE_CHAT_ANONYMOUS_AVATAR_URL,
    vipActive,
    vipUntil,
  }
}

module.exports = {
  BATTLE_CHAT_ANONYMOUS_AVATAR_URL,
  BATTLE_CHAT_AUTHOR_KEY_PREFIX,
  isTechnicalBattleChatNickname,
  normalizeAvatar,
  normalizeNickname,
  profileVipActive,
  profileVipUntil,
  publicAuthorKey,
  publicIdentityFromProfile,
}
