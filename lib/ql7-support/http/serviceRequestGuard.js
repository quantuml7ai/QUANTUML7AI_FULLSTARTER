import crypto from 'node:crypto'
import {commitQl7SupportIdempotency, reserveQl7SupportIdempotency} from './idempotencyStore.js'
const str=(v)=>String(v??'').trim()
const sha=(v)=>crypto.createHash('sha256').update(str(v)).digest('hex')
function safeEq(a,b){const x=Buffer.from(str(a)),y=Buffer.from(str(b));return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y)}
export const QL7_SUPPORT_SERVICE_REQUEST_GUARD_VERSION='5.1.0'
export async function guardQl7SupportServiceRequest({req,database,serviceId,allowedKeyIds=[],secrets=[],nonce='',expiresAt='',payload=null,clock=Date.now}={}){
 const keyId=str(req?.headers?.get?.('x-ql7-support-key-id'))
 const token=str(req?.headers?.get?.('x-ql7-support-worker-token')||req?.headers?.get?.('x-ql7-support-service-token')||str(req?.headers?.get?.('authorization')).replace(/^bearer\s+/i,''))
 const normalizedKeys=new Set((allowedKeyIds||[]).map(str).filter(Boolean));if(!keyId||!normalizedKeys.has(keyId)){const e=new Error('support_service_key_id_rejected');e.status=401;throw e}
 const matched=(secrets||[]).map(str).filter(Boolean).some(s=>safeEq(token,s));if(!matched){const e=new Error('support_service_token_rejected');e.status=401;throw e}
 const now=Number(clock())||Date.now(),exp=Date.parse(str(expiresAt));if(!str(nonce)||!Number.isFinite(exp)||exp<now-30_000||exp>now+5*60_000){const e=new Error('support_service_nonce_or_expiry_invalid');e.status=400;throw e}
 const payloadHash=sha(JSON.stringify(payload??null)), keyHash=sha(`${serviceId}:${keyId}:${nonce}`)
 const idem=await reserveQl7SupportIdempotency({database,keyHash,payloadHash,ttlMs:10*60_000,now})
 const body={schema:'ql7.support.service-request-receipt',schemaVersion:QL7_SUPPORT_SERVICE_REQUEST_GUARD_VERSION,serviceId:str(serviceId),keyId,nonceHash:sha(nonce),expiresAt:new Date(exp).toISOString(),payloadHash,keyHash,replay:idem.replay===true}
 return Object.freeze({...body,receiptHash:sha(JSON.stringify(body)),idempotency:idem,commit:(result)=>commitQl7SupportIdempotency({database,keyHash,result})})
}
