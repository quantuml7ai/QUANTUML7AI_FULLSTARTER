import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support REV.5.1 source-contract semantic safety', () => {
  it('keeps Support-card translation receipt-authoritative and whitespace-independent', () => {
    const route = read('app/api/dm/support-card-translate/route.js')
    const legacyContract = read('tests/contracts/project/ql7-support-888-final-contracts.test.js')
    const componentContract = read('tests/component/ql7-support/premium-presentation-test.js')
    const legacySimulation = read('scripts/ql7-support/full-integration-closure-proof.mjs')

    expect(route).toContain('ql7_support_client_card_payload_forbidden')
    expect(route).toContain('ql7_support_delivery_receipts')
    expect(route).toMatch(/actorIdHash\s*:\s*sha\(canonicalAccountId\)/u)
    expect(route).toMatch(/commitState\s*:\s*['"]committed['"]/u)
    expect(route).toMatch(/localizeQl7SupportStructuredNative/u)
    expect(route).toMatch(/translateQl7SupportTextNative/u)
    expect(route).not.toMatch(/forceProvider|providerLocalization/u)
    expect(route).toContain('rebuildQl7SupportTranslatedCard')
    expect(route).toMatch(/translationProjection\s*:\s*rebuilt\.translationProjection/u)
    expect(route).not.toMatch(/(?:body|request|req)\s*\.\s*(?:card|supportCard|sourceCard|translatedCard)\b/u)

    for (const source of [legacyContract, componentContract]) {
      expect(source).not.toContain("toContain(\"commitState:'committed'\")")
      expect(source).not.toContain("toContain('actorIdHash:sha(")
      expect(source).not.toContain("toContain('translationProjection:rebuilt.translationProjection')")
    }
    expect(legacySimulation).not.toContain("includes(\"commitState:'committed'\")")
    expect(legacySimulation).not.toContain("includes('actorIdHash:sha(")
  })

  it('runs a dedicated fail-closed source-contract semantic audit from the canonical verifier', () => {
    const audit = read('scripts/ql7-support/source-contract-semantic-audit.mjs')
    const verify = read('scripts/ql7-support/verify.mjs')
    expect(audit).toContain("schema: 'ql7.support.canonical.source-contract-semantic-audit'")
    expect(audit).toContain('arbitraryClientSemanticCardForbidden: true')
    expect(audit).toContain('signedTranslationProjectionRequired: true')
    expect(verify).toContain("sourceContract:['source-contract-semantic'")
    expect(verify).toContain("'source-contract-semantic-audit':['sourceContract']")
  })
})
