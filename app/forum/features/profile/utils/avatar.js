export function emojiToCodepoints(str) {
  if (!str) return ''
  try {
    const cps = Array.from(str).map((ch) => ch.codePointAt(0).toString(16))
    if (!cps.length) return ''
    return cps.join('-').toLowerCase()
  } catch {
    return ''
  }
}

export function normalizeIconId(v) {
  if (!v) return ''
  const s = String(v).trim()
  if (s.startsWith('e:')) return 'e:' + s.slice(2).toLowerCase()
  if (s.startsWith('v:') || s.startsWith('s:')) return s
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/uploads/') || s.startsWith('/vip/') || s.startsWith('/avatars/')) {
    return s
  }
  const asCode = emojiToCodepoints(s)
  return asCode ? `e:${asCode}` : s
}

export function defaultAvatarUrl() {
  return '/upload.jpg'
}

export function resolveIconUrl(iconId, userId = '') {
  if (!iconId) return defaultAvatarUrl(userId)

  if (/^https?:\/\//i.test(iconId)) return iconId
  if (iconId.startsWith('/uploads/')) return iconId
  if (iconId.startsWith('/vip/')) return iconId
  if (iconId.startsWith('/avatars/')) return iconId

  if (iconId.startsWith('v:')) {
    const name = iconId.slice(2)
    return `/vip/${name}.webp`
  }

  if (iconId.startsWith('s:')) {
    return '/upload.jpg'
  }

  if (iconId.startsWith('e:')) {
    const code = iconId.slice(2)
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
  }

  if (iconId.length <= 4) {
    const code = emojiToCodepoints(iconId)
    if (code) {
      return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
    }
  }

  return defaultAvatarUrl(userId)
}
