import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createWriteStream, promises as fs } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

export const runtime = 'nodejs'

// Разрешаем webm/mp4/mov (iPhone)
const ALLOWED_MIME = /^(video\/webm|video\/mp4|video\/quicktime)$/i
// Лимит 300 МБ
const MAX_SIZE_BYTES = 300 * 1024 * 1024

export async function POST(req) {
  try {
    const form = await req.formData()
    const f = form.get('file')
    if (!f) {
      return NextResponse.json({ urls: [], errors: ['no_file'] }, { status: 400, headers:{'cache-control':'no-store'} })
    }

    const mime = String(f.type || '').toLowerCase()
    if (!ALLOWED_MIME.test(mime)) {
      return NextResponse.json({ urls: [], errors: ['bad_type'] }, { status: 415, headers:{'cache-control':'no-store'} })
    }

    // Быстрый предчек по size, если есть
    if (typeof f.size === 'number' && f.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ urls: [], errors: ['too_large'] }, { status: 413, headers:{'cache-control':'no-store'} })
    }

    // Пишем входящий файл стримом во временный файл (/tmp) — без огромного Buffer в памяти
    const ext = mime.includes('mp4') ? 'mp4' : (mime.includes('quicktime') ? 'mov' : 'webm')
    const tmp = path.join('/tmp', `upload-${Date.now()}.${ext}`)

    // у File есть .stream() в Node 18+; не ставим лимиты на память
    // @ts-ignore
    await pipeline(f.stream(), createWriteStream(tmp))

    // Страховка на финальный размер, если .size отсутствовал/был неверен
    const st = await fs.stat(tmp)
    if (st.size > MAX_SIZE_BYTES) {
      await fs.unlink(tmp).catch(()=>{})
      return NextResponse.json({ urls: [], errors: ['too_large'] }, { status: 413, headers:{'cache-control':'no-store'} })
    }

    // Читаем в память только перед put (у @vercel/blob нужен Buffer/ArrayBuffer/Blob)
    const buf = await fs.readFile(tmp)
    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: mime || 'video/webm',
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    await fs.unlink(tmp).catch(()=>{})

    return NextResponse.json({ urls: [url], errors: [] }, { headers:{'cache-control':'no-store'} })
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
