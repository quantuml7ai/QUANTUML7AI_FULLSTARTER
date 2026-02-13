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

async function toWaPreviewJpeg(inputBuffer) {
  let last = null

  for (const quality of QUALITY_STEPS) {
    const out = await sharp(inputBuffer, { failOn: 'none' })
      .rotate()
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: '4:2:0',
      })
      .toBuffer()

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
  const sourceUrl =
    requested && isAllowedSource(requested, reqUrl) ? requested : fallback

  try {
    const input = await fetchImageBuffer(sourceUrl)
    const jpg = await toWaPreviewJpeg(input)
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
      const fallbackJpg = await toWaPreviewJpeg(fallbackInput)
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
