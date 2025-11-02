import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// webm/mp4 — то, что даёт MediaRecorder и обычные клипы
const ALLOWED_MIME = /^(video\/webm|video\/mp4)$/i
// подними лимит, видео тяжелее (например, 200 МБ)
const MAX_SIZE_BYTES = 300000 * 1024 * 1024

export async function POST(req) {
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (!f) {
      return NextResponse.json({ urls: [], errors: ['no_file'] }, { status: 400, headers:{'cache-control':'no-store'} })
    }

    const buf = Buffer.from(await f.arrayBuffer())
    if (!ALLOWED_MIME.test(f.type || '')) {
      return NextResponse.json({ urls: [], errors: ['bad_type'] }, { status: 415, headers:{'cache-control':'no-store'} })
    }
    if (buf.length > MAX_SIZE_BYTES) {
      return NextResponse.json({ urls: [], errors: ['too_large'] }, { status: 413, headers:{'cache-control':'no-store'} })
    }

    const ext = (f.type||'video/webm').includes('mp4') ? 'mp4' : 'webm'
    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: f.type || 'video/webm',
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ urls: [url], errors: [] }, { headers:{'cache-control':'no-store'} })
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
