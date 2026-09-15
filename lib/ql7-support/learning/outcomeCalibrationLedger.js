import crypto from 'node:crypto'

export const QL7_SUPPORT_OUTCOME_CALIBRATION_VERSION='5.2.2'
export const QL7_SUPPORT_OUTCOME_CALIBRATION_COLLECTION='ql7_support_outcome_calibration'
const sha=(value)=>crypto.createHash('sha256').update(String(value??'')).digest('hex')
const clamp01=(value)=>Math.max(0,Math.min(1,Number(value)||0))
const str=(value)=>String(value??'').trim()

const SIGNALS=Object.freeze({
  helpful:Object.freeze({direction:'positive',weight:.35,groundTruth:false}),
  resolved:Object.freeze({direction:'positive',weight:.50,groundTruth:false}),
  clicked_action:Object.freeze({direction:'neutral',weight:.10,groundTruth:false}),
  preferred_brief:Object.freeze({direction:'neutral',weight:.10,groundTruth:false}),
  preferred_detail:Object.freeze({direction:'neutral',weight:.10,groundTruth:false}),
  not_helpful:Object.freeze({direction:'negative',weight:.45,groundTruth:false}),
  corrected_system:Object.freeze({direction:'negative',weight:.80,groundTruth:false}),
  action_failed:Object.freeze({direction:'negative',weight:.70,groundTruth:false}),
})

function posteriorFromEvidence({positive=0,negative=0}={}){
  const alpha=2+Math.max(0,Number(positive)||0)
  const beta=2+Math.max(0,Number(negative)||0)
  const mean=alpha/(alpha+beta)
  const variance=(alpha*beta)/(((alpha+beta)**2)*(alpha+beta+1))
  return Object.freeze({alpha,beta,mean:Number(mean.toFixed(8)),standardDeviation:Number(Math.sqrt(variance).toFixed(8))})
}

export function buildQl7SupportOutcomeCalibrationReceipt({
  actorId='',turnId='',deliveryReceiptId='',outcomeType='',topic='',locale='en',
  decisionMathReceipt=null,objectiveReceipt=null,userExplicit=true,createdAt=new Date().toISOString(),
}={}){
  const signal=SIGNALS[str(outcomeType)]||Object.freeze({direction:'neutral',weight:0,groundTruth:false})
  const objectiveVerified=objectiveReceipt?.verified===true&&Boolean(objectiveReceipt?.receiptHash||objectiveReceipt?.id)
  const weight=objectiveVerified?1:signal.weight
  const direction=objectiveVerified?(objectiveReceipt?.outcomeCorrect===true?'positive':objectiveReceipt?.outcomeCorrect===false?'negative':signal.direction):signal.direction
  const evidence=posteriorFromEvidence({positive:direction==='positive'?weight:0,negative:direction==='negative'?weight:0})
  const modelTop=Number(decisionMathReceipt?.posteriorMetrics?.topProbability||0)
  const observedCorrectness=direction==='positive'?1:direction==='negative'?0:null
  const calibrationError=observedCorrectness===null?null:Number(Math.abs(clamp01(modelTop)-observedCorrectness).toFixed(8))
  const body={
    schema:'ql7.support.outcome-calibration-receipt',schemaVersion:QL7_SUPPORT_OUTCOME_CALIBRATION_VERSION,
    actorIdHash:sha(actorId).slice(0,32),turnIdHash:sha(turnId).slice(0,32),deliveryReceiptId:str(deliveryReceiptId),
    outcomeType:str(outcomeType),topic:str(topic),locale:str(locale).toLowerCase().split(/[-_]/u)[0],
    evidenceDirection:direction,evidenceWeight:weight,userExplicit:userExplicit===true,objectiveVerified,
    trustedGroundTruth:objectiveVerified,modelTopProbability:modelTop,observedCorrectness,calibrationError,
    posterior:evidence,automaticProductionPromotion:false,selfConfirmationForbidden:true,
    requiresAggregateQuorum:true,requiresHumanApproval:true,createdAtServerUtc:new Date(createdAt).toISOString(),
  }
  return Object.freeze({...body,receiptHash:sha(JSON.stringify(body))})
}

export async function recordQl7SupportOutcomeCalibration({database,...input}={}){
  const receipt=buildQl7SupportOutcomeCalibrationReceipt(input)
  if(database?.collection){
    const id=`outcome-calibration:${receipt.receiptHash}`
    await database.collection(QL7_SUPPORT_OUTCOME_CALIBRATION_COLLECTION).updateOne({_id:id},{$setOnInsert:{...receipt,_id:id}},{upsert:true})
    return Object.freeze({...receipt,receiptId:id})
  }
  return receipt
}

export function aggregateQl7SupportOutcomeCalibration(receipts=[]){
  let positive=0,negative=0,neutral=0,objective=0
  const locales=new Set(),topics=new Set(),actors=new Set()
  for(const row of Array.isArray(receipts)?receipts:[]){
    const weight=Math.max(0,Number(row?.evidenceWeight)||0)
    if(row?.evidenceDirection==='positive')positive+=weight
    else if(row?.evidenceDirection==='negative')negative+=weight
    else neutral+=weight
    if(row?.objectiveVerified===true)objective+=1
    if(row?.locale)locales.add(row.locale);if(row?.topic)topics.add(row.topic);if(row?.actorIdHash)actors.add(row.actorIdHash)
  }
  const posterior=posteriorFromEvidence({positive,negative})
  return Object.freeze({
    schema:'ql7.support.outcome-calibration-aggregate',schemaVersion:QL7_SUPPORT_OUTCOME_CALIBRATION_VERSION,
    sampleCount:(receipts||[]).length,weightedPositive:positive,weightedNegative:negative,weightedNeutral:neutral,
    objectiveReceiptCount:objective,independentActors:actors.size,locales:locales.size,topics:topics.size,posterior,
    promotionEligible:false,reason:'candidate_evidence_only_requires_governance_quorum_human_approval_frozen_gates',
  })
}
