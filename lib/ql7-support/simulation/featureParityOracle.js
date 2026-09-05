import crypto from 'node:crypto'
export const QL7_FEATURE_PARITY_ORACLE_VERSION='5.1.0-independent'
function has(value,path){let cur=value;for(const key of String(path||'').split('.').filter(Boolean)){if(cur==null||!Object.prototype.hasOwnProperty.call(cur,key))return false;cur=cur[key]}return cur!==undefined}
const REQUIRED_BY_KIND=Object.freeze({
 table:['evidence.surface.tables'],badge:['evidence.surface.badges'],action:['evidence.surface'],delivery:['evidence.deliveryReceipt'],memory:['evidence.memoryAfter'],scope:['evidence.scopeReceipt'],semanticPlan:['evidence.semanticPlan'],operator:['evidence.operatorCase'],quality:['evidence.qualityGate'],composer:['evidence.composerPolicy'],event:['evidence.stateEvents'],
})
export function evaluateFeatureParityIndependent({capability={},run={},productionProbe=null}={}){
 const failures=[];if(!String(capability.capabilityId||''))failures.push('capability_id_missing');if(!String(capability.productionOwner||''))failures.push('production_owner_missing');if(!String(capability.scenarioFamily||''))failures.push('scenario_family_missing');if(!capability.oracleIds?.length)failures.push('oracle_mapping_missing');
 for(const path of REQUIRED_BY_KIND[capability.kind]||[])if(!has(run,path))failures.push(`evidence_missing:${path}`)
 if(['runtime','policy'].includes(capability.proofMode)&&productionProbe?.ok!==true)failures.push(`production_probe_failed:${productionProbe?.error||productionProbe?.decision||'missing'}`)
 if(capability.proofMode==='runtime'&&productionProbe?.executedBy!=='executeQl7SupportScenario->executeQl7SupportProductionTurn')failures.push('runtime_production_path_not_proven')
 const body={oracle:'feature-parity-independent',version:QL7_FEATURE_PARITY_ORACLE_VERSION,capabilityId:capability.capabilityId,ok:!failures.length,failures};return Object.freeze({...body,receiptHash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')})
}
