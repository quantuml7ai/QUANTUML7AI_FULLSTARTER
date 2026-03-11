#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const exts = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']
const ignoreDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  '.vercel',
  'dist',
  'build',
  'out',
])

const roots = [
  'app/forum',
  'app/api/forum',
  'app/api/dm',
  'app/api/profile',
  'app/api/qcoin',
  'app/api/quest',
  'app/api/pay',
  'app/api/subscription',
  'app/api/debug',
  'lib',
  'components',
]

function toPosix(p) {
  return p.replace(/\\/g, '/')
}

function rel(root, file) {
  return toPosix(path.relative(root, file))
}

function fileExists(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile()
  } catch {
    return false
  }
}

function resolveWithExtensions(basePath) {
  if (fileExists(basePath)) return basePath
  for (const ext of exts) {
    const withExt = `${basePath}${ext}`
    if (fileExists(withExt)) return withExt
  }
  for (const ext of exts) {
    const indexFile = path.join(basePath, `index${ext}`)
    if (fileExists(indexFile)) return indexFile
  }
  return null
}

function resolveImport(rootDir, fromFile, spec) {
  const s = String(spec || '').trim()
  if (!s) return null

  if (s.startsWith('.')) {
    const abs = path.resolve(path.dirname(fromFile), s)
    return resolveWithExtensions(abs)
  }

  if (s.startsWith('@/')) {
    const abs = path.resolve(rootDir, s.slice(2))
    return resolveWithExtensions(abs)
  }

  if (s.startsWith('/')) {
    const abs = path.resolve(rootDir, s.slice(1))
    return resolveWithExtensions(abs)
  }

  return null
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const full = path.join(dir, item.name)
    if (item.isDirectory()) {
      if (ignoreDirs.has(item.name)) continue
      walk(full, out)
      continue
    }
    if (exts.includes(path.extname(item.name))) {
      out.push(full)
    }
  }
  return out
}

function getDomain(fileRel) {
  const f = toPosix(fileRel)
  if (f === 'app/forum/Forum.jsx') return 'forum-root'
  if (f.startsWith('app/forum/shared/')) return 'forum-shared'
  if (f.startsWith('app/forum/events/')) return 'forum-events'
  if (f.startsWith('app/forum/')) return 'forum-ui'
  if (f.startsWith('app/api/forum/')) return 'api-forum'
  if (f.startsWith('app/api/dm/')) return 'api-dm'
  if (f.startsWith('app/api/profile/')) return 'api-profile'
  if (f.startsWith('app/api/qcoin/')) return 'api-qcoin'
  if (f.startsWith('app/api/quest/')) return 'api-quest'
  if (f.startsWith('app/api/pay/')) return 'api-pay'
  if (f.startsWith('app/api/subscription/')) return 'api-subscription'
  if (f.startsWith('app/api/debug/')) return 'api-debug'
  if (f.startsWith('lib/')) return 'lib'
  if (f.startsWith('components/')) return 'components'
  return 'other'
}

function parseImports(text) {
  const specs = []

  const fromRx = /import\s+[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g
  const bareImportRx = /import\s+['"]([^'"]+)['"]/g
  const requireRx = /require\(\s*['"]([^'"]+)['"]\s*\)/g

  let m
  while ((m = fromRx.exec(text)) !== null) specs.push(m[1])
  while ((m = bareImportRx.exec(text)) !== null) specs.push(m[1])
  while ((m = requireRx.exec(text)) !== null) specs.push(m[1])

  return specs
}

function findCycles(graph) {
  const color = new Map()
  const stack = []
  const stackIndex = new Map()
  const cycles = []
  const unique = new Set()

  function dfs(node) {
    color.set(node, 1)
    stackIndex.set(node, stack.length)
    stack.push(node)

    const next = graph.get(node) || []
    for (const dep of next) {
      if (!graph.has(dep)) continue
      const c = color.get(dep) || 0
      if (c === 0) {
        dfs(dep)
      } else if (c === 1) {
        const idx = stackIndex.get(dep)
        if (Number.isInteger(idx) && idx >= 0) {
          const cycle = stack.slice(idx).concat(dep)
          const key = cycle.slice(0, -1).sort().join('|')
          if (!unique.has(key)) {
            unique.add(key)
            cycles.push(cycle)
          }
        }
      }
    }

    stack.pop()
    stackIndex.delete(node)
    color.set(node, 2)
  }

  for (const node of graph.keys()) {
    if (!color.has(node)) dfs(node)
  }

  return cycles
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
  const files = []
  for (const r of roots) walk(path.join(root, r), files)

  const fileSet = new Set(files.map((f) => path.normalize(f)))
  const graph = new Map()
  const perFile = []
  const externalImports = new Map()

  for (const file of files) {
    let text = ''
    try {
      text = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }

    const specs = parseImports(text)
    const deps = []
    const extDeps = []
    for (const spec of specs) {
      const resolved = resolveImport(root, file, spec)
      if (resolved && fileSet.has(path.normalize(resolved))) {
        deps.push(path.normalize(resolved))
      } else {
        extDeps.push(spec)
      }
    }

    const uniqDeps = [...new Set(deps)]
    graph.set(path.normalize(file), uniqDeps)
    perFile.push({
      file: rel(root, file),
      domain: getDomain(rel(root, file)),
      imports: uniqDeps.map((d) => rel(root, d)),
      importCount: uniqDeps.length,
      external: [...new Set(extDeps)],
      externalCount: [...new Set(extDeps)].length,
    })
    externalImports.set(path.normalize(file), [...new Set(extDeps)])
  }

  const cycles = findCycles(graph).map((c) => c.map((x) => rel(root, x)))

  const crossDomainEdges = []
  let edgeCount = 0
  for (const [file, deps] of graph.entries()) {
    const fromRel = rel(root, file)
    const fromDomain = getDomain(fromRel)
    for (const dep of deps) {
      edgeCount += 1
      const depRel = rel(root, dep)
      const depDomain = getDomain(depRel)
      if (fromDomain !== depDomain) {
        crossDomainEdges.push({
          from: fromRel,
          fromDomain,
          to: depRel,
          toDomain: depDomain,
        })
      }
    }
  }

  const forumFile = path.normalize(path.join(root, 'app/forum/Forum.jsx'))
  const forumInfo = perFile.find((x) => x.file === 'app/forum/Forum.jsx') || null
  const forumExternal = externalImports.get(forumFile) || []

  const summary = {
    scannedFiles: files.length,
    internalEdges: edgeCount,
    cycleCount: cycles.length,
    crossDomainEdgeCount: crossDomainEdges.length,
    forumRootImportCount: forumInfo ? forumInfo.importCount : 0,
    forumRootExternalCount: forumExternal.length,
  }

  const out = {
    root,
    generatedAt: new Date().toISOString(),
    summary,
    cycles,
    crossDomainEdges,
    forumRoot: {
      file: 'app/forum/Forum.jsx',
      imports: forumInfo ? forumInfo.imports : [],
      external: forumExternal,
      domain: forumInfo ? forumInfo.domain : 'forum-root',
    },
    files: perFile,
  }

  const outPath = path.join(root, 'forum-deps-audit.report.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')

  console.log('\n=== Forum Dependency Audit ===\n')
  console.log(`files scanned: ${summary.scannedFiles}`)
  console.log(`internal edges: ${summary.internalEdges}`)
  console.log(`cycles: ${summary.cycleCount}`)
  console.log(`cross-domain edges: ${summary.crossDomainEdgeCount}`)
  console.log(`forum root imports: ${summary.forumRootImportCount}`)
  if (cycles.length) {
    console.log('\nTop cycles:')
    cycles.slice(0, 10).forEach((c) => console.log(`- ${c.join(' -> ')}`))
  }
  console.log(`\nSaved: ${outPath}\n`)
}

main()
