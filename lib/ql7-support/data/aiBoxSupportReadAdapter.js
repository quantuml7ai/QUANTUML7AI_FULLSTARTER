import crypto from 'node:crypto'
import {analyzeAiBoxMarket} from '../../exchange/aiBoxAnalysisService.js'

export const QL7_SUPPORT_AI_BOX_READ_ADAPTER_VERSION='5.2.2'
const sha=(value)=>crypto.createHash('sha256').update(String(value??'')).digest('hex')
const safe=(value,max=80)=>String(value??'').trim().slice(0,max)

export async function readQl7SupportAiBoxAnalysis({analysis={},actor={},deps={},now=new Date()}={}){
  const market=analysis?.marketSignals||{}
  const symbol=safe(market.symbol||analysis?.entities?.ticker||analysis?.entities?.symbol||'BTCUSDT',32).toUpperCase()
  const tf=safe(market.timeframe||analysis?.entities?.timeframe||'5m',8)
  const requestKind=market.wantsPrice===true&&market.wantsAi!==true?'price_lookup':'analysis'
  const startedAt=new Date(now).toISOString()
  const result=await analyzeAiBoxMarket({symbol,tf},{fetchMultiVenuePack:deps.fetchMultiVenuePack,brain:deps.brain})
  const projection={
    requestKind,symbol:result.symbol,tf:result.tf,price:result.data?.price??result.globalSpot??null,
    action:result.data?.action||'HOLD',confidence:Number(result.data?.confidence||0),mode:result.data?.engine?.mode||'observe',
    riskScore:Number(result.data?.engine?.risk?.riskScore||0),venueSpread:result.venueSpread??null,
    htfTrend:Number(result.htf?.trend||0),htfRoc:Number(result.htf?.roc||0),
    support:Array.isArray(result.data?.support)?result.data.support.slice(0,8):[],
    resistance:Array.isArray(result.data?.resistance)?result.data.resistance.slice(0,8):[],
    horizons:result.data?.horizons&&typeof result.data.horizons==='object'?result.data.horizons:{},
    reasons:Array.isArray(result.data?.reasons)?result.data.reasons.slice(0,12):[],
    sourceOwnerId:result.ownerId,disclaimerId:result.disclaimerId,
  }
  const body={
    schema:'ql7.support.adapter-receipt',schemaVersion:QL7_SUPPORT_AI_BOX_READ_ADAPTER_VERSION,
    id:`adapter:aibox:${sha(`${actor?.id||actor?.userId||'actor'}:${result.symbol}:${result.tf}:${startedAt}`).slice(0,32)}`,
    adapter:'exchange_ai',source:'quantum.exchange.ai-box-analysis',executed:true,readOnly:true,writeCount:0,resultKind:'verified',
    result:projection,checkedAt:startedAt,sourceReceiptId:`ai-box:${sha(JSON.stringify({requestKind,symbol:result.symbol,tf:result.tf,action:projection.action,confidence:projection.confidence,price:projection.price,htf:result.htf}))}`,
  }
  return Object.freeze({...body,receiptHash:sha(JSON.stringify(body))})
}
