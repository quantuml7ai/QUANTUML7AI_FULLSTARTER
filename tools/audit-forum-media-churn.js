const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const OUT_FILE = path.join(ROOT, 'forum-media-churn.audit.report.json')

const TARGETS = [
  'app/forum',
  'components/ForumBootSplash.jsx',
]

const FILE_RE = /\.(js|jsx)$/

const PATTERNS = [
  { key: 'playCalls', rx: /\.play\?\.\(|\.play\(/g, weight: 5 },
  { key: 'pauseCalls', rx: /\.pause\?\.\(|\.pause\(/g, weight: 3 },
  { key: 'loadCalls', rx: /\.load\?\.\(|\.load\(/g, weight: 6 },
  { key: 'srcSets', rx: /setAttribute\(\s*['"]src['"]/g, weight: 7 },
  { key: 'srcRemoves', rx: /removeAttribute\(\s*['"]src['"]/g, weight: 8 },
  { key: 'currentSrcReads', rx: /\bcurrentSrc\b/g, weight: 2 },
  { key: 'pendingFlags', rx: /__loadPending|__warmReady|__prewarm|__resident/g, weight: 2 },
  { key: 'hardUnload', rx: /scheduleHardUnload|hardUnloadMedia|__unloadVideoEl|__restoreVideoEl/g, weight: 6 },
  { key: 'iframeOps', rx: /iframe|youtube|tiktok/g, weight: 2 },
  { key: 'io', rx: /IntersectionObserver/g, weight: 4 },
  { key: 'ro', rx: /ResizeObserver/g, weight: 4 },
  { key: 'raf', rx: /requestAnimationFrame|cancelAnimationFrame/g, weight: 3 },
  { key: 'scrollWrites', rx: /scrollTop\s*=|scrollTo\(|scrollIntoView\(/g, weight: 5 },
  { key: 'layoutReads', rx: /getBoundingClientRect|innerHeight|clientHeight|scrollHeight/g, weight: 2 },
]

function walk(entry, acc = []) {
  const full = path.join(ROOT, entry)
  if (!fs.existsSync(full)) return acc
  const stat = fs.statSync(full)
  if (stat.isFile()) {
    if (FILE_RE.test(full)) acc.push(full)
    return acc
  }
  for (const name of fs.readdirSync(full)) {
    walk(path.join(entry, name), acc)
  }
  return acc
}

function findLines(text, rx, limit = 4) {
  const out = []
  const flags = rx.flags.includes('g') ? rx.flags : `${rx.flags}g`
  const re = new RegExp(rx.source, flags)
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    if (!re.test(lines[i])) continue
    out.push({ line: i + 1, text: lines[i].trim().slice(0, 220) })
    if (out.length >= limit) break
  }
  return out
}

function scoreFile(counts) {
  return PATTERNS.reduce((sum, pattern) => sum + (Number(counts[pattern.key] || 0) * pattern.weight), 0)
}

function main() {
  const files = TARGETS.flatMap((entry) => walk(entry))
  const report = files.map((file) => {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    const text = fs.readFileSync(file, 'utf8')
    const counts = {}
    const samples = {}

    for (const pattern of PATTERNS) {
      const matches = text.match(pattern.rx)
      counts[pattern.key] = Array.isArray(matches) ? matches.length : 0
      if (counts[pattern.key] > 0) samples[pattern.key] = findLines(text, pattern.rx)
    }

    const flags = []
    if ((counts.loadCalls || 0) >= 2 && ((counts.srcSets || 0) + (counts.srcRemoves || 0)) >= 2) {
      flags.push('reload-thrash risk')
    }
    if ((counts.pendingFlags || 0) >= 4 && (counts.loadCalls || 0) >= 2) {
      flags.push('pending-state churn')
    }
    if ((counts.io || 0) >= 2 && (counts.scrollWrites || 0) >= 2) {
      flags.push('viewport-owner mix')
    }
    if ((counts.iframeOps || 0) >= 4 && ((counts.srcSets || 0) + (counts.srcRemoves || 0)) >= 1) {
      flags.push('iframe remount risk')
    }
    if ((counts.ro || 0) >= 1 && (counts.layoutReads || 0) >= 4) {
      flags.push('resize/layout churn')
    }

    return {
      file: rel,
      score: scoreFile(counts),
      counts,
      flags,
      samples,
    }
  }).sort((a, b) => b.score - a.score)

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`)

  console.log('\n=== Forum Media Churn Audit ===\n')
  for (const item of report.slice(0, 16)) {
    const c = item.counts
    console.log(`- ${path.join(ROOT, item.file)}`)
    console.log(
      `  score=${item.score} play=${c.playCalls} pause=${c.pauseCalls} load=${c.loadCalls} srcSet=${c.srcSets} srcRm=${c.srcRemoves} io=${c.io} ro=${c.ro} raf=${c.raf} scroll=${c.scrollWrites}`
    )
    if (item.flags.length) {
      console.log(`  flags: ${item.flags.join(' | ')}`)
    }
  }
  console.log(`\nSaved: ${OUT_FILE}`)
}

main()
