export function hasAnyLink(s) {
  const str = String(s || '')
  if (!str) return false

  const md1 = /\[[^\]]+\]\(([^)]+)\)/i
  const md2 = /<\s*([a-z]+:\/\/|www\.)[^>]+>/i
  const proto = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/i
  const www = /\bwww\.[^\s<>"'`]+/i
  const domain = /\b(?:[a-z0-9-]+\.)+(?:xn--[a-z0-9-]+|[a-z]{2,})(?::\d+)?(?:\/[^\s<>"'`]*)?/i
  const shorters = /\b(?:t\.me|telegram\.me|wa\.me|bit\.ly|t\.co|goo\.gl|is\.gd|tinyurl\.com)\/[^\s<>"'`]+/i
  const ipLocal = /\b(?:(?:\d{1,3}\.){3}\d{1,3}|localhost)(?::\d+)?(?:\/[^\s<>"'`]*)?/i
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i

  return (
    md1.test(str) ||
    md2.test(str) ||
    proto.test(str) ||
    www.test(str) ||
    shorters.test(str) ||
    ipLocal.test(str) ||
    domain.test(str) ||
    email.test(str)
  )
}
