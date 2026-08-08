import crypto from 'node:crypto'
import { applyQl7SupportAdultLanguagePolicy, normalizeQl7SupportLocale } from './adultLanguagePolicy.js'

export const QL7_SUPPORT_CARD_VERSION_V2 = 2
export const QL7_SUPPORT_CARD_KINDS_V2 = Object.freeze([
  'diagnostic',
  'case_result',
  'moderation_snapshot',
  'status',
  'clarification_choices',
  'data_table',
  'how_to',
  'notice',
  'timeline',
])

const SAFE_URL = /^(?:https?:\/\/|\/)/iu
const SAFE_OPTION_ID = /^[A-Za-z0-9:_-]{8,160}$/
const SAFE_INTEGRITY = /^[a-f0-9]{64}$/i

function str(value) { return String(value ?? '').trim() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }

function safeUrl(value = '') {
  const url = str(value)
  return SAFE_URL.test(url) ? url : ''
}

function safeString(value = '', maxLength = 2000) {
  return applyQl7SupportAdultLanguagePolicy(value, { maxLength })
}

function safeList(values = [], max = 12) {
  return (Array.isArray(values) ? values : [])
    .map((item) => {
      if (typeof item === 'string') return safeString(item, 500)
      if (item && typeof item === 'object') {
        const label = safeString(item.label || item.title || item.name || '', 180)
        const value = safeString(item.value || item.message || item.text || '', 600)
        if (!label && !value) return null
        return {
          ...(label ? { label } : {}),
          ...(value ? { value } : {}),
          ...(item.asOf ? { asOf: safeString(item.asOf, 100) } : {}),
        }
      }
      return null
    })
    .filter(Boolean)
    .slice(0, max)
}

function safeMedia(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((item) => {
      const type = str(item?.type).toLowerCase()
      const url = safeUrl(item?.url)
      const embedUrl = safeUrl(item?.embedUrl)
      if (!url && !embedUrl) return null
      return {
        type: ['image', 'video', 'audio', 'embed', 'link'].includes(type) ? type : 'link',
        ...(url ? { url } : {}),
        ...(embedUrl ? { embedUrl } : {}),
        ...(safeUrl(item?.poster) ? { poster: safeUrl(item.poster) } : {}),
        ...(safeString(item?.alt, 180) ? { alt: safeString(item.alt, 180) } : {}),
        ...(safeString(item?.caption, 280) ? { caption: safeString(item.caption, 280) } : {}),
        ...(safeString(item?.provider, 40) ? { provider: safeString(item.provider, 40) } : {}),
      }
    })
    .filter(Boolean)
    .slice(0, 8)
}

function safeOptions(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((item, index) => {
      const id = str(item?.id || `option_${index + 1}`)
      const label = safeString(item?.label, 100)
      if (!SAFE_OPTION_ID.test(id) || !label) return null
      return {
        id,
        label,
        ...(safeString(item?.description, 180) ? { description: safeString(item.description, 180) } : {}),
        ...(safeString(item?.icon, 12) ? { icon: safeString(item.icon, 12) } : {}),
        confidenceBand: ['high', 'medium', 'low'].includes(str(item?.confidenceBand)) ? str(item.confidenceBand) : 'medium',
        semantic: {
          topic: str(item?.semantic?.topic).slice(0, 80),
          subIntent: str(item?.semantic?.subIntent).slice(0, 120),
          caseId: str(item?.semantic?.caseId).slice(0, 160),
        },
      }
    })
    .filter(Boolean)
    .slice(0, 4)
}

function safeTable(value = null) {
  if (!value || typeof value !== 'object') return null
  const columns = (Array.isArray(value.columns) ? value.columns : [])
    .map((column) => ({
      key: str(column?.key).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60),
      label: safeString(column?.label, 120),
    }))
    .filter((column) => column.key && column.label)
    .slice(0, 8)
  if (!columns.length) return null
  const rows = (Array.isArray(value.rows) ? value.rows : [])
    .map((row) => {
      const out = {}
      for (const column of columns) out[column.key] = safeString(row?.[column.key], 400)
      return out
    })
    .filter((row) => Object.values(row).some(Boolean))
    .slice(0, 50)
  return rows.length ? { columns, rows } : null
}

export function normalizeQl7SupportCardV2(input = {}) {
  const kind = str(input?.kind)
  if (!QL7_SUPPORT_CARD_KINDS_V2.includes(kind)) throw new Error('ql7_support_card_kind')
  const locale = normalizeQl7SupportLocale(input?.locale)
  const payload = {
    version: QL7_SUPPORT_CARD_VERSION_V2,
    kind,
    locale,
    direction: ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr',
    title: safeString(input?.title, 220),
    summary: safeString(input?.summary || input?.prompt, 1600),
    status: safeString(input?.status, 100),
    facts: safeList(input?.facts, 16),
    checks: safeList(input?.checks, 12),
    anomalies: safeList(input?.anomalies, 12),
    nextActions: safeList(input?.nextActions, 8),
    labels: clone(input?.labels) || {},
    media: safeMedia(input?.media),
    table: safeTable(input?.table),
    timeline: safeList(input?.timeline, 20),
    options: safeOptions(input?.options),
    other: input?.other && typeof input.other === 'object' ? {
      id: SAFE_OPTION_ID.test(str(input.other.id)) ? str(input.other.id) : 'ql7_other_option',
      label: safeString(input.other.label, 100),
      placeholder: safeString(input.other.placeholder, 220),
    } : null,
    caseId: str(input?.caseId).slice(0, 160),
    expiresAt: str(input?.expiresAt).slice(0, 80),
    snapshot: clone(input?.snapshot) || null,
    asOf: str(input?.asOf).slice(0, 100),
    actions: (Array.isArray(input?.actions) ? input.actions : []).map((action) => ({
      id: str(action?.id).slice(0, 120),
      label: safeString(action?.label, 100),
      href: safeUrl(action?.href),
      kind: ['primary', 'secondary', 'danger'].includes(str(action?.kind)) ? str(action.kind) : 'secondary',
    })).filter((action) => action.id && action.label).slice(0, 6),
  }

  if (payload.snapshot && typeof payload.snapshot === 'object') {
    const snapshot = { ...payload.snapshot }
    delete snapshot.reporterId
    delete snapshot.reporter
    delete snapshot.reporterWallet
    snapshot.text = safeString(snapshot.text, 4000)
    snapshot.media = safeMedia(snapshot.media)
    snapshot.permalink = safeUrl(snapshot.permalink)
    payload.snapshot = snapshot
  }
  if (kind === 'clarification_choices' && payload.options.length < 2) throw new Error('ql7_support_card_options')
  if (!payload.title && !payload.summary) throw new Error('ql7_support_card_content')
  return payload
}

export function signQl7SupportCardV2(input = {}) {
  const payload = normalizeQl7SupportCardV2(input)
  return Object.freeze({ ...payload, integrity: hash(payload) })
}

export function validateQl7SupportCardV2(card = {}) {
  if (!card || typeof card !== 'object') return { ok: false, error: 'card_shape' }
  if (Number(card.version) !== QL7_SUPPORT_CARD_VERSION_V2) return { ok: false, error: 'card_version' }
  if (!QL7_SUPPORT_CARD_KINDS_V2.includes(str(card.kind))) return { ok: false, error: 'card_kind' }
  if (!SAFE_INTEGRITY.test(str(card.integrity))) return { ok: false, error: 'card_integrity' }
  const { integrity, ...raw } = card
  let normalized
  try { normalized = normalizeQl7SupportCardV2(raw) } catch { return { ok: false, error: 'card_schema' } }
  if (hash(normalized) !== str(integrity)) return { ok: false, error: 'card_integrity' }
  return { ok: true, card: Object.freeze({ ...normalized, integrity: str(integrity) }) }
}
