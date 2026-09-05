import crypto from 'node:crypto'
export const QL7_TOPIC_MEMORY_ORACLE_VERSION='5.1.1-independent'
function str(v){return String(v??'').trim()}
function frame(graph={},id=''){return graph?.topicFrames?.[id]||null}
function includesValue(rows=[],value=''){const target=str(value);return (Array.isArray(rows)?rows:[]).some((row)=>str(typeof row==='string'?row:row?.id||row?.value||row?.text||JSON.stringify(row)).includes(target))}
export function evaluateTopicMemoryIndependent({before={},after={},expected={}}={}){
 const failures=[]
 const activeId=str(after.activeTopicFrameId)
 const active=frame(after,activeId)
 const activeDomain=str(active?.domainId)
 if(expected.activeTopic&&![activeId,activeDomain].includes(str(expected.activeTopic)))failures.push('wrong_active_topic')
 for(const correction of expected.preservedCorrections||[]){
  const inGraph=includesValue(after.userCorrections,correction)||Object.values(after.topicFrames||{}).some((f)=>includesValue(f?.userCorrections,correction))
  if(!inGraph)failures.push(`lost_correction:${str(correction)}`)
 }
 for(const rejected of expected.rejectedHypotheses||[]){
  const preserved=includesValue(after.rejectedHypotheses,rejected)||Object.values(after.topicFrames||{}).some((f)=>includesValue(f?.rejectedHypotheses,rejected))
  if(expected.mustRemainRejected!==false&&!preserved)failures.push(`lost_rejected_hypothesis:${str(rejected)}`)
  if(active&&expected.rejectedMustNotBeActive===true&&[active.domainId,active.microtopicId,active.materialIntent].some((v)=>str(v)===str(rejected)))failures.push(`reintroduced_rejected_hypothesis:${str(rejected)}`)
 }
 if(expected.minMemoryVersion!==undefined&&Number(after.memoryVersion||0)<Number(expected.minMemoryVersion))failures.push('memory_version_regression')
 if(Number(after.memoryVersion||0)<Number(before.memoryVersion||0))failures.push('memory_version_regression_before_after')
 if(expected.returnPoint){const rp=active?.exactReturnPoint&&typeof active.exactReturnPoint==='object'?active.exactReturnPoint:null;const got=str(rp?.pendingActionId||rp?.openQuestionId||rp?.propositionId||active?.expectedNextAction||active?.lastStableSummary||after.returnPoint);if(got!==str(expected.returnPoint))failures.push('wrong_return_point')}
 if(activeId&&!active)failures.push('active_frame_missing')
 const suspended=(after.suspendedTopicFrameIds||[]).filter((id)=>!frame(after,id));if(suspended.length)failures.push('suspended_frame_missing')
 const body={oracle:'topic-memory-independent',version:QL7_TOPIC_MEMORY_ORACLE_VERSION,ok:!failures.length,failures,activeTopicFrameId:activeId,activeDomain,beforeVersion:Number(before.memoryVersion||0),afterVersion:Number(after.memoryVersion||0)}
 return Object.freeze({...body,receiptHash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')})
}
