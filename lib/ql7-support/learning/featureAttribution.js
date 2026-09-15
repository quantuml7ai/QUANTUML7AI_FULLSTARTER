export const QL7_SUPPORT_FEATURE_ATTRIBUTION_VERSION = '5.1.1'

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function attributeQl7SupportFeatures({
  features = [],
  baselineScore = 0,
  candidateScore = 0,
} = {}) {
  const rows = (Array.isArray(features) ? features : []).map((feature) => {
    const value = finite(feature?.value ?? feature?.normalizedValue)
    const weight = finite(feature?.weight, 0)
    const contribution = Number.isFinite(Number(feature?.contribution))
      ? Number(feature.contribution)
      : value * weight

    return Object.freeze({
      featureId: String(feature?.featureId || feature?.id || ''),
      featureFamily: String(feature?.featureFamily || ''),
      value,
      weight,
      contribution,
      provenance: feature?.provenance || null,
      sourceReceiptHash: String(feature?.sourceReceiptHash || ''),
    })
  })

  const baseline = finite(baselineScore)
  const candidate = finite(candidateScore)
  const explainedDelta = rows.reduce((sum, row) => sum + row.contribution, 0)

  return Object.freeze({
    schema: 'ql7.support.feature-attribution',
    schemaVersion: QL7_SUPPORT_FEATURE_ATTRIBUTION_VERSION,
    baselineScore: baseline,
    candidateScore: candidate,
    delta: candidate - baseline,
    explainedDelta,
    residualDelta: (candidate - baseline) - explainedDelta,
    features: Object.freeze(rows),
  })
}
