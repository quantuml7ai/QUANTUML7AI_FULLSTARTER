import crypto from 'node:crypto'

export const QL7_SUPPORT_FAILURE_CLUSTERER_VERSION = '5.1.1'
const shortHash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16)

export function clusterFailures(rows = []) {
  const clusters = new Map()

  for (const row of Array.isArray(rows) ? rows : []) {
    const failureCode = String(row?.failureCode || row?.code || 'unknown')
    const rootStage = String(row?.rootStage || 'unknown')
    const locale = String(row?.locale || '')
    const domainId = String(row?.domainId || '')
    const microtopicId = String(row?.microtopicId || '')
    const key = `${rootStage}:${failureCode}:${locale}:${domainId}:${microtopicId}`

    if (!clusters.has(key)) {
      clusters.set(key, {
        clusterId: shortHash(key),
        failureCode,
        rootStage,
        locale,
        domainId,
        microtopicId,
        scenarioIds: [],
        evidenceIds: [],
      })
    }

    const cluster = clusters.get(key)
    cluster.scenarioIds.push(String(row?.scenarioId || ''))
    if (row?.evidenceId) cluster.evidenceIds.push(String(row.evidenceId))
  }

  return Object.freeze([...clusters.values()].map((cluster) => Object.freeze({
    ...cluster,
    count: cluster.scenarioIds.length,
    scenarioIds: Object.freeze(cluster.scenarioIds),
    evidenceIds: Object.freeze([...new Set(cluster.evidenceIds)]),
  })))
}
