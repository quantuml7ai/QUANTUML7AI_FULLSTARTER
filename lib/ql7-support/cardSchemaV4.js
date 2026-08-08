import crypto from 'node:crypto'
import { normalizeQl7SupportCardV3 } from './cardSchemaV3.js'
import { normalizeQl7MetricRowsV9 } from './metricRegistryV9.js'
import { getQl7SupportActionDescriptorV11, isQl7SupportSafeRouteIdV9 } from './topicActionRegistryV9.js'
import { localizeQl7SupportBadgeRailLabelV11_6 } from './semanticBadgeRegistryV11_6.js'

export const QL7_SUPPORT_CARD_VERSION_V4 = 4

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
      const descriptor = routeId && isQl7SupportSafeRouteIdV9(routeId)
        ? getQl7SupportActionDescriptorV11(routeId)
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
function normalizeTableV4(inputTable = null, fallbackTable = null) {
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
      label: localizeQl7SupportBadgeRailLabelV11_6(badge, locale).slice(0, 120),
      tone: str(badge?.tone || 'neutral'),
      icon: str(badge?.icon || badge?.iconKey),
    }))
    .filter((badge) => badge.label)
    .slice(0, 12)
}

export function normalizeQl7SupportCardV4(input = {}) {
  const v3 = normalizeQl7SupportCardV3(input)
  const locale = str(v3.locale || input?.locale || 'en')
  const metrics = normalizeQl7MetricRowsV9([
    ...(Array.isArray(v3.metrics) ? v3.metrics : []),
    ...(Array.isArray(input?.metricRows) ? input.metricRows : []),
  ], locale)
  return Object.freeze({
    ...v3,
    version: QL7_SUPPORT_CARD_VERSION_V4,
    schema: 'ql7.support.card.v4',
    topic: str(input?.topic || v3.topic),
    semanticRole: str(input?.semanticRole || v3.semanticRole),
    surfaceKind: str(input?.surfaceKind || v3.surfaceKind || 'structured'),
    svgAssetId: str(input?.svgAssetId || input?.primarySvg?.assetId || v3.svgAssetId),
    primarySvg: clone(input?.primarySvg || v3.primarySvg) || null,
    badges: normalizeBadges(v3.badges, locale),
    metrics,
    table: normalizeTableV4(input?.table, v3.table),
    actions: normalizeActions(v3.actions || input?.actions),
    renderHints: Object.freeze({
      tableDensity: str(input?.renderHints?.tableDensity || 'balanced'),
      ecosystemStyle: 'ql7-support-premium',
      avoidRawKeys: true,
    }),
  })
}

export function buildQl7SupportCardV4(input = {}) {
  const body = normalizeQl7SupportCardV4(input)
  return Object.freeze({
    ...body,
    integrity: Object.freeze({
      algorithm: 'sha256',
      signature: hash(body),
      signedAt: new Date().toISOString(),
      schema: 'ql7.support.card.v4',
    }),
  })
}

export function validateQl7SupportCardV4(card = {}) {
  if (Number(card?.version) !== QL7_SUPPORT_CARD_VERSION_V4 || card?.schema !== 'ql7.support.card.v4') {
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
        schema: 'ql7.support.card.v4',
      }),
    }),
  }
}
