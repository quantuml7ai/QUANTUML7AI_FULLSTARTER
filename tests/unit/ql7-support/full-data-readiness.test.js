import { describe, it, expect } from 'vitest'
import { auditQl7SupportStaticDataReadiness } from '../../../lib/ql7-support/config/staticDataReadiness.js'
import { QL7_SUPPORT_FINAL_DATA_FLOORS } from '../../../lib/ql7-support/config/finalCombatDataFloors.js'
import { auditQl7FullCodeDataReadiness } from '../../../lib/ql7-support/simulation/fullCodeDataReadinessOracle.js'

describe('QL7 Support canonical Gate0 data readiness', () => {
  it('uses the canonical readiness owner, receipt shape, independent oracle and production floors', () => {
    const report = auditQl7SupportStaticDataReadiness()
    const oracle = auditQl7FullCodeDataReadiness()
    const f = QL7_SUPPORT_FINAL_DATA_FLOORS

    expect(report.schema).toBe('ql7.support.static-data-readiness')
    expect(report.ownerId).toBe('ql7-support.static-data-readiness')
    expect(report.ok).toBe(true)
    expect(report.calibrationAllowed).toBe(true)
    expect(report.empiricalReleaseClaimed).toBe(false)
    expect(report.masterTzClosed).toBe(false)

    expect(oracle.ok).toBe(true)
    expect(oracle.codeDataArchitectureClosed).toBe(true)
    expect(oracle.staticConstructionReady).toBe(true)
    expect(oracle.readyForLargeCalibration).toBe(false)
    expect(oracle.readyForLargeCalibrationRequiresInstallerQuickFullVerifyOnly).toBe(true)
    expect(oracle.empiricalRelease).toBe(false)
    expect(oracle.masterTzClosed).toBe(false)

    expect(report.publicFiguresMaterial.profileCount).toBeGreaterThanOrEqual(f.publicFigureIdentities)
    expect(report.publicFiguresMaterial.profileAccountingPct).toBe(f.publicFigureSubstantiveProfileAccountingPct)
    expect(report.publicFiguresMaterial.selfCatalogOnlySubstantiveFacts).toBe(0)
    expect(report.publicFiguresMaterial.privateFacts).toBe(0)
    expect(report.humanCore.nodeCount).toBeGreaterThanOrEqual(f.generalKnowledgeConceptNodes)
    expect(report.humanConversation.cellCount).toBeGreaterThanOrEqual(f.humanConversationCells)
    expect(report.language.seeds.localeCount).toBe(f.locales)
    expect(report.language.seeds.seedsPerLocale).toBeGreaterThanOrEqual(f.reviewedSemanticSeedsPerLocale)
    expect(report.language.variants.dialectFamilyCount).toBeGreaterThanOrEqual(f.dialectRegisterFamilies)
    expect(report.language.variants.mutationFamilyCount).toBeGreaterThanOrEqual(f.mutationFamilies)
    expect(report.language.semantic.totalTerms).toBeGreaterThanOrEqual(f.expandedSemanticTermsTotal)

    expect(report.crisis.totalCues).toBeGreaterThanOrEqual(f.crisisReviewedCuesTotal)
    expect(report.crisis.cuesPerLocale).toBeGreaterThanOrEqual(f.crisisReviewedCuesPerLocale)
    expect(oracle.crisis.totalCues).toBeGreaterThanOrEqual(f.crisisReviewedCuesTotal)
    expect(oracle.crisis.minimumCuesPerLocale).toBeGreaterThanOrEqual(f.crisisReviewedCuesPerLocale)

    expect(report.composer.expandedFormCount).toBeGreaterThanOrEqual(f.composerServerExpandedTerms)
    expect(report.failures).toEqual([])
    expect(oracle.failures).toEqual([])
  })
})
