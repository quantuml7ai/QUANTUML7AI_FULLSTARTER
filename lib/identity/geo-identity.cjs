// lib/identity/geo-identity.cjs
// QL7_GEO111_GEO_IDENTITY_V1
// Canonical actor identity helpers for private geo writes and future forum index writes.

const crypto = require('node:crypto')
const identityContract = require('./ql7IdentityContract.cjs')

function str(value) {
  return String(value ?? '').trim()
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex')
}

function normalizeWallet(raw) {
  const value = str(raw).replace(/^wallet:/i, '')
  if (!/^0x[a-f0-9]{40}$/i.test(value)) return ''
  return value
}

function normalizeEmail(raw) {
  const value = str(raw).toLowerCase()
  if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return ''
  return value
}

function normalizeProviderAlias(provider, value, extra = {}) {
  const p = str(provider).toLowerCase()
  const v = str(value)
  if (!p || !v) return ''

  if (p === 'wallet' || p === 'evm' || p === 'ethereum') {
    const wallet = normalizeWallet(v)
    return wallet ? 'wallet:' + wallet : ''
  }

  if (p === 'telegram' || p === 'tg' || p === 'tma') {
    const raw = v.replace(/^(telegram:id:|telegramid:|telegram:|tg:uid:|tguid:|tg:)/i, '').trim()
    if (!/^\d+$/.test(raw)) return ''
    return p === 'tma' ? 'tma:' + raw : 'telegram:' + raw
  }

  if (p === 'azure') {
    const tenant = str(extra.tenant || extra.tenantId || 'common').toLowerCase()
    return 'azure:' + tenant + ':' + v
  }

  if (p === 'google') return 'google:' + v
  if (p === 'email') {
    const email = normalizeEmail(v)
    return email ? 'email:' + email : ''
  }

  if (p === 'oauth') {
    const oauthProvider = str(extra.oauthProvider || extra.providerName || extra.name || 'generic').toLowerCase()
    return 'oauth:' + oauthProvider + ':' + v
  }

  return p + ':' + v
}

function collectIdentityCandidates(input = {}) {
  const body = input.body && typeof input.body === 'object' ? input.body : {}
  const headers = input.request?.headers || input.headers || {}
  const candidates = []
  const push = (value) => {
    const clean = str(value)
    if (clean) candidates.push(clean)
  }

  try { push(headers.get?.('x-forum-user-id')) } catch {}
  push(headers['x-forum-user-id'])

  for (const key of ['accountId', 'userId', 'authorId', 'canonicalAccountId', 'wallet', 'walletAddress', 'address', 'telegramId', 'tmaId', 'asherId', 'uid']) {
    push(body[key])
  }

  const wallet = normalizeProviderAlias('wallet', body.walletAddress || body.wallet || body.address)
  push(wallet)
  push(normalizeProviderAlias('telegram', body.telegramId || body.tgId || body.tg_id))
  push(normalizeProviderAlias('tma', body.tmaId || body.tma_id))
  push(normalizeProviderAlias('azure', body.oid || body.objectId || body.sub, { tenant: body.tenant || body.tenantId }))
  push(normalizeProviderAlias('google', body.googleSub || (String(body.provider || '').toLowerCase() === 'google' ? body.sub : '')))
  push(normalizeProviderAlias('email', body.email))
  if (body.provider && body.sub) push(normalizeProviderAlias('oauth', body.sub, { oauthProvider: body.provider }))

  return Array.from(new Set(candidates))
}

function buildIdentitySafeDebug(identity = {}) {
  const raw = str(identity.rawInputId)
  const canonical = str(identity.canonicalAccountId || identity.exactEtalonUid || '')
  return {
    hasRawInput: !!raw,
    rawInputHash: raw ? sha256(raw).slice(0, 16) : '',
    hasCanonicalAccountId: !!canonical,
    canonicalHash: canonical ? sha256(canonical).slice(0, 16) : '',
    mode: str(identity.mode),
    source: str(identity.source),
    conflictWarnings: Array.isArray(identity.conflictWarnings) ? identity.conflictWarnings.length : 0,
  }
}

function assertCanonicalWriteSafe(identity = {}) {
  const canonical = str(identity.canonicalAccountId || identity.exactEtalonUid || identity.rawInputId)
  if (!canonical) {
    const error = new Error('missing_canonical_account_id')
    error.code = 'QL7_GEO_IDENTITY_MISSING_CANONICAL'
    throw error
  }
  if (Array.isArray(identity.conflictWarnings) && identity.conflictWarnings.length) {
    const error = new Error('alias_conflict_blocks_write')
    error.code = 'QL7_GEO_IDENTITY_ALIAS_CONFLICT'
    error.conflictCount = identity.conflictWarnings.length
    throw error
  }
  return canonical
}

async function resolveForumActorIdentity(rawOrInput, options = {}) {
  const candidates = typeof rawOrInput === 'object' && rawOrInput !== null
    ? collectIdentityCandidates(rawOrInput)
    : [str(rawOrInput)].filter(Boolean)
  const primary = candidates[0] || ''
  const identity = await identityContract.resolve(primary, {
    mode: options.mode || 'forum-write',
    source: options.source || 'lib/identity/geo-identity.cjs:resolveForumActorIdentity',
  })
  const canonicalAccountId = assertCanonicalWriteSafe(identity)
  return {
    ...identity,
    canonicalAccountId,
    aliasCandidates: candidates,
    safeDebug: buildIdentitySafeDebug(identity),
  }
}

async function resolveGeoActorIdentity(input = {}, options = {}) {
  return resolveForumActorIdentity(input, {
    mode: options.mode || 'geo-session-touch',
    source: options.source || 'lib/identity/geo-identity.cjs:resolveGeoActorIdentity',
  })
}

module.exports = {
  assertCanonicalWriteSafe,
  buildIdentitySafeDebug,
  collectIdentityCandidates,
  normalizeProviderAlias,
  resolveForumActorIdentity,
  resolveGeoActorIdentity,
}
