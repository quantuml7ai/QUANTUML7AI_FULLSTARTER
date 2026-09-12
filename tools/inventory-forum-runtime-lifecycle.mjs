import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const forumRoot = path.join(root, 'app/forum')
const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs'])
const resourcePatterns = [
  ['interval', /\bsetInterval\s*\(/g],
  ['timeout', /\bsetTimeout\s*\(/g],
  ['raf', /\brequestAnimationFrame\s*\(/g],
  ['intersection', /\bnew\s+IntersectionObserver\s*\(/g],
  ['mutation', /\bnew\s+MutationObserver\s*\(/g],
  ['resize', /\bnew\s+ResizeObserver\s*\(/g],
  ['listener', /\.addEventListener\s*\(/g],
]
const cleanupPatterns = {
  interval: /\bclearInterval\s*\(/,
  timeout: /\bclearTimeout\s*\(/,
  raf: /\bcancelAnimationFrame\s*\(/,
  intersection: /\.disconnect\s*\(|\.unobserve\s*\(/,
  mutation: /\.disconnect\s*\(/,
  resize: /\.disconnect\s*\(|\.unobserve\s*\(/,
  listener: /\.removeEventListener\s*\(/,
}

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (extensions.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

function lineNumberAt(text, offset) {
  let line = 1
  for (let i = 0; i < offset; i += 1) if (text.charCodeAt(i) === 10) line += 1
  return line
}

function nearestOwner(lines, lineNo) {
  const from = Math.max(0, lineNo - 80)
  for (let index = lineNo - 1; index >= from; index -= 1) {
    const line = lines[index] || ''
    const match = line.match(/(?:function\s+([A-Za-z0-9_$]+)|const\s+([A-Za-z0-9_$]+)\s*=\s*(?:useCallback\s*\()?\s*(?:async\s*)?\(?[^=]*=>|export\s+default\s+function\s+([A-Za-z0-9_$]+))/)
    if (match) return match[1] || match[2] || match[3] || 'anonymous'
  }
  return 'module-or-anonymous'
}

const rows = []
for (const full of walk(forumRoot)) {
  const rel = path.relative(root, full).replaceAll(path.sep, '/')
  const text = fs.readFileSync(full, 'utf8')
  const lines = text.split(/\r?\n/)
  for (const [resource, regex] of resourcePatterns) {
    regex.lastIndex = 0
    for (let match = regex.exec(text); match; match = regex.exec(text)) {
      const line = lineNumberAt(text, match.index)
      const fileHasCleanup = cleanupPatterns[resource]?.test(text) || false
      const diagnostic = /diag|debug|audit|trace|watch|pressure/i.test(rel) || /diag|debug|audit|trace|watch|pressure/i.test(nearestOwner(lines, line))
      rows.push({
        file: rel,
        ownerFunction: nearestOwner(lines, line),
        line,
        resource,
        createSite: `${rel}:${line}`,
        cleanupSite: fileHasCleanup ? 'cleanup-token-present-in-file' : '',
        runtimeGate: diagnostic ? 'diagnostic-or-debug' : 'mounted-or-runtime',
        action: fileHasCleanup ? 'keep-or-contract-check' : 'manual-review',
      })
    }
  }
}

const byResource = {}
for (const row of rows) byResource[row.resource] = (byResource[row.resource] || 0) + 1
const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  scope: 'app/forum',
  total: rows.length,
  byResource,
  manualReview: rows.filter((row) => row.action === 'manual-review').length,
  rows,
}
const outArg = process.argv.find((arg) => arg.startsWith('--out='))
if (outArg) {
  const out = path.resolve(root, outArg.slice('--out='.length))
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
console.log(JSON.stringify({ ...report, rows: undefined }, null, 2))
