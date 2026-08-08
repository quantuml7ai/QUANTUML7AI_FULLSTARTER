import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_BEHAVIOR_MANIFEST, QL7_SUPPORT_CANONICAL_OWNERS } from '../../lib/ql7-support/config/behaviorManifest.js'
import { validateQl7SupportSvgRegistry } from '../../lib/ql7-support/presentation/svgRegistry.js'
import { getQl7SemanticBankCoverage } from '../../lib/ql7-support/language/semanticBanks.js'
import { getQl7HumanVariationCoverage } from '../../lib/ql7-support/language/humanVariationBanks.js'
import { getQl7SupportKnowledge32Coverage } from '../../lib/ql7-support/simulation/corpora/knowledge32V14.js'

const root = process.cwd()

function ownerPathExists(relativePath = '') {
  const normalized = String(relativePath).trim()
  if (!normalized) return false
  const repositoryRelative = /^(?:app|scripts|tests|components|public)\//u.test(normalized)
  return fs.existsSync(
    repositoryRelative
      ? path.join(root, normalized)
      : path.join(root, 'lib/ql7-support', normalized),
  )
}

describe('QL7 Support V14 contracts', () => {
  it('declares one canonical owner per responsibility', () => {
    expect(new Set(Object.values(QL7_SUPPORT_CANONICAL_OWNERS)).size).toBe(
      Object.keys(QL7_SUPPORT_CANONICAL_OWNERS).length,
    )

    for (const owner of Object.values(QL7_SUPPORT_CANONICAL_OWNERS)) {
      const ownerPaths = String(owner).split(' + ').map((value) => value.trim()).filter(Boolean)
      expect(ownerPaths.length).toBeGreaterThan(0)
      for (const ownerPath of ownerPaths) expect(ownerPathExists(ownerPath)).toBe(true)
    }

    expect(QL7_SUPPORT_CANONICAL_OWNERS.semanticBanks).toBe('language/semanticBanks.js')
    expect(QL7_SUPPORT_CANONICAL_OWNERS.learning).toBe('learningPipeline.js')
  })

  it('declares 32 locales, semantic banks and 160 SVG assets', () => {
    const coverage = getQl7SemanticBankCoverage()
    const humanCoverage = getQl7HumanVariationCoverage()
    const knowledgeCoverage = getQl7SupportKnowledge32Coverage()
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.runtimeVersion).toBe('15.0.0')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.locales).toHaveLength(32)
    expect(coverage.localeCount).toBe(32)
    expect(coverage.totalTerms).toBeGreaterThan(180000)
    expect(coverage.rows.every((row) => row.totalTerms >= 5000)).toBe(true)
    expect(coverage.rows.every((row) => Object.values(row.categoryCounts).every((count) => count >= 20))).toBe(true)
    expect(humanCoverage.ok).toBe(true)
    expect(humanCoverage.minVariantsPerLocale).toBeGreaterThanOrEqual(40000)
    expect(humanCoverage.totalVariants).toBeGreaterThan(1300000)
    for (const row of humanCoverage.rows) {
      expect(row.categoryCounts.entryGreetingFresh, `${row.locale}:fresh`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.productHowToBridge, `${row.locale}:product`).toBeGreaterThanOrEqual(1000)
      expect(row.categoryCounts.dataTableIntro, `${row.locale}:table`).toBeGreaterThanOrEqual(1000)
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
    expect(coverage.topicAliasTopicCount).toBeGreaterThanOrEqual(47)
    expect(coverage.topicAliasTermCount).toBeGreaterThanOrEqual(630)
    expect(knowledgeCoverage).toMatchObject({
      ok: true,
      domainCount: 46,
      localeCount: 32,
      baseParaphrasesPerDomainLocale: 50,
      mutationFamiliesPerBase: 8,
      scenarioFloor: 588800,
    })
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.semanticBankVersion).toBe('15.3.2')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.humanVariationBankVersion).toBe('15.3.1')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.semanticScoringEvidence).toContain('adapterGates')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.businessOperatorIntake).toContain('collect_contact')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.runtimeIdentity).toBe('canonical-single-executor-stable-pnpm-no-active-version-split')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.contactRuntime).toBe('disabled-redirect-guard-mail-api-only')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.learningGovernance).toContain('canary_rollback')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.responseVariationFloor).toBe('per-tz-locale-min-41600-compositional-measured-critical-1000-10000-ambiguity-noise')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.knowledge32Corpus).toBe('46-domains-32-tz-locales-50-paraphrases-8-mutations')
    expect(validateQl7SupportSvgRegistry()).toMatchObject({ ok: true, count: 160, uniquePathHashes: 160 })
  }, 60000)

  it('keeps package and env outside runtime ownership', () => {
    expect(Object.values(QL7_SUPPORT_CANONICAL_OWNERS).some((value) => /package|\.env/u.test(value))).toBe(false)
  })
})
