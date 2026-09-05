import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_ALL_LOCALES,
} from '../../../lib/ql7-support/config/behaviorManifest.js'
import { getQl7SupportDomainKnowledgePack } from '../../../lib/ql7-support/knowledge/domainKnowledge.js'
import {
  QL7_SUPPORT_KNOWLEDGE_GRAPH,
  QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
  QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS,
  QL7_SUPPORT_KNOWLEDGE_NODE_KINDS,
  auditQl7SupportKnowledgeGraph,
  getQl7SupportDomainKnowledgeNode,
  realizeQl7SupportPlannedKnowledgeNode,
  resolveQl7SupportKnowledgeAlias,
  validateQl7SupportKnowledgeNode,
} from '../../../lib/ql7-support/knowledge/knowledgeGraph.js'
import { getQl7SupportKnowledgeAnswer } from '../../../lib/ql7-support/knowledgeRegistry.js'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'
import { localizeQl7SupportFinalDelivery } from '../../../lib/ql7-support/language/finalDeliveryLocalization.js'
import { QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION } from '../../../lib/ql7-support/response/morphosyntacticRealizer.js'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'
import { evaluateQl7SupportLanguagePurity } from '../../../lib/ql7-support/response/languagePurityGuard.js'

const NOW = '2026-08-15T00:00:00.000Z'

function runtime(text, locale, suffix = locale) {
  return executeQl7SupportTurnRuntime({
    mode: 'test',
    requestId: `knowledge-canonical:${suffix}`,
    conversationId: `knowledge-canonical:${suffix}`,
    userTurnId: `knowledge-canonical:${suffix}:user-1`,
    selectedLocale: locale,
    text,
    now: NOW,
  })
}

describe('QL7 Support canonical versioned knowledge graph', () => {
  it('covers 48 domains, 19 intents, 14 node kinds and exactly 32 locales', () => {
    const audit = auditQl7SupportKnowledgeGraph()
    expect(audit).toMatchObject({
      ok: true,
      domainCount: 48,
      nodeCount: 1626,
      localeCount: 32,
      intentContractCount: 19,
      minimumTheoreticalValidCapacity: 274176,
      actualCapacityProofComplete: false,
      failures: [],
    })
    expect(QL7_SUPPORT_KNOWLEDGE_GRAPH.locales).toEqual(QL7_SUPPORT_ALL_LOCALES)
    expect(QL7_SUPPORT_KNOWLEDGE_GRAPH.locales).toHaveLength(32)
    expect(new Set(QL7_SUPPORT_KNOWLEDGE_GRAPH.locales).size).toBe(32)
    expect(QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS).toHaveLength(19)
    expect(QL7_SUPPORT_KNOWLEDGE_NODE_KINDS).toHaveLength(14)
  })

  it('validates every node and rejects a tampered or future-version node', () => {
    for (const node of QL7_SUPPORT_KNOWLEDGE_GRAPH.nodes) {
      expect(validateQl7SupportKnowledgeNode(node), node.nodeId).toEqual({ ok: true, failures: [] })
    }
    const source = QL7_SUPPORT_KNOWLEDGE_GRAPH.nodes[0]
    expect(validateQl7SupportKnowledgeNode({ ...source, purpose: 'tampered' }).failures).toContain('node_hash_mismatch')
    expect(validateQl7SupportKnowledgeNode({ ...source, schemaVersion: '99.0.0' }).failures).toContain('unknown_schema_version')
  })

  it('keeps Quantum Zigzag and L7 Blockchain separate and source-gated', () => {
    const zigzag = getQl7SupportDomainKnowledgeNode('quantum_zigzag')
    const blockchain = getQl7SupportDomainKnowledgeNode('ql7_blockchain')
    expect(zigzag).toMatchObject({ availability: 'planned', domainId: 'quantum_zigzag' })
    expect(blockchain).toMatchObject({ availability: 'planned', domainId: 'ql7_blockchain' })
    expect(zigzag.nodeId).not.toBe(blockchain.nodeId)
    expect(zigzag.sourceRefs).not.toEqual(blockchain.sourceRefs)

    expect(resolveQl7SupportKnowledgeAlias({ text: 'Quantum Zigzag', locale: 'en' })).toMatchObject({
      decision: 'selected',
      selectedDomainId: 'quantum_zigzag',
      sourceGated: true,
    })
    expect(resolveQl7SupportKnowledgeAlias({ text: 'L7 Blockchain', locale: 'en' })).toMatchObject({
      decision: 'selected',
      selectedDomainId: 'ql7_blockchain',
      sourceGated: true,
    })
  })

  it('realizes a bounded planned-state answer in all 32 locales without a launch date', () => {
    const node = getQl7SupportDomainKnowledgeNode('ql7_blockchain')
    const texts = new Set()
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      const realized = realizeQl7SupportPlannedKnowledgeNode(node, locale)
      expect(realized.locale, locale).toBe(locale)
      expect(realized.text.length, locale).toBeGreaterThan(40)
      expect(realized.sourceReceipts.length, locale).toBeGreaterThan(0)
      expect(realized.text, locale).not.toMatch(/\b(?:20\d{2}|q[1-4]\s*20\d{2})\b/iu)
      texts.add(realized.text)
    }
    expect(texts.size).toBe(32)
  })

  it('has an explicit native-32 knowledge pack for every canonical locale', () => {
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      const pack = getQl7SupportDomainKnowledgePack(locale, 'Quantum Wallet')
      expect(pack.locale, locale).toBe(locale)
      expect(pack.source, locale).toBe('native32-domain-semantic-primitives')
      expect(pack.semanticRoles, locale).toEqual(expect.arrayContaining(['purpose', 'how_to', 'safety_boundary', 'source_status']))
      expect(pack.readyToSend, locale).toBe(false)
      expect(pack.finalText, locale).toBe(false)
      expect(pack.realizationOwner, locale).toBe('response/humanNaturalRealizer.js')
    }
  })

  it('attaches the graph and source receipts to normal and planned knowledge answers', () => {
    const current = getQl7SupportKnowledgeAnswer({
      topic: 'quantum_wallet',
      intent: 'how_to_question',
      locale: 'ru',
      seed: 'knowledge-canonical:wallet',
    })
    const planned = getQl7SupportKnowledgeAnswer({
      topic: 'quantum_zigzag',
      intent: 'roadmap_question',
      locale: 'ja',
      seed: 'knowledge-canonical:zigzag',
    })
    expect(current).toMatchObject({
      knowledgeGraphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
      knowledgeDomainNodeId: 'knowledge.wallet.domain',
      knowledgeIntentId: 'how_to',
    })
    expect(current.sourceReceipts.length).toBeGreaterThan(0)
    expect(planned).toMatchObject({
      topic: 'quantum_zigzag',
      source: 'versioned-knowledge-graph',
      availability: 'planned',
      knowledgeDomainNodeId: 'knowledge.quantum_zigzag.domain',
      knowledgeIntentId: 'roadmap',
    })
    expect(planned.sourceReceipts.length).toBeGreaterThan(0)
  })

  it('uses the same graph in runtime and keeps all 32 locales on the native sealed path', async () => {
    const bare = runtime('Quantum Wallet', 'en', 'bare-wallet')
    expect(bare.analysis).toMatchObject({
      topic: 'wallet',
      messageAct: 'ambiguous_request',
      requiresAdapter: false,
    })
    expect(bare.analysis.intentConfirmation.adapterAuthorized).toBe(false)

    const swedish = runtime('Vad ar L7 Blockchain?', 'sv', 'sv-blockchain')
    expect(swedish.analysis.topic).toBe('ql7_blockchain')
    expect(swedish.analysis.locale).toBe('sv')
    expect(swedish.localePolicy).toMatchObject({
      requested: 'sv', locale: 'sv', kind: 'native', supported: true,
      providerRequired: false, externalTranslationAllowed: false,
    })
    expect(swedish.knowledgeReceipt).toMatchObject({
      schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
      graphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
      domainNodeId: 'knowledge.ql7_blockchain.domain',
      availability: 'planned',
    })
    expect(swedish.knowledgeReceipt.graphHash).toHaveLength(64)
    expect(swedish.knowledgeReceipt.nodeHash).toHaveLength(64)
    expect(swedish.knowledgeReceipt.evidenceHashes[0]).toHaveLength(64)
    expect(swedish.text).toBeTruthy()
    expect(evaluateQl7SupportLanguagePurity({ text: swedish.text, locale: 'sv' }).nativeCriticDecision).toBe('allow')

    const sameLanguageDelivery = await localizeQl7SupportFinalDelivery({
      text: swedish.text,
      surface: buildQl7SupportCard({ ...swedish.surface, locale: 'sv', signedAt: swedish.now }),
      composerPolicy: swedish.composerPolicy,
      sourceLocale: 'sv', targetLocale: 'sv', runtime: swedish,
      translate: async () => { throw new Error('same_language_translation_must_not_run') },
    })
    expect(sameLanguageDelivery).toMatchObject({
      locale: 'sv',
      receipt: { status: 'same_language', sourceLocale: 'sv', targetLocale: 'sv', nativeOnly: true, externalTranslationAllowed: false },
    })

    const japanese = runtime('Quantum Zigzagとは何ですか？', 'ja', 'ja-zigzag')
    expect(japanese.analysis.topic).toBe('quantum_zigzag')
    expect(japanese.analysis.locale).toBe('ja')
    expect(japanese.localePolicy).toMatchObject({
      requested: 'ja', locale: 'ja', kind: 'native', supported: true,
      providerRequired: false, externalTranslationAllowed: false,
    })
    expect(japanese.knowledgeReceipt).toMatchObject({
      graphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
      domainNodeId: 'knowledge.quantum_zigzag.domain',
      availability: 'planned',
    })
    expect(japanese.text).toMatch(/[\u3040-\u30ff\u3400-\u9fff]/u)
    expect(evaluateQl7SupportLanguagePurity({ text: japanese.text, locale: 'ja' }).nativeCriticDecision).toBe('allow')

    await expect(localizeQl7SupportFinalDelivery({
      text: swedish.text,
      surface: swedish.surface,
      composerPolicy: swedish.composerPolicy,
      sourceLocale: 'sv', targetLocale: 'xx', runtime: swedish,
    })).rejects.toMatchObject({ code: 'support_locale_unsupported_no_external_fallback' })
  })

  it('does not leak QCoin or account data into an unrelated knowledge answer', () => {
    const answer = getQl7SupportKnowledgeAnswer({
      topic: 'search',
      intent: 'how_to_question',
      locale: 'ru',
      seed: 'knowledge-canonical:forum-isolation',
    })
    expect(answer.knowledgeDomainNodeId).toBe('knowledge.search.domain')
    expect(answer.text).toBe('')
    expect(answer.paragraphs).toEqual([])
    expect(answer.readyToSend).toBe(false)
    expect(answer.finalText).toBe(false)
    expect(JSON.stringify(answer.semanticFacts)).not.toMatch(/баланс\s+QCoin|VIP-статус|wallet session/iu)
  })
})
