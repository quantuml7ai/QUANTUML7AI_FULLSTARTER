import crypto from 'node:crypto'
export const QL7_COGNITIVE_BELIEF_STATE_VERSION='1.0.0'
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0))
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
const safeExp=x=>Math.exp(Math.max(-60,Math.min(60,x)))
export function buildQl7BeliefState({hypotheses=[],temperature=1,deterministicEvidence={},memoryEvidence={},ontologyEvidence={},sourceEvidence={},counterEvidence={}}={}){
 const rows=(Array.isArray(hypotheses)?hypotheses:[]).map((h,i)=>{const modelLogit=Number.isFinite(Number(h.logit))?Number(h.logit):Math.log(Math.max(1e-8,Number(h.probability??h.confidence??0.0001)));const s=modelLogit/Math.max(.05,Number(temperature)||1)+Number(deterministicEvidence[h.id??h.topicId]||0)+Number(memoryEvidence[h.id??h.topicId]||0)+Number(ontologyEvidence[h.id??h.topicId]||0)+Number(sourceEvidence[h.id??h.topicId]||0)-Number(counterEvidence[h.id??h.topicId]||0);return{...h,hypothesisId:String(h.id??h.topicId??h.candidateId??`h${i}`),logScore:s}})
 if(!rows.some(x=>x.hypothesisId==='UNKNOWN'))rows.push({hypothesisId:'UNKNOWN',logScore:-.35,unknown:true})
 const m=Math.max(...rows.map(x=>x.logScore)),z=rows.reduce((n,x)=>n+safeExp(x.logScore-m),0)||1
 const posterior=rows.map(x=>Object.freeze({...x,posterior:clamp(safeExp(x.logScore-m)/z)})).sort((a,b)=>b.posterior-a.posterior)
 const entropy=-posterior.reduce((n,x)=>x.posterior>0?n+x.posterior*Math.log(x.posterior):n,0);const maxEntropy=posterior.length>1?Math.log(posterior.length):1
 const body={schema:'ql7.support.cognitive-belief-state',schemaVersion:QL7_COGNITIVE_BELIEF_STATE_VERSION,posterior:Object.freeze(posterior),topHypothesis:posterior[0]?.hypothesisId||'UNKNOWN',topProbability:posterior[0]?.posterior||0,margin:Math.max(0,(posterior[0]?.posterior||0)-(posterior[1]?.posterior||0)),normalizedEntropy:clamp(entropy/maxEntropy),unknownProbability:posterior.find(x=>x.hypothesisId==='UNKNOWN')?.posterior||0}
 return Object.freeze({...body,beliefHash:hash(body)})
}
