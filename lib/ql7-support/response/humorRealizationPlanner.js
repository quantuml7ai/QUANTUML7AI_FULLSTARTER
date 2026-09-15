import {getQl7SupportHumorLexicon} from '../knowledge/humorLexiconBank.js'
import {QL7_SUPPORT_HUMOR_ANECDOTE_FRAMES} from '../knowledge/humorAnecdoteFrameBank.js'
export const QL7_SUPPORT_HUMOR_REALIZATION_PLANNER_VERSION='5.3.1'
const clean=v=>String(v||'').replace(/\s+/gu,' ').trim()
const ORDERS=Object.freeze([
 [0,1,2,3,4],[0,1,3,2,4],[0,2,1,3,4],[0,2,3,1,4],[0,3,1,2,4],
 [0,3,2,1,4],[1,0,2,3,4],[1,0,3,2,4],[1,2,0,3,4],[1,2,3,0,4],
 [1,3,0,2,4],[1,3,2,0,4],[2,0,1,3,4],[2,0,3,1,4],[2,1,0,3,4],
 [2,1,3,0,4],[2,3,0,1,4],[2,3,1,0,4],[3,0,1,2,4],[3,1,2,0,4]
])
function decode(index,sizes){let n=index;const out=[];for(const size of sizes){out.push(n%size);n=Math.floor(n/size)}return out}
function punctuate(parts,frameId){const p=parts.map(clean).filter(Boolean);switch(frameId){
 case 'mini-dialogue': return `${p[0]} — ${p[1]}. ${p[2]} — ${p[3]}. ${p[4]}.`
 case 'riddle-safe': return `${p[0]}? ${p[1]}; ${p[2]}. ${p[3]} — ${p[4]}.`
 case 'three-beat-escalation': return `${p[0]}, ${p[1]}, ${p[2]} — ${p[3]}; ${p[4]}.`
 case 'expectation-flip': return `${p[0]}: ${p[1]}. ${p[2]} — ${p[3]}; ${p[4]}.`
 case 'understatement': return `${p[0]} — ${p[1]}; ${p[2]}. ${p[3]}, ${p[4]}.`
 case 'overstatement': return `${p[0]}! ${p[1]}; ${p[2]} — ${p[3]}. ${p[4]}.`
 default: return `${p[0]} — ${p[1]}; ${p[2]}, ${p[3]}. ${p[4]}.`
 }}
export function buildQl7SupportHumorRealization({locale='en',index=0,topic='',memoryCallback=''}={}){
 const l=getQl7SupportHumorLexicon(locale);if(!l)throw new Error(`humor_locale_unsupported:${locale}`)
 const i=Math.max(0,Number(index)||0),sizes=[l.subjects.length,l.relations.length,l.moves.length,l.clarifiers.length,l.closers.length,ORDERS.length,QL7_SUPPORT_HUMOR_ANECDOTE_FRAMES.length]
 const capacity=sizes.reduce((a,b)=>a*b,1);if(i>=capacity)throw new Error(`humor_index_out_of_capacity:${i}/${capacity}`)
 const [ia,ib,ic,id,ie,io,iframe]=decode(i,sizes),frame=QL7_SUPPORT_HUMOR_ANECDOTE_FRAMES[iframe],mechanism=l.mechanisms[io%l.mechanisms.length]
 const raw=[l.subjects[ia],l.relations[ib],l.moves[ic],l.clarifiers[id],l.closers[ie]],ordered=ORDERS[io].map(n=>raw[n])
 let text=punctuate(ordered,frame.id);if(topic)text=`${clean(topic)}: ${text}`;if(memoryCallback)text=`${text} ${clean(memoryCallback)}`
 const semanticId=`humor:${locale}:${frame.id}:${mechanism}:${ia}:${ib}:${ic}:${id}:${ie}:${io}`
 return Object.freeze({schema:'ql7.support.humor-realization',schemaVersion:QL7_SUPPORT_HUMOR_REALIZATION_PLANNER_VERSION,locale,semanticId,frameId:frame.id,mechanismId:mechanism,text,readyToSend:false,requiresFinalHumanQualityGate:true,sourceProfileLocale:l.sourceProfileLocale,externalLocalizationRequired:false,materialVariation:Object.freeze({subject:ia,relation:ib,move:ic,clarifier:id,closer:ie,structure:io,frame:iframe})})
}
export function auditQl7SupportHumorPlanner(locale='en'){const l=getQl7SupportHumorLexicon(locale);if(!l)return Object.freeze({ok:false,capacity:0,failures:['unsupported_locale']});const capacity=l.subjects.length*l.relations.length*l.moves.length*l.clarifiers.length*l.closers.length*ORDERS.length*QL7_SUPPORT_HUMOR_ANECDOTE_FRAMES.length;return Object.freeze({ok:capacity>=10600,capacity,visibleIndexToken:false,mechanismChangesWordOrder:true,requiresFinalHumanQualityGate:true,failures:Object.freeze(capacity>=10600?[]:[`capacity:${capacity}`])})}
