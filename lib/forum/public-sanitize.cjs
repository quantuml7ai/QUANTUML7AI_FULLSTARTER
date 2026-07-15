// lib/forum/public-sanitize.cjs
// QL7_GEO111_FINAL_FOUNDATION_V1
// Public API guard for private geo, identity aliases, and fingerprint-like fields.

const PRIVATE_PUBLIC_RESPONSE_KEYS = Object.freeze([
  '_geoCurrent',
  'geoCurrent',
  '_geoOrigin',
  'geoOrigin',
  'geoPrivate',
  'identityPrivate',
  'aliasSet',
  'aliasHash',
  'ipHmac',
  'userAgentHmac',
])

const PRIVATE_KEY_SET = new Set(PRIVATE_PUBLIC_RESPONSE_KEYS)

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isPrivatePublicResponseKey(key) {
  return PRIVATE_KEY_SET.has(String(key || ''))
}

function sanitizePublicForumPayload(input, options = {}) {
  const stripped = []
  const seen = new WeakSet()

  function walk(value, path) {
    if (value == null) return value
    if (value instanceof Date) return value
    if (typeof value !== 'object') return value

    if (seen.has(value)) return null
    seen.add(value)

    if (Array.isArray(value)) {
      return value.map((item, index) => walk(item, path + '[' + index + ']'))
    }

    if (!isPlainObject(value)) return value

    const output = {}
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? path + '.' + key : key
      if (isPrivatePublicResponseKey(key)) {
        stripped.push(childPath)
        continue
      }
      output[key] = walk(child, childPath)
    }
    return output
  }

  const value = walk(input, '$')
  if (options.withReport) {
    return {
      ok: true,
      value,
      stripped,
      strippedCount: stripped.length,
    }
  }
  return value
}

function assertNoPrivatePublicResponseKeys(input) {
  const report = sanitizePublicForumPayload(input, { withReport: true })
  if (report.strippedCount > 0) {
    const error = new Error('Public forum payload contains private fields: ' + report.stripped.join(', '))
    error.code = 'QL7_PUBLIC_FORUM_PRIVATE_FIELD_LEAK'
    error.stripped = report.stripped
    throw error
  }
  return true
}

module.exports = {
  PRIVATE_PUBLIC_RESPONSE_KEYS,
  assertNoPrivatePublicResponseKeys,
  isPrivatePublicResponseKey,
  sanitizePublicForumPayload,
}