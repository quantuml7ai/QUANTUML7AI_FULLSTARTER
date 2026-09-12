import {
  QL7_SUPPORT_ECOSYSTEM_TOPICS,
  getQl7SupportDiagnosticBranches,
  getQl7SupportDomain,
  getQl7SupportKnowledgeBullets,
  getQl7SupportReadCollections,
  normalizeQl7SupportTopic,
} from '../ecosystemCatalog.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH_VERSION = '5.1.0'

const MATERIAL_INTENTS = Object.freeze([
  'overview',
  'purpose',
  'availability',
  'how_to',
  'requirements',
  'limits',
  'status',
  'self_status',
  'incident',
  'security',
  'privacy',
  'price',
  'purchase',
  'history',
  'roadmap',
  'navigation',
])

const RELATIONS = Object.freeze({
  exchange: ['homepage', 'exchange_ai', 'futures'],
  exchange_ai: ['exchange', 'homepage', 'vip'],
  battlecoin: ['exchange', 'qcoin', 'battle_chat', 'futures'],
  battle_chat: ['battlecoin', 'messenger', 'profile'],
  academy_exam: ['academy', 'qcoin'],
  forum_feed: ['forum_threads', 'search', 'media', 'moderation'],
  forum_threads: ['forum_feed', 'search', 'media', 'moderation'],
  metamarket: ['wallet', 'payments', 'qcoin'],
  profile: ['auth', 'privacy', 'quantum_family', 'moderation'],
  wallet: ['auth', 'security', 'payments'],
  qcoin: ['payments', 'vip', 'ads_packages'],
  payments: ['wallet', 'qcoin', 'vip', 'ads_packages', 'metamarket'],
  vip: ['payments', 'exchange_ai', 'ads_packages'],
  ads_packages: ['ads_campaigns', 'payments', 'vip'],
  ads_campaigns: ['ads_packages', 'profile'],
  security: ['privacy', 'auth', 'wallet', 'moderation'],
  account_deletion: ['profile', 'privacy', 'auth'],
  localization: ['accessibility'],
})

const REQUIRED_DEPENDENCIES = Object.freeze({
  exchange_ai: ['exchange'],
  academy_exam: ['academy'],
  battle_chat: ['battlecoin'],
  ads_campaigns: ['ads_packages'],
  account_deletion: ['auth'],
  qcoin: ['wallet'],
  vip: ['wallet'],
  payments: ['wallet'],
})

function freezeRows(values) {
  return Object.freeze(ql7Arr(values).map((value) => ql7Str(value)).filter(Boolean))
}

function nodeFor(rawTopic) {
  const topic = normalizeQl7SupportTopic(rawTopic)
  const definition = getQl7SupportDomain(topic) || {}
  const branches = getQl7SupportDiagnosticBranches(topic)
  const topicSpecificMicrotopics = [
    ...MATERIAL_INTENTS.map((intent) => `${topic}.${intent}`),
    ...ql7Arr(branches).map((branch) => `${topic}.state.${ql7Str(branch)}`),
  ]
  const allowedRelations = freezeRows(RELATIONS[topic])
  const requiredDependencies = freezeRows(REQUIRED_DEPENDENCIES[topic])
  const forbiddenAutomaticRelations = freezeRows(
    QL7_SUPPORT_ECOSYSTEM_TOPICS.filter(
      (candidate) => candidate !== topic &&
        !allowedRelations.includes(candidate) &&
        !requiredDependencies.includes(candidate),
    ),
  )
  const sourceCollections = freezeRows(getQl7SupportReadCollections(topic))
  const knowledgeClaims = freezeRows(getQl7SupportKnowledgeBullets(topic))

  const node = {
    schemaVersion: QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH_VERSION,
    domainId: topic,
    subdomainIds: Object.freeze([`${topic}.knowledge`, `${topic}.status`, `${topic}.incident`]),
    microtopicIds: Object.freeze(topicSpecificMicrotopics),
    intentIds: MATERIAL_INTENTS,
    allowedRelations,
    requiredDependencies,
    forbiddenAutomaticRelations,
    entityAllowlist: Object.freeze([topic, ql7Str(definition.label)].filter(Boolean)),
    entityDenylist: forbiddenAutomaticRelations,
    factSourceClasses: Object.freeze(sourceCollections.length ? ['receipt', 'project_registry'] : ['project_registry']),
    sourceCollections,
    knowledgeClaims,
    clarificationPolicy: 'one-specific-question-low-margin',
    handoffPolicy: ['contact', 'security'].includes(topic) ? 'evidence-gated' : 'never-automatic',
    ctaPolicy: ['navigation', 'how_to', 'purchase'].includes(topic) ? 'intent-required' : 'explicit-user-goal-only',
  }
  return Object.freeze({
    ...node,
    nodeHash: ql7StableHash(JSON.stringify(node)),
  })
}

export const QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH = Object.freeze(
  Object.fromEntries(QL7_SUPPORT_ECOSYSTEM_TOPICS.map((topic) => [topic, nodeFor(topic)])),
)

export const QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH_HASH = ql7StableHash(
  JSON.stringify(QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH),
)

export function getQl7SupportDomainBoundary(topic = 'support_system') {
  const normalized = normalizeQl7SupportTopic(topic)
  return QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH[normalized] ||
    QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH.support_system
}

export function resolveQl7SupportMicrotopic(topic = 'support_system', intent = 'overview') {
  const boundary = getQl7SupportDomainBoundary(topic)
  const normalizedIntent = MATERIAL_INTENTS.includes(ql7Str(intent)) ? ql7Str(intent) : 'overview'
  return boundary.microtopicIds.includes(`${boundary.domainId}.${normalizedIntent}`)
    ? `${boundary.domainId}.${normalizedIntent}`
    : boundary.microtopicIds[0]
}

export function validateQl7SupportDomainBoundaryGraph() {
  const failures = []
  for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
    const node = QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH[topic]
    if (!node) failures.push(`missing_domain:${topic}`)
    if (!node?.microtopicIds?.length) failures.push(`missing_microtopics:${topic}`)
    if (!node?.intentIds?.length) failures.push(`missing_intents:${topic}`)
    if (node?.forbiddenAutomaticRelations?.includes(topic)) failures.push(`self_forbidden:${topic}`)
    for (const relation of [...(node?.allowedRelations || []), ...(node?.requiredDependencies || [])]) {
      if (!QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH[relation]) failures.push(`unknown_relation:${topic}:${relation}`)
    }
  }
  return Object.freeze({
    version: QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH_VERSION,
    ok: failures.length === 0,
    domainCount: Object.keys(QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH).length,
    microtopicCount: Object.values(QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH)
      .reduce((total, node) => total + node.microtopicIds.length, 0),
    graphHash: QL7_SUPPORT_DOMAIN_BOUNDARY_GRAPH_HASH,
    failures: Object.freeze(failures),
  })
}
