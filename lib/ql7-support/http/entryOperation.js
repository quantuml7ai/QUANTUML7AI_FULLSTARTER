import crypto from 'node:crypto'
const text=(value)=>String(value??'').trim()
const hash=(value)=>crypto.createHash('sha256').update(String(value)).digest('hex')
export function buildQl7SupportEntryOperation({action='entry',entryNonce='',anchorId='',clientMutationId=''}={}){
 const payload=Object.freeze({action:text(action)||'entry',entryNonce:text(entryNonce),anchorId:text(anchorId)})
 const payloadHash=hash(JSON.stringify(payload)),semanticKey=payloadHash.slice(0,24),clientKey=text(clientMutationId)
 const operationId=clientKey?`${clientKey}:${semanticKey}`:`${payload.action}:${payload.entryNonce||'session'}:${semanticKey}`
 return Object.freeze({payload,payloadHash,semanticKey,operationId:operationId.slice(0,240)})
}
