import crypto from 'node:crypto'

function hash(value) {
  return crypto
    .createHash('sha256')
    .update(String(value || ''))
    .digest('hex')
}

export const QL7_HUMAN_REVIEW_SAMPLER_VERSION = '5.1.0'

export function selectQl7HumanReviewSample(rows = [], {
  perLocale = 200,
  seed = 'ql7-human-review',
  includeFailures = true,
} = {}) {
  const groups = new Map()
  for (const row of rows) {
    const locale = String(row?.scenario?.locale || row?.locale || 'en')
    if (!groups.has(locale)) groups.set(locale, [])
    groups.get(locale).push(row)
  }

  const selected = []
  for (const [locale, items] of groups) {
    const sorted = [...items].sort((a, b) =>
      hash(`${seed}:${locale}:${a?.scenario?.id || a?.id}`)
        .localeCompare(hash(`${seed}:${locale}:${b?.scenario?.id || b?.id}`)),
    )
    const failures = includeFailures
      ? sorted.filter((row) => row?.oracle?.ok === false)
      : []
    const seen = new Set()

    for (const row of [...failures, ...sorted]) {
      const id = String(row?.scenario?.id || row?.id || hash(JSON.stringify(row)))
      if (seen.has(id)) continue
      seen.add(id)
      selected.push({
        locale,
        scenarioId: id,
        reason: row?.oracle?.ok === false ? 'failure_cluster' : 'stratified_sample',
        reviewState: 'pending',
      })
      if (seen.size >= perLocale) break
    }
  }

  return Object.freeze({
    schema: 'ql7.support.human-review-sample',
    schemaVersion: QL7_HUMAN_REVIEW_SAMPLER_VERSION,
    seed,
    perLocale,
    selected: Object.freeze(selected),
    sampleHash: hash(JSON.stringify(selected)),
  })
}
