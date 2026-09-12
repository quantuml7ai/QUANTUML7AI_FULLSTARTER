import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

function arg(name, fallback = '') {
  const p = `--${name}=`
  const row = process.argv.slice(2).find((x) => x.startsWith(p))
  return row ? row.slice(p.length) : fallback
}
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').toUpperCase()
async function walk(dir) {
  const out = []
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    for (const e of await fs.readdir(cur, { withFileTypes: true })) {
      const full = path.join(cur, e.name)
      if (e.isDirectory()) {
        if (e.name === '__ql7_visual_posters') continue
        stack.push(full)
      } else if (e.isFile() && /\.(?:gif|png|webp|avif)$/i.test(e.name)) out.push(full)
    }
  }
  return out
}
async function rawPixelHash(file, page = 0) {
  const { data, info } = await sharp(file, { failOn: 'error', page, limitInputPixels: 16000 * 16000 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { hash: sha(data), width: info.width, height: info.height, channels: info.channels }
}

const projectRoot = path.resolve(arg('project-root', process.cwd()))
const sourcePublicRoot = path.resolve(arg('source-public-root', path.join(projectRoot, 'public')))
const posterPublicRoot = path.resolve(arg('poster-public-root', path.join(projectRoot, 'public')))
const outFile = arg('out') ? path.resolve(arg('out')) : ''
const manifestFile = path.join(posterPublicRoot, '__ql7_visual_posters', 'manifest.json')
const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'))
const assets = Array.isArray(manifest.assets) ? manifest.assets : []
const errors = []
const rows = []
if (manifest.schema !== 'ql7-animated-asset-manifest-v2') errors.push('manifest_schema')
if (assets.length !== 295 || Number(manifest.animatedAssetCount) !== 295) errors.push(`manifest_count:${assets.length}:${manifest.animatedAssetCount}`)

const detected = new Set()
for (const file of await walk(sourcePublicRoot)) {
  const meta = await sharp(file, { failOn: 'none', animated: true, limitInputPixels: 16000 * 16000 }).metadata().catch(() => null)
  if (Number(meta?.pages || 1) > 1) detected.add('/' + path.relative(sourcePublicRoot, file).replace(/\\/g, '/'))
}
const manifestSources = new Set(assets.map((x) => String(x.source || '')))
for (const source of detected) if (!manifestSources.has(source)) errors.push(`animated_missing_manifest:${source}`)
for (const source of manifestSources) if (!detected.has(source)) errors.push(`manifest_stale_source:${source}`)

let pixelProofVerified = 0
for (const row of assets) {
  const source = path.join(sourcePublicRoot, String(row.source || '').replace(/^\//, ''))
  const poster = path.join(posterPublicRoot, String(row.poster || '').replace(/^\//, ''))
  let sourceBuf = null, posterBuf = null
  try { sourceBuf = await fs.readFile(source) } catch { errors.push(`source_missing:${row.source}`) }
  try { posterBuf = await fs.readFile(poster) } catch { errors.push(`poster_missing:${row.poster}`) }
  if (!sourceBuf || !posterBuf) continue
  const sourceHash = sha(sourceBuf), posterHash = sha(posterBuf)
  if (sourceHash !== String(row.sourceSha256 || '').toUpperCase()) errors.push(`source_hash:${row.source}`)
  if (posterHash !== String(row.posterSha256 || '').toUpperCase()) errors.push(`poster_hash:${row.poster}`)
  const sourceMeta = await sharp(source, { animated: true, failOn: 'error', limitInputPixels: 16000 * 16000 }).metadata()
  const posterMeta = await sharp(poster, { animated: true, failOn: 'error', limitInputPixels: 16000 * 16000 }).metadata()
  if (Number(sourceMeta.pages || 1) <= 1) errors.push(`source_not_animated:${row.source}`)
  if (Number(posterMeta.pages || 1) !== 1) errors.push(`poster_not_static:${row.poster}`)
  const a = await rawPixelHash(source, 0)
  const b = await rawPixelHash(poster, 0)
  const expectedPixel = String(row.firstFramePixelSha256 || '').toUpperCase()
  if (a.hash !== expectedPixel) errors.push(`source_pixel_hash:${row.source}`)
  if (b.hash !== expectedPixel) errors.push(`poster_pixel_hash:${row.poster}`)
  if (a.width !== b.width || a.height !== b.height || b.channels !== 4) errors.push(`poster_geometry:${row.poster}`)
  if (a.hash === b.hash && a.hash === expectedPixel) pixelProofVerified += 1
  rows.push({ source: row.source, poster: row.poster, sourceHashOk: sourceHash === String(row.sourceSha256 || '').toUpperCase(), posterHashOk: posterHash === String(row.posterSha256 || '').toUpperCase(), sourcePages: Number(sourceMeta.pages || 1), posterPages: Number(posterMeta.pages || 1), width: a.width, height: a.height, firstFramePixelSha256: a.hash, pixelMatch: a.hash === b.hash && a.hash === expectedPixel })
}
const report = { schema: 'ql7-global-visual-poster-proof-v3', ok: errors.length === 0, scannedRaster: (await walk(sourcePublicRoot)).length, animatedDetected: detected.size, verified: rows.length, pixelProofVerified, manifestSha256: sha(await fs.readFile(manifestFile)), errors, rows }
if (outFile) { await fs.mkdir(path.dirname(outFile), { recursive: true }); await fs.writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`) }
console.log(JSON.stringify({ ok: report.ok, scannedRaster: report.scannedRaster, animatedDetected: report.animatedDetected, verified: report.verified, pixelProofVerified, manifestSha256: report.manifestSha256, errors }, null, 2))
process.exit(report.ok ? 0 : 1)
