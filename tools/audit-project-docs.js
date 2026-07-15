#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {
  repoRoot,
  readRepoFiles,
  readSpecialAppFiles,
  buildDependencyMaps,
} = require('./project-docs-shared')

const docs = [
  'PROJECT_TREE.md',
  'PROJECT_ROUTES.md',
  'PROJECT_OWNERSHIP.md',
  'PROJECT_DEPENDENCIES.md',
  'PROJECT_RISKS.md',
]

const generators = [
  'tools/generate-project-tree.js',
  'tools/generate-project-routes.js',
  'tools/generate-project-ownership.js',
  'tools/generate-project-dependencies.js',
  'tools/generate-project-risks.js',
  'tools/generate-project-docs.js',
  'tools/audit-project-docs.js',
]

function readUtf8(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8').replace(/^\uFEFF/, '')
}

function main() {
  const repoFiles = readRepoFiles()
  const routeFiles = readSpecialAppFiles()
  const sourceFiles = repoFiles.filter((file) => /\.(js|jsx|mjs|cjs|json)$/.test(file))
  const { deps, reverseDeps } = buildDependencyMaps(sourceFiles)

  const docsState = docs.map((file) => {
    const exists = fs.existsSync(path.join(repoRoot, file))
    const content = exists ? readUtf8(file) : ''
    return {
      file,
      exists,
      lines: exists ? content.split(/\r?\n/).length : 0,
      headings: exists ? (content.match(/^#{1,6}\s+/gm) || []).length : 0,
      has_rule_header: exists ? content.includes('Обязательное правило сопровождения') : false,
    }
  })

  const missingDocs = docsState.filter((item) => !item.exists).map((item) => item.file)
  const ruleHeaderIssues = docsState.filter((item) => item.exists && !item.has_rule_header).map((item) => item.file)
  const missingGenerators = generators.filter((file) => !fs.existsSync(path.join(repoRoot, file)))

  const treeAudit = {
    phase: 'project-tree-audit',
    timestamp: new Date().toISOString(),
    scope: 'whole repository tree registry',
    touched_files: ['PROJECT_TREE.md'],
    new_files: [],
    moved_logic_domains: [],
    dependency_changes: [],
    detected_risks: missingDocs.length ? ['missing docs package files'] : [],
    detected_cycles: [],
    api_contract_risk: 'none',
    storage_risk: 'none',
    runtime_risk: 'low',
    notes: [
      `repo_files=${repoFiles.length}`,
      `source_files=${sourceFiles.length}`,
      `route_files=${routeFiles.length}`,
    ],
    status: missingDocs.length ? 'warning' : 'ok',
    total_repo_files: repoFiles.length,
    total_source_files: sourceFiles.length,
    top_level_breakdown: Object.fromEntries(
      Array.from(
        repoFiles.reduce((map, file) => {
          const top = file.split('/')[0]
          map.set(top, (map.get(top) || 0) + 1)
          return map
        }, new Map()).entries()
      ).sort((a, b) => a[0].localeCompare(b[0], 'ru', { sensitivity: 'base', numeric: true }))
    ),
  }

  const docsAudit = {
    phase: 'project-docs-audit',
    timestamp: new Date().toISOString(),
    scope: 'whole repository docs package',
    touched_files: docs,
    new_files: docs.filter((file) => fs.existsSync(path.join(repoRoot, file))),
    moved_logic_domains: [],
    dependency_changes: [],
    detected_risks: [],
    detected_cycles: [],
    api_contract_risk: 'none',
    storage_risk: 'none',
    runtime_risk: 'low',
    notes: [],
    status: 'ok',
    generators,
    documents: docsState,
    route_file_count: routeFiles.length,
    source_file_count: sourceFiles.length,
    dependency_edge_count: Array.from(deps.values()).reduce((sum, list) => sum + list.length, 0),
    reverse_dependency_nodes: reverseDeps.size,
  }

  if (missingDocs.length) docsAudit.detected_risks.push(`missing_docs:${missingDocs.join(',')}`)
  if (ruleHeaderIssues.length) docsAudit.detected_risks.push(`missing_rule_header:${ruleHeaderIssues.join(',')}`)
  if (missingGenerators.length) docsAudit.detected_risks.push(`missing_generators:${missingGenerators.join(',')}`)
  if (docsAudit.detected_risks.length) docsAudit.status = 'warning'

  const auditDir = path.join(repoRoot, 'audit')
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true })
  fs.writeFileSync(path.join(auditDir, 'project-tree-audit.json'), `${JSON.stringify(treeAudit, null, 2)}\n`, 'utf8')
  fs.writeFileSync(path.join(auditDir, 'project-docs-audit.json'), `${JSON.stringify(docsAudit, null, 2)}\n`, 'utf8')

  process.stdout.write('Written audit/project-tree-audit.json and audit/project-docs-audit.json.\n')
}

main()
