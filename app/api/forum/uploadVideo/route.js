import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// webm/mp4/mov — iOS отдаёт video/quicktime (.mov)
const ALLOWED_MIME = /^(video\/webm|video\/mp4|video\/quicktime)$/i
// подними лимит, видео тяжелее (например, 200 МБ)
const MAX_SIZE_BYTES = 200 * 1024 * 1024

export async function POST(req) {
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (!f) {
      return NextResponse.json({ urls: [], errors: ['no_file'] }, { status: 400, headers:{'cache-control':'no-store'} })
    }
    // ... валидации и чтение в buf ...
    // тип/расширение
    const mime = (f.type || '').toLowerCase()
    if (!ALLOWED_MIME.test(mime)) {
      return NextResponse.json({ urls: [], errors: ['unsupported_type'] }, { status: 400, headers:{'cache-control':'no-store'} })
    }
    const ext =
      mime.includes('mp4') ? 'mp4'
    : mime.includes('quicktime') ? 'mov'
    : 'webm'
    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: mime || 'video/webm',
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ urls: [url], errors: [] }, { headers:{'cache-control':'no-store'} })
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
