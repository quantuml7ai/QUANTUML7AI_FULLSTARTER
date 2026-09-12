import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { finalizeLocalizedTrustRootHtml } from './ql7-finalize-localized-trust-root-html.mjs'

const root = process.cwd()
const chunksRoot = path.join(root, '.next', 'static', 'chunks')
const marker = 'QL7_HEVC_RUNTIME_ESM_BRIDGE_V12'
const mobileMarker = 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL'
const mobileRoutingMarker = 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL'
const vendorDir = path.join(root, 'public', 'vendor', 'ql7-hevc')
const derivedPath = path.join(vendorDir, 'hevc-decode.mjs')
const manifestPath = path.join(vendorDir, 'manifest.json')

finalizeLocalizedTrustRootHtml({ root })

function collectJs(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectJs(full, out)
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

if (!fs.existsSync(chunksRoot)) {
  throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_NEXT_CHUNKS_MISSING')
}
if (!fs.existsSync(derivedPath) || !fs.existsSync(manifestPath)) {
  throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_ESM_ASSET_MISSING')
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const derivedSource = fs.readFileSync(derivedPath, 'utf8')
if (!derivedSource.endsWith('\nexport default HEVCDecoderModule;\n')) {
  throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_ESM_EXPORT_MISSING')
}
const runtimeModule = await import(`${pathToFileURL(derivedPath).href}?sha=${manifest.files?.['hevc-decode.mjs']?.sha256 || 'missing'}`)
if (typeof runtimeModule?.default !== 'function') {
  throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_ESM_FACTORY_MISSING')
}

const allChunks = collectJs(path.join(root, '.next', 'static'))
const matches = []
const mobileMatches = []
for (const file of allChunks) {
  const source = fs.readFileSync(file, 'utf8')
  if (source.includes(marker)) matches.push({ file, source })
  if (source.includes(mobileMarker)) mobileMatches.push({ file, source })
}

if (!matches.length) {
  throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_MARKER_MISSING')
}
for (const { source } of matches) {
  if (!/\bimport\s*\(/.test(source)) {
    throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_NATIVE_IMPORT_MISSING')
  }
  if (!source.includes('HEVCDecoderModule')) {
    throw new Error('QL7_HEVC_BROWSER_BUNDLE_CHECK_FACTORY_BRIDGE_MISSING')
  }
}

if (!mobileMatches.length) {
  throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_MARKER_MISSING')
}
for (const { source } of mobileMatches) {
  if (!source.includes('ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot')) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_EXECUTOR_MISSING')
  }
  if (!source.includes(mobileRoutingMarker)) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_IPHONE_AVC_ROUTING_MISSING')
  }
  if (!source.includes('stage-transcode') || !source.includes('faststart-remux') || !source.includes('opfs-probe')) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_STAGES_MISSING')
  }
  if (!source.includes('native-hevc-runtime-failed') || !source.includes('force-wasm')) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_HEVC_RETRY_MISSING')
  }
  if (!source.includes('apple-avc-transient-retry')) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_IPHONE_AVC_RETRY_MISSING')
  }
  if (!source.includes('QL7_MOBILE_VIDEO_OPFS_RUNTIME_PROBE_V15')) {
    throw new Error('QL7_MOBILE_VIDEO_BROWSER_BUNDLE_CHECK_OPFS_PROBE_MISSING')
  }
}

const chunks = matches.map(({ file }) => path.relative(root, file).split(path.sep).join('/')).sort()
const mobileChunks = mobileMatches.map(({ file }) => path.relative(root, file).split(path.sep).join('/')).sort()
process.stdout.write(`QL7_HEVC_BROWSER_BUNDLE_CHECK_OK ${JSON.stringify({
  marker,
  mobileMarker,
  mobileRoutingMarker,
  derivedAsset: 'public/vendor/ql7-hevc/hevc-decode.mjs',
  derivedSha256: manifest.files?.['hevc-decode.mjs']?.sha256 || null,
  chunks,
  mobileChunks,
})}\n`)
