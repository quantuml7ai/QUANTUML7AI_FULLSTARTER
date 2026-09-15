import crypto from 'node:crypto'
const str=(v)=>String(v??'').trim()
const hash=(v)=>crypto.createHash('sha256').update(str(v)).digest('hex')
export const QL7_SUPPORT_ORIGIN_POLICY_VERSION='5.1.0'
function originOf(value=''){try{return new URL(str(value)).origin}catch{return''}}
export function evaluateQl7SupportOriginPolicy({req=null,allowedOrigins=[],allowMissingForNonBrowser=false}={}){
 const origin=originOf(req?.headers?.get?.('origin'))
 const host=str(req?.headers?.get?.('x-forwarded-host')||req?.headers?.get?.('host')).split(',')[0].trim()
 const proto=str(req?.headers?.get?.('x-forwarded-proto')||'https').split(',')[0].trim()
 const inferred=host?`${proto||'https'}://${host}`:''
 const permitted=new Set((allowedOrigins||[]).map(originOf).filter(Boolean)); if(inferred)permitted.add(originOf(inferred))
 const fetchSite=str(req?.headers?.get?.('sec-fetch-site')).toLowerCase()
 const browser=Boolean(origin||fetchSite)
 const allowed=!browser&&allowMissingForNonBrowser ? true : Boolean(origin && permitted.has(origin) && (!fetchSite||['same-origin','same-site','none'].includes(fetchSite)))
 const body={schema:'ql7.support.origin-policy-receipt',schemaVersion:QL7_SUPPORT_ORIGIN_POLICY_VERSION,originHash:origin?hash(origin):'',hostHash:host?hash(host):'',fetchSite,browser,decision:allowed?'allow':'reject'}
 return Object.freeze({...body,receiptHash:hash(JSON.stringify(body)),allowed,status:allowed?200:403,error:allowed?'':'support_origin_rejected'})
}
