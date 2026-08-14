import { executeQl7SupportTurnRuntime } from '../runtime/executeTurn.js'
export const QL7_SUPPORT_RESPONSE_PLANNER_VERSION_V12='12.0.0-v13-compat'
export function buildQl7SupportResponsePlanV12(input={}){
  const runtime=executeQl7SupportTurnRuntime({mode:input.mode||'test',text:input.sourceText||input.analysis?.rawText||'',selectedLocale:input.locale||'en',analysis:input.analysis||{},route:input.route||{},tone:input.tone||{},priorLedger:input.memory||{},diagnosticResult:input.diagnosticResult||null,conversationDecision:input.conversationDecision||null,seed:input.seed||''})
  return Object.freeze({version:QL7_SUPPORT_RESPONSE_PLANNER_VERSION_V12,plan:runtime.replyPlan,basePlan:runtime.replyPlan,responseVariation:Object.freeze({version:'13.0.0',variationKey:runtime.replyPlan.semanticFingerprint,shape:'minimal',conversationMode:runtime.plan.kind}),critic:runtime.critic,ok:runtime.critic.ok,runtime})
}
