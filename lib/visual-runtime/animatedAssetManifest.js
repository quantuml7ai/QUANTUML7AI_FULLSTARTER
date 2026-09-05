const POSTER_ROOT = '/__ql7_visual_posters'
const DEFINITELY_ANIMATED_RE = /(?:\.gif|[-_]animated(?:[-_][^/?#]+)?\.(?:webp|avif|png))(?:$|[?#])/i

export const QL7_ANIMATED_POSTER_ROOT = POSTER_ROOT

export const REQUIRED_BUNDLED_ANIMATED_ASSETS = Object.freeze([
  '/friends/invitation.gif',
  '/game/game.gif',
  '/audio/bgaudio.gif',
  '/click/telegram.gif',
  '/click/authorization.gif',
  '/ai/ai.gif',
  '/click/quest.gif',
])

export function normalizeAnimatedAssetPath(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('/')) {
    try { return new URL(raw, 'http://ql7.local').pathname || raw.split(/[?#]/)[0] } catch { return raw.split(/[?#]/)[0] }
  }
  try { return new URL(raw).pathname || '' } catch { return raw.split(/[?#]/)[0] }
}

export function isDefinitelyAnimatedRasterSource(value = '') {
  return DEFINITELY_ANIMATED_RE.test(normalizeAnimatedAssetPath(value))
}

export function preferredMarginProfileForAnimatedPath(value = '') {
  const pathname = normalizeAnimatedAssetPath(value)
  return /^\/vip\/(?:avatars|emoji)\//i.test(pathname) ? 'near50' : 'near100'
}

export function buildBundledPosterPath(animatedSrc = '') {
  const pathname = normalizeAnimatedAssetPath(animatedSrc)
  if (!pathname || !pathname.startsWith('/')) return ''
  const safe = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/')
  return safe ? `${POSTER_ROOT}/${safe}.webp` : ''
}

export function buildManagedMediaPosterUrl(animatedSrc = '') {
  const raw = String(animatedSrc || '').trim()
  if (!raw) return ''
  try {
    const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://ql7.local')
    if (!/\.(?:gif|webp|avif|png)$/i.test(parsed.pathname || '')) return ''
    parsed.pathname = parsed.pathname.replace(/\.(?:gif|webp|avif|png)$/i, '-poster.webp')
    parsed.search = ''
    parsed.hash = ''
    return raw.startsWith('/') ? parsed.pathname : parsed.toString()
  } catch {
    return raw.replace(/\.(?:gif|webp|avif|png)(?:[?#].*)?$/i, '-poster.webp')
  }
}

export function resolveAnimatedPosterSrc(animatedSrc = '', explicitPoster = '') {
  const explicit = String(explicitPoster || '').trim()
  if (explicit) return explicit
  const raw = String(animatedSrc || '').trim()
  if (!raw) return ''
  const path = normalizeAnimatedAssetPath(raw)
  if (raw.startsWith('/') && path) return buildBundledPosterPath(path)
  return isDefinitelyAnimatedRasterSource(raw) ? buildManagedMediaPosterUrl(raw) : ''
}

export function canonicalizeImageSrc(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try { return new URL(raw, typeof window !== 'undefined' ? window.location.href : 'http://ql7.local/').href } catch { return raw }
}
