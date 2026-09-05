import crypto from 'node:crypto'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export const QL7_PUBLIC_ENTITY_ORACLE_VERSION='1.0.0'
export function evaluateQl7PublicEntityResolution({selected=null,expectedEntityId='',candidates=[],currentSensitiveClaims=[]}={}){const wrongPerson=Boolean(expectedEntityId&&String(selected?.entityId||selected?.id||'')!==String(expectedEntityId));const stale=(currentSensitiveClaims||[]).filter(x=>x?.freshReceipt!==true);const body={schema:'ql7.support.oracle.public-entity',schemaVersion:QL7_PUBLIC_ENTITY_ORACLE_VERSION,ok:!wrongPerson&&!stale.length,wrongPerson,staleCurrentClaimCount:stale.length,candidateCount:(candidates||[]).length};return Object.freeze({...body,receiptHash:h(body)})}
