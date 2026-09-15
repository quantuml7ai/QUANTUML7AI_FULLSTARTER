import crypto from 'node:crypto'

export const QL7_SUPPORT_DISTRIBUTED_COORDINATOR_VERSION = '5.1.1'

const leases = new Map()
const token = () => crypto.randomBytes(16).toString('hex')
const keyFor = (runId, shardId) => `${String(runId)}:${String(shardId)}`

export function acquireShardLease({
  runId,
  planHash,
  shardId,
  workerId,
  ttlMs = 60000,
  now = Date.now(),
} = {}) {
  const key = keyFor(runId, shardId)
  const prior = leases.get(key)
  if (prior && prior.leaseExpiresAt > now) throw new Error('shard_already_leased')

  const row = Object.freeze({
    schema: 'ql7.support.lab.shard-lease',
    schemaVersion: QL7_SUPPORT_DISTRIBUTED_COORDINATOR_VERSION,
    runId: String(runId || ''),
    planHash: String(planHash || ''),
    shardId: String(shardId || ''),
    workerId: String(workerId || ''),
    leaseEpoch: Number(prior?.leaseEpoch || 0) + 1,
    fencingToken: token(),
    leaseExpiresAt: Number(now) + Math.max(1000, Number(ttlMs || 60000)),
    attempt: Number(prior?.attempt || 0) + 1,
  })
  if (!row.runId || !row.planHash || !row.shardId || !row.workerId) {
    throw new Error('shard_lease_identity_required')
  }

  leases.set(key, row)
  return row
}

export function verifyShardLease(lease, { now = Date.now() } = {}) {
  const current = leases.get(keyFor(lease?.runId, lease?.shardId))
  return Boolean(
    current &&
    current.fencingToken === lease?.fencingToken &&
    current.leaseEpoch === lease?.leaseEpoch &&
    current.leaseExpiresAt >= Number(now),
  )
}

export function releaseShardLease(lease) {
  const key = keyFor(lease?.runId, lease?.shardId)
  const current = leases.get(key)
  if (
    current &&
    current.fencingToken === lease?.fencingToken &&
    current.leaseEpoch === lease?.leaseEpoch
  ) {
    leases.delete(key)
    return true
  }
  return false
}
