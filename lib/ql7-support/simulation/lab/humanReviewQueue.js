import crypto from 'node:crypto'

export const QL7_SUPPORT_HUMAN_REVIEW_QUEUE_VERSION = '5.1.1'
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

function uniqueByScenario(rows = []) {
  const seen = new Set()
  return rows.filter((row) => {
    const id = String(row?.scenarioId || '')
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function buildQl7HumanReviewQueue(
  records = [],
  { perLocale = 200, includeFailures = true, includeNeighbors = true } = {},
) {
  const byLocale = new Map()
  for (const row of records || []) {
    const locale = String(row?.locale || 'en')
    if (!byLocale.has(locale)) byLocale.set(locale, [])
    byLocale.get(locale).push(row)
  }

  const queue = []
  for (const [locale, rows] of byLocale) {
    const failures = rows.filter((row) => row?.ok === false)
    const neighbors = rows.filter((row) => row?.nearestSemanticNeighbors?.length)
    const controls = rows.filter((row) => row?.ok !== false)
    const selected = uniqueByScenario([
      ...(includeFailures ? failures : []),
      ...(includeNeighbors ? neighbors : []),
      ...controls,
    ]).slice(0, Math.max(1, Number(perLocale) || 200))

    for (const row of selected) {
      queue.push(Object.freeze({
        reviewId: `review:${hash({ scenarioId: row.scenarioId, locale })}`,
        scenarioId: String(row.scenarioId || ''),
        locale,
        domainId: String(row.domainId || ''),
        blindPayload: Object.freeze({
          input: row.input || row.userTurns || [],
          output: row.output || row.text || '',
          surface: row.surface || null,
        }),
        requiresTwoReviewers: true,
        reviewerIdentityHiddenFromPeer: true,
        sourceModelHidden: true,
      }))
    }
  }

  return Object.freeze(queue)
}
