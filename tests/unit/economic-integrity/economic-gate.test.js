import { describe, it, expect } from 'vitest'
import economic from '../../../lib/economic-integrity/index.cjs'
import evaluator from '../../../lib/economic-integrity/evaluateOperation.cjs'
import registry from '../../../lib/economic-integrity/routeRegistry.cjs'
import sourceReceipts from '../../../lib/economic-integrity/sourceReceipt.cjs'
import evidenceResolver from '../../../lib/economic-integrity/evidenceResolver.cjs'

describe('canonical economic integrity gate', () => {
  it('registers every mandatory lawful economic and entitlement route family', () => {
    for (const id of [
      'qcoin.topup.webhook','qcoin.topup.debug','qcoin.drop','qcoin.heartbeat.accrual','academy.exam.reward','quest.reward','referral.reward',
      'battlecoin.open.debit','battlecoin.settlement','metamarket.buy','metamarket.sell','metamarket.gift',
      'vip.payment.activation','vip.referral.activation','vip.debug.grant','ads.payment.activation','ads.debug.grant','ai.quota.consume',
      'operator.correction','economic.reversal','economic.migration',
    ]) expect(registry.getRoute(id), id).toBeTruthy()
  })

  it('holds missing evidence and never quarantines from model confidence or suspicion alone', () => {
    const env = economic.createOperationEnvelope({ operationId:'o1', operationType:'credit', actorAccountId:'a1', routeId:'qcoin.topup.webhook', idempotencyKey:'k1', amount:5 })
    expect(evaluator.evaluateOperation(env,{receipts:[]})).toMatchObject({decision:'HOLD_FOR_REVIEW'})
    expect(evaluator.evaluateOperation(env,{receipts:[],securityCompromise:true,deterministicProof:false}).decision).not.toBe('QUARANTINE_ACCOUNT_3D')
  })

  it('verifies a signed source receipt before normalization and allows the matching route', () => {
    const receipt = sourceReceipts.createEconomicSourceReceipt({ type:'payment', verified:true, proofLevel:'verified', actorAccountId:'a1', targetAccountId:'a1', sourceEventId:'payment:1', sourceOwner:'payment-webhook', evidenceHash:'a'.repeat(64) })
    const resolved = evidenceResolver.resolveEvidence([receipt])
    expect(resolved.invalid).toHaveLength(0)
    const env = economic.createOperationEnvelope({ operationId:'o2', operationType:'credit', actorAccountId:'a1', routeId:'qcoin.topup.webhook', idempotencyKey:'k2', amount:5, sourceReceiptIds:[receipt.receiptId] })
    expect(evaluator.evaluateOperation(env,{receipts:[receipt]})).toMatchObject({decision:'ALLOW'})
  })
})
