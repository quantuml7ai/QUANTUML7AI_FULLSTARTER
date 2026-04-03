 // app/api/forum/upload/route.js 

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { isMediaLocked } from '../_db.js'
export const runtime = 'nodejs' // нужен nodejs-рантайм

// Допустимые типы (расширения/мимы)
const ALLOWED_RE = /\.(webp|png|jpe?g|gif)$/i
const ALLOWED_MIME = /^(image\/webp|image\/png|image\/jpe?g|image\/gif)$/i

// Пределы
const MAX_FILES = 10
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req) {
  try {
    const form = await req.formData()
    const headerId = req.headers.get('x-forum-user-id')
    const formId = form.get('userId') || form.get('accountId') || form.get('asherId')
    const userId = String(headerId || formId || '').trim()
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401, headers: { 'cache-control': 'no-store' } })
    }
    const lock = await isMediaLocked(userId)
    if (lock.locked) {
      return NextResponse.json({ ok: false, error: 'media_locked', untilMs: lock.untilMs }, { status: 403, headers: { 'cache-control': 'no-store' } })
    }    
    // поддерживаем и 'file', и 'files'
    const files = [
      ...form.getAll('files'),
      ...form.getAll('file'),
    ].filter(Boolean)

    if (!files.length) {
      return NextResponse.json({ urls: [], errors: ['no_files'] }, { headers: { 'cache-control': 'no-store' } })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ urls: [], errors: ['too_many_files'] }, { status: 413, headers: { 'cache-control': 'no-store' } })
    }

    const urls = []
    const errors = []

    for (const f of files) {
      try {
        const origName = (f.name || 'file').trim().replace(/\s+/g, '_')
        const okType = ALLOWED_RE.test(origName) || ALLOWED_MIME.test(f.type || '')
        if (!okType) { errors.push(`bad_type:${origName}`); continue }

        const input = Buffer.from(await f.arrayBuffer())

        // 🚫 проверка размера
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
        const key  = `forum/${base}-${Date.now()}.${ext}`

        // Токен берём из ENV (одинаково работает локально и на Vercel)
        const { url } = await put(key, outBuf, {
          access: 'public',
          contentType: isGif ? 'image/gif' : 'image/webp',
          token: process.env.FORUM_READ_WRITE_TOKEN,
        })

        urls.push(url)
      } catch (e) {
        console.error('upload_item_failed', e)
        errors.push('upload_item_failed')
      }
    }

    return NextResponse.json(
      { urls, errors },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (e) {
    console.error('upload_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
