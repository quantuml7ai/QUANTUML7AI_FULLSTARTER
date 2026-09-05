import {retrieveQl7HybridEvidence} from './retrieval/hybridRetriever.js'
import {getQl7GeneralHumanConcept, auditQl7GeneralHumanKnowledgeCore} from './generalHumanKnowledgeCore.js'
import {ql7StableHash, ql7Str} from '../internal/text.js'
import {classifyQl7SupportGeneralTopic, getQl7SupportGeneralKnowledgeNode} from './generalKnowledgeRegistry.js'
export const QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_ROUTER_VERSION='5.2.1'
export const QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_ROUTER_OWNER_ID='ql7-support.open-human-knowledge-router'
export function routeQl7SupportOpenHumanKnowledge({text='',locale='en',generalTopic=null,sourceReceipt=null}={}){
 const topic=generalTopic||classifyQl7SupportGeneralTopic(text,{locale});if(!topic)return null;const node=getQl7SupportGeneralKnowledgeNode(topic.nodeId);const currentSensitive=topic.currentSensitive===true||topic.publicFigure?.currentSourceRequired===true
 const sourceRequirement=currentSensitive?'fresh-approved-public-source':topic.openSubject?'approved-open-subject-source':node?'curated-stable-receipt':'approved-open-subject-source'
 const sourceVerified=Boolean(sourceReceipt?.receiptId&&(sourceReceipt?.verified===true||sourceReceipt?.status==='verified'))
 const body={schema:'ql7.support.open-human-knowledge-route',schemaVersion:QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_ROUTER_VERSION,ownerId:QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_ROUTER_OWNER_ID,locale:ql7Str(locale),topicId:ql7Str(topic.nodeId),category:ql7Str(topic.category),openSubject:topic.openSubject===true,currentSensitive,sourceRequirement,stableContextAllowed:true,sourceReceiptId:ql7Str(sourceReceipt?.receiptId),sourceVerified,currentClaimAllowed:!currentSensitive||sourceVerified,abstainOnMissingCurrentSource:currentSensitive&&!sourceVerified,readyToSend:false,finalText:false}
 const receiptHash=ql7StableHash(JSON.stringify(body));return Object.freeze({...body,receiptId:`open-human-route:${receiptHash}`,receiptHash})
}

export const QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_SCHEMA_VERSION='5.3.0'
export function resolveQl7OpenHumanConcept({topicFamilyId='open_subject',facetId='overview',currentSensitive=false,sourceReceipt=null}={}){const concept=topicFamilyId==='open_subject'?null:getQl7GeneralHumanConcept(topicFamilyId,facetId);const needsFresh=currentSensitive===true||concept?.currentSensitive===true;const verified=sourceReceipt?.verified===true||sourceReceipt?.status==='verified';return Object.freeze({schema:'ql7.support.open-human-concept-resolution',schemaVersion:QL7_SUPPORT_OPEN_HUMAN_KNOWLEDGE_SCHEMA_VERSION,topicFamilyId,facetId,conceptId:concept?.conceptId||`open-subject:${facetId}`,openSubject:topicFamilyId==='open_subject',sourceRequired:needsFresh||topicFamilyId==='open_subject',freshSourceRequired:needsFresh,sourceState:verified?'verified':sourceReceipt?'unverified':'not_executed',answerCurrentClaimAllowed:needsFresh?verified:false,stableSemanticContextAllowed:Boolean(concept)||topicFamilyId==='open_subject',readyToSend:false,finalText:false})}
export function auditQl7OpenHumanKnowledge(){const core=auditQl7GeneralHumanKnowledgeCore(),probe=resolveQl7OpenHumanConcept({topicFamilyId:'open_subject',facetId:'overview'}),failures=[];if(!core.ok)failures.push('general_core');if(!probe.openSubject||!probe.sourceRequired)failures.push('open_subject_source_route');return Object.freeze({ok:!failures.length,core,probe,failures:Object.freeze(failures)})}

export function retrieveQl7OpenHumanEvidence({text='',claimRows=[],snapshotId='',limit=24}={}){return retrieveQl7HybridEvidence({query:String(text||''),rows:Array.isArray(claimRows)?claimRows:[],snapshotId,limit})}
