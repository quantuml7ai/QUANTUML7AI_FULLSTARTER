import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_RELEASE_DOMAIN_ROOTS as browserSafeReleaseRoots,
  QL7_SUPPORT_CANONICAL_DOMAIN_IDS as browserSafeCanonicalIds,
  QL7_SUPPORT_SYSTEM_ONLY_DOMAINS as browserSafeSystemOnly,
} from '../../lib/ql7-support/ontology/domains/index.js'
import {
  QL7_SUPPORT_RELEASE_DOMAIN_ROOTS as auditedReleaseRoots,
  auditQl7SupportDomainOntology,
} from '../../lib/ql7-support/ontology/domainOntology.js'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support canonical client bundle boundary', () => {
  it('keeps canonical domain roots browser-safe without duplicating ontology authority', () => {
    expect(browserSafeReleaseRoots).toHaveLength(46)
    expect(browserSafeCanonicalIds).toHaveLength(48)
    expect([...browserSafeSystemOnly].sort()).toEqual(['learning_governance', 'support_system'])
    expect(auditedReleaseRoots).toBe(browserSafeReleaseRoots)
    expect(auditQl7SupportDomainOntology()).toMatchObject({
      ok: true,
      releaseRootCount: 46,
      totalDomains: 48,
    })

    const catalog = read('lib/ql7-support/ecosystemCatalog.js')
    const domainAudit = read('lib/ql7-support/ontology/domainOntology.js')
    const registry = read('lib/ql7-support/ontology/domains/index.js')

    expect(catalog).toContain("from './ontology/domains/index.js'")
    expect(catalog).not.toContain("from './ontology/domainOntology.js'")
    expect(domainAudit).toContain("import crypto from 'node:crypto'")
    expect(domainAudit).toContain('QL7_SUPPORT_RELEASE_DOMAIN_ROOTS')
    expect(registry).toContain('QL7_SUPPORT_RELEASE_DOMAIN_ROOTS=Object.freeze(QL7_SUPPORT_DOMAIN_MODULES.map')
    expect(registry).toContain('QL7_SUPPORT_CANONICAL_DOMAIN_IDS=Object.freeze')
  })

  it('runs a fail-closed browser-reachable node-scheme audit in the canonical verifier', () => {
    const audit = read('scripts/ql7-support/client-bundle-boundary-audit.mjs')
    const verify = read('scripts/ql7-support/verify.mjs')
    const behavior = read('lib/ql7-support/config/behaviorManifest.js')

    expect(audit).toContain("schema: 'ql7.support.canonical.client-bundle-boundary-audit'")
    expect(audit).toContain('browser_reachable_forbidden_scheme')
    expect(audit).toContain('browser_reachable_unresolved_local_import')
    expect(audit).toContain("FORBIDDEN_BROWSER_SCHEMES = Object.freeze(['node:'])")
    expect(verify).toContain("clientBundle:['client-bundle-boundary'")
    expect(verify).toContain("'client-bundle-boundary':['clientBundle']")
    expect(verify).toMatch(/all:\['syntax','clientBundle','preflight'/u)
    expect(behavior).toContain("clientBundleBoundary:'browser-reachable-local-import-graph")
  })
})
