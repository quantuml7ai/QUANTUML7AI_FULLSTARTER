import { createQl7SupportConversationLedgerV13, ledgerToQl7SupportPreviousContextV13, mergeQl7SupportLedgerTurnV13 } from '../v13/conversationLedgerV13.js'
export const QL7_SUPPORT_CONVERSATION_LEDGER_VERSION_V12='12.0.0-v13-compat'
export function createQl7SupportConversationLedgerV12(seed={}){return createQl7SupportConversationLedgerV13(seed)}
export function mergeQl7SupportLedgerTurnV12(ledger={},turn={}){return mergeQl7SupportLedgerTurnV13(ledger,turn)}
export function ledgerToQl7SupportPreviousContextV12(ledger={}){return ledgerToQl7SupportPreviousContextV13(ledger)}
