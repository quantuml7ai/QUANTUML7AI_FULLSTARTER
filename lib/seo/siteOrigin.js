const DEFAULT_SITE_ORIGIN = 'https://www.quantuml7ai.com'

export const SITE_ORIGIN_ENV_KEY = 'NEXT_PUBLIC_SITE_URL'

export function normalizeSiteOrigin(rawValue, fallback = DEFAULT_SITE_ORIGIN) {
  const candidate = String(rawValue || '').trim() || fallback

  let parsed
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error(`${SITE_ORIGIN_ENV_KEY} must be an absolute HTTPS URL.`)
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error(`${SITE_ORIGIN_ENV_KEY} must be an absolute HTTPS URL without credentials.`)
  }

  if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
    throw new Error(`${SITE_ORIGIN_ENV_KEY} must contain only the canonical HTTPS origin.`)
  }

  return parsed.origin
}

export const SITE_ORIGIN = normalizeSiteOrigin(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    DEFAULT_SITE_ORIGIN,
)

export function toAbsoluteSiteUrl(rawUrl) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  return `${SITE_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}
