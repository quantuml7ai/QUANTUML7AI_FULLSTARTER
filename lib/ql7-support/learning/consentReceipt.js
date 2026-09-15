import crypto from 'node:crypto'
const str=(v)=>String(v??'').trim()
const hash=(v)=>crypto.createHash('sha256').update(String(v??'')).digest('hex')
export const QL7_SUPPORT_LEARNING_CONSENT_COLLECTION='ql7_support_learning_consent'
export async function writeQl7SupportLearningConsent({database,actorId='',decision='refused',purpose='quality_improvement',source='explicit_user_action',now=new Date().toISOString()}={}){
 if(!database?.collection||!str(actorId))throw new Error('learning_consent_store_unavailable')
 const normalized=decision==='granted'?'granted':'refused',actorIdHash=hash(actorId),body={schema:'ql7.support.learning-consent-receipt',schemaVersion:'5.1.0',actorIdHash,purpose:str(purpose),decision:normalized,source:str(source),createdAtServerUtc:str(now)}
 const receiptHash=hash(JSON.stringify(body)),receipt={...body,receiptId:`learning-consent:${receiptHash}`,receiptHash}
 await database.collection(QL7_SUPPORT_LEARNING_CONSENT_COLLECTION).updateOne({_id:`${actorIdHash}:${body.purpose}`},{$set:{...receipt,_id:`${actorIdHash}:${body.purpose}`,updatedAt:new Date()}},{upsert:true})
 return Object.freeze(receipt)
}
export async function readQl7SupportLearningConsent({database,actorId='',purpose='quality_improvement'}={}){
 if(!database?.collection||!str(actorId))return Object.freeze({granted:false,decision:'unknown',receipt:null})
 const row=await database.collection(QL7_SUPPORT_LEARNING_CONSENT_COLLECTION).findOne({_id:`${hash(actorId)}:${str(purpose)}`})
 return Object.freeze({granted:row?.decision==='granted',decision:str(row?.decision||'unknown'),receipt:row?Object.freeze({...row}):null})
}
