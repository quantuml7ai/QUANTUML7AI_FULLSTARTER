// app/api/forum/upload/route.js
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import crypto from 'node:crypto'

export const runtime = 'nodejs' // sharp требует nodejs-рантайм
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Допустимые типы (расширения/мимы)
const ALLOWED_RE = /\.(webp|png|jpe?g|gif)$/i
const ALLOWED_MIME = /^(image\/webp|image\/png|image\/jpe?g|image\/gif)$/i

// Пределы
const MAX_FILES = 10
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'cache-control': 'no-store, max-age=0' },
  })
}

// простая санитизация имени файла
function sanitizeName(name = 'file') {
  return String(name).trim().replace(/[^\w.\-]+/g, '_').slice(0, 100) || 'file'
}

export async function POST(req) {
  try {
    const form = await req.formData()
    // поддерживаем и 'file', и 'files'
    const files = [
      ...form.getAll('files'),
      ...form.getAll('file'),
    ].filter(Boolean)

    if (!files.length) {
      return json({ urls: [], errors: ['no_files'] })
    }
    if (files.length > MAX_FILES) {
      return json({ urls: [], errors: ['too_many_files'] }, 413)
    }

    const token = process.env.FORUM_READ_WRITE_TOKEN || ''
    if (!token) {
      return json({ urls: [], errors: ['misconfigured_token'] }, 500)
    }

    const urls = []
    const errors = []

    for (const f of files) {
      try {
        // в некоторых окружениях может приехать не File
        if (!f || typeof f.arrayBuffer !== 'function') {
          errors.push('bad_file_object')
          continue
        }

        const origName = sanitizeName(f.name || 'file')
        const okType = ALLOWED_RE.test(origName) || ALLOWED_MIME.test(f.type || '')
        if (!okType) { errors.push(`bad_type:${origName}`); continue }

        const input = Buffer.from(await f.arrayBuffer())

        // 🚫 проверка размера и «пустых» файлов
        if (input.length <= 0) {
          errors.push(`empty:${origName}`)
          continue
        }
        if (input.length > MAX_SIZE_BYTES) {
          errors.push(`too_large:${origName}`)
          continue
        }

        const isGif = /gif$/i.test(f.type || '') || /\.gif$/i.test(origName)

        // Сжатие: GIF оставляем как есть (чтобы не ломать анимацию),
        // остальные преобразуем в webp (rotate по EXIF + resize)
        const outBuf = isGif
          ? input
          : await sharp(input)
              .rotate() // по EXIF
              .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toBuffer()

        const base = origName.replace(/\.\w+$/, '')
        const ext  = isGif ? 'gif' : 'webp'
        const key  = `forum/${base}-${crypto.randomUUID()}.${ext}`

        const { url } = await put(key, outBuf, {
          access: 'public',
          contentType: isGif ? 'image/gif' : 'image/webp',
          token,
          // даём понять CDN/прокси, что файл статичен
          cacheControlMaxAge: 31536000, // 1 год
        })

        urls.push(url)
      } catch (e) {
        console.error('upload_item_failed', e)
        errors.push('upload_item_failed')
      }
    }

    return json({ urls, errors })
  } catch (e) {
    console.error('upload_failed', e)
    return json({ urls: [], errors: ['upload_failed'] }, 500)
  }
}
