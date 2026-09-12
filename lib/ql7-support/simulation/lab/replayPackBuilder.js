import crypto from 'node:crypto'

export const QL7_SUPPORT_REPLAY_PACK_VERSION = '5.1.1'
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function buildReplayPack(row = {}) {
  const body = {
    schema: 'ql7.support.replay-pack',
    schemaVersion: QL7_SUPPORT_REPLAY_PACK_VERSION,
    scenario: row?.scenario,
    turn: row?.turn,
    expected: row?.scenario?.expected || {},
    productionReceiptHash: row?.productionDelivery?.receipt?.receiptHash || '',
    productionSemanticHash: row?.productionDelivery?.semanticHash || '',
    oracleFailures: Object.freeze([...(row?.oracle?.failures || [])]),
    evidenceHash: hash(row?.evidence || {}),
    sourceCommit: String(row?.sourceCommit || ''),
    runtimeHash: String(row?.runtimeHash || ''),
    deterministicSeed: String(row?.scenario?.seed || row?.seed || ''),
  }

  return Object.freeze({
    ...body,
    replayHash: hash(body),
  })
}
