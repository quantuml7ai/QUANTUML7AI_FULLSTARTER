'use client'

import React from 'react'
import Ql7SupportChoiceCard from './Ql7SupportChoiceCard.js'
import Ql7SemanticBadge from './Ql7SemanticBadge.js'
import DmMediaRenderer from './DmMediaRenderer'
import { adaptQl7SupportCardForRenderV3 } from '../../../../../lib/ql7-support/presentationV8.js'
import { localizeQl7SupportBadgeRailLabelV11_6 } from '../../../../../lib/ql7-support/semanticBadgeRegistryV11_6.js'
import { getQl7SupportActionDescriptorV11, getQl7SupportRouteNavigationHrefV11 } from '../../../../../lib/ql7-support/topicActionRegistryV9.js'
import { buildQl7SupportAuthHeaders, fetchQl7SupportAuthenticated, readQl7SupportAuthSnapshot } from '../services/supportAuthClient'

const h = React.createElement

function str(value) { return String(value ?? '').trim() }
function safeUrl(value = '') { const url = str(value); return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\') && /^\/[A-Za-z0-9/_?=&.#%-]*$/u.test(url) ? url : '' }
function actionHref(action = {}) {
  const routeId = str(action?.routeId)
  const routeHref = getQl7SupportRouteNavigationHrefV11(routeId)
  if (routeHref) return routeHref
  return safeUrl(action?.href)
}
function actionLabel(action = {}, labels = {}) {
  return str(action?.label) || str(labels?.[action?.labelKey]) || str(action?.labelKey) || str(labels?.openPost) || 'Open'
}

function resolvedAction(action = {}) {
  const descriptor = getQl7SupportActionDescriptorV11(str(action?.routeId)) || {}
  return { ...descriptor, ...action, detail: { ...(descriptor?.detail || {}), ...(action?.detail || {}) } }
}
function recordQl7SupportActionOutcome(action = {}, caseId = '', outcomeType = 'clicked_action') {
  try {
    const auth = readQl7SupportAuthSnapshot()
    const accountId = str(auth.accountId || auth.walletAddress)
    if (!accountId || !caseId) return
    fetchQl7SupportAuthenticated('/api/dm/support-feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forum-user-id': accountId, ...buildQl7SupportAuthHeaders(auth) },
      body: JSON.stringify({ caseId, actionId: str(action?.id || action?.routeId || action?.eventName), routeId: str(action?.routeId), outcomeType }),
    }, { waitTimeoutMs: 4000, retryOnFreshAuth: false }).catch(() => null)
  } catch {}
}
function runQl7SupportAction(action = {}, caseId = '') {
  const resolved = resolvedAction(action)
  try {
    if (resolved.actionType === 'global_event' && /^(?:quantum-wallet:open|metamarket:open|open-auth)$/u.test(str(resolved.eventName)) && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(resolved.eventName, { detail: resolved.detail || { source: 'ql7-support' } }))
      recordQl7SupportActionOutcome(resolved, caseId, 'clicked_action')
      return true
    }
    if (resolved.actionType === 'case_action' && str(resolved.caseAction) === 'continue_support' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ql7-support:case-action', { detail: { action: 'continue_support', routeId: str(resolved.routeId), caseId } }))
      recordQl7SupportActionOutcome(resolved, caseId, 'clicked_action')
      return true
    }
    if (resolved.actionType === 'retry_diagnostic' && str(resolved.caseAction) === 'retry_diagnostic' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ql7-support:retry-diagnostic', { detail: { action: 'retry_diagnostic', routeId: str(resolved.routeId), caseId, actionId: str(resolved.id) } }))
      recordQl7SupportActionOutcome(resolved, caseId, 'clicked_action')
      return true
    }
  } catch {
    recordQl7SupportActionOutcome(resolved, caseId, 'action_failed')
  }
  return false
}
function actionIdentity(action = {}) {
  const resolved = resolvedAction(action)
  if (resolved.actionType === 'global_event') return `event:${str(resolved.eventName)}:${str(resolved.routeId)}`
  if (resolved.actionType === 'case_action') return `case:${str(resolved.caseAction)}:${str(resolved.routeId)}`
  if (resolved.actionType === 'retry_diagnostic') return `retry:${str(resolved.caseAction)}:${str(resolved.routeId)}`
  const href = actionHref(resolved)
  return href ? `route:${href}:${str(resolved.tab)}` : ''
}
function isRenderableAction(action = {}) {
  const resolved = resolvedAction(action)
  if (resolved.actionType === 'global_event') return /^(?:quantum-wallet:open|metamarket:open|open-auth)$/u.test(str(resolved.eventName))
  if (resolved.actionType === 'case_action') return str(resolved.caseAction) === 'continue_support'
  if (resolved.actionType === 'retry_diagnostic') return str(resolved.caseAction) === 'retry_diagnostic'
  return Boolean(actionHref(resolved))
}
function renderAction(action, index, labels, caseId = '') {
  const resolved = resolvedAction(action)
  const label = actionLabel(resolved, labels)
  const className = `ql7SupportCardAction ql7SupportCardAction--${str(resolved.kind) || 'secondary'}`
  if (resolved.actionType === 'global_event' || resolved.actionType === 'case_action' || resolved.actionType === 'retry_diagnostic') {
    return h('button', { key: resolved.id || index, type: 'button', className, onClick: () => runQl7SupportAction(resolved, caseId) }, label)
  }
  const href = actionHref(resolved)
  return href ? h('a', { key: resolved.id || index, href, className, 'data-ql7-target-tab': str(resolved.tab), onClick: () => recordQl7SupportActionOutcome(resolved, caseId) }, label) : null
}
function hasValue(value) { return value === 0 || value === false || (value !== undefined && value !== null && str(value) !== '') }
const SUPPORT_STICKER_TOKEN = /^\s*\[(?:VIP_EMOJI|MOZI):([^\]]+)\]\s*$/iu
function formatValue(value, locale, format = '') {
  if (value === null || value === undefined || value === '') return '—'
  const valueFormat = str(format).toLowerCase()
  if (typeof value === 'number') {
    if (valueFormat === 'percent') return new Intl.NumberFormat(locale || 'en', { style: 'percent', maximumFractionDigits: 2 }).format(value)
    if (valueFormat === 'decimal') return new Intl.NumberFormat(locale || 'en', { maximumFractionDigits: 8 }).format(value)
    return new Intl.NumberFormat(locale || 'en').format(value)
  }
  const raw = str(value)
  const date = new Date(raw)
  if (/^\d{4}-\d\d-\d\dT/u.test(raw) && !Number.isNaN(date.getTime())) {
    try { return new Intl.DateTimeFormat(locale || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date) } catch { return raw }
  }
  return raw
}
function renderValue(value, locale, format = '') {
  const raw = str(value)
  const sticker = raw.match(SUPPORT_STICKER_TOKEN)
  if (sticker) {
    const src = safeUrl(sticker[1])
    if (src) {
      return h('span', { className: 'ql7SupportEvidenceSticker', translate: 'no' },
        h('img', { src, alt: 'VIP emoji', loading: 'lazy', decoding: 'async' }))
    }
  }
  return formatValue(value, locale, format)
}

const SUPPORT_TITLE_FALLBACK = Object.freeze({
  en: 'Ready to help',
  ru: 'Рад помочь',
  uk: 'Радий допомогти',
  es: 'Listo para ayudar',
  tr: 'Yardım etmeye hazırım',
  ar: 'جاهز للمساعدة',
  zh: '随时为你处理',
  he: 'מוכן לעזור',
})

function displayCardTitle(title = '', locale = 'en') {
  const raw = str(title)
  if (!/^QL7\s+Support$/iu.test(raw)) return raw
  const lang = str(locale).toLowerCase().split(/[-_]/u)[0] || 'en'
  return SUPPORT_TITLE_FALLBACK[lang] || SUPPORT_TITLE_FALLBACK.en
}

function StatusPill({ status }) {
  if (!status?.label) return null
  return h('span', { className: `ql7SupportStatusPill ql7SupportStatusPill--${str(status.tone) || 'neutral'}` },
    h('i', { 'aria-hidden': 'true' }), status.label)
}

function BadgeRail({ items = [], locale = 'en' }) {
  const deduped = []
  const seen = new Set()
  for (const badge of items) {
    const label = localizeQl7SupportBadgeRailLabelV11_6(badge, locale)
    const key = label.toLowerCase()
    if (!label || seen.has(key)) continue
    seen.add(key)
    deduped.push({ ...badge, label })
  }
  if (!deduped.length) return null
  return h('div', { className: 'ql7SupportBadgeRail' }, deduped.map((badge, index) =>
    h('span', { key: badge.id || index, className: `ql7SupportBadge ql7SupportBadge--${str(badge.tone) || 'neutral'}` },
      str(badge.icon) ? h(Ql7SemanticBadge, { iconKey: str(badge.icon), assetId: str(badge.assetId), label: str(badge.label), animated: false, size: 'small' }) : null,
      h('span', { className: 'ql7SupportBadgeLabel' }, str(badge.label)),
    )))
}

function DataTable({ rows = [], label = 'Details', locale = 'en' }) {
  const safeRows = rows.filter((row) => str(row?.label) && hasValue(row?.value))
  if (!safeRows.length) return null
  return h('div', { className: 'ql7SupportDataTable ql7SupportPremiumTable', role: 'table', 'aria-label': label }, safeRows.map((row, index) =>
    h('div', { key: row.key || index, className: `ql7SupportDataRow ql7SupportDataRow--${str(row.tone) || 'neutral'}`, role: 'row' },
      h('span', { className: 'ql7SupportDataLabel', role: 'rowheader' }, str(row.label)),
      h('span', { className: 'ql7SupportDataValue', role: 'cell' }, renderValue(row.value, locale, row.format)),
    )))
}

function TableSection({ table, labels = {}, locale = 'en' }) {
  if (!table || typeof table !== 'object') return null
  const columns = Array.isArray(table.columns) ? table.columns : []
  const rows = Array.isArray(table.rows) ? table.rows : []
  if (!rows.length) return null
  const labelColumn = columns.find((column) => str(column?.key) === 'label') || columns[0] || { key: 'label', label: str(labels?.details) || 'Details' }
  const valueColumn = columns.find((column) => str(column?.key) === 'value') || columns[1] || { key: 'value', label: str(labels?.status) || 'Status' }
  const tableRows = rows.map((row, index) => {
    if (!row || typeof row !== 'object') return null
    return {
      key: str(row.key || `table-${index}`),
      label: str(row.label ?? row[labelColumn.key] ?? labelColumn.label),
      value: row.value ?? row[valueColumn.key],
      tone: str(row.tone || 'neutral'),
      format: str(row.format || ''),
    }
  }).filter((row) => row && str(row.label) && hasValue(row.value))
  if (!tableRows.length) return null
  return h('section', { className: 'ql7SupportCardSection ql7SupportCardTableSection' },
    h(SectionRail, { title: str(table.title || labels?.confirmed || labels?.details) || 'Details' }),
    h(DataTable, { rows: tableRows, label: str(table.title || labels?.details) || 'Details', locale }),
  )
}

function SectionRail({ title }) {
  return h('div', { className: 'ql7SupportSectionRail' }, h('span'), h('h4', null, str(title)), h('i'))
}

function Sections({ sections = [], locale = 'en' }) {
  return sections.map((section) => {
    const rows = (section.items || []).map((item, index) => ({
      key: item.id || index,
      label: str(item.label) || str(section.title),
      value: item.value ?? item.text ?? item.message ?? '—',
      tone: section.tone,
    }))
    return h('section', { key: section.id, className: `ql7SupportCardSection ql7SupportCardSection--${str(section.tone) || 'neutral'}` },
      h(SectionRail, { title: section.title }),
      h(DataTable, { rows, label: str(section.title), locale }),
    )
  })
}

function Snapshot({ snapshot, labels, locale }) {
  if (!snapshot) return null
  const progress = snapshot.reportProgress || {}
  const localValue = (value) => {
    const raw = str(value)
    return str(labels?.[raw]) || raw
  }
  const rows = [
    ['postId', snapshot.postId],
    ['author', [snapshot.authorDisplayName, snapshot.authorIdMasked].filter(Boolean).join(' · ')],
    ['reason', snapshot.reasonLabel || snapshot.reportType],
    ['contentType', snapshot.contentType],
    ['created', snapshot.createdAt],
    ['updated', snapshot.updatedAt || snapshot.capturedAt],
    ['currentReports', progress.currentReports ?? snapshot.thresholdCount],
    ['nextThreshold', progress.nextThreshold ?? snapshot.nextThreshold],
    ['remainingReports', progress.remainingReports],
    ['expectedAction', localValue(progress.expectedAction || snapshot.expectedAction)],
    ['possibleRestriction', localValue(progress.possibleRestriction || snapshot.possibleRestriction)],
    ['reviewStatus', localValue(progress.reviewStatus || snapshot.reviewStatus)],
  ].map(([key, value]) => ({ key, label: str(labels?.[key]) || key, value, tone: /reason|remaining|restriction/u.test(key) ? 'warning' : 'neutral' }))

  return h('section', { className: 'ql7SupportCardSection ql7SupportComplaintPassport' },
    h(SectionRail, { title: str(labels?.material) || str(labels?.snapshot) || 'Reported material' }),
    str(snapshot.text) ? h('blockquote', { className: 'ql7SupportEvidencePanel' }, renderValue(snapshot.text, locale)) : null,
    h(DataTable, { rows, label: str(labels?.details) || 'Details', locale }),
    safeUrl(snapshot.permalink) ? h('a', { className: 'ql7SupportCardOpenPost', href: safeUrl(snapshot.permalink), target: '_blank', rel: 'noreferrer noopener' }, str(labels?.openPost) || 'Open') : null,
  )
}

function collectText(value, out = [], depth = 0) {
  if (depth > 8 || value === null || value === undefined) return out
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = str(value)
    if (text && !/^https?:\/\//iu.test(text) && !SUPPORT_STICKER_TOKEN.test(text)) out.push(text)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, out, depth + 1))
    return out
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (/^(?:integrity|signature|avatar|media|attachments|href|url|permalink|postId|authorIdMasked|id|key|code|tone|icon|iconKey|semanticIcon|semanticTone|visualTheme|schema|version)$/iu.test(key)) continue
      collectText(item, out, depth + 1)
    }
  }
  return out
}

export function collectQl7SupportCardTextForTranslate(card) {
  if (!isRenderableQl7SupportCard(card)) return ''
  try {
    const normalized = adaptQl7SupportCardForRenderV3(card)
    const rows = collectText({
      title: normalized.title,
      summary: normalized.summary,
      status: normalized.status?.label,
      badges: normalized.badges,
      snapshot: normalized.snapshot,
      sections: normalized.sections,
      table: normalized.table,
      metrics: normalized.table ? [] : normalized.metrics,
      timeline: normalized.timeline,
      actions: normalized.actions?.map((action) => actionLabel(action, normalized.labels || {})),
    })
    return Array.from(new Set(rows.map((item) => str(item)).filter(Boolean))).join('\n')
  } catch {
    return ''
  }
}

export function isRenderableQl7SupportCard(card) {
  const version = Number(card?.version)
  const signature = version >= 3 ? str(card?.integrity?.signature) : str(card?.integrity)
  return (version >= 1 && version <= 4) && /^[a-f0-9]{64}$/iu.test(signature)
}

export default function Ql7SupportCard({ card, VideoPlayer, VoicePlayer }) {
  if (!isRenderableQl7SupportCard(card)) return null
  let normalized
  try { normalized = adaptQl7SupportCardForRenderV3(card) } catch { return null }

  const locale = str(normalized.locale) || 'en'
  const textDirection = ['ar', 'he', 'fa', 'ur'].includes(locale.toLowerCase().split(/[-_]/u)[0]) ? 'rtl' : 'ltr'
  const snapshot = normalized.snapshot && typeof normalized.snapshot === 'object' ? normalized.snapshot : null
  const media = [...(Array.isArray(normalized.media) ? normalized.media : []), ...(Array.isArray(snapshot?.media) ? snapshot.media : [])].slice(0, 8)
  const images = media.filter((item) => str(item.type).toLowerCase() === 'image')
  const videos = media.filter((item) => str(item.type).toLowerCase() === 'video')
  const audios = media.filter((item) => str(item.type).toLowerCase() === 'audio')
  const links = media.filter((item) => ['link', 'embed'].includes(str(item.type).toLowerCase()) && safeUrl(item.url || item.embedUrl))
  const purpose = str(normalized.purpose) || 'notice'
  const emotion = normalized.emotion && typeof normalized.emotion === 'object' ? normalized.emotion : null
  const emotionName = str(emotion?.emotion) || 'neutral'
  const emotionPulse = str(emotion?.pulse) || 'none'
  const semanticIcon = str(normalized.semanticIcon) || (purpose === 'complaint' ? 'warning' : purpose === 'payment_incident' ? 'payment' : purpose === 'greeting' ? 'joy' : 'info')
  const svgAssetId = str(normalized.svgAssetId || normalized.primarySvg?.assetId || `${semanticIcon}-v1`)
  const statusLabel = str(normalized.status?.label).toLowerCase()
  const statusDuplicate = statusLabel && (normalized.badges || []).some((badge) => { const label=str(badge?.label).toLowerCase();return label===statusLabel||(/verified|confirmed|подтвержд|проверено/iu.test(statusLabel)&&/verified|confirmed|подтвержд|проверено/iu.test(label))||(/blocked|paused|приостанов/iu.test(statusLabel)&&/blocked|paused|приостанов/iu.test(label)) })
  const visibleStatus = statusDuplicate ? null : normalized.status
  const snapshotPermalink = safeUrl(snapshot?.permalink)
  const actions = (Array.isArray(normalized.actions) ? normalized.actions : [])
    .filter((action, index, array) => {
      if (!isRenderableAction(action)) return false
      const href = actionHref(action)
      if (snapshotPermalink && href && href === snapshotPermalink) return false
      const identity = actionIdentity(action)
      return Boolean(identity) && array.findIndex((candidate) => actionIdentity(candidate) === identity && actionLabel(candidate, normalized.labels || {}) === actionLabel(action, normalized.labels || {})) === index
    })
  const hasStructuredTable = !!(normalized.table && Array.isArray(normalized.table.rows) && normalized.table.rows.length)
  const title = displayCardTitle(normalized.title, locale)

  return h('article', {
    className: `ql7SupportCard ql7SupportCardV8 ql7SupportCard--${purpose} ql7SupportCard--surface-${str(normalized.surfaceKind || 'structured')} ql7SupportTheme--${str(normalized.visualTheme)} ql7SupportEmotion--${emotionName} ql7SupportPulse--${emotionPulse}`,
    dir: 'ltr',
    lang: locale,
    'data-ql7-support-text-direction': textDirection,
    'data-ql7-support-card': purpose,
    'data-ql7-support-source-kind': str(normalized.sourceKind || normalized.kind || normalized.purpose || purpose),
    'data-ql7-support-theme': str(normalized.visualTheme),
    'data-ql7-support-emotion': emotionName,
    'data-ql7-support-emotion-intensity': str(emotion?.intensity) || 'low',
    'data-ql7-support-pulse': emotionPulse,
    'data-ql7-support-semantic-icon': semanticIcon,
    'data-ql7-support-surface-kind': str(normalized.surfaceKind || 'structured'),
    'data-ql7-support-svg-asset-id': svgAssetId,
    'data-ql7-support-svg-quality': 'premium-detailed',
    'data-ql7-support-svg-legacy': '0',
    'data-ql7-support-topic': str(normalized.topic),
  },
  h('header', { className: 'ql7SupportCardHeader' },
    h('div', { className: 'ql7SupportCardTitleBlock' },
      h('span', { className: 'ql7SupportPurposeGlyph' }, h(Ql7SemanticBadge, { iconKey: semanticIcon, assetId: svgAssetId, label: str(visibleStatus?.label || title || normalized.summary), animated: emotionPulse !== 'none' })),
      title ? h('h3', null, title) : null,
      str(normalized.summary) ? h('p', { className: 'ql7SupportCardSummary' }, str(normalized.summary)) : null,
    ),
    h(StatusPill, { status: visibleStatus }),
  ),
  h(BadgeRail, { items: normalized.badges || [], locale }),
  purpose === 'choice' ? h(Ql7SupportChoiceCard, { card: normalized }) : null,
  h(Snapshot, { snapshot, labels: normalized.labels || {}, locale }),
  media.length ? h('section', { className: 'ql7SupportSharedMediaSection' },
    h(DmMediaRenderer, { keyPrefix: `support:${normalized.caseId || normalized.id}`, images, videos, audios, dmScope: true, source: 'support-complaint', VideoPlayer, VoicePlayer }),
    links.length ? h('div', { className: 'ql7SupportCardActionRail' }, links.map((item, index) =>
      h('a', { key: index, className: 'ql7SupportCardOpenPost', href: safeUrl(item.url || item.embedUrl), target: '_blank', rel: 'noreferrer noopener' }, str(item.caption || item.alt) || 'Open'))) : null,
  ) : null,
  h(Sections, { sections: normalized.sections || [], locale }),
  h(TableSection, { table: normalized.table, labels: normalized.labels || {}, locale }),
  !hasStructuredTable && Array.isArray(normalized.metrics) && normalized.metrics.length ? h('section', { className: 'ql7SupportCardSection ql7SupportMetricsSection' },
    h(SectionRail, { title: str(normalized.labels?.confirmed) || 'Metrics' }),
    h('div', { className: 'ql7SupportMetricGrid' }, normalized.metrics.map((metric, index) =>
      h('div', { key: metric.key || index, className: `ql7SupportMetricTile ql7SupportMetricTile--${str(metric.tone) || 'neutral'}` },
        h('span', null, str(metric.label)), h('strong', null, formatValue(metric.value, locale))))),
  ) : null,
  Array.isArray(normalized.timeline) && normalized.timeline.length ? h('ol', { className: 'ql7SupportCardTimeline' }, normalized.timeline.map((item, index) =>
    h('li', { key: index }, str(item.value || item.text || item.message || item.label), str(item.asOf || item.at) ? h('time', { dateTime: str(item.asOf || item.at) }, formatValue(item.asOf || item.at, locale)) : null))) : null,
  actions.length ? h('div', { className: 'ql7SupportCardActionRail' }, actions.map((action, index) => renderAction(action, index, normalized.labels || {}, normalized.caseId)).filter(Boolean)) : null,
  str(normalized.checkedAt) && !hasStructuredTable ? h('footer', { className: 'ql7SupportCardAsOf' }, `${str(normalized.labels?.checked) || 'Checked'}: `, h('time', { dateTime: str(normalized.checkedAt) }, formatValue(normalized.checkedAt, locale))) : null,
  )
}
