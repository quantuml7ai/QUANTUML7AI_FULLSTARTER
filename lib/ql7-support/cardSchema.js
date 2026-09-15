import crypto from 'node:crypto'
import {normalizeQl7SupportPresentationCard} from './cards/cardPresentation.js'
import {normalizeQl7MetricRows} from './metricRegistry.js'
import {getQl7SupportActionDescriptor, isQl7SupportSafeRouteId} from './topicActionRegistry.js'
import {localizeQl7SupportBadgeRailLabel} from './semanticBadgeRegistry.js'

export const QL7_SUPPORT_CARD_SCHEMA = 4

const SAFE = /^[a-f0-9]{64}$/i
function str(value) { return String(value ?? '').trim() }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }

const SAFE_GLOBAL_EVENT = /^(?:quantum-wallet:open|metamarket:open|open-auth)$/u
const SAFE_CASE_ACTIONS = new Set(['continue_support'])
const SAFE_RETRY_ACTIONS = new Set(['retry_diagnostic'])

function safeInternalHref(value = '') {
  const href = str(value)
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return ''
  return /^\/[A-Za-z0-9/_?=&.#%-]*$/u.test(href) ? href : ''
}

function safeActionDetail(value = null, fallback = null) {
  const source = value && typeof value === 'object' ? value : {}
  const base = fallback && typeof fallback === 'object' ? fallback : {}
  const detail = {
    source: str(source.source || base.source).slice(0, 80),
    tab: str(source.tab || base.tab).slice(0, 80),
    initialMode: str(source.initialMode || base.initialMode).slice(0, 80),
  }
  return Object.values(detail).some(Boolean) ? Object.freeze(detail) : null
}

function normalizeActions(actions = []) {
  return (Array.isArray(actions) ? actions : [])
    .map((action, index) => {
      const routeId = str(action?.routeId)
      const descriptor = routeId && isQl7SupportSafeRouteId(routeId)
        ? getQl7SupportActionDescriptor(routeId)
        : null
      const explicitHref = safeInternalHref(action?.href)
      const explicitEvent = SAFE_GLOBAL_EVENT.test(str(action?.eventName)) ? str(action.eventName) : ''
      const explicitCaseAction = SAFE_CASE_ACTIONS.has(str(action?.caseAction)) ? str(action.caseAction) : ''
      const explicitRetryAction = SAFE_RETRY_ACTIONS.has(str(action?.caseAction)) ? str(action.caseAction) : ''

      let actionType = ''
      let href = ''
      let eventName = ''
      let caseAction = ''
      let tab = str(action?.tab).slice(0, 80)
      let detail = null

      if (descriptor) {
        actionType = str(descriptor.actionType)
        href = safeInternalHref(descriptor.href) || explicitHref
        eventName = SAFE_GLOBAL_EVENT.test(str(descriptor.eventName)) ? str(descriptor.eventName) : ''
        caseAction = SAFE_CASE_ACTIONS.has(str(descriptor.caseAction)) ? str(descriptor.caseAction) : ''
        tab = str(action?.tab || descriptor.tab).slice(0, 80)
        detail = safeActionDetail(action?.detail, descriptor.detail)
      } else if (explicitHref) {
        actionType = 'route'
        href = explicitHref
        detail = safeActionDetail(action?.detail)
      } else if (explicitEvent) {
        actionType = 'global_event'
        eventName = explicitEvent
        detail = safeActionDetail(action?.detail)
      } else if (explicitCaseAction) {
        actionType = 'case_action'
        caseAction = explicitCaseAction
        detail = safeActionDetail(action?.detail)
      } else if (str(action?.actionType) === 'retry_diagnostic' && explicitRetryAction) {
        actionType = 'retry_diagnostic'
        caseAction = explicitRetryAction
        detail = safeActionDetail(action?.detail)
      } else {
        return null
      }

      if (actionType === 'route' && !href) return null
      if (actionType === 'global_event' && !eventName) return null
      if (actionType === 'case_action' && !caseAction) return null
      if (actionType === 'retry_diagnostic' && caseAction !== 'retry_diagnostic') return null

      return Object.freeze({
        id: str(action?.id || `action-${index}`).slice(0, 120),
        routeId: descriptor ? routeId : '',
        actionType,
        href,
        eventName,
        detail,
        tab,
        caseAction,
        label: str(action?.label).slice(0, 120),
        labelKey: str(action?.labelKey).slice(0, 80),
        iconKey: str(action?.iconKey || action?.icon).slice(0, 40),
        kind: str(action?.kind || 'secondary').slice(0, 40),
      })
    })
    .filter(Boolean)
    .slice(0, 6)
}

const SAFE_TABLE_TONES = new Set(['neutral','success','warning','danger','accent','info'])
const SAFE_TABLE_FORMATS = new Set(['text','integer','decimal','percent','currency','datetime','boolean'])
function normalizeTable(inputTable = null, fallbackTable = null) {
  const fallback = fallbackTable && typeof fallbackTable === 'object' ? fallbackTable : null
  if (!fallback) return null
  const source = inputTable && typeof inputTable === 'object' ? inputTable : {}
  const sourceRows = Array.isArray(source.rows) ? source.rows : []
  const rows = (Array.isArray(fallback.rows) ? fallback.rows : [])
    .map((row, index) => {
      const sourceRow = sourceRows[index] && typeof sourceRows[index] === 'object' ? sourceRows[index] : {}
      const key = str(sourceRow.key || row?.key || `row-${index}`).slice(0, 80)
      const toneRaw = str(sourceRow.tone || row?.tone || 'neutral').toLowerCase()
      const formatRaw = str(sourceRow.format || row?.format || 'text').toLowerCase()
      return Object.freeze({
        ...(row && typeof row === 'object' ? row : {}),
        key,
        tone: SAFE_TABLE_TONES.has(toneRaw) ? toneRaw : 'neutral',
        format: SAFE_TABLE_FORMATS.has(formatRaw) ? formatRaw : 'text',
      })
    })
    .filter((row) => row.key && Object.keys(row).some((key) => !['key','tone','format'].includes(key)))
    .slice(0, 32)
  return Object.freeze({
    ...fallback,
    title: str(source.title || fallback.title).slice(0, 240),
    columns: Object.freeze(Array.isArray(fallback.columns) ? fallback.columns : []),
    rows: Object.freeze(rows),
  })
}

function normalizeBadges(badges = [], locale = 'en') {
  return (Array.isArray(badges) ? badges : [])
    .map((badge, index) => ({
      id: str(badge?.id || `badge-${index}`),
      label: localizeQl7SupportBadgeRailLabel(badge, locale).slice(0, 120),
      tone: str(badge?.tone || 'neutral'),
      icon: str(badge?.icon || badge?.iconKey),
    }))
    .filter((badge) => badge.label)
    .slice(0, 12)
}

export function normalizeQl7SupportCard(input = {}) {
  const canonical = normalizeQl7SupportPresentationCard(input)
  const locale = str(canonical.locale || input?.locale || 'en')
  const metrics = normalizeQl7MetricRows([
    ...(Array.isArray(canonical.metrics) ? canonical.metrics : []),
    ...(Array.isArray(input?.metricRows) ? input.metricRows : []),
  ], locale)
  return Object.freeze({
    ...canonical,
    version: QL7_SUPPORT_CARD_SCHEMA,
    schema: 'ql7.support.card',
    topic: str(input?.topic || canonical.topic),
    semanticRole: str(input?.semanticRole || canonical.semanticRole),
    surfaceKind: str(input?.surfaceKind || canonical.surfaceKind || 'structured'),
    svgAssetId: str(input?.svgAssetId || input?.primarySvg?.assetId || canonical.svgAssetId),
    primarySvg: clone(input?.primarySvg || canonical.primarySvg) || null,
    badges: normalizeBadges(canonical.badges, locale),
    metrics,
    table: normalizeTable(input?.table, canonical.table),
    actions: normalizeActions(canonical.actions || input?.actions),
    renderHints: Object.freeze({
      tableDensity: str(input?.renderHints?.tableDensity || 'balanced'),
      ecosystemStyle: 'ql7-support-premium',
      avoidRawKeys: true,
    }),
  })
}

export function buildQl7SupportCard(input = {}) {
  const body = normalizeQl7SupportCard(input)
  return Object.freeze({
    ...body,
    integrity: Object.freeze({
      algorithm: 'sha256',
      signature: hash(body),
      signedAt: str(input?.signedAt || input?.generatedAt) || new Date().toISOString(),
      schema: 'ql7.support.card',
    }),
  })
}

export function validateQl7SupportCard(card = {}) {
  if (Number(card?.version) !== QL7_SUPPORT_CARD_SCHEMA || card?.schema !== 'ql7.support.card') {
    return { ok: false, error: 'card_version' }
  }
  const sig = str(card?.integrity?.signature)
  if (!SAFE.test(sig)) return { ok: false, error: 'card_integrity' }
  const { integrity, ...raw } = card
  if (!str(raw.title) && !str(raw.summary)) return { ok: false, error: 'card_schema' }
  if (hash(raw) !== sig) return { ok: false, error: 'card_integrity' }
  return {
    ok: true,
    card: Object.freeze({
      ...clone(raw),
      integrity: Object.freeze({
        algorithm: 'sha256',
        signature: sig,
        signedAt: str(integrity?.signedAt),
        schema: 'ql7.support.card',
      }),
    }),
  }
}

export function rebuildQl7SupportTranslatedCard({
  sourceCard = null,
  translatedValue = null,
  targetLanguage = 'en',
  sourceDeliveryReceiptId = '',
  sourceDeliveryReceiptHash = '',
} = {}) {
  const sourceValidation = validateQl7SupportCard(sourceCard || {})
  if (!sourceValidation.ok) return Object.freeze({ ok: false, error: `source_${sourceValidation.error || 'card_invalid'}` })
  const unsigned = { ...(translatedValue && typeof translatedValue === 'object' ? clone(translatedValue) : clone(sourceValidation.card) || {}), locale: str(targetLanguage || 'en') }
  delete unsigned.integrity
  const built = buildQl7SupportCard(unsigned)
  const validation = validateQl7SupportCard(built)
  if (!validation.ok) return Object.freeze({ ok: false, error: `translated_${validation.error || 'card_invalid'}` })
  const projectionBody = Object.freeze({
    schema: 'ql7.support.card-translation-projection',
    schemaVersion: '5.1.0',
    sourceDeliveryReceiptId: str(sourceDeliveryReceiptId),
    sourceDeliveryReceiptHash: str(sourceDeliveryReceiptHash),
    targetLanguage: str(targetLanguage || 'en'),
    sourceCardIntegrityHash: str(sourceValidation.card?.integrity?.signature),
    translatedCardIntegrityHash: str(validation.card?.integrity?.signature),
  })
  return Object.freeze({
    ok: true,
    card: validation.card,
    translationProjection: Object.freeze({ ...projectionBody, projectionHash: hash(projectionBody) }),
  })
}
