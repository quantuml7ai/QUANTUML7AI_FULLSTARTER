import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_BEHAVIOR_MANIFEST, QL7_SUPPORT_CANONICAL_OWNERS } from '../../lib/ql7-support/config/behaviorManifest.js'
import {
  QL7_SUPPORT_KNOWLEDGE_GRAPH,
  QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS,
  QL7_SUPPORT_KNOWLEDGE_NODE_KINDS,
  auditQl7SupportKnowledgeGraph,
  getQl7SupportDomainKnowledgeNode,
  validateQl7SupportKnowledgeNode,
} from '../../lib/ql7-support/knowledge/knowledgeGraph.js'
import { getQl7SupportGeneralKnowledgeNode } from '../../lib/ql7-support/knowledge/generalKnowledgeRegistry.js'
import { resolveQl7SupportPublicFigure } from '../../lib/ql7-support/knowledge/publicFigureRegistry.js'
import { resolveQl7SupportReligionTopic } from '../../lib/ql7-support/knowledge/religionKnowledgeRegistry.js'

describe('QL7 Support canonical knowledge graph contract', () => {
  it('publishes direct canonical knowledge owners with complete addressable schema and integrity', () => {
    expect(QL7_SUPPORT_CANONICAL_OWNERS.knowledgeGraph).toBe('knowledge/knowledgeGraph.js')
    expect(QL7_SUPPORT_CANONICAL_OWNERS.generalKnowledge).toBe('knowledge/generalKnowledgeRegistry.js')
    expect(QL7_SUPPORT_CANONICAL_OWNERS.publicFigureRegistry).toBe('knowledge/publicFigureRegistry.js')
    expect(QL7_SUPPORT_CANONICAL_OWNERS.religionKnowledgeRegistry).toBe('knowledge/religionKnowledgeRegistry.js')
    expect(typeof getQl7SupportGeneralKnowledgeNode).toBe('function')
    expect(typeof resolveQl7SupportPublicFigure).toBe('function')
    expect(typeof resolveQl7SupportReligionTopic).toBe('function')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules).toMatchObject({
      knowledgeGraphVersion: '5.1.0',
      knowledgeGraphContract: '48-domains-1626-addressable-nodes-19-intents-14-node-kinds-32-locales-source-receipts',
    })
    expect(QL7_SUPPORT_KNOWLEDGE_GRAPH).toMatchObject({
      schema: 'ql7.support.knowledge-graph',
      schemaVersion: '5.1.0',
      owner: 'ql7-support.knowledge.graph',
    })
    expect(QL7_SUPPORT_KNOWLEDGE_GRAPH.graphHash).toHaveLength(64)
    expect(QL7_SUPPORT_KNOWLEDGE_NODE_KINDS).toHaveLength(14)
    expect(QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS).toHaveLength(19)
    expect(auditQl7SupportKnowledgeGraph()).toMatchObject({
      ok: true,
      domainCount: 48,
      nodeCount: 1626,
      localeCount: 32,
      failures: [],
    })

    for (const node of QL7_SUPPORT_KNOWLEDGE_GRAPH.nodes) {
      expect(validateQl7SupportKnowledgeNode(node), node.nodeId).toEqual({ ok: true, failures: [] })
    }
  })

  it('source-gates separate future directions without invented release dates', () => {
    for (const domainId of ['quantum_zigzag', 'ql7_blockchain']) {
      const node = getQl7SupportDomainKnowledgeNode(domainId)
      expect(node).toMatchObject({ domainId, availability: 'planned' })
      expect(node.availabilityEvidence[0].evidenceHash).toHaveLength(64)
      expect(node.roadmapEvidence[0]).toMatchObject({ launchDate: null, state: 'planned' })
      expect(node.roadmapEvidence[0].evidenceHash).toHaveLength(64)
      expect(node.sourceRefs.length).toBeGreaterThan(1)
    }
  })

  it('rejects mutation and unknown schema versions instead of weakening the contract', () => {
    const node = getQl7SupportDomainKnowledgeNode('wallet')
    expect(validateQl7SupportKnowledgeNode({ ...node, availability: 'available-ish' }).failures).toEqual(expect.arrayContaining([
      'invalid_availability',
      'node_hash_mismatch',
    ]))
    expect(validateQl7SupportKnowledgeNode({ ...node, schemaVersion: '6.0.0' }).failures).toEqual(expect.arrayContaining([
      'unknown_schema_version',
      'node_hash_mismatch',
    ]))
  })
})
