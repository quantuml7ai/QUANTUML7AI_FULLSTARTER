export const QL7_SUPPORT_POWER_ANALYSIS_VERSION = '5.1.1'

const Z_ALPHA = Object.freeze({
  '0.01': 2.5758293035489004,
  '0.05': 1.959963984540054,
})
const Z_POWER = Object.freeze({
  '0.80': 0.8416212335729143,
  '0.90': 1.2815515655446004,
  '0.95': 1.6448536269514722,
})

function zAlpha(alpha) {
  return Z_ALPHA[Number(alpha).toFixed(2)] || Z_ALPHA['0.05']
}

function zPower(power) {
  const numeric = Number(power)
  if (numeric >= 0.95) return Z_POWER['0.95']
  if (numeric >= 0.9) return Z_POWER['0.90']
  return Z_POWER['0.80']
}

export function approximateTwoProportionSampleSize({
  baseline = 0.01,
  minimumRegression = 0.002,
  alpha = 0.05,
  power = 0.8,
} = {}) {
  const p1 = Number(baseline)
  const delta = Number(minimumRegression)
  const p2 = p1 + delta
  if (!(p1 >= 0 && p1 < 1 && p2 > 0 && p2 < 1 && delta > 0)) {
    throw new Error('power_analysis_probability_invalid')
  }

  const pooled = (p1 + p2) / 2
  const numerator = Math.pow(
    zAlpha(alpha) * Math.sqrt(2 * pooled * (1 - pooled)) +
    zPower(power) * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2,
  )
  return Math.ceil(numerator / Math.pow(delta, 2))
}

export function evaluatePowerAdequacy(options = {}) {
  const requiredSample = approximateTwoProportionSampleSize(options)
  const observedSample = Math.max(0, Number(options?.observedSample || 0))
  const ok = observedSample >= requiredSample
  return Object.freeze({
    schema: 'ql7.support.lab.power-analysis',
    schemaVersion: QL7_SUPPORT_POWER_ANALYSIS_VERSION,
    ok,
    observedSample,
    requiredSample,
    baseline: Number(options?.baseline ?? 0.01),
    minimumRegression: Number(options?.minimumRegression ?? 0.002),
    alpha: Number(options?.alpha ?? 0.05),
    power: Number(options?.power ?? 0.8),
    claim: ok ? 'ADEQUATE' : 'INSUFFICIENT_POWER',
  })
}
