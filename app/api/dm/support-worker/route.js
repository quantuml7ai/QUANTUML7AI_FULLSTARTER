import { isQl7SupportActive, ql7SupportDisabledPayload } from '../../../../lib/ql7-support/config/featureFlag.js'
import { NextResponse } from 'next/server'
import mongoClient from '../../../../lib/mongo/client.cjs'
import { runQl7SupportScheduler, QL7_SUPPORT_SCHEDULER_JOB_IDS } from '@/lib/ql7-support/scheduler.js'
import { guardQl7SupportServiceRequest } from '@/lib/ql7-support/http/serviceRequestGuard.js'
export const dynamic='force-dynamic';export const revalidate=0;export const fetchCache='force-no-store'
const str=(v)=>String(v??'').trim()
export async function POST(req){
 if(!isQl7SupportActive())return NextResponse.json(ql7SupportDisabledPayload(),{status:404})
 try{
  const body=await req.json().catch(()=>({}));const handle=await mongoClient.getMongoDb();const database=handle?.db&&typeof handle.db.collection==='function'?handle.db:handle
  const jobs=Array.isArray(body.jobs)?body.jobs.map(str).filter(Boolean):QL7_SUPPORT_SCHEDULER_JOB_IDS;const invalid=jobs.filter(id=>!QL7_SUPPORT_SCHEDULER_JOB_IDS.includes(id));if(invalid.length)return NextResponse.json({ok:false,error:'worker_job_unregistered',jobs:invalid},{status:400})
  const guard=await guardQl7SupportServiceRequest({req,database,serviceId:'ql7-support-worker',allowedKeyIds:[str(process.env.QL7_SUPPORT_WORKER_KEY_ID)||'support-worker-primary'],secrets:[process.env.QL7_SUPPORT_WORKER_TOKEN,process.env.CRON_SECRET],nonce:body.nonce,expiresAt:body.expiresAt,payload:{jobs,maxItems:body.maxItems}})
  if(guard.idempotency.replay)return NextResponse.json({ok:true,replayed:true,result:guard.idempotency.result},{status:200})
  const maxItems=Math.max(1,Math.min(100,Number(body?.maxItems||25)));const result=await runQl7SupportScheduler({dryRun:false,jobs,workerId:`api:${process.pid}:${guard.keyId}`,emailMaxItems:maxItems,emailMaxAttempts:5,deliveryRecoveryMaxItems:maxItems})
  const output={ok:result?.ok!==false,result,workerReceiptHash:guard.receiptHash};await guard.commit(output)
  return NextResponse.json(output,{status:result?.ok===false?500:200,headers:{'cache-control':'no-store, max-age=0'}})
 }catch(error){
  const status=Number(error?.status||500)
  if(status===401)return NextResponse.json({ ok: false, error: 'worker_unauthorized' },{status:401})
  return NextResponse.json({ok:false,error:str(error?.message)||'worker_failed'},{status})
 }
}
