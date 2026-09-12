import crypto from 'node:crypto'
export const QL7_SEMANTIC_HOLDOUT_ORACLE_VERSION='1.0.0'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export function evaluateQl7SemanticHoldout({actual={},expected={}}={}){const failures=[];for(const [k,v] of Object.entries(expected)){if(k==='allowedAlternatives')continue;const av=actual?.[k];if(Array.isArray(v)){if(JSON.stringify(av)!==JSON.stringify(v))failures.push(`field:${k}`)}else if(v!==undefined&&av!==v)failures.push(`field:${k}`)}const body={schema:'ql7.support.oracle.semantic-holdout',schemaVersion:QL7_SEMANTIC_HOLDOUT_ORACLE_VERSION,ok:!failures.length,failures:Object.freeze(failures),actualHash:h(actual),expectedHash:h(expected)};return Object.freeze({...body,receiptHash:h(body)})}
