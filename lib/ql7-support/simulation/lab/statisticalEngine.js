export const QL7_SUPPORT_STATISTICAL_ENGINE_VERSION = '5.1.1'

function zForAlpha(alpha = 0.05) {
  if (Math.abs(alpha - 0.01) < 1e-9) return 2.5758293035489004
  if (Math.abs(alpha - 0.10) < 1e-9) return 1.6448536269514722
  return 1.959963984540054
}

export function clopperPearsonUpperZero(n, { alpha = 0.05 } = {}) {
  const total = Number(n)
  if (!Number.isFinite(total) || total <= 0) return Number.NaN
  return 1 - Math.pow(alpha, 1 / total)
}

export function wilsonInterval(successes, total, { alpha = 0.05 } = {}) {
  const n = Number(total)
  const x = Number(successes)
  if (!(n > 0) || !(x >= 0 && x <= n)) {
    return { low: Number.NaN, high: Number.NaN }
  }

  const z = zForAlpha(alpha)
  const p = x / n
  const denominator = 1 + z * z / n
  const center = (p + z * z / (2 * n)) / denominator
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / denominator

  return Object.freeze({
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
    method: 'wilson',
    alpha,
  })
}

export function punitiveFalsePositiveClaim({
  falsePositives = 0,
  total = 0,
  alpha = 0.05,
  limit = 0.00001,
} = {}) {
  const fp = Number(falsePositives)
  const n = Number(total)
  const upperBound = fp === 0
    ? clopperPearsonUpperZero(n, { alpha })
    : wilsonInterval(fp, n, { alpha }).high

  return Object.freeze({
    method: fp === 0 ? 'clopper-pearson-zero-exact' : 'wilson',
    falsePositives: fp,
    total: n,
    alpha,
    upperBound,
    limit,
    ok: fp === 0 && n >= 299572 && upperBound < limit,
    scope: 'punitive_false_positive_benign_hard_negatives_only',
  })
}

function seededRandom(seed = 1) {
  let state = (Number(seed) || 1) >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export function bootstrapMeanInterval(
  values = [],
  { alpha = 0.05, iterations = 2000, seed = 51051 } = {},
) {
  const source = (values || []).map(Number).filter(Number.isFinite)
  if (!source.length) {
    return Object.freeze({ ok: false, reason: 'INSUFFICIENT_SUPPORT', n: 0 })
  }

  const random = seededRandom(seed)
  const means = []
  const iterationsCount = Math.max(200, Number(iterations) || 2000)
  for (let iteration = 0; iteration < iterationsCount; iteration += 1) {
    let sum = 0
    for (let index = 0; index < source.length; index += 1) {
      sum += source[Math.floor(random() * source.length)]
    }
    means.push(sum / source.length)
  }

  means.sort((left, right) => left - right)
  const lowIndex = Math.floor((alpha / 2) * means.length)
  const highIndex = Math.min(
    means.length - 1,
    Math.ceil((1 - alpha / 2) * means.length) - 1,
  )
  const mean = source.reduce((sum, value) => sum + value, 0) / source.length

  return Object.freeze({
    ok: true,
    n: source.length,
    mean,
    low: means[lowIndex],
    high: means[highIndex],
    alpha,
    iterations: means.length,
    seed,
    method: 'percentile-bootstrap',
  })
}

export function confusionMetrics({ tp = 0, tn = 0, fp = 0, fn = 0 } = {}) {
  const divide = (left, right) => right ? Number(left) / Number(right) : null
  const truePositive = Number(tp)
  const trueNegative = Number(tn)
  const falsePositive = Number(fp)
  const falseNegative = Number(fn)

  return Object.freeze({
    tp: truePositive,
    tn: trueNegative,
    fp: falsePositive,
    fn: falseNegative,
    precision: divide(truePositive, truePositive + falsePositive),
    recall: divide(truePositive, truePositive + falseNegative),
    fpr: divide(falsePositive, falsePositive + trueNegative),
    fnr: divide(falseNegative, falseNegative + truePositive),
    accuracy: divide(
      truePositive + trueNegative,
      truePositive + trueNegative + falsePositive + falseNegative,
    ),
  })
}

export function cohenKappaInterval({
  agree = 0,
  total = 0,
  leftPass = 0,
  rightPass = 0,
  alpha = 0.05,
} = {}) {
  const n = Number(total)
  if (n < 2) {
    return Object.freeze({ ok: false, reason: 'INSUFFICIENT_SUPPORT', total: n })
  }

  const observedAgreement = Number(agree) / n
  const leftPassRate = Number(leftPass) / n
  const rightPassRate = Number(rightPass) / n
  const expectedAgreement =
    leftPassRate * rightPassRate +
    (1 - leftPassRate) * (1 - rightPassRate)
  const kappa = expectedAgreement < 1
    ? (observedAgreement - expectedAgreement) / (1 - expectedAgreement)
    : 1

  const z = zForAlpha(alpha)
  const standardError =
    Math.sqrt(Math.max(1e-12, (observedAgreement * (1 - observedAgreement)) / n)) /
    Math.max(1e-9, 1 - expectedAgreement)

  return Object.freeze({
    ok: true,
    total: n,
    kappa,
    low: Math.max(-1, kappa - z * standardError),
    high: Math.min(1, kappa + z * standardError),
    alpha,
    method: 'asymptotic-kappa',
  })
}
