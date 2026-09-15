export const QL7_SUPPORT_ABLATION_RUNNER_VERSION = '5.1.1'

export async function runQl7SupportAblation({
  execute,
  scenario = {},
  ablations = [],
} = {}) {
  if (typeof execute !== 'function') throw new Error('ablation_execute_required')

  const baseline = await execute(scenario, {})
  const rows = []

  for (const rawFeatureId of ablations || []) {
    const featureId = String(rawFeatureId || '').trim()
    if (!featureId) continue
    const result = await execute(scenario, {
      disabledFeatureId: featureId,
      ablation: true,
    })
    rows.push(Object.freeze({
      featureId,
      result,
      changed: JSON.stringify(result) !== JSON.stringify(baseline),
    }))
  }

  return Object.freeze({
    schema: 'ql7.support.lab.ablation-run',
    schemaVersion: QL7_SUPPORT_ABLATION_RUNNER_VERSION,
    baseline,
    ablations: Object.freeze(rows),
  })
}
