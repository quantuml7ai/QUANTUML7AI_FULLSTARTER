import crypto from 'node:crypto'

export const QL7_SUPPORT_OUTCOME_CALIBRATION_ORACLE_VERSION='5.2.2'
const hash=(value)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
export function evaluateQl7SupportOutcomeCalibrationIndependent(receipt={},aggregate={}){
  const failures=[]
  if(receipt?.schema!=='ql7.support.outcome-calibration-receipt')failures.push('receipt_schema')
  if(receipt?.automaticProductionPromotion!==false)failures.push('automatic_promotion')
  if(receipt?.selfConfirmationForbidden!==true)failures.push('self_confirmation')
  if(receipt?.requiresHumanApproval!==true)failures.push('human_approval')
  if(receipt?.trustedGroundTruth===true&&receipt?.objectiveVerified!==true)failures.push('unverified_ground_truth')
  if(aggregate?.promotionEligible!==false)failures.push('aggregate_auto_promotion')
  const mean=Number(aggregate?.posterior?.mean)
  if(!Number.isFinite(mean)||mean<0||mean>1)failures.push('posterior_mean')
  return Object.freeze({schema:'ql7.support.outcome-calibration-independent-oracle',schemaVersion:QL7_SUPPORT_OUTCOME_CALIBRATION_ORACLE_VERSION,ok:failures.length===0,failures,hash:hash({receipt:receipt?.receiptHash||'',mean,failures})})
}
