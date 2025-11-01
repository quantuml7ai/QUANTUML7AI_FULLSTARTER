import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

// Разрешённые MIME (iOS часто шлёт video/quicktime для MOV)
const ALLOWED = new Set([
  'video/webm',
  'video/mp4',
  'video/quicktime',   // iOS MOV
  'video/x-m4v',       // иногда встречается
])

// сопоставление mime -> расширение
const MIME_EXT = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
}

// подними лимит, видео тяжелее (например, 200 МБ)
const MAX_SIZE_BYTES = 200 * 1024 * 1024

function inferMimeFromName(name) {
  const n = (name || '').toLowerCase()
  if (n.endsWith('.mp4')) return 'video/mp4'
  if (n.endsWith('.mov')) return 'video/quicktime'
  if (n.endsWith('.m4v')) return 'video/x-m4v'
  if (n.endsWith('.webm')) return 'video/webm'
  return ''
}

// очень простой sniff для MP4/MOV: наличие box 'ftyp' на offset 4
function looksLikeMp4OrMov(buf) {
  try {
    if (buf.length < 12) return false
    // MP4/MOV обычно: [size(4)][type(4)='ftyp'][majorBrand(4)...]
    const tag = buf.subarray(4, 8).toString('utf8')
    return tag === 'ftyp'
  } catch { return false }
}

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

    // имя и тип с клиента
    const origName = typeof f.name === 'string' ? f.name : ''
    let mime = String(f.type || '').toLowerCase()

    // Считываем буфер один раз — понадобится и для размера, и для sniff
    const buf = Buffer.from(await f.arrayBuffer())

    // Если mime пуст/неподдержан, попробуем вывести по имени
    if (!ALLOWED.has(mime)) {
      const fromName = inferMimeFromName(origName)
      if (fromName) mime = fromName
    }

    // Если всё ещё непонятно — попробуем сигнатуру MP4/MOV
    if (!ALLOWED.has(mime) && looksLikeMp4OrMov(buf)) {
      // безопасный дефолт — MP4
      mime = 'video/mp4'
    }

    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { urls: [], errors: ['bad_type'] },
        { status: 415, headers: { 'cache-control': 'no-store' } }
      )
    }

    if (buf.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { urls: [], errors: ['too_large'] },
        { status: 413, headers: { 'cache-control': 'no-store' } }
      )
    }

    // Определим расширение: сперва из имени, затем из MIME
    let ext = inferMimeFromName(origName).replace('video/', '')
    if (!ext) ext = MIME_EXT[mime] || 'mp4'

    const key = `forum/video-${Date.now()}.${ext}`

    const { url } = await put(key, buf, {
      access: 'public',
      contentType: mime,
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json(
      { urls: [url], errors: [] },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (e) {
    console.error('upload_video_failed', e)
    return NextResponse.json(
      { urls: [], errors: ['upload_failed'] },
      { status: 500 },
    )
  }
}
