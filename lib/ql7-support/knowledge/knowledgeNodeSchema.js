import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_GENERAL_KNOWLEDGE_NODE_SCHEMA_VERSION = '5.2.0'
export const QL7_SUPPORT_GENERAL_FACT_RELATIONS = Object.freeze([
  'instance_of','associated_with','part_of','distinct_from','covers_topic','uses','focuses_on','affected_by','can_help','safety_boundary','current_source_required',
])

export function createQl7SupportGeneralKnowledgeNode({
  nodeId = '', category = '', aliases = [], ambiguity = '', sourceRequirement = 'curated_or_current',
  semanticFacts = [], currentSensitive = false, entityType = 'topic', selectionPolicy = '',
} = {}) {
  const facts = ql7Arr(semanticFacts).map((row, index) => Object.freeze({
    factId: ql7Str(row?.factId) || `${ql7Str(nodeId)}:fact:${index + 1}`,
    subjectId: ql7Str(row?.subjectId) || ql7Str(nodeId),
    relation: ql7Str(row?.relation), objectConceptId: ql7Str(row?.objectConceptId), objectValue: row?.objectValue ?? '',
    sourceReceipt: row?.sourceReceipt || null, immutable: row?.immutable !== false,
  }))
  const body = {
    schema: 'ql7.support.general-knowledge-node', schemaVersion: QL7_SUPPORT_GENERAL_KNOWLEDGE_NODE_SCHEMA_VERSION,
    nodeId: ql7Str(nodeId), category: ql7Str(category), aliases: Object.freeze(ql7Arr(aliases).map((v)=>ql7Str(v).toLowerCase()).filter(Boolean)),
    ambiguity: ql7Str(ambiguity), sourceRequirement: ql7Str(sourceRequirement), currentSensitive: currentSensitive === true,
    entityType: ql7Str(entityType), selectionPolicy: ql7Str(selectionPolicy), semanticFacts: Object.freeze(facts), readyToSend: false, finalText: false,
  }
  if (!body.nodeId || !body.category) throw new Error('general_knowledge_node_identity_required')
  for (const fact of facts) if (!QL7_SUPPORT_GENERAL_FACT_RELATIONS.includes(fact.relation)) throw new Error(`general_knowledge_relation_invalid:${fact.relation}`)
  return Object.freeze({ ...body, nodeHash: ql7StableHash(JSON.stringify(body)) })
}

export function auditQl7SupportGeneralKnowledgeNode(node = {}) {
  const failures = []
  if (node?.schema !== 'ql7.support.general-knowledge-node') failures.push('schema')
  if (!ql7Str(node?.nodeId) || !ql7Str(node?.category)) failures.push('identity')
  if (node?.readyToSend !== false || node?.finalText !== false) failures.push('final_text')
  for (const fact of ql7Arr(node?.semanticFacts)) if (!QL7_SUPPORT_GENERAL_FACT_RELATIONS.includes(fact?.relation)) failures.push(`relation:${fact?.relation}`)
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
