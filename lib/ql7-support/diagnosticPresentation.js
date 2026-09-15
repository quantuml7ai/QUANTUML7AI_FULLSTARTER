import {getQl7SupportTopicLabel, normalizeQl7SupportTopic} from './ecosystemCatalog.js'
import {normalizeQl7MetricKey, ql7MetricFormat} from './metricRegistry.js'
import {ql7StableHash, ql7Str} from './internal/text.js'
import {localizeQl7EvidenceValue} from './evidencePolicy.js'

export const QL7_SUPPORT_DIAGNOSTIC_SEMANTIC_PROJECTION_VERSION = '16.0.0'

const FORBIDDEN_PRESENTATION_KEY = /(?:^|\.)(?:_?id|adapterId|analyzerId|sourceContract|businessCollectionsRead|businessCollectionsWritten|supportCollectionsWritten|collection|collections|query|filterKeys|projection|routeEvidence|raw|token|secret|password|uri|internal|userId|accountId|rawAccountId|subjectId|runId|signature|stack|playbook)$/iu
const FORBIDDEN_PRESENTATION_SEGMENT = /(?:adapter|analyzer|collection|query|filter|rawaccount|userid|accountid|subjectid|runid|signature|token|secret|password|internal|routeevidence|sourcecontract|businesscollection|supportcollection)/iu

function userSafeMetricValue(raw, locale = 'en') {
  if (typeof raw === 'boolean') return localizeQl7EvidenceValue(raw, locale)
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : ''
  if (typeof raw === 'string') return localizeQl7EvidenceValue(raw, locale)
  return raw
}

function safeMetricKey(path = '', key = '') {
  const full = path ? `${path}.${key}` : key
  const normalized = normalizeQl7MetricKey(full) || normalizeQl7MetricKey(key) || key
  if (!normalized || FORBIDDEN_PRESENTATION_KEY.test(full) || FORBIDDEN_PRESENTATION_SEGMENT.test(normalized)) return ''
  return normalized
}

function rowsFromObject(value = {}, locale = 'en', prefix = '') {
  if (!value || typeof value !== 'object') return []
  const rows = []
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null || raw === '') continue
    const metricKey = safeMetricKey(prefix, key)
    if (!metricKey) continue
    if (Array.isArray(raw)) {
      const values = raw
        .slice(0, 24)
        .filter((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))
        .map((item) => userSafeMetricValue(item, locale))
        .filter((item) => item !== '' && item !== null && item !== undefined)
      if (values.length || raw.length === 0) rows.push({ key: metricKey, value: values, format: 'list' })
    } else if (typeof raw === 'object') {
      rows.push(...rowsFromObject(raw, locale, metricKey))
    } else {
      const visible = userSafeMetricValue(raw, locale)
      if (visible === '' || visible === null || visible === undefined) continue
      rows.push({ key: metricKey, value: visible, format: ql7MetricFormat(metricKey) })
    }
  }
  return rows.slice(0, 80)
}

// Compatibility projection only. It emits diagnostic semantics/data, never final prose.
// Canonical visible wording is owned by SemanticResponsePlan -> HNR.
export function presentQl7SupportDiagnostic({ requestContext = {}, diagnosticResult = {}, topic = '', locale = 'en' } = {}) {
  const domainId = normalizeQl7SupportTopic(topic || requestContext?.topic || diagnosticResult?.topic || 'support_system')
  const resultKind = ql7Str(diagnosticResult?.resultKind || diagnosticResult?.status || 'unavailable')
  const payload = diagnosticResult?.data && typeof diagnosticResult.data === 'object'
    ? diagnosticResult.data
    : diagnosticResult?.result && typeof diagnosticResult.result === 'object'
      ? diagnosticResult.result
      : diagnosticResult
  const rows = rowsFromObject(payload, locale)
  const sourceReceipts = Array.isArray(diagnosticResult?.sourceReceipts)
    ? diagnosticResult.sourceReceipts.map((row) => ql7Str(row?.receiptId || row?.id)).filter(Boolean)
    : []
  const propositionIds = Object.freeze([
    `diagnostic.domain:${domainId}`,
    `diagnostic.result:${resultKind}`,
    ...rows.slice(0, 24).map((row) => `diagnostic.metric:${row.key}`),
  ])
  const body = {
    schema: 'ql7.support.diagnostic-semantic-projection',
    schemaVersion: QL7_SUPPORT_DIAGNOSTIC_SEMANTIC_PROJECTION_VERSION,
    kind: 'structured_diagnostic',
    topic: domainId,
    locale,
    title: getQl7SupportTopicLabel(domainId, locale),
    summary: '',
    status: resultKind,
    semanticIcon: resultKind === 'inconsistent' ? 'warning' : domainId,
    propositionIds,
    sourceReceiptIds: Object.freeze(sourceReceipts),
    tableSchema: Object.freeze({
      schema: `ql7.table.diagnostic.${domainId}`,
      columns: Object.freeze(['key', 'value']),
      rows: Object.freeze(rows.map((row) => Object.freeze(row))),
    }),
    nextActions: Object.freeze([]),
    readyToSend: false,
    finalText: false,
    realizationOwner: 'response/humanNaturalRealizer.js',
  }
  const projectionHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, projectionHash, card: Object.freeze({ ...body, projectionHash }) })
}
