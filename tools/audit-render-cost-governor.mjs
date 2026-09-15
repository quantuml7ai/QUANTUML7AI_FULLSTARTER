import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(file, 'utf8')
const checks = []
const assert = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail })
const registry = read('lib/visual-runtime/visualActivityRegistry.js')
const globals = read('app/globals.css')
const host = read('components/visual-runtime/GlobalVisualActivityRuntime.jsx')
for (const token of ["return 'full'", "return 'cheap'", "return 'suspended'", "node.dataset.ql7RenderManaged === '1'", 'record.node.dataset.ql7RenderMode = nextRenderMode']) assert(`registry:${token}`, registry.includes(token))
for (const token of ['animation.pause()', 'animation.play()', "near100: '100px 0px 100px 0px'", "near50: '50px 0px 50px 0px'"]) assert(`lifecycle:${token}`, registry.includes(token))
assert('host:animationstart', host.includes("document.addEventListener('animationstart', onAnimationStart, true)"))
for (const token of ['[data-ql7-render-managed="1"][data-ql7-render-mode="cheap"]', 'backdrop-filter: none !important', 'filter: none !important', 'box-shadow: none !important', 'will-change: auto !important', 'animation-play-state: paused !important']) assert(`css:${token}`, globals.includes(token))
assert('geometry:no-content-visibility-auto', !globals.includes('content-visibility: auto'))
assert('managed-css:no-subtree-animation-scan', registry.includes('counters.managedCssScanSkips += 1'))
assert('managed-animationstart:no-css-reconcile-scan', registry.includes('counters.managedAnimationTargetScanSkips += 1'))

const prepaintHook = read('components/visual-runtime/useRenderManagedScope.js')
for (const token of [
  "const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect",
  'return registerVisualScope(node, {',
  'renderManaged: true',
  'publishState: false',
  'initialNear = true',
]) assert(`prepaint:${token}`, prepaintHook.includes(token))
for (const token of [
  'const firstObservation = record.firstIntersectionPending === true',
  'record.firstIntersectionPending = true',
  'if (firstObservation) {',
]) assert(`first-observation:${token}`, registry.includes(token))
for (const forbidden of [/new\s+MutationObserver\s*\(/, /getBoundingClientRect\s*\(/, /addEventListener\(\s*["']scroll["']/]) {
  assert(`prepaint:no-${forbidden.source}`, !forbidden.test(`${registry}\n${prepaintHook}`))
}
const prepaintOwners = [
  'app/forum/features/feed/components/ForumPostCard.jsx',
  'app/forum/features/feed/components/TopicItem.jsx',
  'app/forum/features/feed/components/UserRecommendationCard.jsx',
  'app/forum/features/feed/components/UserRecommendationsRail.jsx',
  'app/forum/features/dm/components/DmDialogRow.jsx',
  'app/forum/features/dm/components/DmThreadMessageRow.jsx',
  'app/forum/ForumAds.js',
  'app/exchange/battle-chat/BattleChatMessageRow.jsx',
  'app/exchange/ai-box/AIWorkbench.jsx',
]
for (const file of prepaintOwners) assert(`prepaint-owner:${file}`, read(file).includes('useRenderManagedScope'))
const roots=['app','components']; let managedSites=0; let managedFiles=0
for (const base of roots) {
  const walk=(dir)=>{ for (const name of fs.readdirSync(dir)) { const file=path.join(dir,name); const st=fs.statSync(file); if(st.isDirectory()) walk(file); else if(/\.(?:js|jsx|ts|tsx|css)$/.test(name)){ const src=read(file); const count=(src.match(/data-ql7-render-managed/g)||[]).length; if(count){ managedSites+=count; managedFiles+=1 } } } }; walk(base)
}
assert('coverage:managed-sites>=60', managedSites >= 60, `managedSites=${managedSites}`)
const result={ok:checks.every(x=>x.ok),managedSites,managedFiles,nearMarginsPx:[50,100],policy:{visibleOrNear:'full',offscreen:'cheap',hiddenOrInactive:'suspended',contentVisibilityIntroduced:false},checks}
console.log(JSON.stringify(result,null,2)); if(!result.ok) process.exitCode=1
