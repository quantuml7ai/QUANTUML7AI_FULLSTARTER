import {ql7Arr, ql7NormalizeSpaces, ql7Sentences, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_DOMAIN_ISOLATION_GUARD_VERSION = '5.1.0'

const DOMAIN_MARKERS = Object.freeze({
  homepage: /\b(?:cryptoradar|crypto\s*radar|крипторадар)\b/iu,
  exchange: /\b(?:quantum\s+exchange|квантов\w*\s+бирж|торгов\w*\s+бирж)\b/iu,
  exchange_ai: /\b(?:ai\s*box|exchange\s*ai|ai\s*quota|ai\s*workbench)\b/iu,
  battlecoin: /\b(?:battle\s*coin|battlecoin|бат+л+коин)\b/iu,
  battle_chat: /\b(?:battle\s*chat|бат+л+\s*чат)\b/iu,
  academy: /\b(?:quantum\s+academy|академи[яї])\b/iu,
  gameverse: /\b(?:game\s*verse|gameverse|геймверс)\b/iu,
  metastudio: /\b(?:meta\s*studio|metastudio|метастуди)\b/iu,
  metaverse: /\b(?:quantum\s+universe|metaverse|метавселен)\b/iu,
  forum_feed: /\b(?:forum\s+feed|лента\s+форум)\b/iu,
  metamarket: /\b(?:meta\s*market|metamarket|метамаркет)\b/iu,
  quantum_family: /\b(?:quantum\s+family|квантов\w*\s+сем)\b/iu,
  wallet: /\b(?:quantum\s+wallet|квантов\w*\s+кошел)\b/iu,
  telegram: /\btelegram\b|телеграм/iu,
  qcoin: /\bq[\s._-]*coin\b|\bкью\s*коин\b/iu,
  vip: /\bvip(?:\s*plus)?\b|вип(?:\s*плюс)?/iu,
  ads_packages: /\b(?:ads\s+package|рекламн\w+\s+пакет)\b/iu,
  ads_campaigns: /\b(?:ads\s+campaign|рекламн\w+\s+кампан)\b/iu,
  messenger: /\b(?:quantum\s+messenger|мессенджер)\b/iu,
  quests: /\b(?:quantum\s+quest|квест)\b/iu,
})

export function extractQl7SupportGeneratedDomainIds(text = '') {
  const value = ql7Str(text)
  return Object.freeze(Object.entries(DOMAIN_MARKERS)
    .filter(([, pattern]) => pattern.test(value))
    .map(([domainId]) => domainId))
}

export function evaluateQl7SupportDomainIsolation({ text = '', scopeReceipt = {}, actions = [] } = {}) {
  const generatedEntityIds = extractQl7SupportGeneratedDomainIds(text)
  const generatedActionIds = ql7Arr(actions).map((row) => ql7Str(
    row?.topic || row?.intent || row?.semantic?.topic || row?.semantic?.subIntent || row?.routeId,
  )).filter(Boolean)
  const allowed = new Set(ql7Arr(scopeReceipt.allowedDomainIds))
  const forbiddenGeneratedEntityIds = generatedEntityIds.filter((domainId) => !allowed.has(domainId))
  const forbiddenActionIds = generatedActionIds.filter((domainId) =>
    DOMAIN_MARKERS[domainId] && !allowed.has(domainId),
  )
  const body = {
    schema: 'ql7.support.domain-isolation-receipt',
    schemaVersion: QL7_SUPPORT_DOMAIN_ISOLATION_GUARD_VERSION,
    scopeReceiptId: ql7Str(scopeReceipt.receiptId),
    generatedEntityIds,
    generatedActionIds: Object.freeze(generatedActionIds),
    forbiddenGeneratedEntityIds: Object.freeze(forbiddenGeneratedEntityIds),
    forbiddenActionIds: Object.freeze(forbiddenActionIds),
    crossDomainLeakageCount: forbiddenGeneratedEntityIds.length + forbiddenActionIds.length,
    decision: forbiddenGeneratedEntityIds.length || forbiddenActionIds.length ? 'reject' : 'allow',
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `domain-isolation:${receiptHash}`, receiptHash })
}

export function removeQl7SupportCrossDomainSentences(text = '', scopeReceipt = {}) {
  const allowed = new Set(ql7Arr(scopeReceipt.allowedDomainIds))
  const kept = ql7Sentences(text).filter((sentence) => {
    const domains = extractQl7SupportGeneratedDomainIds(sentence)
    return domains.every((domainId) => allowed.has(domainId))
  })
  return ql7NormalizeSpaces(kept.join(' '))
}
