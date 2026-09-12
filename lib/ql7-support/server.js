import crypto from 'node:crypto'
import dmPrimary from '../mongo/dm-primary.cjs'
import mongoClient from '../mongo/client.cjs'
import {sendSupportEmail} from '../supportEmailTransport.js'
import {sendBackgroundPush} from '../webPush.js'
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
  normalizeQl7SupportLocale,
} from './runtime/transportContract.js'
import {
  assessQl7SupportCaseMemoryProjection,
  QL7_SUPPORT_CASE_COLLECTION,
  createQl7SupportCaseId,
  redactQl7SupportSecrets,
} from './runtime/caseStoreContract.js'
import {isQl7SupportDiagnosticTopic} from './diagnostics.js'
import {translateQl7SupportTextNative} from './nativeTranslationService.js'
import {prepareQl7SupportLanguageInput} from './languageOrchestrator.js'
import {localizeQl7SupportFinalDelivery} from './language/finalDeliveryLocalization.js'
import {assessQl7SupportTone} from './toneAssessment.js'
import {
  executeQl7SupportProductionTurn,
  resolveQl7SupportDeliverySigningMaterialForServer,
} from './runtime/productionTurn.js'
import {
  commitQl7SupportFinalDelivery,
  createQl7SupportMongoDeliveryStore,
} from './runtime/deliveryCommitCoordinator.js'
import {recoverQl7SupportDeliveryCommits as recoverDeliveryCommitsWorker} from './runtime/commitRecoveryWorker.js'
import {acquireQl7TurnSequence, bindQl7TurnSequenceDelivery, createMongoQl7TurnSequenceStore, releaseQl7TurnSequence, validateQl7TurnSequenceBeforeTransport} from './runtime/turnSequencer.js'
import {createQl7RuntimeStatePublicationFailureReceipt} from './runtime/runtimeStatePublicationReceipt.js'
import {deriveQl7EntrySession, commitQl7EntryGreeting} from './greeting/entrySession.js'
import {hashQl7SupportDeliveryText, projectQl7SupportPublicCommittedDelivery} from './contracts/finalDeliveryReceipt.js'
import {buildQl7SupportOperatorCase} from './operator/buildCase.js'
import {analyzeQl7SupportTurn} from './semantics/analyzeTurn.js'
import {buildQl7SupportCanonicalTurnContextAsync} from './runtime/canonicalContext.js'
import {createQl7SupportMemoryStore} from './conversation/memoryStore.js'
import {normalizeQl7SupportTimeZone} from './conversation/temporalContext.js'
import {buildQl7SupportSurfaceSpec} from './presentation/buildSupportSurface.js'
import {receiptFromQl7Diagnostic} from './data/adapterReceipt.js'
import {assertQl7SupportActive, isQl7SupportActive} from './config/featureFlag.js'
import {runQl7SupportPremiumDiagnostic} from './diagnosticRegistry.js'
import {buildQl7SupportCard, validateQl7SupportCard} from './cardSchema.js'
import {
  publishQl7SupportRuntimeState,
  readQl7SupportRuntimeState,
} from './runtimeStateMachine.js'
import {publicQl7VerifiedActorProjection} from './identityResolver.js'
import {recordQl7SupportIncidentLearningCandidate, recordQl7SupportLearningSignal} from './learningPipeline.js'
import {enqueueQl7SupportEmail, processQl7SupportEmailOutbox} from './emailOutboxWorker.js'
import {
  buildQl7SupportInputPolicy,
  normalizeQl7SupportInputPolicy,
} from './inputPolicy.js'
import {buildQl7SupportDiagnosticFailureResult} from './diagnosticFailure.js'
import {calculateQl7EcosystemRating} from './ecosystemRating.js'
import {assertQl7SupportUserInput, enforceQl7SupportReplyBudget} from './limits.js'
import {consumeQl7SupportChoice} from './choiceContract.js'
import {selectQl7SupportResponseMode} from './personalityEngine.js'
import {
  readQl7SupportPersonalityState,
  buildQl7SupportPersonalityState,
  readQl7SupportRuntimeCapability,
  recordQl7SupportCanonicalTurnTelemetry,
  writeQl7SupportCanonicalPersonalityState,
  recordQl7SupportCanonicalTranslationOutcome,
  recordQl7SupportCanonicalResponseQuality,
  recordQl7SupportCanonicalLearningObservation,
} from './telemetry/canonicalTelemetry.js'
import {
  buildQl7SupportEventEnvelope,
  validateQl7SupportEventEnvelope,
} from './eventNotificationCatalog.js'

const DEDUPE_COLLECTION = 'ql7_support_message_dedupe'
const REQUESTS_COLLECTION = 'ql7_support_user_requests'
const ENTRY_EVENTS_COLLECTION = 'ql7_support_entry_events'
const EVENT_ENVELOPES_COLLECTION = 'ql7_support_event_envelopes'
const TURN_LEASES_COLLECTION = 'ql7_support_conversation_turn_leases'
export const QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION = 'support_email_outbox'
const DEDUPE_INDEX_KEY = '__ql7SupportDedupeIndexes'

let ql7SupportTestDb = null
const ql7SupportMongoClientByDatabase = new WeakMap()

function str(value) {
  return String(value ?? '').trim()
}

function jsonClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null }
}

function shortHash(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex').slice(0, 16)
}

function buildQl7SupportLegacyReplyProjection(previous = {}, { text = '', responseCode = '', messageId = '' } = {}) {
  const rows = Array.isArray(previous?.replyHistory) ? previous.replyHistory.slice(-31) : []
  const cleanText = str(text)
  const fingerprint = shortHash(cleanText.toLowerCase())
  const nextRow = Object.freeze({
    messageId: str(messageId),
    responseCode: str(responseCode),
    fingerprint,
    textHash: hashQl7SupportDeliveryText(cleanText),
    at: nowIso(),
    compatibilityOnly: true,
  })
  return Object.freeze({
    replyHistory: Object.freeze([...rows, nextRow].slice(-32)),
    lastReplyFingerprint: fingerprint,
  })
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
  if (handle?.client?.startSession) ql7SupportMongoClientByDatabase.set(database, handle.client)
  if (!globalThis[DEDUPE_INDEX_KEY]) {
    globalThis[DEDUPE_INDEX_KEY] = Promise.all([
      database.collection(DEDUPE_COLLECTION).createIndex({ dedupeKey: 1 }, { unique: true }),
      database.collection(DEDUPE_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_message_dedupe' }),
      database.collection(REQUESTS_COLLECTION).createIndex({ userId: 1, topic: 1 }, { unique: true }),
      database.collection(REQUESTS_COLLECTION).createIndex({ updatedAt: -1 }),
      database.collection(QL7_SUPPORT_CASE_COLLECTION).createIndex({ caseId: 1 }, { unique: true }),
      database.collection(QL7_SUPPORT_CASE_COLLECTION).createIndex({ userId: 1, active: 1, updatedAt: -1 }),
      database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).createIndex({ userId: 1, caseId: 1, updatedAt: -1 }),
      database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_email_terminal' }),
      database.collection('ql7_support_ui_events').createIndex({ userId: 1, correlationId: 1, changedAt: -1 }),
      database.collection('ql7_support_ui_events').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_ui_events' }),
      database.collection('ql7_support_runtime_state_publication_failures').createIndex({ receiptHash: 1 }, { unique: true }),
      database.collection('ql7_support_security_audit').createIndex({ createdAt: -1 }),
      database.collection('ql7_support_learning_candidates').createIndex({ caseId: 1, status: 1, createdAt: -1 }),
      database.collection('ql7_support_turn_decisions').createIndex({ caseId: 1, messageId: 1 }),
      database.collection(ENTRY_EVENTS_COLLECTION).createIndex({ userId: 1, active: 1, createdAt: -1 }),
      database.collection(ENTRY_EVENTS_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_support_entry_events' }),
      database.collection(EVENT_ENVELOPES_COLLECTION).createIndex({ eventId: 1 }, { unique: true }),
      database.collection(EVENT_ENVELOPES_COLLECTION).createIndex({ recipientIdHash: 1, occurredAtServerUtc: -1 }),
      database.collection(TURN_LEASES_COLLECTION).createIndex({ leaseUntil: 1 }),
    ])
      .catch((error) => {
        delete globalThis[DEDUPE_INDEX_KEY]
        throw error
      })
  }
  await globalThis[DEDUPE_INDEX_KEY]
  return database
}

function createQl7SupportDeliveryStore(database, options = {}) {
  return createQl7SupportMongoDeliveryStore({
    database,
    mongoClient: ql7SupportMongoClientByDatabase.get(database) || null,
    ...options,
  })
}

function mongoOperationOptions(context = {}, base = {}) {
  return context?.session ? { ...base, session: context.session } : base
}

async function acquireCanonicalQl7TurnSequence(database, {
  userId = '',
  conversationId = 'ql7-support',
  clientMutationId = '',
  waitMs = 90_000,
  leaseMs = 120_000,
  clock = () => Date.now(),
} = {}) {
  const actorHash = hashQl7SupportDeliveryText(userId)
  const store = createMongoQl7TurnSequenceStore({ database, collectionName: TURN_LEASES_COLLECTION, clock })
  return acquireQl7TurnSequence({ actorHash, conversationId: str(conversationId || 'ql7-support'), clientMutationId: str(clientMutationId), waitMs, leaseMs, clock, store })
}

async function releaseCanonicalQl7TurnSequence(database, lease = {}, clock = () => Date.now()) {
  if (!lease) return false
  const store = createMongoQl7TurnSequenceStore({ database, collectionName: TURN_LEASES_COLLECTION, clock })
  return releaseQl7TurnSequence(lease, { store })
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

async function reserveDedupe(dedupeKey, patch = {}, transactionContext = {}) {
  const database = transactionContext?.database || await db()
  const at = nowIso()
  const id = `ql7-support:${dedupeKey}`
  const doc = {
    _id: id,
    dedupeKey,
    status: 'reserved',
    ...patch,
    createdAt: at,
    updatedAt: at,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    storagePrimary: 'mongo',
  }
  try {
    await database.collection(DEDUPE_COLLECTION).insertOne(doc, mongoOperationOptions(transactionContext))
    return { doc, created: true }
  } catch (error) {
    if (error?.code !== 11000) throw error
    const existing = await database.collection(DEDUPE_COLLECTION).findOne(
      { _id: id },
      mongoOperationOptions(transactionContext),
    )
    if (existing?.status === 'failed') {
      await database.collection(DEDUPE_COLLECTION).updateOne(
        { _id: id, status: 'failed' },
        { $set: { ...patch, status: 'reserved', updatedAt: at, lastError: '', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
        mongoOperationOptions(transactionContext),
      )
      return { doc: { ...existing, ...patch, status: 'reserved', updatedAt: at }, created: true, retried: true }
    }
    return { doc: existing, created: false }
  }
}

async function failDedupe(dedupeKey, error, transactionContext = {}) {
  const database = transactionContext?.database || await db()
  await database.collection(DEDUPE_COLLECTION).updateOne(
    { _id: `ql7-support:${dedupeKey}` },
    { $set: { status: 'failed', lastError: str(error?.message || error).slice(0, 500), updatedAt: nowIso(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
    mongoOperationOptions(transactionContext),
  ).catch(() => null)
}

async function completeDedupe(dedupeKey, patch = {}, transactionContext = {}) {
  const database = transactionContext?.database || await db()
  const at = nowIso()
  await database.collection(DEDUPE_COLLECTION).updateOne(
    { _id: `ql7-support:${dedupeKey}` },
    {
      $set: {
        ...patch,
        status: 'sent',
        updatedAt: at,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        storagePrimary: 'mongo',
      },
    },
    mongoOperationOptions(transactionContext, { upsert: false }),
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
  translatedMeaningRu = '',
  operatorTranslationStatus = '',
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
    translatedMeaning: translatedMeaningRu || (String(locale).toLowerCase().startsWith('ru') ? safeText : ''),
    translationStatus: operatorTranslationStatus || (String(locale).toLowerCase().startsWith('ru') ? 'same_locale' : (translatedMeaningRu ? 'translated' : 'unavailable')),
    timeline,
    smtpStatus: 'prepared_not_sent',
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
    subject: `Обращение поддержки${messageId ? ` #${messageId}` : ''}${caseId ? ` / ${caseId}` : ''}`,
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
      title: 'Подробный отчёт поддержки оператору',
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

export async function sendQl7SupportEmailBridge() {
  const error = new Error('ql7_support_direct_smtp_bypass_forbidden')
  error.code = 'ql7_support_direct_smtp_bypass_forbidden'
  error.status = 409
  throw error
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
    ...(status === 'suppressed' ? { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } : {}),
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_EMAIL_OUTBOX_COLLECTION).updateOne(
    { _id: id },
    {
      $set: patch,
      ...(status === 'suppressed' ? {} : { $unset: { expiresAt: '' } }),
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

  let translatedMeaningRu = ''
  let operatorTranslationStatus = str(locale).toLowerCase().startsWith('ru') ? 'same_locale' : 'unavailable'
  if (operatorTranslationStatus !== 'same_locale') {
    try {
      const translated = await translateQl7SupportTextNative({ text: redactQl7SupportSecrets(text), sourceLang: locale || 'auto', targetLang: 'ru', purpose: 'operator_report_ru' })
      if (translated?.provider && translated.provider !== 'fallback_original' && str(translated.text)) { translatedMeaningRu = str(translated.text); operatorTranslationStatus = 'translated' }
    } catch {}
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
    translatedMeaningRu,
    operatorTranslationStatus,
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
  const at = nowIso()
  const analysisText = str(languageInput?.canonicalText || text)
  const inputHadSecret = Boolean(
    String(languageInput?.originalText ?? '') !== String(languageInput?.redactedText ?? ''),
  )
  const withInputPrivacyEvidence = (source = {}) => Object.freeze({
    ...source,
    entities: Object.freeze({
      ...(source?.entities && typeof source.entities === 'object' ? source.entities : {}),
      hasSecret: inputHadSecret || source?.entities?.hasSecret === true,
    }),
    inputPrivacy: Object.freeze({
      rawSecretDetected: inputHadSecret,
      rawTextStored: false,
      semanticRuntimeReceivesRedactedTextOnly: true,
    }),
  })
  if (!uid) {
    const canonical = await buildQl7SupportCanonicalTurnContextAsync({
      text: analysisText,
      locale: languageInput?.detectedLanguage || locale,
      conversationId: `anonymous:${str(messageId) || shortHash(analysisText)}`,
      turnId: str(messageId),
      previousCase: {},
      verifiedChoice: routeContext?.verifiedChoice || null,
      tone: tone || {},
      now: at,
    })
    return {
      topic: canonical.analysis.topic,
      role: canonical.analysis.role,
      messageAct: canonical.analysis.messageAct,
      subIntent: canonical.analysis.subIntent,
      caseId: canonical.memoryGraph.conversationId,
      caseStatus: canonical.conversationDecision.caseStatus,
      diagnosticStatus: canonical.conversationDecision.diagnosticStatus,
      analysis: withInputPrivacyEvidence(canonical.analysis),
      route: canonical.route,
      conversationMemoryGraph: canonical.memoryGraph,
      semanticNoveltyLedger: null,
      actor: publicQl7VerifiedActorProjection(actor),
      routeContext: jsonClone(routeContext) || {},
      tone: jsonClone(canonical.tone) || {},
      conversationDecision: jsonClone(canonical.conversationDecision) || {},
      conversationState: { transition: canonical.transition },
      openCases: [],
      mode: 'new',
      count: 1,
    }
  }

  const database = await db()
  const activeCases = await database.collection(QL7_SUPPORT_CASE_COLLECTION)
    .find({ userId: uid, active: true })
    .sort({ updatedAt: -1 })
    .limit(8)
    .toArray()
  const authoritativeChoice = routeContext?.verifiedChoice?.selected === true ? routeContext.verifiedChoice.choice : null
  const selectedCaseId = str(authoritativeChoice?.targetCaseId || authoritativeChoice?.ownerCaseId || routeContext?.supportChoice?.caseId)
  const previousCase = (selectedCaseId ? activeCases.find((item) => str(item?.caseId || item?._id) === selectedCaseId) : null) || activeCases?.[0] || null
  const provisionalConversationId = str(previousCase?.caseId || previousCase?._id || `support:${uid}:${shortHash(str(messageId) || analysisText)}`)
  const canonicalMemoryStore = createQl7SupportMemoryStore({ database })
  const persistedMemoryGraph = await canonicalMemoryStore.read(provisionalConversationId).catch(() => null)
  const previousCaseForCanonical = persistedMemoryGraph
    ? { ...(previousCase || {}), conversationMemoryGraph: persistedMemoryGraph }
    : (previousCase || {})
  let canonical = await buildQl7SupportCanonicalTurnContextAsync({
    text: analysisText,
    locale: languageInput?.detectedLanguage || locale,
    conversationId: provisionalConversationId,
    turnId: str(messageId),
    previousCase: previousCaseForCanonical,
    verifiedChoice: routeContext?.verifiedChoice || null,
    tone: tone || {},
    now: at,
  })
  const explicitNewCaseRequested = Boolean(previousCase?._id && canonical.analysis?.messageAct === 'new_unrelated_issue')
  const forcedNewCaseId = explicitNewCaseRequested
    ? createQl7SupportCaseId(uid, canonical.analysis?.topic || 'support_system', messageId)
    : ''
  if (forcedNewCaseId) {
    // A user-declared unrelated issue owns a fresh canonical conversation/memory identity.
    // Rebuilding before any persistence prevents the old case CAS graph from being committed
    // under the new case id and keeps the previous case available only as history.
    canonical = await buildQl7SupportCanonicalTurnContextAsync({
      text: analysisText,
      locale: languageInput?.detectedLanguage || locale,
      conversationId: forcedNewCaseId,
      turnId: str(messageId),
      previousCase: {},
      verifiedChoice: routeContext?.verifiedChoice || null,
      tone: tone || {},
      now: at,
    })
  }
  const analysis = Object.freeze({
    ...withInputPrivacyEvidence(canonical.analysis),
    selectedLocale: str(locale || languageInput?.detectedLanguage || canonical.analysis.locale),
    detectedLanguage: str(languageInput?.detectedLanguage || canonical.analysis.locale),
    translationStatus: str(languageInput?.translationStatus || 'native'),
    translationProvider: str(languageInput?.translationProvider),
    translationRequired: languageInput?.translationRequired === true,
    canonicalTextHash: str(languageInput?.translationEvidenceHash || canonical.analysis.fingerprint),
    caseStatus: canonical.conversationDecision.caseStatus,
    diagnosticStatus: canonical.conversationDecision.diagnosticStatus,
    conversationDecision: canonical.conversationDecision,
  })
  const conversationDecision = canonical.conversationDecision
  const explicitNewUnrelatedIssue = Boolean(explicitNewCaseRequested && analysis.messageAct === 'new_unrelated_issue')
  const closeExisting = previousCase?._id && (conversationDecision.closed || conversationDecision.abandoned)
  if (closeExisting || explicitNewUnrelatedIssue) {
    await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
      { _id: previousCase._id },
      { $set: {
        active: false,
        caseStatus: explicitNewUnrelatedIssue
          ? 'superseded'
          : conversationDecision.closed ? 'closed' : 'abandoned',
        supersededAt: explicitNewUnrelatedIssue ? at : previousCase.supersededAt,
        updatedAt: at,
        storagePrimary: 'mongo',
      } },
    )
  }
  const caseSource = (closeExisting || explicitNewUnrelatedIssue) ? null : previousCase
  const caseId = str(forcedNewCaseId || caseSource?.caseId || caseSource?._id || createQl7SupportCaseId(uid, analysis.topic, messageId))
  const casePatch = {
    caseId,
    userId: uid,
    active: true,
    caseStatus: analysis.caseStatus,
    diagnosticStatus: analysis.diagnosticStatus,
    topic: analysis.topic,
    subIntent: analysis.subIntent,
    messageAct: analysis.messageAct,
    entities: Object.freeze({
      ...(caseSource?.entities && typeof caseSource.entities === 'object' ? caseSource.entities : {}),
      ...(analysis.entities && typeof analysis.entities === 'object' ? analysis.entities : {}),
    }),
    confidence: analysis.confidence,
    alternatives: analysis.alternatives,
    canonicalPreRuntimeOwner: 'runtime/canonicalContext.js',
    canonicalSemanticOwner: 'semantics/analyzeTurn.js',
    canonicalMemoryOwner: 'conversation/conversationMemoryGraph.js',
    canonicalMemoryStoreOwner: 'conversation/memoryStore.js',
    canonicalTransitionOwner: 'conversation/transitionClassifier.js',
    conversationDecision: jsonClone(conversationDecision) || {},
    preRuntimeTransition: jsonClone(canonical.transition) || {},
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
    verifiedActor: publicQl7VerifiedActorProjection(actor),
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

  const topic = analysis.topic || 'support_system'
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
        lastTextPreview: str(languageInput?.redactedText || text).slice(0, 280),
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
    route: canonical.route,
    replyHistory: Array.isArray(caseSource?.replyHistory) ? caseSource.replyHistory.slice(-32) : [],
    lastReplyFingerprint: str(caseSource?.lastReplyFingerprint),
    conversationMemoryGraph: canonical.memoryGraph,
    conversationMemoryHash: canonical.memoryGraph.memoryHash,
    conversationMemoryVersion: canonical.memoryGraph.memoryVersion,
    semanticNoveltyLedger: jsonClone(caseSource?.semanticNoveltyLedger) || null,
    actor: publicQl7VerifiedActorProjection(actor),
    routeContext: jsonClone(routeContext) || {},
    tone: jsonClone(canonical.tone) || {},
    conversationDecision: jsonClone(conversationDecision) || {},
    conversationState: { transition: canonical.transition },
    openCases: activeCases.map((item) => ({
      caseId: str(item.caseId || item._id),
      topic: str(item.topic),
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
  const canonicalSurface = replyPlan?.cardSpec?.schema === 'ql7.support.surface' ? replyPlan.cardSpec : null
  if (canonicalSurface) {
    return buildQl7SupportCard({
      ...canonicalSurface,
      locale,
      caseId: canonicalSurface.caseId || requestContext.caseId,
      asOf: canonicalSurface.checkedAt || '',
      checkedAt: canonicalSurface.checkedAt || '',
    })
  }
  const receipts = Array.isArray(replyPlan?.adapterReceipts)
    ? replyPlan.adapterReceipts
    : (diagnosticResult ? [receiptFromQl7Diagnostic(diagnosticResult)] : [])
  const surfaceSpec = buildQl7SupportSurfaceSpec({
    plan: replyPlan?.contentPlan || {},
    replyPlan: replyPlan || {},
    text: replyPlan?.text || sourceText || '',
    locale,
    receipts,
    diagnosticResult,
    requestContext,
    tone,
  })
  return buildQl7SupportCard({
    ...surfaceSpec,
    locale,
    caseId: surfaceSpec.caseId || requestContext.caseId,
    asOf: surfaceSpec.checkedAt || '',
    checkedAt: surfaceSpec.checkedAt || '',
  })
}

async function localizeQl7SupportFinalDeliveryBeforeQuality(payload = {}) {
  return localizeQl7SupportFinalDelivery(payload)
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
  try {
    return await publishQl7SupportRuntimeState({
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
    })
  } catch (error) {
    const failureReceipt = createQl7RuntimeStatePublicationFailureReceipt({ userId, correlationId, attemptId, state, sequence, error })
    // Restricted observability is best-effort, but the failure is always returned to the canonical caller
    // as a typed receipt. No catch(()=>null) path can erase it.
    try {
      await database.collection('ql7_support_runtime_state_publication_failures').updateOne(
        { receiptHash: failureReceipt.receiptHash },
        { $setOnInsert: failureReceipt },
        { upsert: true },
      )
    } catch (recordError) {
      console.warn('[QL7_SUPPORT_RUNTIME_STATE_PUBLICATION_FAILURE_RECORD_FAILED]', {
        receiptHash: failureReceipt.receiptHash,
        recordErrorHash: shortHash(recordError?.message || recordError),
      })
    }
    return Object.freeze({ ok: false, publicationFailed: true, reconciliationRequired: true, failureReceipt })
  }
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
  requestBoundary = null,
  rawInputEvidence = null,
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
  const inputValidation = assertQl7SupportUserInput(cleanText, { locale: locale || 'en' })
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
  const verifiedChoice = await consumeQl7SupportChoice({ database, userId: from, supportChoice: routeContext?.supportChoice }).catch((error) => ({ ok: false, error: str(error?.message || error) }))
  if (verifiedChoice?.ok === false) {
    const error = new Error(str(verifiedChoice.error || 'choice_validation_failed'))
    error.status = 400
    throw error
  }
  const resolvedRouteContext = {
    ...routeContext,
    browserTimeZone: normalizeQl7SupportTimeZone(routeContext?.browserTimeZone || 'UTC'),
    inputGraphemes: inputValidation.graphemes,
    verifiedChoice,
    choiceAuthority: verifiedChoice?.selected === true ? 'signed_choice_authoritative' : 'none',
  }
  let messageId = ''
  let turnLease = null
  try {
    turnLease = await acquireCanonicalQl7TurnSequence(database, {
      userId: from,
      conversationId: str(resolvedRouteContext?.conversationId || resolvedRouteContext?.threadId || 'ql7-support'),
      clientMutationId: mutationId,
      waitMs: 90_000,
    })
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
      translate: (payload) => translateQl7SupportTextNative(payload),
    })
    if (languageInput.translationRequired === true && languageInput.translationStatus !== 'translated') {
      const translationError = new Error('support_input_locale_temporarily_unavailable')
      translationError.code = 'support_input_locale_temporarily_unavailable'
      translationError.status = 503
      translationError.locale = languageInput.detectedLanguage || locale
      throw translationError
    }
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
      requestContext?.analysis?.intentConfirmation?.adapterAuthorized === true &&
      requestContext?.analysis?.adapterEligibility?.mongoReadAllowed === true &&
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
    const previousPersonalityState = await readQl7SupportPersonalityState({ database, userId: from }).catch(() => null)
    const personalityState = buildQl7SupportPersonalityState({ previous: previousPersonalityState, locale: languageInput.detectedLanguage || locale, evidence: [] })
    const runtimeCapability = ['roadmap_question', 'when_question'].includes(str(requestContext.messageAct))
      ? await readQl7SupportRuntimeCapability({ database, topic: requestContext.topic }).catch(() => null)
      : null
    const productionTurnInput = {
      mode: 'production',
      requestId: correlation,
      userTurnId: messageId,
      caseId: requestContext.caseId,
      actor: requestContext.actor,
      originalText: languageInput.redactedText,
      translatedMeaning: languageInput.canonicalText,
      detectedLocale: languageInput.detectedLanguage,
      selectedLocale: languageInput.detectedLanguage || locale,
      browserTimeZone: normalizeQl7SupportTimeZone(resolvedRouteContext?.browserTimeZone || 'UTC'),
      analysis: requestContext.analysis,
      authoritativeAnalysis: true,
      baseAnalysisTrust: true,
      route: requestContext.route,
      priorMemoryGraph: requestContext.conversationMemoryGraph || null,
      priorNoveltyLedger: requestContext.semanticNoveltyLedger || null,
      productionQuestionCode: requestContext.memory?.currentQuestionCode ||
        requestContext.analysis?.currentQuestionCode ||
        '',
      diagnosticResult,
      openCases: requestContext.openCases || [],
      runtimeCapability,
      tone,
      conversationDecision: requestContext.conversationDecision,
      contextualFollowup: requestContext.mode === 'followup',
      now: nowIso(),
      seed: `${from}:${messageId}:${mutationId}`,
      clientMutationId: mutationId,
      idempotencyKey: `support-delivery:${from}:${mutationId}`,
      verifiedActorId: from,
      actorReceiptId: str(actor?.actorReceiptId),
      routeId: 'dm.support-send.post',
      sourceRouteId: 'dm.support-send.post',
      sourceSurfaceId: 'messenger.support',
      requestBoundary,
      rawInputEvidence: rawInputEvidence && typeof rawInputEvidence === 'object'
        ? Object.freeze({ ...rawInputEvidence })
        : Object.freeze({
            rawInputHash: hashQl7SupportDeliveryText(cleanText),
            rawInputByteLength: Buffer.byteLength(cleanText, 'utf8'),
            rawInputGraphemeLength: Number(inputValidation.graphemes || Array.from(cleanText).length),
          }),
      turnSequenceReceipt: turnLease,
      localizeFinalDelivery: (payload) => localizeQl7SupportFinalDeliveryBeforeQuality(payload),
    }
    const productionTurn = await executeQl7SupportProductionTurn(productionTurnInput)
    const canonicalRuntime = productionTurn.runtime
    const preparedDelivery = productionTurn.delivery
    const responseLocale = preparedDelivery.locale
    const providerResponseLocale = productionTurn.localePolicy.supported ? '' : responseLocale
    const replyPlan = Object.freeze({
      ...canonicalRuntime.replyPlan,
      text: preparedDelivery.text,
      cardSpec: preparedDelivery.surface,
    })
    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'policy_guard', messageId })
    const supportCard = preparedDelivery.surface
    const finalInputPolicy = preparedDelivery.composerPolicy

    const emailContext = { ...requestContext, replyPlan }
    const materialEmailReason = ql7SupportEmailMaterialReason({ requestContext: emailContext, diagnosticResult })
    if (materialEmailReason) {
      await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'preparing_admin_report', detailCode: materialEmailReason, messageId })
    }
    let bridge = { ok: true, skipped: true, reason: 'awaiting_answer_commit' }

    await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'sending', messageId })
    const signing = await resolveQl7SupportDeliverySigningMaterialForServer({ mode: 'production' }, canonicalRuntime)
    const deliveryStore = createQl7SupportDeliveryStore(database)
    let autoReply = null
    const finalProductionDelivery = await commitQl7SupportFinalDelivery({
      candidate: preparedDelivery,
      runtime: canonicalRuntime,
      signingKey: signing.signingKey,
      keyId: signing.keyId,
      store: deliveryStore,
      transactionalTransport: true,
      regenerateCandidate: ({ attempt, collisionReceipt }) => executeQl7SupportProductionTurn({
        ...productionTurnInput,
        seed: `${productionTurnInput.seed}:novelty-reservation:${attempt}`,
        noveltyCollisionReceipt: collisionReceipt,
      }),
      transport: async (candidate, transactionContext = {}) => {
        const sequenceStore = createMongoQl7TurnSequenceStore({ database, collectionName: TURN_LEASES_COLLECTION })
        const sequenceValidation = await validateQl7TurnSequenceBeforeTransport(turnLease, {
          memoryVersionCurrent: Number(canonicalRuntime?.memoryGraph?.memoryVersion || 0),
          memoryVersionPlanned: Number(canonicalRuntime?.memoryGraph?.memoryVersion || 0),
          store: sequenceStore,
        })
        if (!sequenceValidation?.ok) {
          const error = new Error(sequenceValidation?.rebaseRequired ? 'turn_sequence_rebase_required' : 'turn_sequence_lease_invalid')
          error.code = error.message
          error.status = 409
          error.retryable = true
          throw error
        }
        turnLease = sequenceValidation.receipt || turnLease
        autoReply = await deliverQl7SupportMessage({
          userId: from,
          userAliases: [...rawFromIds, ...(actor.aliases || [])],
          text: candidate.text,
          dedupeKey: buildQl7SupportDedupeKey({ userId: from, eventType: 'support_reply', subjectId: messageId }),
          eventType: 'support_reply',
          locale: candidate.locale,
          supportCard: candidate.surface,
          clientMutationId: `reply:${mutationId}`,
          correlationId: correlation,
          triggeringUserMessageId: messageId,
          metadata: {
            caseId: requestContext.caseId,
            userMessageId: messageId,
            topic: candidate.topic,
            messageAct: candidate.messageAct,
            subIntent: canonicalRuntime.analysis?.subIntent || requestContext.subIntent,
            caseStatus: requestContext.caseStatus,
            diagnosticStatus: diagnosticResult?.status || requestContext.diagnosticStatus,
            diagnosticRunId: str(diagnosticResult?.runId || diagnosticResult?._id),
            diagnosticBranch: str(diagnosticResult?.branch),
            responseCode: candidate.responseCode,
            nextState: replyPlan.nextState,
            openMaterialQuestion: ['waiting_user', 'waiting_choice'].includes(str(replyPlan.nextState)),
            runtimeVersion: canonicalRuntime.runtimeVersion,
            behaviorManifestHash: canonicalRuntime.behaviorManifestHash,
            deliveryReceiptId: candidate.receipt.receiptId,
            deliveryReceiptHash: candidate.receipt.receiptHash,
            deliveryCandidateHash: candidate.candidateHash,
            deliveryBindingId: candidate.deliveryBindingId,
            conversationDecision: str(requestContext?.conversationDecision?.decision),
            conversationReasonCode: str(requestContext?.conversationDecision?.reasonCode),
            translationStatus: languageInput.translationStatus,
            translationProvider: languageInput.translationProvider,
            supportAutoReply: true,
          },
          ts: msg.ts + 1,
          push: true,
          transactionContext,
        })
        return {
          ...autoReply,
          providerReceiptId: str(autoReply?.deliveryReceiptId || autoReply?.receiptId),
          transportEvidence: {
            messageId: str(autoReply?.id || autoReply?._id || autoReply?.messageId),
            candidateHash: candidate.candidateHash,
          },
        }
      },
      commitMemoryAndCase: async (committed, { session = null, memoryCommit = null } = {}) => {
        const nextMemory = buildQl7SupportLegacyReplyProjection(requestContext, {
          text: committed.text,
          responseCode: committed.responseCode,
          messageId: committed.finalMessageId,
        })
        const pendingChoice = committed.commitArtifacts?.pendingChoice || null
        const casePatch = {
          replyHistory: nextMemory.replyHistory,
          lastReplyFingerprint: nextMemory.lastReplyFingerprint,
          lastResponseCode: committed.responseCode,
          nextState: replyPlan.nextState,
          topic: committed.topic,
          messageAct: committed.messageAct,
          subIntent: canonicalRuntime.analysis?.subIntent || requestContext.subIntent,
          productionTurnVersion: productionTurn.version,
          productionDeliveryTextHash: committed.textHash,
          productionDeliverySurfaceHash: committed.surfaceHash,
          productionDeliveryActionIds: committed.actionIds,
          productionDeliveryResponseCode: committed.responseCode,
          deliveryReceiptId: committed.receipt.receiptId,
          deliveryReceiptHash: committed.receipt.receiptHash,
          deliveryCommitState: committed.receipt.commitState,
          conversationMemoryGraph: canonicalRuntime.memoryGraph,
          conversationMemoryHash: canonicalRuntime.memoryGraph.memoryHash,
          conversationMemoryVersion: canonicalRuntime.memoryGraph.memoryVersion,
          semanticNoveltyLedger: committed.noveltyLedgerAfter || canonicalRuntime.noveltyLedger,
          composerPolicy: committed.composerPolicy,
          lastSurfaceHash: committed.surfaceHash,
          runtimeVersion: canonicalRuntime.runtimeVersion,
          behaviorManifestHash: canonicalRuntime.behaviorManifestHash,
          updatedAt: nowIso(),
        }
        if (pendingChoice) casePatch.pendingChoice = pendingChoice
        const currentCase = await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne(
          { _id: requestContext.caseId },
          mongoOperationOptions({ session }),
        )
        if (!memoryCommit?.ok) {
          const error = new Error('canonical_memory_commit_required')
          error.code = 'canonical_memory_commit_required'
          error.status = 503
          throw error
        }
        const currentMemoryHash = str(currentCase?.conversationMemoryHash || currentCase?.conversationMemoryGraph?.memoryHash)
        const currentMemoryVersion = Number(currentCase?.conversationMemoryVersion ?? currentCase?.conversationMemoryGraph?.memoryVersion ?? 0)
        const projection = assessQl7SupportCaseMemoryProjection({
          projectedHash: currentMemoryHash,
          projectedVersion: currentMemoryVersion,
          memoryBeforeHash: canonicalRuntime.memoryBefore.memoryHash,
          memoryBeforeVersion: canonicalRuntime.memoryBefore.memoryVersion,
          memoryAfterHash: canonicalRuntime.memoryGraph.memoryHash,
          memoryAfterVersion: canonicalRuntime.memoryGraph.memoryVersion,
        })
        if (!projection.ok) {
          const error = new Error('concurrent_turn_conflict')
          error.code = 'concurrent_turn_conflict'
          error.status = 409
          error.projectionDisposition = projection.disposition
          throw error
        }
        if (projection.disposition === 'already_applied') return
        const caseProjectionCommit = await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
          {
            _id: requestContext.caseId,
            conversationMemoryHash: currentCase?.conversationMemoryHash === undefined
              ? { $exists: false }
              : str(currentCase.conversationMemoryHash),
            conversationMemoryVersion: currentCase?.conversationMemoryVersion === undefined
              ? { $exists: false }
              : currentMemoryVersion,
          },
          { $set: casePatch },
          mongoOperationOptions({ session }),
        )
        if (Number(caseProjectionCommit?.matchedCount ?? 1) !== 1) {
          const error = new Error('concurrent_turn_conflict')
          error.code = 'concurrent_turn_conflict'
          error.status = 409
          throw error
        }
      },
      afterCommit: async (committed) => {
        await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: 'answer_committed', messageId, finalMessageId: committed.finalMessageId, surfaceHash: committed.surfaceHash, attemptId: correlation, tone, locale: committed.locale, inputPolicy: committed.composerPolicy })
        const terminalState = committed.composerPolicy.allowed === false ? 'cooldown' : (replyPlan.nextState === 'waiting_choice' ? 'waiting_choice' : 'input_ready')
        await publishStage({ database, userId: from, caseId: requestContext.caseId, correlationId: correlation, state: terminalState, messageId, finalMessageId: committed.finalMessageId, surfaceHash: committed.surfaceHash, attemptId: correlation, tone, locale: committed.locale, inputPolicy: committed.composerPolicy })
      },
    })
    turnLease = bindQl7TurnSequenceDelivery(turnLease, { finalDeliveryBinding: str(finalProductionDelivery.deliveryBindingId || finalProductionDelivery.receipt?.receiptId), commitVersion: Number(canonicalRuntime?.memoryGraph?.memoryVersion || 0), transportStarted: true })
    const finalMessageId = finalProductionDelivery.finalMessageId
    const finalSurfaceHash = finalProductionDelivery.surfaceHash
    if (!autoReply) autoReply = { id: finalMessageId, deduped: true }
    bridge = await maybeSendQl7SupportEmailBridge({
      fromUserId: from,
      text: languageInput.redactedText,
      messageId,
      locale: providerResponseLocale || responseLocale,
      requestContext: { ...emailContext, runtimeResult: canonicalRuntime, finalMessageId, surfaceHash: finalSurfaceHash },
      diagnosticResult,
    }).catch((error) => ({ ok: false, skipped: false, error: str(error?.message || error) }))

    const cognitiveTurn = await recordQl7SupportCanonicalTurnTelemetry({
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
      modelVersion: 'ql7-support',
      calibrationVersion: 'baseline',
    }).catch(() => null)

    if (cognitiveTurn?.turnId) {
      await Promise.allSettled([
        writeQl7SupportCanonicalPersonalityState({ database, userId: from, state: personalityState, evidenceType: 'conversation_turn' }),
        recordQl7SupportCanonicalTranslationOutcome({
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
        recordQl7SupportCanonicalResponseQuality({
          database,
          userId: from,
          turnId: cognitiveTurn.turnId,
          modelVersion: 'ql7-support.0.3',
          calibrationVersion: 'baseline.0.3',
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



    if (canonicalRuntime?.learningIncident) {
      await recordQl7SupportIncidentLearningCandidate({
        database,
        incident: canonicalRuntime.learningIncident,
        topic: canonicalRuntime?.plan?.topic || requestContext.topic,
        consent: false,
      }).catch(() => null)
    }

    await recordQl7SupportCanonicalLearningObservation({
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
      replyMessageId: finalMessageId,
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
      productionDelivery: projectQl7SupportPublicCommittedDelivery(finalProductionDelivery),
      storagePrimary: 'mongo',
    }
  } catch (error) {
    await failDedupe(userDedupeKey, error)
    if (database) await publishStage({ database, userId: from, correlationId: correlation, state: 'error', detailCode: str(error?.message), messageId })
    throw error
  } finally {
    await releaseCanonicalQl7TurnSequence(database, turnLease)
  }
}


export async function cleanupQl7SupportEntryGreetingsForUser({ database, userId = '', preserveEntryId = '' } = {}) {
  const uid = str(userId)
  if (!database || typeof database.collection !== 'function' || !uid) return { removed: 0 }
  const collection = database.collection(ENTRY_EVENTS_COLLECTION)
  const preserve = str(preserveEntryId)
  const query = preserve ? { userId: uid, active: { $ne: false }, _id: { $ne: preserve } } : { userId: uid, active: { $ne: false } }
  const rows = await collection.find(query).sort({ createdAt: -1 }).limit(24).toArray().catch(() => [])
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

export async function createQl7SupportEntryGreeting({ actor = null, locale = 'en', entryNonce = '', routeContext = {}, requestBoundary = null } = {}) {
  assertQl7SupportActive()
  const userId = str(actor?.canonicalAccountId)
  if (!actor?.valid || !userId) {
    const error = new Error('verified_session_required')
    error.status = 401
    throw error
  }
  const database = await db()
  const now = Date.now()
  const nowText = new Date(now).toISOString()
  const windowMs = Math.max(
    5 * 60 * 1000,
    Math.min(24 * 60 * 60 * 1000, Number(process.env.QL7_SUPPORT_ENTRY_GREETING_WINDOW_MS || 30 * 60 * 1000)),
  )
  const bucket = Math.floor(now / windowMs)
  const entryCollection = database.collection(ENTRY_EVENTS_COLLECTION)
  const actorHash = hashQl7SupportDeliveryText(userId)
  const entrySession = deriveQl7EntrySession({
    actorHash,
    conversationId: 'ql7-support',
    entrySessionId: str(entryNonce) || `entry-window:${bucket}`,
    entryEpoch: String(bucket),
    locale: normalizeQl7SupportLocale(locale),
    openedAt: nowText,
    reopenReason: str(routeContext?.reopenReason || routeContext?.entryMode || 'open'),
    greetingPolicyVersion: '5.4.0',
  })
  const key = `support-entry:${userId}:${entrySession.greetingReservationId.slice('greeting:'.length)}`
  const committedEntryResult = (row, { reconciled = true } = {}) => ({
    ok: true,
    deduped: true,
    reconciled,
    messageId: str(row?.messageId),
    bucket: Number(row?.bucket ?? bucket),
    entrySessionId: str(row?.entrySessionReceipt?.entrySessionId || entrySession.entrySessionId),
    greetingReservationId: str(row?.entrySessionReceipt?.greetingReservationId || entrySession.greetingReservationId),
    entryVariantId: str(row?.entryVariantId),
    entryMode: str(row?.entryMode || 'continue'),
    activeCaseId: str(row?.activeCaseId),
    activeCaseStatus: str(row?.activeCaseStatus),
    supersededEntryGreetings: Number(row?.supersededEntryGreetings || 0),
    entrySessionReceipt: row?.entrySessionReceipt || commitQl7EntryGreeting(entrySession, { greetingDeliveryId: str(row?.messageId) }),
    productionDelivery: row?.productionDeliveryProjection || null,
  })
  const readCommittedEntryWinner = async ({ attempts = 12, waitMs = 75 } = {}) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const row = await entryCollection.findOne({ _id: key }).catch(() => null)
      if (row?.entryDeliveryState === 'committed' && str(row?.messageId)) return row
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
    return null
  }
  const existingEntry = await entryCollection.findOne({ _id: key }).catch(() => null)
  if (existingEntry?.entryDeliveryState === 'committed' && str(existingEntry?.messageId)) {
    return committedEntryResult(existingEntry)
  }

  const recent = await entryCollection.find({ userId, _id: { $ne: key } }).sort({ createdAt: -1 }).limit(8).toArray().catch(() => [])
  const latestCases = await database.collection(QL7_SUPPORT_CASE_COLLECTION)
    .find({ userId })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(1)
    .toArray()
    .catch(() => [])
  const latestCase = latestCases[0] || null
  const latestCaseStatus = str(latestCase?.caseStatus || latestCase?.status)
  const latestCaseActive = latestCase?.active !== false && !['closed', 'resolved', 'superseded'].includes(latestCaseStatus)
  const entryMode = latestCaseActive ? 'continue' : (str(routeContext?.entryMode) || 'fresh')
  const nonce = shortHash(`${entrySession.entrySessionId}:${entrySession.entryEpoch}:${entrySession.greetingReservationId}`)
  const sourceEventId = `entry-event:${shortHash(key)}`
  const requestId = `entry-request:${shortHash(`${key}:${sourceEventId}`)}`
  const idempotencyKey = `entry-delivery:${key}`
  const activeCaseId = str(latestCase?._id || latestCase?.caseId)
  const entryEvent = Object.freeze({
    type: 'entry_greeting',
    actorSeed: shortHash(userId),
    entryNonce: entrySession.entrySessionId,
    entrySessionId: entrySession.entrySessionId,
    greetingReservationId: entrySession.greetingReservationId,
    entryMode,
    recentFingerprints: recent.map((row) => str(row?.fingerprint)).filter(Boolean),
    recentVariantIds: recent.map((row) => str(row?.entryStrategyId)).filter(Boolean),
    timeZone: str(routeContext?.browserTimeZone) || 'UTC',
    now,
    activeCaseId,
    activeCaseStatus: latestCaseStatus,
    activeTopic: str(latestCase?.topic),
    openQuestion: str(latestCase?.currentQuestionCode || latestCase?.memory?.currentQuestionCode),
  })

  await entryCollection.updateOne(
    { _id: key },
    {
      $setOnInsert: {
        _id: key,
        schema: 'ql7.support.entry-event',
        schemaVersion: '5.4.0',
        userId,
        actorIdHash: actorHash,
        sourceEventId,
        requestId,
        idempotencyKeyHash: hashQl7SupportDeliveryText(idempotencyKey),
        bucket,
        locale: normalizeQl7SupportLocale(locale),
        entryMode,
        activeCaseId,
        activeCaseStatus: latestCaseStatus,
        routeContext: jsonClone(routeContext),
        entrySessionReceipt: entrySession,
        supersededEntryGreetings: 0,
        entryDeliveryState: 'prepared_target',
        active: false,
        createdAt: nowText,
        updatedAt: nowText,
        expiresAt: new Date(now + Math.max(windowMs * 2, 24 * 60 * 60 * 1000)),
      },
    },
    { upsert: true },
  )

  // Re-read after the upsert: a concurrent tab may have committed the exact same entry session
  // while this request was waiting. Reconcile instead of emitting another greeting.
  const afterReserve = await entryCollection.findOne({ _id: key }).catch(() => null)
  if (afterReserve?.entryDeliveryState === 'committed' && str(afterReserve?.messageId)) {
    return committedEntryResult(afterReserve)
  }

  const productionTurnInput = {
    mode: 'production',
    requestId,
    conversationId: key,
    caseId: key,
    userTurnId: sourceEventId,
    sourceEventId,
    clientMutationId: `entry:${entrySession.greetingReservationId}`.slice(0, 160),
    idempotencyKey,
    selectedLocale: locale,
    actor,
    verifiedActorId: userId,
    actorReceiptId: str(actor?.actorReceiptId),
    routeId: 'dm.support-entry.post',
    sourceRouteId: 'dm.support-entry.post',
    sourceSurfaceId: 'messenger.support-entry',
    requestBoundary,
    originalText: '',
    baseAnalysisTrust: true,
    analysis: {
      topic: 'support_system',
      messageAct: 'entry_greeting',
      socialAct: 'entry_greeting',
      confidence: 1,
      internalEvent: true,
    },
    route: { topic: 'support_system', messageAct: 'entry_greeting' },
    // Entry greetings own a separate conversation/CAS stream. Open-case context is
    // carried by entryEvent; importing the case graph here would reuse its version
    // under a new conversationId and fail the canonical memory commit with 409.
    priorMemoryGraph: {},
    priorNoveltyLedger: latestCaseActive ? (latestCase?.semanticNoveltyLedger || null) : null,
    entryEvent,
    browserTimeZone: normalizeQl7SupportTimeZone(routeContext?.browserTimeZone || entryEvent.timeZone || 'UTC'),
    now: nowText,
    seed: `${userId}:${sourceEventId}:${entrySession.greetingReservationId}`,
    localizeFinalDelivery: (payload) => localizeQl7SupportFinalDeliveryBeforeQuality(payload),
  }
  const productionTurn = await executeQl7SupportProductionTurn(productionTurnInput)
  const runtime = productionTurn.runtime
  const preparedDelivery = productionTurn.delivery
  const signing = await resolveQl7SupportDeliverySigningMaterialForServer({ mode: 'production' }, runtime)
  const deliveryStore = createQl7SupportDeliveryStore(database)
  let transportMessage = null
  let committed = null
  try {
    committed = await commitQl7SupportFinalDelivery({
    candidate: preparedDelivery,
    runtime,
    signingKey: signing.signingKey,
    keyId: signing.keyId,
    store: deliveryStore,
    transactionalTransport: true,
    regenerateCandidate: ({ attempt, collisionReceipt }) => executeQl7SupportProductionTurn({
      ...productionTurnInput,
      seed: `${productionTurnInput.seed}:novelty-reservation:${attempt}`,
      noveltyCollisionReceipt: collisionReceipt,
    }),
    transport: async (candidate, transactionContext = {}) => {
      transportMessage = await deliverQl7SupportMessage({
        userId,
        userAliases: actor.aliases || [],
        text: candidate.text,
        dedupeKey: buildQl7SupportDedupeKey({ userId, eventType: 'entry_greeting', subjectId: entrySession.greetingReservationId }),
        eventType: 'entry_greeting',
        locale: candidate.locale,
        supportCard: candidate.surface,
        clientMutationId: `entry:${entrySession.greetingReservationId}`.slice(0, 160),
        correlationId: requestId,
        triggeringUserMessageId: sourceEventId,
        metadata: {
          entryGreeting: true,
          bucket,
          entrySessionId: entrySession.entrySessionId,
          greetingReservationId: entrySession.greetingReservationId,
          fingerprint: shortHash(candidate.text),
          entryVariantId: str(runtime.realized?.variationId),
          entryStrategyId: str(runtime.realized?.entryGreetingReceipt?.strategyId),
          entryMode,
          activeCaseId,
          activeCaseStatus: latestCaseStatus,
          routeContext: jsonClone(routeContext),
          nativeLocale: true,
          externalTranslationUsed: false,
          responseCode: candidate.responseCode,
          runtimeVersion: runtime.runtimeVersion,
          behaviorManifestHash: runtime.behaviorManifestHash,
          deliveryReceiptId: candidate.receipt.receiptId,
          deliveryReceiptHash: candidate.receipt.receiptHash,
          deliveryCandidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
        },
        ts: now,
        push: false,
        transactionContext,
      })
      return {
        ...transportMessage,
        providerReceiptId: str(transportMessage?.deliveryReceiptId || transportMessage?.receiptId),
        transportEvidence: {
          messageId: str(transportMessage?.id || transportMessage?._id || transportMessage?.messageId),
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
        },
      }
    },
    commitMemoryAndCase: async (delivery, { session = null } = {}) => {
      const entrySessionReceipt = commitQl7EntryGreeting(entrySession, { greetingDeliveryId: delivery.finalMessageId })
      const publicDelivery = projectQl7SupportPublicCommittedDelivery(delivery)
      const result = await entryCollection.updateOne(
        { _id: key, userId, entryDeliveryState: 'prepared_target' },
        { $set: {
          messageId: delivery.finalMessageId,
          fingerprint: shortHash(delivery.text),
          locale: delivery.locale,
          entryVariantId: str(runtime.realized?.variationId),
          entryStrategyId: str(runtime.realized?.entryGreetingReceipt?.strategyId),
          entryDeliveryState: 'committed',
          active: true,
          entrySessionReceipt: entrySessionReceipt,
          productionDeliveryProjection: publicDelivery,
          deliveryReceiptId: delivery.receipt.receiptId,
          deliveryReceiptHash: delivery.receipt.receiptHash,
          deliveryCommitState: delivery.receipt.commitState,
          deliveryCandidateHash: delivery.candidateHash,
          deliveryBindingId: delivery.deliveryBindingId,
          conversationMemoryGraph: runtime.memoryGraph,
          conversationMemoryHash: runtime.memoryGraph.memoryHash,
          conversationMemoryVersion: runtime.memoryGraph.memoryVersion,
          semanticNoveltyLedger: delivery.noveltyLedgerAfter || runtime.noveltyLedger,
          updatedAt: nowIso(),
        } },
        mongoOperationOptions({ session }),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) {
        const current = await entryCollection.findOne({ _id: key }, mongoOperationOptions({ session }))
        if (str(current?.deliveryReceiptHash) === delivery.receipt.receiptHash) return
        const error = new Error('entry_delivery_commit_conflict')
        error.code = 'entry_delivery_commit_conflict'
        error.status = 409
        throw error
      }
    },
    })
  } catch (error) {
    const code = str(error?.code || error?.message)
    const reconcilable = new Set([
      'canonical_memory_commit_conflict',
      'delivery_commit_in_progress',
      'delivery_fencing_conflict',
      'entry_delivery_commit_conflict',
      'idempotency_payload_conflict',
    ])
    if (reconcilable.has(code)) {
      const winner = await readCommittedEntryWinner()
      if (winner) return committedEntryResult(winner)
    }
    throw error
  }
  if (!transportMessage) transportMessage = { id: committed.finalMessageId, deduped: true }

  // Only after the new greeting is durably committed may older entry greetings be superseded.
  // A failed new greeting therefore never deletes the user's last visible committed greeting.
  const cleanup = await cleanupQl7SupportEntryGreetingsForUser({ database, userId, preserveEntryId: key })
  await entryCollection.updateOne(
    { _id: key, entryDeliveryState: 'committed' },
    { $set: { supersededEntryGreetings: cleanup.removed, updatedAt: nowIso() } },
  ).catch(() => null)
  const entrySessionReceipt = commitQl7EntryGreeting(entrySession, { greetingDeliveryId: committed.finalMessageId })
  return {
    ok: true,
    deduped: committed.deduped === true,
    reconciled: false,
    messageId: committed.finalMessageId,
    bucket,
    entrySessionId: entrySession.entrySessionId,
    greetingReservationId: entrySession.greetingReservationId,
    entryVariantId: str(runtime.realized?.variationId),
    entryMode,
    activeCaseId,
    activeCaseStatus: latestCaseStatus,
    supersededEntryGreetings: cleanup.removed,
    entrySessionReceipt,
    productionDelivery: projectQl7SupportPublicCommittedDelivery(committed),
  }
}


export async function removeQl7SupportEntryGreetings({ actor = null } = {}) {
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

export async function createQl7SupportIdleNudge({
  actor = null,
  locale = 'en',
  anchorId = '',
  now = Date.now(),
} = {}) {
  assertQl7SupportActive()
  const userId = str(actor?.canonicalAccountId)
  if (!actor?.valid || !userId) {
    const error = new Error('verified_session_required')
    error.status = 401
    throw error
  }
  const database = await db()
  const recentCases = await database.collection(QL7_SUPPORT_CASE_COLLECTION)
    .find({ userId, active: { $ne: false } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(1)
    .toArray()
    .catch(() => [])
  const supportCase = recentCases[0]
  const caseStatus = str(supportCase?.caseStatus || supportCase?.status)
  const nextState = str(supportCase?.nextState)
  if (!supportCase || ['closed', 'resolved', 'superseded'].includes(caseStatus) ||
    !['waiting_user', 'waiting_choice'].includes(nextState)) {
    return { ok: true, skipped: true, reason: 'no_open_material_question' }
  }
  const replyHistory = Array.isArray(supportCase.replyHistory) ? supportCase.replyHistory : []
  const latestReply = replyHistory[replyHistory.length - 1]
  const latestReplyId = str(latestReply?.messageId)
  if (!latestReplyId || (str(anchorId) && str(anchorId) !== latestReplyId)) {
    return { ok: true, skipped: true, reason: 'idle_anchor_stale' }
  }
  const nowMs = Number(now) || Date.now()
  const replyAt = Date.parse(str(latestReply?.at || supportCase.updatedAt))
  const idleMs = Number.isFinite(replyAt) ? Math.max(0, nowMs - replyAt) : 0
  const minIdleMs = Math.max(5 * 60 * 1000, Math.min(10 * 60 * 1000, Number(process.env.QL7_SUPPORT_IDLE_NUDGE_MS || 7 * 60 * 1000)))
  if (!Number.isFinite(replyAt) || idleMs < minIdleMs || idleMs > 24 * 60 * 60 * 1000) {
    return { ok: true, skipped: true, reason: 'idle_window_not_reached' }
  }
  const sourceReceiptId = str(supportCase.deliveryReceiptId)
  if (!sourceReceiptId) return { ok: true, skipped: true, reason: 'idle_source_receipt_missing' }
  const sourceDelivery = await database.collection('ql7_support_delivery_receipts').findOne({
    receiptId: sourceReceiptId,
    conversationId: str(supportCase._id),
    commitState: 'committed',
  })
  if (!sourceDelivery || str(sourceDelivery?.committedReceipt?.receiptHash) !== str(supportCase.deliveryReceiptHash)) {
    return { ok: true, skipped: true, reason: 'idle_source_receipt_unverified' }
  }
  const envelope = buildQl7SupportEventEnvelope({
    type: 'idle_nudge',
    userId,
    actorId: 'ql7-support:idle-policy',
    subjectId: `${supportCase._id}:${latestReplyId}`,
    locale,
    payload: {
      caseIdHash: hashQl7SupportDeliveryText(supportCase._id),
      anchorIdHash: hashQl7SupportDeliveryText(latestReplyId),
      activeTopic: str(supportCase.topic),
      nextState,
    },
    timestamp: new Date(replyAt + minIdleMs).toISOString(),
    sourceReceipt: {
      receiptId: sourceReceiptId,
      sourceType: 'committed_support_delivery',
      sourceOperationId: latestReplyId,
    },
    push: false,
  })
  return deliverQl7SupportEvent({
    userId,
    userAliases: actor.aliases || [],
    eventEnvelope: envelope,
  })
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
  transactionContext = {},
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
  const cleanText = normalizeQl7SupportText(text)
  if (!cleanText) {
    const error = new Error('ql7_support_text_required')
    error.status = 400
    throw error
  }

  const reservation = await reserveDedupe(key, {
    userId: target,
    eventType: event,
  }, transactionContext)
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

  const validatedCard = supportCard ? validateQl7SupportCard(supportCard) : { ok: true, card: null }
  if (!validatedCard.ok) {
    const error = new Error(`ql7_support_card_${validatedCard.error}`)
    error.status = 400
    throw error
  }
  const mongoContext = {
    database: transactionContext?.database,
    session: transactionContext?.session,
  }
  await dmPrimary.addAliasesFor(target, userAliases, mongoContext)
  const toIds = await dmPrimary.expandAliasIds([target, ...userAliases], mongoContext)
  const id = String(await dmPrimary.nextMsgId(mongoContext))
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

  await dmPrimary.saveMessage(msg, mongoContext)
  await dmPrimary.addMessageIndexes({
    msg,
    fromIds: [QL7_SUPPORT_ID],
    toIds,
    score: Number(msg.ts || Date.now()),
  }, mongoContext)
  await completeDedupe(key, {
    userId: target,
    messageId: id,
    ts: msg.ts,
  }, transactionContext)

  let afterCommit = null
  if (push) {
    const stableBroadcastId = str(payload?.broadcastId || metadata?.broadcastId || '')
    const pushDedupeKey = event === 'broadcast' && stableBroadcastId
      ? `ql7-support:broadcast:${stableBroadcastId}`
      : `ql7-support:${key}`
    const sendPush = () => sendBackgroundPush(target, {
      source: 'messenger_messages',
      dedupeKey: pushDedupeKey,
      itemId: id,
    }).catch(() => {})
    if (transactionContext?.session) afterCommit = sendPush
    else await sendPush()
  }

  return { ok: true, id, ts: msg.ts, deduped: false, storagePrimary: 'mongo', afterCommit }
}

export async function deliverQl7SupportEvent({
  userId,
  userAliases = [],
  eventEnvelope = null,
  eventType = '',
  subjectId = '',
  locale = '',
  payload = {},
  surfaceFacts = null,
  sourceReceipt = null,
  sourceReceiptId = '',
  dedupeKey = '',
  timestamp = '',
  push = true,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const target = str(userId)
  if (!target || isQl7SupportId(target)) {
    const error = new Error('ql7_support_bad_target')
    error.code = 'ql7_support_bad_target'
    error.status = 400
    throw error
  }
  const envelope = eventEnvelope || buildQl7SupportEventEnvelope({
    userId: target,
    actorId: `ql7-support:event-producer:${eventType}`,
    type: eventType,
    subjectId,
    locale,
    payload,
    surfaceFacts,
    sourceReceipt,
    sourceReceiptId,
    idempotencyKey: dedupeKey,
    timestamp: timestamp || payload?.timestamp || new Date().toISOString(),
    push,
  })
  const validation = validateQl7SupportEventEnvelope(envelope, { userId: target })
  if (!validation.ok) {
    const error = new Error(`ql7_support_event_envelope_invalid:${validation.failures.join(',')}`)
    error.code = 'ql7_support_event_envelope_invalid'
    error.status = 409
    error.failures = validation.failures
    throw error
  }

  const database = await db()
  const conversationId = `support-event:${hashQl7SupportDeliveryText(envelope.eventId)}`
  const requestId = `event-request:${shortHash(envelope.envelopeHash)}`
  const eventCollection = database.collection(EVENT_ENVELOPES_COLLECTION)
  await eventCollection.updateOne(
    { _id: conversationId },
    { $setOnInsert: {
      _id: conversationId,
      schema: 'ql7.support.event-delivery-target',
      schemaVersion: '5.1.0',
      eventId: envelope.eventId,
      envelopeHash: envelope.envelopeHash,
      envelope,
      userId: target,
      recipientIdHash: envelope.recipientIdHash,
      sourceReceiptId: envelope.sourceReceipt.receiptId,
      occurredAtServerUtc: envelope.occurredAtServerUtc,
      eventDeliveryState: 'prepared_target',
      active: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } },
    { upsert: true },
  )
  const targetRow = await eventCollection.findOne({ _id: conversationId })
  if (!targetRow || str(targetRow.envelopeHash) !== envelope.envelopeHash ||
    str(targetRow.recipientIdHash) !== envelope.recipientIdHash) {
    const error = new Error('event_id_payload_conflict')
    error.code = 'event_id_payload_conflict'
    error.status = 409
    throw error
  }

  const actor = Object.freeze({
    valid: true,
    canonicalAccountId: target,
    aliases: Object.freeze([...new Set((userAliases || []).map(str).filter(Boolean))]),
  })
  const productionTurnInput = {
    mode: 'production',
    requestId,
    conversationId,
    caseId: conversationId,
    userTurnId: envelope.eventId,
    sourceEventId: envelope.eventId,
    idempotencyKey: envelope.dedupeKey,
    selectedLocale: envelope.locale,
    actor,
    verifiedActorId: target,
    originalText: '',
    baseAnalysisTrust: true,
    analysis: {
      topic: envelope.primaryDomainId,
      subIntent: envelope.primaryMicrotopicId,
      messageAct: 'event_notification',
      socialAct: 'event_notification',
      confidence: 1,
      internalEvent: true,
    },
    route: {
      topic: envelope.primaryDomainId,
      subIntent: envelope.primaryMicrotopicId,
      messageAct: 'event_notification',
    },
    eventEnvelope: envelope,
    now: envelope.occurredAtServerUtc,
    seed: `${envelope.eventId}:${envelope.envelopeHash}`,
    localizeFinalDelivery: (localizationPayload) => localizeQl7SupportFinalDeliveryBeforeQuality(localizationPayload),
  }
  const productionTurn = await executeQl7SupportProductionTurn(productionTurnInput)
  const runtime = productionTurn.runtime
  const preparedDelivery = productionTurn.delivery
  const signing = await resolveQl7SupportDeliverySigningMaterialForServer({ mode: 'production' }, runtime)
  const deliveryStore = createQl7SupportDeliveryStore(database)
  let transportMessage = null
  const committed = await commitQl7SupportFinalDelivery({
    candidate: preparedDelivery,
    runtime,
    signingKey: signing.signingKey,
    keyId: signing.keyId,
    store: deliveryStore,
    transactionalTransport: true,
    regenerateCandidate: ({ attempt, collisionReceipt }) => executeQl7SupportProductionTurn({
      ...productionTurnInput,
      seed: `${productionTurnInput.seed}:novelty-reservation:${attempt}`,
      noveltyCollisionReceipt: collisionReceipt,
    }),
    transport: async (candidate, transactionContext = {}) => {
      transportMessage = await deliverQl7SupportMessage({
        userId: target,
        userAliases: actor.aliases,
        text: candidate.text,
        dedupeKey: envelope.dedupeKey,
        eventType: envelope.type,
        locale: candidate.locale,
        payload: envelope.payload,
        supportCard: candidate.surface,
        clientMutationId: `event:${shortHash(envelope.eventId)}`,
        correlationId: requestId,
        triggeringUserMessageId: envelope.eventId,
        metadata: {
          eventId: envelope.eventId,
          eventEnvelopeHash: envelope.envelopeHash,
          eventEnvelopeReceiptId: envelope.receiptId,
          eventSourceReceiptId: envelope.sourceReceipt.receiptId,
          eventDomainId: envelope.primaryDomainId,
          eventMicrotopicId: envelope.primaryMicrotopicId,
          eventSeverity: envelope.severity,
          eventOccurredAtServerUtc: envelope.occurredAtServerUtc,
          broadcastId: str(envelope.payload?.broadcastId),
          deliveryReceiptId: candidate.receipt.receiptId,
          deliveryReceiptHash: candidate.receipt.receiptHash,
          deliveryCandidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
        },
        ts: Date.parse(envelope.occurredAtServerUtc) || Date.now(),
        push: envelope.pushPolicy !== 'none',
        transactionContext,
      })
      return {
        ...transportMessage,
        providerReceiptId: str(transportMessage?.deliveryReceiptId || transportMessage?.receiptId),
        transportEvidence: {
          messageId: str(transportMessage?.id || transportMessage?._id || transportMessage?.messageId),
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
          eventEnvelopeHash: envelope.envelopeHash,
        },
      }
    },
    commitMemoryAndCase: async (delivery, { session = null } = {}) => {
      const result = await eventCollection.updateOne(
        { _id: conversationId, envelopeHash: envelope.envelopeHash, eventDeliveryState: 'prepared_target' },
        { $set: {
          messageId: delivery.finalMessageId,
          eventDeliveryState: 'committed',
          active: true,
          locale: delivery.locale,
          eventVariationId: str(runtime.realized?.variationId),
          deliveryReceiptId: delivery.receipt.receiptId,
          deliveryReceiptHash: delivery.receipt.receiptHash,
          deliveryCommitState: delivery.receipt.commitState,
          deliveryCandidateHash: delivery.candidateHash,
          deliveryBindingId: delivery.deliveryBindingId,
          conversationMemoryGraph: runtime.memoryGraph,
          conversationMemoryHash: runtime.memoryGraph.memoryHash,
          conversationMemoryVersion: runtime.memoryGraph.memoryVersion,
          semanticNoveltyLedger: delivery.noveltyLedgerAfter || runtime.noveltyLedger,
          updatedAt: nowIso(),
        } },
        mongoOperationOptions({ session }),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) {
        const current = await eventCollection.findOne({ _id: conversationId }, mongoOperationOptions({ session }))
        if (str(current?.deliveryReceiptHash) === delivery.receipt.receiptHash) return
        const error = new Error('event_delivery_commit_conflict')
        error.code = 'event_delivery_commit_conflict'
        error.status = 409
        throw error
      }
    },
  })
  const publicDelivery = projectQl7SupportPublicCommittedDelivery(committed)
  return {
    ok: true,
    id: committed.finalMessageId,
    messageId: committed.finalMessageId,
    ts: Number(transportMessage?.ts || Date.parse(committed.receipt.committedAtServerUtc) || Date.now()),
    deduped: committed.deduped === true,
    eventId: envelope.eventId,
    eventEnvelopeReceiptId: envelope.receiptId,
    deliveryReceiptId: committed.receipt.receiptId,
    productionDelivery: publicDelivery,
    storagePrimary: 'mongo',
  }
}

function messageProjectionForDeliveryRecovery(doc = {}) {
  const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
  if (!raw || typeof raw !== 'object') return null
  return {
    id: str(raw.id || raw.messageId || doc?.messageId),
    to: str(raw.to),
    text: str(raw.text),
    supportCard: raw.supportCard || null,
    metadata: raw.metadata || null,
  }
}

async function findCommittedDmForRecovery(database, record, candidate) {
  const candidateHash = str(candidate?.candidateHash || record?.candidateHash)
  const deliveryBindingId = str(candidate?.deliveryBindingId || record?.deliveryBindingId)
  const row = await database.collection('dm_messages').findOne({
    $or: [
      { 'metadata.deliveryCandidateHash': candidateHash, 'metadata.deliveryBindingId': deliveryBindingId },
      { 'raw.metadata.deliveryCandidateHash': candidateHash, 'raw.metadata.deliveryBindingId': deliveryBindingId },
    ],
  }).catch(() => null)
  const message = messageProjectionForDeliveryRecovery(row)
  if (!message?.id) return null
  if (hashQl7SupportDeliveryText(message.text) !== candidate.textHash ||
    str(message.supportCard?.integrity?.signature) !== candidate.surfaceHash ||
    str(message.metadata?.deliveryCandidateHash) !== candidateHash ||
    str(message.metadata?.deliveryBindingId) !== deliveryBindingId) {
    const error = new Error('recovery_stored_message_hash_mismatch')
    error.code = 'recovery_stored_message_hash_mismatch'
    throw error
  }
  return message
}

async function recoveryCaseForDelivery(database, record, candidate, { session = null } = {}) {
  const caseId = str(candidate?.receipt?.conversationId || record?.conversationId)
  if (candidate?.messageAct === 'entry_greeting') {
    const entryEvent = await database.collection(ENTRY_EVENTS_COLLECTION).findOne(
      { _id: caseId },
      mongoOperationOptions({ session }),
    )
    const userId = str(entryEvent?.userId)
    if (!entryEvent || !userId || hashQl7SupportDeliveryText(userId) !== candidate.receipt.actorIdHash) {
      const error = new Error('recovery_verified_actor_entry_mismatch')
      error.code = 'recovery_verified_actor_entry_mismatch'
      throw error
    }
    return { supportCase: entryEvent, userId, caseId, targetKind: 'entry_greeting' }
  }
  if (candidate?.messageAct === 'event_notification') {
    const eventTarget = await database.collection(EVENT_ENVELOPES_COLLECTION).findOne(
      { _id: caseId },
      mongoOperationOptions({ session }),
    )
    const userId = str(eventTarget?.userId)
    const eventEnvelope = eventTarget?.envelope
    const envelopeCheck = validateQl7SupportEventEnvelope(eventEnvelope, { userId })
    if (!eventTarget || !userId || !envelopeCheck.ok ||
      eventTarget.envelopeHash !== eventEnvelope?.envelopeHash ||
      hashQl7SupportDeliveryText(userId) !== candidate.receipt.actorIdHash) {
      const error = new Error('recovery_verified_actor_event_mismatch')
      error.code = 'recovery_verified_actor_event_mismatch'
      throw error
    }
    return { supportCase: eventTarget, userId, caseId, targetKind: 'event_notification' }
  }
  const supportCase = await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne(
    { _id: caseId },
    mongoOperationOptions({ session }),
  )
  const userId = str(supportCase?.userId)
  if (!supportCase || !userId || hashQl7SupportDeliveryText(userId) !== candidate.receipt.actorIdHash) {
    const error = new Error('recovery_verified_actor_case_mismatch')
    error.code = 'recovery_verified_actor_case_mismatch'
    throw error
  }
  return { supportCase, userId, caseId, targetKind: 'support_case' }
}

async function commitRecoveredDeliveryMemory(database, delivery, record, { session = null } = {}) {
  const candidate = record.preparedDelivery
  const { supportCase, caseId, targetKind } = await recoveryCaseForDelivery(database, record, candidate, { session })
  const runtime = record.runtime || {}
  const memoryBeforeHash = str(runtime.memoryBefore?.memoryHash || candidate.receipt.memoryBeforeHash)
  const memoryAfterHash = str(runtime.memoryGraph?.memoryHash || candidate.receipt.memoryAfterHash)
  const currentMemoryHash = str(supportCase.conversationMemoryHash)
  const memoryBeforeVersion = Number(runtime.memoryBefore?.memoryVersion || 0)
  const memoryAfterVersion = Number(runtime.memoryGraph?.memoryVersion || memoryBeforeVersion + 1)
  const currentMemoryVersion = Number(supportCase.conversationMemoryVersion ?? supportCase.conversationMemoryGraph?.memoryVersion ?? 0)
  if (currentMemoryHash === memoryAfterHash && currentMemoryVersion === memoryAfterVersion) return { ok: true, duplicate: true }
  if ((currentMemoryHash && currentMemoryHash !== memoryBeforeHash) || currentMemoryVersion !== memoryBeforeVersion) {
    const error = new Error('concurrent_turn_conflict')
    error.code = 'concurrent_turn_conflict'
    error.status = 409
    throw error
  }
  if (!runtime.memoryGraph || runtime.memoryGraph.memoryHash !== memoryAfterHash) {
    const error = new Error('recovery_memory_projection_unavailable')
    error.code = 'recovery_memory_projection_unavailable'
    error.status = 503
    throw error
  }
  if (targetKind === 'entry_greeting') {
    const result = await database.collection(ENTRY_EVENTS_COLLECTION).updateOne(
      {
        _id: caseId,
        conversationMemoryHash: currentMemoryHash || { $exists: false },
        conversationMemoryVersion: supportCase.conversationMemoryVersion === undefined ? { $exists: false } : currentMemoryVersion,
      },
      { $set: {
        messageId: delivery.finalMessageId,
        fingerprint: shortHash(delivery.text),
        locale: delivery.locale,
        entryVariantId: str(runtime.realized?.variationId),
        entryDeliveryState: 'committed',
        active: true,
        deliveryReceiptId: delivery.receipt.receiptId,
        deliveryReceiptHash: delivery.receipt.receiptHash,
        deliveryCommitState: delivery.receipt.commitState,
        deliveryCandidateHash: delivery.candidateHash,
        deliveryBindingId: delivery.deliveryBindingId,
        conversationMemoryGraph: runtime.memoryGraph,
        conversationMemoryHash: memoryAfterHash,
        conversationMemoryVersion: memoryAfterVersion,
        semanticNoveltyLedger: delivery.noveltyLedgerAfter || runtime.noveltyLedger || null,
        recoveredDeliveryCommit: true,
        recoveredAt: nowIso(),
        updatedAt: nowIso(),
      } },
      mongoOperationOptions({ session }),
    )
    if (Number(result?.matchedCount ?? 1) !== 1) {
      const error = new Error('concurrent_turn_conflict')
      error.code = 'concurrent_turn_conflict'
      error.status = 409
      throw error
    }
    return { ok: true, duplicate: false }
  }
  if (targetKind === 'event_notification') {
    const result = await database.collection(EVENT_ENVELOPES_COLLECTION).updateOne(
      {
        _id: caseId,
        conversationMemoryHash: currentMemoryHash || { $exists: false },
        conversationMemoryVersion: supportCase.conversationMemoryVersion === undefined ? { $exists: false } : currentMemoryVersion,
      },
      { $set: {
        messageId: delivery.finalMessageId,
        eventDeliveryState: 'committed',
        active: true,
        locale: delivery.locale,
        eventVariationId: str(runtime.realized?.variationId),
        deliveryReceiptId: delivery.receipt.receiptId,
        deliveryReceiptHash: delivery.receipt.receiptHash,
        deliveryCommitState: delivery.receipt.commitState,
        deliveryCandidateHash: delivery.candidateHash,
        deliveryBindingId: delivery.deliveryBindingId,
        conversationMemoryGraph: runtime.memoryGraph,
        conversationMemoryHash: memoryAfterHash,
        conversationMemoryVersion: memoryAfterVersion,
        semanticNoveltyLedger: delivery.noveltyLedgerAfter || runtime.noveltyLedger || null,
        recoveredDeliveryCommit: true,
        recoveredAt: nowIso(),
        updatedAt: nowIso(),
      } },
      mongoOperationOptions({ session }),
    )
    if (Number(result?.matchedCount ?? 1) !== 1) {
      const error = new Error('concurrent_turn_conflict')
      error.code = 'concurrent_turn_conflict'
      error.status = 409
      throw error
    }
    return { ok: true, duplicate: false }
  }
  const nextMemory = buildQl7SupportLegacyReplyProjection(supportCase, {
    text: delivery.text,
    responseCode: delivery.responseCode,
    messageId: delivery.finalMessageId,
  })
  const pendingChoice = delivery.commitArtifacts?.pendingChoice || null
  const patch = {
    replyHistory: nextMemory.replyHistory,
    lastReplyFingerprint: nextMemory.lastReplyFingerprint,
    lastResponseCode: delivery.responseCode,
    nextState: str(runtime.replyPlan?.nextState),
    topic: delivery.topic,
    messageAct: delivery.messageAct,
    subIntent: str(runtime.analysis?.subIntent),
    productionDeliveryTextHash: delivery.textHash,
    productionDeliverySurfaceHash: delivery.surfaceHash,
    productionDeliveryActionIds: delivery.actionIds,
    productionDeliveryResponseCode: delivery.responseCode,
    deliveryReceiptId: delivery.receipt.receiptId,
    deliveryReceiptHash: delivery.receipt.receiptHash,
    deliveryCommitState: delivery.receipt.commitState,
    conversationMemoryGraph: runtime.memoryGraph,
    conversationMemoryHash: memoryAfterHash,
    conversationMemoryVersion: memoryAfterVersion,
    semanticNoveltyLedger: delivery.noveltyLedgerAfter || runtime.noveltyLedger || supportCase.semanticNoveltyLedger || null,
    composerPolicy: delivery.composerPolicy,
    lastSurfaceHash: delivery.surfaceHash,
    runtimeVersion: str(runtime.runtimeVersion || delivery.runtimeVersion),
    behaviorManifestHash: str(runtime.behaviorManifestHash || delivery.behaviorManifestHash),
    recoveredDeliveryCommit: true,
    recoveredAt: nowIso(),
    updatedAt: nowIso(),
  }
  if (pendingChoice) patch.pendingChoice = pendingChoice
  const result = await database.collection(QL7_SUPPORT_CASE_COLLECTION).updateOne(
    {
      _id: caseId,
      conversationMemoryHash: currentMemoryHash || { $exists: false },
      conversationMemoryVersion: supportCase.conversationMemoryVersion === undefined ? { $exists: false } : currentMemoryVersion,
    },
    { $set: patch },
    mongoOperationOptions({ session }),
  )
  if (Number(result?.matchedCount ?? 1) !== 1) {
    const error = new Error('concurrent_turn_conflict')
    error.code = 'concurrent_turn_conflict'
    error.status = 409
    throw error
  }
  return { ok: true, duplicate: false }
}

async function ensureQl7SupportRecoveryMemoryAuthority({
  database,
  conversationId,
  actorIdHash,
  graph,
} = {}) {
  if (!graph?.memoryHash || !conversationId || !actorIdHash) {
    const error = new Error('recovery_memory_authority_input_invalid')
    error.code = 'recovery_memory_authority_input_invalid'
    error.status = 503
    throw error
  }
  const store = createQl7SupportMemoryStore({ database })
  const existing = await store.read(conversationId)
  if (existing) {
    if (existing.memoryHash !== graph.memoryHash || Number(existing.memoryVersion || 0) !== Number(graph.memoryVersion || 0)) {
      const error = new Error('recovery_memory_authority_divergence')
      error.code = 'recovery_memory_authority_divergence'
      error.status = 409
      throw error
    }
    return existing
  }
  const hydrated = await store.compareAndSwap({
    conversationId,
    actorIdHash,
    expectedVersion: 0,
    graph,
  })
  if (hydrated?.ok === true) return graph
  const raced = await store.read(conversationId)
  if (raced?.memoryHash === graph.memoryHash && Number(raced?.memoryVersion || 0) === Number(graph.memoryVersion || 0)) {
    return raced
  }
  const error = new Error('recovery_memory_authority_hydration_failed')
  error.code = 'recovery_memory_authority_hydration_failed'
  error.status = 409
  throw error
}

async function replayPreparedDeliveryAgainstLatestMemory({
  database,
  store,
  record,
  candidate,
  fencingToken,
  clock,
} = {}) {
  const target = await recoveryCaseForDelivery(database, record, candidate)
  if (target.targetKind !== 'support_case') return { replayed: false, record, candidate }
  const supportCase = await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne({ _id: target.caseId })
  const currentGraph = supportCase?.conversationMemoryGraph || null
  const currentHash = str(supportCase?.conversationMemoryHash || currentGraph?.memoryHash)
  const currentVersion = Number(supportCase?.conversationMemoryVersion ?? currentGraph?.memoryVersion ?? 0)
  const expectedHash = str(candidate.receipt.memoryBeforeHash)
  const expectedVersion = Number(candidate.receipt.memoryBeforeVersion || 0)
  if ((!currentHash || currentHash === expectedHash) && currentVersion === expectedVersion) {
    return { replayed: false, record, candidate }
  }
  if (!currentGraph || !currentHash || !record.runtime?.replayInput?.redactedText || !record.runtime?.idempotencyKey) {
    const error = new Error('semantic_replay_input_unavailable')
    error.code = 'semantic_replay_input_unavailable'
    error.status = 503
    throw error
  }
  await ensureQl7SupportRecoveryMemoryAuthority({
    database,
    conversationId: target.caseId,
    actorIdHash: record.actorIdHash,
    graph: currentGraph,
  })
  const replayInput = record.runtime.replayInput
  const replayNow = new Date(Number(clock())).toISOString()
  const replayTurn = await executeQl7SupportProductionTurn({
    mode: 'production',
    requestId: record.runtime.requestId || candidate.receipt.requestId,
    conversationId: target.caseId,
    caseId: target.caseId,
    userTurnId: candidate.receipt.sourceEventId,
    sourceEventId: candidate.receipt.sourceEventId,
    idempotencyKey: record.runtime.idempotencyKey,
    selectedLocale: replayInput.selectedLocale || candidate.locale,
    actor: { valid: true, canonicalAccountId: target.userId, aliases: [] },
    verifiedActorId: target.userId,
    originalText: replayInput.redactedText,
    analysis: replayInput.analysis || {},
    route: replayInput.route || {},
    tone: replayInput.tone || {},
    adapterReceipts: replayInput.adapterReceipts || [],
    priorMemoryGraph: currentGraph || supportCase.conversationMemoryGraph || supportCase.memory || {},
    priorNoveltyLedger: supportCase.semanticNoveltyLedger || null,
    contextualFollowup: true,
    now: replayNow,
    seed: `${candidate.receipt.sourceEventId}:semantic-replay:${currentHash}`,
    localizeFinalDelivery: (payload) => localizeQl7SupportFinalDeliveryBeforeQuality(payload),
  })
  const replacement = await store.replacePreparedForSemanticReplay(
    record,
    replayTurn.delivery,
    { fencingToken, runtime: replayTurn.runtime },
  )
  return {
    replayed: true,
    record: replacement,
    candidate: replayTurn.delivery,
    runtime: replayTurn.runtime,
  }
}

async function regenerateRecoveredDeliveryAfterNoveltyCollision({
  database,
  store,
  record,
  candidate,
  fencingToken,
  signingKey,
  keyId,
  collisionReceipt,
  attempt,
  clock,
} = {}) {
  if (!store?.replacePreparedForNoveltyRegeneration) {
    const error = new Error('recovery_novelty_regeneration_store_unavailable')
    error.code = 'recovery_novelty_regeneration_store_unavailable'
    error.status = 503
    throw error
  }
  const target = await recoveryCaseForDelivery(database, record, candidate)
  const runtime = record.runtime || {}
  const replayInput = runtime.replayInput
  if (!replayInput || !runtime.idempotencyKey) {
    const error = new Error('recovery_novelty_regeneration_input_unavailable')
    error.code = 'recovery_novelty_regeneration_input_unavailable'
    error.status = 503
    throw error
  }

  const storedGraph = target.supportCase?.conversationMemoryGraph || null
  const priorMemoryGraph = storedGraph || runtime.memoryBefore || null
  const currentMemoryHash = str(
    target.supportCase?.conversationMemoryHash || priorMemoryGraph?.memoryHash,
  )
  const currentMemoryVersion = Number(
    target.supportCase?.conversationMemoryVersion ?? priorMemoryGraph?.memoryVersion ?? 0,
  )
  if (currentMemoryHash !== str(candidate.receipt.memoryBeforeHash) ||
    currentMemoryVersion !== Number(candidate.receipt.memoryBeforeVersion || 0)) {
    const error = new Error('recovery_novelty_regeneration_memory_changed')
    error.code = 'recovery_novelty_regeneration_memory_changed'
    error.status = 409
    throw error
  }

  const entryGreeting = target.targetKind === 'entry_greeting'
  const eventNotification = target.targetKind === 'event_notification'
  const entryEvent = entryGreeting ? runtime.plan?.entryEvent : null
  const eventEnvelope = eventNotification ? target.supportCase?.envelope : null
  if (entryGreeting && !entryEvent) {
    const error = new Error('recovery_entry_event_projection_unavailable')
    error.code = 'recovery_entry_event_projection_unavailable'
    error.status = 503
    throw error
  }
  if (eventNotification && !eventEnvelope) {
    const error = new Error('recovery_event_envelope_projection_unavailable')
    error.code = 'recovery_event_envelope_projection_unavailable'
    error.status = 503
    throw error
  }

  const sourceEventId = candidate.receipt.sourceEventId
  const regeneratedTurn = await executeQl7SupportProductionTurn({
    mode: 'production',
    requestId: runtime.requestId || candidate.receipt.requestId,
    conversationId: target.caseId,
    caseId: target.caseId,
    userTurnId: sourceEventId,
    sourceEventId,
    idempotencyKey: runtime.idempotencyKey,
    selectedLocale: replayInput.selectedLocale || candidate.locale,
    actor: { valid: true, canonicalAccountId: target.userId, aliases: [] },
    verifiedActorId: target.userId,
    originalText: replayInput.redactedText || '',
    baseAnalysisTrust: entryGreeting || eventNotification,
    analysis: replayInput.analysis || {},
    route: replayInput.route || {},
    tone: replayInput.tone || {},
    adapterReceipts: replayInput.adapterReceipts || [],
    priorMemoryGraph: target.targetKind === 'support_case'
      ? (priorMemoryGraph || target.supportCase?.conversationMemoryGraph || target.supportCase?.memory || {})
      : priorMemoryGraph,
    priorNoveltyLedger: runtime.noveltyLedger || target.supportCase?.semanticNoveltyLedger || null,
    contextualFollowup: target.targetKind === 'support_case',
    entryEvent,
    eventEnvelope,
    now: runtime.now || candidate.receipt.createdAtServerUtc,
    seed: `${sourceEventId}:recovery-novelty:${Math.max(1, Number(attempt) || 1)}:${str(collisionReceipt?.receiptHash)}`,
    noveltyCollisionReceipt: collisionReceipt,
    deliverySigningKey: signingKey,
    deliverySigningKeyId: keyId,
    localizeFinalDelivery: (payload) => localizeQl7SupportFinalDeliveryBeforeQuality(payload),
  })
  const replacement = await store.replacePreparedForNoveltyRegeneration(
    record,
    regeneratedTurn.delivery,
    {
      fencingToken,
      runtime: regeneratedTurn.runtime,
      collisionReceipt,
      attempt,
    },
  )
  return {
    record: replacement,
    candidate: regeneratedTurn.delivery,
    runtime: regeneratedTurn.runtime,
  }
}

export async function recoverQl7SupportDeliveryCommits({
  database = null,
  workerId = `support-recovery:${process.pid}`,
  maxItems = 25,
  clock = () => Date.now(),
} = {}) {
  const targetDb = database || await db()
  const signing = await resolveQl7SupportDeliverySigningMaterialForServer({ mode: 'production' }, {})
  const store = createQl7SupportDeliveryStore(targetDb, { clock })
  return recoverDeliveryCommitsWorker({
    store,
    signingKey: signing.signingKey,
    keyId: signing.keyId,
    workerId,
    limit: Math.max(1, Math.min(100, Number(maxItems) || 25)),
    clock,
    acquireRecordGuard: async ({ record, candidate, workerId: recoveryWorkerId }) => {
      const target = await recoveryCaseForDelivery(targetDb, record, candidate)
      return acquireCanonicalQl7TurnSequence(targetDb, {
        userId: target.userId,
        conversationId: str(candidate?.receipt?.conversationId || target.caseId || 'ql7-support'),
        clientMutationId: str(candidate?.receipt?.clientMutationId || record?.idempotencyKeyHash),
        ownerToken: `recovery:${recoveryWorkerId}:${record.idempotencyKeyHash}:${crypto.randomUUID()}`,
        waitMs: 90_000,
        clock,
      })
    },
    releaseRecordGuard: (guard) => releaseCanonicalQl7TurnSequence(targetDb, guard, clock),
    semanticReplayPrepared: ({ record, candidate, fencingToken, store: recoveryStore }) => replayPreparedDeliveryAgainstLatestMemory({
      database: targetDb,
      store: recoveryStore,
      record,
      candidate,
      fencingToken,
      clock,
    }),
    regenerateCandidate: ({
      record,
      candidate,
      fencingToken,
      collisionReceipt,
      attempt,
      store: recoveryStore,
    }) => regenerateRecoveredDeliveryAfterNoveltyCollision({
      database: targetDb,
      store: recoveryStore,
      record,
      candidate,
      fencingToken,
      signingKey: signing.signingKey,
      keyId: signing.keyId,
      collisionReceipt,
      attempt,
      clock,
    }),
    reconcileTransport: async ({ record, candidate, idempotencyKeyHash, candidateHash, deliveryBindingId }) => {
      const message = await findCommittedDmForRecovery(targetDb, record, candidate)
      if (!message) return {
        status: 'not_sent',
        definitive: true,
        matchedBy: 'candidate_hash',
        idempotencyKeyHash,
        candidateHash,
        deliveryBindingId,
      }
      return {
        status: 'sent',
        definitive: true,
        matchedBy: 'candidate_hash',
        idempotencyKeyHash,
        candidateHash,
        deliveryBindingId,
        finalMessageId: message.id,
        transportEvidence: {
          finalMessageId: message.id,
          candidateHash,
          deliveryBindingId,
          recoveredFrom: 'dm_messages',
        },
      }
    },
    transport: async (candidate, { record, session = null, database: transactionDatabase = null } = {}) => {
      const transactionContext = {
        session,
        database: transactionDatabase || targetDb,
      }
      const { userId, targetKind, supportCase } = await recoveryCaseForDelivery(
        targetDb,
        record,
        candidate,
        { session },
      )
      const entryGreeting = targetKind === 'entry_greeting'
      const eventNotification = targetKind === 'event_notification'
      const eventEnvelope = eventNotification ? supportCase?.envelope : null
      if (eventNotification && eventEnvelope?.envelopeHash !== record.runtime?.plan?.eventEnvelope?.envelopeHash) {
        const error = new Error('recovery_event_runtime_envelope_mismatch')
        error.code = 'recovery_event_runtime_envelope_mismatch'
        throw error
      }
      const deliveryEventType = entryGreeting
        ? 'entry_greeting'
        : eventNotification
          ? eventEnvelope.type
          : 'support_reply'
      const delivered = await deliverQl7SupportMessage({
        userId,
        text: candidate.text,
        dedupeKey: eventNotification
          ? eventEnvelope.dedupeKey
          : buildQl7SupportDedupeKey({
            userId,
            eventType: deliveryEventType,
            subjectId: candidate.receipt.sourceEventId || candidate.receipt.turnId,
          }),
        eventType: deliveryEventType,
        locale: candidate.locale,
        payload: eventEnvelope?.payload || null,
        supportCard: candidate.surface,
        clientMutationId: `recovery:${candidate.receipt.idempotencyKeyHash}`.slice(0, 160),
        correlationId: candidate.receipt.requestId,
        triggeringUserMessageId: candidate.receipt.sourceEventId,
        metadata: {
          caseId: candidate.receipt.conversationId,
          entryGreeting,
          eventNotification,
          eventId: eventEnvelope?.eventId || '',
          eventEnvelopeHash: eventEnvelope?.envelopeHash || '',
          eventEnvelopeReceiptId: eventEnvelope?.receiptId || '',
          eventSourceReceiptId: eventEnvelope?.sourceReceipt?.receiptId || '',
          broadcastId: str(eventEnvelope?.payload?.broadcastId),
          topic: candidate.topic,
          messageAct: candidate.messageAct,
          responseCode: candidate.responseCode,
          deliveryReceiptId: candidate.receipt.receiptId,
          deliveryReceiptHash: candidate.receipt.receiptHash,
          deliveryCandidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
          supportAutoReply: !entryGreeting && !eventNotification,
          recoveredDelivery: true,
        },
        ts: Date.parse(candidate.receipt.createdAtServerUtc) || Number(clock()),
        push: eventNotification
          ? eventEnvelope?.pushPolicy !== 'none'
          : !entryGreeting,
        transactionContext,
      })
      return {
        ...delivered,
        providerReceiptId: str(delivered?.deliveryReceiptId || delivered?.receiptId),
        transportEvidence: {
          messageId: str(delivered?.id || delivered?.messageId),
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.deliveryBindingId,
        },
      }
    },
    commitMemoryAndCase: (delivery, { record, session = null }) => commitRecoveredDeliveryMemory(
      targetDb,
      delivery,
      record,
      { session },
    ),
    reconcileCommittedMemory: async (delivery, { record }) => {
      const conflictId = `memory-conflict:${record.idempotencyKeyHash}`
      await targetDb.collection('ql7_support_memory_recovery_conflicts').updateOne(
        { _id: conflictId },
        { $setOnInsert: {
          _id: conflictId,
          schema: 'ql7.support.memory-recovery-conflict',
          schemaVersion: '5.1.0',
          actorIdHash: record.actorIdHash,
          conversationId: record.conversationId,
          idempotencyKeyHash: record.idempotencyKeyHash,
          deliveryBindingId: record.deliveryBindingId,
          receiptHash: delivery.receipt.receiptHash,
          status: 'unexpected_post_transport_conflict',
          createdAtServerUtc: new Date(Number(clock())).toISOString(),
        } },
        { upsert: true },
      )
      return { ok: false }
    },
  })
}
