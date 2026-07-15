const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const TARGETS = [
  path.join(ROOT, 'app', 'forum'),
  path.join(ROOT, 'components', 'ScrollTopPulse.js'),
]
const EXTS = new Set(['.js', '.jsx'])
const REPORT_PATH = path.join(ROOT, 'forum-scroll.audit.report.json')

const RULES = [
  {
    key: 'scrollWrite',
    rx: /\bscrollTo\b|\bscrollBy\b|\bscrollIntoView\b/g,
    weight: 8,
  },
  {
    key: 'scrollRead',
    rx: /\bscrollTop\b|\bscrollY\b|\bpageYOffset\b/g,
    weight: 3,
  },
  {
    key: 'alignOps',
    rx: /\balignNodeToTop\b|\balignInboxStartUnderTabs\b|\bcenterNodeInScroll\b|\bcenterPostAfterDom\b|\bcenterAndFlashPostAfterDom\b|\bsnapVideoFeedToFirstCardTop\b/g,
    weight: 11,
  },
  {
    key: 'restoreOps',
    rx: /\brestoreScrollSnapshot\b|\brestoreEntryPosition\b|\bgetScrollSnapshot\b|\bgetEntryOffset\b/g,
    weight: 7,
  },
  {
    key: 'teleportOps',
    rx: /\bteleport\b|\bhardReset\b|\bsoft_refresh\b|\bprogrammaticScroll\b/g,
    weight: 6,
  },
  {
    key: 'rectReads',
    rx: /\bgetBoundingClientRect\b/g,
    weight: 2,
  },
  {
    key: 'resizeObserver',
    rx: /\bResizeObserver\b/g,
    weight: 4,
  },
  {
    key: 'raf',
    rx: /\brequestAnimationFrame\b/g,
    weight: 2,
  },
  {
    key: 'timers',
    rx: /\bsetTimeout\b|\bsetInterval\b/g,
    weight: 1,
  },
]

function walk(target, out) {
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (EXTS.has(path.extname(target))) out.push(target)
    return
  }
  const entries = fs.readdirSync(target, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    walk(path.join(target, entry.name), out)
  }
}

function countMatches(text, rx) {
  const m = text.match(rx)
  return Array.isArray(m) ? m.length : 0
}

function collectHits(lines, rx, key) {
  const hits = []
  for (let i = 0; i < lines.length; i += 1) {
    if (!rx.test(lines[i])) continue
    hits.push({
      key,
      line: i + 1,
      text: lines[i].trim().slice(0, 220),
    })
    if (hits.length >= 8) break
  }
  rx.lastIndex = 0
  return hits
}

const files = []
for (const target of TARGETS) {
  if (fs.existsSync(target)) walk(target, files)
}

const report = files.map((file) => {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  const counts = {}
  const hits = []
  let score = 0
  for (const rule of RULES) {
    const count = countMatches(text, rule.rx)
    counts[rule.key] = count
    score += count * rule.weight
    if (count > 0) hits.push(...collectHits(lines, new RegExp(rule.rx.source, rule.rx.flags), rule.key))
  }
  return {
    file,
    score,
    counts,
    hits: hits.slice(0, 12),
  }
}).sort((a, b) => b.score - a.score)

const payload = {
  root: ROOT,
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  report,
}

fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2))

console.log('\n=== Forum Scroll Runtime Audit ===\n')
for (const item of report.slice(0, 20)) {
  const c = item.counts
  console.log(`- ${item.file}`)
  console.log(
    `  score=${item.score} scrollWrite=${c.scrollWrite || 0} align=${c.alignOps || 0} restore=${c.restoreOps || 0} rect=${c.rectReads || 0} raf=${c.raf || 0} resize=${c.resizeObserver || 0}`,
  )
}
console.log(`\nSaved: ${REPORT_PATH}`)
