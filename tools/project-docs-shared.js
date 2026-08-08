const fs = require('fs')
const path = require('path')
const { execFileSync } = require('node:child_process')

const repoRoot = process.cwd()
const ignoredTopDirs = [
  '.git',
  '.next',
  'node_modules',
  '.ql7-backups',
  '.ql7-local-archive',
  '.ql7-tmp',
  '.ql7-patch-temp',
  '.ql7-patch-work',
  '.ql7-patch-backups',
  '.cache',
  '.turbo',
  '.pnpm-store',
  '.vercel',
  '.vscode',
  '.idea',
  'out',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  'blob-report',
  'account-deletion-reports',
  'migration-reports',
  'mongo-migration-reports',
  'reports',
  'audit',
  'scripts',
  'Mongo Backup',
  '.ГЕО 111',
  '.Р“Р•Рћ 111',
]

const ignoredDirNames = new Set([
  '.git',
  '.next',
  'node_modules',
  '.gradle',
  '.gradle-user-home',
  '.android-user-home',
  '.cache',
  '.turbo',
  '.pnpm-store',
  '.vercel',
  '.vscode',
  '.idea',
  'coverage',
  'out',
  'dist',
  'build',
  'captures',
  'playwright-report',
  'test-results',
  'blob-report',
])

function isGeneratedLocalArtifact(relPath) {
  const normalized = String(relPath || '').replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized) return true
  const parts = normalized.split('/')
  const topDir = parts[0]
  if (ignoredTopDirs.includes(topDir)) return true
  if (parts.some((part) => ignoredDirNames.has(part) || /^\.codex_tmp/i.test(part) || /^\.tmp-/i.test(part))) return true

  const base = parts[parts.length - 1]
  if (/^QL7_SUPPORT_PLANETARY_AI_V5_.*\.(?:ps1|zip|json|patch)$/i.test(base)) return true
  if (/^reports\(\d+\)\.zip$/i.test(base)) return true
  if (/\.(?:log|har|heapsnapshot|hprof|trace)$/i.test(base)) return true
  if (/\.trace\.zip$/i.test(base)) return true
  if (/\.tsbuildinfo$/i.test(base)) return true
  if (/\.(?:apk|aab|ap_|idsig)$/i.test(base)) return true
  if (/\.(?:keystore|jks)$/i.test(base)) return true
  if (/\.report\.json$/i.test(base)) return true
  if (/\.audit\.json$/i.test(base)) return true
  if (/\.snapshot\.json$/i.test(base)) return true
  if (/^scenario\..*\.json$/i.test(base)) return true
  if (/^baseline-.*\.stage0\.json$/i.test(base)) return true
  if (/^diff\.stage0\.json$/i.test(base)) return true
  if (/^forum-diag.*\.jsonl$/i.test(base)) return true
  if (/^next-dev.*\.(?:out|err)\.log$/i.test(base)) return true
  return false
}

function readGitVisibleFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    })
    return output.split('\0').filter(Boolean)
  } catch {
    return null
  }
}

const sourceExts = new Set(['.js', '.jsx', '.mjs', '.cjs', '.json', '.ts', '.tsx'])

function sortNatural(list) {
  return list.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }))
}

function rel(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, '/')
}

function readRepoFiles() {
  const gitFiles = readGitVisibleFiles()
  const out = []

  if (gitFiles) {
    for (const relPath of gitFiles) {
      const normalized = relPath.replace(/\\/g, '/')
      if (isGeneratedLocalArtifact(normalized)) continue
      const abs = path.join(repoRoot, normalized)
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) out.push(normalized)
    }
  } else {
    function walk(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const abs = path.join(currentDir, entry.name)
        const relPath = rel(abs)
        if (!relPath || isGeneratedLocalArtifact(relPath)) continue
        if (entry.isDirectory()) walk(abs)
        else if (entry.isFile()) out.push(relPath)
      }
    }
    walk(repoRoot)
  }

  return sortNatural(Array.from(new Set(out)))
}

function readSpecialAppFiles() {
  const appRoot = path.join(repoRoot, 'app')
  const specialNames = new Set([
    'page.js', 'page.jsx',
    'layout.js', 'layout.jsx',
    'loading.js', 'loading.jsx',
    'not-found.js', 'not-found.jsx',
    'default.js', 'default.jsx',
    'route.js', 'route.jsx',
  ])
  const out = []

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(currentDir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && specialNames.has(entry.name)) out.push(abs)
    }
  }

  walk(appRoot)
  return sortNatural(out.map(rel))
}

function buildFileSet(files) {
  return new Set(files)
}

function resolveLocalImport(fromFile, specifier, fileSet) {
  const fromDir = path.posix.dirname(fromFile)
  let base = null

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    base = path.posix.normalize(path.posix.join(fromDir, specifier))
  } else if (specifier.startsWith('@/')) {
    base = path.posix.normalize(specifier.slice(2))
  } else if (/^(app|components|lib|tools|public|src|config)\//.test(specifier)) {
    base = path.posix.normalize(specifier)
  } else {
    return null
  }

  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}/index.js`,
    `${base}/index.jsx`,
    `${base}/index.json`,
  ]

  return candidates.find((candidate) => fileSet.has(candidate)) || null
}

function extractDeps(filePath, fileSet) {
  const ext = path.posix.extname(filePath)
  if (!sourceExts.has(ext)) return []

  let text = ''
  try {
    text = fs.readFileSync(path.join(repoRoot, filePath), 'utf8')
  } catch {
    return []
  }

  const patterns = [
    /import\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
    /export\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  const out = new Set()
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text))) {
      const resolved = resolveLocalImport(filePath, match[1], fileSet)
      if (resolved && resolved !== filePath) out.add(resolved)
    }
  }
  return sortNatural(Array.from(out))
}

function buildDependencyMaps(files) {
  const fileSet = buildFileSet(files)
  const deps = new Map()
  const reverseDeps = new Map()

  for (const file of files) {
    const fileDeps = extractDeps(file, fileSet)
    deps.set(file, fileDeps)
    for (const dep of fileDeps) {
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, [])
      reverseDeps.get(dep).push(file)
    }
  }

  for (const [key, value] of reverseDeps.entries()) {
    reverseDeps.set(key, sortNatural(value))
  }

  return { fileSet, deps, reverseDeps }
}

function topDirs(absDir) {
  if (!fs.existsSync(absDir)) return []
  return sortNatural(
    fs.readdirSync(absDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  )
}

function listFiles(absDir, exts = null) {
  if (!fs.existsSync(absDir)) return []
  const out = []
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(current, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && (!exts || exts.includes(path.extname(entry.name).toLowerCase()))) out.push(rel(abs))
    }
  }
  walk(absDir)
  return sortNatural(out)
}

function categorizeFile(filePath) {
  const parts = filePath.split('/')
  const top = parts[0]

  if (top === 'app') {
    if (parts[1] === 'api') return `api/${parts[2] || 'root'}`
    if (parts[1] === 'forum') {
      if (parts[2] === 'features') return `forum/${parts[3] || 'features'}`
      if (parts[2] === 'shared') return 'forum/shared'
      if (parts[2] === 'styles') return 'forum/styles'
      return 'forum/root'
    }
    return `app/${parts[1] || 'root'}`
  }
  if (top === 'components') return 'components'
  if (top === 'lib') return parts[1] ? `lib/${parts[1]}` : 'lib'
  if (top === 'public') return parts[1] ? `public/${parts[1]}` : 'public'
  if (top === 'src') return parts[1] ? `src/${parts[1]}` : 'src'
  if (top === 'config') return 'config'
  if (top === 'tools') return 'tools'
  if (top === 'audit') return 'audit'
  return 'root'
}

function writeMarkdown(filePath, lines) {
  fs.writeFileSync(filePath, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8')
}

module.exports = {
  repoRoot,
  ignoredTopDirs,
  isGeneratedLocalArtifact,
  readGitVisibleFiles,
  sourceExts,
  sortNatural,
  rel,
  readRepoFiles,
  readSpecialAppFiles,
  buildDependencyMaps,
  topDirs,
  listFiles,
  categorizeFile,
  writeMarkdown,
}
