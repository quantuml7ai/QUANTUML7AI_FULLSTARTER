import crypto from 'node:crypto'

export const QL7_SUPPORT_WORKER_LEASE_VERSION = '5.1.1'

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

export function createQl7WorkerLease({
  workerId = '',
  shardId = '',
  leaseMs = 30_000,
  now = Date.now(),
  fencingToken = 1,
} = {}) {
  const started = Number(now) || Date.now()
  const worker = String(workerId || '').trim()
  const shard = String(shardId || '').trim()
  const fence = Math.max(1, Number(fencingToken || 1))
  if (!worker || !shard) throw new Error('worker_lease_identity_required')

  return Object.freeze({
    schema: 'ql7.support.lab.worker-lease',
    schemaVersion: QL7_SUPPORT_WORKER_LEASE_VERSION,
    leaseId: `lease:${hash(`${worker}:${shard}:${started}:${fence}`)}`,
    workerId: worker,
    shardId: shard,
    fencingToken: fence,
    startedAt: new Date(started).toISOString(),
    expiresAt: new Date(started + Math.max(1000, Number(leaseMs) || 30000)).toISOString(),
  })
}

export function validateQl7WorkerLease(lease = {}, now = Date.now()) {
  const expiry = Date.parse(lease?.expiresAt)
  const fencingToken = Number(lease?.fencingToken || 0)
  const failures = []
  if (!lease?.leaseId) failures.push('lease_id_missing')
  if (!lease?.workerId) failures.push('worker_id_missing')
  if (!lease?.shardId) failures.push('shard_id_missing')
  if (!(fencingToken > 0)) failures.push('fencing_token_invalid')
  if (!(expiry > Number(now))) failures.push('lease_expired')

  return Object.freeze({
    ok: failures.length === 0,
    fencingToken,
    failures: Object.freeze(failures),
  })
}
