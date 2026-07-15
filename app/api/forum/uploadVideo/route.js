import { NextResponse } from 'next/server'
import { putR2Object } from '../../../../lib/storage/r2.js'
import { createMediaObjectKey } from '../../../../lib/storage/mediaKeys.js'

export const runtime = 'nodejs'

// webm/mp4 — то, что даёт MediaRecorder и обычные клипы
const ALLOWED_MIME = /^(video\/webm|video\/mp4)$/i
// legacy route: длинные видео должны идти через /api/forum/blobUploadUrl direct R2 PUT
const MAX_SIZE_BYTES = 200 * 1024 * 1024

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

    const contentType = f.type || 'video/webm'
    const ext = contentType.includes('mp4') ? 'mp4' : 'webm'
    const key = createMediaObjectKey({
      prefix: 'forum/videos',
      filename: f.name || `video.${ext}`,
      contentType,
      fallbackName: 'video',
      fallbackExt: ext,
    })

    const { url } = await putR2Object({
      key,
      body: buf,
      contentType,
    })

    return NextResponse.json({ urls: [url], errors: [] }, { headers:{'cache-control':'no-store'} })
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
