import { describe, it, expect } from 'vitest'
import { QL7_SUPPORT_FINAL_DATA_FLOORS } from '../../lib/ql7-support/config/finalCombatDataFloors.js'
import { auditQl7SupportStaticDataReadiness } from '../../lib/ql7-support/config/staticDataReadiness.js'
import { QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT, QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS } from '../../lib/ql7-support/config/maxCombatRequirementRegistry.js'

describe('QL7 Support canonical code/data readiness contract', () => {
  it('has 106 material requirements with owners/use-sites/oracles/tests', () => {
    expect(QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT).toBe(106)
    for (const requirement of QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS) {
      expect(requirement.requirementId).toMatch(/^MC-\d+$/)
      expect(String(requirement.owner || requirement.ownerPaths?.[0] || '').length).toBeGreaterThan(3)
      expect(String(requirement.productionUseSite || requirement.productionUseSites?.[0] || '').length).toBeGreaterThan(3)
      expect(String(requirement.independentOracle || requirement.independentOraclePaths?.[0] || '').length).toBeGreaterThan(3)
      expect(String(requirement.test || requirement.contractTests?.[0] || '').length).toBeGreaterThan(3)
    }
  })

  it('material floors are fail-closed against the canonical receipt shape', () => {
    const receipt = auditQl7SupportStaticDataReadiness()
    const floors = QL7_SUPPORT_FINAL_DATA_FLOORS
    expect(receipt.ok).toBe(true)
    expect(receipt.calibrationAllowed).toBe(true)
    expect(receipt.empiricalReleaseClaimed).toBe(false)
    expect(receipt.masterTzClosed).toBe(false)
    expect(receipt.publicFiguresMaterial.profileCount).toBeGreaterThanOrEqual(floors.publicFigureIdentities)
    expect(receipt.publicFiguresMaterial.profileAccountingPct).toBe(floors.publicFigureSubstantiveProfileAccountingPct)
    expect(receipt.publicFiguresMaterial.selfCatalogOnlySubstantiveFacts).toBe(0)
    expect(receipt.publicFiguresMaterial.privateFacts).toBe(0)
    expect(receipt.humanCore.nodeCount).toBeGreaterThanOrEqual(floors.generalKnowledgeConceptNodes)
    expect(receipt.humanConversation.cellCount).toBeGreaterThanOrEqual(floors.humanConversationCells)
    expect(receipt.language.seeds.localeCount).toBe(floors.locales)
    expect(receipt.language.seeds.seedsPerLocale).toBeGreaterThanOrEqual(floors.reviewedSemanticSeedsPerLocale)
    expect(receipt.language.variants.dialectFamilyCount).toBeGreaterThanOrEqual(floors.dialectRegisterFamilies)
    expect(receipt.language.variants.mutationFamilyCount).toBeGreaterThanOrEqual(floors.mutationFamilies)
    expect(receipt.language.semantic.totalTerms).toBeGreaterThanOrEqual(floors.expandedSemanticTermsTotal)
    expect(receipt.crisis.totalCues).toBeGreaterThanOrEqual(floors.crisisReviewedCuesTotal)
    expect(receipt.crisis.cuesPerLocale).toBeGreaterThanOrEqual(floors.crisisReviewedCuesPerLocale)
    expect(receipt.composer.expandedFormCount).toBeGreaterThanOrEqual(floors.composerServerExpandedTerms)
    expect(receipt.discourse.count).toBeGreaterThanOrEqual(floors.discourseStrategies)
    expect(receipt.humor.lexicon.localeCount).toBe(floors.locales)
    expect(receipt.humor.planner.capacity).toBeGreaterThanOrEqual(floors.humorRealizationsPerLocale)
    expect(receipt.failures).toEqual([])
  })
})
