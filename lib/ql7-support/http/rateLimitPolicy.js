import crypto from 'node:crypto'
const str=(v)=>String(v??'').trim(); const h=(v)=>crypto.createHash('sha256').update(str(v)).digest('hex')
export const QL7_SUPPORT_RATE_LIMIT_VERSION='5.1.0'
const memory=new Map()
export async function evaluateQl7SupportRateLimit({database=null,actorId='',routeId='',ipHash='',limit=30,windowMs=60_000,now=Date.now()}={}){
 const at=Number(now)||Date.now(), key=h(`${str(actorId)}:${str(routeId)}:${str(ipHash)}`), cutoff=at-Math.max(1000,Number(windowMs)||60000)
 let count=0
 if(database?.collection){
  const c=database.collection('ql7_support_rate_limits'); const expiresAt=new Date(at+Math.max(1000,Number(windowMs)||60000)*2)
  await c.createIndex({expiresAt:1},{expireAfterSeconds:0,name:'ttl_support_rate_limit'}).catch(()=>null)
  const row=await c.findOneAndUpdate({_id:key},[{$set:{events:{$filter:{input:{$concatArrays:[{$ifNull:['$events',[]]},[at]]},as:'t',cond:{$gte:['$$t',cutoff]}}},routeId:str(routeId),actorIdHash:h(actorId),expiresAt}}],{upsert:true,returnDocument:'after'})
  count=Array.isArray(row?.events)?row.events.length:Array.isArray(row?.value?.events)?row.value.events.length:1
 }else{
  const list=(memory.get(key)||[]).filter((t)=>t>=cutoff); list.push(at); memory.set(key,list); count=list.length
 }
 const allowed=count<=Math.max(1,Number(limit)||30), retryAfterMs=allowed?0:Math.max(1,windowMs-(at-cutoff))
 const body={schema:'ql7.support.rate-limit-receipt',schemaVersion:QL7_SUPPORT_RATE_LIMIT_VERSION,keyHash:key,routeId:str(routeId),count,limit:Number(limit),windowMs:Number(windowMs),allowed,retryAfterMs}
 return Object.freeze({...body,receiptHash:h(JSON.stringify(body)),status:allowed?200:429,error:allowed?'':'support_rate_limited'})
}
