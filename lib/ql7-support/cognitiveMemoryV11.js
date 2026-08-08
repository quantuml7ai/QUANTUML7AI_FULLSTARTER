import crypto from 'node:crypto'
import { countQl7SupportGraphemesV11 } from './limitsV11.js'

export const QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11 = 'dm_messages'
export const QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11 = Object.freeze({
  turns: 'ql7_support_turn_decisions_v11',
  outcomes: 'ql7_support_dialogue_outcomes_v11',
  actions: 'ql7_support_action_outcomes_v11',
  translations: 'ql7_support_translation_outcomes_v11',
  quality: 'ql7_support_response_quality_v11',
  personality: 'ql7_support_personality_state_v11',
  adaptation: 'ql7_support_user_adaptation_v11',
  calibrations: 'ql7_support_calibration_snapshots_v11',
  simulationRuns: 'ql7_support_simulation_runs_v11',
  simulationFailures: 'ql7_support_simulation_failures_v11',
})

const INDEX_KEY = '__ql7SupportCognitiveIndexesV11_0_3'
const SECRET_KEY_PATTERN = /(?:authorization|cookie|token|secret|password|private|seed|mnemonic|session|credential|api[_-]?key)/iu
const SECRET_VALUE_PATTERN = /\b(?:Bearer\s+|ql7ws_)[A-Za-z0-9._~+/=-]{8,}|\b(?:0x)?[a-f0-9]{64}\b|\b(?:seed phrase|mnemonic|private key)\b/giu

function str(value) { return String(value ?? '').trim() }
function sha(value) { return crypto.createHash('sha256').update(String(value ?? '')).digest('hex') }
function userHash(value) { return sha(str(value).toLowerCase()) }
function safeArray(value, max = 40) { return (Array.isArray(value) ? value : []).slice(0, max) }
function cleanText(value, max = 360) {
  return str(value)
    .replace(SECRET_VALUE_PATTERN, '[redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu, '[email-redacted]')
    .replace(/\+?\d[\d\s()\-]{8,}\d/gu, '[phone-redacted]')
    .slice(0, max)
}
function cleanObject(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return null
  if (typeof value === 'string') return cleanText(value, 500)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => cleanObject(item, depth + 1))
  if (typeof value !== 'object') return cleanText(value, 200)
  const out = {}
  for (const [key, item] of Object.entries(value).slice(0, 60)) {
    if (SECRET_KEY_PATTERN.test(key)) continue
    out[key] = cleanObject(item, depth + 1)
  }
  return out
}
function iso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString()
}

export async function ensureQl7SupportCognitiveIndexesV11(database) {
  if (!database?.collection) return { ok: false, reason: 'database_unavailable' }
  if (!globalThis[INDEX_KEY]) {
    const c = QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11
    globalThis[INDEX_KEY] = Promise.all([
      database.collection(c.turns).createIndex({ turnId: 1 }, { unique: true }),
      database.collection(c.turns).createIndex({ canonicalMessageId: 1 }, { unique: true, sparse: true }),
      database.collection(c.turns).createIndex({ userIdHash: 1, createdAt: -1 }),
      database.collection(c.turns).createIndex({ topic: 1, subIntent: 1, locale: 1, createdAt: -1 }),
      database.collection(c.outcomes).createIndex({ turnId: 1, outcomeType: 1 }, { unique: true }),
      database.collection(c.outcomes).createIndex({ userIdHash: 1, updatedAt: -1 }),
      database.collection(c.actions).createIndex({ userIdHash: 1, actionId: 1, createdAt: -1 }),
      database.collection(c.actions).createIndex({ turnId: 1, actionId: 1, outcomeType: 1 }, { unique: true }),
      database.collection(c.translations).createIndex({ userIdHash: 1, turnId: 1 }, { unique: true, sparse: true }),
      database.collection(c.translations).createIndex({ locale: 1, status: 1, createdAt: -1 }),
      database.collection(c.quality).createIndex({ userIdHash: 1, turnId: 1 }, { unique: true, sparse: true }),
      database.collection(c.quality).createIndex({ modelVersion: 1, calibrationVersion: 1, createdAt: -1 }),
      database.collection(c.personality).createIndex({ userIdHash: 1 }, { unique: true }),
      database.collection(c.adaptation).createIndex({ userIdHash: 1 }, { unique: true }),
      database.collection(c.calibrations).createIndex({ version: 1 }, { unique: true }),
      database.collection(c.simulationRuns).createIndex({ runId: 1 }, { unique: true }),
      database.collection(c.simulationRuns).createIndex({ createdAt: -1 }),
      database.collection(c.simulationFailures).createIndex({ runId: 1, failureId: 1 }, { unique: true }),
      database.collection(c.simulationFailures).createIndex({ runId: 1, clusterKey: 1, createdAt: -1 }),
    ]).catch((error) => { delete globalThis[INDEX_KEY]; throw error })
  }
  await globalThis[INDEX_KEY]
  return { ok: true }
}

export async function readQl7SupportLearningOptOutV11(database, userId = '') {
  if (!database?.collection || !str(userId)) return false
  const uid = str(userId)
  const uidHash = userHash(uid)
  const [preference, legacyProfile, adaptation] = await Promise.all([
    database.collection('ql7_support_user_preferences').findOne({ $or: [{ userId: uid }, { userIdHash: uidHash }, { _id: uid }] }).catch(() => null),
    database.collection('ql7_support_communication_profiles_v8').findOne({ _id: uid }).catch(() => null),
    database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.adaptation).findOne({ userIdHash: uidHash }).catch(() => null),
  ])
  return preference?.learningOptOut === true || preference?.optOut === true || legacyProfile?.optOut === true || adaptation?.learningOptOut === true
}

export async function readQl7SupportPersonalityStateV11({ database, userId = '' } = {}) {
  if (!database?.collection || !str(userId)) return null
  return database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.personality)
    .findOne({ userIdHash: userHash(userId) })
    .catch(() => null)
}

export async function writeQl7SupportPersonalityStateV11({ database, userId = '', state = null, evidenceType = '' } = {}) {
  if (!database?.collection || !str(userId) || !state || typeof state !== 'object') return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const now = new Date().toISOString()
  const safeState = {
    version: cleanText(state.version, 80),
    locale: cleanText(state.locale, 24),
    traits: cleanObject(state.traits),
    sampleSize: Math.max(0, Number(state.sampleSize || 0)),
    confidence: Math.min(1, Math.max(0, Number(state.confidence || 0))),
    constitutionHash: cleanText(state.constitutionHash, 128),
    lastEvidenceType: cleanText(evidenceType, 80),
    updatedAt: now,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.personality).updateOne(
    { userIdHash },
    { $set: safeState, $setOnInsert: { _id: `personality-v11:${userIdHash}`, userIdHash, createdAt: now } },
    { upsert: true },
  )
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.adaptation).updateOne(
    { userIdHash },
    { $set: { locale: safeState.locale, confidence: safeState.confidence, sampleSize: safeState.sampleSize, personalityVersion: safeState.version, updatedAt: now }, $setOnInsert: { _id: `adaptation-v11:${userIdHash}`, userIdHash, learningOptOut: false, createdAt: now } },
    { upsert: true },
  )
  return { ok: true, userIdHash }
}

export async function recordQl7SupportCognitiveTurnV11({ database, userId = '', messageId = '', caseId = '', requestContext = {}, replyPlan = {}, diagnosticResult = null, languageInput = {}, actionIds = [], personalityState = null, modelVersion = 'v11', calibrationVersion = 'baseline-v11' } = {}) {
  if (!database?.collection || !str(userId) || !str(messageId)) return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const caseIdHash = sha(str(caseId))
  const turnId = `turn-v11:${sha(`${messageId}:${userIdHash}:${caseIdHash}`).slice(0, 40)}`
  const replyText = str(replyPlan?.text)
  const row = {
    _id: turnId,
    turnId,
    canonicalMessageCollection: QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11,
    canonicalMessageId: str(messageId),
    caseIdHash,
    userIdHash,
    topic: str(requestContext?.topic).slice(0, 80),
    subIntent: str(requestContext?.subIntent).slice(0, 120),
    messageAct: str(requestContext?.messageAct).slice(0, 80),
    locale: str(languageInput?.detectedLanguage || replyPlan?.locale).slice(0, 24),
    toneVector: cleanObject(requestContext?.tone || {}),
    hypotheses: safeArray(requestContext?.route?.hypotheses, 8).map((item) => ({ topic: str(item?.topic).slice(0, 80), subIntent: str(item?.subIntent).slice(0, 120), confidence: Number(item?.confidence || 0) })),
    selectedSources: safeArray(diagnosticResult?.sources || diagnosticResult?.sourceIds || requestContext?.analysis?.domainPlan?.sources, 24).map((item) => cleanText(typeof item === 'string' ? item : item?.id || item?.source, 120)),
    resultClass: str(diagnosticResult?.branch || diagnosticResult?.status || replyPlan?.responseCode).slice(0, 120),
    responseMode: str(replyPlan?.responseMode).slice(0, 80),
    responsePlanHash: sha(JSON.stringify({ responseCode: replyPlan?.responseCode, mode: replyPlan?.responseMode, facts: replyPlan?.facts || [] })),
    replyFingerprint: sha(replyText.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ')),
    replyGraphemes: countQl7SupportGraphemesV11(replyText, languageInput?.detectedLanguage || 'en'),
    actionIds: safeArray(actionIds, 12).map((item) => cleanText(item, 100)),
    reaction: '',
    outcome: '',
    modelVersion: str(modelVersion).slice(0, 80),
    personalityVersion: str(personalityState?.version || '').slice(0, 80),
    personalityConfidence: Math.min(1, Math.max(0, Number(personalityState?.confidence || 0))),
    calibrationVersion: str(calibrationVersion).slice(0, 80),
    translationStatus: str(languageInput?.translationStatus).slice(0, 80),
    translationProvider: str(languageInput?.translationProvider).slice(0, 80),
    createdAt: new Date().toISOString(),
    expireAt: null,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.turns).updateOne({ _id: turnId }, { $setOnInsert: row }, { upsert: true })
  return { ok: true, turnId, userIdHash, caseIdHash }
}

export async function resolveLatestQl7SupportCognitiveTurnV11({ database, userId = '', caseId = '', messageId = '' } = {}) {
  if (!database?.collection || !str(userId)) return null
  const filter = { userIdHash: userHash(userId) }
  if (str(messageId)) filter.canonicalMessageId = str(messageId)
  else if (str(caseId)) filter.caseIdHash = sha(str(caseId))
  return database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.turns).findOne(filter, { sort: { createdAt: -1 } }).catch(() => null)
}

export async function recordQl7SupportOutcomeV11({ database, userId = '', turnId = '', outcomeType = '', value = '', metadata = {} } = {}) {
  if (!database?.collection || !str(userId) || !str(turnId) || !str(outcomeType)) return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const id = `outcome-v11:${sha(`${turnId}:${outcomeType}`).slice(0, 48)}`
  const now = new Date().toISOString()
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.outcomes).updateOne(
    { _id: id },
    { $set: { _id: id, turnId: str(turnId), userIdHash, outcomeType: str(outcomeType).slice(0, 80), value: cleanText(value, 600), metadata: cleanObject(metadata), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.turns).updateOne(
    { turnId: str(turnId), userIdHash },
    { $set: { reaction: str(outcomeType).slice(0, 80), outcome: cleanText(value || outcomeType, 200), lastOutcomeAt: now } },
  ).catch(() => null)
  return { ok: true, id }
}

export async function recordQl7SupportActionOutcomeV11({ database, userId = '', turnId = '', actionId = '', routeId = '', outcomeType = '', metadata = {} } = {}) {
  if (!database?.collection || !str(userId) || !str(turnId) || !str(actionId) || !str(outcomeType)) return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const id = `action-v11:${sha(`${turnId}:${actionId}:${outcomeType}`).slice(0, 48)}`
  const now = new Date().toISOString()
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.actions).updateOne(
    { _id: id },
    { $set: { _id: id, turnId: str(turnId), userIdHash, actionId: cleanText(actionId, 120), routeId: cleanText(routeId, 120), outcomeType: cleanText(outcomeType, 80), metadata: cleanObject(metadata), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return { ok: true, id }
}

export async function recordQl7SupportTranslationOutcomeV11({ database, userId = '', turnId = '', locale = '', provider = '', status = '', sourceLocale = '', machineFieldsPreserved = true, userVisibleCoverage = null } = {}) {
  if (!database?.collection || !str(userId) || !str(turnId)) return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const id = `translation-v11:${sha(`${turnId}:${locale}`).slice(0, 48)}`
  const now = new Date().toISOString()
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.translations).updateOne(
    { _id: id },
    { $set: { _id: id, turnId: str(turnId), userIdHash, locale: cleanText(locale, 24), sourceLocale: cleanText(sourceLocale, 24), provider: cleanText(provider, 80), status: cleanText(status, 80), machineFieldsPreserved: machineFieldsPreserved === true, userVisibleCoverage: userVisibleCoverage === null ? null : Math.min(1, Math.max(0, Number(userVisibleCoverage))), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return { ok: true, id }
}

export async function recordQl7SupportResponseQualityV11({ database, userId = '', turnId = '', modelVersion = 'v11', calibrationVersion = 'baseline-v11', metrics = {} } = {}) {
  if (!database?.collection || !str(userId) || !str(turnId)) return { ok: false, skipped: true }
  if (await readQl7SupportLearningOptOutV11(database, userId)) return { ok: true, skipped: true, reason: 'learning_opt_out' }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const userIdHash = userHash(userId)
  const id = `quality-v11:${sha(turnId).slice(0, 48)}`
  const now = new Date().toISOString()
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.quality).updateOne(
    { _id: id },
    { $set: { _id: id, turnId: str(turnId), userIdHash, modelVersion: cleanText(modelVersion, 80), calibrationVersion: cleanText(calibrationVersion, 80), metrics: cleanObject(metrics), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return { ok: true, id }
}

export async function recordQl7SupportSimulationRunV11({ database, run = {} } = {}) {
  if (!database?.collection || !str(run?.runId)) return { ok: false, skipped: true }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const now = new Date().toISOString()
  const safeRun = cleanObject(run)
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.simulationRuns).updateOne(
    { runId: str(run.runId) },
    { $set: { ...safeRun, runId: str(run.runId), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { _id: `simulation-v11:${sha(run.runId).slice(0, 40)}`, createdAt: now } },
    { upsert: true },
  )
  return { ok: true, runId: str(run.runId) }
}

export async function recordQl7SupportSimulationFailureV11({ database, runId = '', failure = {} } = {}) {
  if (!database?.collection || !str(runId)) return { ok: false, skipped: true }
  await ensureQl7SupportCognitiveIndexesV11(database)
  const failureId = cleanText(failure?.failureId || failure?.scenarioId || sha(failure), 160)
  const id = `sim-failure-v11:${sha(`${runId}:${failureId}`).slice(0, 48)}`
  const now = new Date().toISOString()
  await database.collection(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11.simulationFailures).updateOne(
    { _id: id },
    { $set: { _id: id, runId: str(runId), failureId, clusterKey: cleanText(failure?.clusterKey, 240), severity: cleanText(failure?.severity, 40), evidence: cleanObject(failure), updatedAt: now, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return { ok: true, id }
}

export async function deleteQl7SupportCognitiveMemoryForUserV11({ database, userId = '' } = {}) {
  if (!database?.collection || !str(userId)) return { ok: false, skipped: true }
  const userIdHash = userHash(userId)
  const c = QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11
  const owned = [c.turns, c.outcomes, c.actions, c.translations, c.quality, c.personality, c.adaptation]
  const results = []
  for (const name of owned) {
    const result = await database.collection(name).deleteMany({ userIdHash })
    results.push({ collection: name, deletedCount: Number(result?.deletedCount || 0) })
  }
  return { ok: true, userIdHash, results }
}
