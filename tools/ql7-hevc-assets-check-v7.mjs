import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const EXPECTED_PACKAGE = '@hevcjs/core'
const EXPECTED_VERSION = '1.3.2'
const ESM_BRIDGE = '\nexport default HEVCDecoderModule;\n'
const root = process.cwd()
const packageRoot = path.join(root, 'node_modules', '@hevcjs', 'core')
const packageJsonPath = path.join(packageRoot, 'package.json')
if (!fs.existsSync(packageJsonPath)) throw new Error('QL7_HEVC_PACKAGE_ROOT_MISSING')
const meta = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
if (meta.name !== EXPECTED_PACKAGE || meta.version !== EXPECTED_VERSION) {
  throw new Error('QL7_HEVC_PACKAGE_VERSION_MISMATCH')
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

const directory = path.join(root, 'public', 'vendor', 'ql7-hevc')
const manifestPath = path.join(directory, 'manifest.json')
if (!fs.existsSync(manifestPath)) throw new Error('QL7_HEVC_VENDOR_MANIFEST_MISSING')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (
  manifest.schema !== 2 ||
  manifest.package !== EXPECTED_PACKAGE ||
  manifest.version !== EXPECTED_VERSION ||
  manifest.policy !== 'ql7-hevc-wasm-fallback-v7-prod'
) {
  throw new Error('QL7_HEVC_VENDOR_MANIFEST_MISMATCH')
}

for (const name of ['hevc-decode.js', 'hevc-decode.mjs', 'hevc-decode.wasm']) {
  const filePath = path.join(directory, name)
  if (!fs.existsSync(filePath)) throw new Error(`QL7_HEVC_VENDOR_FILE_MISSING:${name}`)
  const bytes = fs.readFileSync(filePath)
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
  if (manifest.files?.[name]?.sha256 !== sha256 || Number(manifest.files?.[name]?.bytes) !== bytes.length) {
    throw new Error(`QL7_HEVC_VENDOR_HASH_MISMATCH:${name}`)
  }
}

const packageGlue = fs.readFileSync(path.join(source, 'hevc-decode.js'))
const packageWasm = fs.readFileSync(path.join(source, 'hevc-decode.wasm'))
const vendoredGlue = fs.readFileSync(path.join(directory, 'hevc-decode.js'))
const vendoredWasm = fs.readFileSync(path.join(directory, 'hevc-decode.wasm'))
if (!vendoredGlue.equals(packageGlue)) throw new Error('QL7_HEVC_VENDOR_GLUE_NOT_PACKAGE_EXACT')
if (!vendoredWasm.equals(packageWasm)) throw new Error('QL7_HEVC_VENDOR_WASM_NOT_PACKAGE_EXACT')

const expectedDerived = Buffer.concat([packageGlue, Buffer.from(ESM_BRIDGE, 'utf8')])
const derivedPath = path.join(directory, 'hevc-decode.mjs')
const actualDerived = fs.readFileSync(derivedPath)
if (!actualDerived.equals(expectedDerived)) throw new Error('QL7_HEVC_ESM_BRIDGE_BYTES_MISMATCH')
if (
  manifest.derived?.['hevc-decode.mjs']?.source !== 'hevc-decode.js' ||
  manifest.derived?.['hevc-decode.mjs']?.transform !== 'append-export-default-HEVCDecoderModule-v12'
) {
  throw new Error('QL7_HEVC_ESM_BRIDGE_MANIFEST_MISMATCH')
}

const runtimeModule = await import(`${pathToFileURL(derivedPath).href}?sha=${manifest.files['hevc-decode.mjs'].sha256}`)
if (typeof runtimeModule?.default !== 'function') throw new Error('QL7_HEVC_ESM_FACTORY_MISSING')
if (!WebAssembly.validate(vendoredWasm)) throw new Error('QL7_HEVC_WASM_VALIDATE_FAILED')

console.log('QL7_HEVC_ASSETS_CHECK_OK', `${EXPECTED_PACKAGE}@${EXPECTED_VERSION}`, manifest.files['hevc-decode.mjs'].sha256)
