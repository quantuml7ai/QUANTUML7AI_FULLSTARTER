import {cohenKappaInterval} from './statisticalEngine.js'

export const QL7_SUPPORT_REVIEW_AGREEMENT_VERSION = '5.1.1'

export function cohenKappa(left = [], right = []) {
  const rightByScenario = new Map((right || []).map((row) => [row.scenarioId, row]))
  let total = 0
  let agree = 0
  let leftPass = 0
  let rightPass = 0
  const disagreements = []

  for (const leftRow of left || []) {
    const rightRow = rightByScenario.get(leftRow?.scenarioId)
    if (!rightRow) continue

    const leftVerdict = String(leftRow?.verdict || '').toLowerCase()
    const rightVerdict = String(rightRow?.verdict || '').toLowerCase()
    if (!['pass', 'fail'].includes(leftVerdict) || !['pass', 'fail'].includes(rightVerdict)) continue

    total += 1
    if (leftVerdict === rightVerdict) agree += 1
    else disagreements.push(Object.freeze({
      scenarioId: leftRow.scenarioId,
      left: leftVerdict,
      right: rightVerdict,
      requiresTieBreaker: true,
    }))

    if (leftVerdict === 'pass') leftPass += 1
    if (rightVerdict === 'pass') rightPass += 1
  }

  const agreement = total ? agree / total : 0
  const leftRate = total ? leftPass / total : 0
  const rightRate = total ? rightPass / total : 0
  const expected = leftRate * rightRate + (1 - leftRate) * (1 - rightRate)
  const kappa = expected < 1 ? (agreement - expected) / (1 - expected) : 1

  return Object.freeze({
    schema: 'ql7.support.lab.review-agreement',
    schemaVersion: QL7_SUPPORT_REVIEW_AGREEMENT_VERSION,
    total,
    agreement,
    kappa,
    interval: cohenKappaInterval({ agree, total, leftPass, rightPass }),
    disagreements: Object.freeze(disagreements),
    requiresTieBreaker: disagreements.length > 0,
  })
}

export function adjudicateReviews({ left = [], right = [], tieBreaker = [] } = {}) {
  const base = cohenKappa(left, right)
  const tieByScenario = new Map((tieBreaker || []).map((row) => [row.scenarioId, row]))
  const rightByScenario = new Map((right || []).map((row) => [row.scenarioId, row]))
  const final = []

  for (const leftRow of left || []) {
    const rightRow = rightByScenario.get(leftRow?.scenarioId)
    if (!rightRow) continue

    const leftVerdict = String(leftRow?.verdict || '').toLowerCase()
    const rightVerdict = String(rightRow?.verdict || '').toLowerCase()
    if (leftVerdict === rightVerdict) {
      final.push({ scenarioId: leftRow.scenarioId, verdict: leftVerdict, source: 'agreement' })
      continue
    }

    const tie = tieByScenario.get(leftRow.scenarioId)
    const verdict = String(tie?.verdict || '').toLowerCase()
    if (!['pass', 'fail'].includes(verdict)) {
      final.push({ scenarioId: leftRow.scenarioId, verdict: 'unresolved', source: 'tie_breaker_missing' })
    } else {
      final.push({ scenarioId: leftRow.scenarioId, verdict, source: 'tie_breaker' })
    }
  }

  const unresolved = final.filter((row) => row.verdict === 'unresolved')
  return Object.freeze({
    ok: unresolved.length === 0,
    base,
    final: Object.freeze(final),
    unresolved: Object.freeze(unresolved),
  })
}
