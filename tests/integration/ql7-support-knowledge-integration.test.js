import { describe, expect, it } from 'vitest'
import { executeQl7SupportProductionTurn } from '../../lib/ql7-support/runtime/productionTurn.js'
import { QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION } from '../../lib/ql7-support/knowledge/knowledgeGraph.js'
import { QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION } from '../../lib/ql7-support/response/morphosyntacticRealizer.js'

const NOW = '2026-08-15T00:00:00.000Z'



const TEST_ACTOR = Object.freeze({
  valid: true,
  authMode: 'test_verified_actor',
  canonicalAccountId: 'knowledge-canonical:test-actor',
  actorReceiptId: 'actor-receipt:knowledge-canonical-test',
})

async function production(text, locale = 'en', suffix = locale) {
  return executeQl7SupportProductionTurn({
    mode: 'test',
    actor: TEST_ACTOR,
    verifiedActorId: TEST_ACTOR.canonicalAccountId,
    requestId: `knowledge-canonical:integration:${suffix}`,
    conversationId: `knowledge-canonical:integration:${suffix}`,
    userTurnId: `knowledge-canonical:integration:${suffix}:user-1`,
    selectedLocale: locale,
    originalText: text,
    seed: `knowledge-canonical:integration:${suffix}`,
    choiceSigningKey: 'ql7-support-knowledge-integration-choice-key-v1-2026',
    now: NOW,
  })
}

describe('QL7 Support canonical knowledge production parity', () => {
  it('recognizes every observed bare product while keeping adapters closed', async () => {
    const rows = [
      ['Quantum Wallet', 'wallet'],
      ['MetaMarket', 'metamarket'],
      ['MetaStudio', 'metastudio'],
      ['BattleCoin', 'battlecoin'],
      ['Battle Chat', 'battle_chat'],
      ['Crypto News', 'news'],
      ['QL7 Blockchain', 'ql7_blockchain'],
      ['Quantum Zigzag', 'quantum_zigzag'],
    ]
    for (const [text, topic] of rows) {
      const turn = await production(text, 'en', `bare:${topic}`)
      expect(turn.runtime.analysis, text).toMatchObject({
        topic,
        messageAct: 'ambiguous_request',
        requiresAdapter: false,
      })
      expect(turn.runtime.analysis.intentConfirmation.adapterAuthorized, text).toBe(false)
      expect(turn.runtime.adapterReceipts, text).toEqual([])
      expect(turn.delivery.text, text).toBe(turn.runtime.text)
      expect(turn.delivery.surface.integrity.signature, text).toHaveLength(64)
      expect(turn.delivery.surface.integrity.signature, text).toBe(turn.delivery.surfaceHash)
    }
  })

  it('carries the exact source-gated graph receipt through the production executor', async () => {
    const rows = [
      ['Vad ar L7 Blockchain?', 'sv', 'ql7_blockchain'],
      ['Quantum Zigzagとは何ですか？', 'ja', 'quantum_zigzag'],
    ]
    for (const [text, locale, topic] of rows) {
      const turn = await production(text, locale, `planned:${locale}`)
      expect(turn.runtime.analysis.topic).toBe(topic)
      expect(turn.runtime.knowledgeReceipt).toMatchObject({
        schema: 'ql7.support.knowledge-realization-receipt',
        schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
        graphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
        domainNodeId: `knowledge.${topic}.domain`,
        availability: 'planned',
      })
      expect(turn.runtime.knowledgeReceipt.graphHash).toHaveLength(64)
      expect(turn.runtime.knowledgeReceipt.nodeHash).toHaveLength(64)
      expect(turn.runtime.knowledgeReceipt.evidenceHashes.every((hash) => hash.length === 64)).toBe(true)
      expect(turn.runtime.runtimeParity.knowledgeReceiptHash).toBe(turn.runtime.knowledgeReceipt.receiptHash)
      expect(turn.runtime.realized.knowledgeReceipt.receiptHash).toBe(turn.runtime.knowledgeReceipt.receiptHash)
      expect(turn.runtime.qualityGate.coherenceFailures).not.toContain('availability_contradiction')
      expect(turn.runtime.noveltyFallbackReceipt).toBeNull()
      expect(turn.runtime.realized.noveltyFallbackReceipt).toBeNull()
      expect(turn.runtime.runtimeParity.noveltyFallbackReceiptHash).toBe('')
      expect(turn.runtime.localePolicy.supported).toBe(true)
      expect(turn.delivery.locale).toBe(locale)
      expect(turn.delivery.surface.locale).toBe(locale)
      expect(turn.delivery.text).toBe(turn.runtime.text)
      expect(turn.delivery.text).not.toMatch(/\b(?:20\d{2}|q[1-4]\s*20\d{2})\b/iu)
    }
  })

  it('keeps explicit domains isolated from QCoin and unrelated product tails', async () => {
    const rows = [
      ['What is MetaStudio and what can I do there?', 'metastudio'],
      ['What is MetaMarket and how do I use it?', 'metamarket'],
      ['How does BattleCoin work?', 'battlecoin'],
      ['How do I read CryptoRadar on the homepage?', 'homepage'],
      ['How do I search the forum?', 'search'],
    ]
    for (const [text, topic] of rows) {
      const turn = await production(text, 'en', `isolation:${topic}`)
      expect(turn.runtime.scopeReceipt.primaryDomainId, text).toBe(topic)
      expect(turn.runtime.scopeReceipt.explicitSecondaryDomainIds, text).toEqual([])
      expect(turn.runtime.adapterReceipts, text).toEqual([])
      expect(turn.runtime.text, text).not.toMatch(/QCoin balance|VIP status|advertising metrics/iu)
    }
  })

  it('does not let weak aliases override explicit market, ads or security evidence', async () => {
    const rows = [
      ['Show BTC market price and AI recommendation on 5m', 'exchange_ai'],
      ['Muestra las métricas de mi campaña publicitaria', 'ads_campaigns'],
      ['this looks like a scam and fraud inside the ecosystem, please alert operator', 'security'],
    ]
    for (const [text, topic] of rows) {
      const turn = await production(text, topic === 'ads_campaigns' ? 'es' : 'en', `negative:${topic}`)
      expect(turn.runtime.analysis.topic, text).toBe(topic)
    }
  })
})
