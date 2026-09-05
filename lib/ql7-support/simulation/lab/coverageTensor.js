export const QL7_SUPPORT_FACTORIAL_AXES = Object.freeze([
  'locale',
  'domainId',
  'microtopicId',
  'intentId',
  'speechAct',
  'emotionClass',
  'safetyClass',
  'memoryTransition',
  'userExpertise',
  'responseLength',
  'formality',
  'inputQuality',
  'mutationFamily',
  'providerState',
  'dataAvailability',
  'restrictionState',
  'concurrencyState',
  'surfaceBrowser',
])
export const QL7_SUPPORT_COVERAGE_TENSOR_VERSION = '5.1.1'

function keyFor(row, axes) {
  return axes.map((axis) => String(row?.[axis] ?? '')).join('\u001f')
}

export function buildCoverageTensor(rows = [], axes = QL7_SUPPORT_FACTORIAL_AXES) {
  const source = Array.isArray(rows) ? rows : []
  const dimensions = [...axes]
  const cells = new Map()
  const marginals = Object.fromEntries(dimensions.map((axis) => [axis, new Map()]))

  for (const row of source) {
    const key = keyFor(row, dimensions)
    cells.set(key, (cells.get(key) || 0) + 1)

    for (const axis of dimensions) {
      const value = String(row?.[axis] ?? '')
      const marginal = marginals[axis]
      marginal.set(value, (marginal.get(value) || 0) + 1)
    }
  }

  return Object.freeze({
    schema: 'ql7.support.lab.coverage-tensor',
    schemaVersion: QL7_SUPPORT_COVERAGE_TENSOR_VERSION,
    axes: Object.freeze(dimensions),
    cellCount: cells.size,
    totalRows: source.length,
    cells: Object.freeze(Object.fromEntries(cells)),
    marginals: Object.freeze(
      Object.fromEntries(
        Object.entries(marginals).map(([axis, values]) => [
          axis,
          Object.freeze(Object.fromEntries(values)),
        ]),
      ),
    ),
  })
}

export function findRequiredCoverageHoles(
  rows = [],
  requiredCells = [],
  axes = QL7_SUPPORT_FACTORIAL_AXES,
) {
  const tensor = buildCoverageTensor(rows, axes)
  const holes = []
  for (const cell of requiredCells || []) {
    if (!tensor.cells[keyFor(cell, axes)]) holes.push(Object.freeze({ ...cell }))
  }

  return Object.freeze({
    ok: holes.length === 0,
    holes: Object.freeze(holes),
    tensor,
    uncoveredCellCount: holes.length,
  })
}

export function auditHighRiskCoverage(rows = [], requiredPairs = []) {
  const source = Array.isArray(rows) ? rows : []
  const failures = []

  for (const requirement of requiredPairs || []) {
    const count = source.filter((row) =>
      Object.entries(requirement?.where || {}).every(
        ([key, value]) => String(row?.[key]) === String(value),
      ),
    ).length
    const minimum = Number(requirement?.min || 1)
    if (count < minimum) {
      failures.push(Object.freeze({
        code: 'high_risk_cell_undercovered',
        where: Object.freeze({ ...(requirement?.where || {}) }),
        required: minimum,
        observed: count,
      }))
    }
  }

  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
  })
}
