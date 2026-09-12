import { describe, expect, test } from 'vitest'
import { QL7_SUPPORT_ECOSYSTEM_TOPICS, buildQl7SupportDomainPlan, getQl7SupportReadCollections } from '../../../lib/ql7-support/ecosystemCatalog.js'
import { getQl7SupportSourceContract } from '../../../lib/ql7-support/sourceRegistry.js'
import { getQl7SupportConfiguredReadCollections, isQl7SupportRealReadCollection } from '../../../lib/ql7-support/readOnlySourceManifest.js'

describe('QL7 Support REV.5.1 physical read authority', () => {
  test('uses one configured physical-read manifest and never fabricates Mongo reads', () => {
    let bounded = 0
    let notApplicable = 0
    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      const contract = getQl7SupportSourceContract(topic)
      const configured = getQl7SupportConfiguredReadCollections(topic)
      expect(getQl7SupportReadCollections(topic)).toEqual(configured)
      expect(contract.collections).toEqual(configured)
      expect(contract.readOnly).toBe(true)
      expect(contract.arbitraryQueryAllowed).toBe(false)
      expect(contract.foreignAccountAllowed).toBe(false)
      for (const collection of configured) expect(isQl7SupportRealReadCollection(collection)).toBe(true)
      if (contract.mode === 'bounded_read') {
        bounded += 1
        expect(configured.length).toBeGreaterThan(0)
      } else {
        notApplicable += 1
        expect(contract.mode).toBe('diagnostic_not_applicable')
        expect(configured).toEqual([])
        expect(contract.routeEvidence.length).toBeGreaterThan(0)
      }
    }
    expect(bounded).toBeGreaterThan(0)
    expect(notApplicable).toBeGreaterThan(0)
    expect(bounded + notApplicable).toBe(QL7_SUPPORT_ECOSYSTEM_TOPICS.length)
  })

  test('domain plans and scenario rows expose the same typed read mode', () => {
    for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
      const contract = getQl7SupportSourceContract(topic)
      const plan = buildQl7SupportDomainPlan({ analysis: { topic, originalText: `${topic} status` }, locale: 'en' })
      expect(plan.readAdapter.contractVersion).toBe(2)
      expect(plan.readAdapter.mode).toBe(contract.mode)
      expect(plan.readAdapter.collections).toEqual(contract.collections)
      expect(plan.readAdapter.bounded).toBe(contract.mode === 'bounded_read')
      expect(plan.readAdapter.diagnosticNotApplicable).toBe(contract.mode === 'diagnostic_not_applicable')
      for (const scenario of plan.scenarioMatrix) {
        expect(scenario.diagnosticReadMode).toBe(contract.mode)
        expect(scenario.sourceReadRequired).toBe(contract.mode === 'bounded_read')
        expect(scenario.storagePrimary).toBe(contract.mode === 'bounded_read' ? 'mongo' : 'knowledge_or_route_evidence')
      }
    }
  })
})
