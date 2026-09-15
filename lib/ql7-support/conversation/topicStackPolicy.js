export const QL7_SUPPORT_TOPIC_STACK_POLICY_VERSION='5.1.0'
export const QL7_SUPPORT_TOPIC_STACK_LIMITS=Object.freeze({suspended:32,nestedDepth:8})
export function applyQl7SupportTopicStackPolicy({frames={},activeTopicFrameId='',suspendedTopicFrameIds=[],candidateFrameId='',transitionType=''}={}){const failures=[];
let suspended=[...(suspendedTopicFrameIds||[])].filter((id)=>frames[id]);
if(suspended.length>QL7_SUPPORT_TOPIC_STACK_LIMITS.suspended){suspended=suspended.slice(-QL7_SUPPORT_TOPIC_STACK_LIMITS.suspended)}let depth=0,cursor=candidateFrameId&&frames[candidateFrameId];
const seen=new Set();
while(cursor?.parentTopicFrameId){if(seen.has(cursor.topicFrameId)){failures.push('topic_parent_cycle');
break}seen.add(cursor.topicFrameId);
depth+=1;
cursor=frames[cursor.parentTopicFrameId];
if(depth>QL7_SUPPORT_TOPIC_STACK_LIMITS.nestedDepth){failures.push('nested_depth_exceeded');
break}}const resume=String(transitionType).startsWith('resume_by_');
if(resume&&candidateFrameId&&!suspended.includes(candidateFrameId)&&candidateFrameId!==activeTopicFrameId)failures.push('resume_target_not_suspended_or_active');
return Object.freeze({ok:!failures.length,suspendedTopicFrameIds:Object.freeze(suspended),depth,failures:Object.freeze(failures)})}
