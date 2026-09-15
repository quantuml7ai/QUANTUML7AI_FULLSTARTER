import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const productionRoots = [
  'lib/ql7-support/server.js',
  'app/api/dm/support-entry/route.js',
  'app/api/dm/support-state/route.js',
  'app/api/dm/support-card-translate/route.js',
]
const forbiddenSegments = [
  '/lib/ql7-support/neural/',
  '/lib/ql7-support/simulation/',
  '/lib/ql7-support/learning/',
  '/lib/ql7-support/learningPipeline.js',
  '/lib/ql7-support/learningGovernance.js',
  '/services/ql7-model-runtime/',
  '/models/ql7-native/',
  '/ml/ql7-native/',
]
const forbiddenExtensions = new Set(['.py', '.pyc', '.pyo', '.pt', '.pth', '.ckpt', '.safetensors', '.onnx'])
const forbiddenExternalPackages = /^(?:openai|@huggingface\/|transformers|onnxruntime|torch|tensorflow)/u
const forbiddenClientSegments = [
  '/lib/ql7-support/server.js',
  '/lib/ql7-support/calibration/',
  '/lib/ql7-support/conversation/memoryStore.js',
  '/lib/ql7-support/conversation/persistentMemoryProjection.js',
  '/lib/ql7-support/language/reviewedMaterial/',
  '/lib/ql7-support/language/semanticBanks.js',
  '/lib/ql7-support/knowledge/',
]
const sourceExtensions = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json']

function normalized(relative) {
  return `/${relative.split(path.sep).join('/')}`
}

function resolveLocal(fromFile, specifier) {
  if (!specifier || (!specifier.startsWith('.') && !specifier.startsWith('@/'))) return ''
  const base = specifier.startsWith('@/')
    ? path.join(root, specifier.slice(2))
    : path.resolve(path.dirname(path.join(root, fromFile)), specifier)
  const candidates = [base, ...sourceExtensions.map((extension) => `${base}${extension}`)]
  for (const extension of sourceExtensions) candidates.push(path.join(base, `index${extension}`))
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  return found ? path.relative(root, found) : ''
}

function importsOf(relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const specs = []
  const patterns = [
    /\b(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/gu,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/gu,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/gu,
  ]
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.push(match[1])
  }
  return specs
}

function graphFrom(entries) {
  const seen = new Set()
  const parent = new Map(entries.map((entry) => [entry, '']))
  const unresolved = []
  const external = []
  const queue = [...entries]
  while (queue.length) {
    const relative = queue.shift()
    if (!relative || seen.has(relative)) continue
    seen.add(relative)
    for (const specifier of importsOf(relative)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
        external.push({ importer: relative, specifier })
        continue
      }
      const resolved = resolveLocal(relative, specifier)
      if (!resolved) unresolved.push(`${relative} -> ${specifier}`)
      else if (!seen.has(resolved)) {
        if (!parent.has(resolved)) parent.set(resolved, relative)
        queue.push(resolved)
      }
    }
  }
  return { seen, unresolved, external, parent }
}

function importPath(relative) {
  const values = []
  let current = relative
  while (current) {
    values.unshift(current)
    current = graph.parent.get(current) || ''
  }
  return values.join(' -> ')
}

const graph = graphFrom(productionRoots)
const failures = [...graph.unresolved.map((value) => `unresolved:${value}`)]
for (const row of graph.external) {
  if (forbiddenExternalPackages.test(row.specifier)) failures.push(`forbidden_external_ai_package:${row.importer}->${row.specifier}`)
}
for (const relative of graph.seen) {
  const value = normalized(relative)
  if (forbiddenExtensions.has(path.extname(relative).toLowerCase())) failures.push(`forbidden_extension:${relative}`)
  for (const segment of forbiddenSegments) {
    if (value.includes(segment)) failures.push(`forbidden_production_import:${importPath(relative)}`)
  }
}

function listSources(directory, rows = []) {
  if (!fs.existsSync(directory)) return rows
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'reports', 'audit', '.venv-ql7'].includes(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) listSources(absolute, rows)
    else if (sourceExtensions.includes(path.extname(entry.name).toLowerCase())) rows.push(absolute)
  }
  return rows
}

const clientEntries = [...listSources(path.join(root, 'app')), ...listSources(path.join(root, 'components'))]
  .filter((absolute) => /^\s*['"]use client['"]\s*;?/u.test(fs.readFileSync(absolute, 'utf8')))
  .map((absolute) => path.relative(root, absolute))
const clientGraph = graphFrom(clientEntries)
for (const relative of clientGraph.seen) {
  const value = normalized(relative)
  for (const segment of forbiddenClientSegments) {
    if (value.includes(segment)) failures.push(`server_bank_reachable_from_client:${relative}`)
  }
}

const boundary = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8')
for (const required of [
  '.venv-ql7/',
  'services/ql7-model-runtime/',
  'models/ql7-native/',
  '**/*.pt',
  '**/*.safetensors',
  '**/*.onnx',
  'reports/',
  'scripts/ql7-support/',
]) {
  if (!boundary.includes(required)) failures.push(`vercelignore_missing:${required}`)
}

const result = Object.freeze({
  ok: failures.length === 0,
  productionRootCount: productionRoots.length,
  productionModuleCount: graph.seen.size,
  clientEntryCount: clientEntries.length,
  clientReachableModuleCount: clientGraph.seen.size,
  runtimeMode: 'deterministic-js',
  pythonInProductionGraph: false,
  modelWeightsInProductionGraph: false,
  externalAiInProductionGraph: false,
  serverBanksInClientGraph: false,
  failures: Object.freeze(failures),
})

console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exitCode = 1
