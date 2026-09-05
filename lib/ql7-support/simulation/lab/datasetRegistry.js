import crypto from 'node:crypto'

export const QL7_SUPPORT_DATASET_REGISTRY_VERSION = '5.1.1'
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function buildQl7DatasetRegistry(datasets = []) {
  const seen = new Set()
  const rows = []

  for (const source of Array.isArray(datasets) ? datasets : []) {
    const datasetId = String(source?.datasetId || '').trim()
    if (!datasetId) throw new Error('dataset_id_required')
    if (seen.has(datasetId)) throw new Error(`dataset_id_duplicate:${datasetId}`)
    seen.add(datasetId)

    const recordCount = Number(source?.recordCount ?? source?.records?.length ?? 0)
    const checksum = String(source?.checksum || hash(source?.records || []))
    rows.push(Object.freeze({
      datasetId,
      purpose: String(source?.purpose || '').trim(),
      splitClass: String(source?.splitClass || '').trim(),
      checksum,
      sourceClass: String(source?.sourceClass || 'generated'),
      frozen: Boolean(source?.frozen),
      recordCount: Math.max(0, recordCount),
      lineageRootHash: String(source?.lineageRootHash || ''),
      containsProductionSecrets: false,
    }))
  }

  const body = {
    schema: 'ql7.support.lab.dataset-registry',
    schemaVersion: QL7_SUPPORT_DATASET_REGISTRY_VERSION,
    datasets: Object.freeze(rows),
  }
  return Object.freeze({
    ...body,
    registryHash: hash(body),
  })
}
