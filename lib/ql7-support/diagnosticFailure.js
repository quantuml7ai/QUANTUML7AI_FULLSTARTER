function str(value) { return String(value ?? '').trim() }

export function classifyQl7SupportDiagnosticFailure(error) {
  const name = str(error?.name).toLowerCase()
  const message = str(error?.message || error).toLowerCase()
  if (name === 'aborterror' || /timeout|timed out|abort/u.test(message)) return 'timeout'
  if (/mongo|database|topology|server selection/u.test(message)) return 'mongo_unavailable'
  if (/redis|upstash|kv/u.test(message)) return 'redis_unavailable'
  if (/provider|deepl|translate|upstream/u.test(message)) return 'provider_unavailable'
  if (/permission|forbidden|unauthor/u.test(message)) return 'forbidden'
  return 'unavailable'
}

export function buildQl7SupportDiagnosticFailureResult({ error, topic = '', caseId = '', now = Date.now } = {}) {
  const branch = classifyQl7SupportDiagnosticFailure(error)
  const at = new Date(typeof now === 'function' ? now() : now || Date.now()).toISOString()
  return {
    ok: false,
    status: branch === 'timeout' ? 'timeout' : 'unavailable',
    branch,
    specializedBranch: branch,
    topic: str(topic),
    caseId: str(caseId),
    runId: `diagnostic-failure:${str(caseId) || 'case'}:${Date.parse(at)}`,
    asOf: at,
    readOnly: true,
    sourceStatus: branch,
    facts: [],
    checks: [],
    anomalies: [],
    recommendations: [],
    businessCollectionsRead: [],
    businessCollectionsWritten: [],
    sourceContract: null,
    internalFailureCategory: branch,
    userSafe: true,
  }
}
