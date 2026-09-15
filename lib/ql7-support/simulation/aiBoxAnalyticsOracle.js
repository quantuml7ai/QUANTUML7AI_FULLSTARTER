export const QL7_SUPPORT_AI_BOX_ANALYTICS_ORACLE_VERSION='5.2.2'
export function verifyQl7AiBoxAnalyticsIndependent(result={}){
 const failures=[]
 if(result?.ok!==true)failures.push('not_ok')
 if(result?.readOnly!==true||Number(result?.writeCount||0)!==0)failures.push('not_read_only')
 if(!['BUY','SELL','HOLD'].includes(String(result?.data?.action||'')))failures.push('action')
 const conf=Number(result?.data?.confidence);if(!Number.isFinite(conf)||conf<0||conf>100)failures.push('confidence')
 const risk=Number(result?.data?.engine?.risk?.riskScore);if(!Number.isFinite(risk)||risk<0||risk>100)failures.push('risk_score')
 if(result?.disclaimerId!=='analytics_not_financial_advice')failures.push('disclaimer')
 if(!String(result?.ownerId||'').includes('ai-box-analysis'))failures.push('shared_owner')
 return Object.freeze({ok:failures.length===0,schema:'ql7.support.independent-ai-box-analytics-oracle',schemaVersion:QL7_SUPPORT_AI_BOX_ANALYTICS_ORACLE_VERSION,failures:Object.freeze(failures)})
}
