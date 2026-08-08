import crypto from 'crypto'
import { getQl7SupportSourceContract, isAllowedQl7SupportCollection } from './sourceRegistry.js'
import { normalizeQl7SupportTopic } from './ecosystemCatalog.js'
import { runQl7SupportAdsDiagnostic, runQl7SupportQcoinDiagnostic } from './diagnostics.js'
import { runQl7SupportVipDiagnosticV8 } from './vipResolverV8.js'

export const QL7_SUPPORT_PREMIUM_DIAGNOSTIC_COLLECTION = 'ql7_support_diagnostic_runs'

function str(value) { return String(value ?? '').trim() }
function unique(values = []) { return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean))) }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function nowIso(value) { const date = value instanceof Date ? value : new Date(value || Date.now()); return date.toISOString() }
function lower(value) { return str(value).toLowerCase() }

function entityValues(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return unique([
    entities.invoiceId, entities.paymentId, entities.orderId, entities.postId, entities.threadId,
    entities.campaignId, entities.packageId, entities.accountId, entities.walletAddress,
    entities.transactionHash, entities.telegramId, entities.nickname, entities.bareId,
  ])
}
function boundedFilter(contract, userIds = [], probes = []) {
  const clauses = []
  const keys = Array.isArray(contract?.filterKeys) ? contract.filterKeys : []
  for (const key of keys) {
    if (userIds.length && ['_id', 'userId', 'accountId', 'uid', 'ownerId', 'ownerUserId', 'rawAccountId', 'walletAddress', 'wallet'].includes(key)) clauses.push({ [key]: { $in: userIds } })
    if (probes.length && ['_id', 'id', 'messageId', 'caseId', 'threadId', 'postId', 'orderId', 'invoiceId', 'paymentId', 'campaignId', 'packageId', 'telegramId', 'nickname'].includes(key)) clauses.push({ [key]: { $in: probes } })
  }
  return clauses.length ? { $or: clauses } : { _id: '__ql7_support_no_unbounded_scan__' }
}
function rowOwnerValues(row = {}) { return unique([row.userId, row.accountId, row.uid, row.ownerId, row.ownerUserId, row.rawAccountId, row.walletAddress, row.wallet]) }
async function listCollectionNames(database) {
  if (!database?.listCollections) return null
  const rows = await database.listCollections({}, { nameOnly: true }).toArray()
  return new Set((rows || []).map((row) => str(row?.name)).filter(Boolean))
}
async function collectionFingerprint(database, collectionName) {
  const collection = database.collection(collectionName)
  const count = await collection.countDocuments({}).catch(() => null)
  const latest = await collection.find({}).sort({ updatedAt: -1, ts: -1, _id: -1 }).limit(3).toArray().catch(() => [])
  return { collection: collectionName, count, sampleHash: hash((latest || []).map((row) => ({ _id: row?._id, updatedAt: row?.updatedAt, ts: row?.ts }))) }
}
async function fingerprintCollections(database, collections = []) {
  const rows = []
  for (const name of collections) rows.push(await collectionFingerprint(database, name))
  return rows
}
function statusValues(row, fields = []) { return fields.map((key) => row?.[key]).filter((value) => value != null).map(str).filter(Boolean) }
function safeScalar(value) {
  if (value == null) return null
  if (typeof value === 'number' || typeof value === 'boolean') return value
  const text = str(value)
  if (!text) return null
  return text.slice(0, 180)
}
function safeFactRows(rowsByCollection, contract, asOf) {
  const facts = []
  for (const [collection, rows] of Object.entries(rowsByCollection)) {
    facts.push({ code: 'collection_match_count', collection, value: rows.length, source: collection, asOf, confidence: 1 })
    const statuses = unique(rows.flatMap((row) => statusValues(row, contract.statusFields))).slice(0, 8)
    if (statuses.length) facts.push({ code: 'observed_status_values', collection, value: statuses, source: collection, asOf, confidence: 0.95 })
    for (const field of (contract.evidenceFields || []).slice(0, 16)) {
      const values = []
      for (const row of rows) {
        const value = safeScalar(row?.[field])
        if (value == null || values.some((item) => JSON.stringify(item) === JSON.stringify(value))) continue
        values.push(value)
        if (values.length >= 5) break
      }
      if (values.length) facts.push({ code: `observed_${field}`, collection, field, value: values, source: collection, asOf, confidence: 0.9 })
    }
  }
  return facts
}

const FAMILY_ANALYSIS_POLICY = Object.freeze({
  knowledge: { absent: 'knowledge_registry_no_runtime_data', healthy: 'knowledge_route_evidence_available', pending: /draft|planned|concept|beta/, bad: /retired|deprecated|unavailable/, next: 'explain_verified_capabilities' },
  market: { absent: 'market_snapshot_not_available', healthy: 'market_snapshot_available', pending: /stale|delayed|pending/, bad: /failed|invalid|unavailable/, next: 'show_market_as_of_and_source' },
  content: { absent: 'content_item_not_found', healthy: 'content_item_available', pending: /draft|queued|processing/, bad: /removed|blocked|failed/, next: 'show_content_source_and_published_at' },
  entitlement: { absent: 'entitlement_not_found', healthy: 'entitlement_active', pending: /pending|activating|grace/, bad: /expired|inactive|revoked|failed/, next: 'explain_entitlement_status_and_expiry' },
  orders: { absent: 'order_not_found', healthy: 'order_consistent', pending: /open|pending|partial|processing/, bad: /rejected|cancelled|failed|inconsistent/, next: 'explain_order_lifecycle' },
  messages: { absent: 'message_or_thread_not_found', healthy: 'message_delivery_consistent', pending: /sending|queued|delivered/, bad: /failed|blocked|deleted|inconsistent/, next: 'explain_delivery_and_seen_state' },
  education: { absent: 'education_attempt_not_found', healthy: 'education_progress_consistent', pending: /started|pending|in_progress/, bad: /failed|invalid|blocked/, next: 'explain_attempt_score_and_completion' },
  progress: { absent: 'progress_record_not_found', healthy: 'progress_consistent', pending: /started|pending|in_progress|eligible/, bad: /failed|blocked|ineligible/, next: 'explain_progress_and_eligibility' },
  registration: { absent: 'registration_not_found', healthy: 'registration_consistent', pending: /pending|review|queued/, bad: /rejected|failed|blocked/, next: 'explain_registration_state' },
  forum: { absent: 'forum_object_not_found', healthy: 'forum_object_consistent', pending: /pending|review|processing/, bad: /deleted|blocked|failed|inconsistent/, next: 'explain_forum_object_and_moderation_state' },
  search: { absent: 'search_index_no_match', healthy: 'search_index_match', pending: /stale|rebuilding|pending/, bad: /failed|invalid/, next: 'explain_search_match_and_index_age' },
  geo: { absent: 'geo_evidence_not_found', healthy: 'geo_evidence_available', pending: /approximate|fallback|pending/, bad: /invalid|stale|failed/, next: 'explain_geo_precision_source_and_as_of' },
  media: { absent: 'media_asset_not_found', healthy: 'media_asset_ready', pending: /uploading|processing|queued|pending/, bad: /failed|blocked|rejected|deleted/, next: 'explain_media_processing_and_moderation' },
  moderation: { absent: 'moderation_event_not_found', healthy: 'moderation_state_consistent', pending: /pending|review|threshold/, bad: /failed|inconsistent|blocked/, next: 'explain_threshold_action_and_evidence' },
  ownership: { absent: 'owned_item_not_found', healthy: 'ownership_consistent', pending: /pending|transferring|listed/, bad: /failed|inconsistent|revoked/, next: 'explain_owner_count_and_latest_event' },
  social: { absent: 'relationship_not_found', healthy: 'relationship_consistent', pending: /pending|syncing/, bad: /failed|blocked|inconsistent/, next: 'explain_follow_state_and_counts' },
  profile: { absent: 'profile_not_found', healthy: 'profile_projection_consistent', pending: /pending|syncing/, bad: /failed|blocked|deleted/, next: 'explain_profile_projection_and_activity' },
  identity: { absent: 'identity_evidence_not_found', healthy: 'identity_verified', pending: /pending|refreshing/, bad: /expired|revoked|mismatch|invalid|failed/, next: 'explain_verified_actor_and_session_state' },
  ledger: { absent: 'ledger_record_not_found', healthy: 'ledger_consistent', pending: /pending|processing|created/, bad: /failed|reversed|inconsistent|cancelled/, next: 'explain_invoice_event_ledger_and_balance' },
  payments: { absent: 'payment_record_not_found', healthy: 'payment_consistent', pending: /pending|confirming|processing/, bad: /failed|expired|rejected|inconsistent/, next: 'explain_payment_webhook_and_credit_state' },
  ads: { absent: 'ads_record_not_found', healthy: 'ads_state_consistent', pending: /pending|review|scheduled/, bad: /expired|failed|blocked|inconsistent/, next: 'explain_package_campaign_and_metrics' },
  notifications: { absent: 'notification_state_not_found', healthy: 'notification_delivery_consistent', pending: /queued|pending|delivered/, bad: /failed|blocked|inconsistent/, next: 'explain_delivery_seen_and_unread_state' },
  outbox: { absent: 'outbox_event_not_found', healthy: 'outbox_event_sent', pending: /pending|leased|retry|queued/, bad: /dead_letter|failed/, next: 'explain_outbox_attempt_and_next_action' },
  privacy: { absent: 'privacy_event_not_found', healthy: 'privacy_state_consistent', pending: /pending|review/, bad: /failed|blocked|inconsistent/, next: 'explain_privacy_scope_and_retention' },
  security: { absent: 'security_event_not_found', healthy: 'security_state_consistent', pending: /pending|review|investigating/, bad: /revoked|mismatch|invalid|failed|incident/, next: 'explain_safe_security_evidence' },
  deletion: { absent: 'deletion_request_not_found', healthy: 'deletion_state_consistent', pending: /pending|confirmed|processing/, bad: /failed|blocked|inconsistent/, next: 'explain_deletion_lifecycle_without_mutation' },
  runtime: { absent: 'runtime_state_not_available', healthy: 'runtime_state_healthy', pending: /starting|degraded|pending/, bad: /offline|failed|unavailable|error/, next: 'explain_runtime_state_and_last_change' },
  translation: { absent: 'translation_evidence_not_available', healthy: 'translation_provider_healthy', pending: /pending|fallback/, bad: /failed|invalid|unavailable/, next: 'explain_language_provider_and_validation' },
  accessibility: { absent: 'accessibility_evidence_not_available', healthy: 'accessibility_contract_available', pending: /pending|partial/, bad: /failed|overflow|blocked/, next: 'explain_reduced_motion_rtl_and_mobile_state' },
  support: { absent: 'support_case_not_found', healthy: 'support_case_consistent', pending: /collecting|diagnosing|waiting|pending/, bad: /failed|inconsistent|error/, next: 'explain_case_diagnostic_and_delivery_state' },
})

function evaluateFamily(contract, rows = []) {
  const policy = FAMILY_ANALYSIS_POLICY[contract.family] || FAMILY_ANALYSIS_POLICY.knowledge
  const values = rows.flatMap((row) => statusValues(row, contract.statusFields)).map(lower)
  const bad = values.filter((value) => policy.bad?.test?.(value))
  const pending = values.filter((value) => policy.pending?.test?.(value))
  if (!rows.length) return { analyzerId: contract.analyzerId, branch: policy.absent, status: 'waiting_user', recommendationCode: policy.next }
  if (bad.length) return { analyzerId: contract.analyzerId, branch: `${contract.family}_inconsistent`, status: 'inconsistent', recommendationCode: policy.next, observedSignals: bad.slice(0, 8) }
  if (pending.length) return { analyzerId: contract.analyzerId, branch: `${contract.family}_pending`, status: 'partial', recommendationCode: policy.next, observedSignals: pending.slice(0, 8) }
  return { analyzerId: contract.analyzerId, branch: policy.healthy, status: 'healthy', recommendationCode: policy.next, observedSignals: values.slice(0, 8) }
}
function legacyDiagnosticBranch(branch = '', status = '') {
  const specialized = str(branch)
  if ([
    'foreign_account',
    'diagnostic_not_applicable',
    'source_unavailable',
    'timeout',
    'provider_failure',
    'mongo_unavailable',
  ].includes(specialized)) return specialized
  if (status === 'healthy') return 'source_present'
  if (status === 'inconsistent') return 'inconsistent'
  if (status === 'partial') return 'pending'
  if (status === 'waiting_user') return 'no_source'
  return specialized
}
async function recordRun(database, payload = {}) {
  const at = nowIso(payload.now)
  const specializedBranch = str(payload.specializedBranch || payload.branch)
  const branch = str(payload.legacyBranch || legacyDiagnosticBranch(specializedBranch, str(payload.status)))
  const runId = str(payload.runId) || `diag:${hash({ topic: payload.topic, caseId: payload.caseId, branch: specializedBranch, at }).slice(0, 24)}`
  const doc = {
    _id: runId, runId, schemaVersion: 2, branchSchemaVersion: 2,
    topic: str(payload.topic), playbook: str(payload.playbook), branch, specializedBranch, status: str(payload.status),
    recommendationCode: str(payload.recommendationCode), userId: str(payload.userId), caseId: str(payload.caseId), readOnly: true,
    sourceContract: clone(payload.sourceContract), evidence: clone(payload.evidence) || {}, checks: clone(payload.checks) || [],
    facts: clone(payload.facts) || [], anomalies: clone(payload.anomalies) || [], missingEvidence: clone(payload.missingEvidence || payload.missing) || [],
    businessCollectionsRead: clone(payload.businessCollectionsRead) || [], businessCollectionsWritten: [],
    writeSpy: { attemptedBusinessWrites: 0, blockedBusinessWrites: 0, mutationMethodsExposed: false },
    startedAt: str(payload.startedAt || at), finishedAt: at, asOf: at, createdAt: at, storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_PREMIUM_DIAGNOSTIC_COLLECTION).updateOne({ _id: runId }, { $set: doc, $setOnInsert: { createdAt: at } }, { upsert: true })
  return doc
}

async function runRegisteredAdapter({ database, userId, aliases = [], caseId = '', analysis = {}, topic, now = new Date(), timeoutMs = 2500 } = {}) {
  const sourceContract = getQl7SupportSourceContract(topic)
  const startedAt = nowIso(now)
  if (sourceContract.mode === 'diagnostic_not_applicable') {
    return recordRun(database, {
      topic, playbook: sourceContract.playbook, branch: 'diagnostic_not_applicable', status: 'not_applicable', recommendationCode: `${sourceContract.family}_knowledge_answer`, userId, caseId, now, startedAt,
      sourceContract, businessCollectionsRead: [], missingEvidence: [], facts: [{ code: 'route_evidence', value: sourceContract.routeEvidence, source: 'project_registry', asOf: startedAt, confidence: 1 }],
      evidence: { sourcePolicy: 'knowledge_or_route_evidence_only', routeEvidence: sourceContract.routeEvidence, readOnlyProof: true },
    })
  }
  const availableNames = await listCollectionNames(database).catch(() => null)
  const requested = sourceContract.collections.filter(isAllowedQl7SupportCollection).slice(0, sourceContract.maxCollections)
  const existing = availableNames ? requested.filter((name) => availableNames.has(name)) : requested
  if (availableNames && !existing.length) {
    return recordRun(database, {
      topic, playbook: sourceContract.playbook, branch: 'source_unavailable', status: 'unavailable', recommendationCode: `${sourceContract.family}_source_unavailable`, userId, caseId, now, startedAt,
      sourceContract, businessCollectionsRead: [], missingEvidence: requested,
      evidence: { sourcePolicy: 'declared_source_not_present', unavailableSources: requested, noData: false },
    })
  }
  const ids = unique([userId, ...aliases])
  const probes = entityValues(analysis)
  const filter = boundedFilter(sourceContract, ids, probes)
  const before = await fingerprintCollections(database, existing)
  const rowsByCollection = {}
  const errors = []
  const startMs = Date.now()
  for (const name of existing) {
    if (Date.now() - startMs > Math.min(timeoutMs, sourceContract.maxTimeMs)) { errors.push({ collection: name, code: 'timeout' }); break }
    try {
      let cursor = database.collection(name).find(filter).sort({ updatedAt: -1, ts: -1, _id: -1 }).limit(sourceContract.maxRowsPerCollection)
      if (typeof cursor.project === 'function') cursor = cursor.project(Object.fromEntries(sourceContract.projection.map((key) => [key, 1])))
      rowsByCollection[name] = await cursor.toArray()
    } catch (error) {
      errors.push({ collection: name, code: 'provider_failure', message: str(error?.message).slice(0, 240) })
    }
  }
  const after = await fingerprintCollections(database, existing)
  const unchanged = hash(before) === hash(after)
  if (!unchanged) errors.push({ code: 'read_only_fingerprint_changed' })
  if (errors.length) {
    return recordRun(database, {
      topic, playbook: sourceContract.playbook, branch: errors.some((row) => row.code === 'timeout') ? 'timeout' : 'provider_failure', status: 'unavailable', recommendationCode: `${sourceContract.family}_retry_bounded`, userId, caseId, now, startedAt,
      sourceContract, businessCollectionsRead: existing, anomalies: errors, missingEvidence: existing,
      evidence: { errors, before, after, readOnlyProof: unchanged, noData: false },
    })
  }
  const rows = Object.values(rowsByCollection).flat()
  const foreign = rows.some((row) => {
    const owners = rowOwnerValues(row)
    return owners.length && !owners.some((owner) => ids.some((id) => lower(owner) === lower(id)))
  })
  const outcome = foreign
    ? { branch: 'foreign_account', status: 'inconsistent', recommendationCode: 'privacy_block_foreign_account' }
    : evaluateFamily(sourceContract, rows)
  const facts = safeFactRows(rowsByCollection, sourceContract, nowIso(now))
  return recordRun(database, {
    topic, playbook: sourceContract.playbook, ...outcome, userId, caseId, now, startedAt, sourceContract, businessCollectionsRead: existing,
    checks: [
      { code: 'bounded_filter', passed: true, identityCount: ids.length, probeCount: probes.length },
      { code: 'row_limit', passed: rows.length <= sourceContract.maxRowsPerCollection * existing.length, rows: rows.length },
      { code: 'read_only_fingerprint', passed: unchanged },
      { code: 'privacy_owner_check', passed: !foreign },
      { code: 'domain_analyzer', passed: Boolean(outcome.analyzerId), analyzerId: outcome.analyzerId || sourceContract.analyzerId },
    ],
    facts,
    anomalies: outcome.status === 'inconsistent' ? [{ code: outcome.branch, severity: 'medium' }] : [],
    missingEvidence: rows.length ? [] : ['matching_record'],
    evidence: {
      collectionHits: Object.fromEntries(Object.entries(rowsByCollection).map(([name, list]) => [name, list.length])),
      rowsFound: rows.length, readOnlyProof: unchanged, before, after, userSafe: true,
      sourceUnavailable: false, noData: rows.length === 0, routeEvidence: sourceContract.routeEvidence, analyzerId: outcome.analyzerId || sourceContract.analyzerId, observedSignals: outcome.observedSignals || [],
    },
  })
}

export async function runQl7SupportPremiumDiagnostic(input = {}) {
  const database = input.database
  const topic = normalizeQl7SupportTopic(input?.analysis?.topic || input?.topic || 'support_system')
  if (!database || typeof database.collection !== 'function') return { ok: false, topic, branch: 'mongo_unavailable', status: 'unavailable', readOnly: true, businessCollectionsRead: [], businessCollectionsWritten: [], error: 'mongo_db_unavailable' }
  if (topic === 'vip') {
    const result = await runQl7SupportVipDiagnosticV8(input)
    return { ...result, playbook: 'vip_entitlement_identity_graph_v8', sourceContract: getQl7SupportSourceContract(topic), businessCollectionsWritten: [], readOnly: true }
  }
  if (topic === 'qcoin') {
    const result = await runQl7SupportQcoinDiagnostic(input)
    return { ...result, playbook: 'ledger_evidence_playbook', sourceContract: getQl7SupportSourceContract(topic), businessCollectionsWritten: [], readOnly: true }
  }
  if (topic === 'ads_packages' || topic === 'ads_campaigns') {
    const result = await runQl7SupportAdsDiagnostic(input)
    return { ...result, playbook: 'ads_evidence_playbook', sourceContract: getQl7SupportSourceContract(topic), businessCollectionsWritten: [], readOnly: true }
  }
  const result = await runRegisteredAdapter({ ...input, topic })
  return { ok: !['unavailable'].includes(result.status), ...result }
}
