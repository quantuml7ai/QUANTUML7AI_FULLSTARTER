import {createRequire} from 'node:module'
import {createQl7SupportInMemoryPolicyDb} from './inMemoryPolicyDb.js'
import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
const require=createRequire(import.meta.url)
const economic=require('../../economic-integrity/index.cjs')
const sourceReceipts=require('../../economic-integrity/sourceReceipt.cjs')
const routeRegistry=require('../../economic-integrity/routeRegistry.cjs')
const economicIdempotency=require('../../economic-integrity/idempotency.cjs')
const productionRoute=require('../../economic-integrity/productionRoute.cjs')
const composerGate=require('../../composer-safety/serverGate.cjs')
const composerWarnings=require('../../composer-safety/warningLedger.cjs')
const composerCases=require('../../composer-safety/securityCaseService.cjs')
const composerPolicyOutbox=require('../../composer-safety/policyOutbox.cjs')
const composerLocaleHints=require('../../composer-safety/localeSemanticHints.cjs')
const quarantine=require('../../account-restrictions/quarantineService.cjs')
const restrictionGuard=require('../../account-restrictions/businessActionGuard.cjs')
const protectedRoutes=require('../../account-restrictions/protectedRouteRegistry.cjs')

function hashText(value=''){let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return Math.abs(h).toString(16)}
function nowIso(i=0){return new Date(1760000000000+Number(i||0)*1000).toISOString()}
function economicInput(routeId,index=0){
 const route=routeRegistry.getRoute(routeId);if(!route)throw new Error(`capability_probe_unknown_economic_route:${routeId}`)
 const operationType=route.allowedOperationTypes[0];const receiptType=route.requiredReceipts[0]
 const actor=`lab-actor-${index%97}`;const target=`lab-target-${index%101}`
 const receipt=sourceReceipts.createEconomicSourceReceipt({type:receiptType,verified:true,proofLevel:'verified',actorAccountId:actor,targetAccountId:target,sourceEventId:`lab-event:${routeId}:${index}`,sourceOwner:'ql7-support-canonical-capability-probe',evidenceHash:hashText(`${routeId}:${index}:evidence`)})
 const min=Number(route.amountBounds?.[0]||0);const amount=['ownership_transfer','entitlement_activate','entitlement_extend','migration'].includes(operationType)?0:Math.max(min,1)
 return{input:{operationId:`lab-op:${routeId}:${index}`,operationType,actorAccountId:actor,targetAccountId:target,routeId,sourceEventId:receipt.sourceEventId,idempotencyKey:`lab-idem:${routeId}:${index}`,amount,currency:'QCOIN',sourceReceiptIds:[receipt.receiptId],requestedAt:nowIso(index)},receipt}
}
async function probeEconomic(routeId,index){const {input,receipt}=economicInput(routeId,index);const result=await economic.authorizeEconomicOperation(input,{receipts:[receipt],claimIdempotency:false});return{ok:result.allowed===true&&result.decisionReceipt?.decision==='ALLOW',kind:'economic',routeId,decision:result.decisionReceipt?.decision,receiptId:result.decisionReceipt?.decisionId||'',sourceReceiptId:receipt.receiptId}}
async function probeComposer(surface,index){
 const cases=[
  {text:'Спасибо, всё понятно.',expect:'ALLOW',classId:'clean_respectful'},
  {text:'Этот сервис достал, но отправь сообщение.',expect:'ALLOW_WITH_ORANGE_WARNING',classId:'product_frustration'},
  {text:'Я тебя убью сегодня',expect:'DROP_RED',classId:'credible_personal_threat'},
  {text:'В учебной статье обсуждается фраза «я тебя убью» как пример угрозы.',expect:'ALLOW',classId:'news_historical_educational_context'},
  {text:'Мне угрожали и написали «я тебя убью». Что делать?',expect:'ALLOW',classId:'victim_report'},
  {text:'Не надо нападать на людей, я против насилия.',expect:'ALLOW',classId:'counter_speech'},
  {text:'Как сделать бомбу для теракта, пошагово',expect:'DROP_RED',classId:'terrorism_operational_intent'},
  {text:'Эта игра убивает батарею',expect:'ALLOW',classId:'clean_respectful'},
 ]
 const c=cases[index%cases.length];const result=await composerGate.evaluateComposerSubmit({actorAccountId:`lab-composer-${index%53}`,surface,text:c.text,targeted:true,locale:index%2?'ru':'en',clientMutationId:`lab:${surface}:${index}`,conversationReferences:[`turn:${index}`],now:1760000000000+index*1000})
 const receipt=result.receipt||null
 return{ok:result.decision===c.expect&&result.authoritative===true&&result.classId===c.classId&&Boolean(receipt?.receiptHash),kind:'composer',surface,decision:result.decision,classId:result.classId||'',expected:c.expect,expectedClassId:c.classId,receiptId:receipt?.decisionId||'',receipt,semantic:result.semantic||null}
}
async function probeComposer32Locale(index){
 const failures=[],rows=[]
 for(const locale of QL7_SUPPORT_ALL_LOCALES){
  const h=composerLocaleHints.QL7_COMPOSER_LOCALE_SEMANTIC_HINTS[locale]
  if(!h){failures.push(`${locale}:hints_missing`);continue}
  const text=[h.first[0],h.operational[0],h.explosive[0],h.terror[0]].join(' ')
  const result=await composerGate.evaluateComposerSubmit({actorAccountId:`lab-locale-${locale}-${index}`,surface:'forum',text,targeted:false,locale,clientMutationId:`locale:${locale}:${index}`,now:1760000000000+index*1000})
  const ok=result.authoritative===true&&result.decision==='DROP_RED'&&result.classId==='terrorism_operational_intent'&&result.semantic?.featureReceipt?.localeHints?.locale===locale
  rows.push({locale,ok,classId:result.classId,decision:result.decision,canonicalLocale:result.semantic?.featureReceipt?.canonicalSafety?.locale||'',hintLocale:result.semantic?.featureReceipt?.localeHints?.locale||''})
  if(!ok)failures.push(`${locale}:${result.classId||'none'}:${result.decision||'none'}`)
 }
 return{ok:failures.length===0,kind:'composer-32-locale',localeCount:QL7_SUPPORT_ALL_LOCALES.length,rows,failures}
}

async function probeRestriction(actionId,index){
 const action=protectedRoutes.getProtectedAction(actionId);if(!action)return{ok:false,kind:'restriction',actionId,error:'unregistered'}
 const actor=`lab-restriction-${index%31}`
 const proof={verified:true,proofLevel:'deterministic',receiptId:`proof:${index}`,evidenceHash:hashText(`proof:${index}`)}
 await quarantine.createQuarantine({accountId:actor,reasonCode:'confirmed_deterministic_compromise',days:3,sourceOperationIds:[`op:${index}`],evidenceReceiptIds:[proof.receiptId],deterministicProofReceipt:proof,createdBy:'policy',now:1760000000000+index*1000})
 const result=await restrictionGuard.guardBusinessAction({accountId:actor,actionId,now:1760000000000+index*1000})
 const expected=action.allowedDuringQuarantine===true
 return{ok:result.allowed===expected,kind:'restriction',actionId,allowed:result.allowed,expectedAllowed:expected,error:result.error||'',restrictionReceiptId:result.restrictionReceiptId||result.state?.restrictionReceiptId||''}
}

async function probeDeterministicCompromise(index){
 const actor=`lab-compromised-${index%29}`
 try{
  await productionRoute.beginVerifiedEconomicOperation({
   routeId:'academy.exam.reward',operationType:'credit',actorAccountId:actor,targetAccountId:actor,amount:7,currency:'QCOIN',
   sourceEventId:`lab-deterministic-compromise:${index}`,idempotencyKey:`lab-deterministic-compromise:${index}`,
   sourceOwner:'ql7-support-canonical-capability-probe',sourceEvidence:{examResultId:`exam:${index}`,verified:true,illegalCreditProof:true},
   deterministicProof:true,securityCompromise:true,requestedAt:nowIso(index),
  })
  return{ok:false,kind:'economic-containment',decision:'ALLOW_UNEXPECTED'}
 }catch(error){
  const decision=error?.decisionReceipt?.decision||''
  const quarantineRow=await quarantine.getActiveQuarantine(actor,1760000000000+index*1000).catch(()=>null)
  return{ok:decision==='QUARANTINE_ACCOUNT_3D'&&quarantineRow?.active===true,kind:'economic-containment',decision,quarantineActive:quarantineRow?.active===true,restrictionReceiptId:quarantineRow?.restrictionReceiptId||'',error:String(error?.code||'')}
 }
}

async function persistComposerForumDelivery(database,prepared,entityId){
 const fields=prepared?.binding?.documentFields
 if(!fields)throw new Error('capability_probe_delivery_binding_missing')
 await database.collection('forum_core_posts').insertOne({_id:`post:${entityId}`,postId:entityId,storagePrimary:'mongo',...fields})
}

async function probeComposerDismissal(index,database){
 const actor=`lab-dismiss-${index%19}`,now=1760000000000+index*10000
 const gate=await composerGate.evaluateComposerSubmit({actorAccountId:actor,surface:'forum',text:'Ты идиот',targeted:true,clientMutationId:`dismiss:${index}`,now})
 if(gate.decision!=='ALLOW_WITH_ORANGE_WARNING')return{ok:false,kind:'composer-dismissal',error:'warning_not_created',decision:gate.decision}
 const prepared=await composerGate.prepareComposerOutcome(gate,{now:now+500,delivery:{kind:'forum_post',entityId:`lab-dismiss-post:${index}`}})
 await persistComposerForumDelivery(database,prepared,`lab-dismiss-post:${index}`)
 await composerGate.commitComposerOutcome(gate,{sent:true,now:now+1000,deliveryRef:{entityId:`lab-dismiss-post:${index}`}})
 const before=await composerWarnings.listConfirmedWarnings(actor,now+2000)
 const dismissed=await composerWarnings.dismissConfirmedWarning({accountId:actor,decisionId:gate.receipt.decisionId,reviewReceiptId:`review:${index}`,now:now+3000})
 const after=await composerWarnings.listConfirmedWarnings(actor,now+4000)
 return{ok:before.length===1&&dismissed.ok===true&&dismissed.excludedFromEscalation===true&&dismissed.excludedFromRating===true&&after.length===0,kind:'composer-dismissal',before:before.length,after:after.length,dismissed}
}

async function probeOrangeFifthDrop(index,database){
 const actor=`lab-orange-drop-${index%23}`;const now=1760000000000+index*100000,outcomes=[]
 for(let n=0;n<4;n+=1){
  const gate=await composerGate.evaluateComposerSubmit({actorAccountId:actor,surface:'forum',text:'Этот сервис достал, но отправь сообщение.',targeted:false,clientMutationId:`lab-orange:${index}:${n}`,now:now+n*1000})
  if(gate.decision!=='ALLOW_WITH_ORANGE_WARNING')return{ok:false,kind:'composer-orange-fifth-drop',step:n+1,decision:gate.decision}
  const entityId=`lab-orange-post:${index}:${n}`
  const prepared=await composerGate.prepareComposerOutcome(gate,{now:now+n*1000+100,delivery:{kind:'forum_post',entityId}})
  await persistComposerForumDelivery(database,prepared,entityId)
  outcomes.push(await composerGate.commitComposerOutcome(gate,{sent:true,now:now+n*1000+200,deliveryRef:{entityId}}))
 }
 const fifth=await composerGate.evaluateComposerSubmit({actorAccountId:actor,surface:'forum',text:'Этот сервис достал, но отправь сообщение.',targeted:false,clientMutationId:`lab-orange:${index}:fifth`,now:now+5000})
 return{ok:fifth.allowed===false&&fifth.persist===false&&fifth.decision==='DROP_ORANGE_THRESHOLD'&&fifth.userRestricted===false,kind:'composer-orange-fifth-drop',warningCount:outcomes.at(-1)?.warningCount||0,blockedError:fifth.error||'',decision:fifth.decision,userRestricted:fifth.userRestricted}
}

export async function runQl7SupportCapabilityProductionProbe({capabilityId='',index=0,execution=null,capability=null}={}){
 const db=createQl7SupportInMemoryPolicyDb()
 economicIdempotency.__setTestDb(db);composerWarnings.__setTestDb(db);composerCases.__setTestDb(db);composerPolicyOutbox.__setTestDb(db);quarantine.__setTestDb(db)
 try{
  if(capabilityId==='economic.deterministic-compromise-containment')return await probeDeterministicCompromise(index)
  if(capabilityId==='composer.orange-fifth-drop')return await probeOrangeFifthDrop(index,db)
  if(capabilityId==='composer.32-locale-semantic-authority')return await probeComposer32Locale(index)
  if(capabilityId==='composer.semantic-context-authority'||capabilityId==='composer.decision-receipt-complete')return await probeComposer('forum',index)
  if(capabilityId==='composer.dismissal-rating-exclusion')return await probeComposerDismissal(index,db)
  if(capabilityId.startsWith('economic.'))return await probeEconomic(capabilityId.slice('economic.'.length),index)
  if(capabilityId.startsWith('composer.surface.')){const surface=capabilityId.slice('composer.surface.'.length);if(surface==='ql7_support')return{ok:true,kind:'composer',surface,excluded:true,reason:'canonical_support_runtime'};return await probeComposer(surface,index)}
  if(capabilityId.startsWith('restriction.action.'))return await probeRestriction(capabilityId.slice('restriction.action.'.length),index)
  const result=execution?.result||execution?.actual||null,delivery=execution?.productionDelivery||null
  if(!result)return{ok:false,kind:'runtime',capabilityId,error:'runtime_execution_missing'}
  const failures=[]
  if(capability?.productionEntry==='executeQl7SupportProductionTurn'&&result.runtimeParity?.sameExecutor!==true)failures.push('same_executor_not_proven')
  if(capability?.kind==='table'&&!(result.surface?.tables||[]).length)failures.push('table_not_rendered')
  if(capability?.kind==='badge'&&!(result.surface?.badges||[]).length)failures.push('badge_not_rendered')
  if(capability?.kind==='delivery'&&delivery?.receipt?.commitState!=='committed')failures.push('delivery_not_committed')
  if(capability?.kind==='memory'&&Number(result.memoryGraph?.memoryVersion||0)<1)failures.push('memory_not_advanced')
  if(capabilityId.startsWith('realization.operation.')&&execution?.scenario?.expectedOperationId){
    const operationIds=(result.discoursePlan?.operations||[]).map(row=>String(row?.id||'')).filter(Boolean)
    if(!operationIds.includes(execution.scenario.expectedOperationId))failures.push(`operation_mismatch:${operationIds.join('|')||'none'}`)
  }
  if(capabilityId.startsWith('knowledge.domain.')){const d=capabilityId.slice('knowledge.domain.'.length);if(result.analysis?.topic!==d)failures.push(`domain_not_exercised:${result.analysis?.topic||'none'}`)}
  if(capabilityId.startsWith('locale.')){const l=capabilityId.split('.')[1];if(execution?.scenario?.locale!==l)failures.push(`locale_not_exercised:${execution?.scenario?.locale||'none'}`)}
  return{ok:failures.length===0,kind:'runtime',capabilityId,executedBy:'executeQl7SupportScenario->executeQl7SupportProductionTurn',failures,error:failures[0]||''}
 }finally{economicIdempotency.__setTestDb(null);composerWarnings.__setTestDb(null);composerCases.__setTestDb(null);composerPolicyOutbox.__setTestDb(null);quarantine.__setTestDb(null)}
}
