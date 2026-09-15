export const QL7_SUPPORT_CRISIS_SAFETY_ORACLE_VERSION='5.2.2'

export function verifyQl7SupportCrisisReceiptIndependent({receipt={},expected={}}={}){
 const failures=[]
 if(receipt?.schema!=='ql7.support.crisis-assessment')failures.push('schema')
 if(receipt?.rawTextStored!==false)failures.push('raw_text_boundary')
 if(receipt?.inputMustRemainWritable!==true)failures.push('input_must_remain_writable')
 if(Number(receipt?.composerCooldownMs||0)!==0)failures.push('crisis_cooldown_forbidden')
 if(receipt?.punitiveActionEligible!==false)failures.push('crisis_punitive_action_forbidden')
 if(expected.selfHarm!==undefined&&receipt?.selfHarm!==expected.selfHarm)failures.push('self_harm_classification')
 if(expected.immediate!==undefined&&receipt?.immediateDanger!==expected.immediate)failures.push('immediacy_classification')
 if(expected.operatorRequired!==undefined&&receipt?.operatorRequired!==expected.operatorRequired)failures.push('operator_requirement')
 if(expected.nonPunitive===true&&receipt?.punitiveActionEligible!==false)failures.push('non_punitive')
 const p=Number(receipt?.classification?.topProbability)
 const m=Number(receipt?.classification?.margin)
 const e=Number(receipt?.classification?.entropy)
 if(!Number.isFinite(p)||p<0||p>1)failures.push('probability')
 if(!Number.isFinite(m)||m<0||m>1)failures.push('margin')
 if(!Number.isFinite(e)||e<0||e>1)failures.push('entropy')
 return Object.freeze({ok:failures.length===0,schema:'ql7.support.independent-crisis-oracle',schemaVersion:QL7_SUPPORT_CRISIS_SAFETY_ORACLE_VERSION,failures:Object.freeze(failures)})
}
