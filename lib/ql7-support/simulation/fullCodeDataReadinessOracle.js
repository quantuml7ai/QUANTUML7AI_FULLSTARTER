import {QL7_SUPPORT_FINAL_DATA_FLOORS} from '../config/finalCombatDataFloors.js'
import {auditQl7SupportStaticDataReadiness} from '../config/staticDataReadiness.js'
import {runQl7MaterialityOracle} from './materialityOracle.js'
import {auditQl7OpenHumanKnowledge} from '../knowledge/openHumanKnowledgeRouter.js'
import {auditQl7BankAuthenticity} from './bankAuthenticityOracle.js'
import composerExpansion from '../../composer-safety/serverModerationExpansion.cjs'

// Historical entry point retained for contract compatibility. canonical REV.2 no longer treats this
// orchestrator as the independent oracle for properties that production readiness already judges.
// The independent materiality implementation is materialityOracle, which scans raw serialized data.
export const QL7_SUPPORT_FULL_CODE_DATA_READINESS_ORACLE_VERSION='5.4.2'

export function auditQl7FullCodeDataReadiness(){
  const floors=QL7_SUPPORT_FINAL_DATA_FLOORS
  const production=auditQl7SupportStaticDataReadiness()
  const material=runQl7MaterialityOracle()
  const authenticity=auditQl7BankAuthenticity()
  const openHuman=auditQl7OpenHumanKnowledge()
  const composer=composerExpansion.auditComposerServerExpansion()
  const failures=[]
  if(!production.ok)failures.push('production')
  if(!material.ok)failures.push('independent_materiality')
  if(!authenticity.ok)failures.push('authenticity')
  if(!openHuman.ok)failures.push('openHuman')
  if(Number(composer?.expandedFormCount||0)<floors.composerServerExpandedTerms)failures.push('composer')
  const publicFigures={
    profileCount:material.publicFigures.profileCount,
    locallyBundledSubstantiveProfiles:material.publicFigures.substantiveFourCount,
    sourceResolverRequiredProfiles:material.publicFigures.explicitInsufficientCount,
    substantiveProfileAccountingPct:material.publicFigures.profileAccountingPct,
    localSubstantiveRichCoveragePct:material.publicFigures.substantiveRichCoveragePct,
    selfCatalogOnlySubstantiveFacts:material.publicFigures.selfCatalogOnlySubstantiveFacts,
    privateFactCount:material.publicFigures.privateFacts,
    metricAuthority:'substantive-denominator-accounting',
  }
  const human={conceptNodes:material.generalHuman.materialNodeCount,conversationCells:material.conversation.materialCellCount}
  const minSeeds=Math.min(...Object.values(material.language.locales).map(x=>x.normalizedDistinct))
  const language={localeCount:material.language.localeCount,minimumSeedsPerLocale:minSeeds,dialectProfiles:material.dialects.profileCount,mutationFamilies:floors.mutationFamilies,semanticCoordinateFloor:floors.expandedSemanticTermsTotal}
  const minCrisis=Math.min(...Object.values(material.crisis.locales).map(x=>x.normalizedDistinct))
  const crisis={localeCount:material.crisis.localeCount,totalCues:material.crisis.totalDistinct,minimumCuesPerLocale:minCrisis}
  const body={
    schema:'ql7.support.full-code-data-readiness-orchestrator',schemaVersion:QL7_SUPPORT_FULL_CODE_DATA_READINESS_ORACLE_VERSION,
    ok:failures.length===0,floors,production,material,authenticity,openHuman,publicFigures,human,language,crisis,composer,
    codeDataArchitectureClosed:failures.length===0,
    staticConstructionReady:failures.length===0,
    readyForLargeCalibration:false,
    readyForLargeCalibrationRequiresInstallerQuickFullVerifyOnly:true,
    empiricalRelease:false,masterTzClosed:false,
    independentChecksUseRawProductionDataOwners:false,
    independentMaterialityOracle:'lib/ql7-support/simulation/materialityOracle.js',
    importsExpectedAnswerBuilder:false,failures:Object.freeze(failures),
  }
  return Object.freeze(body)
}
