import crypto from 'node:crypto'
export const QL7_SUPPORT_TOPIC_DECISION_RECEIPT_VERSION='5.4.0'
const hash=v=>crypto.createHash('sha256').update(String(v)).digest('hex')
export function sealQl7TopicDecisionReceipt(payload={}){const body={schema:'ql7.support.topic-decision-receipt',schemaVersion:QL7_SUPPORT_TOPIC_DECISION_RECEIPT_VERSION,...payload};return Object.freeze({...body,receiptHash:hash(JSON.stringify(body))})}
