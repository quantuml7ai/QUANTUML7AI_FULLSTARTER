import crypto from 'node:crypto'
import {evaluateQl7SupportOriginPolicy} from './originPolicy.js'
import {evaluateQl7SupportRateLimit} from './rateLimitPolicy.js'
import {buildQl7SupportIdempotencyKey, reserveQl7SupportIdempotency} from './idempotencyStore.js'
const str=(v)=>String(v??'').trim()
const h=(v)=>crypto.createHash('sha256').update(str(v)).digest('hex')
export async function guardQl7SupportMutation({req,database,actorId,routeId,operationId,payload,rateLimit=30,rateWindowMs=60_000,allowMissingOriginForNonBrowser=true}={}){
 const origin=evaluateQl7SupportOriginPolicy({req,allowMissingForNonBrowser:allowMissingOriginForNonBrowser})
 if(!origin.allowed){const e=new Error(origin.error);e.status=origin.status;e.receipt=origin;throw e}
 const forwarded=str(req?.headers?.get?.('x-forwarded-for')).split(',')[0].trim()
 const ipHash=forwarded?h(forwarded):''
 const rate=await evaluateQl7SupportRateLimit({database,actorId,routeId,ipHash,limit:rateLimit,windowMs:rateWindowMs})
 if(!rate.allowed){const e=new Error(rate.error);e.status=rate.status;e.receipt=rate;throw e}
 const idempotencyKeyHash=buildQl7SupportIdempotencyKey({actorId,routeId,operationId})
 const payloadHash=h(JSON.stringify(payload??null))
 const idempotency=await reserveQl7SupportIdempotency({database,keyHash:idempotencyKeyHash,payloadHash,actorIdHash:h(actorId)})
 return Object.freeze({origin,rate,idempotency,idempotencyKeyHash,payloadHash,originDecisionReceiptId:origin.receiptHash,rateLimitBucketId:rate.keyHash,receivedAtServerUtc:new Date().toISOString(),guardReceiptHash:h(JSON.stringify({origin:origin.receiptHash,rate:rate.receiptHash,idempotencyKeyHash,payloadHash}))})
}
