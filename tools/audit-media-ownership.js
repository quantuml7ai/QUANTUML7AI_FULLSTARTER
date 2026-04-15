#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const OUT_FILE = path.join(ROOT, 'forum-media-ownership.audit.report.json')
const FILE_RE = /\.(js|jsx)$/i
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', '.turbo', '.vercel'])
const TARGETS = [
  'app/forum',
  'components/BgAudio.jsx',
]

const OPERATIONS = [
  { key: 'play', ownershipGroup: 'playback_control', mediaDomain: 'html_media', rx: /\.play\?\.\(|\.play\(/g },
  { key: 'pause', ownershipGroup: 'playback_control', mediaDomain: 'html_media', rx: /\.pause\?\.\(|\.pause\(/g },
  { key: 'load', ownershipGroup: 'source_lifecycle', mediaDomain: 'html_media', rx: /\.load\?\.\(|\.load\(/g },
  { key: 'src_attach', ownershipGroup: 'source_lifecycle', mediaDomain: 'html_media', rx: /setAttribute\(\s*['"]src['"]/g },
  { key: 'src_detach', ownershipGroup: 'source_lifecycle', mediaDomain: 'html_media', rx: /removeAttribute\(\s*['"]src['"]/g },
  { key: 'restore_helper', ownershipGroup: 'source_lifecycle', mediaDomain: 'html_media', rx: /__restoreVideoEl/g },
  { key: 'unload_helper', ownershipGroup: 'source_lifecycle', mediaDomain: 'html_media', rx: /__unloadVideoEl|scheduleHardUnload|hardUnloadMedia/g },
  { key: 'mute_storage_write', ownershipGroup: 'mute_persistence', mediaDomain: 'global_mute', rx: /localStorage\.setItem\(\s*MEDIA_MUTED_KEY|localStorage\.setItem\(\s*MEDIA_VIDEO_MUTED_KEY|__writeMediaMutedPref|writeMutedPrefToStorage/g },
  { key: 'mute_event', ownershipGroup: 'mute_persistence', mediaDomain: 'global_mute', rx: /forum:media-mute|MEDIA_MUTED_EVENT/g },
  { key: 'qcast_storage_write', ownershipGroup: 'mute_persistence', mediaDomain: 'qcast', rx: /QCAST_MUTED_KEY|writeQcastMutedPref/g },
  { key: 'iframe_postmessage', ownershipGroup: 'iframe_transport', mediaDomain: 'iframe', rx: /postMessage\(/g },
  { key: 'iframe_src', ownershipGroup: 'source_lifecycle', mediaDomain: 'iframe', rx: /iframe|youtube|tiktok/g },
  { key: 'viewport_read', ownershipGroup: 'viewport_logic', mediaDomain: 'viewport', rx: /getBoundingClientRect|innerHeight|scrollTop|IntersectionObserver|ResizeObserver/g },
]

function walk(entry, out = []) {
  const full = path.join(ROOT, entry)
  if (!fs.existsSync(full)) return out
  const stat = fs.statSync(full)
  if (stat.isFile()) {
    if (FILE_RE.test(full)) out.push(full)
    return out
  }
  for (const name of fs.readdirSync(full)) {
    if (IGNORE_DIRS.has(name)) continue
    walk(path.join(entry, name), out)
  }
  return out
}

function findMatches(source, rx) {
  const flags = rx.flags.includes('g') ? rx.flags : `${rx.flags}g`
  const re = new RegExp(rx.source, flags)
  const lines = source.split(/\r?\n/)
  const matches = []
  for (let i = 0; i < lines.length; i += 1) {
    if (!re.test(lines[i])) continue
    matches.push({
      line: i + 1,
      text: lines[i].trim().slice(0, 220),
    })
    re.lastIndex = 0
  }
  return matches
}

function buildOwnershipMap(files) {
  const rows = []
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    const source = fs.readFileSync(file, 'utf8')
    for (const op of OPERATIONS) {
      const matches = findMatches(source, op.rx)
      matches.forEach((match) => {
        rows.push({
          file: rel,
          line: match.line,
          text: match.text,
          operation: op.key,
          ownershipGroup: op.ownershipGroup,
          mediaDomain: op.mediaDomain,
        })
      })
    }
  }
  return rows
}

function buildConflicts(rows) {
  const grouped = new Map()
  rows.forEach((row) => {
    const key = `${row.mediaDomain}::${row.ownershipGroup}`
    const files = grouped.get(key) || new Set()
    files.add(row.file)
    grouped.set(key, files)
  })

  return [...grouped.entries()]
    .map(([key, files]) => {
      const [mediaDomain, ownershipGroup] = key.split('::')
      return {
        mediaDomain,
        ownershipGroup,
        fileCount: files.size,
        files: [...files].sort(),
      }
    })
    .filter((row) => row.fileCount > 1)
    .sort((a, b) => b.fileCount - a.fileCount || a.mediaDomain.localeCompare(b.mediaDomain))
}

function main() {
  const files = TARGETS.flatMap((entry) => walk(entry))
  const ownership = buildOwnershipMap(files)
  const conflicts = buildConflicts(ownership)
  const report = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.map((file) => path.relative(ROOT, file).replace(/\\/g, '/')).sort(),
    ownership,
    conflicts,
  }

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`)

  console.log('\n=== Forum Media Ownership Audit ===\n')
  for (const row of conflicts.slice(0, 20)) {
    console.log(`- ${row.mediaDomain} / ${row.ownershipGroup}: ${row.fileCount} files`)
    row.files.slice(0, 8).forEach((file) => console.log(`  ${file}`))
  }
  console.log(`\nSaved: ${OUT_FILE}`)
}

main()
