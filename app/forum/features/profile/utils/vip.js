export function vipFromHint(hint) {
  if (hint === true) return true
  if (hint === false) return false
  if (typeof hint === 'number' && Number.isFinite(hint)) return hint > Date.now()
  if (typeof hint === 'string' && /^\d{10,}$/.test(hint)) {
    const n = Number(hint)
    if (Number.isFinite(n)) return n > Date.now()
  }
  return null
}

export function vipFromProfile(profile) {
  if (!profile || typeof profile !== 'object') return null

  if (
    profile.vipActive === true ||
    profile.isVip === true ||
    profile.vip === true
  ) {
    return true
  }
  if (
    profile.vipActive === false ||
    profile.isVip === false ||
    profile.vip === false
  ) {
    return false
  }

  const until = Number(
    profile.vipUntil ??
      profile.vipExpiresAt ??
      profile.vip_until ??
      profile.vip_exp ??
      0,
  )
  if (Number.isFinite(until) && until > Date.now()) return true

  const lvl = Number(profile.vipLevel ?? profile.vip_level ?? 0)
  if (Number.isFinite(lvl) && lvl > 0) return true

  if (profile.vipIcon || profile.vipEmoji) return true

  return null
}
