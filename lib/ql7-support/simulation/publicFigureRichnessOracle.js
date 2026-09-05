import {auditQl7PublicFigureMaterialProfiles} from '../knowledge/public-figures/materialProfiles.js'
// Historical function name retained, but REV.2 explicitly forbids profiles.length ? 100 : 0.
// This receipt reports actual bundled substantive coverage and separate source-resolution disposition.
export function auditQl7PublicFigureRichness(){
 const a=auditQl7PublicFigureMaterialProfiles(),failures=[]
 if(a.profileCount<1900)failures.push(`identity_floor:${a.profileCount}`)
 if(a.profileAccountingPct!==100)failures.push(`accounting:${a.profileAccountingPct}`)
 if(a.selfCatalogOnlySubstantiveFacts!==0)failures.push(`self_catalog:${a.selfCatalogOnlySubstantiveFacts}`)
 if(a.privateFacts!==0)failures.push(`private:${a.privateFacts}`)
 return Object.freeze({ok:!failures.length,profileCount:a.profileCount,locallyBundledSubstantiveProfiles:a.substantiveFourCount,sourceResolverRequiredProfiles:a.explicitInsufficientCount,substantiveProfileAccountingPct:a.profileAccountingPct,localSubstantiveRichCoveragePct:a.substantiveRichCoveragePct,selfCatalogOnlySubstantiveFacts:a.selfCatalogOnlySubstantiveFacts,privateFactCount:a.privateFacts,metricAuthority:'substantive-denominator-accounting',failures:Object.freeze(failures)})
}
