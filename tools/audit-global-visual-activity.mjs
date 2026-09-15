import fs from 'node:fs/promises'
import path from 'node:path'

const ROOTS = ['app', 'components', 'mobile']
const UI_EXT_RE = /\.(?:js|jsx|ts|tsx|css|module\.css)$/i
const CSS_INFINITE_RE = /animation(?:-[a-z-]+)?\s*:[^;{}]*\binfinite\b/gi
const RAW_GIF_RE = /["'`](\/[^"'`\s?#]+\.gif(?:\?[^"'`]*)?)["'`]/gi
const RAF_RE = /\brequestAnimationFrame\s*\(/g
const INTERVAL_RE = /\bsetInterval\s*\(/g
const WAAPI_RE = /\.animate\s*\(/g

const STYLE_OWNER_RULES = [
  [/^app\/globals\.css$/, 'global-selector-to-explicit-component-scope'],
  [/^app\/forum\/styles\//, 'forum-route-card-row-panel-scope'],
  [/^app\/forum\/features\/media\/components\/VideoMedia\.jsx$/, 'forum-card-media-ui-ancestor-scope'],
  [/^app\/forum\/features\/ui\/components\/(?:ForumControlNavIcon|ForumActionNavIcon|VideoFeedNavIcon)\.jsx$/, 'forum-header-or-card-ancestor-scope'],
  [/^app\/exchange\/battle-chat\/BattleChat\.module\.css$/, 'battle-chat-panel-row-scope'],
  [/^components\/QuantumWalletLaunchIcon\.jsx$/, 'wallet-launch-own-header-scope'],
]

function slash(v) { return String(v || '').replace(/\\/g, '/') }
function arg(name, fallback = '') {
  const p = `--${name}=`
  const row = process.argv.slice(2).find((x) => x.startsWith(p))
  return row ? row.slice(p.length) : fallback
}
function count(re, text) { return [...text.matchAll(re)].length }
function lineForOffset(text, offset) { return text.slice(0, Math.max(0, offset)).split('\n').length }
function selectorNear(text, offset) {
  const open = text.lastIndexOf('{', Math.max(0, offset))
  if (open < 0) return `declaration@${lineForOffset(text, offset)}`
  const floor = Math.max(text.lastIndexOf('}', open - 1), text.lastIndexOf('`', open - 1))
  const raw = text.slice(Math.max(0, floor + 1), open).trim().replace(/\s+/g, ' ')
  return (raw.length > 220 ? raw.slice(-220) : raw) || `declaration@${lineForOffset(text, offset)}`
}
async function exists(file) { return fs.stat(file).then((s) => s.isFile()).catch(() => false) }
async function walk(dir) {
  if (!await fs.stat(dir).then((s) => s.isDirectory()).catch(() => false)) return []
  const out = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (['node_modules', '.next', 'reports', '__ql7_visual_posters'].includes(entry.name)) continue
        stack.push(full)
      } else if (entry.isFile() && UI_EXT_RE.test(entry.name)) out.push(full)
    }
  }
  return out
}
function styleOwner(rel, text) {
  if (text.includes('data-ql7-visual-scope')) return 'explicit-scope-in-file'
  for (const [re, owner] of STYLE_OWNER_RULES) if (re.test(rel)) return owner
  return ''
}
function loopPolicy(rel, text, kind) {
  if (/lib\/visual-runtime\/visualActivityRegistry\.js$/.test(rel)) return ['bounded-runtime-safeguard', 'shared-registry-disconnected-sweep']
  if (/components\/QCoinDropFX\.jsx$/.test(rel)) return ['document-visibility-pause', 'event-mounted-one-shot-fx']
  if (/components\/MediaPipelineProgress\.jsx$|app\/exchange\/ai-box\/AIWorkbench\.jsx$|app\/components\/CryptoNewsLens\.jsx$/.test(rel)) {
    return text.includes('subscribeVisualActivity') && text.includes('loop: true')
      ? ['visual-subscription', 'explicit-visual-loop-ownership']
      : ['uncovered', 'missing-visual-subscription']
  }
  if (/useForumMediaCoordinator|QCast|Video|Audio|Recorder|Capture/i.test(rel)) return ['firewall-exempt', 'product-media-owner']
  if (/\/api\/|route\.(?:js|ts)$/.test(rel)) return ['server-exempt', 'server-runtime']
  if (/fetch\(|EventSource|WebSocket|auth|session|poll|retry|navigation|scrollMemory|cooldown|countdown/i.test(text)) return ['functional-exempt', 'business-network-navigation-state']
  if (kind === 'raf' && /scrollTo|scrollIntoView|focus\(|requestAnimationFrame\([^)]*=>/.test(text)) return ['one-shot-exempt', 'layout-navigation-one-shot']
  return ['reviewed-existing', 'pre-existing-non-global-loop']
}

const projectRoot = path.resolve(arg('project-root', process.cwd()))
const outFile = arg('out') ? path.resolve(arg('out')) : ''
const inventoryOnly = arg('inventory-only', '0') === '1'
const rows = []
const errors = []
const scanned = []
let cssInfiniteDeclarations = 0
let rawGifReferences = 0
let rafCalls = 0
let intervalCalls = 0
let waapiCalls = 0

let posterManifest = null
const manifestFile = path.join(projectRoot, 'public', '__ql7_visual_posters', 'manifest.json')
try { posterManifest = JSON.parse(await fs.readFile(manifestFile, 'utf8')) } catch {}
const assets = Array.isArray(posterManifest?.assets) ? posterManifest.assets : []
const posterBySource = new Map(assets.map((row) => [String(row?.source || ''), row]))
if (!inventoryOnly) {
  if (posterManifest?.schema !== 'ql7-animated-asset-manifest-v2') errors.push('poster_manifest_schema_or_missing')
  if (assets.length !== 295 || Number(posterManifest?.animatedAssetCount) !== 295) errors.push(`poster_manifest_count:${assets.length}:${posterManifest?.animatedAssetCount}`)
}

for (const rootName of ROOTS) {
  for (const file of await walk(path.join(projectRoot, rootName))) {
    const rel = slash(path.relative(projectRoot, file))
    if (/^app\/api\//.test(rel)) continue
    const text = await fs.readFile(file, 'utf8')
    scanned.push(rel)
    const owner = styleOwner(rel, text)

    for (const match of text.matchAll(CSS_INFINITE_RE)) {
      cssInfiniteDeclarations += 1
      const selector = selectorNear(text, match.index)
      const covered = !!owner
      rows.push({
        file: rel,
        line: lineForOffset(text, match.index),
        selectorOrComponent: selector,
        kind: 'css-infinite',
        runtimeOwner: owner || 'UNSCOPED',
        nearestScope: owner,
        nearMargin: 'near100-default / near50-dense-explicit',
        pauseMechanism: 'animation-play-state-paused',
        posterPath: '',
        protectedButton: /button|btn|icon/i.test(selector),
        mediaPlaybackRelation: 'css-only',
        policy: covered ? 'pause' : 'uncovered',
        exemptReason: '',
        coverage: covered,
      })
      if (!inventoryOnly && !covered) errors.push(`css_infinite_unscoped:${rel}:${lineForOffset(text, match.index)}`)
    }

    for (const match of text.matchAll(RAW_GIF_RE)) {
      rawGifReferences += 1
      const source = match[1].split('?')[0]
      const templateVip = source.includes('${num}') && /^\/vip\/(?:emoji\/e|avatars\/a)\$\{num\}\.gif$/i.test(source)
      const row = posterBySource.get(source)
      const posterDisk = row?.poster ? path.join(projectRoot, 'public', String(row.poster).replace(/^\//, '')) : ''
      const posterCovered = templateVip ? assets.some((x) => String(x.source || '').startsWith(source.includes('/emoji/') ? '/vip/emoji/' : '/vip/avatars/')) : (!!row && !!row.poster && await exists(posterDisk))
      const adapterCovered = text.includes('ViewportAnimatedImage') || /features\/profile\/constants\/vipAssets\.js$/.test(rel) || /InviteFriendProvider\.jsx$/.test(rel)
      const covered = posterCovered && adapterCovered
      rows.push({ file: rel, line: lineForOffset(text, match.index), selectorOrComponent: source, kind: 'gif', runtimeOwner: adapterCovered ? 'explicit-ViewportAnimatedImage-or-config-consumer' : 'raw', nearestScope: /\/vip\//.test(source) ? 'marked-inner-scroll-root' : 'explicit-near-scope', nearMargin: /\/vip\//.test(source) ? 'near50' : 'near100', pauseMechanism: 'explicit-src-poster-transition', posterPath: row?.poster || (templateVip ? 'manifest-family:vip' : ''), protectedButton: /TopBar|AuthNav|ForumActionRow|QCoin/i.test(rel), mediaPlaybackRelation: 'decorative-raster-only', policy: covered ? 'poster-swap' : 'uncovered', exemptReason: '', coverage: covered })
      if (!inventoryOnly && !covered) errors.push(`gif_uncovered:${rel}:${source}`)
    }

    const raf = count(RAF_RE, text)
    const intervals = count(INTERVAL_RE, text)
    const waapi = count(WAAPI_RE, text)
    rafCalls += raf; intervalCalls += intervals; waapiCalls += waapi
    if (raf) {
      const [policy, reason] = loopPolicy(rel, text, 'raf')
      rows.push({ file: rel, selectorOrComponent: 'requestAnimationFrame', kind: 'raf', count: raf, runtimeOwner: policy, nearestScope: policy === 'visual-subscription' ? 'explicit-scope' : '', nearMargin: policy === 'visual-subscription' ? 'near100' : '', pauseMechanism: policy, posterPath: '', protectedButton: false, mediaPlaybackRelation: /media|video|audio/i.test(rel) ? 'firewall-exempt' : 'none', policy, exemptReason: reason, coverage: policy !== 'uncovered' })
      if (!inventoryOnly && policy === 'uncovered') errors.push(`raf_uncovered:${rel}`)
    }
    if (intervals) {
      const [policy, reason] = loopPolicy(rel, text, 'timer')
      rows.push({ file: rel, selectorOrComponent: 'setInterval', kind: 'timer', count: intervals, runtimeOwner: policy, nearestScope: policy === 'visual-subscription' ? 'explicit-scope' : '', nearMargin: policy === 'visual-subscription' ? 'near100' : '', pauseMechanism: policy, posterPath: '', protectedButton: false, mediaPlaybackRelation: /media|video|audio/i.test(rel) ? 'firewall-exempt' : 'none', policy, exemptReason: reason, coverage: policy !== 'uncovered' })
      if (!inventoryOnly && policy === 'uncovered') errors.push(`timer_uncovered:${rel}`)
    }
    if (waapi) {
      const covered = text.includes('data-ql7-visual-pause-js="1"') && text.includes('data-ql7-visual-scope=')
      rows.push({ file: rel, selectorOrComponent: '.animate()', kind: 'waapi', count: waapi, runtimeOwner: covered ? 'explicit-pauseJs-scope' : 'uncovered', nearestScope: covered ? 'explicit-scope' : '', nearMargin: 'near100', pauseMechanism: 'runtime-owned-WAAPI-pause', posterPath: '', protectedButton: false, mediaPlaybackRelation: 'none', policy: covered ? 'pause' : 'uncovered', exemptReason: '', coverage: covered })
      if (!inventoryOnly && !covered) errors.push(`waapi_uncovered:${rel}`)
    }
  }
}

if (!inventoryOnly) {
  const registry = await fs.readFile(path.join(projectRoot, 'lib/visual-runtime/visualActivityRegistry.js'), 'utf8').catch(() => '')
  const host = await fs.readFile(path.join(projectRoot, 'components/visual-runtime/GlobalVisualActivityRuntime.jsx'), 'utf8').catch(() => '')
  const adapter = await fs.readFile(path.join(projectRoot, 'components/visual-runtime/ViewportAnimatedImage.jsx'), 'utf8').catch(() => '')
  const runtime = `${registry}\n${host}\n${adapter}`
  const forbidden = [
    ['global_animation_scan', /document\.getAnimations\s*\(/],
    ['body_mutation_observer', /new\s+MutationObserver\s*\(/],
    ['global_img_scan', /querySelectorAll\(\s*["']img["']\s*\)/],
    ['star_scan', /querySelectorAll\(\s*["']\*["']\s*\)/],
    ['computed_style_scan', /getComputedStyle\s*\(/],
    ['geometry_read', /getBoundingClientRect\s*\(/],
    ['scroll_geometry_read', /\.scrollHeight\b|\.clientHeight\b/],
    ['responsive_source_mutation', /\.srcset\s*=|\.sizes\s*=/],
    ['scroll_listener', /addEventListener\(\s*["']scroll["']/],
  ]
  for (const [name, re] of forbidden) if (re.test(runtime)) errors.push(`runtime_forbidden:${name}`)
  for (const banned of ['video.pause(', 'audio.pause(', '.currentTime =', '.playbackRate =', '.volume =', '.muted =']) if (runtime.includes(banned)) errors.push(`media_firewall:${banned}`)
}

const report = {
  schema: 'ql7-global-visual-activity-v3-audit-v1',
  ok: errors.length === 0,
  projectRoot,
  totals: {
    scannedFiles: scanned.length,
    coverageRows: rows.length,
    cssInfiniteDeclarations,
    rawGifReferences,
    requestAnimationFrameCalls: rafCalls,
    setIntervalCalls: intervalCalls,
    webAnimationsApiCalls: waapiCalls,
    animatedManifestEntries: assets.length,
    inventoryOnly,
  },
  errors,
  rows,
}
if (outFile) {
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
console.log(JSON.stringify({ ok: report.ok, totals: report.totals, errors }, null, 2))
process.exit(report.ok ? 0 : 1)
