import crypto from 'node:crypto'

export const QL7_SUPPORT_ORACLE_PROCESS_PROTOCOL_VERSION = '5.1.1'

const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

function assertPlainMessage(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(code)
}

export function buildOracleRequest({
  oracleId,
  scenario,
  evidence,
} = {}) {
  assertPlainMessage(scenario, 'oracle_scenario_required')
  const body = {
    schema: 'ql7.support.oracle-request',
    schemaVersion: QL7_SUPPORT_ORACLE_PROCESS_PROTOCOL_VERSION,
    oracleId: String(oracleId || ''),
    scenario,
    evidence,
    productionDecisionImportsAllowed: false,
  }
  if (!body.oracleId) throw new Error('oracle_id_required')
  return Object.freeze({
    ...body,
    requestHash: hash(body),
  })
}

export function buildOracleResponse({
  requestHash,
  oracleId,
  verdict,
  failures = [],
  metadata = {},
} = {}) {
  const normalizedVerdict = String(verdict || '')
  if (!['pass', 'fail', 'abstain'].includes(normalizedVerdict)) {
    throw new Error('oracle_verdict_invalid')
  }
  const body = {
    schema: 'ql7.support.oracle-response',
    schemaVersion: QL7_SUPPORT_ORACLE_PROCESS_PROTOCOL_VERSION,
    requestHash: String(requestHash || ''),
    oracleId: String(oracleId || ''),
    verdict: normalizedVerdict,
    failures: Object.freeze([...(failures || [])].map(String)),
    metadata: Object.freeze({ ...(metadata || {}) }),
  }
  if (!body.requestHash || !body.oracleId) throw new Error('oracle_response_identity_required')
  return Object.freeze({
    ...body,
    responseHash: hash(body),
  })
}
