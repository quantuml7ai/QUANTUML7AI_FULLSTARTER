import crypto from 'node:crypto'

import {
  QL7_SUPPORT_DOMAIN_MODULES,
  QL7_SUPPORT_DOMAIN_MODULE_BY_ID,
  QL7_SUPPORT_RELEASE_DOMAIN_ROOTS,
  QL7_SUPPORT_SYSTEM_ONLY_DOMAINS,
  QL7_SUPPORT_CANONICAL_DOMAIN_IDS,
} from './domains/index.js'

export const QL7_SUPPORT_ONTOLOGY_VERSION = '5.1.0'
export {
  QL7_SUPPORT_RELEASE_DOMAIN_ROOTS,
  QL7_SUPPORT_SYSTEM_ONLY_DOMAINS,
  QL7_SUPPORT_CANONICAL_DOMAIN_IDS,
}
export const QL7_SUPPORT_DOMAIN_TOPICS = QL7_SUPPORT_CANONICAL_DOMAIN_IDS

export function getQl7SupportOntologyDomainModule(domainId = '') {
  return QL7_SUPPORT_DOMAIN_MODULE_BY_ID[String(domainId)] || null
}

export function auditQl7SupportDomainOntology() {
  const failures = []
  const ids = QL7_SUPPORT_RELEASE_DOMAIN_ROOTS

  if (ids.length !== 46) failures.push(`release_root_count:${ids.length}`)
  if (new Set(ids).size !== ids.length) failures.push('duplicate_domain')
  if (QL7_SUPPORT_DOMAIN_MODULES.some((row) => !row?.nodes?.length)) {
    failures.push('domain_module_without_node')
  }

  for (const row of QL7_SUPPORT_DOMAIN_MODULES) {
    const rootNode = row.nodes[0]
    if (rootNode?.nodeId !== `domain:${row.domainId}`) {
      failures.push(`domain_node_id:${row.domainId}`)
    }
    if (!rootNode?.contentHash) {
      failures.push(`domain_content_hash:${row.domainId}`)
    }
    if (!row?.sourceRequirements || typeof row.sourceRequirements !== 'object' || Array.isArray(row.sourceRequirements)) {
      failures.push(`domain_source_requirements:${row.domainId}`)
    }
  }

  const manifestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(QL7_SUPPORT_DOMAIN_MODULES.map((row) => ({
      domainId: row.domainId,
      nodeHash: row.nodes[0]?.contentHash,
      sourceRequirements: row.sourceRequirements,
    }))))
    .digest('hex')

  return Object.freeze({
    ok: failures.length === 0,
    totalDomains: QL7_SUPPORT_CANONICAL_DOMAIN_IDS.length,
    releaseRootCount: ids.length,
    releaseRoots: ids,
    systemOnlyDomains: QL7_SUPPORT_SYSTEM_ONLY_DOMAINS,
    moduleCount: QL7_SUPPORT_DOMAIN_MODULES.length,
    manifestHash,
    failures: Object.freeze(failures),
  })
}
