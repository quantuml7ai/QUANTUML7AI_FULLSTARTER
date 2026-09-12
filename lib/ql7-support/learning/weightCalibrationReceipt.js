import crypto from 'node:crypto'
export const QL7_SUPPORT_WEIGHT_CALIBRATION_RECEIPT_VERSION='5.1.0'
const required=['featureId','candidateFamily','trainingDatasetHash','calibrationDatasetHash','frozenAcceptanceHash','objectiveBefore','objectiveAfter','packageHash']
export function buildQl7WeightCalibrationReceipt(seed={}){const body={schema:'ql7.support.weight-calibration-receipt',schemaVersion:QL7_SUPPORT_WEIGHT_CALIBRATION_RECEIPT_VERSION,receiptId:String(seed.receiptId||`weight:${Date.now()}`),featureId:String(seed.featureId||''),candidateFamily:String(seed.candidateFamily||''),localeScope:String(seed.localeScope||'*'),domainScope:String(seed.domainScope||'*'),oldWeight:Number(seed.oldWeight||0),proposedWeight:Number(seed.proposedWeight||0),weightBounds:Object.freeze([...(seed.weightBounds||[-2,2])]),monotonicConstraint:String(seed.monotonicConstraint||'none'),trainingDatasetHash:String(seed.trainingDatasetHash||''),calibrationDatasetHash:String(seed.calibrationDatasetHash||''),frozenAcceptanceHash:String(seed.frozenAcceptanceHash||''),objectiveBefore:Number(seed.objectiveBefore||0),objectiveAfter:Number(seed.objectiveAfter||0),perMetricDelta:Object.freeze({...seed.perMetricDelta}),confidenceInterval:Object.freeze({...seed.confidenceInterval}),ablationDelta:Number(seed.ablationDelta||0),counterfactualDelta:Number(seed.counterfactualDelta||0),failureClustersFixed:Object.freeze([...(seed.failureClustersFixed||[])]),regressionsIntroduced:Object.freeze([...(seed.regressionsIntroduced||[])]),humanApprovalReceiptIds:Object.freeze([...(seed.humanApprovalReceiptIds||[])]),packageHash:String(seed.packageHash||'')};
const failures=[];
for(const k of required)if(body[k]===''||body[k]===null)failures.push(`missing:${k}`);
if(body.objectiveAfter>=body.objectiveBefore)failures.push('objective_not_improved');
if(body.regressionsIntroduced.length)failures.push('regressions_introduced');
if(body.humanApprovalReceiptIds.length<1)failures.push('approval_missing');
const receiptHash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
return Object.freeze({...body,ok:!failures.length,failures:Object.freeze(failures),receiptHash})}
