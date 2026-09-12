import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const EXPECTED_PACKAGE = '@hevcjs/core'
const EXPECTED_VERSION = '1.3.2'
const ESM_BRIDGE = '\nexport default HEVCDecoderModule;\n'
const root = process.cwd()
const packageRoot = path.join(root, 'node_modules', '@hevcjs', 'core')
const packageJsonPath = path.join(packageRoot, 'package.json')
if (!fs.existsSync(packageJsonPath)) throw new Error('QL7_HEVC_PACKAGE_ROOT_MISSING')
const packageMeta = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
if (packageMeta.name !== EXPECTED_PACKAGE || packageMeta.version !== EXPECTED_VERSION) {
  throw new Error(`QL7_HEVC_PACKAGE_VERSION_MISMATCH:${packageMeta.name || ''}@${packageMeta.version || ''}`)
}

const sourceCandidates = [
  path.join(packageRoot, 'dist', 'wasm'),
  path.join(packageRoot, 'wasm'),
]
const source = sourceCandidates.find((candidate) => (
  fs.existsSync(path.join(candidate, 'hevc-decode.js')) &&
  fs.existsSync(path.join(candidate, 'hevc-decode.wasm'))
))
if (!source) throw new Error('QL7_HEVC_WASM_ASSETS_MISSING')

const destination = path.join(root, 'public', 'vendor', 'ql7-hevc')
const temp = `${destination}.tmp-${process.pid}-${Date.now()}`
fs.rmSync(temp, { recursive: true, force: true })
fs.mkdirSync(temp, { recursive: true })

const manifest = {
  schema: 2,
  policy: 'ql7-hevc-wasm-fallback-v7-prod',
  package: EXPECTED_PACKAGE,
  version: EXPECTED_VERSION,
  files: {},
  derived: {
    'hevc-decode.mjs': {
      source: 'hevc-decode.js',
      transform: 'append-export-default-HEVCDecoderModule-v12',
    },
  },
}

for (const name of ['hevc-decode.js', 'hevc-decode.wasm']) {
  const from = path.join(source, name)
  const to = path.join(temp, name)
  fs.copyFileSync(from, to)
  const bytes = fs.readFileSync(to)
  manifest.files[name] = {
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  }
}

const sourceGlue = fs.readFileSync(path.join(source, 'hevc-decode.js'))
const derivedGlue = Buffer.concat([sourceGlue, Buffer.from(ESM_BRIDGE, 'utf8')])
const derivedPath = path.join(temp, 'hevc-decode.mjs')
fs.writeFileSync(derivedPath, derivedGlue)
manifest.files['hevc-decode.mjs'] = {
  bytes: derivedGlue.length,
  sha256: crypto.createHash('sha256').update(derivedGlue).digest('hex'),
}

const wasmBytes = fs.readFileSync(path.join(temp, 'hevc-decode.wasm'))
if (!WebAssembly.validate(wasmBytes)) throw new Error('QL7_HEVC_WASM_VALIDATE_FAILED')

const licenseCandidates = [path.join(packageRoot, 'LICENSE'), path.join(packageRoot, 'LICENSE.md')]
const license = licenseCandidates.find((candidate) => fs.existsSync(candidate))
if (license) fs.copyFileSync(license, path.join(temp, 'LICENSE.hevcjs.txt'))

fs.writeFileSync(path.join(temp, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
fs.rmSync(destination, { recursive: true, force: true })
fs.renameSync(temp, destination)
console.log('QL7_HEVC_WASM_VENDOR_OK', JSON.stringify(manifest))
