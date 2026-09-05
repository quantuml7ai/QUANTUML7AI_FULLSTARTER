import {QL7_SUPPORT_RELEASE_DOMAIN_ROOTS} from './domainOntology.js'
import {QL7_SUPPORT_MICROTOPICS} from './microtopicOntology.js'
import {QL7_SUPPORT_INTENT_ONTOLOGY} from './intentOntology.js'
import {QL7_SUPPORT_SPEECH_ACTS} from './speechActOntology.js'

export const QL7_SUPPORT_ONTOLOGY_QUERY_VERSION = '5.1.1'

const str = (value) => String(value ?? '').trim()

export function queryQl7SupportOntology({
  domainId = '',
  microtopicId = '',
  intentId = '',
  speechActId = '',
} = {}) {
  const requestedDomain = str(domainId)
  const domain = QL7_SUPPORT_RELEASE_DOMAIN_ROOTS.includes(requestedDomain)
    ? requestedDomain
    : ''

  const microtopics = QL7_SUPPORT_MICROTOPICS.filter((row) =>
    (!domain || row.domainId === domain) &&
    (!microtopicId || row.microtopicId === microtopicId),
  )

  return Object.freeze({
    schema: 'ql7.support.ontology-query-result',
    schemaVersion: QL7_SUPPORT_ONTOLOGY_QUERY_VERSION,
    domainId: domain,
    microtopics: Object.freeze(microtopics),
    intent: QL7_SUPPORT_INTENT_ONTOLOGY.find((row) => row.intentId === intentId) || null,
    speechAct: QL7_SUPPORT_SPEECH_ACTS.find((row) => row.speechActId === speechActId) || null,
    unknownDomain: Boolean(requestedDomain && !domain),
  })
}

export function findQl7SupportMicrotopics({
  domainId = '',
  query = '',
  limit = 8,
} = {}) {
  const domain = str(domainId)
  const tokens = str(query)
    .toLowerCase()
    .split(/[^\p{L}\p{N}_-]+/u)
    .filter(Boolean)

  const rows = QL7_SUPPORT_MICROTOPICS
    .filter((row) => !domain || row.domainId === domain)
    .map((row) => {
      const haystack = [
        row.microtopicId,
        row.label,
        ...(row.aliases || []),
      ].join(' ').toLowerCase()
      const score = tokens.reduce(
        (sum, token) => sum + (haystack.includes(token) ? 1 : 0),
        0,
      )
      return {
        ...row,
        score,
        queryEvidence: Object.freeze(tokens.filter((token) => haystack.includes(token))),
      }
    })
    .sort((left, right) =>
      right.score - left.score ||
      String(left.microtopicId).localeCompare(String(right.microtopicId)),
    )

  const boundedLimit = Math.max(1, Math.min(100, Number(limit) || 8))
  return Object.freeze(rows.slice(0, boundedLimit).map(Object.freeze))
}
