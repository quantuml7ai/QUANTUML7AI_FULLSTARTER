import { describe, expect, it } from 'vitest'
import { resolveQl7PublicFigureIdentity } from '../../../lib/ql7-support/knowledge/public-figures/publicFigureResolver.js'
import { resolveQl7PublicFigureFact } from '../../../lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js'
import { auditQl7PublicFigureMaterialProfiles } from '../../../lib/ql7-support/knowledge/public-figures/materialProfiles.js'
import { getQl7SupportPublicFigureKnowledgeRealizerCoverage } from '../../../lib/ql7-support/response/publicFigureKnowledgeRealizer.js'

describe('canonical canonical public-figure metadata/substantive boundary', () => {
  it('restores the historical canonical-name fact without counting catalog metadata as substantive biography', async () => {
    const id=resolveQl7PublicFigureIdentity('Albert Einstein')
    expect(id).toMatchObject({decision:'selected'})
    const canonical=await resolveQl7PublicFigureFact({personId:id.selected.personId,factType:'canonical_name'})
    expect(canonical).toMatchObject({answerAllowed:true,state:'confirmed_stable_public_fact',sourceMode:'catalog-identity-metadata',metadataOnly:true,substantive:false})
    expect(canonical.fact.value).toBe('Albert Einstein')
    const current=await resolveQl7PublicFigureFact({personId:id.selected.personId,factType:'current_role'})
    expect(current.answerAllowed).toBe(false)
  })

  it('keeps sparse profiles source-gated for biography while allowing public identity metadata', async () => {
    const id=resolveQl7PublicFigureIdentity('Jacques Derrida')
    const canonical=await resolveQl7PublicFigureFact({personId:id.selected.personId,factType:'canonical_name'})
    const occupation=await resolveQl7PublicFigureFact({personId:id.selected.personId,factType:'occupation'})
    expect(canonical).toMatchObject({answerAllowed:true,metadataOnly:true,substantive:false,sourceLookupRequired:true})
    expect(occupation).toMatchObject({answerAllowed:false,sourceLookupRequired:true})
  })

  it('preserves the honest 18-rich / 1930-source-resolver accounting', () => {
    const audit=auditQl7PublicFigureMaterialProfiles()
    expect(audit).toMatchObject({ok:true,profileCount:1948,substantiveFourCount:18,explicitInsufficientCount:1930,selfCatalogOnlySubstantiveFacts:0,privateFacts:0,profileAccountingPct:100})
  })

  it('has reviewed core-locale realizations for every substantively rich profile', () => {
    expect(getQl7SupportPublicFigureKnowledgeRealizerCoverage()).toMatchObject({
      ok: true,
      profiles: 18,
      locales: 8,
      localizedStableSummaries: 144,
      failures: [],
    })
  })
})
