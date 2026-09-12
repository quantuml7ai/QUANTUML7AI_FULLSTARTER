import * as Brain from '../brain.js'
import { fetchMultiVenuePack, TF_KEYS } from '../databroker.js'

export const QL7_AI_BOX_ANALYSIS_SERVICE_VERSION = '5.2.2'
export const QL7_AI_BOX_ANALYSIS_SERVICE_OWNER_ID = 'quantum.exchange.ai-box-analysis.v5.2'

const ALLOWED_TF = new Set(TF_KEYS || ['1m','5m','15m','1h','4h','1d'])
const HTF_MAP = Object.freeze({
  '1m': Object.freeze(['5m','15m']),
  '5m': Object.freeze(['15m','1h']),
  '15m': Object.freeze(['1h','4h']),
  '1h': Object.freeze(['4h','1d']),
  '4h': Object.freeze(['1d']),
  '1d': Object.freeze([]),
})
const clamp = (x,a,b) => Math.max(a,Math.min(b,x))
const finite = (value,fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const safeSymbol = (value='BTCUSDT') => String(value || 'BTCUSDT').toUpperCase().replace(/[^A-Z0-9:_-]/g,'').slice(0,32) || 'BTCUSDT'

function brainCall(pack, brain = Brain) {
  const call = brain.analyzeTF || brain.analyze || brain.default
  if (typeof call !== 'function') return null
  return call(pack) || null
}

export function evaluateAiBoxSignalEngine({ symbol='', tf='5m', core={}, htfAnalysed=[], venueSpread=null }={}) {
  const baseAction = String(core?.action || 'HOLD').toUpperCase()
  const baseConfidence = finite(core?.confidence,50)
  const diagnostics = core?.diagnostics || {}
  const totalScore = finite(diagnostics.totalScore ?? diagnostics.trendScore,0)
  const atrRel = finite(diagnostics.atrRel ?? diagnostics.atr,0)
  const htfPerTF=[];const dirs=[]
  for(const h of Array.isArray(htfAnalysed)?htfAnalysed:[]){
    const result=h?.result||{};const d=result?.diagnostics||{};const score=finite(d.totalScore??d.trendScore,0)
    let dir=result.action==='BUY'?1:result.action==='SELL'?-1:score>=3?.7:score<=-3?-.7:0
    if(dir)dirs.push(dir)
    htfPerTF.push(Object.freeze({tf:String(h?.tf||''),action:String(result.action||'HOLD'),totalScore:score,dir}))
  }
  const htfAvgDir=dirs.length?dirs.reduce((s,x)=>s+x,0)/dirs.length:0
  const spreadAbs=Number.isFinite(Number(venueSpread))?Math.abs(Number(venueSpread)):0
  const highSpread=spreadAbs>.03,elevatedSpread=spreadAbs>.015,weakSignal=Math.abs(totalScore)<3
  let mode='observe',finalAction=baseAction,finalConfidence=baseConfidence
  if(baseAction==='HOLD'||baseConfidence<55){finalAction='HOLD'}else{
    const against=(baseAction==='BUY'&&htfAvgDir<=-.5)||(baseAction==='SELL'&&htfAvgDir>=.5)
    const spreadKill=highSpread||(elevatedSpread&&atrRel<.02)
    if((against&&Math.abs(totalScore)<4.2)||(spreadKill&&Math.abs(totalScore)<5)){finalAction='HOLD'}else mode='trade'
  }
  let adjustment=0
  const withTrend=(finalAction==='BUY'&&htfAvgDir>.6)||(finalAction==='SELL'&&htfAvgDir<-.6)
  if(mode==='trade'&&withTrend)adjustment+=5
  if(elevatedSpread)adjustment-=6
  if(highSpread)adjustment-=10
  if(mode==='trade'&&(weakSignal||atrRel<.01))adjustment-=5
  finalConfidence=clamp(baseConfidence+adjustment,50,98)
  if(mode==='observe'){finalAction='HOLD';finalConfidence=Math.min(finalConfidence,60)}
  const riskScore=clamp(
    35*(highSpread?1:elevatedSpread?.55:0)+
    30*(weakSignal?1:0)+
    20*(atrRel<.01?1:0)+
    15*((baseAction==='BUY'&&htfAvgDir<0)||(baseAction==='SELL'&&htfAvgDir>0)?1:0),0,100)
  return Object.freeze({
    version:'v2.2',symbol,tf,mode,baseAction,baseConfidence,finalAction,finalConfidence,
    htf:Object.freeze({avgDir:htfAvgDir,perTF:Object.freeze(htfPerTF)}),
    risk:Object.freeze({venueSpread:spreadAbs,atrRel,totalScore,riskScore}),
  })
}

export async function analyzeAiBoxMarket(params={},deps={}){
  const fetchPack=deps.fetchMultiVenuePack||fetchMultiVenuePack
  const brain=deps.brain||Brain
  const symbol=safeSymbol(params.symbol)
  const tfRaw=String(params.tf||'5m');const tf=ALLOWED_TF.has(tfRaw)?tfRaw:'5m'
  const limitRaw=finite(params.limitMain??params.limit,750);const limitMain=Math.max(100,Math.min(1000,Math.trunc(limitRaw)))
  const primary=String(params.primary||'BINANCE').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24)||'BINANCE'
  const mainPack=await fetchPack(symbol,tf,{limitMain,limitOthers:200,primary})
  const higherTFs=HTF_MAP[tf]||[];const htfPacks=[]
  const fetched=await Promise.allSettled(higherTFs.map(async(higherTf)=>({tf:higherTf,pack:await fetchPack(symbol,higherTf,{limitMain:Math.min(limitMain,400),limitOthers:120,primary})})))
  for(const row of fetched)if(row.status==='fulfilled'&&row.value?.pack?.c?.length)htfPacks.push(row.value)
  const htfAnalysed=htfPacks.map(({tf:higherTf,pack})=>{
    try{return Object.freeze({tf:higherTf,result:brainCall({...pack,tf:higherTf,symbol,extras:pack.extras||{}},brain)})}
    catch{return Object.freeze({tf:higherTf,result:null})}
  })
  const dirs=[],rocs=[]
  for(const h of htfAnalysed){const r=h.result||{},d=r.diagnostics||{},score=finite(d.totalScore??d.trendScore,0);let dir=r.action==='BUY'?1:r.action==='SELL'?-1:score>=3?.7:score<=-3?-.7:0;if(dir)dirs.push(dir);if(Number.isFinite(score))rocs.push(clamp(score/10,-1,1))}
  const htfTrend=dirs.length?dirs.reduce((s,x)=>s+x,0)/dirs.length:0
  const htfRoc=rocs.length?rocs.reduce((s,x)=>s+x,0)/rocs.length:0
  const enrichedPack={...mainPack,tf,symbol,extras:{...(mainPack.extras||{}),htfTrend,htfRoc}}
  let core=brainCall(enrichedPack,brain)||brainCall(mainPack,brain)
  if(!core)core={action:'HOLD',confidence:50,price:mainPack?.c?.at?.(-1)||0,horizons:{'1h':0,'6h':0,'24h':0},support:[],resistance:[],reasons:[{key:'ai_no_data',params:{}}]}
  const venueSpread=enrichedPack?.extras?.venueSpread??null
  const engine=evaluateAiBoxSignalEngine({symbol,tf,core,htfAnalysed,venueSpread})
  const data=Object.freeze({...core,action:engine.finalAction,confidence:engine.finalConfidence,engine})
  return Object.freeze({
    ok:true,schema:'quantum.exchange.ai-box-analysis',schemaVersion:QL7_AI_BOX_ANALYSIS_SERVICE_VERSION,
    ownerId:QL7_AI_BOX_ANALYSIS_SERVICE_OWNER_ID,symbol,tf,limitMain,primary,data,
    venues:Object.freeze(enrichedPack?.extras?.venues||[]),globalSpot:enrichedPack?.extras?.globalSpot??null,venueSpread,
    htf:Object.freeze({trend:htfTrend,roc:htfRoc,tfs:Object.freeze(htfAnalysed.map(h=>Object.freeze({tf:h.tf,action:h.result?.action||null,confidence:h.result?.confidence??null,totalScore:h.result?.diagnostics?.totalScore??null})))}),
    disclaimerId:'analytics_not_financial_advice',readOnly:true,writeCount:0,
  })
}
