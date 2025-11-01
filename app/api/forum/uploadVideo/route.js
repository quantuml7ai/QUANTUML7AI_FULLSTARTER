// app/api/forum/uploadVideo/route.js  (или твой путь к роуту)
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// iOS Safari пишет video/quicktime (MOV). Разрешим его и типичные варианты.
const ALLOWED_MIME = /^video\//i
// Лимит оставляем как был: 200 МБ
const MAX_SIZE_BYTES = 200 * 1024 * 1024

export async function POST(req) {
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (!f) {
      return NextResponse.json(
        { urls: [], errors: ['no_file'] },
        { status: 400, headers: { 'cache-control': 'no-store' } }
      )
    }

    const type = String(f.type || '').toLowerCase()
    const buf = Buffer.from(await f.arrayBuffer())

    if (!ALLOWED_MIME.test(type)) {
      // На некоторых iOS тип может прийти пустым — подстрахуемся простым эвристическим допуском:
      // если MIME пустой, но файл не пустой, попробуем всё равно принять.
      if (!type && buf.length > 0) {
        // ok, пропустим как видео «по умолчанию»
      } else {
        return NextResponse.json(
          { urls: [], errors: ['bad_type', type] },
          { status: 415, headers: { 'cache-control': 'no-store' } }
        )
      }
    }

    if (buf.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { urls: [], errors: ['too_large'] },
        { status: 413, headers: { 'cache-control': 'no-store' } }
      )
    }

    // Подберём расширение
    let ext = 'webm'
    if (type.includes('mp4'))      ext = 'mp4'
    else if (type.includes('quicktime')) ext = 'mov'   // iOS Safari
    else if (type.includes('x-m4v'))    ext = 'm4v'
    // если type пустой, оставим webm по умолчанию; можно попытаться sniff-нуть, но это уже избыточно

    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: type || 'video/mp4', // дефолт пусть будет mp4
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json(
      { urls: [url], errors: [] },
      { headers: { 'cache-control': 'no-store' } }
    )
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json(
      { urls: [], errors: ['upload_failed'] },
      { status: 500 }
    )
  }
}
