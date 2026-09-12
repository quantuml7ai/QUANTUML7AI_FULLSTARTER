import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_COMMIT_RECOVERY_WORKER_VERSION } from '../../lib/ql7-support/runtime/commitRecoveryWorker.js'

function expectOrdered(source, tokens, startAt = 0) {
  let cursor = Math.max(0, Number(startAt) || 0)
  for (const token of tokens) {
    const index = source.indexOf(token, cursor)
    expect(index, `missing/out-of-order token: ${token}`).toBeGreaterThanOrEqual(cursor)
    cursor = index + token.length
  }
  return cursor
}

describe('QL7 Support canonical recovery novelty lifecycle contract', () => {
  it('preserves raw reservation provenance while advancing the coordinator decision stage', () => {
    const coordinator = fs.readFileSync('lib/ql7-support/runtime/deliveryCommitCoordinator.js', 'utf8')

    // Reservation owner stays authoritative for the raw collision decision.
    expect(coordinator).toContain("decision: 'reject_before_transport_and_regenerate_relevant_dimension'")
    expect(coordinator).toContain('const reservationDecision = ql7Str(receipt.reservationDecision || receipt.decision)')
    expect(coordinator).toContain('reservationDecision,')

    // Coordinator may express the ordinary branch through a ternary; verify the actual
    // control-flow sequence instead of requiring one formatting-specific literal.
    const attempt = coordinator.indexOf('const attemptCollisionReceipt = finalizeNoveltyCollisionReceipt')
    expect(attempt).toBeGreaterThan(-1)
    expectOrdered(coordinator, [
      "'final_scope_safe_regeneration_before_transport'",
      "'regenerate_before_transport'",
      'const regenerated = await regenerateCandidate({',
      'const completedCollisionReceipt = finalizeNoveltyCollisionReceipt',
      "decision: 'regenerated_and_revalidate_reservations_before_transport'",
      'assertPreparedCandidate(candidate)',
    ], attempt)
  })

  it('counts prepared/retry transport only after the transport callback actually returns', () => {
    const worker = fs.readFileSync('lib/ql7-support/runtime/commitRecoveryWorker.js', 'utf8')
    expect(QL7_SUPPORT_COMMIT_RECOVERY_WORKER_VERSION).toBe('5.3.1')

    const preparedBranch = worker.indexOf("} else if (record.commitState === 'prepared') {")
    expect(preparedBranch).toBeGreaterThan(-1)
    const preparedEnd = expectOrdered(worker, [
      'const result = await transport(delivery, {',
      "recoveryMode: 'prepared'",
      'report.sentFromPrepared += 1',
      'return result',
    ], preparedBranch)

    const definiteBranch = worker.indexOf("} else if (resolution?.kind === 'definitively_not_sent') {", preparedEnd)
    expect(definiteBranch).toBeGreaterThan(preparedBranch)
    expectOrdered(worker, [
      'const result = await transport(delivery, {',
      "recoveryMode: 'definitively_not_sent'",
      'report.retriedAfterDefinitiveNotSent += 1',
      'return result',
    ], definiteBranch)
  })

  it('keeps the Windows regression proof bound to the post-reservation coordinator stage', () => {
    const proof = fs.readFileSync('scripts/ql7-support/delivery-recovery-proof.mjs', 'utf8')
    expect(proof).toContain("collisionReceipt.decision, 'regenerate_before_transport'")
    expect(proof).toContain("collisionReceipt.reservationDecision, 'reject_before_transport'")
    expect(proof).toContain('transportObservedAfterRegeneration')
    expect(proof).toContain('regenerationCallbacks')
  })
})
