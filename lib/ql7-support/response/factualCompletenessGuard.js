export const QL7_SUPPORT_FACTUAL_COMPLETENESS_GUARD_VERSION = '5.1.1'

const UNCERTAIN_STATUSES = new Set([
  'unavailable',
  'source_unavailable',
  'contradiction',
  'unknown',
  'temporarily_unavailable',
])

function factIdSet(contentPlan = {}) {
  const projection = contentPlan?.factProjection || {}
  const rows = Array.isArray(projection?.facts)
    ? projection.facts
    : Object.entries(projection?.facts || {}).map(([id, value]) => ({ id, value }))
  return new Set(
    rows
      .map((row) => String(row?.factId || row?.id || '').trim())
      .filter(Boolean),
  )
}

export function evaluateQl7SupportFactualCompleteness({
  contentPlan = {},
  text = '',
} = {}) {
  const visible = String(text ?? '').trim()
  const projection = contentPlan?.factProjection || {}
  const verified = projection?.verified === true
  const status = String(projection?.status || contentPlan?.resultKind || '')
  const unavailable = UNCERTAIN_STATUSES.has(status)
  const requiredFactIds = [
    ...(contentPlan?.requiredFactIds || []),
    ...(projection?.requiredFactIds || []),
  ].map(String).filter(Boolean)
  const availableFactIds = factIdSet(contentPlan)
  const missingFactIds = [...new Set(requiredFactIds)].filter((id) => !availableFactIds.has(id))

  const failures = []
  if (verified && !visible) failures.push('verified_fact_missing')
  if (unavailable && !visible) failures.push('uncertainty_missing')
  if (missingFactIds.length && verified) failures.push('verified_fact_missing')

  return Object.freeze({
    schema: 'ql7.support.factual-completeness-guard',
    schemaVersion: QL7_SUPPORT_FACTUAL_COMPLETENESS_GUARD_VERSION,
    ok: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    verified,
    unavailable,
    status,
    requiredFactIds: Object.freeze([...new Set(requiredFactIds)]),
    availableFactIds: Object.freeze([...availableFactIds]),
    missingFactIds: Object.freeze(missingFactIds),
  })
}
