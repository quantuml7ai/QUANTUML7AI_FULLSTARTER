import sharp from 'sharp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_OUTPUT_BYTES = 300 * 1024
const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 630
const QUALITY_STEPS = [82, 74, 66, 58, 50, 42]
const DEFAULT_IMAGE_REL = '/metab/forum1.png'

const ALLOWED_REMOTE_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com'])
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'
const R2_MEDIA_HOST = 'media.quantuml7ai.com'
const R2_DEV_SUFFIX = '.r2.dev'

function normalizeUrl(raw, baseUrl) {
  const input = String(raw || '').trim()
  if (!input) return ''
  try {
    return new URL(input, baseUrl).toString()
  } catch {
    return ''
  }
}

function isAllowedSource(srcUrl, reqUrl) {
  try {
    const src = new URL(srcUrl)
    const req = new URL(reqUrl)
    if (src.protocol !== 'https:' && src.protocol !== 'http:') return false

    const srcHost = src.hostname.toLowerCase()
    const reqHost = req.hostname.toLowerCase()

    if (srcHost === reqHost) {
      if (src.pathname.startsWith('/api/forum/wa-preview')) return false
      return true
    }

    if (srcHost.endsWith(BLOB_HOST_SUFFIX)) return true
    if (srcHost === R2_MEDIA_HOST || srcHost.endsWith(R2_DEV_SUFFIX)) return true
    if (ALLOWED_REMOTE_HOSTS.has(srcHost)) return true
    return false
  } catch {
    return false
  }
}

async function fetchImageBuffer(srcUrl) {
  const res = await fetch(srcUrl, {
    cache: 'no-store',
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; QL7-WA-Preview/1.0)',
      accept: 'image/*,*/*;q=0.8',
    },
  })

  if (!res.ok) throw new Error(`upstream_status_${res.status}`)

  const declaredLen = Number(res.headers.get('content-length') || 0)
  if (declaredLen > MAX_SOURCE_BYTES) {
    throw new Error('upstream_too_large_header')
  }

  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.length) throw new Error('upstream_empty')
  if (buf.length > MAX_SOURCE_BYTES) throw new Error('upstream_too_large_body')
  return buf
}

// QL7_OG_PREVIEW_NO_CROP_CONTAIN_V1
// Build a messenger-safe 1200x630 JPEG without cropping the source media.
// The actual image is fit=contain; a blurred/dimmed cover layer only fills the empty bars.
async function renderNoCropPreviewJpeg(inputBuffer, quality) {
  const base = sharp(inputBuffer, { failOn: 'none' }).rotate()

  const background = await base.clone()
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: 'cover',
      position: 'attention',
    })
    .blur(30)
    .modulate({ brightness: 0.38, saturation: 1.14 })
    .jpeg({
      quality: Math.max(38, Math.min(72, quality - 10)),
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer()

  const foreground = await base.clone()
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  return sharp(background, { failOn: 'none' })
    .composite([{ input: foreground, left: 0, top: 0 }])
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer()
}


function normalizePreviewKind(value) {
  const raw = String(value || '').trim().toLowerCase()
  return raw === 'qcast' ? 'qcast' : 'default'
}

async function renderQcastNoCropPreviewJpeg(inputBuffer, quality) {
  const base = sharp(inputBuffer, { failOn: 'none' }).rotate()

  const background = await base.clone()
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: 'cover',
      position: 'attention',
    })
    .blur(34)
    .modulate({ brightness: 0.34, saturation: 1.12 })
    .jpeg({
      quality: Math.max(38, Math.min(72, quality - 10)),
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer()

  const foreground = await base.clone()
    .resize(TARGET_WIDTH - 92, TARGET_HEIGHT - 72, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  const meta = await sharp(foreground, { failOn: 'none' }).metadata().catch(() => ({}))
  const left = Math.max(0, Math.floor((TARGET_WIDTH - Number(meta.width || TARGET_WIDTH)) / 2))
  const top = Math.max(0, Math.floor((TARGET_HEIGHT - Number(meta.height || TARGET_HEIGHT)) / 2))

  return sharp(background, { failOn: 'none' })
    .composite([{ input: foreground, left, top }])
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer()
}

async function toWaPreviewJpeg(inputBuffer, options = {}) {
  let last = null
  const previewKind = normalizePreviewKind(options.kind)
  const renderer = previewKind === 'qcast' ? renderQcastNoCropPreviewJpeg : renderNoCropPreviewJpeg

  for (const quality of QUALITY_STEPS) {
    const out = await renderer(inputBuffer, quality)
    last = out
    if (out.length <= MAX_OUTPUT_BYTES) return out
  }

  return last
}

export async function GET(req) {
  const reqUrl = req.url
  const parsed = new URL(reqUrl)
  const fallback = `${parsed.origin}${DEFAULT_IMAGE_REL}`

  const requested = normalizeUrl(parsed.searchParams.get('src'), reqUrl)
  const previewKind = normalizePreviewKind(parsed.searchParams.get('kind'))
  const sourceUrl =
    requested && isAllowedSource(requested, reqUrl) ? requested : fallback

  try {
    const input = await fetchImageBuffer(sourceUrl)
    const jpg = await toWaPreviewJpeg(input, { kind: previewKind })
    if (!jpg || !jpg.length) throw new Error('encode_failed')

    return new Response(jpg, {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'content-length': String(jpg.length),
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    try {
      const fallbackInput = await fetchImageBuffer(fallback)
      const fallbackJpg = await toWaPreviewJpeg(fallbackInput, { kind: previewKind })
      if (!fallbackJpg || !fallbackJpg.length) throw new Error('fallback_encode_failed')

      return new Response(fallbackJpg, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(fallbackJpg.length),
          'cache-control': 'public, max-age=600',
          'x-content-type-options': 'nosniff',
        },
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  }
}
