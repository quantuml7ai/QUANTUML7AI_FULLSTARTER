export const QL7_SUPPORT_DECISION_MATH_ORACLE_VERSION='5.2.3'

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback
const approx=(left,right,tolerance=1e-9)=>Math.abs(finite(left)-finite(right))<=tolerance

export function verifyQl7SupportDecisionMathIndependent(receipt={}){
 const failures=[];const metrics=receipt?.posteriorMetrics||{},eligibility=receipt?.policyEligibility||{}
 for(const key of ['topProbability','secondProbability','margin','normalizedEntropy']){
  const v=Number(metrics[key]);if(!Number.isFinite(v)||v<0||v>1)failures.push(`metric:${key}`)
 }
 const rows=Array.isArray(receipt?.posterior)?receipt.posterior:[]
 const posteriorCount=Number(metrics.posteriorCount||0)
 if(posteriorCount<1||rows.length<1)failures.push('posterior_missing')
 if(posteriorCount!==rows.length)failures.push('posterior_count_mismatch')
 if(!(Number(metrics.topProbability||0)>0))failures.push('top_probability_zero')
 if(receipt?.semanticEvidencePresent!==true)failures.push('semantic_evidence_missing')
 const ids=rows.map((row)=>String(row?.candidateId||'').trim())
 if(ids.some((id)=>!id)||new Set(ids).size!==ids.length)failures.push('candidate_identity_invalid')
 const probabilityMass=rows.reduce((sum,row)=>sum+finite(row?.posterior),0)
 if(rows.length&&Math.abs(probabilityMass-1)>1e-9)failures.push('posterior_mass')
 if(rows.length&&!approx(metrics.topProbability,rows[0]?.posterior))failures.push('top_probability_mismatch')
 if(rows.length>1&&!approx(metrics.secondProbability,rows[1]?.posterior))failures.push('second_probability_mismatch')
 if(rows.length>1&&!approx(metrics.margin,Math.max(0,finite(rows[0]?.posterior)-finite(rows[1]?.posterior))))failures.push('margin_mismatch')
 if(!Number.isFinite(Number(receipt?.expectedLoss))||Number(receipt.expectedLoss)<0)failures.push('expected_loss')
 if(eligibility.generativeScoreIsAuthority!==false)failures.push('generative_authority')
 if(eligibility.semanticEvidencePresent!==true)failures.push('eligibility_semantic_evidence_missing')
 if(eligibility.policyProofRequired===true&&eligibility.deterministicProofPresent!==true&&eligibility.sideEffectEligible===true)failures.push('unproven_side_effect')
 if(receipt?.semanticEvidencePresent!==true&&eligibility.sideEffectEligible===true)failures.push('side_effect_without_semantic_evidence')
 if(!receipt?.receiptHash)failures.push('receipt_hash')
 return Object.freeze({ok:failures.length===0,schema:'ql7.support.independent-decision-math-oracle',schemaVersion:QL7_SUPPORT_DECISION_MATH_ORACLE_VERSION,posteriorCount,probabilityMass,failures:Object.freeze(failures)})
}
