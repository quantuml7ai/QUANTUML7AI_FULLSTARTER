 // app/api/forum/upload/route.js

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { isMediaLocked } from '../_db.js'
import { putR2Object } from '../../../../lib/storage/r2.js'
import { createMediaObjectKey } from '../../../../lib/storage/mediaKeys.js'
import { FORUM_IMAGE_MAX_BYTES } from '../../../forum/shared/constants/media.js'
export const runtime = 'nodejs' // нужен nodejs-рантайм

// Допустимые типы (расширения/мимы)
const ALLOWED_RE = /\.(webp|png|jpe?g|gif)$/i
const ALLOWED_MIME = /^(image\/webp|image\/png|image\/jpe?g|image\/gif)$/i

// Пределы
const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = FORUM_IMAGE_MAX_BYTES
const MAX_TOTAL_SIZE_BYTES = FORUM_IMAGE_MAX_BYTES

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
    const totalSize = files.reduce((sum, file) => sum + Math.max(0, Number(file?.size || 0)), 0)
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json(
        { urls: [], errors: ['too_large_total'], limitBytes: MAX_TOTAL_SIZE_BYTES },
        { status: 413, headers: { 'cache-control': 'no-store' } },
      )
    }

    const draftIds = form.getAll('draftIds').map((value) => String(value || ''))
    const urls = []
    const errors = []
    const items = []

    for (let index = 0; index < files.length; index += 1) {
      const f = files[index]
      const draftId = draftIds[index] || String(index)
      try {
        const origName = (f.name || 'file').trim().replace(/\s+/g, '_')
        const okType = ALLOWED_RE.test(origName) || ALLOWED_MIME.test(f.type || '')
        if (!okType) {
          const error = `bad_type:${origName}`
          errors.push(error)
          items.push({ draftId, index, url: null, error })
          continue
        }

        const input = Buffer.from(await f.arrayBuffer())

        // 🚫 проверка размера
        if (input.length > MAX_FILE_SIZE_BYTES) {
          const error = `too_large:${origName}`
          errors.push(error)
          items.push({ draftId, index, url: null, error })
          continue
        }

        const isGif = /gif$/i.test(f.type || '') || /\.gif$/i.test(origName)

        // Сжатие: GIF оставляем как есть (чтобы не ломать анимацию),
        // остальные преобразуем в webp (rotate по EXIF + resize)
        const outBuf = isGif
          ? input
          : await sharp(input, { failOn: 'none', limitInputPixels: 16000 * 16000 })
              .rotate() // по EXIF
              .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toBuffer()

        const contentType = isGif ? 'image/gif' : 'image/webp'
        const key = createMediaObjectKey({
          prefix: 'forum/images',
          filename: origName,
          contentType,
          fallbackName: 'forum-image',
          fallbackExt: isGif ? 'gif' : 'webp',
        })

        const { url } = await putR2Object({
          key,
          body: outBuf,
          contentType,
        })

        urls.push(url)
        items.push({ draftId, index, url, error: null })
      } catch (e) {
        console.error('upload_item_failed', e)
        errors.push('upload_item_failed')
        items.push({ draftId, index, url: null, error: 'upload_item_failed' })
      }
    }

    const failedTooLarge = errors.some((error) => String(error || '').startsWith('too_large'))
    const status = urls.length ? 200 : (failedTooLarge ? 413 : (errors.length ? 422 : 200))
    return NextResponse.json(
      { urls, errors, items, limitBytes: MAX_TOTAL_SIZE_BYTES },
      { status, headers: { 'cache-control': 'no-store' } },
    )
  } catch (e) {
    console.error('upload_failed', e)
    return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
  }
}
