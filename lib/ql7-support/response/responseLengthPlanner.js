import {QL7_SUPPORT_REPLY_MAX_GRAPHEMES,getQl7SupportResponseProfile} from '../limits.js'
import {ql7StableHash,ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_RESPONSE_LENGTH_PLANNER_VERSION='1.0.0'
const MICRO=new Set(['greeting','entry_greeting','gratitude','farewell','conversation_close','yes_no_answer','acknowledgement'])
const INCIDENT=new Set(['incident_report','security_incident','fraud_report'])
const EDUCATIONAL=new Set(['general_knowledge_question','educational_question','academy_question','definition_question'])
const HOW_TO=new Set(['how_to_question','how_to','instruction_request'])
const POLICY=new Set(['policy_question','privacy_question','security_boundary'])
const BUSINESS=new Set(['business_proposal','partnership_request','investment_request'])

function requestedDepth(analysis={}){return ql7Str(analysis.requestedDetail||analysis.responseDepth||analysis.depthPreference).toLowerCase()}
function modeFor({analysis={},contentPlan={}}={}){
 const act=ql7Str(contentPlan.messageAct||analysis.messageAct)
 const topic=ql7Str(contentPlan.topic||analysis.topic)
 const depth=requestedDepth(analysis)
 if(depth==='extended'||depth==='deep'||depth==='long'||analysis.longFormRequested===true)return'long_form_explanation'
 if(contentPlan.safetyBoundary?.category&&contentPlan.safetyBoundary.category!=='none')return'safety_intervention'
 if(MICRO.has(act))return'micro_ack'
 if(contentPlan.choices||analysis.userClarificationRequired===true||act==='ambiguous_request'||act==='spam_or_noise')return'single_clarification'
 if(BUSINESS.has(act)||['partnership','investment','contact'].includes(topic))return'business_intake'
 if(INCIDENT.has(act)||(topic==='security'&&act==='incident_report'))return'incident_intake'
 if(POLICY.has(act)||['privacy','account_deletion'].includes(topic))return'policy_explanation'
 if(EDUCATIONAL.has(act)||['academy','academy_exam'].includes(topic)||contentPlan.generalTopic?.nodeId||contentPlan.academyKnowledgeReceipt?.resultKind==='verified')return'educational_overview'
 if(HOW_TO.has(act))return'guided_steps'
 if(/compare|comparison|difference|versus|vs/u.test(act))return'comparison'
 if(topic==='exchange_ai'||contentPlan.receipt?.adapter==='exchange_ai')return'diagnostic_result'
 if(['qcoin','vip','payments','ads_packages','ads_campaigns','wallet'].includes(topic)&&contentPlan.receipt)return'financial_status'
 if(contentPlan.receipt||contentPlan.surfaceKind==='structured')return'compact_fact'
 return'compact_fact'
}

export function planQl7SupportResponseLength({analysis={},contentPlan={}}={}){
 const mode=modeFor({analysis,contentPlan})
 const profile=getQl7SupportResponseProfile(mode)
 const requestedMax=Number(analysis.maxResponseGraphemes||contentPlan.maxGraphemes||0)
 const max=Math.max(1,Math.min(QL7_SUPPORT_REPLY_MAX_GRAPHEMES,requestedMax>0?Math.max(profile.max,requestedMax):profile.max))
 const preferred=Math.min(max,Math.max(1,Number(profile.preferred)||max))
 const body={schema:'ql7.support.response-length-plan',schemaVersion:QL7_SUPPORT_RESPONSE_LENGTH_PLANNER_VERSION,mode,minGuideline:Number(profile.min)||1,preferred,max,absoluteHardMax:QL7_SUPPORT_REPLY_MAX_GRAPHEMES,minimumIsNotForced:true,oneWordAllowed:true,adaptive:true,reasonCodes:Object.freeze([`act:${ql7Str(contentPlan.messageAct||analysis.messageAct)||'unknown'}`,`topic:${ql7Str(contentPlan.topic||analysis.topic)||'support_system'}`,`mode:${mode}`])}
 const planHash=ql7StableHash(JSON.stringify(body))
 return Object.freeze({...body,planHash})
}

export function getQl7SupportResponseLengthStats(){
 return Object.freeze({version:QL7_SUPPORT_RESPONSE_LENGTH_PLANNER_VERSION,minPossibleGraphemes:1,absoluteHardMaxGraphemes:QL7_SUPPORT_REPLY_MAX_GRAPHEMES,adaptive:true,oneWordAllowed:true,supportsRichDraftsUpTo4000:true,productionVisibleOutputBounded:true,allLocalesNative:true,providerLocaleSplit:false})
}
