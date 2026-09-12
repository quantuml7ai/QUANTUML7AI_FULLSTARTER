import {QL7_SUPPORT_ECOSYSTEM_TOPICS, getQl7SupportTopicLabel, normalizeQl7SupportTopic} from './ecosystemCatalog.js'
import {normalizeQl7SupportLocale} from './language/locales.js'
import {getQl7SupportCanonicalDomain} from './knowledge/domainRegistry.js'
import {getQl7SupportDomainKnowledgePack} from './knowledge/domainKnowledge.js'
import {
  QL7_SUPPORT_KNOWLEDGE_GRAPH,
  getQl7SupportDomainKnowledgeNode,
  getQl7SupportMicrodomainKnowledgeNode,
} from './knowledge/knowledgeGraph.js'
import {buildQl7SupportOfficialIdentityKnowledge} from './knowledge/officialIdentity.js'

function str(value) { return String(value ?? '').trim() }
function knowledgeIntentId(intent = '') {
  const value = str(intent)
  if (['how_to_question','how_to'].includes(value)) return 'how_to'
  if (value === 'why_question') return 'purpose'
  if (['when_question','roadmap_question'].includes(value)) return 'roadmap'
  if (['personal_status_request','status_followup','status_request'].includes(value)) return 'self_status'
  if (['incident_report','error','incident'].includes(value)) return 'incident'
  if (['availability','availability_question'].includes(value)) return 'availability'
  return 'overview'
}

export function getQl7SupportChoiceLabel(topic = '', locale = 'en') {
  const normalizedTopic = normalizeQl7SupportTopic(topic)
  const lang = normalizeQl7SupportLocale(locale)
  if (normalizedTopic === 'official_identity') return buildQl7SupportOfficialIdentityKnowledge(lang).label
  return getQl7SupportTopicLabel(normalizedTopic, lang)
}

function officialIdentityProjection(locale = 'en') {
  const source = buildQl7SupportOfficialIdentityKnowledge(locale)
  return Object.freeze({
    topic: 'official_identity',
    label: source.label,
    title: source.label,
    locale,
    readOnly: true,
    verified: true,
    version: source.version,
    source: source.source,
    trustPagePath: source.trustPagePath,
    contactPath: source.contactPath,
    supportPath: source.supportPath,
    officialChannels: source.officialChannels,
    machineReadableIdentity: source.machineReadableIdentity,
    semanticFacts: Object.freeze({
      identityVersion: source.version,
      trustPagePath: source.trustPagePath,
      contactPath: source.contactPath,
      supportPath: source.supportPath,
    }),
    paragraphs: Object.freeze([]),
    text: '',
    readyToSend: false,
    finalText: false,
    realizationOwner: 'response/humanNaturalRealizer.js',
  })
}

export function getQl7SupportKnowledgeAnswer({ topic = 'support_system', intent = 'overview', locale = 'en' } = {}) {
  const normalizedTopic = normalizeQl7SupportTopic(topic)
  const lang = normalizeQl7SupportLocale(locale)
  if (normalizedTopic === 'official_identity') return officialIdentityProjection(lang)

  const intentId = knowledgeIntentId(intent)
  const domainNode = getQl7SupportDomainKnowledgeNode(normalizedTopic)
  const intentNode = getQl7SupportMicrodomainKnowledgeNode(normalizedTopic, intentId) || domainNode
  const canonicalDomain = getQl7SupportCanonicalDomain(normalizedTopic, lang)
  const pack = getQl7SupportDomainKnowledgePack(lang, canonicalDomain.label || normalizedTopic)
  const sourceReceipts = Object.freeze([
    ...(intentNode?.availabilityEvidence || []),
    ...(intentNode?.roadmapEvidence || []),
  ])
  return Object.freeze({
    topic: normalizedTopic,
    label: canonicalDomain.label || getQl7SupportTopicLabel(normalizedTopic, lang),
    title: canonicalDomain.label || getQl7SupportTopicLabel(normalizedTopic, lang),
    locale: lang,
    knowledgeGraphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH.schemaVersion,
    knowledgeGraphHash: QL7_SUPPORT_KNOWLEDGE_GRAPH.graphHash,
    knowledgeNode: intentNode,
    knowledgeNodeId: intentNode?.nodeId || '',
    knowledgeDomainNodeId: domainNode?.nodeId || '',
    knowledgeIntentId: intentId,
    availability: domainNode?.availability || 'unknown',
    sourceReceipts,
    source: 'versioned-knowledge-graph',
    verified: Boolean(domainNode && sourceReceipts.length),
    canonicalDomain,
    domainKnowledgeSource: pack.source,
    semanticRoles: pack.semanticRoles,
    semanticFacts: Object.freeze({
      domainId: normalizedTopic,
      intentId,
      availability: domainNode?.availability || 'unknown',
      capabilityIds: Object.freeze([...(domainNode?.capabilityIds || [])]),
      sourceRequirementIds: Object.freeze([...(domainNode?.sourceRequirements || [])].map((row) => str(row?.sourceId || row?.id || row)).filter(Boolean)),
    }),
    cta: canonicalDomain.cta,
    paragraphs: Object.freeze([]),
    text: '',
    readyToSend: false,
    finalText: false,
    realizationOwner: 'response/humanNaturalRealizer.js',
  })
}

export function auditQl7SupportKnowledgeRegistry() {
  const missing = []
  const finalTextOwners = []
  for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
    const answer = getQl7SupportKnowledgeAnswer({ topic, intent: 'overview', locale: 'en' })
    if (!answer.label || !answer.knowledgeDomainNodeId) missing.push(topic)
    if (answer.readyToSend === true || str(answer.text) || (answer.paragraphs || []).length) finalTextOwners.push(topic)
  }
  return Object.freeze({
    ok: missing.length === 0 && finalTextOwners.length === 0,
    topics: QL7_SUPPORT_ECOSYSTEM_TOPICS.length,
    missing: Object.freeze(missing),
    finalTextOwners: Object.freeze(finalTextOwners),
    readyToSendRows: 0,
    graphHash: QL7_SUPPORT_KNOWLEDGE_GRAPH.graphHash,
  })
}

export const QL7_SUPPORT_KNOWLEDGE_TOPICS = QL7_SUPPORT_ECOSYSTEM_TOPICS
