import crypto from 'node:crypto'

export const QL7_SUPPORT_OPERATOR_EVIDENCE_ORACLE_VERSION='5.2.2'
const hash=(value)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const REQUIRED=['identity','semanticDecision','safety','verifiedChecks','unavailableChecks','aiBox','rating','geography','activity','timeline']

export function evaluateQl7SupportOperatorEvidenceIndependent(receipt={}){
  const failures=[];const sections=receipt?.sections||{}
  if(receipt?.schema!=='ql7.support.operator-evidence-aggregation')failures.push('schema')
  if(receipt?.fieldsSeparated!==true)failures.push('fields_not_separated')
  if(receipt?.rawMongoDumpIncluded!==false)failures.push('raw_mongo_dump')
  if(receipt?.secretsIncluded!==false)failures.push('secrets')
  for(const key of REQUIRED)if(!(key in sections))failures.push(`missing_section:${key}`)
  const serialized=JSON.stringify(sections)
  for(const token of ['privateKey','seed phrase','sessionToken','[object Object]'])if(serialized.toLowerCase().includes(token.toLowerCase()))failures.push(`forbidden:${token}`)
  return Object.freeze({schema:'ql7.support.operator-evidence-independent-oracle',schemaVersion:QL7_SUPPORT_OPERATOR_EVIDENCE_ORACLE_VERSION,ok:failures.length===0,failures,hash:hash({sections:Object.keys(sections),failures})})
}
