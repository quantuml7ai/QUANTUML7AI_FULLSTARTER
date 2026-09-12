import fs from 'node:fs'

const layout = fs.readFileSync('app/layout.js', 'utf8')
const consumers = [
  'app/forum/features/feed/components/PublishedPostsPane.jsx',
  'app/forum/features/feed/components/UserPostsPane.jsx',
  'app/forum/features/feed/components/ThreadRepliesPane.jsx',
  'app/forum/features/media/components/VideoFeedPane.jsx',
]

const checks = [
  ['global-host-import-retired', !layout.includes("import GlobalResourcePrewarmRuntime")],
  ['global-host-mount-retired', !layout.includes('<GlobalResourcePrewarmRuntime />')],
  ...consumers.map((file) => [`consumer-hints-retired:${file}`, !fs.readFileSync(file, 'utf8').includes('prewarmResourceHints')]),
  ...consumers.map((file) => [`consumer-runtime-import-retired:${file}`, !fs.readFileSync(file, 'utf8').includes('resource-prewarm/resourcePrewarmRuntime')]),
]
const failed = checks.filter(([, ok]) => !ok).map(([label]) => label)
if (failed.length) {
  console.error(`QL7_GLOBAL_RESOURCE_PREWARM_RETIREMENT_AUDIT_FAIL ${failed.join(',')}`)
  process.exit(1)
}
console.log('QL7_GLOBAL_RESOURCE_PREWARM_RETIREMENT_AUDIT_OK')
