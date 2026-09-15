import fs from 'node:fs'

const registry = fs.readFileSync('lib/visual-runtime/visualActivityRegistry.js', 'utf8')
const globals = fs.readFileSync('app/globals.css', 'utf8')

const checks = [
  ['managed-motion-runway', registry.includes("near100: '160px 96px 160px 96px'")],
  ['single-managed-observer', registry.includes('const pool = getObserver(record.root, record.marginProfile, record.renderManaged)')],
  ['no-prepaint-profile', !registry.includes('MANAGED_PREPAINT_MARGIN_PROFILES')],
  ['no-render-mode', !registry.includes('ql7RenderMode')],
  ['motion-mode-counted', registry.includes('motionModeWrites')],
  ['css-pauses-motion-only', globals.includes('[data-ql7-render-managed="1"][data-ql7-motion-mode="paused"]')],
  ['no-cheap-static-paint', !globals.includes('[data-ql7-render-mode="cheap"]')],
]

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label)
if (failed.length) {
  console.error(`QL7_GLOBAL_MOBILE_ANIMATION_BUDGET_AUDIT_FAIL ${failed.join(',')}`)
  process.exit(1)
}
console.log('QL7_GLOBAL_MOBILE_ANIMATION_BUDGET_AUDIT_OK')
