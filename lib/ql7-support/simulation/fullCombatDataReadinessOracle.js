import crypto from 'node:crypto'
export const QL7_SUPPORT_FULL_DATA_READINESS_ORACLE_VERSION='5.2.4-independent'
const hash=(v)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export function evaluateQl7SupportFullDataReadinessIndependent(report={}){
 const failures=[];const n=(v)=>Number(v)||0
 if(n(report?.publicFigures?.catalog)<1050)failures.push('public_figure_catalog_floor')
 if(n(report?.publicFigures?.graph)<1050)failures.push('public_figure_graph_floor')
 if(report?.publicFigures?.publicOnly!==true||report?.publicFigures?.privateDataForbidden!==true)failures.push('public_figure_privacy')
 if(report?.publicFigures?.detailedFactsSourceBound!==true)failures.push('public_figure_source_boundary')
 if(n(report?.ecosystemKnowledge?.domains)<48||n(report?.ecosystemKnowledge?.nodes)<1600)failures.push('ecosystem_knowledge_floor')
 if(n(report?.humanConversation?.cells)<2000||report?.humanConversation?.openSubjectSupported!==true)failures.push('human_conversation_floor')
 if(n(report?.language?.locales)!==32||n(report?.language?.mutationFamilies)<20||n(report?.language?.dialectFamilies)<160)failures.push('language_variant_floor')
 if(report?.language?.nativeCompletenessClaimed===true)failures.push('false_dialect_completeness_claim')
 if(n(report?.semantic?.locales)!==32||n(report?.semantic?.totalTerms)<180000)failures.push('semantic_bank_floor')
 if(n(report?.crisis?.locales)!==32||n(report?.crisis?.phrases)<800)failures.push('crisis_bank_floor')
 if(n(report?.humor?.semanticPlans)<10000||n(report?.humor?.nativeLexiconLocales)!==8)failures.push('humor_plan_floor')
 if(n(report?.discourse?.strategies)<400)failures.push('discourse_floor')
 const result={oracle:'full-combat-data-readiness-independent',schemaVersion:QL7_SUPPORT_FULL_DATA_READINESS_ORACLE_VERSION,ok:failures.length===0,failures:[...new Set(failures)]}
 return Object.freeze({...result,reportHash:hash(result)})
}
