import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { guardQl7SupportMutation } from '../../../../lib/ql7-support/http/requestGuard.js'
import { commitQl7SupportIdempotency } from '../../../../lib/ql7-support/http/idempotencyStore.js'
import { authorizeQl7SupportBroadcastRequest, runQl7SupportBroadcastToEcosystem } from '../../../../lib/ql7-support/broadcast.js'
import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
export const dynamic='force-dynamic';export const revalidate=0;export const fetchCache='force-no-store'
const str=(v)=>String(v??'').trim(); const json=(v,s=200)=>NextResponse.json(v,{status:s,headers:{'cache-control':'no-store, max-age=0'}})
export async function POST(req){
 if(!isQl7SupportActive())return json(ql7SupportDisabledPayload(),404)
 try{
  const body=await req.json().catch(()=>({}));const handle=await mongoClient.getMongoDb();const database=handle?.db&&typeof handle.db.collection==='function'?handle.db:handle
  const actor=await resolveQl7VerifiedActor({req,body,database});if(!actor?.valid||!actor?.canonicalAccountId)return json({ok:false,error:actor?.failureCode||'verified_session_required'},401)
  const keyId=str(req.headers.get('x-ql7-support-key-id')||body?.keyId),token=str(req.headers.get('x-ql7-support-broadcast-token')||body?.token),nonce=str(req.headers.get('x-ql7-support-nonce')||body?.nonce),expiresAt=Date.parse(str(req.headers.get('x-ql7-support-expires-at')||body?.expiresAt))
  if(!nonce)return json({ok:false,error:'broadcast_nonce_required'},400);if(!Number.isFinite(expiresAt)||expiresAt<Date.now()-30_000||expiresAt>Date.now()+5*60_000)return json({ok:false,error:'broadcast_expiry_invalid'},403)
  authorizeQl7SupportBroadcastRequest({fromUserId:actor.canonicalAccountId,rawFromIds:actor.aliases||[],token,keyId})
  const message=str(body?.message);if(!message)return json({ok:false,error:'broadcast_message_required'},400)
  const guard=await guardQl7SupportMutation({req,database,actorId:actor.canonicalAccountId,routeId:'dm.support-broadcast.post',operationId:nonce,payload:{message,eventType:body?.eventType,broadcastId:body?.broadcastId,keyId,expiresAt},rateLimit:4,rateWindowMs:60000})
  if(guard.idempotency.replay&&guard.idempotency.result)return json(guard.idempotency.result)
  const result=await runQl7SupportBroadcastToEcosystem({fromUserId:actor.canonicalAccountId,rawFromIds:actor.aliases||[],message,locale:str(body?.locale),eventType:body?.eventType==='critical_security'?'critical_security':'broadcast',broadcastId:str(body?.broadcastId),concurrency:Number(body?.concurrency||5),push:body?.push!==false})
  const response={ok:true,broadcastId:result.id,totalRecipients:result.totalRecipients,sent:result.sent,failed:result.failed,keyId,requestGuardReceiptHash:guard.guardReceiptHash}
  await commitQl7SupportIdempotency({database,keyHash:guard.idempotencyKeyHash,result:response});return json(response)
 }catch(error){return json({ok:false,error:str(error?.code||error?.message||'broadcast_failed')},Number(error?.status||503))}
}
