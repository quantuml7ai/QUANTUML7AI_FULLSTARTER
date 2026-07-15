// lib/forum/signed-cursor.cjs
// QL7_GEO111_FINAL_FOUNDATION_V1
// HMAC signed cursor envelope for server-paginated forum surfaces.

const crypto = require('node:crypto')

const {
  deriveForumRuntimeSecret,
} = require('../security/ql7-server-secret.cjs')

const CURSOR_VERSION = 1
const MAX_CURSOR_LENGTH = 8192
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

const FORUM_CURSOR_DOMAINS = Object.freeze([
  'forum-feed-v1',
  'forum-search-v1',
  'forum-thread-v1',
  'forum-inbox-v1',
  'forum-user-posts-v1',
  'forum-user-topics-v1',
  'forum-topics-v1',
  'forum-media-feed-v1',
])

const DOMAIN_SET = new Set(FORUM_CURSOR_DOMAINS)

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(String(value), 'base64url').toString('utf8')
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map((item) => stableStringify(item)).join(',') + ']'

  const keys = Object.keys(value).sort()
  return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}'
}

function verifyCursorDomain(domain) {
  const normalized = String(domain || '').trim()
  if (!DOMAIN_SET.has(normalized)) {
    const error = new Error('Unsupported forum cursor domain: ' + normalized)
    error.code = 'QL7_FORUM_CURSOR_DOMAIN_INVALID'
    error.domain = normalized
    throw error
  }
  return normalized
}

function verifyCursorTtl(envelope, options = {}) {
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now()
  const issuedAt = Number(envelope && envelope.iat)
  const expiresAt = envelope && envelope.exp == null ? null : Number(envelope && envelope.exp)

  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    const error = new Error('Forum cursor has invalid issued-at timestamp')
    error.code = 'QL7_FORUM_CURSOR_IAT_INVALID'
    throw error
  }

  if (issuedAt > nowMs + MAX_CLOCK_SKEW_MS) {
    const error = new Error('Forum cursor was issued in the future')
    error.code = 'QL7_FORUM_CURSOR_FUTURE_IAT'
    throw error
  }

  if (expiresAt != null && Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt < nowMs) {
    const error = new Error('Forum cursor expired')
    error.code = 'QL7_FORUM_CURSOR_EXPIRED'
    throw error
  }

  if (options.maxAgeMs != null) {
    const maxAgeMs = Number(options.maxAgeMs)
    if (Number.isFinite(maxAgeMs) && maxAgeMs > 0 && issuedAt + maxAgeMs < nowMs) {
      const error = new Error('Forum cursor exceeded max age')
      error.code = 'QL7_FORUM_CURSOR_MAX_AGE_EXCEEDED'
      throw error
    }
  }

  return true
}

function makeSignature(key, canonicalEnvelope) {
  return crypto.createHmac('sha256', key).update(canonicalEnvelope).digest()
}

function safeEqual(a, b) {
  const left = Buffer.isBuffer(a) ? a : Buffer.from(String(a))
  const right = Buffer.isBuffer(b) ? b : Buffer.from(String(b))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

async function encodeSignedCursor(domain, payload = {}, options = {}) {
  const cursorDomain = verifyCursorDomain(domain)
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now()
  const ttlMs = Number(options.ttlMs || 0)
  const envelope = {
    v: CURSOR_VERSION,
    d: cursorDomain,
    iat: nowMs,
    exp: Number.isFinite(ttlMs) && ttlMs > 0 ? nowMs + ttlMs : null,
    p: payload && typeof payload === 'object' ? payload : {},
  }
  const canonical = stableStringify(envelope)
  const { key } = await deriveForumRuntimeSecret(cursorDomain)
  const signature = makeSignature(key, canonical)

  return base64UrlEncode(canonical) + '.' + signature.toString('base64url')
}

async function decodeSignedCursor(domain, token, options = {}) {
  const cursorDomain = verifyCursorDomain(domain)
  const rawToken = String(token || '').trim()

  if (!rawToken) return null
  if (rawToken.length > MAX_CURSOR_LENGTH) {
    const error = new Error('Forum cursor is too large')
    error.code = 'QL7_FORUM_CURSOR_TOO_LARGE'
    throw error
  }

  const parts = rawToken.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    const error = new Error('Forum cursor format is invalid')
    error.code = 'QL7_FORUM_CURSOR_FORMAT_INVALID'
    throw error
  }

  let envelope
  let canonical
  try {
    canonical = base64UrlDecode(parts[0])
    envelope = JSON.parse(canonical)
  } catch (error) {
    const wrapped = new Error('Forum cursor payload is invalid')
    wrapped.code = 'QL7_FORUM_CURSOR_PAYLOAD_INVALID'
    wrapped.cause = error
    throw wrapped
  }

  if (!envelope || envelope.v !== CURSOR_VERSION || envelope.d !== cursorDomain) {
    const error = new Error('Forum cursor envelope does not match the requested domain')
    error.code = 'QL7_FORUM_CURSOR_DOMAIN_MISMATCH'
    throw error
  }

  const recanonical = stableStringify(envelope)
  if (canonical !== recanonical) {
    const error = new Error('Forum cursor canonical payload mismatch')
    error.code = 'QL7_FORUM_CURSOR_CANONICAL_MISMATCH'
    throw error
  }

  const { key } = await deriveForumRuntimeSecret(cursorDomain)
  const expected = makeSignature(key, canonical)
  const received = Buffer.from(parts[1], 'base64url')
  if (!safeEqual(expected, received)) {
    const error = new Error('Forum cursor signature is invalid')
    error.code = 'QL7_FORUM_CURSOR_SIGNATURE_INVALID'
    throw error
  }

  verifyCursorTtl(envelope, options)
  return envelope.p || {}
}

function stripCursorDebug(value) {
  if (!value || typeof value !== 'object') return value
  const clone = Array.isArray(value) ? value.slice() : { ...value }
  delete clone.secret
  delete clone.secretHash
  delete clone.signature
  delete clone.hmac
  delete clone.debugSecret
  delete clone.rawCursor
  return clone
}

module.exports = {
  CURSOR_VERSION,
  FORUM_CURSOR_DOMAINS,
  decodeSignedCursor,
  encodeSignedCursor,
  stableStringify,
  stripCursorDebug,
  verifyCursorDomain,
  verifyCursorTtl,
}
