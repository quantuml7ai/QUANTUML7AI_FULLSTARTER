 // app/api/forum/upload/route.js

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { isMediaLockedForIdentity } from '../_db.js'
import { putR2Object } from '../../../../lib/storage/r2.js'
import { createAnimatedPosterKey, createMediaObjectKey } from '../../../../lib/storage/mediaKeys.js'
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
    const lock = await isMediaLockedForIdentity(userId)
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

        // Animated GIF keeps its exact source bytes. A deterministic static
        // first-frame sibling is generated before upload so the visual runtime
        // can stop offscreen decoding without changing the canonical source URL.
        let animatedMeta = null
        if (isGif) {
          const gifMeta = await sharp(input, {
            failOn: 'error',
            limitInputPixels: 16000 * 16000,
            animated: true,
          }).metadata()
          const pages = Math.max(1, Number(gifMeta?.pages || 1))
          const pageHeight = Math.max(0, Number(gifMeta?.pageHeight || 0))
          const width = Math.max(0, Number(gifMeta?.width || 0))
          const height = Math.max(0, pageHeight || (pages > 1
            ? Math.floor(Number(gifMeta?.height || 0) / pages)
            : Number(gifMeta?.height || 0)))
          if (pages > 1) {
            const posterBody = await sharp(input, {
              failOn: 'error',
              limitInputPixels: 16000 * 16000,
              page: 0,
            })
              .rotate()
              .webp({ lossless: true, effort: 6, alphaQuality: 100 })
              .toBuffer()
            const posterKey = createAnimatedPosterKey(key)
            if (!posterKey) throw new Error('animated_poster_key_failed')
            animatedMeta = { posterBody, posterKey, pages, width, height }
          }
        }

        const { url } = await putR2Object({
          key,
          body: outBuf,
          contentType,
        })

        let posterUrl = null
        if (animatedMeta) {
          const posterResult = await putR2Object({
            key: animatedMeta.posterKey,
            body: animatedMeta.posterBody,
            contentType: 'image/webp',
          })
          posterUrl = String(posterResult?.url || '').trim() || null
          if (!posterUrl) throw new Error('animated_poster_upload_failed')
        }

        urls.push(url)
        items.push({
          draftId,
          index,
          url,
          animated: !!animatedMeta,
          mime: contentType,
          posterUrl: animatedMeta ? posterUrl : null,
          width: animatedMeta?.width || null,
          height: animatedMeta?.height || null,
          error: null,
        })
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
