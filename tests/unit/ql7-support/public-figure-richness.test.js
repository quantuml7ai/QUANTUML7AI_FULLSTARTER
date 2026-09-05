import {describe,it,expect} from 'vitest'
import {auditQl7PublicFigureRichness} from '../../../lib/ql7-support/simulation/publicFigureRichnessOracle.js'
describe('canonical public figure compatibility entry point under canonical REV.2 substantive accounting',()=>{
 it('never promotes metadata/source-routing disposition into fake local biography coverage',()=>{
  const r=auditQl7PublicFigureRichness()
  expect(r.ok).toBe(true)
  expect(r.profileCount).toBeGreaterThanOrEqual(1900)
  expect(r.substantiveProfileAccountingPct).toBe(100)
  expect(r.locallyBundledSubstantiveProfiles+r.sourceResolverRequiredProfiles).toBe(r.profileCount)
  expect(r.localSubstantiveRichCoveragePct).toBeLessThanOrEqual(100)
  expect(r.selfCatalogOnlySubstantiveFacts).toBe(0)
  expect(r.privateFactCount).toBe(0)
 })
})
