// app/api/forum/og-image/route.js
// Converts remote images (mostly Vercel Blob .webp) into a social-preview-friendly format.

import { NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_BYTES = 12 * 1024 * 1024

function isAllowedHost(hostname) {
  const h = String(hostname || '').toLowerCase()
  return h.endsWith('public.blob.vercel-storage.com') || h.endsWith('blob.vercel-storage.com')
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const src = String(searchParams.get('src') || '').trim()
    if (!src) {
      return NextResponse.json({ ok: false, error: 'missing_src' }, { status: 400 })
    }

    let u
    try {
      u = new URL(src)
    } catch {
      return NextResponse.json({ ok: false, error: 'bad_src' }, { status: 400 })
    }

    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return NextResponse.json({ ok: false, error: 'bad_protocol' }, { status: 400 })
    }

    if (!isAllowedHost(u.hostname)) {
      return NextResponse.json({ ok: false, error: 'host_not_allowed' }, { status: 403 })
    }

    const r = await fetch(u.toString(), { cache: 'no-store', redirect: 'follow' })
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 502 })
    }

    const ct = String(r.headers.get('content-type') || '').toLowerCase()
    if (!ct.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: 'not_image' }, { status: 415 })
    }

    const ab = await r.arrayBuffer()
    const buf = Buffer.from(ab)
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })
    }

    // Keep GIF as-is (animation). Everything else -> JPEG for maximum OG compatibility.
    if (ct.includes('image/gif')) {
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'content-type': 'image/gif',
          'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        },
      })
    }

    const out = await sharp(buf).rotate().jpeg({ quality: 86, mozjpeg: true }).toBuffer()

    return new NextResponse(out, {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

