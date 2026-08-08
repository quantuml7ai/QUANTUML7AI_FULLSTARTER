import { describe, expect, test } from 'vitest'
import { classifyQl7PremiumMicroIntentV11_6, getQl7PremiumMicroIntentCatalogStatsV11_6 } from '../../../lib/ql7-support/microIntentCatalogV11_6.js'
import { realizeQl7PremiumMicroIntentV11_6 } from '../../../lib/ql7-support/premiumResponsePlannerV11_6.js'
import { assertNoQl7MachineLeakV11_6, sanitizeQl7EvidenceRowsV11_6 } from '../../../lib/ql7-support/evidencePolicyV11_6.js'
import { listQl7SemanticBadgeKeysV11_6 } from '../../../lib/ql7-support/semanticBadgeRegistryV11_6.js'
import { decideQl7SupportConversationTurn } from '../../../lib/ql7-support/conversationIntelligence.js'
import { buildQl7SupportIntentHypotheses } from '../../../lib/ql7-support/intentHypothesisEngine.js'

describe('QL7 Support V11.6 premium human intelligence', () => {
  test('declares at least 1024 unique micro-intents across 43 product and social domains', () => {
    expect(getQl7PremiumMicroIntentCatalogStatsV11_6()).toEqual({ domains: 43, operations: 24, microIntents: 1032 })
  })

  test.each([
    ['я имею ввиду на бирже ии бокс как им пользоваться', 'exchange_ai.usage'],
    ['как пользоваться аи аналитикой?', 'exchange_ai.usage'],
    ['на сколько точна аналитика на бирже?', 'exchange_ai.accuracy'],
    ['украли кькоин с баланса', 'qcoin.security'],
    ['мой рекламный пакет активен если доступно ноль кампаний?', 'ads_packages.status'],
  ])('routes screenshot regression %s', (text, expected) => {
    expect(classifyQl7PremiumMicroIntentV11_6(text)?.id).toBe(expected)
  })

  test('keeps a concrete MetaMarket request after a noisy social greeting prefix', () => {
    const text = 'bкo, Plуasу Hi, Support. MуеaMaкkуе what is it and how do I use it?'
    const routed = buildQl7SupportIntentHypotheses({ text, locale: 'en', baseAnalysis: { text } })
    expect(routed).toMatchObject({ messageAct: 'informational_question', greetingPrefix: true })
    expect(routed.top?.topic).toBe('metamarket')
  })

  test('treats a generic accusation as a support complaint, not proven account fraud', () => {
    const text = 'You are scammers and liars.'
    expect(classifyQl7PremiumMicroIntentV11_6(text)).toBeNull()
    const routed = buildQl7SupportIntentHypotheses({ text, locale: 'en', baseAnalysis: { text } })
    expect(routed.top?.topic).toBe('support_system')
    expect(routed.shouldClarify).toBe(true)
  })

  test('keeps narrow AI Box replies free from unrelated ecosystem catalog dumps', () => {
    const reply = realizeQl7PremiumMicroIntentV11_6({ microIntent: 'exchange_ai.usage', locale: 'ru', seed: 'fixed' })
    expect(reply?.text).toContain('AI Box')
    expect(reply?.text).not.toMatch(/MetaMarket|Quest|VIP|QCoin/u)
  })

  test('starts read-only QCoin security evidence without requiring a visible raw wallet id', () => {
    const decision = decideQl7SupportConversationTurn({
      text: 'украли кькоин с баланса',
      previousContext: { previousTopic: 'exchange' },
      route: { topic: 'qcoin', microIntent: 'qcoin.security', subIntent: 'qcoin_security', operation: 'security', topicSwitchDecision: 'switch', domainPlan: { privacyBoundary: 'user_safe_evidence_only' } },
      analysis: { topic: 'qcoin', microIntent: 'qcoin.security', subIntent: 'qcoin_security', role: 'incident_report', entities: {} },
      tone: {},
    })
    expect(decision).toMatchObject({ shouldDiagnose: true, caseStatus: 'ready_for_diagnostic', topic: 'qcoin' })
  })

  test('removes raw machine keys and localizes enums in user-facing rows', () => {
    const rows = sanitizeQl7EvidenceRowsV11_6([
      { key: 'state', label: 'Статус', value: 'pending' },
      { key: 'wallet', label: 'Wallet', value: '0x1111111111111111111111111111111111111111' },
      { key: 'verified', label: 'Проверка', value: true },
      { key: 'count', label: 'Операций', value: 9 },
    ], 'ru')
    expect(rows).toEqual([
      expect.objectContaining({ label: 'Статус', value: 'В ожидании' }),
      expect.objectContaining({ label: 'Проверка', value: 'Да' }),
      expect.objectContaining({ label: 'Операций', value: '9' }),
    ])
    expect(assertNoQl7MachineLeakV11_6(rows)).toBe(true)
  })

  test('ships the V12 premium semantic SVG catalog while preserving legacy roles', () => {
    const keys = listQl7SemanticBadgeKeysV11_6()
    expect(keys.length).toBeGreaterThanOrEqual(40)
    expect(keys).toEqual(expect.arrayContaining([
      'warning', 'stop', 'confirmed', 'partial', 'qcoin', 'ads_package', 'analytics', 'operator',
      'information', 'blocked', 'operator_handoff', 'time', 'context', 'identity', 'conversation',
      'evidence', 'incident', 'appeal', 'fraud', 'threat', 'cooldown', 'resolved',
    ]))
  })
})
