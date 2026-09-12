import crypto from 'node:crypto'

export const QL7_SUPPORT_CHOICE_CONTRACT_VERSION = 12
export const QL7_SUPPORT_CHOICE_SCHEMA_VERSION = '5.1.0'
export const QL7_SUPPORT_CHOICE_TTL_MS = 30 * 60 * 1000

function str(value) { return String(value ?? '').trim() }
function lower(value) { return str(value).toLowerCase() }
function sha(value) { return crypto.createHash('sha256').update(String(value ?? '')).digest('hex') }
function b64url(value) { return Buffer.from(value).toString('base64url') }
function fromB64url(value) { return Buffer.from(str(value), 'base64url').toString('utf8') }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function nowMs(value = Date.now()) { const parsed = Number(value instanceof Date ? value.getTime() : value); return Number.isFinite(parsed) ? parsed : Date.now() }

function canonicalPayload(payload = {}) {
  return JSON.stringify({
    v: Number(payload.v || QL7_SUPPORT_CHOICE_CONTRACT_VERSION),
    choiceSetId: str(payload.choiceSetId),
    deliveryBindingId: str(payload.deliveryBindingId),
    scopeReceiptHash: str(payload.scopeReceiptHash),
    conversationIdHash: str(payload.conversationIdHash),
    locale: str(payload.locale),
    keyId: str(payload.keyId),
    ownerCaseId: str(payload.ownerCaseId),
    targetCaseId: str(payload.targetCaseId),
    optionId: str(payload.optionId),
    topic: str(payload.topic),
    subIntent: str(payload.subIntent),
    kind: str(payload.kind || 'option'),
    userHash: str(payload.userHash),
    issuedAt: Number(payload.issuedAt || 0),
    expiresAt: Number(payload.expiresAt || 0),
    nonce: str(payload.nonce),
  })
}

async function resolveChoiceKey(secretOverride = '') {
  const direct = str(secretOverride || process.env.QL7_SUPPORT_CHOICE_SECRET)
  if (direct.length >= 32) return crypto.createHash('sha256').update(`ql7-support-choice:${direct}`).digest()
  const { default: serverSecret } = await import('../security/ql7-server-secret.cjs')
  let derived
  try {
    derived = await serverSecret.deriveForumRuntimeSecret('ql7-support-choice:canonical')
  } catch (error) {
    if (error?.code !== 'QL7_FORUM_RUNTIME_SECRET_NOT_SEEDED') throw error
    await serverSecret.ensureForumRuntimeSecret()
    derived = await serverSecret.deriveForumRuntimeSecret('ql7-support-choice:canonical')
  }
  if (!derived?.key) throw new Error('ql7_support_choice_secret_unavailable')
  return Buffer.from(derived.key)
}

async function signPayload(payload, secretOverride = '') {
  const key = await resolveChoiceKey(secretOverride)
  const body = b64url(canonicalPayload(payload))
  const signature = crypto.createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${signature}`
}

async function decodeAndVerifyToken(token = '', secretOverride = '') {
  const raw = str(token)
  const parts = raw.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, error: 'choice_token_shape' }
  const key = await resolveChoiceKey(secretOverride)
  const expected = crypto.createHmac('sha256', key).update(parts[0]).digest()
  let received
  try { received = Buffer.from(parts[1], 'base64url') } catch { return { ok: false, error: 'choice_token_signature' } }
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return { ok: false, error: 'choice_token_signature' }
  let payload
  try { payload = JSON.parse(fromB64url(parts[0])) } catch { return { ok: false, error: 'choice_token_payload' } }
  if (Number(payload?.v) !== QL7_SUPPORT_CHOICE_CONTRACT_VERSION) return { ok: false, error: 'choice_token_version' }
  return { ok: true, payload }
}

function safeSemantic(option = {}, fallbackCaseId = '') {
  const semantic = option?.semantic && typeof option.semantic === 'object' ? option.semantic : {}
  return {
    topic: str(semantic.topic).slice(0, 80),
    subIntent: str(semantic.subIntent).slice(0, 120),
    targetCaseId: str(semantic.caseId || fallbackCaseId).slice(0, 160),
  }
}

function choiceStateProjection(row = {}) {
  return {
    optionId: str(row.optionId),
    topic: str(row.topic),
    subIntent: str(row.subIntent),
    targetCaseId: str(row.targetCaseId),
    kind: str(row.kind),
    tokenHash: str(row.tokenHash),
    deliveryBindingId: str(row.deliveryBindingId),
    scopeReceiptHash: str(row.scopeReceiptHash),
    conversationIdHash: str(row.conversationIdHash),
    locale: str(row.locale),
    keyId: str(row.keyId),
  }
}

export async function attachQl7SupportSignedChoices({
  card = null,
  database = null,
  userId = '',
  ownerCaseId = '',
  issuedAt = Date.now(),
  ttlMs = QL7_SUPPORT_CHOICE_TTL_MS,
  secret = '',
  deliveryBindingId = '',
  scopeReceiptHash = '',
  conversationId = '',
  locale = 'en',
  keyId = '',
} = {}) {
  const uid = str(userId)
  const owner = str(ownerCaseId || card?.caseId)
  const options = (Array.isArray(card?.options) ? card.options : []).filter((option) => str(option?.id)).slice(0, 4)
  const other = card?.other && typeof card.other === 'object' && str(card.other.id) ? card.other : null
  const deliveryBinding = str(deliveryBindingId)
  const scopeHash = str(scopeReceiptHash)
  const conversation = str(conversationId)
  const conversationHash = conversation ? sha(conversation) : ''
  const signingKeyId = str(keyId || `choice-key:${sha(secret).slice(0, 16)}`)
  if (!card || (!options.length && !other)) return { card: clone(card), pendingChoice: null, signed: false }
  if (!uid || !owner || !deliveryBinding || !scopeHash || !conversationHash || !str(locale) || !signingKeyId) {
    const error = new Error('ql7_support_choice_binding_context_required')
    error.code = 'ql7_support_choice_binding_context_required'
    error.status = 503
    throw error
  }

  const issued = nowMs(issuedAt)
  const expires = issued + Math.max(60_000, Math.min(24 * 60 * 60 * 1000, Number(ttlMs) || QL7_SUPPORT_CHOICE_TTL_MS))
  const choiceSetId = `choice:${sha(`${uid}:${owner}:${conversationHash}:${deliveryBinding}:${scopeHash}:${issued}`).slice(0, 32)}`
  const userHash = sha(lower(uid))
  const rows = []

  const signOption = async (option, kind = 'option') => {
    const semantic = safeSemantic(option, owner)
    const payload = {
      v: QL7_SUPPORT_CHOICE_CONTRACT_VERSION,
      choiceSetId,
      deliveryBindingId: deliveryBinding,
      scopeReceiptHash: scopeHash,
      conversationIdHash: conversationHash,
      locale: str(locale).toLowerCase().split(/[-_]/u)[0],
      keyId: signingKeyId,
      ownerCaseId: owner,
      targetCaseId: semantic.targetCaseId || owner,
      optionId: str(option.id).slice(0, 160),
      topic: kind === 'other' ? '' : semantic.topic,
      subIntent: kind === 'other' ? 'other' : semantic.subIntent,
      kind,
      userHash,
      issuedAt: issued,
      expiresAt: expires,
      nonce: sha(`${choiceSetId}:${str(option.id)}:${kind}:${deliveryBinding}`).slice(0, 32),
    }
    const signedToken = await signPayload(payload, secret)
    rows.push({ ...payload, tokenHash: sha(signedToken) })
    return {
      ...clone(option),
      choiceSetId,
      issuedAt: new Date(issued).toISOString(),
      expiresAt: new Date(expires).toISOString(),
      signedToken,
      semantic: {
        ...(clone(option?.semantic) || {}),
        topic: payload.topic,
        subIntent: payload.subIntent,
        caseId: payload.targetCaseId,
      },
    }
  }

  const signedOptions = []
  for (const option of options) signedOptions.push(await signOption(option, 'option'))
  const signedOther = other ? await signOption(other, 'other') : null
  const unsigned = clone(card) || {}
  delete unsigned.integrity
  unsigned.choiceSetId = choiceSetId
  unsigned.choiceContractVersion = QL7_SUPPORT_CHOICE_CONTRACT_VERSION
  unsigned.options = signedOptions
  unsigned.other = signedOther
  unsigned.expiresAt = new Date(expires).toISOString()

  const pendingChoice = {
    version: QL7_SUPPORT_CHOICE_CONTRACT_VERSION,
    schemaVersion: QL7_SUPPORT_CHOICE_SCHEMA_VERSION,
    choiceSetId,
    ownerCaseId: owner,
    userHash,
    deliveryBindingId: deliveryBinding,
    scopeReceiptHash: scopeHash,
    conversationIdHash: conversationHash,
    locale: str(locale).toLowerCase().split(/[-_]/u)[0],
    keyId: signingKeyId,
    issuedAt: new Date(issued).toISOString(),
    expiresAt: new Date(expires).toISOString(),
    options: rows.map(choiceStateProjection),
    consumedAt: null,
    selectedOptionId: '',
    selectedTargetCaseId: '',
  }

  if (database?.collection) {
    await database.collection('ql7_support_cases').updateOne(
      { _id: owner, userId: uid },
      { $set: { pendingChoice: pendingChoice, nextState: 'waiting_choice', updatedAt: new Date().toISOString() } },
    )
  }
  return { card: unsigned, pendingChoice, signed: true }
}

export async function verifyQl7SupportChoiceToken({
  token = '',
  userId = '',
  secret = '',
  now = Date.now(),
  expected = {},
} = {}) {
  const verified = await decodeAndVerifyToken(token, secret)
  if (!verified.ok) return verified
  const payload = verified.payload
  if (str(payload.userHash) !== sha(lower(userId))) return { ok: false, error: 'choice_wrong_user' }
  const current = nowMs(now)
  if (!Number.isFinite(Number(payload.issuedAt)) || !Number.isFinite(Number(payload.expiresAt))) return { ok: false, error: 'choice_time_invalid' }
  if (current > Number(payload.expiresAt)) return { ok: false, error: 'choice_expired' }
  if (Number(payload.issuedAt) > current + 60_000) return { ok: false, error: 'choice_issued_in_future' }
  if (!str(payload.choiceSetId) || !str(payload.ownerCaseId) || !str(payload.optionId) ||
    !str(payload.deliveryBindingId) || !str(payload.scopeReceiptHash) ||
    !str(payload.conversationIdHash) || !str(payload.locale) || !str(payload.nonce) || !str(payload.keyId)) {
    return { ok: false, error: 'choice_payload_incomplete' }
  }
  const expectedChecks = [
    ['deliveryBindingId', expected.deliveryBindingId, 'choice_delivery_binding_mismatch'],
    ['scopeReceiptHash', expected.scopeReceiptHash, 'choice_scope_receipt_mismatch'],
    ['conversationIdHash', expected.conversationId ? sha(str(expected.conversationId)) : expected.conversationIdHash, 'choice_conversation_mismatch'],
    ['locale', expected.locale ? str(expected.locale).toLowerCase().split(/[-_]/u)[0] : '', 'choice_locale_mismatch'],
  ]
  for (const [field, value, error] of expectedChecks) {
    if (str(value) && str(payload[field]) !== str(value)) return { ok: false, error }
  }
  return { ok: true, payload: Object.freeze({ ...payload }) }
}

export async function consumeQl7SupportChoice({
  database = null,
  userId = '',
  supportChoice = null,
  secret = '',
  now = Date.now(),
} = {}) {
  if (!supportChoice || typeof supportChoice !== 'object' || !str(supportChoice.signedToken)) return { ok: true, selected: false, choice: null }
  if (!database?.collection) return { ok: false, error: 'choice_database_unavailable' }
  const verified = await verifyQl7SupportChoiceToken({ token: supportChoice.signedToken, userId, secret, now })
  if (!verified.ok) return verified
  const payload = verified.payload
  const ownerCase = await database.collection('ql7_support_cases').findOne({ _id: payload.ownerCaseId, userId: str(userId) })
  if (!ownerCase) return { ok: false, error: 'choice_case_not_found' }
  const pending = ownerCase?.pendingChoice
  if (!pending || str(pending.choiceSetId) !== str(payload.choiceSetId)) return { ok: false, error: 'choice_set_not_active' }
  if (str(pending.deliveryBindingId) !== str(payload.deliveryBindingId) ||
    str(pending.scopeReceiptHash) !== str(payload.scopeReceiptHash) ||
    str(pending.conversationIdHash) !== str(payload.conversationIdHash) ||
    str(pending.locale) !== str(payload.locale) ||
    str(pending.keyId) !== str(payload.keyId)) return { ok: false, error: 'choice_delivery_context_mismatch' }
  if (new Date(str(pending.expiresAt)).getTime() < nowMs(now)) return { ok: false, error: 'choice_expired' }
  const option = (Array.isArray(pending.options) ? pending.options : []).find((item) => str(item.optionId) === str(payload.optionId))
  if (!option) return { ok: false, error: 'choice_option_not_allowed' }
  if (str(option.tokenHash) !== sha(str(supportChoice.signedToken))) return { ok: false, error: 'choice_token_not_registered' }
  if (str(option.topic) !== str(payload.topic) || str(option.subIntent) !== str(payload.subIntent) || str(option.targetCaseId) !== str(payload.targetCaseId) || str(option.kind) !== str(payload.kind)) {
    return { ok: false, error: 'choice_semantic_mismatch' }
  }
  const nowIso = new Date(nowMs(now)).toISOString()
  if (pending.consumedAt) {
    if (str(pending.selectedOptionId) !== str(payload.optionId)) return { ok: false, error: 'choice_already_consumed' }
    return {
      ok: true,
      selected: true,
      duplicate: true,
      choice: Object.freeze({ ...payload, isOther: payload.kind === 'other' }),
    }
  }
  const updated = await database.collection('ql7_support_cases').updateOne(
    { _id: payload.ownerCaseId, userId: str(userId), 'pendingChoice.choiceSetId': payload.choiceSetId, 'pendingChoice.consumedAt': null },
    { $set: {
      'pendingChoice.consumedAt': nowIso,
      'pendingChoice.selectedOptionId': payload.optionId,
      'pendingChoice.selectedTargetCaseId': payload.targetCaseId,
      nextState: 'choice_selected',
      lastChoice: {
        choiceSetId: payload.choiceSetId,
        optionId: payload.optionId,
        topic: payload.topic,
        subIntent: payload.subIntent,
        targetCaseId: payload.targetCaseId,
        kind: payload.kind,
        selectedAt: nowIso,
      },
      updatedAt: nowIso,
    } },
  )
  if (Number(updated?.matchedCount || 0) !== 1) {
    const reread = await database.collection('ql7_support_cases').findOne({ _id: payload.ownerCaseId, userId: str(userId) })
    if (str(reread?.pendingChoice?.selectedOptionId) !== str(payload.optionId)) return { ok: false, error: 'choice_consume_race' }
  }
  return {
    ok: true,
    selected: true,
    duplicate: false,
    choice: Object.freeze({ ...payload, isOther: payload.kind === 'other' }),
  }
}

export function hasQl7SupportChoiceSelectionAttempt(value = {}) {
  if (!value || typeof value !== 'object') return false
  return [
    value.cardIntegrity,
    value.optionId,
    value.topic,
    value.subIntent,
    value.caseId,
    value.signedToken,
  ].some((entry) => Boolean(str(entry)))
}

export function sanitizeQl7SupportChoiceTransport(value = {}) {
  if (!value || typeof value !== 'object') return null
  const signedToken = str(value.signedToken).slice(0, 4096)
  return Object.freeze({
    cardIntegrity: str(value.cardIntegrity).slice(0, 160),
    optionId: str(value.optionId).slice(0, 160),
    topic: str(value.topic).slice(0, 80),
    subIntent: str(value.subIntent).slice(0, 120),
    caseId: str(value.caseId).slice(0, 160),
    signedToken,
  })
}
