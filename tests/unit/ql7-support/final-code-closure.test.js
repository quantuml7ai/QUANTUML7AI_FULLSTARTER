import {describe,expect,it} from 'vitest'
import {analyzeQl7SupportTurn} from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import {executeQl7SupportTurnRuntime} from '../../../lib/ql7-support/runtime/executeTurn.js'
import {buildQl7SupportResponseContentPlan} from '../../../lib/ql7-support/response/buildContentPlan.js'

describe('QL7 R89 final code closure regressions',()=>{
 it('breaks stale product context for self identity',()=>{
  for(const text of ['кто ты?','что ты можешь?','какова твоя цель?']){
   const r=analyzeQl7SupportTurn({text,locale:'ru',conversationId:'x',turnId:text,previousContext:{activeTopic:'exchange_ai'}})
   expect(r.analysis.messageAct).toBe('identity_question')
   expect(r.analysis.topic).toBe('support_system')
  }
 })
 it('detects direct self-harm method phrasing',()=>{
  const r=analyzeQl7SupportTurn({text:'мне плохо бросила девушка хочу повешаться',locale:'ru',conversationId:'x',turnId:'c'})
  expect(r.safety.selfHarm).toBe(true)
  expect(r.safety.operatorRequired).toBe(true)
 })
 it('renders material ambiguity as choice card without fake menu padding',()=>{
  const p=buildQl7SupportResponseContentPlan({locale:'ru',analysis:{topic:'support_system',messageAct:'ambiguous_request',needsChoice:true,topicCandidates:[{topic:'qcoin',probability:.51},{topic:'ads_packages',probability:.49}],safety:{}},runtimeContext:{interactionModality:{mode:'choice'},now:'2026-08-25T00:00:00Z'}})
  expect(p.surfaceKind).toBe('choices')
  expect(p.choices.options).toHaveLength(2)
  expect(p.choices.other).toBeTruthy()
 })
 it('keeps general signal discussion out of ads/support loop and keeps price factual',()=>{
  const general=executeQl7SupportTurnRuntime({mode:'test',requestId:'r89:general',userTurnId:'r89:general',selectedLocale:'ru',text:'почему два инструмента показывают разные сигналы?',now:'2026-08-25T00:00:00.000Z'})
  expect(general.analysis.messageAct).toBe('general_knowledge_question')
  expect(general.analysis.requiresAdapter).toBe(false)
  expect(general.contentPlan.waitingFor).not.toBe('signed_choice')
  const price=executeQl7SupportTurnRuntime({mode:'test',requestId:'r89:price',userTurnId:'r89:price',selectedLocale:'ru',text:'сколько стоит BTC?',now:'2026-08-25T00:00:00.000Z'})
  expect(price.analysis.intentConfirmation.slotValues.operationId).toBe('current_price')
  expect(price.surface.purpose).toBe('verification')
 })
 it('uses a human-readable deterministic humor fallback without semantic labels',()=>{
  const result=executeQl7SupportTurnRuntime({mode:'test',requestId:'r89:humor',userTurnId:'r89:humor',selectedLocale:'ru',text:'анекдот',now:'2026-08-25T00:00:00.000Z'})
  expect(result.analysis.messageAct).toBe('humor_request')
  expect(result.surface.summary).not.toMatch(/поддержка причина|\bhumor\b/i)
  expect(result.surface.summary.length).toBeGreaterThan(20)
 })

})
