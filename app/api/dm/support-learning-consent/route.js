import mongoClient from '../../../../lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { guardQl7SupportMutation } from '../../../../lib/ql7-support/http/requestGuard.js'
import { commitQl7SupportIdempotency } from '../../../../lib/ql7-support/http/idempotencyStore.js'
import { writeQl7SupportLearningConsent } from '../../../../lib/ql7-support/learning/consentReceipt.js'
import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
import { NextResponse } from 'next/server'
export const dynamic='force-dynamic'; export const revalidate=0; export const fetchCache='force-no-store'
const json=(data,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store, max-age=0'}})
export async function POST(req){
 if(!isQl7SupportActive())return json(ql7SupportDisabledPayload(),404)
 try{
  const body=await req.json().catch(()=>({})); const handle=await mongoClient.getMongoDb(); const database=handle?.db&&typeof handle.db.collection==='function'?handle.db:handle
  const actor=await resolveQl7VerifiedActor({req,body,database}); if(!actor?.valid||!actor?.canonicalAccountId)return json({ok:false,error:actor?.failureCode||'verified_session_required'},401)
  const decision=String(body?.decision||'').trim(); if(!['granted','refused'].includes(decision))return json({ok:false,error:'invalid_learning_consent_decision'},400)
  const operationId=String(body?.clientMutationId||`learning-consent:${decision}`)
  const guard=await guardQl7SupportMutation({req,database,actorId:actor.canonicalAccountId,routeId:'dm.support-learning-consent.post',operationId,payload:{decision,purpose:'quality_improvement'},rateLimit:10,rateWindowMs:60000})
  if(guard.idempotency.replay&&guard.idempotency.result)return json(guard.idempotency.result)
  const receipt=await writeQl7SupportLearningConsent({database,actorId:actor.canonicalAccountId,decision,purpose:'quality_improvement',source:'explicit_user_action'})
  const response={ok:true,decision:receipt.decision,receiptId:receipt.receiptId,requestGuardReceiptHash:guard.guardReceiptHash}
  await commitQl7SupportIdempotency({database,keyHash:guard.idempotencyKeyHash,result:response}); return json(response)
 }catch(error){return json({ok:false,error:String(error?.code||error?.message||'learning_consent_failed')},Number(error?.status||503))}
}
