import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_OPERATOR_EVIDENCE_AGGREGATION_VERSION='5.4.0'
const clean=(value='')=>ql7Str(value).replace(/(?:seed|private\s*key|password|token|secret|парол[ья]?|приватн(?:ый|ий)\s*ключ)\s*[:=]\s*\S+/giu,'[REDACTED]').slice(0,1200)
const safeRows=(rows=[])=>Object.freeze(ql7Arr(rows).slice(0,80).map((row)=>Object.freeze({
  source:clean(row?.adapter||row?.source||row?.sourceType),resultKind:clean(row?.resultKind),checkedAt:clean(row?.checkedAt),readOnly:Number(row?.writeCount||0)===0,verified:row?.verified===true,
})))

export function buildQl7SupportRussianEvidenceAggregation({analysis={},checks=[],timeline=[],rating={},geo={},activity={}}={}){
 const decision=analysis?.decisionMathReceipt||{}
 const crisis=analysis?.safety?.crisisAssessment||analysis?.crisisAssessment||{}
 const ai=checks.find((row)=>String(row?.adapter||row?.source||'').includes('exchange_ai'))?.result||{}
 const verified=safeRows(checks).filter((row)=>row.verified)
 const unavailable=safeRows(checks).filter((row)=>!row.verified)
 const body={
  schema:'ql7.support.operator-evidence-aggregation',schemaVersion:QL7_SUPPORT_OPERATOR_EVIDENCE_AGGREGATION_VERSION,
  sections:Object.freeze({
   identity:Object.freeze({topic:clean(analysis.topic),subtopic:clean(analysis.subtopic||analysis.subIntent),locale:clean(analysis.locale||analysis.language)}),
   nativeIntelligence:Object.freeze({modelReleaseId:clean(analysis?.modelReceipt?.releaseId||analysis?.nativeUnderstanding?.modelReceipt?.releaseId),modelReceiptHash:clean(analysis?.modelReceipt?.receiptHash||analysis?.nativeUnderstanding?.modelReceipt?.receiptHash),cognitiveStateHash:clean(analysis?.cognitiveState?.stateHash),beliefStateHash:clean(analysis?.cognitiveState?.beliefState?.beliefHash),evidenceGraphHash:clean(analysis?.cognitiveState?.evidenceGraph?.graphHash),planGraphHash:clean(analysis?.cognitiveState?.planGraph?.planHash),knowledgeEvidencePackHash:clean(analysis?.knowledgeEvidencePack?.evidencePackHash),hiddenReasoningLogged:false}),
   semanticDecision:Object.freeze({intent:clean(analysis.messageAct||analysis.role),confidence:Number(analysis.confidence||0),margin:Number(decision?.posteriorMetrics?.margin??analysis.confidenceMargin??0),entropy:Number(decision?.posteriorMetrics?.normalizedEntropy??analysis.semanticEntropy??0),evidenceCoverage:Number(decision?.evidenceMetrics?.evidenceCoverage??0),counterEvidenceCoverage:Number(decision?.evidenceMetrics?.counterEvidenceCoverage??0),expectedLoss:Number(decision?.expectedLoss||0),policyEligible:decision?.policyEligibility?.sideEffectEligible===true}),
   safety:Object.freeze({category:clean(analysis.safetyCategory||analysis?.safety?.category),severity:clean(analysis?.safety?.severity),selfHarm:analysis?.safety?.selfHarm===true,threat:analysis?.safety?.threat===true,crisisDecision:clean(crisis?.decision),crisisProbability:Number(crisis?.classification?.topProbability||0),operatorRequired:analysis?.safety?.operatorRequired===true}),
   verifiedChecks:verified,
   unavailableChecks:unavailable,
   aiBox:Object.freeze({present:Boolean(ai?.symbol||ai?.aiBoxAnalysis),symbol:clean(ai?.symbol),timeframe:clean(ai?.timeframe||ai?.tf),action:clean(ai?.action),confidence:Number(ai?.confidence||0),riskScore:Number(ai?.riskScore||0),checkedAt:clean(ai?.checkedAt)}),
   rating:Object.freeze({value:Number(rating?.score??rating?.value??0),confidence:Number(rating?.confidence||0),band:clean(rating?.band||rating?.level)}),
   geography:Object.freeze({country:clean(geo?.country),region:clean(geo?.region),city:clean(geo?.city),source:clean(geo?.source),checkedAt:clean(geo?.asOf)}),
   activity:Object.freeze({posts:Number(activity?.posts||0),topics:Number(activity?.topics||0),comments:Number(activity?.comments||0),followers:Number(activity?.followers||0),following:Number(activity?.following||0),moderationFlags:Number(activity?.moderationFlags||0)}),
   timeline:Object.freeze(ql7Arr(timeline).slice(-50).map((row)=>clean(typeof row==='string'?row:(row?.summary||row?.event||row?.type||''))).filter(Boolean)),
  }),
  fieldsSeparated:true,rawMongoDumpIncluded:false,secretsIncluded:false,
 }
 return Object.freeze({...body,receiptHash:ql7StableHash(JSON.stringify(body))})
}
