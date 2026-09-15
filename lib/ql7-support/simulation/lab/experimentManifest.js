import crypto from 'node:crypto'

export const QL7_SUPPORT_EXPERIMENT_MANIFEST_VERSION = '5.1.1'

const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const uniqueStrings = (values = []) => Object.freeze(
  [...new Set((values || []).map(String).map((value) => value.trim()).filter(Boolean))],
)

export function createExperimentManifest(input = {}) {
  const body = {
    schema: 'ql7.support.lab.experiment-manifest',
    schemaVersion: QL7_SUPPORT_EXPERIMENT_MANIFEST_VERSION,
    experimentId: String(input.experimentId || input.planId || '').trim(),
    planId: String(input.planId || '').trim(),
    planHash: String(input.planHash || '').trim(),
    sourceCommit: String(input.sourceCommit || '').trim(),
    runtimeHash: String(input.runtimeHash || '').trim(),
    ontologyHash: String(input.ontologyHash || '').trim(),
    bankHash: String(input.bankHash || '').trim(),
    calibrationHash: String(input.calibrationHash || '').trim(),
    seed: String(input.seed || '').trim(),
    splitId: String(input.splitId || 'frozen-acceptance').trim(),
    primaryMetrics: uniqueStrings(input.primaryMetrics),
    hardInvariants: uniqueStrings(input.hardInvariants),
    alpha: Number(input.alpha ?? 0.05),
    powerTarget: Number(input.powerTarget ?? 0.8),
    minimumMeaningfulRegressions: Object.freeze({ ...(input.minimumMeaningfulRegressions || {}) }),
    hypothesisFamilies: uniqueStrings(input.hypothesisFamilies),
    correctionMethod: String(input.correctionMethod || 'holm-bonferroni'),
    stopRules: uniqueStrings(input.stopRules || ['hard_invariant_failure', 'resource_budget']),
    resourceBudget: Object.freeze({ ...(input.resourceBudget || {}) }),
    preregistered: true,
  }

  if (!body.experimentId || !body.planHash || !body.seed) {
    throw new Error('experiment_manifest_identity_required')
  }
  if (!(body.alpha > 0 && body.alpha < 1)) throw new Error('experiment_manifest_alpha_invalid')
  if (!(body.powerTarget > 0 && body.powerTarget < 1)) throw new Error('experiment_manifest_power_invalid')

  return Object.freeze({
    ...body,
    manifestHash: hash(body),
  })
}
