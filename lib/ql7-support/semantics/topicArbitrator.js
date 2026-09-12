import {sealQl7TopicDecisionReceipt} from './topicDecisionReceipt.js'
const SOCIAL=new Set(['greeting','wellbeing_question','gratitude','goodbye','small_talk'])
const META_COMMANDS=new Set(['topic_recall','topic_resume'])
const ECOSYSTEM=Object.freeze([
 ['qcoin',/(?:\bq\s*coin\b|\bqcoin\b|кью\s*коин|кукоин)/iu],['battlecoin',/(?:battle\s*coin|battlecoin)/iu],['forum_feed',/(?:\bforum\b|форум|топик|topic|thread|пост)/iu],['exchange_ai',/(?:exchange\s*ai|ai\s*box|бирж.*ai|exchange)/iu],['vip',/(?:\bvip\b|вип)/iu],['ads_packages',/(?:(?:ad|ads|advertising)\s+packages?|рекламн\p{L}*\s+пакет\p{L}*|пакет\p{L}*\s+реклам|广告套餐|חבילת\s+פרסום)/iu],['ads_campaigns',/(?:campaign|кампан|ctr|impressions?|метрик\p{L}*\s+реклам|广告活动|קמפיין\s+פרסום)/iu],['payments',/(?:payment|плат[её]ж|refund|возврат)/iu],['metamarket',/(?:metamarket|метамаркет)/iu]
])
const GENERAL=Object.freeze([
 ['football',/(?:football|soccer|футбол)/iu],['relationships',/(?:отношени|relationship|дружб|friendship)/iu],['astronomy',/(?:астроном|space|космос|звезд|planet)/iu],['physics',/(?:нейтрон|атом|physics|физик)/iu],['public_figures',/(?:кто\s+так(?:ой|ая)|who\s+is|biograph|биограф|аристотел|einstein|эйнштейн)/iu]
])
function candidate(topicId,score,evidence=[],memoryPriorContribution=0,counterEvidence=[]){return {topicId,currentLexicalEvidence:evidence,entityEvidence:[],ontologyEvidence:[],requestedActionEvidence:[],generalKnowledgeEvidence:[],switchEvidence:evidence.length?['current-turn-material']:[],continuationEvidence:memoryPriorContribution?['bounded-memory-prior']:[],memoryPriorContribution,counterEvidence,score,posterior:Math.max(0,Math.min(1,score))}}
export function arbitrateQl7SupportTopic({text='',messageAct='',previousActiveTopic='',ruleTopic='',generalTopic='',publicFigure=null,explicitTopic='',activeGoal=''}={}){
 const source=String(text||'').normalize('NFKC'),candidates=[];let explicit=String(explicitTopic||'').trim()
 const commandAct=String(messageAct||'')
 if(!explicit)for(const [id,re] of ECOSYSTEM)if(re.test(source)){explicit=id;break}
 let generalId=typeof generalTopic==='string'?generalTopic:String(generalTopic?.topicId||generalTopic?.category||'')
 if(publicFigure||/(?:кто\s+так(?:ой|ая)|who\s+is|биограф)/iu.test(source))generalId='public_figures'
 if(!generalId)for(const [id,re] of GENERAL)if(re.test(source)){generalId=id;break}
 const resumeTarget=explicit||generalId||(ruleTopic&&ruleTopic!=='support_system'&&ruleTopic!==previousActiveTopic?ruleTopic:'')
 if(commandAct==='topic_recall'){return sealQl7TopicDecisionReceipt({currentTurnHash:'runtime',previousActiveTopic,activeGoal,candidates:Object.freeze([Object.freeze(candidate('support_system',1,['meta-command:topic_recall'],0,previousActiveTopic?['stale-topic-not-route-authority']:[]))]),top1:'support_system',top2:'',margin:1,entropy:0,transitionClass:'topic_recall',selectedTopic:'support_system',rejectedTopics:Object.freeze(previousActiveTopic?[Object.freeze({id:previousActiveTopic,reason:'recalled-topic-is-content-not-active-route'})]:[]),clarificationRequired:false})}
 if(commandAct==='topic_resume'&&resumeTarget){
  return sealQl7TopicDecisionReceipt({currentTurnHash:'runtime',previousActiveTopic,activeGoal,candidates:Object.freeze([Object.freeze(candidate(resumeTarget,1,[`meta-command:topic_resume:${resumeTarget}`],previousActiveTopic===resumeTarget?.22:0))]),top1:resumeTarget,top2:'',margin:1,entropy:0,transitionClass:'return_to_previous',selectedTopic:resumeTarget,rejectedTopics:Object.freeze(previousActiveTopic&&previousActiveTopic!==resumeTarget?[Object.freeze({id:previousActiveTopic,reason:'explicit-resume-target-wins'})]:[]),clarificationRequired:false})
 }
 if(commandAct==='topic_resume'&&previousActiveTopic){return sealQl7TopicDecisionReceipt({currentTurnHash:'runtime',previousActiveTopic,activeGoal,candidates:Object.freeze([Object.freeze(candidate(previousActiveTopic,1,['meta-command:topic_resume'],.22))]),top1:previousActiveTopic,top2:'',margin:1,entropy:0,transitionClass:'return_to_previous',selectedTopic:previousActiveTopic,rejectedTopics:Object.freeze([]),clarificationRequired:false})}
 if(explicit)candidates.push(candidate(explicit,.995,[`explicit-domain:${explicit}`],0))
 if(generalId)candidates.push(candidate(generalId,.94,[`general:${generalId}`],0))
 const social=SOCIAL.has(String(messageAct||''))||/^(?:привет|hello|hi|здравств|как дела|спасибо|thanks)[!?.\s]*$/iu.test(source.trim())
 const memoryPrior=previousActiveTopic&&!social?.22:0
 const materialRule=Boolean(ruleTopic&&ruleTopic!=='support_system'&&(!previousActiveTopic||ruleTopic!==previousActiveTopic))
 if(materialRule&&!explicit)candidates.push(candidate(ruleTopic,.975,['rule-topic-current-turn'],0))
 else if(ruleTopic&&!explicit&&!generalId&&!social)candidates.push(candidate(ruleTopic,.62,['rule-topic'],0))
 if(previousActiveTopic&&memoryPrior)candidates.push(candidate(previousActiveTopic,.34,[],memoryPrior,['current-turn-evidence-required']))
 let selectedTopic='support_system',transitionClass='new_independent_question'
 if(social&&!explicit&&(!generalId||generalId==='open_subject')){selectedTopic='support_system';transitionClass='social_only'}
 else if(explicit){selectedTopic=explicit;transitionClass=previousActiveTopic&&previousActiveTopic!==explicit?'explicit_switch':'new_independent_question'}
 else if(materialRule){selectedTopic=ruleTopic;transitionClass=previousActiveTopic&&previousActiveTopic!==ruleTopic?'implicit_material_switch':'new_independent_question'}
 else if(generalId){selectedTopic=generalId;transitionClass=previousActiveTopic&&previousActiveTopic!==generalId?'implicit_material_switch':'new_independent_question'}
 else if(ruleTopic){selectedTopic=ruleTopic;transitionClass=previousActiveTopic===ruleTopic?'continuation':'implicit_material_switch'}
 else if(previousActiveTopic&&memoryPrior){selectedTopic=previousActiveTopic;transitionClass='elliptical_follow_up'}
 if(/(?:вернемся|вернёмся|return\s+to|назад\s+к)/iu.test(source)&&previousActiveTopic&&!explicit&&!generalId){selectedTopic=previousActiveTopic;transitionClass='return_to_previous'}
 candidates.sort((a,b)=>b.score-a.score);const top1=candidates[0]?.score||0,top2=candidates[1]?.score||0,margin=Math.max(0,top1-top2),p=candidates.map(x=>Math.max(.0001,x.score)),sum=p.reduce((a,b)=>a+b,0)||1,entropy=-p.reduce((a,x)=>{const q=x/sum;return a+q*Math.log(q)},0)
 return sealQl7TopicDecisionReceipt({currentTurnHash:'runtime',previousActiveTopic,activeGoal,candidates:Object.freeze(candidates.map(Object.freeze)),top1:top1?candidates[0]?.topicId:'',top2:candidates[1]?.topicId||'',margin,entropy,transitionClass,selectedTopic,rejectedTopics:Object.freeze(candidates.filter(x=>x.topicId!==selectedTopic).map(x=>Object.freeze({id:x.topicId,reason:'lower-current-turn-evidence'}))),clarificationRequired:Boolean(candidates.length>1&&margin<.08)})
}
export function auditQl7TopicArbitrator(){const seq=[['привет','greeting','exchange_ai','support_system'],['что такое нейтрон','how_to_question','exchange_ai','physics'],['кто такой Аристотель','small_talk','exchange_ai','public_figures'],['у меня проблема с qcoin','ambiguous_request','exchange_ai','qcoin']];const failures=[];for(const [text,act,prev,want] of seq){const r=arbitrateQl7SupportTopic({text,messageAct:act,previousActiveTopic:prev,ruleTopic:prev});if(r.selectedTopic!==want)failures.push(`${text}:${r.selectedTopic}:${want}`)}return Object.freeze({ok:!failures.length,cases:seq.length,failures:Object.freeze(failures)})}
