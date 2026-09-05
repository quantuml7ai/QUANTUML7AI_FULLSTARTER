import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_BEHAVIOR_MANIFEST, QL7_SUPPORT_CANONICAL_OWNERS, QL7_SUPPORT_RUNTIME_VERSION } from '../../lib/ql7-support/config/behaviorManifest.js'
import { validateQl7SupportSvgRegistry } from '../../lib/ql7-support/presentation/svgRegistry.js'
import { getQl7SemanticBankCoverage, QL7_SUPPORT_SEMANTIC_BANK_VERSION } from '../../lib/ql7-support/language/semanticBanks.js'
import { getQl7HumanVariationCoverage, QL7_SUPPORT_HUMAN_VARIATION_VERSION } from '../../lib/ql7-support/language/humanVariationPrimitives.js'
import { getQl7SupportKnowledge32Coverage } from '../../lib/ql7-support/simulation/corpora/knowledge32.js'
import { QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY } from '../../lib/ql7-support/learning/governancePolicy.js'

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

describe('QL7 Support canonical contracts', () => {
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
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.runtimeVersion).toBe(QL7_SUPPORT_RUNTIME_VERSION)
    expect(QL7_SUPPORT_RUNTIME_VERSION).toBe('5.3.0')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.locales).toHaveLength(32)
    expect(coverage.localeCount).toBe(32)
    expect(coverage.totalTerms).toBeGreaterThan(180000)
    expect(coverage.rows.every((row) => row.totalTerms >= 5000)).toBe(true)
    expect(coverage.rows.every((row) => Object.values(row.categoryCounts).every((count) => count >= 20))).toBe(true)
    expect(humanCoverage.ok).toBe(true)
    expect(humanCoverage).toMatchObject({ primitiveOnly: true, readyToSendRows: 0, finalSentenceRows: 0, actualCapacityProofComplete: false, requiredActualOutputsPerBranchLocale: 10000 })
    expect(coverage.topicAliasTopicCount).toBeGreaterThanOrEqual(47)
    expect(coverage.topicAliasTermCount).toBeGreaterThanOrEqual(630)
    expect(knowledgeCoverage).toMatchObject({
      ok: true,
      domainCount: 48,
      localeCount: 32,
      baseParaphrasesPerDomainLocale: 50,
      mutationFamiliesPerBase: 8,
      scenarioFloor: 614400,
    })
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.semanticBankVersion).toBe(QL7_SUPPORT_SEMANTIC_BANK_VERSION)
    expect(QL7_SUPPORT_SEMANTIC_BANK_VERSION).toBe('15.5.0')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.humanVariationPrimitivesVersion).toBe(QL7_SUPPORT_HUMAN_VARIATION_VERSION)
    expect(QL7_SUPPORT_HUMAN_VARIATION_VERSION).toBe('16.0.1-primitives-only')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.semanticScoringEvidence).toContain('adapterGates')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.businessOperatorIntake).toContain('collect_contact')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.runtimeIdentity).toBe('canonical-single-executor-stable-pnpm-no-active-version-split')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.contactRuntime).toBe('disabled-redirect-guard-mail-api-only')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.learningGovernance).toContain('shadow-canary-rollback')
    expect(QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY.automaticProductionPromotion).toBe(false)
    expect(QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY.gates).toEqual(expect.arrayContaining([
      'redaction',
      'privacy_review',
      'poisoning_review',
      'quorum',
      'offline_evaluation',
      'regression',
      'shadow',
      'canary',
      'manual_approval',
      'rollback',
    ]))
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.responseVariationFloor).toContain('10000-actual-production-path-outputs')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.knowledge32Corpus).toBe('48-domains-32-tz-locales-50-paraphrases-8-mutations')
    expect(validateQl7SupportSvgRegistry()).toMatchObject({ ok: true, count: 160, uniquePathHashes: 160 })
  }, 60000)

  it('keeps package and env outside runtime ownership', () => {
    expect(Object.values(QL7_SUPPORT_CANONICAL_OWNERS).some((value) => /package|\.env/u.test(value))).toBe(false)
  })
})
