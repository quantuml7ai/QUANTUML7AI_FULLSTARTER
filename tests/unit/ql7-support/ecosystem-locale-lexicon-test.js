import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_ALL_LOCALES,
} from '../../../lib/ql7-support/config/behaviorManifest.js'
import { getQl7SupportTopicLabel } from '../../../lib/ql7-support/ecosystemCatalog.js'
import { QL7_SUPPORT_DOMAIN_TOPICS } from '../../../lib/ql7-support/knowledge/domainRegistry.js'
import {
  QL7_SUPPORT_ECOSYSTEM_ALL_LOCALES,
  auditQl7SupportEcosystemLocaleLexicon,
} from '../../../lib/ql7-support/language/ecosystemLocaleLexicon.js'
import {
  getQl7SupportTopicAction,
} from '../../../lib/ql7-support/topicActionRegistry.js'
import { evaluateQl7SupportLanguagePurity } from '../../../lib/ql7-support/response/languagePurityGuard.js'

describe('QL7 Support ecosystem locale lexicon canonical', () => {
  it('covers every native locale and every ecosystem topic without fallback gaps', () => {
    const audit = auditQl7SupportEcosystemLocaleLexicon(QL7_SUPPORT_DOMAIN_TOPICS)
    expect(QL7_SUPPORT_ECOSYSTEM_ALL_LOCALES).toEqual(QL7_SUPPORT_ALL_LOCALES)
    expect(audit.ok).toBe(true)
    expect(audit.localeCount).toBe(24)
    expect(audit.topicCount).toBe(48)
    expect(audit.rows.every((row) => row.missingTopics.length === 0 && row.missingActions.length === 0 && row.specialDomainCollision.length === 0)).toBe(true)
  })

  it('returns a nonempty label for the full 32 by 48 canonical-domain matrix', () => {
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      for (const topic of QL7_SUPPORT_DOMAIN_TOPICS) {
        expect(getQl7SupportTopicLabel(topic, locale), `${locale}:${topic}`).not.toBe('')
      }
    }
  })

  it('keeps native CTA copy in the selected locale on production action descriptors', () => {
    const representativeTopics = ['qcoin', 'wallet', 'vip', 'metamarket', 'ads_campaigns', 'exchange_ai', 'gameverse', 'academy', 'forum_feed', 'messenger', 'auth', 'privacy', 'support_system', 'quantum_zigzag']
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      for (const topic of representativeTopics) {
        const action = getQl7SupportTopicAction(topic, { locale, seed: `locale-proof:${locale}:${topic}` })
        expect(action?.label, `${locale}:${topic}`).toBeTruthy()
        const purity = evaluateQl7SupportLanguagePurity({ text: action.label, locale })
        expect(purity.nativeCriticDecision, `${locale}:${topic}:${action.label}`).toBe('allow')
      }
    }
  })

  it('does not collapse partnership, investment or learning governance to generic Support copy', () => {
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      const support = getQl7SupportTopicLabel('support_system', locale)
      for (const topic of ['partnership', 'investment', 'learning_governance']) {
        const label = getQl7SupportTopicLabel(topic, locale)
        expect(label, `${locale}:${topic}`).toBeTruthy()
        expect(label, `${locale}:${topic}`).not.toBe(support)
      }
    }
  })

})
