import crypto from 'node:crypto'
import dmPrimary from '../mongo/dm-primary.cjs'
import mongoClient from '../mongo/client.cjs'
import { sendSupportEmail } from '../supportEmailTransport.js'
import { sendBackgroundPush } from '../webPush.js'
import {
  QL7_SUPPORT_ID,
  QL7_SUPPORT_SYSTEM_ROLE,
  assertNotQl7SupportSender,
  assertQl7SupportDedupeKey,
  isQl7SupportId,
  normalizeQl7SupportText,
} from './systemActor.js'
import {
  buildQl7SupportDedupeKey,
  buildQl7SupportMessage,
  classifyQl7SupportRequest,
  normalizeQl7SupportLocale,
} from './templates.js'
import {
  QL7_SUPPORT_CASE_COLLECTION,
  analyzeQl7SupportRequest,
  buildQl7SupportCasePatch,
  createQl7SupportCaseId,
  redactQl7SupportSecrets,
  summarizeQl7SupportPreviousContext,
} from './caseEngine.js'
import { isQl7SupportDiagnosticTopic } from './diagnostics.js'
import { deepTranslateQl7SupportText } from './supportDeepTranslateService.js'
import {
  localizeQl7SupportReply,
  prepareQl7SupportLanguageInput,
} from './languageOrchestrator.js'
import { routeQl7SupportMessage } from './semanticRouter.js'
import {
  mergeQl7SupportMemory,
  normalizeQl7SupportMemory,
  registerQl7SupportReply,
  shouldOpenNewQl7SupportCase,
} from './dialogueMemory.js'
import { assessQl7SupportTone } from './toxicityEngine.js'
import { decideQl7SupportConversationTurn } from './conversationIntelligence.js'
import { executeQl7SupportProductionTurn, finalizeQl7SupportProductionDelivery } from './runtime/productionTurn.js'
import { buildQl7SupportOperatorCase } from './operator/buildCase.js'
import { calibrateQl7SupportRouteV13 } from './semantics/routeCalibration.js'
import { buildQl7SupportSurfaceSpecV13 } from './presentation/buildSupportSurface.js'
import { receiptFromQl7DiagnosticV13 } from './data/adapterReceipt.js'
import { assertQl7SupportActive, isQl7SupportActive } from './config/featureFlag.js'
import { runQl7SupportPremiumDiagnostic } from './diagnosticRegistry.js'
import { buildQl7SupportCard, buildQl7SupportCardV4, validateQl7SupportCard, validateQl7SupportCardAnyVersion } from './contracts/supportCard.js'
import { buildQl7SupportEntryGreetingCardV8 } from './greetingCoordinatorV8.js'
import { isQl7SupportProviderLocaleV8, localizeQl7SupportInputPolicyV8, localizeQl7SupportStructuredV8 } from './providerLocalizationV8.js'
import { recordQl7LearningSignalV8 } from './learningGovernanceV8.js'
import { presentQl7SupportDiagnostic } from './diagnosticPresentation.js'
import {
  publishQl7SupportRuntimeState,
  readQl7SupportRuntimeState,
} from './runtimeStateMachine.js'
import { publicQl7VerifiedActorProjection } from './identityResolver.js'
import { recordQl7SupportIncidentLearningCandidate, recordQl7SupportLearningSignal } from './learningPipeline.js'
import { enqueueQl7SupportEmail, processQl7SupportEmailOutbox } from './emailOutboxWorker.js'
import {
  buildQl7SupportConversationState,
  stabilizeQl7SupportConversationRoute,
} from './conversationStateV7.js'
import {
  buildQl7SupportInputPolicy,
  normalizeQl7SupportInputPolicy,
} from './inputPolicy.js'
import { buildQl7SupportDiagnosticFailureResult } from './diagnosticFailure.js'
import { calculateQl7EcosystemRating } from './ecosystemRating.js'
import { assertQl7SupportUserInputV11, enforceQl7SupportReplyBudgetV11 } from './limitsV11.js'
import { attachQl7SupportSignedChoicesV11, consumeQl7SupportChoiceV11 } from './choiceContractV11.js'
import { buildQl7SupportPersonalityStateV11, selectQl7SupportResponseModeV11 } from './personalityEngineV11.js'
import {
  readQl7SupportPersonalityStateV11,
  recordQl7SupportCognitiveTurnV11,
  recordQl7SupportResponseQualityV11,
  recordQl7SupportTranslationOutcomeV11,
  writeQl7SupportPersonalityStateV11,
} from './cognitiveMemoryV11.js'
import { buildQl7SupportRuntimeClaimV11, readQl7SupportRuntimeCapabilityV11 } from './runtimeCapabilityRegistryV11.js'

const DEDUPE_COLLECTION = 'ql7_support_message_dedupe'
const REQUESTS_COLLECTION = 'ql7_support_user_requests'
export const QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION = 'support_email_outbox'
const DEDUPE_INDEX_KEY = '__ql7SupportDedupeIndexesV1'

let ql7SupportTestDb = null

function str(value) {
  return String(value ?? '').trim()
}

function jsonClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null }
}

function shortHash(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex').slice(0, 16)
}

function supportThreadEndpointProof(userId = '') {
  const user = str(userId)
  const pair = [user, QL7_SUPPORT_ID].sort()
  return {
    threadCanonicalKey: `dm:thread:${pair[0]}:${pair[1]}`,
    endpointA: pair[0],
    endpointB: pair[1],
    endpointProofVersion: 2,
  }
}

function sanitizeQl7SupportEmailBridgeValue(value, depth = 0) {
  if (depth > 16 || value === null || value === undefined) return value ?? null
  if (typeof value === 'string') return redactQl7SupportSecrets(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((item) => sanitizeQl7SupportEmailBridgeValue(item, depth + 1))
  if (typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = sanitizeQl7SupportEmailBridgeValue(item, depth + 1)
    }
    return out
  }
  return str(value)
}

function nowIso() {
  return new Date().toISOString()
}

async function db() {
  const handle = ql7SupportTestDb || await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (!globalThis[DEDUPE_INDEX_KEY]) {
    globalThis[DEDUPE_INDEX_KEY] = Promise.all([
      database.collection(DEDUPE_COLLECTION).createIndex({ dedupeKey: 1 }, { unique: true }),
      database.collection(REQUESTS_COLLECTION).createIndex({ userId: 1, topic: 1 }, { unique: true }),
      database.collection(REQUESTS_COLLECTION).createIndex({ updatedAt: -1 }),
      database.collection(QL7_SUPPORT_CASE_COLLECTION).createIndex({ caseId: 1 }, { unique: true }),
      database.collection(QL7_SUPPORT_CASE_COLLECTION).createIndex({ userId: 1, active: 1, updatedAt: -1 }),
      database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).createIndex({ userId: 1, caseId: 1, updatedAt: -1 }),
      database.collection('ql7_support_ui_events').createIndex({ userId: 1, correlationId: 1, changedAt: -1 }),
      database.collection('ql7_support_security_audit').createIndex({ createdAt: -1 }),
      database.collection('ql7_support_learning_candidates').createIndex({ caseId: 1, status: 1, createdAt: -1 }),
      database.collection('ql7_support_turn_decisions_v9').createIndex({ caseId: 1, messageId: 1 }),
    ])
      .catch((error) => {
        delete globalThis[DEDUPE_INDEX_KEY]
        throw error
      })
  }
  await globalThis[DEDUPE_INDEX_KEY]
  return database
}

export function __setQl7SupportTestDb(database) {
  ql7SupportTestDb = database || null
  delete globalThis[DEDUPE_INDEX_KEY]
}

function safeProfileProjection(doc = {}, fallbackId = '') {
  const stats = doc?.stats && typeof doc.stats === 'object' ? doc.stats : {}
  return {
    accountId: str(doc?.accountId || doc?.canonicalAccountId || doc?.userId || fallbackId),
    nickname: str(doc?.nickname || doc?.nick).slice(0, 120),
    avatar: str(doc?.icon || doc?.avatar).slice(0, 500),
    locale: str(doc?.locale || doc?.language || doc?.preferredLocale).slice(0, 24),
    accountCreatedAt: str(doc?.createdAt || doc?.registeredAt),
    lastActivityAt: str(doc?.lastActivityAt || doc?.lastSeenAt || doc?.updatedAt),
    stats: {
      posts: Number(stats?.posts ?? stats?.postsTotal ?? doc?.postsCount ?? 0) || 0,
      topics: Number(stats?.topics ?? stats?.topicsTotal ?? doc?.topicsCount ?? 0) || 0,
      likes: Number(stats?.likes ?? stats?.likesTotal ?? doc?.likesCount ?? 0) || 0,
      followers: Number(stats?.followers ?? doc?.followersCount ?? 0) || 0,
      following: Number(stats?.following ?? doc?.followingCount ?? 0) || 0,
    },
  }
}

function safeGeoProjection(geo = {}) {
  if (!geo || typeof geo !== 'object') return {}
  return {
    known: geo?.known === true,
    precision: str(geo?.precision || 'global').slice(0, 32),
    country: str(geo?.country).slice(0, 120),
    region: str(geo?.region).slice(0, 160),
    city: str(geo?.city).slice(0, 160),
    source: str(geo?.source).slice(0, 80),
    confidence: Number.isFinite(Number(geo?.confidence)) ? Number(geo.confidence) : null,
    asOf: str(geo?.lastSeenAt || geo?.updatedAt || geo?.createdAt),
  }
}

async function readCursorRows(cursor, { sort = null, limit = 20, projection = null } = {}) {
  if (!cursor) return []
  let next = cursor
  try { if (projection && typeof next.project === 'function') next = next.project(projection) } catch {}
  try { if (sort && typeof next.sort === 'function') next = next.sort(sort) } catch {}
  try { if (typeof next.limit === 'function') next = next.limit(limit) } catch {}
  try { return typeof next.toArray === 'function' ? await next.toArray() : [] } catch { return [] }
}

export async function loadQl7SupportAdminContext({
  database,
  actor = null,
  caseId = '',
  correlationId = '',
  currentMessageId = '',
  currentText = '',
} = {}) {
  if (!database?.collection || !actor?.valid || !actor?.canonicalAccountId) {
    return { profile: {}, safeGeo: {}, timeline: [], readOnly: true, sourceStatus: 'unavailable' }
  }
  const ids = Array.from(new Set([
    str(actor.canonicalAccountId),
    ...(Array.isArray(actor.aliases) ? actor.aliases.map(str) : []),
  ].filter(Boolean))).slice(0, 40)
  const profileFilter = {
    $or: [
      { _id: { $in: ids.map((id) => `profile:${id}`) } },
      { accountId: { $in: ids } },
      { canonicalAccountId: { $in: ids } },
      { userId: { $in: ids } },
    ],
  }
  const profileDoc = await database.collection('profiles').findOne(profileFilter, {
    projection: {
      _id: 1, accountId: 1, canonicalAccountId: 1, userId: 1,
      nickname: 1, nick: 1, icon: 1, avatar: 1, locale: 1, language: 1,
      preferredLocale: 1, createdAt: 1, registeredAt: 1, updatedAt: 1,
      lastActivityAt: 1, lastSeenAt: 1, stats: 1, postsCount: 1, topicsCount: 1,
      likesCount: 1, followersCount: 1, followingCount: 1, _geoCurrent: 1,
    },
  }).catch(() => null)
  let geo = profileDoc?._geoCurrent || null
  if (!geo) {
    const geoRows = await readCursorRows(database.collection('profile_geo_events').find({
      $or: [
        { canonicalAccountId: { $in: ids } },
        { accountId: { $in: ids } },
      ],
    }), {
      sort: { createdAt: -1, _id: -1 },
      limit: 1,
      projection: { known: 1, precision: 1, country: 1, region: 1, city: 1, source: 1, confidence: 1, createdAt: 1 },
    })
    geo = geoRows[0] || null
  }

  const caseDoc = caseId
    ? await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ $or: [{ _id: str(caseId) }, { caseId: str(caseId) }] }).catch(() => null)
    : null
  const uiRows = await readCursorRows(database.collection('ql7_support_ui_events').find({
    userId: str(actor.canonicalAccountId),
    ...(correlationId ? { correlationId: str(correlationId) } : {}),
  }), {
    sort: { changedAt: 1, _id: 1 },
    limit: 30,
    projection: { state: 1, detailCode: 1, changedAt: 1, correlationId: 1, triggeringUserMessageId: 1 },
  })
  const relevant = Array.isArray(caseDoc?.relevantMessages) ? caseDoc.relevantMessages.slice(-12) : []
  const timeline = [
    ...relevant.map((row) => ({
      type: str(row?.role || row?.type || 'conversation'),
      messageId: str(row?.id || row?.messageId),
      at: str(row?.at || row?.createdAt || row?.ts),
      textPreview: redactQl7SupportSecrets(str(row?.textPreview || row?.safeText || row?.text)).slice(0, 320),
    })),
    ...(currentMessageId ? [{
      type: 'user_message',
      messageId: str(currentMessageId),
      at: nowIso(),
      textPreview: redactQl7SupportSecrets(currentText).slice(0, 320),
    }] : []),
    ...uiRows.map((row) => ({
      type: 'runtime_state',
      state: str(row?.state),
      detailCode: str(row?.detailCode),
      messageId: str(row?.triggeringUserMessageId),
      correlationId: str(row?.correlationId),
      at: str(row?.changedAt),
    })),
  ].slice(-30)
  return {
    profile: safeProfileProjection(profileDoc || {}, actor.canonicalAccountId),
    safeGeo: safeGeoProjection(geo || {}),
    timeline,
    readOnly: true,
    sourceStatus: profileDoc ? 'available' : 'no_profile_data',
    checkedSources: ['profiles', 'profile_geo_events', QL7_SUPPORT_CASE_COLLECTION, 'ql7_support_ui_events'],
  }
}

async function reserveDedupe(dedupeKey, patch = {}) {
  const database = await db()
  const at = nowIso()
  const id = `ql7-support:${dedupeKey}`
  const doc = {
    _id: id,
    dedupeKey,
    status: 'reserved',
    ...patch,
    createdAt: at,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  try {
    await database.collection(DEDUPE_COLLECTION).insertOne(doc)
    return { doc, created: true }
  } catch (error) {
    if (error?.code !== 11000) throw error
    const existing = await database.collection(DEDUPE_COLLECTION).findOne({ _id: id })
    if (existing?.status === 'failed') {
      await database.collection(DEDUPE_COLLECTION).updateOne(
        { _id: id, status: 'failed' },
        { $set: { ...patch, status: 'reserved', updatedAt: at, lastError: '' } },
      )
      return { doc: { ...existing, ...patch, status: 'reserved', updatedAt: at }, created: true, retried: true }
    }
    return { doc: existing, created: false }
  }
}

async function failDedupe(dedupeKey, error) {
  const database = await db()
  await database.collection(DEDUPE_COLLECTION).updateOne(
    { _id: `ql7-support:${dedupeKey}` },
    { $set: { status: 'failed', lastError: str(error?.message || error).slice(0, 500), updatedAt: nowIso() } },
  ).catch(() => null)
}

async function completeDedupe(dedupeKey, patch = {}) {
  const database = await db()
  const at = nowIso()
  await database.collection(DEDUPE_COLLECTION).updateOne(
    { _id: `ql7-support:${dedupeKey}` },
    {
      $set: {
        ...patch,
        status: 'sent',
        updatedAt: at,
        storagePrimary: 'mongo',
      },
    },
    { upsert: false },
  )
}

export function buildQl7SupportEmailBridgePayload({
  fromUserId,
  text,
  messageId,
  locale = '',
  topic = '',
  caseId = '',
  analysis = null,
  replyPlan = null,
  diagnosticResult = null,
  actor = null,
  profile = null,
  safeGeo = null,
  timeline = [],
  ecosystemRating = null,
  runtimeResult = null,
  finalMessageId = '',
  surfaceHash = '',
} = {}) {
  const cleanText = normalizeQl7SupportText(text)
  if (!cleanText) return null
  const safeText = redactQl7SupportSecrets(cleanText)
  const diagnosticBranch = str(diagnosticResult?.branch || diagnosticResult?.specializedBranch)
  const recommendedAction = diagnosticBranch
    ? 'Сверить подтверждённые факты с заявлением пользователя, отдельно проверить несоответствия и ответить из ветки Support только после подтверждения результата.'
    : 'Изучить запрос пользователя, сохранить подтверждённый контекст сессии и продолжить работу из текущей ветки Support.'
  const runtimeAnalysis = runtimeResult?.analysis || analysis || {}
  const operatorCase = buildQl7SupportOperatorCase({
    requestId: runtimeResult?.replyPlan?.requestId || messageId,
    caseId,
    messageId,
    finalMessageId,
    userId: fromUserId,
    actor: actor || {},
    profile: profile || {},
    analysis: runtimeAnalysis,
    originalText: safeText,
    translatedMeaning: safeText,
    receipts: runtimeResult?.adapterReceipts || replyPlan?.adapterReceipts || [],
    rating: ecosystemRating,
    geo: safeGeo || {},
    activity: profile?.stats || profile?.activity || {},
    contacts: runtimeResult?.operatorCase?.contacts || null,
    surfaceHash,
  })
  const payload = {
    source: 'ql7_support_dm',
    name: str(profile?.nickname || profile?.displayName || profile?.nick || actor?.nickname || actor?.maskedWallet || fromUserId || 'Пользователь'),
    subject: `QL7 Support DM${messageId ? ` #${messageId}` : ''}${caseId ? ` / ${caseId}` : ''}`,
    replyTo: operatorCase.contacts?.consent === true ? str(operatorCase.contacts.email) : '',
    meta: {
      user: str(fromUserId),
      locale: str(locale) || 'unknown',
      messageId: str(messageId) || 'pending',
      topic: str(topic) || 'general',
      caseId: str(caseId) || 'pending',
      role: str(analysis?.role) || 'unknown',
      subIntent: str(analysis?.subIntent) || 'general',
      caseStatus: str(analysis?.caseStatus) || 'unknown',
      diagnosticStatus: str(analysis?.diagnosticStatus) || 'unknown',
      detectedLanguage: str(analysis?.detectedLanguage) || 'unknown',
      translationStatus: str(analysis?.translationStatus) || 'unknown',
      supportResponseCode: str(replyPlan?.responseCode) || 'none',
      diagnosticBranch: str(diagnosticResult?.branch) || 'none',
      diagnosticRunId: str(diagnosticResult?.runId || diagnosticResult?._id) || 'none',
      conversationDecision: str(analysis?.conversationDecision?.decision) || 'continue_case',
      conversationReasonCode: str(analysis?.conversationDecision?.reasonCode) || 'same_case',
    },
    message: safeText,
    report: {
      title: 'QL7 Support — подробный отчёт оператору',
      source: 'ql7_support_dm',
      operatorCase,
      finalMessageId: str(finalMessageId),
      surfaceHash: str(surfaceHash),
      user: str(fromUserId),
      locale: str(locale) || 'unknown',
      messageId: str(messageId) || 'pending',
      topic: str(topic) || 'general',
      caseId: str(caseId) || 'pending',
      role: str(analysis?.role) || 'unknown',
      subIntent: str(analysis?.subIntent) || 'general',
      caseStatus: str(analysis?.caseStatus) || 'unknown',
      diagnosticStatus: str(analysis?.diagnosticStatus) || 'unknown',
      detectedLanguage: str(analysis?.detectedLanguage) || 'unknown',
      translationStatus: str(analysis?.translationStatus) || 'unknown',
      responseCode: str(replyPlan?.responseCode) || 'none',
      conversationDecision: jsonClone(analysis?.conversationDecision) || {},
      domainPlan: replyPlan?.domainPlan || analysis?.domainPlan || null,
      actor: publicQl7VerifiedActorProjection(actor || {}),
      profile: jsonClone(profile) || {},
      safeGeo: jsonClone(safeGeo) || {},
      timeline: (Array.isArray(timeline) ? timeline : []).slice(-30),
      ecosystemRating: jsonClone(ecosystemRating) || null,
      confidence: Number(diagnosticResult?.confidence || diagnosticResult?.confidencePercent || ecosystemRating?.confidence || 0),
      diagnostic: diagnosticResult || null,
      userMessagePreview: safeText.slice(0, 900),
      recommendedAction,
      privacyBoundary: analysis?.domainPlan?.privacyBoundary || replyPlan?.domainPlan?.privacyBoundary || 'user_safe_evidence_only',
      readOnlyProof: {
        businessCollectionsWritten: diagnosticResult?.businessCollectionsWritten || [],
        readOnly: diagnosticResult?.readOnly !== false,
        sourceContract: diagnosticResult?.sourceContract || null,
      },
    },
  }
  return sanitizeQl7SupportEmailBridgeValue(payload)
}

export async function sendQl7SupportEmailBridge(input = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const payload = buildQl7SupportEmailBridgePayload(input)
  if (!payload) return { ok: true, skipped: true, reason: 'empty_text' }
  return sendSupportEmail(payload)
}

function hasMaterialEntity(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return Object.entries(entities).some(([key, value]) => {
    if (!value || value === true) return false
    return key !== 'hasSecret'
  })
}

function isQl7SupportSelfStatusIntent({ messageAct = '', subIntent = '' } = {}) {
  const act = str(messageAct)
  const intent = str(subIntent)
  return ['self_status', 'personal_status_request'].includes(act) || /(?:^|_)(?:self|personal)_status$/u.test(intent)
}

function isQl7SupportImmediateActorDiagnostic({ topic = '', messageAct = '', subIntent = '' } = {}) {
  if (isQl7SupportSelfStatusIntent({ messageAct, subIntent })) return true
  const normalizedTopic = str(topic)
  const act = str(messageAct)
  if (normalizedTopic === 'vip' && ['problem_description', 'incident_report', 'correction', 'additional_evidence', 'evidence_submission'].includes(act)) return true
  return ['qcoin', 'payments', 'ads_campaigns', 'ads_packages'].includes(normalizedTopic) &&
    ['problem_description', 'incident_report', 'correction', 'additional_evidence', 'evidence_submission'].includes(act)
}

function ql7SupportEmailMaterialReason({ requestContext = {}, diagnosticResult = null } = {}) {
  const analysis = requestContext?.analysis || {}
  const role = str(analysis.role || requestContext.role)
  const topic = str(requestContext.topic || analysis.topic || 'general')
  const mode = str(requestContext.mode || 'new')
  const decision = requestContext?.conversationDecision || analysis?.conversationDecision || {}
  const tone = requestContext?.tone || analysis?.tone || {}
  if (tone?.safetyEscalation === true || decision?.decision === 'safety_escalation') return 'safety_escalation'
  if (analysis?.entities?.hasSecret) return 'security_secret_redacted'
  const toneCategory = str(tone?.taxonomyCategory || tone?.category)
  if (
    ['insult_to_support', 'insult_to_user', 'profanity_context_unknown'].includes(toneCategory) &&
    role !== 'topic_rejection' &&
    decision?.decision !== 'boundary_and_close_topic'
  ) return 'abuse_review'
  const contentPlan = requestContext?.replyPlan?.contentPlan || requestContext?.contentPlan || requestContext?.runtimeResult?.contentPlan || requestContext?.runtimeResult?.plan || {}
  if (contentPlan?.operatorHandoff?.required === true) {
    return `runtime_operator_handoff_${str(contentPlan.operatorHandoff.reason || contentPlan.operatorHandoff.stage || 'ready')}`
  }
  if (contentPlan?.relationshipIntent?.operatorReportReady === true) {
    return `runtime_relationship_${str(contentPlan.relationshipIntent.stage || 'ready')}`
  }
  if (decision?.emailMaterial === false && !diagnosticResult?.branch) return ''
  const nonMaterialActs = new Set([
    'greeting',
    'gratitude',
    'conversation_close',
    'topic_rejection',
    'direct_challenge',
    'spam_or_noise',
    'informational_question',
    'how_to_question',
    'why_question',
    'when_question',
    'status_request',
  ])
  if (nonMaterialActs.has(role)) return ''
  if (decision?.emailMaterial === true && decision?.reasonCode) return `intelligence_${str(decision.reasonCode)}`
  if (topic === 'security') return 'security_topic'
  if (analysis.caseStatus === 'awaiting_admin') return 'awaiting_admin'
  if (diagnosticResult?.branch) return 'diagnostic_result'
  if (analysis.caseStatus === 'ready_for_diagnostic') return 'diagnostic_ready'
  if (mode === 'new' && [
    'problem_description',
    'new_unrelated_issue',
    'correction',
    'additional_evidence',
    'answer_to_question',
  ].includes(role)) return 'new_material_case'
  if (hasMaterialEntity(analysis)) return 'material_entity'
  return ''
}

function ql7SupportEmailMaterialEventKey({ requestContext = {}, diagnosticResult = null, materialReason = '' } = {}) {
  return [
    str(requestContext.caseId),
    str(requestContext.topic || requestContext.analysis?.topic),
    str(diagnosticResult?.branch) || 'case_material',
    str(diagnosticResult?.status) || str(materialReason) || 'material',
  ].join(':').slice(0, 720)
}

async function recordQl7SupportEmailOutbox({
  database,
  fromUserId = '',
  messageId = '',
  requestContext = {},
  diagnosticResult = null,
  materialReason = '',
  materialEventKey = '',
  bridge = null,
  skippedReason = '',
} = {}) {
  if (!database || typeof database.collection !== 'function') return null
  const at = nowIso()
  const id = `support-email:${str(fromUserId) || 'user'}:${str(requestContext.caseId) || 'case'}:${str(messageId) || at}`
  const status = materialReason ? (bridge?.ok === false ? 'retry' : 'pending') : 'suppressed'
  const patch = {
    userId: str(fromUserId),
    messageId: str(messageId),
    caseId: str(requestContext.caseId),
    topic: str(requestContext.topic),
    role: str(requestContext.role || requestContext.analysis?.role),
    subIntent: str(requestContext.subIntent || requestContext.analysis?.subIntent),
    caseStatus: str(requestContext.caseStatus || requestContext.analysis?.caseStatus),
    diagnosticStatus: str(requestContext.diagnosticStatus || requestContext.analysis?.diagnosticStatus),
    diagnosticBranch: str(diagnosticResult?.branch),
    diagnosticRunId: str(diagnosticResult?.runId || diagnosticResult?._id),
    materialReason: str(materialReason),
    materialEventKey: str(materialEventKey),
    skippedReason: str(skippedReason),
    status,
    bridgeOk: bridge?.ok !== false,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
    { _id: id },
    {
      $set: patch,
      $setOnInsert: {
        _id: id,
        createdAt: at,
      },
    },
    { upsert: true },
  )
  return { id, ...patch }
}

export async function maybeSendQl7SupportEmailBridge({
  fromUserId,
  text,
  messageId,
  locale = '',
  requestContext = {},
  diagnosticResult = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const database = await db()
  const materialReason = ql7SupportEmailMaterialReason({ requestContext, diagnosticResult })
  const materialEventKey = ql7SupportEmailMaterialEventKey({ requestContext, diagnosticResult, materialReason })
  if (!materialReason) {
    await recordQl7SupportEmailOutbox({
      database,
      fromUserId,
      messageId,
      requestContext,
      diagnosticResult,
      materialReason: '',
      materialEventKey,
      skippedReason: 'non_material_support_message',
      bridge: { ok: true, skipped: true },
    })
    return { ok: true, skipped: true, reason: 'non_material_support_message', storagePrimary: 'mongo' }
  }

  const previousMaterialEvent = materialEventKey
    ? await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).findOne({
      userId: str(fromUserId),
      caseId: str(requestContext.caseId),
      materialEventKey,
      status: { $in: ['pending', 'leased', 'retry', 'sent'] },
    })
    : null
  if (previousMaterialEvent) {
    const suppressed = await recordQl7SupportEmailOutbox({
      database,
      fromUserId,
      messageId,
      requestContext,
      diagnosticResult,
      materialReason: '',
      materialEventKey,
      skippedReason: 'non_material_support_message',
      bridge: { ok: true, skipped: true },
    })
    return {
      ok: true,
      skipped: true,
      reason: 'non_material_support_message',
      dedupeReason: 'duplicate_material_event',
      duplicateMaterialEvent: true,
      materialEventKey,
      outboxId: suppressed?._id || suppressed?.id || previousMaterialEvent._id,
      storagePrimary: 'mongo',
    }
  }

  const payload = buildQl7SupportEmailBridgePayload({
    fromUserId,
    text,
    messageId,
    locale,
    topic: requestContext.topic,
    caseId: requestContext.caseId,
    analysis: requestContext.analysis,
    replyPlan: requestContext.replyPlan,
    diagnosticResult,
    actor: requestContext.actor,
    profile: requestContext.profile,
    safeGeo: requestContext.safeGeo,
    timeline: requestContext.timeline,
    ecosystemRating: requestContext.ecosystemRating,
    runtimeResult: requestContext.runtimeResult,
    finalMessageId: requestContext.finalMessageId,
    surfaceHash: requestContext.surfaceHash,
  })
  if (!payload) return { ok: true, skipped: true, reason: 'empty_text' }
  const queued = await enqueueQl7SupportEmail({
    database,
    userId: fromUserId,
    messageId,
    caseId: requestContext.caseId,
    topic: requestContext.topic,
    materialReason,
    materialEventKey,
    payload,
  })
  const inlineDelivery = await processQl7SupportEmailOutbox({
    database,
    workerId: `inline-support-bridge:${shortHash(`${fromUserId}:${messageId}:${materialEventKey}`)}`,
    maxItems: 1,
    send: sendSupportEmail,
  }).catch((error) => ({ ok: false, error: str(error?.message || 'inline_email_delivery_failed') }))
  return {
    ok: true,
    skipped: false,
    queued: true,
    asyncDelivery: inlineDelivery?.sent !== 1,
    inlineDelivery,
    materialReason,
    materialEventKey,
    outboxId: queued.id,
    outboxCollection: QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION,
  }
}

async function rememberSupportRequestContext({
  userId,
  messageId,
  text,
  locale = '',
  languageInput = null,
  routeContext = {},
  actor = null,
  tone = null,
} = {}) {
  const uid = str(userId)
  const fallbackTopic = classifyQl7SupportRequest(text)
  if (!uid) return { topic: fallbackTopic, mode: 'new', count: 1 }
  const database = await db()
  const at = nowIso()
  const activeCases = await database.collection(QL7_SUPPORT_CASE_COLLECTION)
    .find({ userId: uid, active: true })
    .sort({ updatedAt: -1 })
    .limit(8)
    .toArray()
  const authoritativeChoice = routeContext?.verifiedChoice?.selected === true ? routeContext.verifiedChoice.choice : null
  const selectedCaseId = str(authoritativeChoice?.targetCaseId || authoritativeChoice?.ownerCaseId || routeContext?.supportChoice?.caseId)
  const previousCase = (selectedCaseId ? activeCases.find((item) => str(item?.caseId || item?._id) === selectedCaseId) : null) || activeCases?.[0] || null
  const previousContext = summarizeQl7SupportPreviousContext(previousCase || {})
  const analyzedRequest = analyzeQl7SupportRequest({
    text,
    locale,
    previousContext,
  })
  const inputHadSecret = Boolean(
    languageInput &&
    String(languageInput?.originalText ?? '') !== String(languageInput?.redactedText ?? '')
  )
  const baseAnalysis = {
    ...analyzedRequest,
    entities: {
      ...(analyzedRequest?.entities || {}),
      hasSecret: inputHadSecret || analyzedRequest?.entities?.hasSecret === true,
    },
  }
  const initialSemanticRoute = routeQl7SupportMessage({
    text,
    locale,
    previousContext: normalizeQl7SupportMemory(previousCase || {}),
    baseAnalysis,
    tone: tone || {},
  })
  let semanticRoute = calibrateQl7SupportRouteV13({
    text: languageInput?.redactedText || text,
    analysis: baseAnalysis,
    route: stabilizeQl7SupportConversationRoute({
      text: languageInput?.redactedText || text,
      route: initialSemanticRoute,
      previousCase: previousCase || {},
      baseAnalysis,
    }),
  })
  if (authoritativeChoice && authoritativeChoice.isOther !== true) {
    semanticRoute = Object.freeze({
      ...semanticRoute,
      topic: str(authoritativeChoice.topic),
      subIntent: str(authoritativeChoice.subIntent || 'choice_selected'),
      messageAct: 'answer_to_question',
      operation: 'choice_selected',
      confidence: 1,
      alternatives: [],
      hypotheses: [],
      ambiguous: false,
      shouldClarify: false,
      topicSwitchDecision: 'signed_choice_authoritative',
      topicSwitchEvidence: [{ type: 'signed_choice', choiceSetId: str(authoritativeChoice.choiceSetId), optionId: str(authoritativeChoice.optionId) }],
    })
  }
  const messageAct = semanticRoute.messageAct || baseAnalysis.role
  const semanticTopic = semanticRoute.topic || baseAnalysis.topic
  const semanticSubIntent = semanticRoute.subIntent || baseAnalysis.subIntent
  const selfStatusIntent = isQl7SupportSelfStatusIntent({ messageAct, subIntent: semanticSubIntent })
  const immediateActorDiagnostic = isQl7SupportImmediateActorDiagnostic({
    topic: semanticTopic,
    messageAct,
    subIntent: semanticSubIntent,
  })
  const informationalActs = new Set([
    'greeting',
    'gratitude',
    'farewell',
    'small_talk_boundary',
    'roadmap_question',
    'informational_question',
    'how_to_question',
    'why_question',
    'when_question',
  ])
  const informationalOnly = informationalActs.has(messageAct) && !selfStatusIntent
  const preliminaryCaseStatus = ['conversation_close', 'farewell'].includes(messageAct)
    ? 'closed'
    : (selfStatusIntent || immediateActorDiagnostic
      ? 'ready_for_diagnostic'
      : (['status_request', 'status_followup'].includes(messageAct)
        ? str(previousCase?.caseStatus || baseAnalysis.caseStatus || 'collecting_context')
        : (informationalOnly ? 'user_notified' : baseAnalysis.caseStatus)))
  const preliminaryAnalysis = {
    ...baseAnalysis,
    ...semanticRoute,
    role: messageAct,
    messageAct,
    topic: semanticTopic,
    subIntent: semanticSubIntent,
    caseStatus: preliminaryCaseStatus,
    diagnosticStatus: preliminaryCaseStatus === 'ready_for_diagnostic' ? 'ready' : baseAnalysis.diagnosticStatus,
  }
  const conversationDecision = authoritativeChoice && authoritativeChoice.isOther !== true ? Object.freeze({
    decision: 'continue_case',
    reasonCode: 'signed_choice_authoritative',
    caseStatus: 'collecting_context',
    diagnosticStatus: 'not_started',
    shouldDiagnose: false,
    shouldStartNewCase: false,
    shouldClearQuestion: true,
  }) : decideQl7SupportConversationTurn({
    text: languageInput?.redactedText || text,
    canonicalText: text,
    previousContext: { ...previousContext, caseStatus: previousCase?.caseStatus },
    route: semanticRoute,
    analysis: preliminaryAnalysis,
    tone: tone || {},
  })
  const semanticCaseStatus = str(conversationDecision.caseStatus || preliminaryCaseStatus)
  const semanticDiagnosticStatus = str(conversationDecision.diagnosticStatus || (
    semanticCaseStatus === 'ready_for_diagnostic'
      ? 'ready'
      : (semanticCaseStatus === 'user_notified' || semanticCaseStatus === 'closed'
        ? 'not_started'
        : baseAnalysis.diagnosticStatus)
  ))
  const clearQuestion = conversationDecision.shouldClearQuestion === true
  const semanticMissingSlots = clearQuestion || informationalOnly || selfStatusIntent || immediateActorDiagnostic || ['conversation_close', 'farewell', 'status_request', 'status_followup', 'topic_rejection', 'direct_challenge', 'human_operator_request'].includes(messageAct)
    ? []
    : (baseAnalysis.missingSlots || [])
  const analysis = {
    ...baseAnalysis,
    ...semanticRoute,
    role: messageAct,
    messageAct,
    topic: semanticTopic,
    subIntent: semanticSubIntent,
    confidence: semanticRoute.confidence,
    alternatives: semanticRoute.alternatives,
    domainPlan: semanticRoute.domainPlan,
    caseStatus: semanticCaseStatus,
    diagnosticStatus: semanticDiagnosticStatus,
    missingSlots: semanticMissingSlots,
    currentQuestionCode: semanticMissingSlots.length ? baseAnalysis.currentQuestionCode : '',
    currentQuestionText: semanticMissingSlots.length ? baseAnalysis.currentQuestionText : '',
    selectedLocale: str(locale || languageInput?.detectedLanguage || baseAnalysis.selectedLocale),
    detectedLanguage: str(languageInput?.detectedLanguage || baseAnalysis.detectedLanguage),
    translationStatus: str(languageInput?.translationStatus || baseAnalysis.translationStatus),
    translationProvider: str(languageInput?.translationProvider),
    translationRequired: languageInput?.translationRequired === true,
    canonicalTextHash: str(languageInput?.translationEvidenceHash || baseAnalysis.textHash),
    tone: tone || null,
    conversationDecision,
  }
  await database.collection('ql7_support_turn_decisions_v9').insertOne({
    _id: `turn-v9:${str(messageId)}:${shortHash([uid, semanticTopic, semanticSubIntent, at].join('|'))}`,
    userId: uid,
    messageId: str(messageId),
    topic: semanticTopic,
    previousTopic: str(previousContext?.previousTopic || previousContext?.topic),
    subIntent: semanticSubIntent,
    messageAct,
    operation: str(semanticRoute?.operation),
    topicSwitchDecision: str(semanticRoute?.topicSwitchDecision),
    topicSwitchEvidence: jsonClone(semanticRoute?.topicSwitchEvidence) || [],
    continuationEvidence: jsonClone(semanticRoute?.continuationEvidence) || [],
    decision: str(conversationDecision?.decision),
    reasonCode: str(conversationDecision?.reasonCode),
    shouldDiagnose: conversationDecision?.shouldDiagnose === true,
    shouldStartNewCase: conversationDecision?.shouldStartNewCase === true,
    confidence: Number(semanticRoute?.confidence || 0),
    textHash: str(analysis.canonicalTextHash || baseAnalysis.textHash),
    createdAt: at,
    storagePrimary: 'mongo',
  }).catch(() => null)
  const shouldStart = conversationDecision.shouldStartNewCase === true || shouldOpenNewQl7SupportCase({ previousCase: previousCase || {}, analysis })
  if (shouldStart && previousCase?._id) {
    await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
      { _id: previousCase._id },
      {
        $set: {
          active: false,
          caseStatus: previousCase.caseStatus === 'closed' ? 'closed' : 'superseded',
          supersededAt: at,
          supersededByMessageId: str(messageId),
          updatedAt: at,
          storagePrimary: 'mongo',
        },
      },
    )
  }
  const caseSource = shouldStart ? null : previousCase
  const caseId = caseSource?.caseId || caseSource?._id || createQl7SupportCaseId(uid, analysis.topic, messageId)
  const memory = mergeQl7SupportMemory({
    previousCase: caseSource || {},
    currentMessage: { id: messageId, text: analysis.sanitizedText || text, safeText: analysis.sanitizedText || text },
    analysis,
    now: at,
  })
  const legacyPatch = buildQl7SupportCasePatch({
    caseId,
    userId: uid,
    messageId,
    text: analysis.sanitizedText || text,
    locale,
    analysis,
    replyPlan: null,
    previousCase: caseSource || {},
    now: at,
  })
  const conversationState = buildQl7SupportConversationState({
    previousCase: caseSource || {},
    analysis,
    messageId,
    now: at,
  })
  const casePatch = {
    ...legacyPatch,
    ...memory,
    ...conversationState,
    caseId,
    userId: uid,
    active: analysis?.abandonment?.closeCase === true ? false : true,
    caseStatus: analysis?.abandonment?.closeCase === true ? 'closed' : str(analysis.caseStatus) || str(legacyPatch.caseStatus) || str(memory.caseStatus) || 'collecting_context',
    diagnosticStatus: str(analysis.diagnosticStatus) || str(legacyPatch.diagnosticStatus) || 'not_started',
    topic: analysis.topic,
    subIntent: analysis.subIntent,
    messageAct: analysis.messageAct,
    confidence: analysis.confidence,
    alternatives: analysis.alternatives,
    domainPlan: analysis.domainPlan,
    conversationDecision: jsonClone(conversationDecision) || {},
    routeContext: {
      pathname: str(routeContext?.pathname).slice(0, 240),
      feature: str(routeContext?.feature).slice(0, 100),
      supportChoice: routeContext?.verifiedChoice?.selected === true ? {
        verified: true,
        optionId: str(routeContext.verifiedChoice.choice?.optionId).slice(0, 160),
        topic: str(routeContext.verifiedChoice.choice?.topic).slice(0, 80),
        subIntent: str(routeContext.verifiedChoice.choice?.subIntent).slice(0, 120),
        caseId: str(routeContext.verifiedChoice.choice?.targetCaseId).slice(0, 160),
        choiceSetId: str(routeContext.verifiedChoice.choice?.choiceSetId).slice(0, 160),
      } : null,
    },
    verifiedActor: publicQl7VerifiedActorProjection(actor || {}),
    v14Ledger: jsonClone(caseSource?.v14Ledger) || {},
    translationHistory: [
      ...(Array.isArray(caseSource?.translationHistory) ? caseSource.translationHistory : []),
      {
        messageId: str(messageId),
        detectedLanguage: analysis.detectedLanguage,
        status: analysis.translationStatus,
        provider: analysis.translationProvider,
        evidenceHash: str(languageInput?.translationEvidenceHash),
        at,
      },
    ].slice(-20),
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
    { _id: caseId },
    { $set: casePatch, $setOnInsert: { _id: caseId, createdAt: at } },
    { upsert: true },
  )

  const topic = analysis.topic || fallbackTopic
  const requestId = `request:${uid}:${topic}`
  const existing = await database.collection(REQUESTS_COLLECTION).findOne({ _id: requestId })
  const count = Number(existing?.count || 0) + 1
  await database.collection(REQUESTS_COLLECTION).updateOne(
    { _id: requestId },
    {
      $set: {
        userId: uid,
        topic,
        caseId,
        role: analysis.role,
        messageAct: analysis.messageAct,
        subIntent: analysis.subIntent,
        caseStatus: analysis.caseStatus,
        diagnosticStatus: analysis.diagnosticStatus,
        conversationDecision: str(conversationDecision.decision),
        conversationReasonCode: str(conversationDecision.reasonCode),
        lastMessageId: str(messageId),
        lastTextPreview: str(analysis.sanitizedText || text).slice(0, 280),
        updatedAt: at,
        storagePrimary: 'mongo',
      },
      $inc: { count: 1 },
      $setOnInsert: { createdAt: at, firstMessageId: str(messageId) },
    },
    { upsert: true },
  )
  return {
    topic,
    role: analysis.role,
    messageAct: analysis.messageAct,
    subIntent: analysis.subIntent,
    caseId,
    caseStatus: analysis.caseStatus,
    diagnosticStatus: analysis.diagnosticStatus,
    analysis,
    route: semanticRoute,
    memory,
    v14Ledger: jsonClone(caseSource?.v14Ledger) || {},
    actor: publicQl7VerifiedActorProjection(actor),
    routeContext: jsonClone(routeContext) || {},
    tone: jsonClone(tone) || {},
    conversationDecision: jsonClone(conversationDecision) || {},
    conversationState: jsonClone(conversationState) || {},
    openCases: activeCases.map((item) => ({
      caseId: str(item.caseId || item._id),
      topic: str(item.activeSubject || item.topic),
      caseStatus: str(item.caseStatus),
      updatedAt: str(item.updatedAt),
      createdAt: str(item.createdAt),
      lastResponseCode: str(item.lastResponseCode),
    })).filter((item) => item.caseId).slice(0, 8),
    mode: existing ? 'followup' : 'new',
    count,
  }
}

function supportReplyCard({ requestContext = {}, replyPlan = null, diagnosticResult = null, locale = 'en', tone = {}, sourceText = '' } = {}) {
  const diagnosticPresentation = diagnosticResult ? presentQl7SupportDiagnostic({ requestContext, diagnosticResult, locale }) : null
  const canonicalSurface = replyPlan?.cardSpec?.schema === 'ql7.support.surface' ? replyPlan.cardSpec : null
  if (canonicalSurface) {
    return buildQl7SupportCardV4({
      ...canonicalSurface,
      locale,
      caseId: canonicalSurface.caseId || requestContext.caseId,
      asOf: canonicalSurface.checkedAt || '',
      checkedAt: canonicalSurface.checkedAt || '',
    })
  }
  const receipts = Array.isArray(replyPlan?.adapterReceipts)
    ? replyPlan.adapterReceipts
    : (diagnosticResult ? [receiptFromQl7DiagnosticV13(diagnosticResult)] : [])
  const surfaceSpec = buildQl7SupportSurfaceSpecV13({
    plan: replyPlan?.contentPlan || {},
    replyPlan: replyPlan || {},
    text: replyPlan?.text || sourceText || '',
    locale,
    receipts,
    diagnosticResult,
    diagnosticPresentation,
    requestContext,
    tone,
  })
  return buildQl7SupportCardV4({
    ...surfaceSpec,
    locale,
    caseId: surfaceSpec.caseId || requestContext.caseId,
    asOf: surfaceSpec.checkedAt || '',
    checkedAt: surfaceSpec.checkedAt || '',
  })
}

function safeClientMutationId(value = '') {
  const clean = str(value)
  return /^[A-Za-z0-9:_-]{12,160}$/.test(clean) ? clean : ''
}

async function publishStage({ database, userId, caseId = '', correlationId, state, detailCode = '', messageId = '', finalMessageId = '', surfaceHash = '', attemptId = '', sequence = null, tone = {}, locale = 'en', inputPolicy = null } = {}) {
  const policy = normalizeQl7SupportInputPolicy(inputPolicy || buildQl7SupportInputPolicy({
    state,
    caseId,
    locale,
    tone,
    expectedInputType: ['clarifying', 'waiting_user', 'waiting_choice', 'ready_for_input'].includes(str(state)) ? 'text_or_choice' : '',
  }), { locale })
  return publishQl7SupportRuntimeState({
    database,
    userId,
    caseId,
    correlationId,
    state,
    detailCode,
    triggeringUserMessageId: messageId,
    finalMessageId,
    surfaceHash,
    attemptId,
    sequence,
    inputPolicy: policy,
    locale,
  }).catch(() => null)
}

export async function getQl7SupportRuntimeStateForUser({ userId = '', correlationId = '' } = {}) {
  assertQl7SupportActive()
  const database = await db()
  const nowMs = Date.now()
  const runtimeState = await readQl7SupportRuntimeState({ database, userId, correlationId })
  const runtimePolicy = normalizeQl7SupportInputPolicy(runtimeState?.inputPolicy || {}, { now: () => nowMs, locale: runtimeState?.inputPolicy?.locale || 'en' })
  const runtimeBlockedUntilMs = Number(runtimePolicy?.blockedUntilMs || 0)
  let activeCase = null
  try {
    const rows = await database.collection(QL7_SUPPORT_CASE_COLLECTION)
      .find({ userId: str(userId), 'composerPolicy.allowed': false })
      .sort({ updatedAt: -1 })
      .limit(16)
      .toArray()
    activeCase = (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        row,
        policy: normalizeQl7SupportInputPolicy(row?.composerPolicy || {}, { now: () => nowMs, locale: row?.composerPolicy?.locale || 'en' }),
      }))
      .filter(({ policy }) => policy.allowed === false && policy.reasonCode === 'safety_review' && Number(policy.blockedUntilMs || 0) > nowMs)
      .sort((a, b) => Number(b.policy.blockedUntilMs || 0) - Number(a.policy.blockedUntilMs || 0))[0] || null
  } catch {}
  if (!activeCase || Number(activeCase.policy.blockedUntilMs || 0) <= runtimeBlockedUntilMs) return runtimeState
  return {
    ...(runtimeState || {}),
    state: 'cooldown',
    detailCode: 'safety_review',
    caseId: str(activeCase.row?.caseId || activeCase.row?._id || runtimeState?.caseId),
    correlationId: str(runtimeState?.correlationId),
    changedAt: str(activeCase.row?.updatedAt || activeCase.row?.createdAt || new Date(nowMs).toISOString()),
    expired: false,
    inputPolicy: activeCase.policy,
    storagePrimary: 'mongo',
    restrictionSource: 'ql7_support_cases',
  }
}

export async function createQl7SupportUserMessage({
  actor = null,
  fromUserId,
  rawFromIds = [],
  text,
  ts = Date.now(),
  locale = '',
  clientMutationId = '',
  correlationId = '',
  routeContext = {},
} = {}) {
  assertQl7SupportActive()
  const from = str(actor?.canonicalAccountId || fromUserId)
  assertNotQl7SupportSender(from)
  if (!actor?.valid || !from) {
    const error = new Error(actor?.failureCode || 'verified_session_required')
    error.status = 401
    throw error
  }
  if (str(fromUserId) && str(fromUserId).toLowerCase() !== from.toLowerCase()) {
    const error = new Error('verified_actor_mismatch')
    error.status = 403
    throw error
  }
  const cleanText = normalizeQl7SupportText(text)
  const inputValidation = assertQl7SupportUserInputV11(cleanText, { locale: locale || 'en' })
  const mutationId = safeClientMutationId(clientMutationId) || `server:${from}:${Number(ts || Date.now())}`
  const correlation = safeClientMutationId(correlationId) || mutationId
  const userDedupeKey = `user-send:${from}:${mutationId}`
  const reservation = await reserveDedupe(userDedupeKey, { userId: from, eventType: 'support_user_message', clientMutationId: mutationId })
  if (!reservation.created) {
    return {
      ok: true,
      deduped: true,
      pending: !reservation.doc?.messageId,
      id: str(reservation.doc?.messageId),
      ts: Number(reservation.doc?.ts || ts || Date.now()),
      caseId: str(reservation.doc?.caseId),
      correlationId: correlation,
      clientMutationId: mutationId,
      storagePrimary: 'mongo',
    }
  }

  const database = await db()
  const verifiedChoice = await consumeQl7SupportChoiceV11({ database, userId: from, supportChoice: routeContext?.supportChoice }).catch((error) => ({ ok: false, error: str(error?.message || error) }))
  if (verifiedChoice?.ok === false) {
    const error = new Error(str(verifiedChoice.error || 'choice_validation_failed'))
    error.status = 400
    throw error
  }
  const resolvedRouteContext = { ...routeContext, inputGraphemes: inputValidation.graphemes, verifiedChoice }
  let messageId = ''
  try {
    await publishStage({ database, userId: from, correlationId: correlation, state: 'receiving' })
    await publishStage({ database, userId: from, correlationId: correlation, state: 'validating' })
    await publishStage({ database, userId: from, correlationId: correlation, state: 'verifying_actor', detailCode: actor.authMode })
    await dmPrimary.addAliasesFor(from, [...rawFromIds, ...(actor.aliases || [])])
    const fromIds = await dmPrimary.expandAliasIds([from, ...rawFromIds, ...(actor.aliases || [])])
    messageId = String(await dmPrimary.nextMsgId())
    const msg = {
      id: messageId,
      from,
      to: QL7_SUPPORT_ID,
      text: cleanText,
      attachments: [],
      ts: Number(ts || Date.now()),
      supportThread: true,
      ...supportThreadEndpointProof(from),
      clientMutationId: mutationId,
      correlationId: correlation,
      routeContext: { pathname: str(resolvedRouteContext?.pathname).slice(0, 240), feature: str(resolvedRouteContext?.feature).slice(0, 100), choiceVerified: verifiedChoice?.selected === true },
    }
    await dmPrimary.saveMessage(msg)
    await dmPrimary.addMessageIndexes({ msg, fromIds, toIds: [QL7_SUPPORT_ID], score: msg.ts })

    await publishStage({ database, userId: from, correlationId: correlation, state: 'redacting', messageId })
    const languageInput = await prepareQl7SupportLanguageInput({
      text: cleanText,
      selectedLocale: locale,
      translate: (payload) => deepTranslateQl7SupportText(payload),
    })
    await publishStage({ database, userId: from, correlationId: correlation, state: languageInput.translationRequired ? 'translating_in' : 'analyzing', messageId })
    const tone = assessQl7SupportTone({
      text: languageInput.redactedText,
      translatedText: languageInput.canonicalText,
      language: languageInput.detectedLanguage,
    })
    await publishStage({ database, userId: from, correlationId: correlation, state: 'classifying', messageId })
    const requestContext = await rememberSupportRequestContext({
      userId: from,
      messageId,
      text: languageInput.canonicalText,
      locale: languageInput.detectedLanguage || locale,
      languageInput,
      routeContext: resolvedRouteContext,
      actor,
      tone,
    })
    const adminContext = await loadQl7SupportAdminContext({
      database,
      actor,
      caseId: requestContext.caseId,
      correlationId: correlation,
      currentMessageId: messageId,
      currentText: languageInput.redactedText,
    }).catch(() => ({ profile: {}, safeGeo: {}, timeline: [], readOnly: true, sourceStatus: 'unavailable' }))
    requestContext.profile = adminContext.profile
    requestContext.safeGeo = adminContext.safeGeo
    requestContext.timeline = adminContext.timeline
    requestContext.adminContext = adminContext
    requestContext.ecosystemRating = calculateQl7EcosystemRating({
      profile: { ...adminContext.profile, userId: from },
      activity: adminContext.activity || {},
      violations: adminContext.violations || {},
      support: { openCases: Array.isArray(requestContext.openCases) ? requestContext.openCases.length : 0 },
    })
    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'merging_memory', messageId })

    let diagnosticResult = null
    const diagnosticEligible = tone.safetyEscalation !== true &&
      requestContext?.conversationDecision?.shouldDiagnose === true &&
      isQl7SupportDiagnosticTopic(requestContext?.topic)
    if (diagnosticEligible) {
      await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'retrieving', messageId })
      await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'diagnosing', messageId })
      try {
        diagnosticResult = await runQl7SupportPremiumDiagnostic({
          database,
          userId: from,
          aliases: [...rawFromIds, ...(actor.aliases || [])],
          caseId: requestContext.caseId,
          analysis: requestContext.analysis,
        })
      } catch (diagnosticError) {
        diagnosticResult = buildQl7SupportDiagnosticFailureResult({
          error: diagnosticError,
          topic: requestContext.topic,
          caseId: requestContext.caseId,
        })
      }
      await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
        { _id: requestContext.caseId },
        { $set: {
          caseStatus: str(requestContext.caseStatus) || 'ready_for_diagnostic',
          diagnosticStatus: diagnosticResult?.status === 'healthy' ? 'completed' : (diagnosticResult?.status || 'partial'),
          lastDiagnosticRunId: str(diagnosticResult?.runId || diagnosticResult?._id),
          lastDiagnosticBranch: str(diagnosticResult?.branch),
          lastDiagnosticSpecializedBranch: str(diagnosticResult?.specializedBranch || diagnosticResult?.branch),
          lastDiagnosticStatus: str(diagnosticResult?.status),
          updatedAt: nowIso(),
        } },
      )
    }

    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'rendering_user', messageId })
    const previousPersonalityState = await readQl7SupportPersonalityStateV11({ database, userId: from }).catch(() => null)
    const personalityState = buildQl7SupportPersonalityStateV11({ previous: previousPersonalityState, locale: languageInput.detectedLanguage || locale, evidence: [] })
    const productionTurn = executeQl7SupportProductionTurn({
      mode: 'production',
      requestId: correlation,
      userTurnId: messageId,
      caseId: requestContext.caseId,
      actor: requestContext.actor,
      originalText: languageInput.redactedText,
      detectedLocale: languageInput.detectedLanguage,
      selectedLocale: languageInput.detectedLanguage || locale,
      analysis: requestContext.analysis,
      route: requestContext.route,
      priorLedger: Object.keys(requestContext.v14Ledger || {}).length ? requestContext.v14Ledger : requestContext.memory,
      productionQuestionCode: requestContext.memory?.currentQuestionCode ||
        requestContext.analysis?.currentQuestionCode ||
        '',
      diagnosticResult,
      tone,
      conversationDecision: requestContext.conversationDecision,
      contextualFollowup: requestContext.mode === 'followup',
      now: nowIso(),
      seed: `${from}:${messageId}:${mutationId}`,
    })
    const runtimeV14 = productionTurn.runtime
    const responseLocale = productionTurn.localePolicy.locale
    const providerResponseLocale = productionTurn.localePolicy.supported
      ? ''
      : String(languageInput.detectedLanguage || '').trim()
    let replyPlan = runtimeV14.replyPlan
    if (['status_request', 'status_followup'].includes(str(requestContext.messageAct)) && Array.isArray(requestContext.openCases) && requestContext.openCases.length > 1) {
      const options = requestContext.openCases.slice(0, 4).map((item, index) => ({
        id: `open-case-${index + 1}`,
        label: `${item.topic || 'Support'} · ${item.caseStatus || 'open'}`,
        description: item.updatedAt || item.createdAt || '',
        semantic: { topic: item.topic, subIntent: 'status_followup', caseId: item.caseId },
      }))
      replyPlan = {
        ...replyPlan,
        responseCode: 'open_cases:selection',
        nextState: 'waiting_choice',
        text: responseLocale === 'ru' ? 'У вас несколько незакрытых обращений. Выберите то, по которому нужно проверить результат.' : (responseLocale === 'uk' ? 'У вас є кілька незакритих звернень. Виберіть те, для якого потрібно перевірити результат.' : 'You have several open requests. Select the one whose status you want me to check.'),
        cardSpec: {
          kind: 'clarification_choices',
          title: responseLocale === 'ru' ? 'Какое обращение проверить?' : (responseLocale === 'uk' ? 'Яке звернення перевірити?' : 'Which request should I check?'),
          summary: responseLocale === 'ru' ? 'Выберите незакрытое обращение — я сразу проверю его актуальный статус.' : (responseLocale === 'uk' ? 'Виберіть незакрите звернення — я одразу перевірю його актуальний статус.' : 'Select an open request and I will check its current status.'),
          options,
          other: { id: 'other', label: responseLocale === 'ru' ? 'Другое' : (responseLocale === 'uk' ? 'Інше' : 'Other'), placeholder: responseLocale === 'ru' ? 'Опишите, какое обращение вы имеете в виду.' : 'Describe the request you mean.' },
        },
      }
    }
    if (['roadmap_question', 'when_question'].includes(str(requestContext.messageAct))) {
      const runtimeCapability = await readQl7SupportRuntimeCapabilityV11({ database, topic: requestContext.topic }).catch(() => null)
      if (runtimeCapability) {
        const runtimeClaim = buildQl7SupportRuntimeClaimV11(runtimeCapability, responseLocale)
        replyPlan = {
          ...replyPlan,
          text: runtimeClaim.text,
          responseCode: `runtime_status:${runtimeClaim.capabilityId}:${runtimeClaim.status}`,
          nextState: 'waiting_user',
          runtimeCapability,
          runtimeClaim,
        }
        requestContext.runtimeCapability = runtimeCapability
      }
    }
    if (providerResponseLocale) {
      await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'translating_out', messageId })
      const localized = await localizeQl7SupportReply({
        text: replyPlan.text,
        targetLanguage: languageInput.detectedLanguage,
        translate: (payload) => deepTranslateQl7SupportText(payload),
      })
      replyPlan = { ...replyPlan, text: localized.text, translationOut: localized }
    }
    const finalResponseMode = replyPlan.responseMode || selectQl7SupportResponseModeV11({ messageAct: requestContext.messageAct, topic: requestContext.topic, diagnosticResult, tone, hasCard: Boolean(replyPlan.cardSpec), personalityState })
    const finalReplyBudget = enforceQl7SupportReplyBudgetV11(replyPlan.text, { mode: finalResponseMode, locale: providerResponseLocale || responseLocale, hardMax: 400 })
    replyPlan = { ...replyPlan, text: finalReplyBudget.text, responseMode: finalResponseMode, replyBudget: finalReplyBudget }
    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'policy_guard', messageId })
    let supportCard = supportReplyCard({ requestContext, replyPlan, diagnosticResult, locale: responseLocale, tone, sourceText: languageInput.redactedText })
    let finalInputPolicy = normalizeQl7SupportInputPolicy(runtimeV14.composerPolicy || buildQl7SupportInputPolicy({
      state: replyPlan.nextState || (diagnosticResult ? 'completed' : 'ready_for_input'),
      caseId: requestContext.caseId,
      locale: responseLocale,
      tone,
      expectedInputType: replyPlan.nextState === 'waiting_choice' ? 'choice' : 'text',
    }), { locale: responseLocale })
    if (providerResponseLocale) {
      if (supportCard && typeof supportCard === 'object') {
        const translatedCard = await localizeQl7SupportStructuredV8({ value: supportCard, targetLanguage: providerResponseLocale, translate: (payload) => deepTranslateQl7SupportText(payload), maxStrings: 64 })
        const translatedCardValue = translatedCard?.value && typeof translatedCard.value === 'object' ? translatedCard.value : supportCard
        const { integrity: _discardIntegrity, ...unsignedTranslatedCard } = translatedCardValue
        supportCard = buildQl7SupportCardV4({ ...unsignedTranslatedCard, locale: providerResponseLocale })
      }
      finalInputPolicy = await localizeQl7SupportInputPolicyV8({ policy: finalInputPolicy, targetLanguage: providerResponseLocale, translate: (payload) => deepTranslateQl7SupportText(payload) })
    }
    if (supportCard && (supportCard.kind === 'clarification_choices' || supportCard.purpose === 'choice') && (Array.isArray(supportCard.options) || supportCard.other)) {
      const signedChoices = await attachQl7SupportSignedChoicesV11({ card: supportCard, database, userId: from, ownerCaseId: requestContext.caseId })
      if (signedChoices?.signed && signedChoices.card) {
        supportCard = buildQl7SupportCardV4({ ...signedChoices.card, locale: providerResponseLocale || responseLocale })
      }
    }
    const finalProductionDelivery = finalizeQl7SupportProductionDelivery({
      productionTurn,
      replyPlan,
      surface: supportCard,
      composerPolicy: finalInputPolicy,
      locale: providerResponseLocale || responseLocale,
      topic: runtimeV14.analysis?.topic || requestContext.topic,
      messageAct: runtimeV14.analysis?.messageAct || requestContext.messageAct,
    })
    const nextMemory = registerQl7SupportReply(requestContext.memory, {
      text: replyPlan.text,
      responseCode: replyPlan.responseCode,
      messageId: '',
    })
    await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
      { _id: requestContext.caseId },
      { $set: {
        replyHistory: nextMemory.replyHistory,
        lastReplyFingerprint: nextMemory.lastReplyFingerprint,
        lastResponseCode: replyPlan.responseCode,
        nextState: replyPlan.nextState,
        topic: runtimeV14.analysis?.topic || requestContext.topic,
        messageAct: runtimeV14.analysis?.messageAct || requestContext.messageAct,
        subIntent: runtimeV14.analysis?.subIntent || requestContext.subIntent,
        productionTurnVersion: productionTurn.version,
        productionDeliveryTextHash: finalProductionDelivery.textHash,
        productionDeliverySurfaceHash: finalProductionDelivery.surfaceHash,
        productionDeliveryActionIds: finalProductionDelivery.actionIds,
        productionDeliveryResponseCode: finalProductionDelivery.responseCode,
        v14Ledger: runtimeV14.ledger,
        composerPolicy: finalInputPolicy,
        lastSurfaceHash: str(runtimeV14?.internalProvenance?.surfaceHash),
        runtimeVersion: runtimeV14.runtimeVersion,
        behaviorManifestHash: runtimeV14.behaviorManifestHash,
        updatedAt: nowIso(),
      } },
    )

    const emailContext = { ...requestContext, replyPlan }
    const materialEmailReason = ql7SupportEmailMaterialReason({ requestContext: emailContext, diagnosticResult })
    if (materialEmailReason) {
      await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'preparing_admin_report', detailCode: materialEmailReason, messageId })
    }
    let bridge = { ok: true, skipped: true, reason: 'awaiting_answer_commit' }

    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'sending', messageId })
    const autoReply = await deliverQl7SupportMessage({
      userId: from,
      userAliases: [...rawFromIds, ...(actor.aliases || [])],
      text: replyPlan.text,
      dedupeKey: buildQl7SupportDedupeKey({ userId: from, eventType: 'support_reply', subjectId: messageId }),
      eventType: 'support_reply',
      locale: providerResponseLocale || responseLocale,
      supportCard,
      clientMutationId: `reply:${mutationId}`,
      correlationId: correlation,
      triggeringUserMessageId: messageId,
      metadata: {
        caseId: requestContext.caseId,
        userMessageId: messageId,
        topic: runtimeV14.analysis?.topic || requestContext.topic,
        messageAct: runtimeV14.analysis?.messageAct || requestContext.messageAct,
        subIntent: runtimeV14.analysis?.subIntent || requestContext.subIntent,
        caseStatus: requestContext.caseStatus,
        diagnosticStatus: diagnosticResult?.status || requestContext.diagnosticStatus,
        diagnosticRunId: str(diagnosticResult?.runId || diagnosticResult?._id),
        diagnosticBranch: str(diagnosticResult?.branch),
        responseCode: replyPlan.responseCode,
        nextState: replyPlan.nextState,
        openMaterialQuestion: ['waiting_user', 'waiting_choice'].includes(str(replyPlan.nextState)),
        runtimeVersion: runtimeV14.runtimeVersion,
        behaviorManifestHash: runtimeV14.behaviorManifestHash,
        conversationDecision: str(requestContext?.conversationDecision?.decision),
        conversationReasonCode: str(requestContext?.conversationDecision?.reasonCode),
        translationStatus: languageInput.translationStatus,
        translationProvider: languageInput.translationProvider,
        supportAutoReply: true,
      },
      ts: msg.ts + 1,
      push: true,
    })
    const finalMessageId = str(autoReply?.id || autoReply?._id || autoReply?.messageId)
    const finalSurfaceHash = str(supportCard?.integrity?.signature || runtimeV14?.internalProvenance?.surfaceHash)
    if (!finalMessageId) throw new Error('ql7_support_final_message_id_missing')
    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'answer_committed', messageId, finalMessageId, surfaceHash: finalSurfaceHash, attemptId: correlation, tone, locale: providerResponseLocale || responseLocale, inputPolicy: finalInputPolicy })
    const terminalState = finalInputPolicy.allowed === false ? 'cooldown' : (replyPlan.nextState === 'waiting_choice' ? 'waiting_choice' : 'input_ready')
    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: terminalState, messageId, finalMessageId, surfaceHash: finalSurfaceHash, attemptId: correlation, tone, locale: providerResponseLocale || responseLocale, inputPolicy: finalInputPolicy })
    bridge = await maybeSendQl7SupportEmailBridge({
      fromUserId: from,
      text: languageInput.redactedText,
      messageId,
      locale: providerResponseLocale || responseLocale,
      requestContext: { ...emailContext, runtimeResult: runtimeV14, finalMessageId, surfaceHash: finalSurfaceHash },
      diagnosticResult,
    }).catch((error) => ({ ok: false, skipped: false, error: str(error?.message || error) }))

    const cognitiveTurn = await recordQl7SupportCognitiveTurnV11({
      database,
      userId: from,
      messageId,
      caseId: requestContext.caseId,
      requestContext,
      replyPlan,
      diagnosticResult,
      languageInput,
      actionIds: Array.isArray(supportCard?.actions) ? supportCard.actions.map((action) => action?.routeId || action?.id).filter(Boolean) : [],
      personalityState,
      modelVersion: 'ql7-support-v11',
      calibrationVersion: 'baseline-v11',
    }).catch(() => null)

    if (cognitiveTurn?.turnId) {
      await Promise.allSettled([
        writeQl7SupportPersonalityStateV11({ database, userId: from, state: personalityState, evidenceType: 'conversation_turn' }),
        recordQl7SupportTranslationOutcomeV11({
          database,
          userId: from,
          turnId: cognitiveTurn.turnId,
          locale: providerResponseLocale || responseLocale,
          sourceLocale: languageInput.detectedLanguage || locale,
          provider: languageInput.translationProvider,
          status: languageInput.translationStatus || 'native',
          machineFieldsPreserved: true,
          userVisibleCoverage: supportCard ? 1 : null,
        }),
        recordQl7SupportResponseQualityV11({
          database,
          userId: from,
          turnId: cognitiveTurn.turnId,
          modelVersion: 'ql7-support-v11.0.3',
          calibrationVersion: 'baseline-v11.0.3',
          metrics: {
            replyGraphemes: replyPlan?.replyBudget?.graphemes || 0,
            withinReplyBudget: Number(replyPlan?.replyBudget?.graphemes || 0) <= 4000,
            actionCount: Array.isArray(supportCard?.actions) ? supportCard.actions.length : 0,
            diagnosticStatus: str(diagnosticResult?.status),
            runtimeCapabilitySource: str(replyPlan?.runtimeCapability?.source),
            translationStatus: str(languageInput.translationStatus || 'native'),
          },
        }),
      ])
    }



    if (runtimeV14?.learningIncident) {
      await recordQl7SupportIncidentLearningCandidate({
        database,
        incident: runtimeV14.learningIncident,
        topic: runtimeV14?.plan?.topic || requestContext.topic,
        consent: false,
      }).catch(() => null)
    }

    await recordQl7LearningSignalV8({
      database,
      userId: from,
      caseId: requestContext.caseId,
      type: 'conversation_turn',
      locale: providerResponseLocale || responseLocale,
      input: languageInput.redactedText,
      output: replyPlan.text,
      outcome: diagnosticResult?.branch || replyPlan.responseCode,
      metadata: { clarificationCount: Number(requestContext?.conversationState?.turnCount || 0), chosenOption: resolvedRouteContext?.verifiedChoice?.choice?.optionId || '', cognitiveTurnId: cognitiveTurn?.turnId || '' },
    }).catch(() => null)

    if (String(replyPlan.responseCode).includes('material_update') || tone.threat) {
      await recordQl7SupportLearningSignal({
        database,
        userId: from,
        caseId: requestContext.caseId,
        topic: requestContext.topic,
        signalType: tone.threat ? 'safety_escalation' : 'anti_repetition_material_update',
        expected: 'distinct contextual reply',
        actual: replyPlan.text,
        evidence: { responseCode: replyPlan.responseCode, messageId },
      }).catch(() => null)
    }

    await completeDedupe(userDedupeKey, {
      userId: from,
      messageId,
      ts: msg.ts,
      caseId: requestContext.caseId,
      replyMessageId: str(autoReply?.id),
      correlationId: correlation,
      clientMutationId: mutationId,
    })
    return {
      ok: true,
      id: messageId,
      ts: msg.ts,
      bridge,
      autoReply,
      requestTopic: requestContext.topic,
      requestMode: requestContext.mode,
      requestRole: requestContext.role,
      requestSubIntent: requestContext.subIntent,
      caseId: requestContext.caseId,
      caseStatus: requestContext.caseStatus,
      diagnosticStatus: diagnosticResult?.status || requestContext.diagnosticStatus,
      diagnostic: diagnosticResult,
      inputPolicy: finalInputPolicy,
      ecosystemRating: requestContext.ecosystemRating,
      correlationId: correlation,
      clientMutationId: mutationId,
      productionDelivery: finalProductionDelivery,
      storagePrimary: 'mongo',
    }
  } catch (error) {
    await failDedupe(userDedupeKey, error)
    if (database) await publishStage({ database, userId: from, correlationId: correlation, state: 'error', detailCode: str(error?.message), messageId })
    throw error
  }
}


export async function cleanupQl7SupportEntryGreetingsForUser({ database, userId = '' } = {}) {
  const uid = str(userId)
  if (!database || typeof database.collection !== 'function' || !uid) return { removed: 0 }
  const collection = database.collection('ql7_support_entry_events_v8')
  const rows = await collection.find({ userId: uid, active: { $ne: false } }).sort({ createdAt: -1 }).limit(24).toArray().catch(() => [])
  let removed = 0
  for (const row of rows) {
    const messageId = str(row?.messageId)
    if (!messageId) continue
    try {
      await dmPrimary.deleteMessage(messageId)
      removed += 1
    } catch {}
  }
  if (rows.length) {
    const update = { $set: { active: false, supersededAt: nowIso(), removedFromThread: true } }
    if (typeof collection.updateMany === 'function') {
      await collection.updateMany(
        { _id: { $in: rows.map((row) => row._id).filter(Boolean) } },
        update,
      ).catch(() => null)
    } else {
      for (const row of rows) {
        await collection.updateOne({ _id: row._id }, update).catch(() => null)
      }
    }
  }
  return { removed }
}

export async function createQl7SupportEntryGreetingV8({actor=null,locale='en',entryNonce='',entryVariantId='',routeContext={}}={}){
  assertQl7SupportActive()
 const userId=str(actor?.canonicalAccountId);if(!actor?.valid||!userId){const error=new Error('verified_session_required');error.status=401;throw error}
 const database=await db();const now=Date.now();const windowMs=Math.max(5*60*1000,Math.min(24*60*60*1000,Number(process.env.QL7_SUPPORT_ENTRY_GREETING_WINDOW_MS||30*60*1000)));const bucket=Math.floor(now/windowMs);const cleanup=await cleanupQl7SupportEntryGreetingsForUser({database,userId})
 const recent=await database.collection('ql7_support_entry_events_v8').find({userId}).sort({createdAt:-1}).limit(8).toArray().catch(()=>[])
 const latestCases=await database.collection(QL7_SUPPORT_CASE_COLLECTION).find({userId}).sort({updatedAt:-1,createdAt:-1}).limit(1).toArray().catch(()=>[])
 const latestCase=latestCases[0]||null
 const latestCaseStatus=str(latestCase?.caseStatus||latestCase?.status)
 const latestCaseActive=latestCase?.active!==false&&!['closed','resolved','superseded'].includes(latestCaseStatus)
 const entryMode=latestCaseActive?'continue':(str(routeContext?.entryMode)||'fresh')
 const nonce=shortHash(`${entryNonce}:${now}:${routeContext?.pathname||''}:${Math.random()}`)
 const key=`support-entry:${userId}:${bucket}:${nonce}`
 let greeting=buildQl7SupportEntryGreetingCardV8({userId,locale,entryNonce:entryNonce||`${bucket}:${routeContext?.pathname||''}:${nonce}`,entryVariantId,entryMode,recentFingerprints:recent.map(x=>String(x.fingerprint||'')),timeZone:routeContext?.browserTimeZone||'UTC',now})
 if(isQl7SupportProviderLocaleV8(locale)){
  const localizedText=await localizeQl7SupportReply({text:greeting.text,targetLanguage:locale,translate:(payload)=>deepTranslateQl7SupportText(payload)})
  const localizedCard=await localizeQl7SupportStructuredV8({value:greeting.card,targetLanguage:locale,translate:(payload)=>deepTranslateQl7SupportText(payload),maxStrings:12})
  const{integrity:_discard,...unsigned}=localizedCard.value||greeting.card
  greeting={...greeting,text:localizedText.text,locale,supportCardTranslationStatus:localizedCard.status,card:buildQl7SupportCard({...unsigned,locale})}
 }
 const delivered=await deliverQl7SupportMessage({userId,userAliases:actor.aliases||[],text:greeting.text,dedupeKey:key,eventType:'entry_greeting',locale:greeting.locale,supportCard:greeting.card,clientMutationId:`entry:${bucket}:${nonce}`.slice(0,160),correlationId:`entry:${bucket}:${nonce}`.slice(0,160),metadata:{entryGreeting:true,bucket,fingerprint:greeting.fingerprint,entryVariantId:greeting.id,entryMode,activeCaseId:str(latestCase?._id||latestCase?.caseId),activeCaseStatus:latestCaseStatus,routeContext,providerBackedLocale:isQl7SupportProviderLocaleV8(locale),supersededEntryGreetings:cleanup.removed},ts:now,push:false})
 await database.collection('ql7_support_entry_events_v8').updateOne({_id:key},{$set:{userId,messageId:String(delivered.id||''),fingerprint:greeting.fingerprint,locale:greeting.locale,entryMode,activeCaseId:str(latestCase?._id||latestCase?.caseId),activeCaseStatus:latestCaseStatus,createdAt:new Date(now).toISOString(),expiresAt:new Date(now+windowMs*2).toISOString(),active:true,supersededEntryGreetings:cleanup.removed}},{upsert:true})
 return{ok:true,deduped:false,messageId:String(delivered.id||''),bucket,entryVariantId:greeting.id,entryMode,activeCaseId:str(latestCase?._id||latestCase?.caseId),activeCaseStatus:latestCaseStatus,supersededEntryGreetings:cleanup.removed}
}


export async function removeQl7SupportEntryGreetingsV11({ actor = null } = {}) {
  assertQl7SupportActive()
  const userId = str(actor?.canonicalAccountId)
  if (!actor?.valid || !userId) {
    const error = new Error('verified_session_required')
    error.status = 401
    throw error
  }
  const database = await db()
  const cleanup = await cleanupQl7SupportEntryGreetingsForUser({ database, userId })
  return { ok: true, removed: cleanup.removed, userId }
}

export async function deliverQl7SupportMessage({
  userId,
  userAliases = [],
  text,
  dedupeKey,
  eventType = 'manual',
  locale = '',
  payload = null,
  metadata = null,
  supportCard = null,
  clientMutationId = '',
  correlationId = '',
  triggeringUserMessageId = '',
  ts = Date.now(),
  push = true,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const target = str(userId)
  if (!target || isQl7SupportId(target)) {
    const error = new Error('ql7_support_bad_target')
    error.status = 400
    throw error
  }
  const key = assertQl7SupportDedupeKey(dedupeKey)
  const event = str(eventType) || 'manual'
  const lang = normalizeQl7SupportLocale(locale)
  const cleanText = normalizeQl7SupportText(
    text || buildQl7SupportMessage({
      eventType,
      locale: lang,
      payload: payload || metadata || {},
    }),
  )
  if (!cleanText) {
    const error = new Error('ql7_support_text_required')
    error.status = 400
    throw error
  }

  const reservation = await reserveDedupe(key, {
    userId: target,
    eventType: event,
  })
  if (reservation.doc?.messageId) {
    return {
      ok: true,
      deduped: true,
      id: String(reservation.doc.messageId),
      ts: Number(reservation.doc.ts || 0),
      storagePrimary: 'mongo',
    }
  }
  if (!reservation.created && !reservation.doc?.messageId) {
    return { ok: true, deduped: true, pending: true, storagePrimary: 'mongo' }
  }

  const validatedCard = supportCard ? validateQl7SupportCardAnyVersion(supportCard) : { ok: true, card: null }
  if (!validatedCard.ok) {
    const error = new Error(`ql7_support_card_${validatedCard.error}`)
    error.status = 400
    throw error
  }
  await dmPrimary.addAliasesFor(target, userAliases)
  const toIds = await dmPrimary.expandAliasIds([target, ...userAliases])
  const id = String(await dmPrimary.nextMsgId())
  const msg = {
    id,
    from: QL7_SUPPORT_ID,
    to: target,
    text: cleanText,
    attachments: [],
    ts: Number(ts || Date.now()),
    isSystem: true,
    systemRole: QL7_SUPPORT_SYSTEM_ROLE,
    supportThread: true,
    ...supportThreadEndpointProof(target),
    supportEventType: event,
    localeAtDelivery: lang,
    dedupeKey: key,
    clientMutationId: safeClientMutationId(clientMutationId),
    correlationId: safeClientMutationId(correlationId),
    triggeringUserMessageId: str(triggeringUserMessageId),
    supportCard: validatedCard.card || null,
    metadata: jsonClone(metadata || payload) || null,
  }

  await dmPrimary.saveMessage(msg)
  await dmPrimary.addMessageIndexes({
    msg,
    fromIds: [QL7_SUPPORT_ID],
    toIds,
    score: Number(msg.ts || Date.now()),
  })
  await completeDedupe(key, {
    userId: target,
    messageId: id,
    ts: msg.ts,
  })

  if (push) {
    const stableBroadcastId = str(payload?.broadcastId || metadata?.broadcastId || '')
    const pushDedupeKey = event === 'broadcast' && stableBroadcastId
      ? `ql7-support:broadcast:${stableBroadcastId}`
      : `ql7-support:${key}`
    await sendBackgroundPush(target, {
      source: 'messenger_messages',
      dedupeKey: pushDedupeKey,
      itemId: id,
    }).catch(() => {})
  }

  return { ok: true, id, ts: msg.ts, deduped: false, storagePrimary: 'mongo' }
}

export async function deliverQl7SupportEvent({
  userId,
  userAliases = [],
  eventType = 'manual',
  subjectId = '',
  locale = '',
  payload = {},
  metadata = null,
  supportCard = null,
  clientMutationId = '',
  correlationId = '',
  triggeringUserMessageId = '',
  dedupeKey = '',
  ts = Date.now(),
  push = true,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const key = str(dedupeKey) || buildQl7SupportDedupeKey({
    userId,
    eventType,
    subjectId,
    timestamp: payload?.timestamp || metadata?.timestamp || '',
    nonce: payload?.nonce || metadata?.nonce || '',
  })
  return deliverQl7SupportMessage({
    userId,
    userAliases,
    eventType,
    locale,
    payload,
    metadata: metadata || payload,
    supportCard,
    clientMutationId,
    correlationId,
    triggeringUserMessageId,
    dedupeKey: key,
    ts,
    push,
  })
}
