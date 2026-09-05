import {selectQl7SupportCalibrator} from './calibratorRegistry.js'

export const QL7_SUPPORT_CALIBRATED_POSTERIOR_VERSION = '5.1.1'

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function normalizedSoftmax(rows = [], temperature = 1) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const safeTemperature = Math.max(0.1, finite(temperature, 1))
  const scaled = rows.map((row) => finite(row?.score) / safeTemperature)
  const maxScore = Math.max(...scaled)
  const exponentials = scaled.map((score) => Math.exp(Math.max(-30, Math.min(30, score - maxScore))))
  const total = exponentials.reduce((sum, value) => sum + value, 0) || 1

  return rows.map((row, index) => ({
    ...row,
    pRaw: exponentials[index] / total,
  }))
}

export function calibrateQl7Posterior(rows = [], context = {}) {
  const candidates = Array.isArray(rows) ? rows : []
  const calibrator = selectQl7SupportCalibrator(context)
  const raw = normalizedSoftmax(candidates, calibrator?.temperature)
  const parent = normalizedSoftmax(candidates, calibrator?.parentTemperature)
  const shrinkage = calibrator?.sparseCell ? finite(calibrator?.shrinkageStrength, 0.65) : 0

  const calibrated = raw.map((row, index) => Object.freeze({
    ...row,
    posterior: (1 - shrinkage) * row.pRaw + shrinkage * finite(parent[index]?.pRaw),
    calibrationUncertainty: finite(calibrator?.uncertainty),
  }))

  const total = calibrated.reduce((sum, row) => sum + finite(row.posterior), 0) || 1
  const normalizedRows = calibrated.map((row) => Object.freeze({
    ...row,
    posterior: finite(row.posterior) / total,
  }))

  const probabilityMass = normalizedRows.reduce((sum, row) => sum + finite(row.posterior), 0)
  const valid = normalizedRows.every((row) =>
    Number.isFinite(row.posterior) &&
    row.posterior >= 0 &&
    row.posterior <= 1,
  ) && (normalizedRows.length === 0 || Math.abs(probabilityMass - 1) < 1e-9)

  return Object.freeze({
    schema: 'ql7.support.calibrated-posterior',
    schemaVersion: QL7_SUPPORT_CALIBRATED_POSTERIOR_VERSION,
    calibrator,
    rows: Object.freeze(normalizedRows),
    valid,
    probabilityMass,
    sparseCell: Boolean(calibrator?.sparseCell),
  })
}
