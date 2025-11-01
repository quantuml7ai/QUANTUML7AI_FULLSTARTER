import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// Разрешаем webm/mp4/mov (iOS отдает video/quicktime = .mov)
const ALLOWED_MIME = /^(video\/webm|video\/mp4|video\/quicktime)$/i
// подними лимит, видео тяжелее (например, 200 МБ)
const MAX_SIZE_BYTES = 200 * 1024 * 1024

// Вспомогалка: определяем расширение по mime/имени файла
function pickExt(mime = '', filename = '') {
  const m = mime.toLowerCase()
  const name = (filename || '').toLowerCase()
  if (m.includes('mp4') || name.endsWith('.mp4')) return 'mp4'
  if (m.includes('quicktime') || name.endsWith('.mov')) return 'mov'
  return 'webm'
}

// Вспомогалка: мягкая проверка типа с фоллбеком по имени файла
function isAllowedType(mime = '', filename = '') {
  if (ALLOWED_MIME.test(mime || '')) return true
  const name = (filename || '').toLowerCase()
  return name.endsWith('.webm') || name.endsWith('.mp4') || name.endsWith('.mov')
}

export async function POST(req) {
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (!f) {
      return NextResponse.json({ urls: [], errors: ['no_file'] }, { status: 400, headers:{'cache-control':'no-store'} })
    }

    const buf = Buffer.from(await f.arrayBuffer())

    // Тип: допускаем video/quicktime (iPhone) и фоллбек по названию файла
    const filename = typeof f.name === 'string' ? f.name : ''
    const mime = (f.type || '').toLowerCase()

    if (!isAllowedType(mime, filename)) {
      return NextResponse.json({ urls: [], errors: ['bad_type'] }, { status: 415, headers:{'cache-control':'no-store'} })
    }
    if (buf.length > MAX_SIZE_BYTES) {
      return NextResponse.json({ urls: [], errors: ['too_large'] }, { status: 413, headers:{'cache-control':'no-store'} })
    }

    const ext = pickExt(mime, filename)
    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: mime || `video/${ext === 'mov' ? 'quicktime' : ext}`, // ставим корректный content-type
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ urls: [url], errors: [] }, { headers:{'cache-control':'no-store'} })
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
