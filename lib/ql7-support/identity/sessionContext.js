export const QL7_SUPPORT_SESSION_IDENTITY_CONTEXT_VERSION = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function hashId(value = '') {
  let hash = 2166136261
  for (const char of str(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `synthetic-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function buildQl7SupportSessionIdentityContext(seed = {}) {
  const actorSeed = str(seed.actorSeed || seed.userId || seed.walletAddress || 'ql7-support-actor')
  const actorIdMasked = hashId(actorSeed)
  return Object.freeze({
    version: QL7_SUPPORT_SESSION_IDENTITY_CONTEXT_VERSION,
    authenticated: seed.authenticated !== false,
    actorIdMasked,
    accountIdMasked: hashId(`${actorSeed}:account`),
    walletAliasMasked: hashId(`${actorSeed}:wallet`),
    aliasesMasked: Object.freeze([actorIdMasked, hashId(`${actorSeed}:telegram`)]),
    fixtureOnly: true,
    privacySafe: true,
    rawIdsAvailableToAssistant: false,
  })
}

export function assertQl7SupportNoRawIdentityRequest(text = '') {
  const ok = !/(?:send|provide|enter|укаж|пришл|назови).{0,80}(?:wallet|account|user|post|campaign|invoice|order)?\s*(?:id|идентификатор|айди)/iu.test(str(text))
  return Object.freeze({ ok, code: ok ? 'no_raw_identity_request' : 'raw_identity_request' })
}
