const crypto = require('node:crypto')
const { deriveForumRuntimeSecret } = require('../security/ql7-server-secret.cjs')

const RECEIPT_DOMAIN = 'forum-video-precommit-moderation-v1'
const RECEIPT_VERSION = 1
const MODERATION_TTL_MS = 10 * 60 * 1000
const UPLOAD_TTL_MS = 12 * 60 * 1000
const APPROVAL_TTL_MS = 20 * 60 * 1000
const MAX_TOKEN_LENGTH = 8192
const MAX_OBJECT_KEY_LENGTH = 1024
const SURFACES = new Set(['forum', 'dm', 'ads'])

function str(value) { return String(value ?? '').trim() }
function normalizeSurface(value) {
  const surface = str(value).toLowerCase()
  if (!SURFACES.has(surface)) throw codeError('VIDEO_MODERATION_SURFACE_INVALID')
  return surface
}
function normalizeSha256(value) {
  const sha256 = str(value).toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw codeError('VIDEO_MODERATION_SHA256_INVALID')
  return sha256
}
function normalizeSize(value) {
  const size = Number(value)
  if (!Number.isSafeInteger(size) || size <= 0) throw codeError('VIDEO_MODERATION_SIZE_INVALID')
  return size
}
function normalizeMime(value) {
  const mime = str(value).split(';')[0].toLowerCase()
  if (mime !== 'video/mp4') throw codeError('VIDEO_MODERATION_MIME_INVALID')
  return mime
}
function normalizeObjectKey(value) {
  const key = str(value).replace(/^\/+/, '')
  if (!key || key.length > MAX_OBJECT_KEY_LENGTH || /[\0\r\n]/.test(key) || key.split('/').some((part) => part === '..')) {
    throw codeError('VIDEO_MODERATION_OBJECT_KEY_INVALID')
  }
  return key
}
function codeError(code) {
  const error = new Error(code)
  error.code = code
  return error
}
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map((item) => stableStringify(item)).join(',') + ']'
  const keys = Object.keys(value).sort()
  return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}'
}
function safeEqual(left, right) {
  const a = Buffer.isBuffer(left) ? left : Buffer.from(left)
  const b = Buffer.isBuffer(right) ? right : Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
async function signingKey() {
  const { key } = await deriveForumRuntimeSecret(RECEIPT_DOMAIN)
  return key
}
async function encode(kind, payload, ttlMs, nowMs = Date.now()) {
  const envelope = { v: RECEIPT_VERSION, k: kind, iat: nowMs, exp: nowMs + ttlMs, p: payload }
  const canonical = stableStringify(envelope)
  const sig = crypto.createHmac('sha256', await signingKey()).update(canonical).digest('base64url')
  return Buffer.from(canonical).toString('base64url') + '.' + sig
}
async function decode(token, expectedKind, nowMs = Date.now()) {
  const raw = str(token)
  if (!raw || raw.length > MAX_TOKEN_LENGTH) throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  const parts = raw.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  let envelope
  let canonical
  try {
    canonical = Buffer.from(parts[0], 'base64url').toString('utf8')
    envelope = JSON.parse(canonical)
  } catch {
    throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  }
  if (!envelope || envelope.v !== RECEIPT_VERSION || envelope.k !== expectedKind) throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  if (canonical !== stableStringify(envelope)) throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  const issuedAt = Number(envelope.iat || 0)
  const expiresAt = Number(envelope.exp || 0)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt <= 0 || expiresAt <= issuedAt) throw codeError('VIDEO_MODERATION_TOKEN_INVALID')
  if (issuedAt > nowMs + 60_000) throw codeError('VIDEO_MODERATION_TOKEN_FUTURE')
  if (expiresAt < nowMs) throw codeError('VIDEO_MODERATION_TOKEN_EXPIRED')
  const expected = crypto.createHmac('sha256', await signingKey()).update(canonical).digest()
  let received
  try { received = Buffer.from(parts[1], 'base64url') } catch { throw codeError('VIDEO_MODERATION_TOKEN_INVALID') }
  if (!safeEqual(expected, received)) throw codeError('VIDEO_MODERATION_TOKEN_SIGNATURE')
  return envelope.p || {}
}
function assertActor(actual, expected) {
  if (!str(actual) || str(actual) !== str(expected)) throw codeError('VIDEO_MODERATION_ACTOR_MISMATCH')
}

async function issueVideoModerationReceipt({ actorId, surface, sha256, size, mime = 'video/mp4' } = {}) {
  const payload = {
    actorId: str(actorId),
    surface: normalizeSurface(surface),
    sha256: normalizeSha256(sha256),
    size: normalizeSize(size),
    mime: normalizeMime(mime),
  }
  if (!payload.actorId) throw codeError('VIDEO_MODERATION_ACTOR_REQUIRED')
  return encode('moderated', payload, MODERATION_TTL_MS)
}

async function verifyVideoModerationReceipt(token, expected = {}) {
  const payload = await decode(token, 'moderated')
  assertActor(payload.actorId, expected.actorId)
  if (normalizeSurface(payload.surface) !== normalizeSurface(expected.surface)) throw codeError('VIDEO_MODERATION_SURFACE_MISMATCH')
  if (normalizeSha256(payload.sha256) !== normalizeSha256(expected.sha256)) throw codeError('VIDEO_MODERATION_SHA256_MISMATCH')
  if (normalizeSize(payload.size) !== normalizeSize(expected.size)) throw codeError('VIDEO_MODERATION_SIZE_MISMATCH')
  if (normalizeMime(payload.mime) !== normalizeMime(expected.mime || 'video/mp4')) throw codeError('VIDEO_MODERATION_MIME_MISMATCH')
  return payload
}

async function issueVideoUploadToken({ actorId, surface, stagingKey, finalKey, sha256, size, mime = 'video/mp4' } = {}) {
  const payload = {
    actorId: str(actorId),
    surface: normalizeSurface(surface),
    stagingKey: normalizeObjectKey(stagingKey),
    finalKey: normalizeObjectKey(finalKey),
    sha256: normalizeSha256(sha256),
    size: normalizeSize(size),
    mime: normalizeMime(mime),
  }
  if (!payload.actorId) throw codeError('VIDEO_MODERATION_ACTOR_REQUIRED')
  if (payload.stagingKey === payload.finalKey) throw codeError('VIDEO_MODERATION_OBJECT_KEY_COLLISION')
  return encode('signed-upload', payload, UPLOAD_TTL_MS)
}

async function verifyVideoUploadToken(token, expected = {}) {
  const payload = await decode(token, 'signed-upload')
  assertActor(payload.actorId, expected.actorId)
  normalizeSurface(payload.surface)
  normalizeObjectKey(payload.stagingKey)
  normalizeObjectKey(payload.finalKey)
  normalizeSha256(payload.sha256)
  normalizeSize(payload.size)
  normalizeMime(payload.mime)
  if (payload.stagingKey === payload.finalKey) throw codeError('VIDEO_MODERATION_OBJECT_KEY_COLLISION')
  return payload
}

async function issueVideoApprovalToken({ actorId, surface, mediaUrl, sha256, size } = {}) {
  const payload = {
    actorId: str(actorId),
    surface: normalizeSurface(surface),
    mediaUrl: str(mediaUrl),
    sha256: normalizeSha256(sha256),
    size: normalizeSize(size),
  }
  if (!payload.actorId) throw codeError('VIDEO_MODERATION_ACTOR_REQUIRED')
  if (!/^https?:\/\//i.test(payload.mediaUrl)) throw codeError('VIDEO_MODERATION_MEDIA_URL_INVALID')
  return encode('approved-url', payload, APPROVAL_TTL_MS)
}

async function verifyVideoApprovalToken(token, expected = {}) {
  const payload = await decode(token, 'approved-url')
  assertActor(payload.actorId, expected.actorId)
  if (normalizeSurface(payload.surface) !== normalizeSurface(expected.surface)) throw codeError('VIDEO_MODERATION_SURFACE_MISMATCH')
  if (str(payload.mediaUrl) !== str(expected.mediaUrl)) throw codeError('VIDEO_MODERATION_MEDIA_URL_MISMATCH')
  return payload
}

module.exports = {
  APPROVAL_TTL_MS,
  UPLOAD_TTL_MS,
  MODERATION_TTL_MS,
  RECEIPT_DOMAIN,
  issueVideoApprovalToken,
  issueVideoUploadToken,
  issueVideoModerationReceipt,
  verifyVideoApprovalToken,
  verifyVideoUploadToken,
  verifyVideoModerationReceipt,
}
