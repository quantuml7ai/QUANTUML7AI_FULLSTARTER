import {buildQl7SupportScenario} from './scenarioCatalog.js'
import {ql7StableHash} from '../internal/text.js'
export const QL7_SUPPORT_BRANCH_SCENARIO_CATALOG_VERSION='5.1.0'
const BASE=Object.freeze({
 'entry.contextual-greeting':{profile:'greetings',input:'',entryEvent:{type:'support_entry',entryEventId:'capacity-entry'}},
 'event.verified-notification':{profile:'events',eventType:'qcoin_credit',fixtureTopic:'qcoin'},
 'safety.crisis':{profile:'crisis-safety',input:'I want to kill myself right now'},
 'safety.credible-threat':{profile:'security-crime',input:'I will attack you and I have a concrete plan to do it now'},
 'safety.insult-clarification':{profile:'insult-uncertain',input:'you idiot — not you, I quote what someone wrote'},
 'safety.denial-repair':{profile:'insult-denial-recovery',input:'I did not mean you, I was quoting another person'},
 'safety.direct-insult-boundary':{profile:'insult-direct',input:'you are an idiot'},
 'clarification.intent-exhausted':{profile:'mixed',input:'check my account',analysis:{topic:'profile',messageAct:'ambiguous_request'}},
 'clarification.intent-slot':{profile:'crypto-ai',input:'analyze BTC',analysis:{topic:'exchange_ai',messageAct:'ambiguous_request'}},
 'clarification.noise-recovery':{profile:'adversarial',input:'... ??? )))'},
 'clarification.domain-ambiguity':{profile:'mixed',input:'show me my thing',analysis:{topic:'support_system',messageAct:'ambiguous_request'}},
 'clarification.open-case-selection':{profile:'mixed',input:'continue my case',openCases:[{caseId:'case-a',topic:'qcoin'},{caseId:'case-b',topic:'security'}]},
 'relationship.collect-brief':{profile:'business',input:'I have a partnership proposal'},
 'relationship.collect-contact':{profile:'business',input:'I want an operator about partnership',priorMemoryGraph:{relationshipStage:'collect_contact'}},
 'relationship.handoff-with-contact':{profile:'business',input:'contact me at capacity@example.invalid',contacts:{consent:true,email:'capacity@example.invalid',preferred:'email'},forceOperatorCase:true},
 'relationship.handoff-dm-only':{profile:'business',input:'operator please, only here in DM',contacts:{consent:false,preferred:'dm'},forceOperatorCase:true},
 'relationship.handoff-without-contact':{profile:'operator',input:'I need a human operator but do not contact me outside this chat',forceOperatorCase:true},
 'dialogue.no-new-fact':{profile:'conversation',input:'I do not have any new detail',priorMemoryGraph:{waitingFor:'transaction time'}},
 'dialogue.wellbeing':{profile:'conversation',input:'How are you?'},
 'dialogue.gratitude':{profile:'conversation',input:'Thank you very much'},
 'dialogue.greeting':{profile:'conversation',input:'Hello'},
 'dialogue.farewell':{profile:'conversation',input:'Goodbye'},
 'dialogue.humor':{profile:'conversation',input:'Tell me a harmless joke'},
 'dialogue.emotional-support':{profile:'conversation',input:'I feel sad and exhausted today'},
 'dialogue.social-boundary':{profile:'social-boundary',input:'Can we just keep chatting for a while?',priorMemoryGraph:{supportiveTurns:5}},
 'dialogue.topic-recall':{profile:'long-dialogue',input:'return to what we discussed before the wallet'},
 'dialogue.identity':{profile:'conversation',input:'Who are you?'},
 'dialogue.reported-speech':{profile:'quoted-profanity',input:'He wrote “you are an idiot”; what does that mean?'},
 'incident.security-review':{profile:'security-crime',input:'I was phished and funds may have been stolen',forceOperatorCase:true},
 'incident.qcoin-discrepancy':{profile:'mixed',input:'My QCoin balance is wrong after payment',analysis:{topic:'qcoin',messageAct:'incident_report'},fixtureTopic:'qcoin'},
 'incident.ecosystem-intake':{profile:'mixed',input:'Check my payment status; payment failed after checkout',analysis:{topic:'payments',messageAct:'incident_report'},fixtureTopic:'payments',expected:{topic:'payments'}},
 'fact.ai-quota-exhausted':{profile:'crypto-ai',input:'analyze BTC on 4h',fixtureTopic:'exchange_ai',fixtureState:'quota_exhausted',analysis:{topic:'exchange_ai',messageAct:'how_to_question'}},
 'fact.ai-recommendation':{profile:'crypto-ai',input:'analyze BTC on 4h',fixtureTopic:'exchange_ai',analysis:{topic:'exchange_ai',messageAct:'how_to_question'}},
 'fact.verified':{profile:'mixed',input:'show my QCoin balance',fixtureTopic:'qcoin',analysis:{topic:'qcoin',messageAct:'how_to_question'}},
 'fact.verified-empty':{profile:'mixed',input:'show my ad campaigns',fixtureTopic:'ads_campaigns',fixtureState:'verified_empty',analysis:{topic:'ads_campaigns',messageAct:'how_to_question'}},
 'fact.unavailable':{profile:'mixed',input:'show my VIP status',fixtureTopic:'vip',fixtureState:'unavailable',analysis:{topic:'vip',messageAct:'how_to_question'}},
 'knowledge.planned-status':{profile:'knowledge',input:'When will MetaStudio launch?',analysis:{topic:'metastudio',messageAct:'when_question'},runtimeCapability:{availability:'planned'}},
 'knowledge.answer':{profile:'knowledge',input:'How does QCoin work?',analysis:{topic:'qcoin',messageAct:'how_to_question'},expected:{noAdapter:true}},
 'dialogue.general-knowledge':{profile:'conversation',input:'Tell me about the ocean'},
 'dialogue.small-talk':{profile:'conversation',input:'What do you think makes a good conversation?'},
})
export function buildQl7SupportBranchScenario(branchId,index,{locale='en',seed='capacity'}={}){
 const row=BASE[branchId]||{profile:'mixed',input:'Tell me something useful'}
 const base=buildQl7SupportScenario(index,{profile:row.profile||'mixed',locale,seed:`${seed}:${branchId}`})
 const analysis=row.analysis?{...(base.analysis||{}),...row.analysis}:base.analysis
 return Object.freeze({...base,...row,analysis,id:`capacity:${branchId}:${locale}:${String(index).padStart(6,'0')}`,locale,seed:`${seed}:${branchId}:${locale}:${index}`,expected:Object.freeze({...(row.expected||{}),selectedLocale:locale}),capacityTargetBranchId:branchId,capacityScenarioHash:ql7StableHash(JSON.stringify({branchId,index,locale,row}))})
}
export function auditQl7SupportBranchScenarioCatalog(branchIds=[]){const missing=(branchIds||[]).filter((id)=>!BASE[id]);return Object.freeze({version:QL7_SUPPORT_BRANCH_SCENARIO_CATALOG_VERSION,declaredCount:Object.keys(BASE).length,missing:Object.freeze(missing),ok:missing.length===0})}
