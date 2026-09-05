import {ql7StableHash} from '../internal/text.js'
import {QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT} from '../config/maxCombatRequirementRegistry.js'
export const QL7_SUPPORT_LAB_PLAN_VERSION='5.2.2'
export const QL7_SUPPORT_LAB_REQUIREMENT_REGISTRY_COUNT=QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT
function plan(id,total,buckets,{release=false,description=''}={}){
 const rows=Object.freeze(buckets.map(([family,count])=>Object.freeze({family,count:Number(count)})))
 const sum=rows.reduce((n,row)=>n+row.count,0)
 if(sum!==Number(total)) throw new Error(`ql7_lab_plan_count_mismatch:${id}:${sum}:${total}`)
 const body={schema:'ql7.support.lab-plan',schemaVersion:QL7_SUPPORT_LAB_PLAN_VERSION,planId:id,total:Number(total),release,description,buckets:rows}
 return Object.freeze({...body,planHash:ql7StableHash(JSON.stringify(body))})
}
export const QL7_SUPPORT_LAB_PLANS=Object.freeze({
 'calibration-5000':plan('calibration-5000',5000,[
  ['benign-hard-negatives',900],['safety-and-context',700],['economic-integrity',650],['ecosystem-domain-isolation',650],['human-naturalness',650],['memory-topic-switch',400],['locale-purity',350],['contact-consent',250],['presentation-novelty',250],['delivery-recovery-evidence',200],
 ],{release:true,description:'Exact 5000 calibration with full evidence and cluster review'}),
 'human-calibration-50000':plan('human-calibration-50000',50000,[
  ['human-naturalness-direct-answer',10000],['domain-subdomain-microtopic-isolation',10000],['topic-switch-suspension-exact-resume',8000],['exact-normalized-semantic-anti-repeat',7000],['locale-language-purity',5000],['emotion-humour-small-talk-stories',4000],['empty-noise-fallback',3000],['title-badge-cta-coherence',3000],
 ],{release:true,description:'Gate B'}),
 'production-1100k':plan('production-1100k',1100000,[
  ['benign-hard-negatives',300000],['severe-safety',180000],['economic-integrity',180000],['ecosystem-knowledge',170000],['general-conversation-emotion-humour',110000],['contact-consent-questionnaire',60000],['anti-repeat-title-length',40000],['restriction-quarantine-ui',30000],['operator-smtp-evidence-privacy',20000],['failure-recovery-idempotency-replay',10000],
 ],{release:true,description:'Gate C canonical production-shaped combat'}),
 'human-naturalness-domain-isolation-3200k':plan('human-naturalness-domain-isolation-3200k',3200000,[
  ['domain-subdomain-microtopic-purity',600000],['topic-switch-nested-suspension-resume-correction',500000],['human-naturalness-directness-coherence',450000],['semantic-uniqueness-sentence-lego',400000],['language-purity-provider-native-code-switch-rtl',350000],['general-human-conversation-factual-continuity',300000],['emotion-humour-gratitude-stories-small-talk',200000],['microdialogues-ui-text-interactions',150000],['empty-noise-damaged-input',100000],['title-body-badge-cta-coherence',75000],['cross-domain-cross-language-adversarial',75000],
 ],{release:true,description:'Gate D; exact locale floor 100000 per locale'}),
 'complete-4300k':plan('complete-4300k',4300000,[['production-1100k',1100000],['human-naturalness-domain-isolation-3200k',3200000]],{release:true,description:'Gate E combined acceptance; 50k calibration is separate'}),
 'cell-holdout-1472k':plan('cell-holdout-1472k',1472000,[['scientific-cell-holdout',1472000]],{release:true,description:'Confirmatory Gate F: 32 locales x 46 release-domain roots x 1000 complete dialogues'}),
 'memory-longitudinal-147200':plan('memory-longitudinal-147200',147200,[['scientific-memory-longitudinal',147200]],{release:true,description:'Confirmatory Gate G: 147200 dialogues x 100 turns'}),
 'metamorphic-2355200':plan('metamorphic-2355200',2355200,[['scientific-metamorphic',2355200]],{release:true,description:'Confirmatory Gate H: 32 x 46 x 100 base x 16 transforms'}),
 'chaos-100000':plan('chaos-100000',100000,[['scientific-chaos',100000]],{release:true,description:'Confirmatory Gate I: provider/db/worker/network/crash/concurrency failure injection'}),
})

export const QL7_SUPPORT_LAB_ACCEPTANCE=Object.freeze({
 'calibration-5000':Object.freeze({gate:'CALIBRATION',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['full-transcripts','failure-clusters','calibration-dashboard','negative-controls','production-parity']),humanReview:Object.freeze({required:true,minPerLocale:0,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,calibration:true}),zeroHardFailures:true}),
 'human-calibration-50000':Object.freeze({gate:'B',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['full-transcripts','duplicate-clusters','bot-phrase-clusters','locale-leakage','domain-leakage','production-parity','surface-redundancy','table-dedupe','entity-mention-necessity','novelty-delivery-availability','open-human-topic','public-figure-coverage','humor-capacity', 'greeting-capacity','crisis-context-32-locale','decision-math-calibration','clarification-information-gain']),humanReview:Object.freeze({required:true,minPerLocale:200,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,multipleTesting:true,power:true}),zeroHardFailures:true,rerunAfterFix:true}),
 'production-1100k':Object.freeze({gate:'C',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['full-transcripts','policy-side-effects','production-parity','negative-controls','replay-checkpoints','composer-full-32-locale-matrix','ecosystem-attack-context','illicit-asset-route-policy','surface-redundancy','crisis-context-32-locale','ai-box-shared-analysis','outcome-calibration-governance']),humanReview:Object.freeze({required:true,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,punitiveFalsePositive:true,multipleTesting:true,power:true}),zeroHardFailures:true}),
 'human-naturalness-domain-isolation-3200k':Object.freeze({gate:'D',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['full-transcripts','semantic-novelty','novelty-delivery-availability','domain-isolation','topic-resume','locale-purity','ui-coherence','surface-redundancy','public-figure-coverage','humor-capacity', 'greeting-capacity','open-human-topic','crisis-context-32-locale','decision-math-calibration','clarification-information-gain']),humanReview:Object.freeze({required:true,minPerLocale:1000,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,multipleTesting:true,power:true}),zeroHardFailures:true}),
 'complete-4300k':Object.freeze({gate:'E',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['gate-c-link','gate-d-link','cross-run-lineage','split-leakage-zero']),humanReview:Object.freeze({required:true,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,multipleTesting:true,power:true}),zeroHardFailures:true}),
 'cell-holdout-1472k':Object.freeze({gate:'F',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['cell-holdout','dataset-lineage','split-leakage-zero','production-parity']),humanReview:Object.freeze({required:true,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,holdout:true,multipleTesting:true,power:true}),zeroHardFailures:true}),
 'memory-longitudinal-147200':Object.freeze({gate:'G',requiredOracles:Object.freeze(['memory','domain','locale','human']),requiredEvidence:Object.freeze(['100-turn-dialogues','exact-resume','correction-replay','privacy-retention','production-parity']),humanReview:Object.freeze({required:true,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,power:true}),zeroHardFailures:true}),
 'metamorphic-2355200':Object.freeze({gate:'H',requiredOracles:Object.freeze(['domain','locale','memory','feature','human','composer']),requiredEvidence:Object.freeze(['metamorphic-invariants','mutation-provenance','counterfactual-consistency','production-parity']),humanReview:Object.freeze({required:true,twoReviewer:true,adjudication:true}),statistics:Object.freeze({required:true,multipleTesting:true,power:true}),zeroHardFailures:true}),
 'chaos-100000':Object.freeze({gate:'I',requiredOracles:Object.freeze(['feature','composer','memory']),requiredEvidence:Object.freeze(['failure-injection','atomicity','idempotency','crash-recovery','provider-db-network-worker','production-parity']),humanReview:Object.freeze({required:false,twoReviewer:false,adjudication:false}),statistics:Object.freeze({required:true,reliability:true}),zeroHardFailures:true}),
})
export function getQl7SupportLabAcceptance(id=''){return QL7_SUPPORT_LAB_ACCEPTANCE[String(id||'').trim()]||null}
export function getQl7SupportLabPlan(id=''){return QL7_SUPPORT_LAB_PLANS[String(id||'').trim()]||null}
export function auditQl7SupportLabPlans(){
 const rows=Object.values(QL7_SUPPORT_LAB_PLANS);const failures=[]
 for(const row of rows){const sum=row.buckets.reduce((n,b)=>n+b.count,0);if(sum!==row.total)failures.push(`${row.planId}:count:${sum}:${row.total}`);if(!row.planHash)failures.push(`${row.planId}:hash`);const acceptance=getQl7SupportLabAcceptance(row.planId);if(row.release&&!acceptance)failures.push(`${row.planId}:acceptance_missing`);if(acceptance){if(!acceptance.gate)failures.push(`${row.planId}:acceptance_gate`);if(!Array.isArray(acceptance.requiredOracles)||!acceptance.requiredOracles.length)failures.push(`${row.planId}:acceptance_oracles`);if(!Array.isArray(acceptance.requiredEvidence)||!acceptance.requiredEvidence.length)failures.push(`${row.planId}:acceptance_evidence`);if(acceptance.zeroHardFailures!==true)failures.push(`${row.planId}:acceptance_hard_fail`)}}
 const human=QL7_SUPPORT_LAB_PLANS['human-naturalness-domain-isolation-3200k'];if(human.total/32!==100000)failures.push('canonical-3200k-locale-floor')
 const f=QL7_SUPPORT_LAB_PLANS['cell-holdout-1472k'];if(f.total!==32*46*1000)failures.push('canonical-holdout-exact-total')
 const g=QL7_SUPPORT_LAB_PLANS['memory-longitudinal-147200'];if(g.total!==147200)failures.push('canonical-memory-exact-dialogues')
 const h=QL7_SUPPORT_LAB_PLANS['metamorphic-2355200'];if(h.total!==32*46*100*16)failures.push('canonical-metamorphic-exact-total')
 const i=QL7_SUPPORT_LAB_PLANS['chaos-100000'];if(i.total!==100000)failures.push('canonical-chaos-exact-total')
 return Object.freeze({ok:!failures.length,version:QL7_SUPPORT_LAB_PLAN_VERSION,planCount:rows.length,plans:Object.freeze(rows.map(p=>({planId:p.planId,total:p.total,planHash:p.planHash,acceptance:getQl7SupportLabAcceptance(p.planId)}))),failures:Object.freeze(failures)})
}
