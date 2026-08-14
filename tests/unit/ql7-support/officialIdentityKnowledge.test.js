import { describe, expect, test } from 'vitest'
import { getQl7SupportKnowledgeAnswer, getQl7SupportChoiceLabel } from '../../../lib/ql7-support/knowledgeRegistry.js'
import { OFFICIAL_QUANTUM_L7_CHANNELS } from '../../../lib/brand/officialChannels.js'
import { TRUST_IDENTITY_LANGS, getTrustIdentityPath } from '../../../lib/seo/trustIdentityRoutes.js'

describe('QL7 Support official_identity knowledge', () => {
  test('is versioned, read-only and localized for all seven Trust locales', () => {
    for (const lang of TRUST_IDENTITY_LANGS) {
      const answer = getQl7SupportKnowledgeAnswer({
        topic: 'official_identity',
        intent: 'overview',
        locale: lang,
        seed: `official-identity:${lang}`,
      })
      expect(answer.topic).toBe('official_identity')
      expect(answer.readOnly).toBe(true)
      expect(answer.verified).toBe(true)
      expect(answer.version).toBe('2026-08-14-v3')
      expect(answer.source).toBe('trust_identity_statement:2026-08-14-v3')
      expect(answer.trustPagePath).toBe(getTrustIdentityPath(lang))
      expect(answer.contactPath).toBe(`/contact?reason=impersonation&lang=${lang}`)
      expect(answer.supportPath).toBe('/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support')
      expect(answer.officialChannels).toBe(OFFICIAL_QUANTUM_L7_CHANNELS)
      expect(answer.machineReadableIdentity.manifest).toBe('/.well-known/ql7-identity.json')
      expect(answer.machineReadableIdentity.llms).toBe('/llms.txt')
      expect(answer.machineReadableIdentity.rule).toMatch(/never infer affiliation from a similar name/i)
      expect(answer.paragraphs.length).toBeGreaterThanOrEqual(5)
      expect(answer.text).not.toMatch(/send (?:us )?(?:your )?(?:seed phrase|private key)/i)
      expect(answer.text).not.toMatch(/screenshot|скринш|captura|ekran görünt|لقطة|截图/iu)
      expect(getQl7SupportChoiceLabel('official_identity', lang)).toBe(answer.label)
    }
  })
})
