import crypto from 'node:crypto'
import {attributeQl7SupportFeatures} from './featureAttribution.js'
import {buildQl7SupportWeightProposal} from './weightProposal.js'
import {optimizeQl7SupportWithinConstraints} from './constraintOptimizer.js'
import {evaluateQl7SupportAblation} from './ablationEvaluator.js'
import {evaluateQl7SupportCounterfactualPairs} from './counterfactualEvaluator.js'
import {measureQl7SupportDrift} from './driftMonitor.js'
import {buildQl7WeightCalibrationReceipt} from './weightCalibrationReceipt.js'
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v??null)).digest('hex')
export const QL7_SUPPORT_SCIENTIFIC_LEARNING_GOVERNANCE_VERSION='5.1.0'
export const QL7_SUPPORT_SCIENTIFIC_PROMOTION_STAGES=Object.freeze(['offline_evaluation','shadow','canary','manual_approval','rollback_ready'])
export function evaluateQl7SupportScientificLearningGovernance({owner='ql7-support',features=[],baselineScore=0,candidateScore=0,weightChanges=[],evidenceIds=[],constraints={},ablation={},counterfactualPairs=[],drift={},weightCalibration={}}={}){
 const attribution=attributeQl7SupportFeatures({features,baselineScore,candidateScore})
 const proposal=buildQl7SupportWeightProposal({owner,changes:weightChanges,evidenceIds,reason:'bounded_calibration_proposal'})
 const optimizedProposal=optimizeQl7SupportWithinConstraints({proposal,constraints:{maxDelta:0.25,...constraints}})
 const ablationReceipt=evaluateQl7SupportAblation(ablation)
 const counterfactualReceipt=evaluateQl7SupportCounterfactualPairs(counterfactualPairs)
 const driftReceipt=measureQl7SupportDrift(drift)
 const weightCalibrationReceipt=Object.keys(weightCalibration||{}).length?buildQl7WeightCalibrationReceipt(weightCalibration):null
 const hardFailures=[]
 if(weightChanges.length&&!ablationReceipt.causalSupport)hardFailures.push('ablation_causal_support_missing')
 if(!counterfactualReceipt.ok)hardFailures.push('counterfactual_inconsistency')
 if(driftReceipt.autoPromotionAllowed!==false)hardFailures.push('autonomous_promotion_forbidden')
 if(weightCalibrationReceipt&&weightCalibrationReceipt.ok!==true)hardFailures.push('weight_calibration_receipt_invalid')
 const promotionLifecycle=Object.freeze({stages:QL7_SUPPORT_SCIENTIFIC_PROMOTION_STAGES,shadowRequired:true,canaryRequired:true,rollbackRequired:true,manualApprovalRequired:true,autonomousPromotion:false})
 const body={schema:'ql7.support.scientific-learning-governance',schemaVersion:QL7_SUPPORT_SCIENTIFIC_LEARNING_GOVERNANCE_VERSION,attribution,optimizedProposal,ablation:ablationReceipt,counterfactual:counterfactualReceipt,drift:driftReceipt,weightCalibrationReceipt,promotionLifecycle,hardFailures:Object.freeze(hardFailures),requiresHumanApproval:true,autonomousPromotion:false,ok:hardFailures.length===0}
 return Object.freeze({...body,receiptHash:hash(body)})
}
