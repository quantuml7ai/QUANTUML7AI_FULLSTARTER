export const QL7_SUPPORT_CALIBRATION_METRICS_VERSION = '5.1.1'

export function calibrationMetrics(rows = [], bins = 10) {
  const source = Array.isArray(rows) ? rows : []
  const binCount = Math.max(2, Math.min(100, Math.floor(Number(bins) || 10)))
  const buckets = Array.from({ length: binCount }, () => ({ n: 0, p: 0, y: 0 }))
  let brier = 0
  let nll = 0

  for (const row of source) {
    const rawConfidence = Number(row?.confidence)
    if (!Number.isFinite(rawConfidence)) throw new Error('calibration_confidence_invalid')
    const p = Math.max(1e-9, Math.min(1 - 1e-9, rawConfidence))
    const y = row?.correct ? 1 : 0
    brier += (p - y) ** 2
    nll += -(y * Math.log(p) + (1 - y) * Math.log(1 - p))

    const index = Math.min(binCount - 1, Math.floor(p * binCount))
    buckets[index].n += 1
    buckets[index].p += p
    buckets[index].y += y
  }

  let ece = 0
  let mce = 0
  const reliability = []
  for (const [index, bucket] of buckets.entries()) {
    if (!bucket.n) {
      reliability.push(Object.freeze({ index, n: 0, meanConfidence: 0, accuracy: 0, gap: 0 }))
      continue
    }
    const meanConfidence = bucket.p / bucket.n
    const accuracy = bucket.y / bucket.n
    const gap = Math.abs(meanConfidence - accuracy)
    ece += gap * bucket.n / (source.length || 1)
    mce = Math.max(mce, gap)
    reliability.push(Object.freeze({ index, n: bucket.n, meanConfidence, accuracy, gap }))
  }

  return Object.freeze({
    schema: 'ql7.support.lab.calibration-metrics',
    schemaVersion: QL7_SUPPORT_CALIBRATION_METRICS_VERSION,
    n: source.length,
    brier: source.length ? brier / source.length : 0,
    nll: source.length ? nll / source.length : 0,
    ece,
    mce,
    bins: Object.freeze(buckets.map((bucket) => Object.freeze({ ...bucket }))),
    reliability: Object.freeze(reliability),
  })
}
