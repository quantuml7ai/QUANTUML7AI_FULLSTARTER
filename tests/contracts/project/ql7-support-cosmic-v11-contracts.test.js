import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11, QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11 } from '../../../lib/ql7-support/cognitiveMemoryV11.js'
import { QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP_V11, buildQl7SupportGovernedLearningStateV11 } from '../../../lib/ql7-support/learningControlPlaneV11.js'
import { hasQl7SupportChoiceSelectionAttemptV11, sanitizeQl7SupportChoiceTransportV11 } from '../../../lib/ql7-support/choiceContractV11.js'
import { buildQl7SupportCardV4 } from '../../../lib/ql7-support/cards.js'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support V11 permanent contracts', () => {
  it('preserves signed choice token end-to-end and makes choice authoritative', () => {
    const route = read('app/api/dm/send/route.js')
    const server = read('lib/ql7-support/server.js')
    const signedToken = 'header.payload.signature'
    const sanitized = sanitizeQl7SupportChoiceTransportV11({
      cardIntegrity: 'card-signature',
      optionId: 'wallet-balance',
      topic: 'wallet',
      subIntent: 'balance',
      caseId: 'case-1',
      signedToken,
    })
    expect(hasQl7SupportChoiceSelectionAttemptV11({ optionId: 'wallet-balance' })).toBe(true)
    expect(hasQl7SupportChoiceSelectionAttemptV11({})).toBe(false)
    expect(sanitized).toMatchObject({ optionId: 'wallet-balance', signedToken })
    expect(Object.isFrozen(sanitized)).toBe(true)
    expect(route).toContain('const supportChoice = sanitizeQl7SupportChoiceTransportV11(rawSupportChoice)')
    expect(route).toContain("!str(supportChoice?.signedToken)")
    expect(route).toContain("ql7_support_choice_token_required")
    expect(route).toContain('supportChoice,')
    expect(server).toContain('consumeQl7SupportChoiceV11')
    expect(server).toContain('signed_choice_authoritative')
    expect(server).toContain('attachQl7SupportSignedChoicesV11')
  })

  it('links derived cognitive memory to canonical dm_messages and governed legacy-compatible learning', () => {
    const memory = read('lib/ql7-support/cognitiveMemoryV11.js')
    expect(QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11).toBe('dm_messages')
    expect(memory).toContain('canonicalMessageCollection: QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION_V11')
    expect(memory).not.toContain('deleteMany({})')
    expect(Object.values(QL7_SUPPORT_COGNITIVE_COLLECTIONS_V11)).toHaveLength(10)
    expect(QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP_V11.candidates).toBe('ql7_support_learning_candidates')
    expect(QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP_V11.legacySignals).toBe('ql7_support_learning_signals_v8')
    expect(buildQl7SupportGovernedLearningStateV11({ stage: 'canary' })).toMatchObject({ autoPromotionAllowed: false, automaticSourceRewrite: false, rollbackRequiredOnRegression: true })
  })

  it('has million-scale streaming simulation with replay, checkpoints, safe live guards and optional support-only Mongo persistence', () => {
    const runner = read('scripts/ql7-support/hyper-semantic-simulation.mjs')
    expect(runner).toContain('checkpoint.json')
    expect(runner).toContain('results.jsonl')
    expect(runner).toContain('replay-commands.ps1')
    expect(runner).toContain('allow-live-dm-writes')
    expect(runner).toContain('QL7_SUPPORT_SYNTHETIC_TEST_ENABLED')
    expect(runner).toContain('QL7_SUPPORT_SIMULATION_MONGO_WRITE_ENABLED')
    expect(runner).toContain('recordQl7SupportSimulationRunV11')
    for (const report of ['evaluation-metrics.json', 'confusion-matrix.csv', 'accuracy-by-transition.csv', 'accuracy-by-topic.csv', 'failure-codes.csv']) expect(runner).toContain(report)
    expect(runner).toContain('exactTopicAccuracy')
    expect(runner).toContain('multiIntentAccuracy')
    const evaluator = read('lib/ql7-support/simulationEvaluatorV11.js')
    expect(evaluator).toContain('multi_intent_missing_topic')
    expect(evaluator).toContain('candidateTopics')
    const learning = read('lib/ql7-support/learningControlPlaneV11.js')
    expect(learning).toContain('unmeasuredWeight: 0')
    expect(learning).toContain('missingRequiredSlices')
    expect(read('lib/ql7-support/simulationGeneratorV11.js')).toContain('5000000')
  })

  it('renders global actions and maps MetaStudio to its real opening contract', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const actions = read('lib/ql7-support/topicActionRegistryV9.js')
    const game = read('app/game/page.js')
    expect(card).toContain('isRenderableAction')
    expect(card).toContain("quantum-wallet:open")
    expect(card).toContain("metamarket:open")
    expect(actions).toContain('/game?ql7Action=metastudio#metastudio')
    expect(game).toContain("params.get('ql7Action') !== 'metastudio'")
    expect(game).toContain('openMetaStudio()')
  })

  it('extends account deletion for every user-owned V11 collection without changing business ownership', () => {
    const deletion = read('lib/mongo/account-deletion-primary.cjs')
    for (const collection of [
      'ql7_support_turn_decisions_v11',
      'ql7_support_dialogue_outcomes_v11',
      'ql7_support_action_outcomes_v11',
      'ql7_support_translation_outcomes_v11',
      'ql7_support_response_quality_v11',
      'ql7_support_personality_state_v11',
      'ql7_support_user_adaptation_v11',
    ]) expect(deletion).toContain(collection)
    expect(deletion).toContain('idsToSupportHashes')
  })
  it('rejects external, protocol-relative and targetless card actions while preserving canonical actions', () => {
    const card = buildQl7SupportCardV4({
      locale: 'en',
      title: 'Safe actions',
      summary: 'Only canonical actions survive.',
      actions: [
        { id: 'wallet', routeId: 'wallet', label: 'Wallet' },
        { id: 'internal', href: '/privacy', label: 'Privacy' },
        { id: 'external', href: 'https://evil.example', label: 'External' },
        { id: 'protocol-relative', href: '//evil.example/path', label: 'Protocol relative' },
        { id: 'targetless', actionType: 'route', label: 'Targetless' },
      ],
    })
    expect(card.actions.map((row) => row.id)).toEqual(['wallet', 'internal'])
    expect(card.actions[0]).toMatchObject({ routeId: 'wallet', actionType: 'global_event', eventName: 'quantum-wallet:open' })
    expect(card.actions[1]).toMatchObject({ routeId: '', actionType: 'route', href: '/privacy' })
  })

})
