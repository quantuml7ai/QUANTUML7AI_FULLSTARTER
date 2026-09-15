import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION, QL7_SUPPORT_COGNITIVE_COLLECTIONS } from '../../../lib/ql7-support/cognitiveMemory.js'
import { QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP, buildQl7SupportGovernedLearningState } from '../../../lib/ql7-support/learningControlPlane.js'
import { hasQl7SupportChoiceSelectionAttempt, sanitizeQl7SupportChoiceTransport } from '../../../lib/ql7-support/choiceContract.js'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support canonical permanent contracts', () => {
  it('preserves signed choice token end-to-end and makes choice authoritative', () => {
    const route = read('app/api/dm/send/route.js')
    const server = read('lib/ql7-support/server.js')
    const productionTurn = read('lib/ql7-support/runtime/productionTurn.js')
    const signedToken = 'header.payload.signature'
    const sanitized = sanitizeQl7SupportChoiceTransport({
      cardIntegrity: 'card-signature',
      optionId: 'wallet-balance',
      topic: 'wallet',
      subIntent: 'balance',
      caseId: 'case-1',
      signedToken,
    })
    expect(hasQl7SupportChoiceSelectionAttempt({ optionId: 'wallet-balance' })).toBe(true)
    expect(hasQl7SupportChoiceSelectionAttempt({})).toBe(false)
    expect(sanitized).toMatchObject({ optionId: 'wallet-balance', signedToken })
    expect(Object.isFrozen(sanitized)).toBe(true)
    expect(route).toContain('const supportChoice = sanitizeQl7SupportChoiceTransport(rawSupportChoice)')
    expect(route).toContain("!str(supportChoice?.signedToken)")
    expect(route).toContain("ql7_support_choice_token_required")
    expect(route).toContain('supportChoice,')
    expect(server).toContain('consumeQl7SupportChoice')
    expect(server).toContain('signed_choice_authoritative')
    expect(server).not.toContain('attachQl7SupportSignedChoices')
    expect(productionTurn).toContain('attachQl7SupportSignedChoices')
    expect(productionTurn).toContain('deliveryBindingId')
  })

  it('links derived cognitive memory to canonical dm_messages and governed legacy-compatible learning', () => {
    const memory = read('lib/ql7-support/cognitiveMemory.js')
    expect(QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION).toBe('dm_messages')
    expect(memory).toContain('canonicalMessageCollection: QL7_SUPPORT_CANONICAL_MESSAGE_COLLECTION')
    expect(memory).not.toContain('deleteMany({})')
    expect(Object.values(QL7_SUPPORT_COGNITIVE_COLLECTIONS)).toHaveLength(10)
    expect(QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP.candidates).toBe('ql7_support_learning_candidates')
    expect(QL7_SUPPORT_LEARNING_COMPATIBILITY_MAP.legacySignals).toBe('ql7_support_learning_signals')
    expect(buildQl7SupportGovernedLearningState({ stage: 'canary' })).toMatchObject({ autoPromotionAllowed: false, automaticSourceRewrite: false, rollbackRequiredOnRegression: true })
  })

  it('has scalable streaming simulation with replay, checkpoints, fenced shards and zero-write live reads', () => {
    const runner = read('scripts/ql7-support/lab.mjs')
    const coordinator = read('scripts/ql7-support/lab-coordinator.mjs')
    const evidenceWriter = read('lib/ql7-support/simulation/reportWriter.js')
    const replay = read('scripts/ql7-support/replay.mjs')
    const liveReadProof = read('scripts/ql7-support/live-read-proof.mjs')
    const liveRead = read('lib/ql7-support/simulation/liveRead.js')
    expect(runner).toContain("checkpointFile=path.join(outRoot,'checkpoints','latest.json')")
    expect(runner).toContain("journalFile=path.join(outRoot,'checkpoints','journal.ndjson')")
    expect(runner).toContain("scenarioLedgerPath=path.join(outRoot,'scenario-hash-ledger.ndjson')")
    expect(runner).toContain('executeQl7SupportScenario(scenario)')
    expect(runner).toContain("productionRuntime:'executeQl7SupportProductionTurn'")
    expect(coordinator).toContain('Promise.all')
    expect(coordinator).toContain('--resume=true')
    expect(coordinator).toContain('worker-lease.json')
    expect(coordinator).toContain('evidence-validate.mjs')
    expect(evidenceWriter).toContain('.ndjson.gz')
    expect(evidenceWriter).toContain("path.join(this.outDir,'gallery.html')")
    expect(replay).toContain('executeQl7SupportScenario(found.scenario')
    expect(liveReadProof).toContain("canonical_live_read_write_budget_must_be_zero")
    expect(liveReadProof).toContain("Number(noWrite.writeCount||0)===0")
    expect(liveRead).toContain('executeQl7SupportProductionTurn')
    expect(liveRead).toContain('readOnly: true')
    expect(liveRead).toContain('writeCount: 0')
  })

  it('renders global actions and maps MetaStudio to its real opening contract', () => {
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const actions = read('lib/ql7-support/topicActionRegistry.js')
    const game = read('app/game/page.js')
    expect(card).toContain('isRenderableAction')
    expect(card).toContain("quantum-wallet:open")
    expect(card).toContain("metamarket:open")
    expect(actions).toContain('/game?ql7Action=metastudio#metastudio')
    expect(game).toContain("params.get('ql7Action') !== 'metastudio'")
    expect(game).toContain('openMetaStudio()')
  })

  it('extends account deletion for every user-owned canonical collection without changing business ownership', () => {
    const deletion = read('lib/mongo/account-deletion-primary.cjs')
    for (const collection of [
      'ql7_support_turn_decisions',
      'ql7_support_dialogue_outcomes',
      'ql7_support_action_outcomes',
      'ql7_support_translation_outcomes',
      'ql7_support_response_quality',
      'ql7_support_personality_state',
      'ql7_support_user_adaptation',
    ]) expect(deletion).toContain(collection)
    expect(deletion).toContain('idsToSupportHashes')
  })
  it('rejects external, protocol-relative and targetless card actions while preserving canonical actions', () => {
    const card = buildQl7SupportCard({
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
