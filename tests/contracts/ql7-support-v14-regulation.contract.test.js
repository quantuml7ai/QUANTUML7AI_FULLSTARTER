import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_ALL_LOCALES,
  QL7_SUPPORT_SIMULATION_PROFILES,
} from '../../lib/ql7-support/simulation/scenarioCatalog.js'
import { QL7_SUPPORT_MUTATION_FAMILIES } from '../../lib/ql7-support/simulation/mutationEngine.js'
import { getQl7SemanticBankCoverage } from '../../lib/ql7-support/language/semanticBanks.js'
import { getQl7HumanVariationCoverage } from '../../lib/ql7-support/language/humanVariationBanks.js'
import { getQl7SupportKnowledge32Coverage } from '../../lib/ql7-support/simulation/corpora/knowledge32V14.js'

describe('QL7 Support V14 regulation contracts', () => {
  it('exposes all 32 locales, expanded banks and production run profiles', () => {
    const semantic = getQl7SemanticBankCoverage()
    const human = getQl7HumanVariationCoverage()
    const knowledge32 = getQl7SupportKnowledge32Coverage()
    expect(QL7_SUPPORT_ALL_LOCALES).toHaveLength(32)
    expect(semantic.localeCount).toBe(32)
    expect(semantic.totalTerms).toBeGreaterThan(180000)
    expect(semantic.rows.every((row) => row.totalTerms >= 5000)).toBe(true)
    expect(semantic.rows.every((row) => Object.values(row.categoryCounts).every((count) => count >= 20))).toBe(true)
    expect(human.localeCount).toBe(32)
    expect(human.ok).toBe(true)
    expect(human.minVariantsPerLocale).toBeGreaterThanOrEqual(40000)
    expect(human.totalVariants).toBeGreaterThan(1300000)
    expect(semantic.topicAliasTopicCount).toBeGreaterThanOrEqual(47)
    expect(semantic.topicAliasTermCount).toBeGreaterThanOrEqual(630)
    for (const row of human.rows) {
      expect(row.categoryCounts.entryGreetingFresh, `${row.locale}:fresh`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.entryGreetingContinue, `${row.locale}:continue`).toBeGreaterThanOrEqual(600)
      expect(row.categoryCounts.productHowToBridge, `${row.locale}:product`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.aiRecommendationReady, `${row.locale}:ai-ready`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.aiQuotaExhausted, `${row.locale}:ai-quota`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.qcoinIncident, `${row.locale}:qcoin-incident`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.operatorContactProbe, `${row.locale}:operator`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.purchaseSuccess, `${row.locale}:purchase-success`).toBeGreaterThanOrEqual(900)
      expect(row.categoryCounts.purchaseFailure, `${row.locale}:purchase-failure`).toBeGreaterThanOrEqual(900)
      expect(row.categoryCounts.unrecognizedInput, `${row.locale}:unrecognized`).toBeGreaterThanOrEqual(10000)
      expect(row.categoryCounts.ambiguousMaterialClarifier, `${row.locale}:ambiguous`).toBeGreaterThanOrEqual(10000)
      expect(row.categoryCounts.casualConversationBridge, `${row.locale}:casual`).toBeGreaterThanOrEqual(10000)
    }
    expect(knowledge32).toMatchObject({
      ok: true,
      domainCount: 46,
      localeCount: 32,
      baseParaphrasesPerDomainLocale: 50,
      mutationFamiliesPerBase: 8,
      scenarioFloor: 588800,
    })
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('long-dialogue')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('business')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('social-boundary')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('knowledge-32')
    expect(QL7_SUPPORT_MUTATION_FAMILIES).toHaveLength(29)
  }, 60000)

  it('ships full regulation scripts', () => {
    for (const f of [
      'scripts/ql7-support/v14-source-integrity-audit.mjs',
      'scripts/ql7-support/v14-integration-regression-proof.mjs',
      'scripts/ql7-support/v14-simulation-suite.mjs',
      'scripts/ql7-support/v14-provider-translate-smoke.mjs',
      'scripts/ql7-support/v14-live-read-proof.mjs',
      'scripts/ql7-support/v14-regulation-audit.mjs',
      'scripts/ql7-support/v14-support-active-process-matrix.mjs',
      'scripts/ql7-support/v14-browser-acceptance.mjs',
      'scripts/ql7-support/v14-operator-asset-guard.mjs',
      'scripts/ql7-support/v14-learning-governance-proof.mjs',
      'scripts/ql7-support/v14-sim.mjs',
      'scripts/ql7-support/v14-watch.mjs',
      'scripts/ql7-support/v14-report.mjs',
      'scripts/ql7-support/v14-replay.mjs',
      'scripts/ql7-support/v14-live-read.mjs',
      'scripts/ql7-support/v14-smtp-snapshot.mjs',
      'scripts/ql7-support/v14-verify.mjs',
    ]) expect(fs.existsSync(f)).toBe(true)
  })

  it('exposes stable pnpm ql7 support aliases', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    for (const name of [
      'ql7:support:sim',
      'ql7:support:watch',
      'ql7:support:report',
      'ql7:support:replay',
      'ql7:support:live-read',
      'ql7:support:browser',
      'ql7:support:smtp',
      'ql7:support:learning',
      'ql7:support:verify',
    ]) expect(pkg.scripts[name]).toMatch(/^node scripts\/ql7-support\/v14-/u)
  })
})
