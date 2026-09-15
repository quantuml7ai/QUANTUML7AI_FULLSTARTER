import {validateQl7SupportOntologyNode} from './nodeSchemas.js'
import {validateQl7SupportOntologyEdge} from './edgeSchemas.js'
import {QL7_SUPPORT_RELEASE_DOMAIN_ROOTS} from './domainOntology.js'
import {QL7_SUPPORT_MICROTOPICS} from './microtopicOntology.js'
import {validateQl7SupportRelation} from './relationConstraints.js'

export const QL7_SUPPORT_ONTOLOGY_VALIDATOR_VERSION = '5.1.1'

const HIERARCHICAL = new Set(['contains', 'specializes'])

function validateHierarchyCycles(ids, edges, failures) {
  const adjacency = new Map()
  for (const edge of edges) {
    if (!HIERARCHICAL.has(edge?.edgeType || edge?.edgeKind)) continue
    const children = adjacency.get(edge.fromNodeId) || []
    children.push(edge.toNodeId)
    adjacency.set(edge.fromNodeId, children)
  }

  const visiting = new Set()
  const visited = new Set()

  function visit(id) {
    if (visiting.has(id)) {
      failures.push(`hierarchy_cycle:${id}`)
      return
    }
    if (visited.has(id)) return

    visiting.add(id)
    for (const child of adjacency.get(id) || []) visit(child)
    visiting.delete(id)
    visited.add(id)
  }

  for (const id of ids) visit(id)
}

export function validateQl7SupportOntology({ nodes = [], edges = [] } = {}) {
  const failures = []
  const ids = new Set()
  const edgeIds = new Set()

  for (const node of nodes) {
    const validation = validateQl7SupportOntologyNode(node)
    if (!validation.ok) {
      failures.push(...validation.failures.map((failure) => `${node?.nodeId || 'node'}:${failure}`))
    }
    if (ids.has(node?.nodeId)) failures.push(`duplicate_node:${node?.nodeId}`)
    ids.add(node?.nodeId)
  }

  const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]))
  for (const edge of edges) {
    const validation = validateQl7SupportOntologyEdge(edge)
    if (!validation.ok) {
      failures.push(...validation.failures.map((failure) => `${edge?.edgeId || 'edge'}:${failure}`))
    }
    if (edgeIds.has(edge?.edgeId)) failures.push(`duplicate_edge:${edge?.edgeId}`)
    edgeIds.add(edge?.edgeId)

    if (!ids.has(edge?.fromNodeId) || !ids.has(edge?.toNodeId)) {
      failures.push(`orphan_edge:${edge?.edgeId}`)
      continue
    }

    const relation = validateQl7SupportRelation({
      from: nodeMap.get(edge.fromNodeId),
      to: nodeMap.get(edge.toNodeId),
      edge,
    })
    if (!relation.ok) {
      failures.push(...relation.failures.map((failure) => `${edge?.edgeId || 'edge'}:${failure}`))
    }
  }

  for (const domainId of QL7_SUPPORT_RELEASE_DOMAIN_ROOTS) {
    if (!ids.has(`domain:${domainId}`)) failures.push(`domain_root_missing:${domainId}`)
    if (!QL7_SUPPORT_MICROTOPICS.some((microtopic) => microtopic.domainId === domainId)) {
      failures.push(`domain_without_microtopic:${domainId}`)
    }
  }

  validateHierarchyCycles(ids, edges, failures)

  const uniqueFailures = [...new Set(failures)]
  return Object.freeze({
    schema: 'ql7.support.ontology-validation',
    schemaVersion: QL7_SUPPORT_ONTOLOGY_VALIDATOR_VERSION,
    ok: uniqueFailures.length === 0,
    failures: Object.freeze(uniqueFailures),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    domainCount: QL7_SUPPORT_RELEASE_DOMAIN_ROOTS.length,
    microtopicCount: QL7_SUPPORT_MICROTOPICS.length,
    orphanCount: uniqueFailures.filter((failure) => failure.startsWith('orphan_edge:')).length,
    cycleCount: uniqueFailures.filter((failure) => failure.startsWith('hierarchy_cycle:')).length,
  })
}
