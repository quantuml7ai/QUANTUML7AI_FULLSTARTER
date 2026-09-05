import crypto from 'node:crypto'
export const QL7_COGNITIVE_EVIDENCE_GRAPH_VERSION='1.0.0'
const TYPES=new Set(['claim','entity','event','quote','actor','target','action','time','source-receipt','model-hypothesis','deterministic-signal','memory-fact'])
const EDGES=new Set(['SUPPORTS','CONTRADICTS','COREFERS','TEMPORALLY_PRECEDES','DERIVED_FROM','REQUIRES'])
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export function createQl7EvidenceGraph({nodes=[],edges=[]}={}){
 const cleanNodes=(Array.isArray(nodes)?nodes:[]).map((n,i)=>Object.freeze({nodeId:String(n.nodeId||`n${i}`),type:TYPES.has(n.type)?n.type:'claim',quality:Math.max(0,Math.min(1,Number(n.quality??1))),freshness:Math.max(0,Math.min(1,Number(n.freshness??1))),reliability:Math.max(0,Math.min(1,Number(n.reliability??1))),...n}))
 const ids=new Set(cleanNodes.map(n=>n.nodeId));const cleanEdges=(Array.isArray(edges)?edges:[]).filter(e=>ids.has(String(e.from))&&ids.has(String(e.to))&&EDGES.has(String(e.type))).map(e=>Object.freeze({...e,from:String(e.from),to:String(e.to),weight:Number(e.weight??1)}))
 const byId=new Map(cleanNodes.map(n=>[n.nodeId,n]));const mass=(claimId,type)=>cleanEdges.filter(e=>e.to===claimId&&e.type===type).reduce((sum,e)=>{const n=byId.get(e.from);return sum+Math.max(0,Number(e.weight)||0)*(n?.quality??1)*(n?.freshness??1)*(n?.reliability??1)},0)
 const claims=cleanNodes.filter(n=>n.type==='claim'||n.type==='model-hypothesis').map(n=>Object.freeze({nodeId:n.nodeId,supportMass:mass(n.nodeId,'SUPPORTS'),contradictionMass:mass(n.nodeId,'CONTRADICTS')}))
 const body={schema:'ql7.support.cognitive-evidence-graph',schemaVersion:QL7_COGNITIVE_EVIDENCE_GRAPH_VERSION,nodes:Object.freeze(cleanNodes),edges:Object.freeze(cleanEdges),claimMass:Object.freeze(claims)}
 return Object.freeze({...body,evidenceGraphHash:h(body)})
}
export function findQl7MaterialContradictions(graph={}){return Object.freeze((graph.claimMass||[]).filter(x=>x.contradictionMass>0&&x.contradictionMass>=x.supportMass*.35))}
