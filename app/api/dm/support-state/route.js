import crypto from 'node:crypto'
import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import serverSecret from '../../../../lib/security/ql7-server-secret.cjs'
import { resolveQl7VerifiedActor } from '../../../../lib/ql7-support/identityResolver.js'
import { getQl7SupportRuntimeStateForUser } from '../../../../lib/ql7-support/server.js'
import { buildQl7SupportStateReceipt } from '../../../../lib/ql7-support/runtime/stateReceipt.js'
export const dynamic='force-dynamic';export const revalidate=0;export const fetchCache='force-no-store'
const str=(v)=>String(v??'').trim();const json=(data,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store, max-age=0'}})
async function signingMaterial(){
 const explicit=str(process.env.QL7_SUPPORT_STATE_SIGNING_KEY||process.env.SESSION_SECRET||process.env.QL7_SUPPORT_CHOICE_SECRET)
 if(explicit)return{key:Buffer.from(explicit),keyId:`state-key:env:${crypto.createHash('sha256').update(explicit).digest('hex').slice(0,16)}`}
 let derived
 try{derived=await serverSecret.deriveForumRuntimeSecret('ql7-support-runtime-state:v5.1')}
 catch(error){if(error?.code!=='QL7_FORUM_RUNTIME_SECRET_NOT_SEEDED')throw error;await serverSecret.ensureForumRuntimeSecret();derived=await serverSecret.deriveForumRuntimeSecret('ql7-support-runtime-state:v5.1')}
 return{key:derived.key,keyId:`state-key:server-runtime:v${Number(derived.rotationVersion||1)}`}
}
export async function GET(req){
 if(!isQl7SupportActive())return json(ql7SupportDisabledPayload(),404)
 try{const handle=await mongoClient.getMongoDb();const database=handle?.db&&typeof handle.db.collection==='function'?handle.db:handle;const actor=await resolveQl7VerifiedActor({req,body:{},database});if(!actor?.valid||!actor?.canonicalAccountId)return json({ok:false,error:actor?.failureCode||'verified_session_required'},401)
  const {searchParams}=new URL(req.url),correlationId=str(searchParams.get('correlationId'));const state=await getQl7SupportRuntimeStateForUser({userId:actor.canonicalAccountId,correlationId});const serverNow=new Date().toISOString();const material=await signingMaterial()
  const projection=state?{state:str(state.state||'idle'),stateVersion:Number(state.stateVersion||state.sequence||state.history?.at?.(-1)?.sequence||0),caseId:str(state.caseId),correlationId:str(state.correlationId),detailCode:str(state.detailCode),changedAt:str(state.changedAt),expired:state.expired===true,inputPolicy:state.inputPolicy&&typeof state.inputPolicy==='object'?state.inputPolicy:null,history:Array.isArray(state.history)?state.history.slice(-64).map(event=>({eventId:str(event?.eventId),sequence:Number(event?.sequence||0),state:str(event?.state||'idle'),detailCode:str(event?.detailCode),caseId:str(event?.caseId),correlationId:str(event?.correlationId),changedAt:str(event?.changedAt),finalMessageId:str(event?.finalMessageId),surfaceHash:str(event?.surfaceHash),inputPolicy:event?.inputPolicy&&typeof event.inputPolicy==='object'?event.inputPolicy:null})):[]}:null
  const stateReceipt=buildQl7SupportStateReceipt({actorId:actor.canonicalAccountId,state:projection,serverNow,signingKey:material.key,keyId:material.keyId});return json({ok:true,serverNow,state:projection,stateReceipt})
 }catch(error){console.error('[QL7_SUPPORT_STATE_FAILED]',str(error?.message).slice(0,160));return json({ok:false,error:'ql7_support_state_unavailable'},503)}
}
