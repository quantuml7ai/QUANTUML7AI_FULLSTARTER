export const QL7_SUPPORT_CONTRADICTION_GUARD_VERSION = '5.1.2'

const norm = (value) => String(value ?? '').toLowerCase().trim()
const includesAny = (text, patterns) => patterns.some((pattern) => {
  pattern.lastIndex = 0
  const hit = pattern.test(text)
  pattern.lastIndex = 0
  return hit
})

const POSITIVE_AVAILABILITY = [
  /\bavailable\b/u,
  /\bactive\b/u,
  /\bдоступен\b/u,
  /\bдоступна\b/u,
  /\bактивен\b/u,
  /\bактивна\b/u,
]
const FUTURE_AVAILABILITY = [
  /\bplanned\b/u,
  /\bпланируется\b/u,
  /\bзапланирован\b/u,
  /\bзапланирована\b/u,
]

// Availability contradiction checks operate on assertions, not raw token co-occurrence.
// A phrase such as "planned and not available yet" is internally consistent and must
// not be treated as an affirmative availability claim merely because it contains the
// token "available".  Remove only explicit local negations around the availability
// adjective, then apply the positive-availability patterns to the remaining text.
const NEGATED_AVAILABILITY = [
  /\b(?:must|should|can|could|may|will|would)\s+not\s+(?:present|describe|treat|consider|report|claim)\b[^.!?]{0,180}\bas\s+(?:(?:confirmed|currently|publicly)\s+){0,2}(?:available|active)\b/gu,
  /\b(?:must|should|can|could|may|will|would)\s+not\s+be\s+(?:presented|described|treated|considered|reported|claimed)\s+as\s+(?:(?:confirmed|currently|publicly)\s+){0,2}(?:available|active)\b/gu,
  /\b(?:cannot|can't|can’t|mustn't|mustn’t|shouldn't|shouldn’t)\s+be\s+(?:presented|described|treated|considered|reported|claimed)\s+as\s+(?:(?:confirmed|currently|publicly)\s+){0,2}(?:available|active)\b/gu,
  /\b(?:is|are|was|were|remains?|currently\s+is|currently\s+are)\s+not\s+(?:(?:yet|currently|now|publicly|generally)\s+){0,2}(?:an?\s+)?(?:available|active)\b/gu,
  /\b(?:isn't|isn’t|aren't|aren’t|wasn't|wasn’t|weren't|weren’t)\s+(?:(?:yet|currently|now|publicly|generally)\s+){0,2}(?:an?\s+)?(?:available|active)\b/gu,
  /\bnot\s+(?:(?:yet|currently|now|publicly|generally)\s+){0,2}(?:available|active)\b/gu,
  /\bnot\s+as\s+(?:an?\s+)?(?:(?:confirmed|currently|publicly)\s+){0,2}(?:available|active)\b/gu,
  /\bnever\s+(?:(?:currently|publicly|generally)\s+){0,2}(?:available|active)\b/gu,
  /\b(?:не|ещ[её]\s+не)\s+(?:(?:сейчас|пока|публично)\s+){0,2}(?:доступен|доступна|активен|активна)\b/gu,
]

function withoutNegatedAvailability(text = '') {
  let value = norm(text)
  for (const pattern of NEGATED_AVAILABILITY) value = value.replace(pattern, ' ')
  return value.replace(/\s+/gu, ' ').trim()
}

function hasAffirmedAvailability(text = '') {
  return includesAny(withoutNegatedAvailability(text), POSITIVE_AVAILABILITY)
}

function rejectedHypotheses(memoryGraph = {}) {
  const raw = [
    ...(memoryGraph?.rejectedHypotheses || []),
    ...(memoryGraph?.rejectedHypothesisLedger || []),
  ]
  return raw
    .map((row) => norm(typeof row === 'string' ? row : row?.hypothesis))
    .filter((value) => value.length > 5)
}

export function evaluateQl7SupportContradictions({
  text = '',
  facts = {},
  memoryGraph = {},
} = {}) {
  const visible = norm(text)
  const failures = []
  const affirmedAvailability = hasAffirmedAvailability(visible)

  if (affirmedAvailability && includesAny(visible, FUTURE_AVAILABILITY)) {
    failures.push('availability_contradiction')
  }

  const factStatus = norm(facts?.status)
  if (
    ['unavailable', 'temporarily_unavailable', 'planned'].includes(factStatus) &&
    affirmedAvailability
  ) {
    failures.push('fact_status_contradiction')
  }

  if (factStatus === 'available' && includesAny(visible, FUTURE_AVAILABILITY)) {
    failures.push('fact_status_contradiction')
  }

  const rejected = rejectedHypotheses(memoryGraph)
  if (rejected.some((hypothesis) => visible.includes(hypothesis))) {
    failures.push('reintroduced_rejected_hypothesis')
  }

  const propositionConflicts = []
  for (const proposition of facts?.propositions || []) {
    if (proposition?.status === 'rejected' && visible.includes(norm(proposition?.text))) {
      propositionConflicts.push(String(proposition?.id || proposition?.text || 'unknown'))
    }
  }
  if (propositionConflicts.length) failures.push('fact_status_contradiction')

  return Object.freeze({
    schema: 'ql7.support.contradiction-guard',
    schemaVersion: QL7_SUPPORT_CONTRADICTION_GUARD_VERSION,
    ok: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    availabilityAssertion: Object.freeze({
      affirmative: affirmedAvailability,
      future: includesAny(visible, FUTURE_AVAILABILITY),
      explicitNegatedPositive: includesAny(visible, NEGATED_AVAILABILITY),
    }),
    rejectedHypothesisCount: rejected.length,
    propositionConflicts: Object.freeze(propositionConflicts),
  })
}
