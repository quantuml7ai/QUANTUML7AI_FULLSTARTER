import {createQl7CognitiveTurnState} from '../cognition/cognitiveTurnState.js'
import {createQl7ReadPlan} from '../data/readPlan.js'
import {authorizeQl7ReadPlan} from '../data/readAuthorizationPolicy.js'
import {projectQl7SafeUserData} from '../data/safeProjection.js'
import {createQl7KnowledgeClaim} from '../knowledge/ingestion/claimSchema.js'
import {createQl7KnowledgeEntity} from '../knowledge/ingestion/entitySchema.js'
import {createQl7SourceDescriptor} from '../knowledge/ingestion/sourceRegistry.js'
import {evaluateQl7ClaimFreshness} from '../knowledge/ingestion/freshnessPolicy.js'
import {createQl7KnowledgeSnapshotManifest} from '../knowledge/ingestion/knowledgeSnapshotManifest.js'
import {retrieveQl7HybridEvidence} from '../knowledge/retrieval/hybridRetriever.js'
import {createQl7SecurityEventFrame} from '../security/securityEventFrame.js'
import {buildQl7SecurityReadPlan} from '../security/securityReadPlan.js'
import {fuseQl7SecurityRisk} from '../security/securityRiskFusion.js'
import {decideQl7SecurityAction} from '../security/securityActionPolicy.js'
import {decideQl7AssetProtection} from '../security/assetProtectionPolicy.js'
import {createQl7SecurityEvidenceReceipt} from '../security/securityEvidenceReceipt.js'
import {projectQl7SecurityLadder} from '../security/securityLadderProjection.js'
import {planQl7InteractionModality} from '../presentation/interactionModalityPlanner.js'
export const QL7_NATIVE_INTELLIGENCE_PLANE_VERSION='1.0.0'
export function prepareQl7NativeIntelligenceContext(input={}){
 const rr=input.readRequest||null;let read=null;if(rr){const plan=createQl7ReadPlan(rr);const authorization=authorizeQl7ReadPlan(plan,{verifiedIdentity:input.verifiedIdentity===true||Boolean(input.verifiedActorId),materialIntent:rr.materialIntent===true});read=Object.freeze({plan,authorization})}
 const rawRows=Array.isArray(input.knowledgeRows)?input.knowledgeRows:[];const rows=rawRows.map(x=>createQl7KnowledgeClaim(x));const evidencePack=rawRows.length?retrieveQl7HybridEvidence({query:String(input.originalText||input.text||''),rows,snapshotId:String(input.knowledgeSnapshotId||''),limit:24}):null
 const securityFrames=(Array.isArray(input.securityEvents)?input.securityEvents:[]).map(createQl7SecurityEventFrame);const objective=(Array.isArray(input.securityEvidence)?input.securityEvidence:[]);const risk=fuseQl7SecurityRisk({semanticRisk:Number(input.semanticSecurityRisk||0),deterministicEvidence:objective});const securityAction=decideQl7SecurityAction(risk);const securityReadPlans=securityFrames.map(buildQl7SecurityReadPlan);const securityReceipt=createQl7SecurityEvidenceReceipt({operationId:input.operationId||input.requestId,action:securityAction.action,objectiveReceiptIds:objective.filter(x=>x?.verified&&x?.serverOwned).map(x=>x.receiptId),semanticReceiptId:input.semanticReceiptId});const ladder=projectQl7SecurityLadder(risk)
 const assetDecision=input.assetProtection?decideQl7AssetProtection(input.assetProtection):null
 const modality=planQl7InteractionModality(input.interactionDecision||{})
 const cognitiveState=createQl7CognitiveTurnState({turnId:input.turnId||input.operationId,operationId:input.operationId,semantic:input.semanticFrame||input.analysis?.semanticFrame||{hypotheses:input.hypotheses||[]},normalization:input.normalization||null,memoryView:input.memoryGraph||null,evidenceGraph:{nodes:[...(evidencePack?.claims||[]).map((c,i)=>({nodeId:`claim:${i}`,type:'claim',claim:c,quality:Number(c.sourceQuality||.7),freshness:Number(c.freshness||.7),reliability:Number(c.reliability||.7)})),...objective.map((e,i)=>({nodeId:`security:${i}`,type:'source-receipt',quality:1,freshness:1,reliability:1,event:e}))],edges:[]},risk:Number(risk?.risk||risk?.score||input.semanticSecurityRisk||0),sourceNeed:rr?1:rawRows.length?0.5:0,multiIntent:Array.isArray(input.analysis?.materialIntents)&&input.analysis.materialIntents.length>1?1:0,stateVersion:Number(input.stateVersion||1),modelReleaseId:String(input.modelReleaseId||input.analysis?.neuralUnderstandingReceipt?.model||'')})
 return Object.freeze({version:QL7_NATIVE_INTELLIGENCE_PLANE_VERSION,read,evidencePack,security:Object.freeze({frames:securityFrames,readPlans:securityReadPlans,risk,action:securityAction,receipt:securityReceipt,ladder,assetDecision}),modality,safeProjection:projectQl7SafeUserData(input.personalProjection||null),cognitiveState})
}
export function auditQl7NativeKnowledgeSchemas(){const source=createQl7SourceDescriptor({sourceId:'self',approved:true}),entity=createQl7KnowledgeEntity({entityId:'self',canonicalName:'QL7'}),claim=createQl7KnowledgeClaim({claimId:'self',entityId:'self',proposition:'schema proof',sourceRefs:['self']}),freshness=evaluateQl7ClaimFreshness(claim),snapshot=createQl7KnowledgeSnapshotManifest({snapshotId:'self',sourceRegistryHash:source.sourceHash,claimCount:1,entityCount:1,signed:false});return Object.freeze({ok:Boolean(source.sourceHash&&entity.entityHash&&claim.claimHash&&freshness.usable&&snapshot.snapshotHash)})}
