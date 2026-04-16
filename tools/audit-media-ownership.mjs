#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const targets = [
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'app/forum/features/media/components/VideoMedia.jsx',
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'app/forum/ForumAds.js',
  'app/forum/features/media/components/QCastPlayer.jsx',
  'components/BgAudio.js',
]

const probes = [
  { kind: 'play_call', re: /\.\s*play\s*\(/g },
  { kind: 'pause_call', re: /\.\s*pause\s*\(/g },
  { kind: 'load_call', re: /\.\s*load\s*\(/g },
  { kind: 'remove_src', re: /removeAttribute\s*\(\s*['"]src['"]\s*\)/g },
  { kind: 'set_src', re: /setAttribute\s*\(\s*['"]src['"]/g },
  { kind: 'persist_mute', re: /localStorage\.(?:setItem|getItem)\s*\([^)]*(forum:mediaMuted|forum:videoMuted|forum:qcastMuted)/g },
  { kind: 'muted_event', re: /CustomEvent\s*\(\s*['"]forum:media-mute['"]/g },
  { kind: 'site_media_play', re: /CustomEvent\s*\(\s*['"]site-media-play['"]/g },
  { kind: 'observer', re: /new\s+IntersectionObserver\s*\(/g },
]

const report = {
  generatedAt: new Date().toISOString(),
  cwd: root,
  files: [],
  summary: {},
}

for (const rel of targets) {
  const abs = path.join(root, rel)
  const source = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
  const row = {
    file: rel,
    exists: fs.existsSync(abs),
    matches: [],
  }

  for (const probe of probes) {
    const matches = [...source.matchAll(probe.re)].length
    row.matches.push({
      kind: probe.kind,
      count: matches,
    })
    report.summary[probe.kind] = Number(report.summary[probe.kind] || 0) + matches
  }

  report.files.push(row)
}

const outPath = path.join(root, 'forum-media-ownership.report.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

console.log('[audit-media-ownership] done')
console.log(`Saved: ${outPath}`)