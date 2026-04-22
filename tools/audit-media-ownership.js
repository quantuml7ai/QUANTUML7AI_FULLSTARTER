const fs = require('node:fs')
const path = require('node:path')

const repoRoot = process.cwd()
const reportPath = path.join(repoRoot, 'media-ownership.audit.report.json')

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8')
}

function runCheck(label, predicate, meta = {}) {
  let ok = false
  let error = null
  try {
    ok = !!predicate()
  } catch (err) {
    ok = false
    error = String(err?.message || err || 'unknown_error')
  }
  return { label, ok, error, ...meta }
}

const checks = []

checks.push(runCheck(
  'VideoMedia is leaf-only for coordinator-owned post video',
  () => {
    const src = read('app/forum/features/media/components/VideoMedia.jsx')
    return (
      src.includes("const isManualOnly = String(dataForumManualOnly || '') === '1'") &&
      src.includes('const hasForumOwnerContract =') &&
      src.includes("String(dataForumMediaNode || '') === '1' ||") &&
      src.includes('\n    isPostVideo') &&
      src.includes("const isCoordinatorManaged = hasForumOwnerContract && !isManualOnly") &&
      src.includes("if (isNewMediaNode && isCoordinatorManaged)") &&
      src.includes("data-forum-media-node={dataForumMediaNode}") &&
      !src.includes('const shouldBootstrapAttach = isPostVideo && !!s')
    )
  },
  { file: 'app/forum/features/media/components/VideoMedia.jsx' },
))

checks.push(runCheck(
  'Shared runtime does not hard-reset persisted mute on import',
  () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    return (
      !src.includes("localStorage.setItem(MEDIA_MUTED_KEY, '1')") &&
      !src.includes("localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, '1')") &&
      src.includes('export function __markMediaLifecycleTouch') &&
      src.includes('shouldKeepResidentPostVideo')
    )
  },
  { file: 'app/forum/features/media/utils/mediaLifecycleRuntime.js' },
))

checks.push(runCheck(
  'Coordinator owns mute and unload policy',
  () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    return (
      !src.includes('forum:qcastMuted') &&
      src.includes('isAuthoritativeMuteSource') &&
      src.includes('hard_unload_deferred_settling')
    )
  },
  { file: 'app/forum/features/media/hooks/useForumMediaCoordinator.js' },
))

checks.push(runCheck(
  'Post media shells publish stable owner metadata',
  () => {
    const src = read('app/forum/features/feed/components/PostMediaStack.jsx')
    return (
      src.includes('data-owner-id=') &&
      src.includes('data-forum-embed-kind=') &&
      src.includes('data-lifecycle-state=') &&
      src.includes('loading="lazy"')
    )
  },
  { file: 'app/forum/features/feed/components/PostMediaStack.jsx' },
))

const issues = checks.filter((check) => !check.ok)
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  issues,
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

if (!report.ok) {
  console.error('[audit:forum:ownership] failed')
  issues.forEach((issue) => {
    console.error(` - ${issue.label}${issue.file ? ` (${issue.file})` : ''}${issue.error ? `: ${issue.error}` : ''}`)
  })
  process.exit(1)
}

console.log('[audit:forum:ownership] passed')
