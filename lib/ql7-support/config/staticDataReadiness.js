import {QL7_SUPPORT_FINAL_DATA_FLOORS} from './finalCombatDataFloors.js'
import {auditQl7GeneralHumanKnowledgeCore} from '../knowledge/generalHumanKnowledgeCore.js'
import {auditQl7SupportHumanConversationBank} from '../knowledge/humanConversationBank.js'
import {auditQl7SupportReviewedSeedRegistry} from '../language/reviewedSeedRegistry.js'
import {auditQl7SupportLanguageVariantBank} from '../language/languageVariantBank.js'
import {auditQl7SupportSemanticConceptBank} from '../language/semanticConceptBank.js'
import {auditQl7SupportCrisisReviewedCues} from '../safety/crisisReviewedCueBank.js'
import composerExpansion from '../../composer-safety/serverModerationExpansion.cjs'
import {auditQl7SupportKnowledgeGraph} from '../knowledge/knowledgeGraph.js'
import {auditQl7SupportDiscourseStrategyCapacity} from '../response/discourseStrategyRegistry.js'
import {auditQl7SupportHumorLexiconBank} from '../knowledge/humorLexiconBank.js'
import {auditQl7SupportHumorPlanner} from '../response/humorRealizationPlanner.js'
import {auditQl7SupportMicrotopicOntology} from '../ontology/microtopicOntology.js'
import {QL7_SUPPORT_PRELAB_MATERIAL_LIVE_REQUIREMENTS} from './prelabMaterialLiveRequirements.js'
import {auditQl7ProductionMaterialReadiness} from './materialReadiness.js'
import {auditQl7FloorCoverageRegistry} from './floorCoverageRegistry.js'
import {auditQl7SupportDirectiveRegistry} from './directiveRegistry.js'
import {ql7StableHash} from '../internal/text.js'
export const QL7_SUPPORT_STATIC_DATA_READINESS_SCHEMA_VERSION='5.4.2'
export function auditQl7SupportStaticDataReadiness(){const humanCore=auditQl7GeneralHumanKnowledgeCore(),human=auditQl7SupportHumanConversationBank(),seeds=auditQl7SupportReviewedSeedRegistry(),variants=auditQl7SupportLanguageVariantBank(),semantic=auditQl7SupportSemanticConceptBank(),crisis=auditQl7SupportCrisisReviewedCues(),composer=composerExpansion.auditComposerServerExpansion(),ecosystem=auditQl7SupportKnowledgeGraph(),discourse=auditQl7SupportDiscourseStrategyCapacity(),humorLexicon=auditQl7SupportHumorLexiconBank(),humorPlanner=auditQl7SupportHumorPlanner('en'),material=auditQl7ProductionMaterialReadiness(),microtopics=auditQl7SupportMicrotopicOntology(),floorCoverage=auditQl7FloorCoverageRegistry(),f=QL7_SUPPORT_FINAL_DATA_FLOORS,failures=[];const req=(ok,code)=>{if(!ok)failures.push(code)}
 req(material.publicFigures?.ok&&material.publicFigures.profileCount>=f.publicFigureIdentities&&material.publicFigures.profileAccountingPct===f.publicFigureSubstantiveProfileAccountingPct&&material.publicFigures.selfCatalogOnlySubstantiveFacts===f.publicFigureSelfCatalogSubstantiveFacts&&material.publicFigures.privateFacts===f.publicFigurePrivateFacts,'public_figures_canonical_material_contract')
 req(humanCore.ok&&humanCore.topicFamilyCount>=f.humanTopicFamilies&&humanCore.materialNodeCount>=f.generalKnowledgeConceptNodes,'general_human_core')
 req(human.ok&&human.categoryCount>=f.humanTopicFamilies&&human.materialCellCount>=f.humanConversationCells,'human_conversation')
 req(seeds.ok&&seeds.localeCount===f.locales&&seeds.seedsPerLocale>=f.reviewedSemanticSeedsPerLocale,'language_reviewed_seeds_compatibility')
 req(variants.ok&&variants.localeCount===f.locales&&variants.dialectFamilyCount>=f.dialectRegisterFamilies&&variants.mutationFamilyCount>=f.mutationFamilies,'language_variants_compatibility')
 req(semantic.ok&&semantic.localeCount===f.locales&&semantic.totalTerms>=f.expandedSemanticTermsTotal,'semantic_coordinate_scale')
 req(crisis.ok&&crisis.localeCount===f.locales&&crisis.totalCues>=f.crisisReviewedCuesTotal&&crisis.cuesPerLocale>=f.crisisReviewedCuesPerLocale,'crisis_compatibility')
 req(composer.ok&&composer.localeCount===f.locales&&composer.expandedFormCount>=f.composerServerExpandedTerms,'composer_expanded_scale')
 req(ecosystem.ok&&ecosystem.domainCount>=f.canonicalDomains&&ecosystem.nodeCount>=1600,'ecosystem')
 req(discourse.ok&&discourse.count>=f.discourseStrategies,'discourse');req(humorLexicon.ok&&humorLexicon.localeCount===f.locales&&humorPlanner.ok&&humorPlanner.capacity>=f.humorRealizationsPerLocale,'humor_resources')
 req(material.ok,'production_material_readiness');req(microtopics.ok&&microtopics.microtopicCount>=f.microtopics&&microtopics.requiredCapabilityUncovered===0,'microtopic_capability');req(floorCoverage.ok,'floor_coverage_registry');req(QL7_SUPPORT_PRELAB_MATERIAL_LIVE_REQUIREMENTS.length===f.prelabMaterialLiveRequirements,'prelab_material_live_registry')
 const rev2Registry=auditQl7SupportDirectiveRegistry();req(rev2Registry.ok,'directive_dod_registry');const body={schema:'ql7.support.static-data-readiness',schemaVersion:QL7_SUPPORT_STATIC_DATA_READINESS_SCHEMA_VERSION,ownerId:'ql7-support.static-data-readiness',ownerRevision:'material-live',ok:!failures.length,floors:f,publicFiguresMaterial:material.publicFigures,humanCore,humanConversation:human,language:{seeds,variants,semantic,material:material.language,dialectsMaterial:material.dialects},crisis,crisisMaterial:material.crisis,composer,composerMaterial:material.composer,ecosystem:{domainCount:ecosystem.domainCount,nodeCount:ecosystem.nodeCount},discourse:{count:discourse.count},humor:{lexicon:humorLexicon,planner:humorPlanner},materialReadiness:material,microtopics,floorCoverage,prelabMaterialLiveRequirementCount:QL7_SUPPORT_PRELAB_MATERIAL_LIVE_REQUIREMENTS.length,rev2Registry,allQuantitativeFloorsConsumed:floorCoverage.ok,allQualitativeFloorsMapped:floorCoverage.ok,independentOracleMustRunSeparately:true,calibrationAllowed:failures.length===0,empiricalReleaseClaimed:false,masterTzClosed:false,failures:Object.freeze(failures)};return Object.freeze({...body,readinessHash:ql7StableHash(JSON.stringify(body))})}
export const QL7_SUPPORT_STATIC_DATA_READINESS=auditQl7SupportStaticDataReadiness()
if(!QL7_SUPPORT_STATIC_DATA_READINESS.ok){const error=new Error(`ql7_support_code_data_readiness_failed:${QL7_SUPPORT_STATIC_DATA_READINESS.failures.join(',')}`);error.code='ql7_support_code_data_readiness_failed';error.status=503;throw error}
