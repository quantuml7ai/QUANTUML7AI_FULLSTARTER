import crypto from 'node:crypto'

export const QL7_SUPPORT_DATASET_SPLITS = Object.freeze([
  'candidate',
  'development',
  'calibration',
  'frozen-acceptance-a',
  'frozen-acceptance-b',
  'external-challenge',
  'production-shadow',
])
export const QL7_SUPPORT_SPLIT_ALLOCATOR_VERSION = '5.1.1'

function unitInterval(value) {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest()
    .readUInt32BE(0) / 0xffffffff
}

/**
 * Semantic family is the atomic split unit.
 * Dialogue descendants and mutations must never cross independent data splits.
 */
export function allocateDatasetSplit({
  familyId = '',
  lineageId = '',
  rootFamilyId = '',
  seed = '',
} = {}) {
  const splitUnitId = String(rootFamilyId || familyId || lineageId).trim()
  if (!splitUnitId) throw new Error('dataset_split_unit_required')

  const value = unitInterval(`${seed}:${splitUnitId}`)
  const split =
    value < 0.12 ? 'candidate' :
    value < 0.24 ? 'development' :
    value < 0.34 ? 'calibration' :
    value < 0.59 ? 'frozen-acceptance-a' :
    value < 0.84 ? 'frozen-acceptance-b' :
    value < 0.94 ? 'external-challenge' :
    'production-shadow'

  return Object.freeze({
    schema: 'ql7.support.lab.dataset-split',
    schemaVersion: QL7_SUPPORT_SPLIT_ALLOCATOR_VERSION,
    split,
    valid: QL7_SUPPORT_DATASET_SPLITS.includes(split),
    unit: 'semantic-family-root',
    splitUnitId,
    lineageId: String(lineageId || ''),
    seedHash: crypto.createHash('sha256').update(String(seed || '')).digest('hex'),
  })
}
