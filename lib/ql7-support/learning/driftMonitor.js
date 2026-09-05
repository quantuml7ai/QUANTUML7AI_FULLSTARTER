export const QL7_SUPPORT_DRIFT_MONITOR_VERSION = '5.1.1'

function psi(base = [], current = []) {
  let total = 0
  const count = Math.max(base.length, current.length)
  for (let index = 0; index < count; index += 1) {
    const left = Math.max(1e-9, Number(base[index] || 0))
    const right = Math.max(1e-9, Number(current[index] || 0))
    total += (right - left) * Math.log(right / left)
  }
  return total
}

export function measureQl7SupportDrift({
  featureBase = [],
  featureCurrent = [],
  posteriorEceBase = 0,
  posteriorEceCurrent = 0,
  abstentionBase = 0,
  abstentionCurrent = 0,
  providerBase = 0,
  providerCurrent = 0,
  noveltyBase = 0,
  noveltyCurrent = 0,
  memoryBase = 0,
  memoryCurrent = 0,
  safetyFpBase = 0,
  safetyFpCurrent = 0,
} = {}) {
  const receipt = {
    schema: 'ql7.support.learning-drift',
    schemaVersion: QL7_SUPPORT_DRIFT_MONITOR_VERSION,
    featurePsi: psi(featureBase, featureCurrent),
    posteriorCalibrationDelta: Number(posteriorEceCurrent) - Number(posteriorEceBase),
    abstentionDelta: Number(abstentionCurrent) - Number(abstentionBase),
    providerLanguageDelta: Number(providerCurrent) - Number(providerBase),
    noveltyCollisionDelta: Number(noveltyCurrent) - Number(noveltyBase),
    memoryTransitionDelta: Number(memoryCurrent) - Number(memoryBase),
    safetyFalsePositiveDelta: Number(safetyFpCurrent) - Number(safetyFpBase),
    autoPromotionAllowed: false,
  }

  const alertReasons = []
  if (receipt.featurePsi > 0.25) alertReasons.push('feature_distribution')
  if (Math.abs(receipt.posteriorCalibrationDelta) > 0.02) alertReasons.push('posterior_calibration')
  if (receipt.safetyFalsePositiveDelta > 0) alertReasons.push('safety_false_positive')
  if (receipt.noveltyCollisionDelta > 0.01) alertReasons.push('novelty_collision')

  return Object.freeze({
    ...receipt,
    driftAlert: alertReasons.length > 0,
    alertReasons: Object.freeze(alertReasons),
  })
}
