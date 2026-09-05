import {getQl7LiveProof,listQl7LiveProofs} from './liveProofRegistry.js'
import {runQl7SupportCapabilityProductionProbe} from '../capabilityProductionProbe.js'
import {ql7StableHash} from '../../internal/text.js'
export const QL7_SUPPORT_LIVE_PROOF_RUNNER_VERSION='ql7.live-proof-runner.1'
const clean=(v='')=>String(v||'').slice(0,512)
export async function runQl7LiveProof({proofId='',executeCapability=null,executeSpecial=null,index=0,environment='live'}={}){
 const proof=getQl7LiveProof(proofId);if(!proof)return Object.freeze({ok:false,state:'UNKNOWN_PROOF',proofId})
 const startedAt=new Date().toISOString();let result
 try{
  if(proof.capabilityId){let execution=null;if(typeof executeCapability==='function')execution=await executeCapability(proof);result=await runQl7SupportCapabilityProductionProbe({capabilityId:proof.capabilityId,index,execution,capability:execution?.capability||proof})}
  else if(typeof executeSpecial==='function')result=await executeSpecial(proof)
  else result={ok:false,state:'BLOCKED_DEPENDENCY',reason:'live_special_executor_required'}
 }catch(error){result={ok:false,state:'ERROR',reason:clean(error?.message||error)}}
 const body={schema:'ql7.support.live-proof-receipt',schemaVersion:QL7_SUPPORT_LIVE_PROOF_RUNNER_VERSION,proofId:proof.proofId,family:proof.family,risk:proof.risk,environment,startedAt,finishedAt:new Date().toISOString(),productionOwner:proof.productionOwner||'',productionEntry:proof.productionEntry||'',result}
 return Object.freeze({...body,ok:result?.ok===true,receiptHash:ql7StableHash(JSON.stringify(body))})
}
export async function runQl7LiveProofMatrix({family='',executeCapability=null,executeSpecial=null,environment='live',stopOnFailure=false}={}){const proofs=listQl7LiveProofs({family}),rows=[];for(let i=0;i<proofs.length;i++){const r=await runQl7LiveProof({proofId:proofs[i].proofId,executeCapability,executeSpecial,index:i,environment});rows.push(r);if(stopOnFailure&&!r.ok)break}const blocked=rows.filter(r=>r.result?.state==='BLOCKED_DEPENDENCY').length,failed=rows.filter(r=>!r.ok&&r.result?.state!=='BLOCKED_DEPENDENCY').length;const body={schema:'ql7.support.live-proof-matrix',schemaVersion:QL7_SUPPORT_LIVE_PROOF_RUNNER_VERSION,environment,total:rows.length,passed:rows.filter(r=>r.ok).length,blocked,failed,rows};return Object.freeze({...body,ok:failed===0&&blocked===0,matrixHash:ql7StableHash(JSON.stringify(body))})}
