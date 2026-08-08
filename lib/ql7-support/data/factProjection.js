import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_FACT_PROJECTION_VERSION = '15.0.0'

const TOPIC_HINTS = Object.freeze({
  qcoin: /qcoin|balance|ledger/iu,
  vip: /vip/iu,
  ads_packages: /ads|package/iu,
  ads_campaigns: /ads|campaign|metric/iu,
  payments: /payment|invoice/iu,
  profile: /profile|rating/iu,
  rating: /profile|rating/iu,
  forum: /forum/iu,
  forum_feed: /forum/iu,
  forum_threads: /forum/iu,
  metamarket: /metamarket/iu,
  exchange_ai: /exchange_ai|market|crypto|quota|recommend|price/iu,
  telegram: /telegram/iu,
})

function receiptText(row = {}) {
  const result = row?.result && typeof row.result === 'object' ? row.result : {}
  return `${row.adapter || ''} ${row.source || ''} ${result.topic || ''} ${result.branch || ''}`
}

export function selectQl7SupportFactReceipt(topic = '', rows = []) {
  const cleanTopic = ql7Str(topic)
  const pattern = TOPIC_HINTS[cleanTopic]
  const eligible = ql7Arr(rows).filter((row) => row?.executed === true && Number(row?.writeCount || 0) === 0)
  return eligible.find((row) => !pattern || pattern.test(receiptText(row))) || null
}

function sourceData(receipt = null) {
  const raw = receipt?.result && typeof receipt.result === 'object' ? receipt.result : {}
  const evidence = raw?.evidence && typeof raw.evidence === 'object' ? raw.evidence : {}
  return Object.freeze({ ...raw, ...evidence })
}

function canonicalStatus(topic, data = {}, resultKind = '') {
  const explicit = ql7Str(data.status || data.state || data.paymentStatus || data.packageStatus).toLowerCase()
  if (explicit) return explicit
  if (topic === 'vip' && typeof data.active === 'boolean') return data.active ? 'active' : 'inactive'
  if (resultKind === 'verified_empty') return 'empty'
  if (resultKind === 'unavailable') return 'unavailable'
  return 'unknown'
}

function contradictions(topic, data, status) {
  const out = []
  if (topic === 'vip' && typeof data.active === 'boolean') {
    const activeByStatus = /^(?:active|enabled|valid)$/iu.test(status)
    const inactiveByStatus = /^(?:inactive|disabled|expired|empty)$/iu.test(status)
    if ((data.active && inactiveByStatus) || (!data.active && activeByStatus)) out.push('vip_active_status_mismatch')
  }
  return Object.freeze(out)
}

export function buildQl7SupportFactProjection({ topic = '', receipts = [], receipt = null } = {}) {
  const selected = receipt || selectQl7SupportFactReceipt(topic, receipts)
  const resultKind = ql7Str(selected?.resultKind || 'none') || 'none'
  const data = sourceData(selected)
  const status = canonicalStatus(topic, data, resultKind)
  const verified = !!selected && selected.executed === true && Number(selected.writeCount || 0) === 0 && ['verified', 'verified_empty', 'inconsistent'].includes(resultKind)
  const issues = contradictions(topic, data, status)
  const facts = Object.freeze({
    topic: ql7Str(topic),
    status,
    active: topic === 'vip' ? /^(?:active|enabled|valid)$/iu.test(status) : data.active,
    balance: data.balance ?? data.available ?? data.amount,
    available: data.available,
    pending: data.pending,
    tier: data.tier ?? data.plan ?? data.packageName ?? data.package,
    packageName: data.packageName ?? data.package ?? data.tier,
    activeCampaignCount: data.activeCampaignCount ?? data.activeCampaigns,
    usedSlots: data.usedSlots,
    slotLimit: data.slotLimit,
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : [],
    amount: data.amount,
    currency: data.currency,
    expiresAt: data.expiresAt ?? data.expiry,
    benefits: Array.isArray(data.benefits) ? data.benefits : data.benefits,
    sourceData: data,
  })
  const payload = { version: QL7_SUPPORT_FACT_PROJECTION_VERSION, topic: ql7Str(topic), resultKind, verified, status, facts, issues, receiptId: ql7Str(selected?.id), checkedAt: verified ? ql7Str(selected?.checkedAt) : '' }
  return Object.freeze({ ...payload, factHash: ql7StableHash(JSON.stringify(payload)) })
}
