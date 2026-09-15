import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_CONTACT_CONSENT_VERSION = '5.1.1'
export const QL7_SUPPORT_CONTACT_CONSENT_STATES = Object.freeze(['granted', 'refused', 'unknown', 'dm_only'])

export function buildQl7SupportContactConsentReceipt({ actorHash = '', purpose = 'operator_handoff', state = 'unknown', channelTypes = [], sourceReceiptId = '', now = new Date().toISOString() } = {}) {
  if (!QL7_SUPPORT_CONTACT_CONSENT_STATES.includes(state)) throw new Error('ql7_contact_consent_state_invalid')
  const body = {
    schema: 'ql7.support.contact-consent-receipt',
    schemaVersion: QL7_SUPPORT_CONTACT_CONSENT_VERSION,
    actorHash: ql7Str(actorHash),
    purpose: ql7Str(purpose),
    state,
    channelTypes: Object.freeze([...channelTypes].map(ql7Str).filter(Boolean)),
    sourceReceiptId: ql7Str(sourceReceiptId),
    decidedAt: ql7Str(now),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `contact-consent:${receiptHash}`, receiptHash })
}
