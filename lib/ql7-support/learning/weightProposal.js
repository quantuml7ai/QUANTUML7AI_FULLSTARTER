import crypto from 'node:crypto'

export const QL7_SUPPORT_WEIGHT_PROPOSAL_VERSION = '5.1.1'
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

export function buildQl7SupportWeightProposal({
  owner = '',
  changes = [],
  evidenceIds = [],
  bounds = { min: -5, max: 5 },
  reason = '',
} = {}) {
  const min = finite(bounds?.min, -5)
  const max = finite(bounds?.max, 5)
  if (!(min < max)) throw new Error('weight_proposal_invalid_bounds')

  const normalized = (Array.isArray(changes) ? changes : []).map((row) => {
    const featureId = String(row?.featureId || '').trim()
    if (!featureId) throw new Error('weight_proposal_feature_id_required')

    const before = finite(row?.before)
    const after = finite(row?.after)
    if (before < min || before > max || after < min || after > max) {
      throw new Error('weight_proposal_out_of_bounds')
    }

    return Object.freeze({
      featureId,
      before,
      after,
      delta: after - before,
      sensitive: /safety|economic|quarantine|composer/iu.test(featureId),
    })
  })

  const evidence = Object.freeze(
    [...new Set((evidenceIds || []).map(String).map((value) => value.trim()).filter(Boolean))],
  )
  const body = {
    schema: 'ql7.support.weight-proposal',
    schemaVersion: QL7_SUPPORT_WEIGHT_PROPOSAL_VERSION,
    owner: String(owner || ''),
    changes: Object.freeze(normalized),
    evidenceIds: evidence,
    reason: String(reason || ''),
    bounds: Object.freeze({ min, max }),
    requiresApproval: true,
    evidenceRequired: normalized.length > 0,
  }

  return Object.freeze({
    ...body,
    proposalHash: hash(body),
  })
}
