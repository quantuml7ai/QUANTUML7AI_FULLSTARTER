import { ql7Str } from '../internal/text.js'
export const QL7_SUPPORT_INSULT_STATE_MACHINE_VERSION='15.0.0'
export function resolveQl7SupportInsultState({assessment={},priorLedger={},now=''}={}){
 const pending=priorLedger?.safety?.pendingBoundaryClarification||{};const at=ql7Str(now)||new Date().toISOString();let state='idle',strikeDelta=0,clearPending=false,createPending=false,resumeTopic=''
 if(assessment.decision==='uncertain'){state='clarification_pending';createPending=true;resumeTopic=ql7Str(priorLedger.activeTopic)}
 else if(assessment.decision==='denied'){state='denied';clearPending=true;resumeTopic=ql7Str(pending.resumeTopic||priorLedger.activeTopic)}
 else if(['confirmed','continued'].includes(assessment.decision)){state=assessment.decision;strikeDelta=1;clearPending=true;resumeTopic=ql7Str(pending.resumeTopic||priorLedger.activeTopic)}
 else if(pending.active===true){state='resolved';clearPending=true;resumeTopic=ql7Str(pending.resumeTopic||priorLedger.activeTopic)}
 return Object.freeze({version:QL7_SUPPORT_INSULT_STATE_MACHINE_VERSION,state,strikeDelta,createPending,clearPending,resumeTopic,pendingBoundaryClarification:createPending?Object.freeze({active:true,createdAt:at,assessmentFingerprint:assessment.fingerprint,resumeTopic:ql7Str(priorLedger.activeTopic),resumeGoal:ql7Str(priorLedger.activeGoal),lastMaterialTurnId:ql7Str(priorLedger.lastMaterialTurnId)}):null})
}
