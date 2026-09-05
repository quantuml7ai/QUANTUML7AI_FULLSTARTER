import {createQl7SupportAdapterReceipt} from './adapterReceipt.js'
import {ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_SIMULATION_FIXTURES_VERSION='13.0.0'
const FACTUAL=new Set(['qcoin','payments','vip','ads_packages','ads_campaigns','battlecoin','profile','forum_threads','telegram','academy_exam','wallet'])
export function buildQl7SupportSimulationReceipts({topic='',pairIndex=0,actorId='synthetic-user',available=true}={}){
  const key=ql7Str(topic)
  if(!FACTUAL.has(key)) return Object.freeze([])
  if(!available) return Object.freeze([createQl7SupportAdapterReceipt({executed:true,verified:false,source:`simulation.fixture.${key}`,scope:'synthetic_actor_read',result:{fixture:true,status:'unavailable',branch:'source_unavailable'},error:'source_unavailable',writeCount:0,durationMs:0})])
  const result={fixture:true,actorMasked:ql7Str(actorId),pairIndex:Number(pairIndex),status:'healthy',branch:`${key}_fixture_ok`,asOf:'2026-01-01T00:00:00.000Z'}
  if(key==='qcoin')result.balance=`${((pairIndex%100000)+1)/100}`
  else if(key==='vip'){result.active=pairIndex%2===0;result.state=result.active?'active':'inactive'}
  else if(key==='payments'){result.paymentStatus=pairIndex%3===0?'pending':'completed'}
  else result.value=(pairIndex%1000)+1
  return Object.freeze([createQl7SupportAdapterReceipt({executed:true,verified:true,source:`simulation.fixture.${key}`,scope:'synthetic_actor_read',result,checkedAt:'2026-01-01T00:00:00.000Z',writeCount:0,durationMs:0})])
}
