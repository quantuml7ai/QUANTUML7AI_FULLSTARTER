import { describe, expect, it } from 'vitest'
import { classifyQl7SupportHumanTopic } from '../../../lib/ql7-support/knowledge/humanTopicOntology.js'
import { resolveQl7SupportPublicFigure } from '../../../lib/ql7-support/knowledge/publicFigureRegistry.js'
import { getQl7SupportGeneralKnowledgeCoverage } from '../../../lib/ql7-support/knowledge/generalKnowledgeRegistry.js'
import { extractQl7SupportContactSignals } from '../../../lib/ql7-support/contact/contactIntelligence.js'
import { auditQl7SupportLocaleOperationFrames } from '../../../lib/ql7-support/language/localeOperationFrames.js'
import { executeQl7SupportTurnRuntime } from '../../../lib/ql7-support/runtime/executeTurn.js'

const NOW = '2026-08-16T00:00:00.000Z'

describe('QL7 Support canonical human-intelligence closure', () => {
  it('routes noisy broad-human topics by semantic specificity rather than incidental words', () => {
    expect(classifyQl7SupportHumanTopic('мотациклы для города', { locale: 'ru' })?.category).toBe('motorcycles')
    expect(classifyQl7SupportHumanTopic('диснейлэнд калифорния', { locale: 'ru' })?.category).toBe('theme_parks')
    expect(classifyQl7SupportHumanTopic('футблл кто лутший', { locale: 'ru' })?.category).toBe('football')
    expect(classifyQl7SupportHumanTopic('боксс и ufcc', { locale: 'ru' })?.category).toBe('mma_ufc')
    expect(classifyQl7SupportHumanTopic('астраномия и космас', { locale: 'ru' })?.category).toBe('science')
    expect(classifyQl7SupportHumanTopic('город в италии', { locale: 'ru' })?.category).toBe('geography')
  })

  it('clarifies ambiguous public figures and requires sources for current-office queries', () => {
    const ronaldo = resolveQl7SupportPublicFigure('Роналдо')
    expect(ronaldo?.decision).toBe('clarify')
    expect(ronaldo?.candidates?.map((row) => row.personId)).toEqual(expect.arrayContaining(['cristiano-ronaldo', 'ronaldo-nazario']))
    expect(resolveQl7SupportPublicFigure('Cristiano Ronaldo')?.selected?.personId).toBe('cristiano-ronaldo')
    const president = resolveQl7SupportPublicFigure('кто сейчас президент')
    expect(president).toMatchObject({ decision: 'current_role_query', currentSourceRequired: true, roleQuery: true })
  })

  it('keeps broad-human knowledge structured and removes ready-to-send factual prose', () => {
    expect(getQl7SupportGeneralKnowledgeCoverage()).toMatchObject({
      ok: true,
      readyToSendRows: 0,
      finalSentenceRows: 0,
      openSubjectSupported: true,
    })
    expect(auditQl7SupportLocaleOperationFrames()).toMatchObject({
      ok: true,
      localeCount: 32,
      operationCount: 33,
      entryCount: 1056,
      readyToSendRows: 0,
      finalSentenceRows: 0,
      semanticProjection: true,
    })
  })

  it('treats contact presence as data, never as external-contact consent', () => {
    const present = extractQl7SupportContactSignals('user@example.com')
    expect(present).toMatchObject({ offered: false, refused: false, consent: false, email: 'user@example.com' })
    expect(present.receipt).toMatchObject({ contactPresenceIsNotConsent: true, explicitConsentEvidence: false })

    const consent = extractQl7SupportContactSignals('yes, you may contact me at user@example.com')
    expect(consent).toMatchObject({ offered: true, refused: false, consent: true, email: 'user@example.com' })
    expect(consent.receipt.explicitConsentEvidence).toBe(true)

    const refusal = extractQl7SupportContactSignals('не желаю оставлять контакты, user@example.com')
    expect(refusal).toMatchObject({ offered: false, refused: true, consent: false, preferred: 'dm' })
  })

  it('creates the optional business questionnaire only after an explicit consent receipt in the canonical runtime', () => {
    const withConsent = executeQl7SupportTurnRuntime({
      mode: 'test', requestId: 'r15-business-consent', conversationId: 'r15-business-consent', userTurnId: 'r15-business-consent:1',
      selectedLocale: 'en', text: 'yes, you may contact me at user@example.com about a partnership', now: NOW,
    })
    expect(withConsent.analysis).toMatchObject({ topic: 'partnership', contactConsent: true })
    expect(withConsent.plan.relationshipIntent.stage).toBe('handoff_with_contacts')
    expect(withConsent.plan.contactQuestionnaire).toMatchObject({ state: 'optional', allFieldsOptional: true, readyToSend: false })

    const refused = executeQl7SupportTurnRuntime({
      mode: 'test', requestId: 'r15-business-refusal', conversationId: 'r15-business-refusal', userTurnId: 'r15-business-refusal:1',
      selectedLocale: 'ru', text: 'не желаю оставлять контакты, user@example.com, по партнёрству пишите здесь', now: NOW, forceOperatorCase: true,
    })
    expect(refused.analysis).toMatchObject({ topic: 'partnership', contactRefused: true, contactConsent: false })
    expect(refused.plan.relationshipIntent.stage).toBe('handoff_dm_only')
    expect(refused.plan.contactRequest).toBeNull()
    expect(refused.plan.contactQuestionnaire).toMatchObject({ state: 'not_permitted_without_consent', readyToSend: false })
    expect(refused.operatorCase?.contacts).toMatchObject({ consent: false, contactDeclined: true, consentState: 'refused', preferred: 'dm', dmOnly: true })
    expect(JSON.stringify(refused.operatorCase?.contacts || {})).not.toContain('user@example.com')
  })
})
